"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { useAccount } from "wagmi";
import { padrinhoFactoryAbi, padrinhoVaultAbi, getAddresses, MONAD_TESTNET_ID } from "@/lib/contracts";
import type { ObjectiveData, WithdrawalRequest } from "@/hooks/useObjective";

const FIELDS = 9;

export function useAfilhadoDashboard() {
  const { address, chain } = useAccount();
  const chainId = chain?.id ?? MONAD_TESTNET_ID;
  const { factory } = getAddresses(chainId);

  // 1. Vault addresses for the connected afilhado
  const { data: vaultAddresses, isLoading: loadingList } = useReadContract({
    address: factory,
    abi: padrinhoFactoryAbi,
    functionName: "getObjectivesByAfilhado",
    args: [address!],
    query: { enabled: !!address },
  });

  const vaults = useMemo(
    () => (vaultAddresses as `0x${string}`[] | undefined) ?? [],
    [vaultAddresses],
  );

  // 2. Stable multicall array — only recomputed when vault list changes
  const calls = useMemo(
    () =>
      vaults.flatMap((addr) => [
        { address: addr, abi: padrinhoVaultAbi, functionName: "objectiveName" as const },
        { address: addr, abi: padrinhoVaultAbi, functionName: "afilhado" as const },
        { address: addr, abi: padrinhoVaultAbi, functionName: "padrinho" as const },
        { address: addr, abi: padrinhoVaultAbi, functionName: "pendingPadrinho" as const },
        { address: addr, abi: padrinhoVaultAbi, functionName: "targetAmount" as const },
        { address: addr, abi: padrinhoVaultAbi, functionName: "totalAssets" as const },
        { address: addr, abi: padrinhoVaultAbi, functionName: "status" as const },
        { address: addr, abi: padrinhoVaultAbi, functionName: "padrinhoStatus" as const },
        { address: addr, abi: padrinhoVaultAbi, functionName: "withdrawalRequest" as const },
      ]),
    [vaults],
  );

  const { data: rawData, isLoading: loadingVaults, refetch } = useReadContracts({
    contracts: calls,
    query: { enabled: vaults.length > 0 },
  });

  console.log("rawData", rawData);

  // Map results — most recent vault first (factory appends, so reverse)
  const objectives: ObjectiveData[] = useMemo(() => {
    const d = rawData ?? [];
    return vaults
      .map((addr, i) => {
        const base = i * FIELDS;
        return {
          address: addr,
          name: (d[base]?.result as string) ?? "",
          afilhado: (d[base + 1]?.result as `0x${string}`) ?? "0x",
          padrinho: (d[base + 2]?.result as `0x${string}`) ?? "0x",
          pendingPadrinho: (d[base + 3]?.result as `0x${string}`) ?? "0x",
          targetAmount: (d[base + 4]?.result as bigint) ?? 0n,
          totalAssets: (d[base + 5]?.result as bigint) ?? 0n,
          status: Number(d[base + 6]?.result ?? 0),
          padrinhoStatus: Number(d[base + 7]?.result ?? 0),
          withdrawalRequest: (d[base + 8]?.result as WithdrawalRequest) ?? {
            amount: 0n,
            message: "",
            exists: false,
          },
        };
      })
      .reverse(); // most recent first
  }, [vaults, rawData]);

  return {
    objectives,
    isLoading: loadingList || loadingVaults,
    refetch,
  };
}
