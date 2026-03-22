"use client";

import { monadTestnet } from "@/lib/wagmi";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export type TxStatus = "idle" | "signing" | "submitted" | "confirmed" | "failed";

export interface TransactionStatusProps {
  status: TxStatus;
  txHash?: `0x${string}`;
  /** USER | NETWORK | CONTRACT */
  errorCategory?: "USER" | "NETWORK" | "CONTRACT";
  errorMessage?: string;
}

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function explorerUrl(hash: `0x${string}`) {
  const base = monadTestnet.blockExplorers.default.url;
  return `${base}/tx/${hash}`;
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

/**
 * Renders the four transaction lifecycle states required by the Padrinho Constitution (III):
 *   signing → submitted (+ explorer link) → confirmed → failed
 *
 * Renders nothing in "idle" state.
 */
export function TransactionStatus({
  status,
  txHash,
  errorCategory,
  errorMessage,
}: TransactionStatusProps) {
  if (status === "idle") return null;

  return (
    <div className="mt-3 rounded-lg border px-4 py-3 text-sm" role="status" aria-live="polite">
      {status === "signing" && (
        <div className="flex items-center gap-2 text-yellow-700">
          <Spinner />
          <span>Awaiting wallet signature…</span>
        </div>
      )}

      {status === "submitted" && (
        <div className="flex items-center gap-2 text-blue-700">
          <Spinner />
          <span>
            Transaction submitted.{" "}
            {txHash && (
              <a
                href={explorerUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View on explorer ↗
              </a>
            )}
          </span>
        </div>
      )}

      {status === "confirmed" && (
        <div className="flex items-center gap-2 text-green-700">
          <span>✓</span>
          <span>
            Confirmed.{" "}
            {txHash && (
              <a
                href={explorerUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View on explorer ↗
              </a>
            )}
          </span>
        </div>
      )}

      {status === "failed" && (
        <div className="text-red-700">
          <div className="flex items-center gap-2">
            <span>✕</span>
            <span>
              Transaction failed
              {errorCategory && (
                <span className="ml-1 rounded bg-red-100 px-1 text-xs font-mono">
                  {errorCategory}
                </span>
              )}
            </span>
          </div>
          {errorMessage && <p className="mt-1 text-xs text-red-600">{errorMessage}</p>}
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
