"use client";

import { useState, useEffect } from "react";
import { useWithdrawalRequest } from "@/hooks/useWithdrawalRequest";
import { TransactionStatus } from "@/app/components/TransactionStatus";

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function parseUsdc(value: string): bigint | null {
  const n = parseFloat(value);
  if (isNaN(n) || n <= 0) return null;
  return BigInt(Math.round(n * 1_000_000));
}

function formatUsdc(raw: bigint): string {
  return (Number(raw) / 1_000_000).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function errorCategory(err: string): "USER" | "NETWORK" | "CONTRACT" {
  if (err.includes("(USER)")) return "USER";
  if (err.includes("(NETWORK)")) return "NETWORK";
  return "CONTRACT";
}

// -----------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------

interface WithdrawalRequestFormProps {
  vaultAddress: `0x${string}`;
  maxAmount: bigint;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

export function WithdrawalRequestForm({
  vaultAddress,
  maxAmount,
  onSuccess,
  onCancel,
}: WithdrawalRequestFormProps) {
  const { requestWithdrawal, status, txHash, error, reset } = useWithdrawalRequest(vaultAddress);

  const [amountInput, setAmountInput] = useState("");
  const [message, setMessage] = useState("");
  const [amountError, setAmountError] = useState("");

  useEffect(() => {
    if (status === "confirmed") onSuccess?.();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const isBusy = status === "signing" || status === "submitted";

  function handleSubmit() {
    const amount = parseUsdc(amountInput);
    if (!amount) {
      setAmountError("Enter a valid amount.");
      return;
    }
    if (amount > maxAmount) {
      setAmountError(`Max available: $${formatUsdc(maxAmount)}`);
      return;
    }
    setAmountError("");
    requestWithdrawal(amount, message.trim());
  }

  function handleReset() {
    reset();
    setAmountInput("");
    setMessage("");
    setAmountError("");
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium">
          Amount (max ${formatUsdc(maxAmount)})
        </label>
        <input
          type="number"
          min="0"
          step="any"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          disabled={isBusy || status === "confirmed"}
          placeholder="USDC amount"
          className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/30 disabled:opacity-50"
        />
        {amountError && <p className="mt-1 text-xs text-red-600">{amountError}</p>}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">
          Message to padrinho <span className="text-foreground/40">(optional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isBusy || status === "confirmed"}
          placeholder="Explain why you need this withdrawal…"
          rows={2}
          className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/30 disabled:opacity-50 resize-none"
        />
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isBusy}
            className="flex-1 rounded-lg border border-foreground/20 px-4 py-2 text-sm font-medium hover:bg-foreground/5 disabled:opacity-40"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={isBusy || status === "confirmed"}
          className="flex-1 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
        >
          Submit request
        </button>
      </div>

      <TransactionStatus
        status={status}
        txHash={txHash}
        errorCategory={error ? errorCategory(error) : undefined}
        errorMessage={error}
      />

      {(status === "failed") && (
        <button onClick={handleReset} className="text-xs text-foreground/50 underline hover:text-foreground">
          Try again
        </button>
      )}
    </div>
  );
}
