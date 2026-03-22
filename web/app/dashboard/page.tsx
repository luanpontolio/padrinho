"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { useAfilhadoDashboard } from "@/hooks/useAfilhadoDashboard";
import { ObjectiveCard } from "@/app/components/ObjectiveCard";

// -----------------------------------------------------------------------
// Dashboard page
// -----------------------------------------------------------------------

export default function DashboardPage() {
  const { ready, authenticated, login } = usePrivy();
  const { address } = useAccount();

  // Show nothing until Privy has initialised
  if (!ready) {
    return <LoadingScreen />;
  }

  // Not logged in
  if (!authenticated || !address) {
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

  return <AfilhadoDashboard />;
}

// -----------------------------------------------------------------------
// Afilhado branch
// -----------------------------------------------------------------------

function AfilhadoDashboard() {
  const { objectives, isLoading } = useAfilhadoDashboard();

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">My objectives</h1>
        <Link
          href="/objective/new"
          className="rounded-lg bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90"
        >
          + New
        </Link>
      </div>

      {isLoading && <SkeletonList />}

      {!isLoading && objectives.length === 0 && <EmptyState />}

      {!isLoading && objectives.length > 0 && (
        <ul className="space-y-4">
          {objectives.map((obj) => (
            <li key={obj.address}>
              <ObjectiveCard objective={obj} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

// -----------------------------------------------------------------------
// Empty state
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

// -----------------------------------------------------------------------
// Loading states
// -----------------------------------------------------------------------

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
    </main>
  );
}

function SkeletonList() {
  return (
    <ul className="space-y-4" aria-busy="true" aria-label="Loading objectives">
      {[0, 1].map((i) => (
        <li key={i} className="h-36 animate-pulse rounded-2xl bg-foreground/5" />
      ))}
    </ul>
  );
}
