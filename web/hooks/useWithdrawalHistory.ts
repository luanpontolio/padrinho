"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { MONAD_TESTNET_ID } from "@/lib/contracts";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface WithdrawalHistoryEntry {
  txHash: `0x${string}`;
  blockNumber: bigint;
  amount: bigint;
  /** Message from the afilhado */
  message: string;
  /** Reply from the padrinho */
  responseMessage: string;
  outcome: "approved" | "denied" | "pending";
}

// -----------------------------------------------------------------------
// Event ABIs (inline — avoids importing the giant JSON ABI)
// -----------------------------------------------------------------------

const EV_REQUESTED = parseAbiItem(
  "event WithdrawalRequested(uint256 amount, string message)",
);
const EV_APPROVED = parseAbiItem(
  "event WithdrawalApproved(uint256 amount, string responseMessage)",
);
const EV_DENIED = parseAbiItem("event WithdrawalDenied(string responseMessage)");

// -----------------------------------------------------------------------
// Hook
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
        // Fetch all three event types sequentially to stay within rate limits
        const requestedLogs = await client!.getLogs({
          address: vaultAddress,
          event: EV_REQUESTED,
          fromBlock: 0n,
        });

        const approvedLogs = await client!.getLogs({
          address: vaultAddress,
          event: EV_APPROVED,
          fromBlock: 0n,
        });

        const deniedLogs = await client!.getLogs({
          address: vaultAddress,
          event: EV_DENIED,
          fromBlock: 0n,
        });

        if (cancelled) return;

        // Sort each list ascending by block
        const requests = [...requestedLogs].sort(
          (a, b) => Number(a.blockNumber - b.blockNumber),
        );
        const approvals = [...approvedLogs].sort(
          (a, b) => Number(a.blockNumber - b.blockNumber),
        );
        const denials = [...deniedLogs].sort(
          (a, b) => Number(a.blockNumber - b.blockNumber),
        );

        // Correlate: each request is resolved by the first approval or denial
        // that comes after it (contract enforces one pending request at a time).
        const usedApprovals = new Set<number>();
        const usedDenials = new Set<number>();

        const entries: WithdrawalHistoryEntry[] = requests.map((req) => {
          const args = req.args as { amount: bigint; message: string };

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
              responseMessage = (approval.args as { responseMessage: string })
                .responseMessage;
              usedApprovals.add(approvalIdx);
            } else {
              outcome = "denied";
              responseMessage = (denial.args as { responseMessage: string })
                .responseMessage;
              usedDenials.add(denialIdx);
            }
          } else if (approval) {
            outcome = "approved";
            responseMessage = (approval.args as { responseMessage: string })
              .responseMessage;
            usedApprovals.add(approvalIdx);
          } else if (denial) {
            outcome = "denied";
            responseMessage = (denial.args as { responseMessage: string })
              .responseMessage;
            usedDenials.add(denialIdx);
          }

          return {
            txHash: req.transactionHash as `0x${string}`,
            blockNumber: req.blockNumber,
            amount: args.amount,
            message: args.message ?? "",
            responseMessage,
            outcome,
          };
        });

        // Most recent first
        setHistory(entries.reverse());
      } catch (err) {
        console.error("useWithdrawalHistory:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchLogs();
    return () => {
      cancelled = true;
    };
  }, [vaultAddress, client]);

  return { history, isLoading };
}
