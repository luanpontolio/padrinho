"use client";

import { useState } from "react";
import type { ObjectiveData } from "@/hooks/useObjective";
import { PadrinhoStatus, VaultStatus } from "@/hooks/useObjective";
import { useWithdrawalRequest } from "@/hooks/useWithdrawalRequest";
import { DepositForm } from "@/app/components/DepositForm";
import { TransactionStatus } from "@/app/components/TransactionStatus";

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function formatUsdc(raw: bigint): string {
  const dollars = Number(raw) / 1_000_000;
  return dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function progressPercent(balance: bigint, target: bigint): number {
  if (target === 0n) return 0;
  const pct = Number((balance * 100n) / target);
  return Math.min(pct, 100);
}

function padrinhoLabel(status: number, padrinho: string, pending: string): string {
  if (status === PadrinhoStatus.Active) return `Padrinho: ${padrinho.slice(0, 6)}…${padrinho.slice(-4)}`;
  if (status === PadrinhoStatus.Pending) return `Invite pending: ${pending.slice(0, 6)}…${pending.slice(-4)}`;
  return "Solo mode";
}

function errorCategory(err: string): "USER" | "NETWORK" | "CONTRACT" {
  if (err.includes("(USER)")) return "USER";
  if (err.includes("(NETWORK)")) return "NETWORK";
  return "CONTRACT";
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

interface ObjectiveCardProps {
  objective: ObjectiveData;
  onRefresh?: () => void;
}

export function ObjectiveCard({ objective, onRefresh }: ObjectiveCardProps) {
  const { name, totalAssets, targetAmount, status, padrinhoStatus, padrinho, pendingPadrinho } = objective;

  const pct = progressPercent(totalAssets, targetAmount);
  const isCompleted = status === VaultStatus.Completed;
  const goalReached = !isCompleted && totalAssets >= targetAmount && targetAmount > 0n;

  const [showDeposit, setShowDeposit] = useState(false);

  const { withdrawGoal, status: wdStatus, txHash: wdHash, error: wdError, reset: wdReset } =
    useWithdrawalRequest(objective.address);

  function handleDepositSuccess() {
    setShowDeposit(false);
    onRefresh?.();
  }

  function handleWithdrawGoal() {
    withdrawGoal();
  }

  if (wdStatus === "confirmed") {
    onRefresh?.();
  }

  return (
    <div className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">{name}</h3>
          <p className="mt-0.5 text-xs text-foreground/50">
            {padrinhoLabel(padrinhoStatus, padrinho, pendingPadrinho)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          {isCompleted && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Completed
            </span>
          )}
          {goalReached && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              Goal reached
            </span>
          )}
        </div>
      </div>

      {/* Balance */}
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-2xl font-bold">${formatUsdc(totalAssets)}</span>
        <span className="text-sm text-foreground/50">/ ${formatUsdc(targetAmount)}</span>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-300"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="mt-1 text-right text-xs text-foreground/50">{pct}%</p>

      {/* Actions — hidden when completed */}
      {!isCompleted && (
        <div className="mt-4 space-y-3">
          {/* Goal reached — withdraw all */}
          {goalReached && (
            <div className="space-y-2">
              <p className="text-xs text-blue-700">
                Goal reached — full withdrawal available.
              </p>
              <button
                onClick={handleWithdrawGoal}
                disabled={wdStatus === "signing" || wdStatus === "submitted" || wdStatus === "confirmed"}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
              >
                Withdraw all
              </button>
              <TransactionStatus
                status={wdStatus}
                txHash={wdHash}
                errorCategory={wdError ? errorCategory(wdError) : undefined}
                errorMessage={wdError}
              />
              {wdStatus === "failed" && (
                <button onClick={wdReset} className="text-xs text-foreground/50 underline hover:text-foreground">
                  Try again
                </button>
              )}
            </div>
          )}

          {/* Deposit toggle — hidden when goal already reached */}
          {!goalReached && (
            <>
              {!showDeposit ? (
                <button
                  onClick={() => setShowDeposit(true)}
                  className="w-full rounded-lg border border-foreground/20 px-4 py-2 text-sm font-medium hover:bg-foreground/5"
                >
                  Deposit
                </button>
              ) : (
                <div className="rounded-lg border border-foreground/10 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium">Deposit USDC</span>
                    <button
                      onClick={() => setShowDeposit(false)}
                      className="text-xs text-foreground/40 hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>
                  <DepositForm
                    vaultAddress={objective.address}
                    onSuccess={handleDepositSuccess}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
