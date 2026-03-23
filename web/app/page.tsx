"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { PadrinhoLogo } from "@/app/components/PadrinhoLogo";

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Set a goal",
    body: "Name what you're saving for and set a target amount.",
  },
  {
    step: "2",
    title: "Invite a padrinho",
    body: "Choose someone you trust to oversee your savings. Optional — you can save solo too.",
  },
  {
    step: "3",
    title: "Deposit freely",
    body: "Add funds at your own pace. Your padrinho can weigh in if you want to exit early.",
  },
  {
    step: "4",
    title: "Reach your goal",
    body: "When your balance hits the target, the full amount is yours — no approval needed.",
  },
];

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-12 px-6 py-16 text-center">

      {/* Logo + tagline */}
      <div className="flex flex-col items-center gap-4">
        <PadrinhoLogo height={32} />
        <p className="text-sm text-white/50">Savings with Delegated Social Trust</p>
      </div>

      {/* How it works */}
      <div className="w-full space-y-3">
        {HOW_IT_WORKS.map(({ step, title, body }) => (
          <div key={step} className="flex items-start gap-4 rounded-2xl px-4 py-4 text-left" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white/50" style={{ background: "rgba(255,255,255,0.08)" }}>
              {step}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-white/50">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button onClick={login} className="btn-primary w-full">
        Get started
      </button>

    </main>
  );
}
