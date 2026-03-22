"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useAccount,
  useSwitchChain,
} from "wagmi";
import { padrinhoVaultAbi, mockUsdcAbi, getAddresses, MONAD_TESTNET_ID } from "@/lib/contracts";
import type { TxStatus } from "@/app/components/TransactionStatus";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export type DepositStep = "idle" | "approving" | "depositing" | "done" | "failed";

export interface UseDepositResult {
  usdcBalance: bigint;
  allowance: bigint;
  deposit: (amount: bigint) => void;
  step: DepositStep;
  approveTxHash: `0x${string}` | undefined;
  depositTxHash: `0x${string}` | undefined;
  status: TxStatus;
  error: string | undefined;
  reset: () => void;
}

// -----------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------

export function useDeposit(vaultAddress: `0x${string}`): UseDepositResult {
  const { address, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { mockUsdc } = getAddresses(MONAD_TESTNET_ID);

  const [step, setStep] = useState<DepositStep>("idle");
  const [error, setError] = useState<string | undefined>();

  // Keep pending deposit amount across the approve→deposit transition
  const pendingAmount = useRef<bigint | null>(null);

  const { writeContract: writeApprove, data: approveTxHash, reset: resetApprove } = useWriteContract();
  const { writeContract: writeDeposit, data: depositTxHash, reset: resetDeposit } = useWriteContract();

  // USDC balance + allowance reads
  const { data: rawBalance } = useReadContract({
    address: mockUsdc,
    abi: mockUsdcAbi,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: rawAllowance } = useReadContract({
    address: mockUsdc,
    abi: mockUsdcAbi,
    functionName: "allowance",
    args: [address!, vaultAddress],
    query: { enabled: !!address },
  });

  // Wait for approve tx confirmation
  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({ hash: approveTxHash });

  // Wait for deposit tx confirmation
  const { isSuccess: depositConfirmed, isError: depositReverted } = useWaitForTransactionReceipt({
    hash: depositTxHash,
  });

  // After approval confirmed → trigger deposit
  useEffect(() => {
    if (step === "approving" && approveConfirmed && pendingAmount.current !== null) {
      const amount = pendingAmount.current;
      setStep("depositing");
      writeDeposit(
        {
          address: vaultAddress,
          abi: padrinhoVaultAbi,
          functionName: "deposit",
          args: [amount, address!],
          chainId: MONAD_TESTNET_ID,
        },
        { onError: handleError },
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveConfirmed, step]);

  // Deposit outcome
  useEffect(() => {
    if (step === "depositing" && depositConfirmed) setStep("done");
  }, [depositConfirmed, step]);

  useEffect(() => {
    if (step === "depositing" && depositReverted) {
      setStep("failed");
      setError("Deposit reverted on-chain. (CONTRACT)");
    }
  }, [depositReverted, step]);

  // -----------------------------------------------------------------------
  // Error helper
  // -----------------------------------------------------------------------

  function handleError(err: Error) {
    setStep("failed");
    const msg = err.message.toLowerCase();
    if (msg.includes("user rejected") || msg.includes("denied")) {
      setError("Signature rejected. (USER)");
    } else if (msg.includes("network") || msg.includes("rpc")) {
      setError("Network error — please retry. (NETWORK)");
    } else {
      setError(err.message.slice(0, 120) + " (CONTRACT)");
    }
  }

  // -----------------------------------------------------------------------
  // Main entry point
  // -----------------------------------------------------------------------

  const deposit = useCallback(
    async (amount: bigint) => {
      setError(undefined);
      pendingAmount.current = amount;

      if (chain?.id !== MONAD_TESTNET_ID) {
        try {
          await switchChainAsync({ chainId: MONAD_TESTNET_ID });
        } catch {
          setStep("failed");
          setError("Could not switch to Monad Testnet. (USER)");
          return;
        }
      }

      const currentAllowance = (rawAllowance as bigint | undefined) ?? 0n;

      if (currentAllowance < amount) {
        setStep("approving");
        writeApprove(
          {
            address: mockUsdc,
            abi: mockUsdcAbi,
            functionName: "approve",
            args: [vaultAddress, amount],
            chainId: MONAD_TESTNET_ID,
          },
          { onError: handleError },
        );
      } else {
        setStep("depositing");
        writeDeposit(
          {
            address: vaultAddress,
            abi: padrinhoVaultAbi,
            functionName: "deposit",
            args: [amount, address!],
            chainId: MONAD_TESTNET_ID,
          },
          { onError: handleError },
        );
      }
    },
    [chain?.id, switchChainAsync, rawAllowance, vaultAddress, mockUsdc, address, writeApprove, writeDeposit], // eslint-disable-line
  );

  const reset = useCallback(() => {
    resetApprove();
    resetDeposit();
    setStep("idle");
    setError(undefined);
    pendingAmount.current = null;
  }, [resetApprove, resetDeposit]);

  // -----------------------------------------------------------------------
  // Derived TxStatus
  // -----------------------------------------------------------------------

  const status: TxStatus = (() => {
    if (step === "idle") return "idle";
    if (step === "approving" && !approveTxHash) return "signing";
    if (step === "approving" && approveTxHash) return "submitted";
    if (step === "depositing" && !depositTxHash) return "signing";
    if (step === "depositing" && depositTxHash) return "submitted";
    if (step === "done") return "confirmed";
    if (step === "failed") return "failed";
    return "idle";
  })();

  return {
    usdcBalance: (rawBalance as bigint | undefined) ?? 0n,
    allowance: (rawAllowance as bigint | undefined) ?? 0n,
    deposit,
    step,
    approveTxHash,
    depositTxHash,
    status,
    error,
    reset,
  };
}
