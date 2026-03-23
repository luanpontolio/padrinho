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

export default function DashboardPage() {
  const { ready, authenticated } = usePrivy();
  const { address } = useAccount();

  return (
    <div className="min-h-screen">
      <AppHeader />

      {/* Loading */}
      {(!ready || (authenticated && !address)) && (
        <div className="flex items-center justify-center py-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
        </div>
      )}

      {/* Not connected — header already has the connect button */}
      {ready && !authenticated && (
        <div className="flex flex-col items-center gap-2 py-32 text-center">
          <p className="text-sm text-white/50">Connect your wallet to access your dashboard.</p>
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

function AfilhadoSection() {
  const { objectives, isLoading, refetch } = useAfilhadoDashboard();

  const isEmpty = !isLoading && objectives.length === 0;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white/90" style={{ letterSpacing: "-0.02em" }}>
          My objectives
        </h2>
        {!isEmpty && (
          <Link href="/objective/new" className="btn-primary px-4 py-1.5 text-xs">
            + New
          </Link>
        )}
      </div>

      {isLoading && <SkeletonList count={2} />}

      {isEmpty && <EmptyState />}

      {!isLoading && objectives.length > 0 && (
        <ul className="space-y-3">
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

function PadrinhoSection() {
  const { objectives, isLoading, refetch } = usePadrinhoDashboard();

  if (!isLoading && objectives.length === 0) return null;

  const pending = objectives.filter((o) => o.padrinhoStatus === PadrinhoStatus.Pending);
  const active = objectives.filter((o) => o.padrinhoStatus === PadrinhoStatus.Active);

  return (
    <section>
      <h2
        className="mb-4 text-base font-semibold text-white/90"
        style={{ letterSpacing: "-0.02em" }}
      >
        As padrinho
      </h2>

      {isLoading && <SkeletonList count={1} />}

      {!isLoading && (
        <ul className="space-y-3">
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-white/10 py-16 text-center">
      <div className="space-y-2">
        <p className="text-base font-semibold text-white">Set a savings goal</p>
        <p className="max-w-xs text-sm leading-relaxed text-white/40">
          Give it a name and a target amount. Deposit at your own pace and track progress toward it.
          You can invite someone you trust to keep you accountable, or save on your own.
        </p>
      </div>
      <Link href="/objective/new" className="btn-primary">
        Start your first objective
      </Link>
    </div>
  );
}

function SkeletonList({ count }: { count: number }) {
  return (
    <ul className="space-y-3" aria-busy="true">
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
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded-full bg-white/10" />
          <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="h-7 w-28 animate-pulse rounded-lg bg-white/10" />
        <div className="h-4 w-20 animate-pulse rounded-lg bg-white/10" />
      </div>
      <div className="h-1.5 w-full animate-pulse rounded-full bg-white/10" />
      <div className="flex gap-2">
        <div className="h-9 flex-1 animate-pulse rounded-full bg-white/10" />
        <div className="h-9 flex-1 animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  );
}
