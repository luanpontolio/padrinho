"use client";

import { useCallback, useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useSwitchChain } from "wagmi";
import { padrinhoVaultAbi, MONAD_TESTNET_ID } from "@/lib/contracts";
import type { TxStatus } from "@/app/components/TransactionStatus";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface UseWithdrawalRequestResult {
  withdrawGoal: () => void;
  requestWithdrawal: (amount: bigint, message: string) => void;
  status: TxStatus;
  txHash: `0x${string}` | undefined;
  error: string | undefined;
  reset: () => void;
}

// -----------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------

export function useWithdrawalRequest(vaultAddress: `0x${string}`): UseWithdrawalRequestResult {
  const { chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState<string | undefined>();

  const { writeContract, data: txHash, reset: resetWrite } = useWriteContract();

  const { isSuccess, isError } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (txHash && status === "submitted" && isSuccess) setStatus("confirmed");
  }, [isSuccess, txHash, status]);

  useEffect(() => {
    if (txHash && status === "submitted" && isError) {
      setStatus("failed");
      setError("Transaction reverted on-chain. (CONTRACT)");
    }
  }, [isError, txHash, status]);

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  async function ensureChain(): Promise<boolean> {
    if (chain?.id !== MONAD_TESTNET_ID) {
      try {
        await switchChainAsync({ chainId: MONAD_TESTNET_ID });
      } catch {
        setStatus("failed");
        setError("Could not switch to Monad Testnet. (USER)");
        return false;
      }
    }
    return true;
  }

  function handleError(err: Error) {
    setStatus("failed");
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
  // withdrawGoal — afilhado withdraws full balance when goal is reached
  // -----------------------------------------------------------------------

  const withdrawGoal = useCallback(async () => {
    setError(undefined);
    if (!(await ensureChain())) return;
    setStatus("signing");
    writeContract(
      {
        address: vaultAddress,
        abi: padrinhoVaultAbi,
        functionName: "withdrawGoal",
        chainId: MONAD_TESTNET_ID,
      },
      {
        onSuccess: () => setStatus("submitted"),
        onError: handleError,
      },
    );
  }, [chain?.id, vaultAddress, switchChainAsync, writeContract]); // eslint-disable-line

  // -----------------------------------------------------------------------
  // requestWithdrawal — early withdrawal with optional padrinho gate
  // -----------------------------------------------------------------------

  const requestWithdrawal = useCallback(
    async (amount: bigint, message: string) => {
      setError(undefined);
      if (!(await ensureChain())) return;
      setStatus("signing");
      writeContract(
        {
          address: vaultAddress,
          abi: padrinhoVaultAbi,
          functionName: "requestWithdrawal",
          args: [amount, message],
          chainId: MONAD_TESTNET_ID,
        },
        {
          onSuccess: () => setStatus("submitted"),
          onError: handleError,
        },
      );
    },
    [chain?.id, vaultAddress, switchChainAsync, writeContract], // eslint-disable-line
  );

  const reset = useCallback(() => {
    resetWrite();
    setStatus("idle");
    setError(undefined);
  }, [resetWrite]);

  return { withdrawGoal, requestWithdrawal, status, txHash, error, reset };
}
