"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

export default function Home() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.replace("/dashboard");
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Padrinho</h1>
        <p className="text-base text-foreground/60">Savings with Delegated Social Trust</p>
      </div>

      <p className="max-w-xs text-sm text-foreground/50">
        Set a savings goal, invite a trusted guardian, and keep yourself accountable.
      </p>

      <button
        onClick={login}
        className="rounded-xl bg-foreground px-8 py-3 text-sm font-semibold text-background hover:opacity-90 active:opacity-80"
      >
        Get started
      </button>
    </main>
  );
}
