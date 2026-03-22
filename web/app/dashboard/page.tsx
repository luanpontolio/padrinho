"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { useAfilhadoDashboard } from "@/hooks/useAfilhadoDashboard";
import { usePadrinhoDashboard } from "@/hooks/usePadrinhoDashboard";
import { PadrinhoStatus } from "@/hooks/useObjective";
import { AppHeader } from "@/app/components/AppHeader";
import { ObjectiveCard } from "@/app/components/ObjectiveCard";
import { InviteCard } from "@/app/components/InviteCard";

// -----------------------------------------------------------------------
// Dashboard page — role-aware
// -----------------------------------------------------------------------

export default function DashboardPage() {
  const { ready, authenticated } = usePrivy();
  const { address } = useAccount();

  return (
    <div className="min-h-screen">
      <AppHeader />

      {/* Loading */}
      {(!ready || (authenticated && !address)) && (
        <div className="flex items-center justify-center py-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        </div>
      )}

      {/* Not connected — header already has the connect button */}
      {ready && !authenticated && (
        <div className="flex flex-col items-center gap-2 py-32 text-center">
          <p className="text-sm text-foreground/50">Connect your wallet to access your dashboard.</p>
        </div>
      )}

      {/* Authenticated */}
      {ready && authenticated && address && (
        <main className="mx-auto w-full max-w-lg px-4 py-10 space-y-10">
          <AfilhadoSection />
          <PadrinhoSection />
        </main>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// Afilhado section
// -----------------------------------------------------------------------

function AfilhadoSection() {
  const { objectives, isLoading, refetch } = useAfilhadoDashboard();

  const isEmpty = !isLoading && objectives.length === 0;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">My objectives</h2>
        {!isEmpty && (
          <Link
            href="/objective/new"
            className="rounded-lg bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90"
          >
            + New
          </Link>
        )}
      </div>

      {isLoading && <SkeletonList count={2} />}

      {isEmpty && <EmptyState />}

      {!isLoading && objectives.length > 0 && (
        <ul className="space-y-4">
          {objectives.map((obj) => (
            <li key={obj.address}>
              <ObjectiveCard objective={obj} onRefresh={refetch} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------
// Padrinho section
// -----------------------------------------------------------------------

function PadrinhoSection() {
  const { objectives, isLoading, refetch } = usePadrinhoDashboard();

  if (!isLoading && objectives.length === 0) return null;

  const pending = objectives.filter((o) => o.padrinhoStatus === PadrinhoStatus.Pending);
  const active = objectives.filter((o) => o.padrinhoStatus === PadrinhoStatus.Active);

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold">As padrinho</h2>

      {isLoading && <SkeletonList count={1} />}

      {!isLoading && (
        <ul className="space-y-4">
          {pending.map((obj) => (
            <li key={obj.address}>
              <InviteCard objective={obj} onAccepted={refetch} onResolved={refetch} />
            </li>
          ))}
          {active.map((obj) => (
            <li key={obj.address}>
              <InviteCard objective={obj} onResolved={refetch} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------
// Shared UI
// -----------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl bg-foreground/[0.06] dark:bg-white/[0.08] px-8 py-16 text-center">
      <div className="space-y-2">
        <p className="text-lg font-bold">Set a savings goal</p>
        <p className="max-w-xs text-sm leading-relaxed text-foreground/50">
          Give it a name and a target amount. Deposit at your own pace and track progress toward it.
          You can invite someone you trust to keep you accountable, or save on your own.
        </p>
      </div>
      <Link
        href="/objective/new"
        className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
      >
        Start your first objective
      </Link>
    </div>
  );
}

function SkeletonList({ count }: { count: number }) {
  return (
    <ul className="space-y-4" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <ObjectiveCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

function ObjectiveCardSkeleton() {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5">
          <div className="h-4 w-40 animate-pulse rounded bg-foreground/20" />
          <div className="h-3 w-28 animate-pulse rounded bg-foreground/20" />
        </div>
      </div>

      {/* Balance row */}
      <div className="mt-4 flex items-baseline gap-2">
        <div className="h-7 w-28 animate-pulse rounded-lg bg-foreground/20" />
        <div className="h-4 w-20 animate-pulse rounded bg-foreground/20" />
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-2 w-full animate-pulse rounded-full bg-foreground/20" />
      <div className="mt-1 flex justify-end">
        <div className="h-3 w-8 animate-pulse rounded bg-foreground/20" />
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        <div className="h-9 flex-1 animate-pulse rounded-lg bg-foreground/20" />
        <div className="h-9 flex-1 animate-pulse rounded-lg bg-foreground/20" />
      </div>
    </div>
  );
}
