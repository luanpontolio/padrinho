"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { useAccount } from "wagmi";
import { padrinhoFactoryAbi, padrinhoVaultAbi, getAddresses, MONAD_TESTNET_ID } from "@/lib/contracts";
import type { ObjectiveData, WithdrawalRequest } from "@/hooks/useObjective";

export function useAfilhadoDashboard() {
  const { address, chain } = useAccount();
  const chainId = chain?.id ?? MONAD_TESTNET_ID;
  const { factory } = getAddresses(chainId);

  // 1. Fetch the list of vault addresses for the connected afilhado
  const { data: vaultAddresses, isLoading: loadingList } = useReadContract({
    address: factory,
    abi: padrinhoFactoryAbi,
    functionName: "getObjectivesByAfilhado",
    args: [address!],
    query: { enabled: !!address },
  });

  const vaults = (vaultAddresses as `0x${string}`[] | undefined) ?? [];

  // 2. Multicall: read all vault states in a single RPC round-trip
  const vaultContract = (addr: `0x${string}`) =>
    ({ address: addr, abi: padrinhoVaultAbi }) as const;

  const calls = vaults.flatMap((addr) => [
    { ...vaultContract(addr), functionName: "objectiveName" as const },
    { ...vaultContract(addr), functionName: "afilhado" as const },
    { ...vaultContract(addr), functionName: "padrinho" as const },
    { ...vaultContract(addr), functionName: "pendingPadrinho" as const },
    { ...vaultContract(addr), functionName: "targetAmount" as const },
    { ...vaultContract(addr), functionName: "totalAssets" as const },
    { ...vaultContract(addr), functionName: "status" as const },
    { ...vaultContract(addr), functionName: "padrinhoStatus" as const },
    { ...vaultContract(addr), functionName: "withdrawalRequest" as const },
  ]);

  const FIELDS = 9;

  const { data: rawData, isLoading: loadingVaults, refetch } = useReadContracts({
    contracts: calls,
    query: { enabled: vaults.length > 0 },
  });

  const objectives: ObjectiveData[] = vaults.map((addr, i) => {
    const base = i * FIELDS;
    const d = rawData ?? [];
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
  });

  return {
    objectives,
    isLoading: loadingList || loadingVaults,
    refetch,
  };
}
