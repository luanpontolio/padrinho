"use client";

import { useCallback, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useSwitchChain } from "wagmi";
import { padrinhoFactoryAbi, getAddresses, MONAD_TESTNET_ID } from "@/lib/contracts";
import type { TxStatus } from "@/app/components/TransactionStatus";

export interface CreateObjectiveParams {
  name: string;
  targetAmount: bigint; // USDC 6 decimals
  padrinhoHint?: `0x${string}`; // address(0) if omitted
}

export interface UseCreateObjectiveResult {
  write: (params: CreateObjectiveParams) => void;
  status: TxStatus;
  txHash: `0x${string}` | undefined;
  error: string | undefined;
  reset: () => void;
}

export function useCreateObjective(): UseCreateObjectiveResult {
  const { chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState<string | undefined>();

  const { writeContract, data: txHash, reset: resetWrite } = useWriteContract();

  const { isSuccess, isError } = useWaitForTransactionReceipt({ hash: txHash });

  // Sync confirmed / failed states
  if (txHash && status === "submitted" && isSuccess) setStatus("confirmed");
  if (txHash && status === "submitted" && isError) {
    setStatus("failed");
    setError("Transaction reverted on-chain. (CONTRACT)");
  }

  const write = useCallback(
    async ({ name, targetAmount, padrinhoHint }: CreateObjectiveParams) => {
      setError(undefined);
      setStatus("signing");

      try {
        if (chain?.id !== MONAD_TESTNET_ID) {
          await switchChainAsync({ chainId: MONAD_TESTNET_ID });
        }
      } catch {
        setStatus("failed");
        setError("Could not switch to Monad Testnet. (USER)");
        return;
      }

      const { factory } = getAddresses(MONAD_TESTNET_ID);

      writeContract(
        {
          address: factory,
          abi: padrinhoFactoryAbi,
          functionName: "createObjective",
          args: [name, targetAmount, padrinhoHint ?? "0x0000000000000000000000000000000000000000"],
          chainId: MONAD_TESTNET_ID,
        },
        {
          onSuccess: () => setStatus("submitted"),
          onError: (err) => {
            setStatus("failed");
            const msg = err.message.toLowerCase();
            if (msg.includes("user rejected") || msg.includes("denied")) {
              setError("Signature rejected. (USER)");
            } else if (msg.includes("network") || msg.includes("rpc")) {
              setError("Network error — please retry. (NETWORK)");
            } else {
              setError(err.message.slice(0, 120));
            }
          },
        },
      );
    },
    [chain?.id, switchChainAsync, writeContract],
  );

  const reset = useCallback(() => {
    resetWrite();
    setStatus("idle");
    setError(undefined);
  }, [resetWrite]);

  return { write, status, txHash, error, reset };
}
