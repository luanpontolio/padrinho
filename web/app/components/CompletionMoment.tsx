"use client";

import type { ObjectiveData } from "@/hooks/useObjective";
import { PadrinhoStatus } from "@/hooks/useObjective";
import { useObjectiveStats } from "@/hooks/useObjectiveStats";

function formatUsdc(raw: bigint): string {
  return (Number(raw) / 1_000_000).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

interface CompletionMomentProps {
  objective: ObjectiveData;
}

export function CompletionMoment({ objective }: CompletionMomentProps) {
  const { stats, isLoading } = useObjectiveStats(objective.address, true);
  const hasPadrinho = objective.padrinhoStatus === PadrinhoStatus.Active;

  if (isLoading) {
    return (
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2">
            <div className="h-4 w-40 animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="h-5 w-24 animate-pulse rounded-full bg-white/10" />
        </div>
        <div className="space-y-1.5">
          <div className="h-8 w-36 animate-pulse rounded-lg bg-white/10" />
          <div className="h-3 w-32 animate-pulse rounded-full bg-white/10" />
        </div>
        <div className="grid grid-cols-3 divide-x divide-white/8 rounded-xl border border-white/8">
          {["Deposits", "Requests", "Denied"].map((label) => (
            <div key={label} className="flex flex-col items-center py-3 gap-1.5">
              <div className="h-5 w-6 animate-pulse rounded bg-white/10" />
              <div className="h-2.5 w-12 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>
            {objective.name}
          </h3>
          <p className="mt-0.5 text-xs text-white/40">
            {hasPadrinho ? `Padrinho: ${shortAddr(objective.padrinho)}` : "Solo mode"}
          </p>
        </div>
        <span
          className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
          style={{ borderColor: "rgba(140,255,221,0.5)", color: "var(--success)" }}
        >
          Goal achieved
        </span>
      </div>

      {/* Total saved */}
      <div>
        <p className="text-2xl font-bold gradient-text" style={{ letterSpacing: "-0.03em" }}>
          ${formatUsdc(stats?.totalWithdrawn ?? objective.targetAmount)}
        </p>
        <p className="mt-0.5 text-sm text-white/40">Total saved &amp; withdrawn</p>
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-3 divide-x rounded-xl border"
        style={{ borderColor: "var(--border)", borderLeftColor: "var(--border)" }}
      >
        <StatCell label="Deposits" value={stats?.depositCount ?? 0} />
        <StatCell label="Requests" value={stats?.requestCount ?? 0} dimIfZero />
        <StatCell label="Denied" value={stats?.deniedCount ?? 0} highlightIfNonZero dimIfZero />
      </div>
    </div>
  );
}

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
    <div className="flex flex-col items-center py-3" style={{ borderColor: "var(--border)" }}>
      {value === null ? (
        <div className="h-5 w-6 animate-pulse rounded bg-white/10" />
      ) : (
        <span
          className="text-lg font-bold"
          style={{
            color:
              highlightIfNonZero && !isZero
                ? "var(--alert)"
                : dimIfZero && isZero
                  ? "rgba(255,255,255,0.2)"
                  : "white",
          }}
        >
          {value}
        </span>
      )}
      <span className="mt-0.5 text-[10px] uppercase tracking-wide text-white/30">{label}</span>
    </div>
  );
}
