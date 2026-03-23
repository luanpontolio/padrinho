"use client";

import { use } from "react";
import { isAddress } from "viem";
import { useObjective, VaultStatus, PadrinhoStatus } from "@/hooks/useObjective";

function formatUsdc(raw: bigint): string {
  return (Number(raw) / 1_000_000).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function progressPercent(balance: bigint, target: bigint): number {
  if (target === 0n) return 0;
  return Math.min(Number((balance * 100n) / target), 100);
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function ObjectivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const vaultAddress = isAddress(id) ? (id as `0x${string}`) : undefined;
  const { objective, isLoading } = useObjective(vaultAddress);

  if (!vaultAddress) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-white/40">Invalid objective address.</p>
      </main>
    );
  }

  if (isLoading || !objective) {
    return <SkeletonView />;
  }

  const pct = progressPercent(objective.totalAssets, objective.targetAmount);
  const isCompleted = objective.status === VaultStatus.Completed;
  const goalReached =
    !isCompleted && objective.totalAssets >= objective.targetAmount && objective.targetAmount > 0n;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-12">
      <a
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white"
      >
        ← Home
      </a>

      <div className="card space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold" style={{ letterSpacing: "-0.02em" }}>
              {objective.name}
            </h1>
            <p className="mt-1 text-xs text-white/40">
              {objective.padrinhoStatus === PadrinhoStatus.Active
                ? `Padrinho: ${shortAddr(objective.padrinho)}`
                : objective.padrinhoStatus === PadrinhoStatus.Pending
                  ? `Invite pending: ${shortAddr(objective.pendingPadrinho)}`
                  : "Solo mode"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {isCompleted && (
              <span
                className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                style={{ borderColor: "var(--success)", color: "var(--success)" }}
              >
                Completed
              </span>
            )}
            {goalReached && (
              <span
                className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                style={{ borderColor: "#a9cbff", color: "#a9cbff" }}
              >
                Goal reached
              </span>
            )}
          </div>
        </div>

        {/* Balance / target */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold gradient-text" style={{ letterSpacing: "-0.03em" }}>
            ${formatUsdc(objective.totalAssets)}
          </span>
          <span className="text-sm text-white/40">/ ${formatUsdc(objective.targetAmount)}</span>
        </div>

        {/* Progress bar */}
        <div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full gradient-bar transition-all duration-500"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="mt-1.5 text-right text-xs text-white/30">{pct}%</p>
        </div>

        {/* Addresses */}
        <div className="space-y-1 border-t border-white/8 pt-4 text-xs text-white/30">
          <p>
            Afilhado: <span className="font-mono text-white/50">{shortAddr(objective.afilhado)}</span>
          </p>
          <p>
            Vault: <span className="font-mono text-white/50">{shortAddr(objective.address)}</span>
          </p>
        </div>
      </div>
    </main>
  );
}

function SkeletonView() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-12">
      <div className="mb-8 h-4 w-16 animate-pulse rounded-full bg-white/10" />
      <div className="card space-y-5">
        <div className="h-6 w-2/3 animate-pulse rounded-full bg-white/10" />
        <div className="h-10 w-1/2 animate-pulse rounded-lg bg-white/10" />
        <div className="h-1.5 w-full animate-pulse rounded-full bg-white/10" />
        <div className="h-4 w-full animate-pulse rounded-full bg-white/10" />
      </div>
    </main>
  );
}
