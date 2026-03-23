"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { useCreateObjective } from "@/hooks/useCreateObjective";
import { TransactionStatus } from "@/app/components/TransactionStatus";

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

export function CreateObjectiveForm() {
  const { address } = useAccount();
  const { write, status, txHash, error, reset } = useCreateObjective();

  const [name, setName] = useState("");
  const [targetInput, setTargetInput] = useState("");
  const [padrinhoInput, setPadrinhoInput] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const [nameError, setNameError] = useState("");
  const [targetError, setTargetError] = useState("");
  const [padrinhoError, setPadrinhoError] = useState("");

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

  const isSubmitting = status === "signing" || status === "submitted";

  return (
    <div className="w-full max-w-md">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        <StepDot active={step === 1} done={step === 2} label="1" />
        <div className="h-px flex-1 bg-white/10" />
        <StepDot active={step === 2} done={false} label="2" />
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-white" style={{ letterSpacing: "-0.02em" }}>
              New savings objective
            </h2>
            <p className="mt-1 text-sm text-white/40">Define your goal and target amount.</p>
          </div>

          <div>
            <label htmlFor="obj-name" className="mb-2 block text-sm font-medium text-white/70">
              Objective name
            </label>
            <input
              id="obj-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Trip to Japan"
              className="input-field"
            />
            {nameError && <p className="mt-1.5 text-xs" style={{ color: "var(--alert)" }}>{nameError}</p>}
          </div>

          <div>
            <label htmlFor="obj-target" className="mb-2 block text-sm font-medium text-white/70">
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
              className="input-field"
            />
            {targetError && <p className="mt-1.5 text-xs" style={{ color: "var(--alert)" }}>{targetError}</p>}
          </div>

          <button onClick={handleStep1} className="btn-primary w-full">
            Continue →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-white" style={{ letterSpacing: "-0.02em" }}>
              Choose a padrinho
            </h2>
            <p className="mt-1 text-sm text-white/40">
              A padrinho can block early withdrawals. Leave blank to save solo.
            </p>
          </div>

          <div>
            <label htmlFor="padrinho-addr" className="mb-2 block text-sm font-medium text-white/70">
              Padrinho address <span className="text-white/30">(optional)</span>
            </label>
            <input
              id="padrinho-addr"
              type="text"
              value={padrinhoInput}
              onChange={(e) => setPadrinhoInput(e.target.value)}
              placeholder="0x… or leave blank for solo mode"
              className="input-field font-mono"
            />
            {padrinhoError && (
              <p className="mt-1.5 text-xs" style={{ color: "var(--alert)" }}>{padrinhoError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="btn-ghost flex-1 disabled:opacity-40"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || status === "confirmed"}
              className="btn-primary flex-1 disabled:opacity-40"
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

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  if (done) {
    return (
      <div
        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium text-black"
        style={{ background: "var(--success)" }}
      >
        ✓
      </div>
    );
  }

  if (active) {
    return (
      <div
        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium text-black"
        style={{ background: "linear-gradient(135deg, #e2c9ff, #8cffdd)" }}
      >
        {label}
      </div>
    );
  }

  return (
    <div
      className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium text-white/30"
      style={{ borderColor: "var(--border)" }}
    >
      {label}
    </div>
  );
}
