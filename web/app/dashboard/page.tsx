"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { useAfilhadoDashboard } from "@/hooks/useAfilhadoDashboard";
import { usePadrinhoDashboard } from "@/hooks/usePadrinhoDashboard";
import { PadrinhoStatus } from "@/hooks/useObjective";
import { ObjectiveCard } from "@/app/components/ObjectiveCard";
import { InviteCard } from "@/app/components/InviteCard";

// -----------------------------------------------------------------------
// Dashboard page — role-aware
// -----------------------------------------------------------------------

export default function DashboardPage() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address } = useAccount();

  if (!ready) return <LoadingScreen />;

  // Not logged in → show login CTA
  if (!authenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold">Padrinho</h1>
        <p className="text-sm text-foreground/60">Connect your wallet to access your dashboard.</p>
        <button
          onClick={login}
          className="rounded-lg bg-foreground px-6 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Connect wallet
        </button>
      </main>
    );
  }

  // Authenticated but wagmi wallet not synced yet → wait
  if (!address) return <LoadingScreen />;


  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-4 py-10 space-y-10">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-foreground/50">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button
          onClick={() => logout()}
          className="rounded-lg border border-foreground/20 px-3 py-1 text-xs font-medium text-foreground/60 hover:border-foreground/40 hover:text-foreground"
        >
          Disconnect
        </button>
      </div>

      <AfilhadoSection />
      <PadrinhoSection />
    </main>
  );
}

// -----------------------------------------------------------------------
// Afilhado section
// -----------------------------------------------------------------------

function AfilhadoSection() {
  const { objectives, isLoading, refetch } = useAfilhadoDashboard();

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">My objectives</h2>
        <Link
          href="/objective/new"
          className="rounded-lg bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90"
        >
          + New
        </Link>
      </div>

      {isLoading && <SkeletonList count={2} />}

      {!isLoading && objectives.length === 0 && <EmptyState />}

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

  // Hide section entirely if nothing to show and not loading
  if (!isLoading && objectives.length === 0) return null;

  // Separate pending invites from active ones
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
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-foreground/20 py-16 text-center">
      <p className="text-sm text-foreground/50">You have no savings objectives yet.</p>
      <Link
        href="/objective/new"
        className="rounded-lg bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90"
      >
        Create your first objective
      </Link>
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
    </main>
  );
}

function SkeletonList({ count }: { count: number }) {
  return (
    <ul className="space-y-4" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="h-36 animate-pulse rounded-2xl bg-foreground/5" />
      ))}
    </ul>
  );
}
