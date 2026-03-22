"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { PadrinhoLogo } from "@/app/components/PadrinhoLogo";

export function AppHeader() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address } = useAccount();

  return (
    <header className="w-full border-b border-foreground/10 px-6 py-4">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" aria-label="Go to dashboard">
          <PadrinhoLogo height={22} />
        </Link>

        <div className="flex items-center gap-2">
          {ready && authenticated && address && (
            <>
              <span className="font-mono text-xs text-foreground/50">
                {address.slice(0, 6)}…{address.slice(-4)}
              </span>
              <button
                onClick={() => logout()}
                className="rounded-lg border border-foreground/20 px-3 py-1 text-xs font-medium text-foreground/60 hover:border-foreground/40 hover:text-foreground"
              >
                Disconnect
              </button>
            </>
          )}
          {ready && !authenticated && (
            <button
              onClick={login}
              className="rounded-lg bg-foreground px-3 py-1 text-xs font-medium text-background hover:opacity-90"
            >
              Connect wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
