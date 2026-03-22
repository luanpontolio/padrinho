"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { decodeEventLog } from "viem";
import { MONAD_TESTNET_ID } from "@/lib/contracts";
import { getLogsChunked } from "@/lib/getLogsChunked";
import {
  EV_WITHDRAWAL_REQUESTED,
  EV_WITHDRAWAL_APPROVED,
  EV_WITHDRAWAL_DENIED,
} from "@/lib/vaultEvents";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface WithdrawalHistoryEntry {
  txHash: `0x${string}`;
  blockNumber: bigint;
  amount: bigint;
  message: string;
  responseMessage: string;
  outcome: "approved" | "denied" | "pending";
}

// -----------------------------------------------------------------------
// Hook — lazy: only fetches when enabled (accordion open)
// -----------------------------------------------------------------------

export function useWithdrawalHistory(vaultAddress: `0x${string}` | undefined) {
  const [history, setHistory] = useState<WithdrawalHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const client = usePublicClient({ chainId: MONAD_TESTNET_ID });

  useEffect(() => {
    if (!vaultAddress || !client) return;
    let cancelled = false;

    async function fetchLogs() {
      setIsLoading(true);
      try {
        const logs = await getLogsChunked(client!, vaultAddress!);
        if (cancelled) return;

        // Separate and sort each type by block number
        type Requested = { blockNumber: bigint; txHash: string; amount: bigint; message: string };
        type Resolved = { blockNumber: bigint; responseMessage: string; amount?: bigint };

        const requests: Requested[] = [];
        const approvals: Resolved[] = [];
        const denials: Resolved[] = [];

        for (const log of logs) {
          try {
            try {
              const d = decodeEventLog({ abi: [EV_WITHDRAWAL_REQUESTED], ...log });
              const args = d.args as { amount: bigint; message: string };
              requests.push({
                blockNumber: log.blockNumber ?? 0n,
                txHash: log.transactionHash as string,
                amount: args.amount,
                message: args.message ?? "",
              });
              continue;
            } catch { /* not this event */ }

            try {
              const d = decodeEventLog({ abi: [EV_WITHDRAWAL_APPROVED], ...log });
              const args = d.args as { amount: bigint; responseMessage: string };
              approvals.push({
                blockNumber: log.blockNumber ?? 0n,
                responseMessage: args.responseMessage ?? "",
                amount: args.amount,
              });
              continue;
            } catch { /* not this event */ }

            try {
              const d = decodeEventLog({ abi: [EV_WITHDRAWAL_DENIED], ...log });
              const args = d.args as { responseMessage: string };
              denials.push({
                blockNumber: log.blockNumber ?? 0n,
                responseMessage: args.responseMessage ?? "",
              });
            } catch { /* not this event */ }
          } catch { /* skip */ }
        }

        requests.sort((a, b) => Number(a.blockNumber - b.blockNumber));
        approvals.sort((a, b) => Number(a.blockNumber - b.blockNumber));
        denials.sort((a, b) => Number(a.blockNumber - b.blockNumber));

        const usedApprovals = new Set<number>();
        const usedDenials = new Set<number>();

        const entries: WithdrawalHistoryEntry[] = requests.map((req) => {
          const approvalIdx = approvals.findIndex(
            (l, idx) => !usedApprovals.has(idx) && l.blockNumber > req.blockNumber,
          );
          const denialIdx = denials.findIndex(
            (l, idx) => !usedDenials.has(idx) && l.blockNumber > req.blockNumber,
          );

          const approval = approvalIdx >= 0 ? approvals[approvalIdx] : null;
          const denial = denialIdx >= 0 ? denials[denialIdx] : null;

          let outcome: WithdrawalHistoryEntry["outcome"] = "pending";
          let responseMessage = "";

          if (approval && denial) {
            if (approval.blockNumber <= denial.blockNumber) {
              outcome = "approved";
              responseMessage = approval.responseMessage;
              usedApprovals.add(approvalIdx);
            } else {
              outcome = "denied";
              responseMessage = denial.responseMessage;
              usedDenials.add(denialIdx);
            }
          } else if (approval) {
            outcome = "approved";
            responseMessage = approval.responseMessage;
            usedApprovals.add(approvalIdx);
          } else if (denial) {
            outcome = "denied";
            responseMessage = denial.responseMessage;
            usedDenials.add(denialIdx);
          }

          return {
            txHash: req.txHash as `0x${string}`,
            blockNumber: req.blockNumber,
            amount: req.amount,
            message: req.message,
            responseMessage,
            outcome,
          };
        });

        setHistory(entries.reverse()); // most recent first
      } catch (err) {
        console.error("useWithdrawalHistory:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchLogs();
    return () => { cancelled = true; };
  }, [vaultAddress, client]);

  return { history, isLoading };
}
