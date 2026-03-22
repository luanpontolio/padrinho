import type { Abi } from "viem";
import PadrinhoVaultArtifact from "@/lib/abis/PadrinhoVault.json";
import PadrinhoFactoryArtifact from "@/lib/abis/PadrinhoFactory.json";
import MockUSDCArtifact from "@/lib/abis/MockUSDC.json";

// -----------------------------------------------------------------------
// ABIs — cast to viem's Abi so wagmi hooks accept them without widening issues
// -----------------------------------------------------------------------

export const padrinhoVaultAbi = PadrinhoVaultArtifact.abi as Abi;
export const padrinhoFactoryAbi = PadrinhoFactoryArtifact.abi as Abi;
export const mockUsdcAbi = MockUSDCArtifact.abi as Abi;

// -----------------------------------------------------------------------
// Chain IDs
// -----------------------------------------------------------------------

export const MONAD_TESTNET_ID = 10143 as const;

// -----------------------------------------------------------------------
// Addresses keyed by chainId
// -----------------------------------------------------------------------

type AddressMap = {
  factory: `0x${string}`;
  mockUsdc: `0x${string}`;
};

const addresses: Record<number, AddressMap> = {
  [MONAD_TESTNET_ID]: {
    factory: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "0x") as `0x${string}`,
    mockUsdc: (process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS ?? "0x") as `0x${string}`,
  },
};

export function getAddresses(chainId: number): AddressMap {
  const map = addresses[chainId];
  console.log("map", map);
  if (!map) throw new Error(`No contract addresses configured for chainId ${chainId}`);
  return map;
}
