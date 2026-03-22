"use client";

import { useState } from "react";
import { useWithdrawalHistory } from "@/hooks/useWithdrawalHistory";
import { monadTestnet } from "@/lib/wagmi";

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function formatUsdc(raw: bigint): string {
  return (Number(raw) / 1_000_000).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function explorerTxUrl(hash: string) {
  return `${monadTestnet.blockExplorers.default.url}/tx/${hash}`;
}

// -----------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------

interface WithdrawalHistoryProps {
  vaultAddress: `0x${string}`;
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

export function WithdrawalHistory({ vaultAddress }: WithdrawalHistoryProps) {
  const [open, setOpen] = useState(false);
  const { history, isLoading } = useWithdrawalHistory(open ? vaultAddress : undefined);

  const hasHistory = history.length > 0;

  return (
    <div className="border-t border-foreground/10 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs text-foreground/50 hover:text-foreground"
      >
        <span>Withdrawal history {!open && history.length === 0 && !isLoading ? "" : `(${history.length})`}</span>
        <span className="text-foreground/30">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {isLoading && (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-foreground/5" />
              ))}
            </div>
          )}

          {!isLoading && !hasHistory && (
            <p className="text-xs text-foreground/40">No withdrawal requests yet.</p>
          )}

          {!isLoading &&
            history.map((entry) => (
              <HistoryEntry key={entry.txHash} entry={entry} />
            ))}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// Single history entry
// -----------------------------------------------------------------------

function HistoryEntry({
  entry,
}: {
  entry: ReturnType<typeof useWithdrawalHistory>["history"][number];
}) {
  const outcomeConfig = {
    approved: {
      label: "Approved",
      bg: "bg-green-50",
      border: "border-green-200",
      badge: "bg-green-100 text-green-700",
      icon: "✓",
    },
    denied: {
      label: "Denied",
      bg: "bg-red-50",
      border: "border-red-200",
      badge: "bg-red-100 text-red-700",
      icon: "✕",
    },
    pending: {
      label: "Pending",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      badge: "bg-yellow-100 text-yellow-700",
      icon: "…",
    },
  }[entry.outcome];

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 text-xs ${outcomeConfig.bg} ${outcomeConfig.border}`}
    >
      {/* Row 1: amount + badge + link */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${outcomeConfig.badge}`}
          >
            {outcomeConfig.icon}
          </span>
          <span className="font-semibold">${formatUsdc(entry.amount)}</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${outcomeConfig.badge}`}
          >
            {outcomeConfig.label}
          </span>
        </div>
        <a
          href={explorerTxUrl(entry.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground/30 underline hover:text-foreground"
        >
          #tx
        </a>
      </div>

      {/* Row 2: afilhado message */}
      {entry.message && (
        <p className="mt-1.5 text-foreground/60 italic">
          &ldquo;{entry.message}&rdquo;
        </p>
      )}

      {/* Row 3: padrinho response */}
      {entry.responseMessage && (
        <p className="mt-1 text-foreground/50">
          <span className="font-medium not-italic">Padrinho:</span>{" "}
          {entry.responseMessage}
        </p>
      )}
    </div>
  );
}
