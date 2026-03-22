"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { decodeEventLog } from "viem";
import { MONAD_TESTNET_ID } from "@/lib/contracts";
import { getLogsChunked } from "@/lib/getLogsChunked";
import {
  EV_DEPOSITED,
  EV_WITHDRAWAL_REQUESTED,
  EV_WITHDRAWAL_DENIED,
  EV_GOAL_WITHDRAWN,
} from "@/lib/vaultEvents";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface ObjectiveStats {
  totalWithdrawn: bigint;
  depositCount: number;
  requestCount: number;
  deniedCount: number;
}

// -----------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------

export function useObjectiveStats(
  vaultAddress: `0x${string}` | undefined,
  enabled: boolean,
) {
  const [stats, setStats] = useState<ObjectiveStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const client = usePublicClient({ chainId: MONAD_TESTNET_ID });

  useEffect(() => {
    if (!enabled || !vaultAddress || !client) return;
    let cancelled = false;

    async function fetch() {
      setIsLoading(true);
      try {
        // One getLogs call per 100-block chunk instead of 4 per chunk
        const logs = await getLogsChunked(client!, vaultAddress!);

        if (cancelled) return;

        let depositCount = 0;
        let requestCount = 0;
        let deniedCount = 0;
        let totalWithdrawn = 0n;

        for (const log of logs) {
          try {
            // Try each ABI — decodeEventLog throws if the topic doesn't match
            try {
              decodeEventLog({ abi: [EV_DEPOSITED], ...log });
              depositCount++;
              continue;
            } catch { /* not this event */ }

            try {
              decodeEventLog({ abi: [EV_WITHDRAWAL_REQUESTED], ...log });
              requestCount++;
              continue;
            } catch { /* not this event */ }

            try {
              decodeEventLog({ abi: [EV_WITHDRAWAL_DENIED], ...log });
              deniedCount++;
              continue;
            } catch { /* not this event */ }

            try {
              const decoded = decodeEventLog({ abi: [EV_GOAL_WITHDRAWN], ...log });
              totalWithdrawn = (decoded.args as { amount: bigint }).amount;
            } catch { /* not this event */ }
          } catch { /* skip unparseable log */ }
        }

        setStats({ totalWithdrawn, depositCount, requestCount, deniedCount });
      } catch (err) {
        console.error("useObjectiveStats:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [enabled, vaultAddress, client]);

  return { stats, isLoading };
}
