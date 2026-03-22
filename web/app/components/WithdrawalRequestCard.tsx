"use client";

import { useState, useEffect } from "react";
import type { ObjectiveData } from "@/hooks/useObjective";
import { usePadrinhoActions } from "@/hooks/usePadrinhoActions";
import { TransactionStatus } from "@/app/components/TransactionStatus";

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function formatUsdc(raw: bigint): string {
  return (Number(raw) / 1_000_000).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function errorCategory(err: string): "USER" | "NETWORK" | "CONTRACT" {
  if (err.includes("(USER)")) return "USER";
  if (err.includes("(NETWORK)")) return "NETWORK";
  return "CONTRACT";
}

// -----------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------

interface WithdrawalRequestCardProps {
  objective: ObjectiveData;
  onResolved?: () => void;
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

export function WithdrawalRequestCard({ objective, onResolved }: WithdrawalRequestCardProps) {
  const { approveWithdrawal, denyWithdrawal, status, txHash, error, reset } =
    usePadrinhoActions(objective.address);

  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState("");
  const [action, setAction] = useState<"approve" | "deny" | null>(null);

  const req = objective.withdrawalRequest;

  useEffect(() => {
    if (status === "confirmed") onResolved?.();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const isBusy = status === "signing" || status === "submitted";

  function handleApprove() {
    setAction("approve");
    setReplyError("");
    approveWithdrawal(reply.trim());
  }

  function handleDeny() {
    if (!reply.trim()) {
      setReplyError("A reply message is required when denying.");
      return;
    }
    setAction("deny");
    setReplyError("");
    denyWithdrawal(reply.trim());
  }

  return (
    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 space-y-3">
      {/* Request summary */}
      <div>
        <p className="text-xs font-semibold text-yellow-900">
          Withdrawal request — ${formatUsdc(req.amount)}
        </p>
        <p className="mt-0.5 text-xs text-yellow-700">
          From: {shortAddr(objective.afilhado)} · {objective.name}
        </p>
        {req.message && (
          <p className="mt-2 rounded bg-yellow-100 px-2 py-1.5 text-xs text-yellow-800 italic">
            &ldquo;{req.message}&rdquo;
          </p>
        )}
      </div>

      {/* Reply field */}
      {status !== "confirmed" && (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium text-yellow-900">
              Reply <span className="text-yellow-600">(required to deny)</span>
            </label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              disabled={isBusy}
              placeholder="Your response to the afilhado…"
              rows={2}
              className="w-full rounded-lg border border-yellow-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 resize-none"
            />
            {replyError && <p className="mt-1 text-xs text-red-600">{replyError}</p>}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={isBusy}
              className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-40"
            >
              {action === "approve" && isBusy ? "Approving…" : "Approve"}
            </button>
            <button
              onClick={handleDeny}
              disabled={isBusy}
              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-40"
            >
              {action === "deny" && isBusy ? "Denying…" : "Deny"}
            </button>
          </div>
        </>
      )}

      <TransactionStatus
        status={status}
        txHash={txHash}
        errorCategory={error ? errorCategory(error) : undefined}
        errorMessage={error}
      />

      {status === "failed" && (
        <button onClick={reset} className="text-xs text-yellow-700 underline hover:text-yellow-900">
          Try again
        </button>
      )}
    </div>
  );
}
