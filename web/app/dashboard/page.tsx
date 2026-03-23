"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { useAfilhadoDashboard } from "@/hooks/useAfilhadoDashboard";
import { usePadrinhoDashboard } from "@/hooks/usePadrinhoDashboard";
import { PadrinhoStatus } from "@/hooks/useObjective";
import { ObjectiveCard } from "@/app/components/ObjectiveCard";
import { InviteCard } from "@/app/components/InviteCard";

export default function DashboardPage() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address } = useAccount();

  if (!ready) return <LoadingScreen />;

  if (!authenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <h1 className="text-2xl font-bold gradient-text" style={{ letterSpacing: "-0.03em" }}>
          Padrinho
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Connect your wallet to access your dashboard.
        </p>
        <button onClick={login} className="btn-primary">
          Connect wallet
        </button>
      </main>
    );
  }

  if (!address) return <LoadingScreen />;

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-4 py-10 space-y-10">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-white/40">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button
          onClick={() => logout()}
          className="btn-ghost px-3 py-1 text-xs"
        >
          Disconnect
        </button>
      </div>

      <AfilhadoSection />
      <PadrinhoSection />
    </main>
  );
}

function AfilhadoSection() {
  const { objectives, isLoading, refetch } = useAfilhadoDashboard();

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white/90" style={{ letterSpacing: "-0.02em" }}>
          My objectives
        </h2>
        <Link href="/objective/new" className="btn-primary px-4 py-1.5 text-xs">
          + New
        </Link>
      </div>

      {isLoading && <SkeletonList count={2} />}
      {!isLoading && objectives.length === 0 && <EmptyState />}
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
      <p className="text-sm text-white/40">No savings objectives yet.</p>
      <Link href="/objective/new" className="btn-primary">
        Create your first objective
      </Link>
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
    </main>
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
