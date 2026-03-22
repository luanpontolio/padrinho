"use client";

import { useReadContracts } from "wagmi";
import { padrinhoVaultAbi } from "@/lib/contracts";

// Enum values match PadrinhoVault.sol
export const VaultStatus = { Active: 0, Completed: 1 } as const;
export const PadrinhoStatus = { None: 0, Pending: 1, Active: 2 } as const;

export interface WithdrawalRequest {
  amount: bigint;
  message: string;
  exists: boolean;
}

export interface ObjectiveData {
  address: `0x${string}`;
  name: string;
  afilhado: `0x${string}`;
  padrinho: `0x${string}`;
  pendingPadrinho: `0x${string}`;
  targetAmount: bigint;
  totalAssets: bigint;
  status: number;
  padrinhoStatus: number;
  withdrawalRequest: WithdrawalRequest;
}

export function useObjective(vaultAddress: `0x${string}` | undefined) {
  const contract = {
    address: vaultAddress!,
    abi: padrinhoVaultAbi,
  } as const;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      { ...contract, functionName: "objectiveName" },
      { ...contract, functionName: "afilhado" },
      { ...contract, functionName: "padrinho" },
      { ...contract, functionName: "pendingPadrinho" },
      { ...contract, functionName: "targetAmount" },
      { ...contract, functionName: "totalAssets" },
      { ...contract, functionName: "status" },
      { ...contract, functionName: "padrinhoStatus" },
      { ...contract, functionName: "withdrawalRequest" },
    ],
    query: { enabled: !!vaultAddress },
  });

  const objective: ObjectiveData | undefined =
    data && vaultAddress
      ? {
          address: vaultAddress,
          name: (data[0].result as string) ?? "",
          afilhado: (data[1].result as `0x${string}`) ?? "0x",
          padrinho: (data[2].result as `0x${string}`) ?? "0x",
          pendingPadrinho: (data[3].result as `0x${string}`) ?? "0x",
          targetAmount: (data[4].result as bigint) ?? 0n,
          totalAssets: (data[5].result as bigint) ?? 0n,
          status: Number(data[6].result ?? 0),
          padrinhoStatus: Number(data[7].result ?? 0),
          withdrawalRequest: (data[8].result as WithdrawalRequest) ?? {
            amount: 0n,
            message: "",
            exists: false,
          },
        }
      : undefined;

  return { objective, isLoading, refetch };
}
