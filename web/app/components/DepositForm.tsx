"use client";

import { useState } from "react";
import { useDeposit } from "@/hooks/useDeposit";
import { TransactionStatus } from "@/app/components/TransactionStatus";

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function formatUsdc(raw: bigint): string {
  return (Number(raw) / 1_000_000).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseUsdc(value: string): bigint | null {
  const n = parseFloat(value);
  if (isNaN(n) || n <= 0) return null;
  return BigInt(Math.round(n * 1_000_000));
}

function errorCategory(err: string): "USER" | "NETWORK" | "CONTRACT" {
  if (err.includes("(USER)")) return "USER";
  if (err.includes("(NETWORK)")) return "NETWORK";
  return "CONTRACT";
}

// -----------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------

interface DepositFormProps {
  vaultAddress: `0x${string}`;
  onSuccess?: () => void;
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

export function DepositForm({ vaultAddress, onSuccess }: DepositFormProps) {
  const { usdcBalance, deposit, step, status, approveTxHash, depositTxHash, error, reset } =
    useDeposit(vaultAddress);

  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");

  if (status === "confirmed" && onSuccess) {
    onSuccess();
  }

  const isActive = step !== "idle" && step !== "done" && step !== "failed";

  function handleDeposit() {
    const amount = parseUsdc(input);
    if (!amount) {
      setInputError("Enter a valid amount.");
      return;
    }
    if (amount > usdcBalance) {
      setInputError("Insufficient USDC balance.");
      return;
    }
    setInputError("");
    deposit(amount);
  }

  function handleReset() {
    reset();
    setInput("");
    setInputError("");
  }

  // Step label shown during the 2-step flow
  const stepLabel = step === "approving"
    ? "Step 1/2 — Approving USDC…"
    : step === "depositing"
      ? "Step 2/2 — Depositing…"
      : null;

  const activeTxHash = step === "approving" ? approveTxHash : depositTxHash;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-foreground/50">
        <span>Your balance</span>
        <span className="font-mono">${formatUsdc(usdcBalance)} USDC</span>
      </div>

      <div>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="any"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isActive || step === "done"}
            placeholder="Amount in USDC"
            className="flex-1 rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/30 disabled:opacity-50"
          />
          <button
            onClick={handleDeposit}
            disabled={isActive || step === "done"}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
          >
            Deposit
          </button>
        </div>
        {inputError && <p className="mt-1 text-xs text-red-600">{inputError}</p>}
      </div>

      {stepLabel && (
        <p className="text-xs font-medium text-foreground/60">{stepLabel}</p>
      )}

      <TransactionStatus
        status={status}
        txHash={activeTxHash}
        errorCategory={error ? errorCategory(error) : undefined}
        errorMessage={error}
      />

      {(step === "done" || step === "failed") && (
        <button
          onClick={handleReset}
          className="text-xs text-foreground/50 underline hover:text-foreground"
        >
          {step === "done" ? "Deposit again" : "Try again"}
        </button>
      )}
    </div>
  );
}
