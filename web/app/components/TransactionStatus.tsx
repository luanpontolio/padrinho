"use client";

import { monadTestnet } from "@/lib/wagmi";

export type TxStatus = "idle" | "signing" | "submitted" | "confirmed" | "failed";

export interface TransactionStatusProps {
  status: TxStatus;
  txHash?: `0x${string}`;
  errorCategory?: "USER" | "NETWORK" | "CONTRACT";
  errorMessage?: string;
}

function explorerUrl(hash: `0x${string}`) {
  const base = monadTestnet.blockExplorers.default.url;
  return `${base}/tx/${hash}`;
}

export function TransactionStatus({ status, txHash, errorCategory, errorMessage }: TransactionStatusProps) {
  if (status === "idle") return null;

  return (
    <div
      className="mt-3 rounded-xl border px-4 py-3 text-sm"
      style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.03)" }}
      role="status"
      aria-live="polite"
    >
      {status === "signing" && (
        <div className="flex items-center gap-2 text-white/60">
          <Spinner />
          <span>Awaiting wallet signature…</span>
        </div>
      )}

      {status === "submitted" && (
        <div className="flex items-center gap-2 text-white/60">
          <Spinner />
          <span>
            Transaction submitted.{" "}
            {txHash && (
              <a
                href={explorerUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 underline hover:text-white"
              >
                View on explorer ↗
              </a>
            )}
          </span>
        </div>
      )}

      {status === "confirmed" && (
        <div className="flex items-center gap-2" style={{ color: "var(--success)" }}>
          <span>✓</span>
          <span>
            Confirmed.{" "}
            {txHash && (
              <a
                href={explorerUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline opacity-70 hover:opacity-100"
              >
                View on explorer ↗
              </a>
            )}
          </span>
        </div>
      )}

      {status === "failed" && (
        <div style={{ color: "var(--alert)" }}>
          <div className="flex items-center gap-2">
            <span>✕</span>
            <span>
              Transaction failed
              {errorCategory && (
                <span
                  className="ml-1.5 rounded-md px-1.5 py-0.5 text-xs font-mono"
                  style={{ background: "rgba(255,107,107,0.15)", color: "var(--alert)" }}
                >
                  {errorCategory}
                </span>
              )}
            </span>
          </div>
          {errorMessage && (
            <p className="mt-1 text-xs text-white/40">{errorMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
