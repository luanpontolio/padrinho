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
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(226,201,255,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="space-y-3">
        <h1
          className="text-5xl font-bold tracking-tight gradient-text"
          style={{ letterSpacing: "-0.04em" }}
        >
          Padrinho
        </h1>
        <p className="text-base font-light" style={{ color: "var(--muted)" }}>
          Savings with Delegated Social Trust
        </p>
      </div>

      <p className="max-w-xs text-sm text-white/40 leading-relaxed">
        Set a savings goal, invite a trusted guardian, and keep yourself accountable.
      </p>

      <button onClick={login} className="btn-primary">
        Get started
      </button>
    </main>
  );
}
