"use client";

import { useState, useEffect } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { useCreateObjective } from "@/hooks/useCreateObjective";
import { TransactionStatus } from "@/app/components/TransactionStatus";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

interface CreateObjectiveFormProps {
  /** Called after the transaction is confirmed on-chain */
  onConfirmed?: () => void;
}

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

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
// Component
// -----------------------------------------------------------------------

export function CreateObjectiveForm({ onConfirmed }: CreateObjectiveFormProps) {
  const { address } = useAccount();
  const { write, status, txHash, error, reset } = useCreateObjective();

  // Step 1 fields
  const [name, setName] = useState("");
  const [targetInput, setTargetInput] = useState("");

  // Step 2 fields
  const [padrinhoInput, setPadrinhoInput] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  // Validation
  const [nameError, setNameError] = useState("");
  const [targetError, setTargetError] = useState("");
  const [padrinhoError, setPadrinhoError] = useState("");

  // useEffect(() => {
  //   if (status === "confirmed") onConfirmed?.();
  // }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  function handleStep1() {
    let valid = true;

    if (!name.trim()) {
      setNameError("Objective name is required.");
      valid = false;
    } else {
      setNameError("");
    }

    const amount = parseUsdc(targetInput);
    if (!amount) {
      setTargetError("Enter a valid target amount in USDC (e.g. 500).");
      valid = false;
    } else {
      setTargetError("");
    }

    if (valid) setStep(2);
  }

  function handleSubmit() {
    const amount = parseUsdc(targetInput)!;
    const hint = padrinhoInput.trim();

    if (hint) {
      if (!isAddress(hint)) {
        setPadrinhoError("Invalid Ethereum address.");
        return;
      }
      if (hint.toLowerCase() === address?.toLowerCase()) {
        setPadrinhoError("You cannot invite yourself as padrinho.");
        return;
      }
    }

    setPadrinhoError("");
    write({
      name: name.trim(),
      targetAmount: amount,
      padrinhoHint: hint ? (hint as `0x${string}`) : undefined,
    });
  }

  function handleBack() {
    reset();
    setStep(1);
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const isSubmitting = status === "signing" || status === "submitted";

  return (
    <div className="w-full max-w-md">
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2 text-xs text-foreground/50">
        <StepDot active={step === 1} done={step === 2} label="1" />
        <div className="h-px flex-1 bg-foreground/10" />
        <StepDot active={step === 2} done={false} label="2" />
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">New savings objective</h2>

          <div>
            <label htmlFor="obj-name" className="mb-1 block text-sm font-medium">
              Objective name
            </label>
            <input
              id="obj-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Trip to Japan"
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/30"
            />
            {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
          </div>

          <div>
            <label htmlFor="obj-target" className="mb-1 block text-sm font-medium">
              Target amount (USDC)
            </label>
            <input
              id="obj-target"
              type="number"
              min="0"
              step="any"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="e.g. 1000"
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/30"
            />
            {targetError && <p className="mt-1 text-xs text-red-600">{targetError}</p>}
          </div>

          <button
            onClick={handleStep1}
            className="w-full rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 active:opacity-80"
          >
            Continue →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Choose a padrinho (optional)</h2>
          <p className="text-sm text-foreground/60">
            A padrinho can block early withdrawals below your goal. Leave blank to save solo.
          </p>

          <div>
            <label htmlFor="padrinho-addr" className="mb-1 block text-sm font-medium">
              Padrinho address
            </label>
            <input
              id="padrinho-addr"
              type="text"
              value={padrinhoInput}
              onChange={(e) => setPadrinhoInput(e.target.value)}
              placeholder="0x… or leave blank for solo mode"
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-foreground/30"
            />
            {padrinhoError && <p className="mt-1 text-xs text-red-600">{padrinhoError}</p>}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-foreground/20 px-4 py-2 text-sm font-medium hover:bg-foreground/5 disabled:opacity-40"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || status === "confirmed"}
              className="flex-1 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 active:opacity-80 disabled:opacity-40"
            >
              {padrinhoInput.trim() ? "Create with padrinho" : "Create (solo)"}
            </button>
          </div>

          <TransactionStatus
            status={status}
            txHash={txHash}
            errorCategory={error ? errorCategory(error) : undefined}
            errorMessage={error}
          />
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// Step indicator dot
// -----------------------------------------------------------------------

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div
      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
        active
          ? "bg-foreground text-background"
          : done
            ? "bg-green-500 text-white"
            : "border border-foreground/20 text-foreground/40"
      }`}
    >
      {done ? "✓" : label}
    </div>
  );
}
