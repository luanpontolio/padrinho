"use client";

import type { ObjectiveData } from "@/hooks/useObjective";
import { PadrinhoStatus } from "@/hooks/useObjective";
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

interface InviteCardProps {
  objective: ObjectiveData;
  onAccepted?: () => void;
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

export function InviteCard({ objective, onAccepted }: InviteCardProps) {
  const { acceptInvite, status, txHash, error, reset } = usePadrinhoActions(objective.address);

  const isPending = objective.padrinhoStatus === PadrinhoStatus.Pending;
  const isActive = objective.padrinhoStatus === PadrinhoStatus.Active;

  if (status === "confirmed" && onAccepted) {
    onAccepted();
  }

  return (
    <div className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">{objective.name}</h3>
          <p className="mt-0.5 text-xs text-foreground/50">
            Afilhado: {shortAddr(objective.afilhado)}
          </p>
        </div>

        {isPending && (
          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
            Invite pending
          </span>
        )}
        {isActive && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Active padrinho
          </span>
        )}
      </div>

      {/* Objective summary */}
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-foreground/5 p-3 text-sm">
        <div>
          <p className="text-xs text-foreground/50">Balance</p>
          <p className="font-mono font-medium">${formatUsdc(objective.totalAssets)}</p>
        </div>
        <div>
          <p className="text-xs text-foreground/50">Target</p>
          <p className="font-mono font-medium">${formatUsdc(objective.targetAmount)}</p>
        </div>
      </div>

      {/* Accept CTA — only when pending */}
      {isPending && status !== "confirmed" && (
        <div className="mt-4">
          <button
            onClick={() => acceptInvite()}
            disabled={status === "signing" || status === "submitted"}
            className="w-full rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
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
            <button onClick={reset} className="mt-2 text-xs text-foreground/50 underline hover:text-foreground">
              Try again
            </button>
          )}
        </div>
      )}

      {/* Withdrawal request badge — when active and there's a pending request */}
      {isActive && objective.withdrawalRequest.exists && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs font-medium text-yellow-800">
            Pending withdrawal request: ${formatUsdc(objective.withdrawalRequest.amount)}
          </p>
          {objective.withdrawalRequest.message && (
            <p className="mt-1 text-xs text-yellow-700">&ldquo;{objective.withdrawalRequest.message}&rdquo;</p>
          )}
        </div>
      )}
    </div>
  );
}
