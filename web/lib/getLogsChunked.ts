import type { PublicClient, Log } from "viem";

const CHUNK_SIZE = 100n;
const RETRY_DELAY_MS = 1000;
const INTER_CHUNK_DELAY_MS = 80; // ~12 req/s — under the 15/s limit

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches ALL logs from `address` across a block range, chunking in windows of
 * 100 blocks (Monad Testnet's eth_getLogs limit). Retries once on 429.
 *
 * @param lookback  How many blocks back from `currentBlock` to start. Default 5 000
 *                  (~33 min at Monad's 400 ms blocks). Increase for older vaults.
 */
export async function getLogsChunked(
  client: PublicClient,
  address: `0x${string}`,
  lookback = 5_000,
): Promise<Log[]> {
  const currentBlock = await client.getBlockNumber();
  const fromBlock = BigInt(Math.max(0, Number(currentBlock) - lookback));

  const all: Log[] = [];

  for (let from = fromBlock; from <= currentBlock; from += CHUNK_SIZE) {
    const to =
      from + CHUNK_SIZE - 1n > currentBlock ? currentBlock : from + CHUNK_SIZE - 1n;

    let retries = 0;
    while (retries <= 1) {
      try {
        const logs = await client.getLogs({ address, fromBlock: from, toBlock: to });
        all.push(...logs);
        break;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("429") || msg.includes("limited") || msg.includes("rate")) {
          if (retries === 0) {
            await sleep(RETRY_DELAY_MS);
            retries++;
            continue;
          }
        }
        // Non-rate-limit error or second failure — skip this chunk
        console.warn(`getLogsChunked: chunk ${from}-${to} failed`, err);
        break;
      }
    }

    // Pace requests so we stay under the rate limit
    if (from + CHUNK_SIZE <= currentBlock) {
      await sleep(INTER_CHUNK_DELAY_MS);
    }
  }

  return all;
}
