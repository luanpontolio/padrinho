"use client";

import type { ObjectiveData } from "@/hooks/useObjective";
import { PadrinhoStatus } from "@/hooks/useObjective";
import { useObjectiveStats } from "@/hooks/useObjectiveStats";

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

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

interface CompletionMomentProps {
  objective: ObjectiveData;
}

export function CompletionMoment({ objective }: CompletionMomentProps) {
  const { stats, isLoading } = useObjectiveStats(objective.address, true);
  const hasPadrinho = objective.padrinhoStatus === PadrinhoStatus.Active;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm">
        {/* Header skeleton */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5">
            <div className="h-4 w-40 animate-pulse rounded bg-foreground/20" />
            <div className="h-3 w-24 animate-pulse rounded bg-foreground/20" />
          </div>
          <div className="h-5 w-24 animate-pulse rounded-full bg-foreground/20" />
        </div>

        {/* Hero amount skeleton */}
        <div className="mt-4 space-y-1.5">
          <div className="h-8 w-36 animate-pulse rounded-lg bg-foreground/20" />
          <div className="h-3 w-32 animate-pulse rounded bg-foreground/20" />
        </div>

        {/* Stats row skeleton */}
        <div className="mt-4 grid grid-cols-3 divide-x divide-foreground/10 rounded-xl border border-foreground/10">
          {["Deposits", "Requests", "Denied"].map((label) => (
            <div key={label} className="flex flex-col items-center py-3 gap-1.5">
              <div className="h-5 w-6 animate-pulse rounded bg-foreground/20" />
              <div className="h-2.5 w-12 animate-pulse rounded bg-foreground/20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm">
      {/* Header — same as other cards */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">{objective.name}</h3>
          <p className="mt-0.5 text-xs text-foreground/50">
            {hasPadrinho ? `Padrinho: ${shortAddr(objective.padrinho)}` : "Solo mode"}
          </p>
        </div>
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          Goal achieved
        </span>
      </div>

      {/* Total saved — hero number */}
      <div className="mt-4">
        <p className="text-2xl font-bold">
          ${formatUsdc(stats?.totalWithdrawn ?? objective.targetAmount)}
        </p>
        <p className="mt-0.5 text-sm text-foreground/50">Total saved &amp; withdrawn</p>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 divide-x divide-foreground/10 rounded-xl border border-foreground/10">
        <StatCell
          label="Deposits"
          value={stats?.depositCount ?? 0}
        />
        <StatCell
          label="Requests"
          value={stats?.requestCount ?? 0}
          dimIfZero
        />
        <StatCell
          label="Denied"
          value={stats?.deniedCount ?? 0}
          highlightIfNonZero
          dimIfZero
        />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Stat cell
// -----------------------------------------------------------------------

function StatCell({
  label,
  value,
  highlightIfNonZero,
  dimIfZero,
}: {
  label: string;
  value: number | null;
  highlightIfNonZero?: boolean;
  dimIfZero?: boolean;
}) {
  const isZero = value === 0;

  return (
    <div className="flex flex-col items-center py-3">
      {value === null ? (
        <div className="h-5 w-6 animate-pulse rounded bg-foreground/20" />
      ) : (
        <span
          className={`text-lg font-bold ${
            highlightIfNonZero && !isZero
              ? "text-red-600"
              : dimIfZero && isZero
                ? "text-foreground/25"
                : "text-foreground"
          }`}
        >
          {value}
        </span>
      )}
      <span className="mt-0.5 text-[10px] uppercase tracking-wide text-foreground/40">
        {label}
      </span>
    </div>
  );
}
