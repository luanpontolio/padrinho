"use client";

import { useEffect } from "react";
import type { ObjectiveData } from "@/hooks/useObjective";
import { PadrinhoStatus } from "@/hooks/useObjective";
import { usePadrinhoActions } from "@/hooks/usePadrinhoActions";
import { WithdrawalRequestCard } from "@/app/components/WithdrawalRequestCard";
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

interface InviteCardProps {
  objective: ObjectiveData;
  onAccepted?: () => void;
  onResolved?: () => void;
}

export function InviteCard({ objective, onAccepted, onResolved }: InviteCardProps) {
  const { acceptInvite, status, txHash, error, reset } = usePadrinhoActions(objective.address);

  const isPending = objective.padrinhoStatus === PadrinhoStatus.Pending;
  const isActive = objective.padrinhoStatus === PadrinhoStatus.Active;
  const hasRequest = isActive && objective.withdrawalRequest.exists;

  useEffect(() => {
    if (status === "confirmed") onAccepted?.();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>
            {objective.name}
          </h3>
          <p className="mt-0.5 text-xs text-white/40">
            Afilhado: {shortAddr(objective.afilhado)}
          </p>
        </div>
        <div>
          {isPending && (
            <span
              className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
              style={{ borderColor: "rgba(255,214,170,0.6)", color: "var(--warning)" }}
            >
              Invite pending
            </span>
          )}
          {isActive && !hasRequest && (
            <span
              className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
              style={{ borderColor: "rgba(140,255,221,0.5)", color: "var(--success)" }}
            >
              Active
            </span>
          )}
          {hasRequest && (
            <span
              className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
              style={{ borderColor: "rgba(226,201,255,0.5)", color: "#e2c9ff" }}
            >
              Action needed
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      <div
        className="grid grid-cols-2 gap-3 rounded-xl p-3 text-sm"
        style={{ background: "rgba(255,255,255,0.04)" }}
      >
        <div>
          <p className="text-xs text-white/40">Balance</p>
          <p className="font-mono font-medium text-white">${formatUsdc(objective.totalAssets)}</p>
        </div>
        <div>
          <p className="text-xs text-white/40">Target</p>
          <p className="font-mono font-medium text-white">${formatUsdc(objective.targetAmount)}</p>
        </div>
      </div>

      {/* Accept CTA */}
      {isPending && status !== "confirmed" && (
        <div className="space-y-2">
          <button
            onClick={() => acceptInvite()}
            disabled={status === "signing" || status === "submitted"}
            className="btn-primary w-full disabled:opacity-40"
          >
            Accept invitation
          </button>
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
      )}

      {hasRequest && <WithdrawalRequestCard objective={objective} onResolved={onResolved} />}
    </div>
  );
}
