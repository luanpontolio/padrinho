"use client";

import type { ObjectiveData } from "@/hooks/useObjective";
import { PadrinhoStatus, VaultStatus } from "@/hooks/useObjective";

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function formatUsdc(raw: bigint): string {
  const dollars = Number(raw) / 1_000_000;
  return dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function progressPercent(balance: bigint, target: bigint): number {
  if (target === 0n) return 0;
  const pct = Number((balance * 100n) / target);
  return Math.min(pct, 100);
}

function padrinhoLabel(status: number, padrinho: string, pending: string): string {
  if (status === PadrinhoStatus.Active) return `Padrinho: ${padrinho.slice(0, 6)}…${padrinho.slice(-4)}`;
  if (status === PadrinhoStatus.Pending) return `Invite pending: ${pending.slice(0, 6)}…${pending.slice(-4)}`;
  return "Solo mode";
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

interface ObjectiveCardProps {
  objective: ObjectiveData;
  /** Optional slot for action buttons (deposit, withdraw, request) */
  actions?: React.ReactNode;
}

export function ObjectiveCard({ objective, actions }: ObjectiveCardProps) {
  const { name, totalAssets, targetAmount, status, padrinhoStatus, padrinho, pendingPadrinho } = objective;
  const pct = progressPercent(totalAssets, targetAmount);
  const isCompleted = status === VaultStatus.Completed;
  const goalReached = !isCompleted && totalAssets >= targetAmount && targetAmount > 0n;

  return (
    <div className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">{name}</h3>
          <p className="mt-0.5 text-xs text-foreground/50">
            {padrinhoLabel(padrinhoStatus, padrinho, pendingPadrinho)}
          </p>
        </div>

        {isCompleted && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Completed
          </span>
        )}
        {goalReached && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            Goal reached
          </span>
        )}
      </div>

      {/* Balance */}
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-2xl font-bold">${formatUsdc(totalAssets)}</span>
        <span className="text-sm text-foreground/50">/ ${formatUsdc(targetAmount)}</span>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-300"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="mt-1 text-right text-xs text-foreground/50">{pct}%</p>

      {/* Action slot */}
      {actions && !isCompleted && <div className="mt-4">{actions}</div>}
    </div>
  );
}
