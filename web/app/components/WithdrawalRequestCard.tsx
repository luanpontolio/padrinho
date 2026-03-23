"use client";

import { useState, useEffect } from "react";
import type { ObjectiveData } from "@/hooks/useObjective";
import { usePadrinhoActions } from "@/hooks/usePadrinhoActions";
import { TransactionStatus } from "@/app/components/TransactionStatus";

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

interface WithdrawalRequestCardProps {
  objective: ObjectiveData;
  onResolved?: () => void;
}

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
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ borderColor: "rgba(255,214,170,0.2)", background: "rgba(255,214,170,0.04)" }}
    >
      {/* Request summary */}
      <div>
        <p className="text-xs font-semibold" style={{ color: "var(--warning)" }}>
          Withdrawal request — ${formatUsdc(req.amount)}
        </p>
        <p className="mt-0.5 text-xs text-white/40">
          From: {shortAddr(objective.afilhado)} · {objective.name}
        </p>
        {req.message && (
          <p
            className="mt-2 rounded-lg px-3 py-2 text-xs italic text-white/60"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            &ldquo;{req.message}&rdquo;
          </p>
        )}
      </div>

      {status !== "confirmed" && (
        <>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              Reply <span className="text-white/30">(required to deny)</span>
            </label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              disabled={isBusy}
              placeholder="Your response to the afilhado…"
              rows={2}
              className="w-full resize-none rounded-xl border bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20 disabled:opacity-50"
              style={{ borderColor: "var(--border)" }}
            />
            {replyError && (
              <p className="mt-1 text-xs" style={{ color: "var(--alert)" }}>{replyError}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={isBusy}
              className="flex-1 rounded-full px-3 py-2 text-xs font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: "var(--success)" }}
            >
              {action === "approve" && isBusy ? "Approving…" : "Approve"}
            </button>
            <button
              onClick={handleDeny}
              disabled={isBusy}
              className="flex-1 rounded-full border px-3 py-2 text-xs font-medium transition-colors hover:border-white/20 disabled:opacity-40"
              style={{ borderColor: "rgba(255,107,107,0.4)", color: "var(--alert)" }}
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
        <button onClick={reset} className="text-xs text-white/40 underline hover:text-white">
          Try again
        </button>
      )}
    </div>
  );
}
