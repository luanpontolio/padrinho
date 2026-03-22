"use client";

import { useCallback, useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useSwitchChain } from "wagmi";
import { padrinhoVaultAbi, MONAD_TESTNET_ID } from "@/lib/contracts";
import type { TxStatus } from "@/app/components/TransactionStatus";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface UsePadrinhoActionsResult {
  acceptInvite: () => void;
  approveWithdrawal: (responseMessage: string) => void;
  denyWithdrawal: (responseMessage: string) => void;
  status: TxStatus;
  txHash: `0x${string}` | undefined;
  error: string | undefined;
  reset: () => void;
}

// -----------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------

export function usePadrinhoActions(vaultAddress: `0x${string}`): UsePadrinhoActionsResult {
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

  function send(functionName: string, args?: readonly unknown[]) {
    setStatus("signing");
    writeContract(
      {
        address: vaultAddress,
        abi: padrinhoVaultAbi,
        functionName,
        ...(args ? { args } : {}),
        chainId: MONAD_TESTNET_ID,
      },
      {
        onSuccess: () => setStatus("submitted"),
        onError: handleError,
      },
    );
  }

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const acceptInvite = useCallback(async () => {
    setError(undefined);
    if (!(await ensureChain())) return;
    send("acceptInvite");
  }, [chain?.id, vaultAddress, switchChainAsync, writeContract]); // eslint-disable-line

  const approveWithdrawal = useCallback(
    async (responseMessage: string) => {
      setError(undefined);
      if (!(await ensureChain())) return;
      send("approveWithdrawal", [responseMessage]);
    },
    [chain?.id, vaultAddress, switchChainAsync, writeContract], // eslint-disable-line
  );

  const denyWithdrawal = useCallback(
    async (responseMessage: string) => {
      setError(undefined);
      if (!(await ensureChain())) return;
      send("denyWithdrawal", [responseMessage]);
    },
    [chain?.id, vaultAddress, switchChainAsync, writeContract], // eslint-disable-line
  );

  const reset = useCallback(() => {
    resetWrite();
    setStatus("idle");
    setError(undefined);
  }, [resetWrite]);

  return { acceptInvite, approveWithdrawal, denyWithdrawal, status, txHash, error, reset };
}
