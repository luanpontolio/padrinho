import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
  contracts: {
    // Standard Multicall3 address — deployed on all major EVM chains including Monad Testnet.
    // Without this, wagmi falls back to one eth_call per function → 429 rate limit errors.
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http("https://testnet-rpc.monad.xyz"),
  },
  // Multicall3 bundles all reads into a single eth_call — critical for
  // Monad Testnet's 15 req/s rate limit.
  batch: {
    multicall: {
      batchSize: 1024,
      wait: 16, // ms — collect calls within the same tick before sending
    },
  },
});
