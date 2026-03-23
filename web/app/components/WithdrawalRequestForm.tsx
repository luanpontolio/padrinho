"use client";

import { useState, useEffect } from "react";
import { useWithdrawalRequest } from "@/hooks/useWithdrawalRequest";
import { TransactionStatus } from "@/app/components/TransactionStatus";

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

interface WithdrawalRequestFormProps {
  vaultAddress: `0x${string}`;
  maxAmount: bigint;
  onSuccess?: () => void;
  onCancel?: () => void;
}

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
        <label className="mb-1.5 block text-xs font-medium text-white/50">
          Amount <span className="text-white/30">(max ${formatUsdc(maxAmount)})</span>
        </label>
        <input
          type="number"
          min="0"
          step="any"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          disabled={isBusy || status === "confirmed"}
          placeholder="USDC amount"
          className="input-field disabled:opacity-50"
        />
        {amountError && (
          <p className="mt-1.5 text-xs" style={{ color: "var(--alert)" }}>{amountError}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">
          Message to padrinho <span className="text-white/30">(optional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isBusy || status === "confirmed"}
          placeholder="Explain why you need this withdrawal…"
          rows={2}
          className="w-full resize-none rounded-xl border bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30 disabled:opacity-50"
          style={{ borderColor: "var(--border)" }}
        />
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isBusy}
            className="btn-ghost flex-1 disabled:opacity-40"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={isBusy || status === "confirmed"}
          className="btn-primary flex-1 disabled:opacity-40"
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

      {status === "failed" && (
        <button onClick={handleReset} className="text-xs text-white/40 underline hover:text-white">
          Try again
        </button>
      )}
    </div>
  );
}
