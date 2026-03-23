"use client";

import { useState, useEffect } from "react";
import type { ObjectiveData } from "@/hooks/useObjective";
import { PadrinhoStatus, VaultStatus } from "@/hooks/useObjective";
import { useWithdrawalRequest } from "@/hooks/useWithdrawalRequest";
import { DepositForm } from "@/app/components/DepositForm";
import { WithdrawalRequestForm } from "@/app/components/WithdrawalRequestForm";
import { CompletionMoment } from "@/app/components/CompletionMoment";
import { TransactionStatus } from "@/app/components/TransactionStatus";

function formatUsdc(raw: bigint): string {
  const dollars = Number(raw) / 1_000_000;
  return dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function progressPercent(balance: bigint, target: bigint): number {
  if (target === 0n) return 0;
  return Math.min(Number((balance * 100n) / target), 100);
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

interface ObjectiveCardProps {
  objective: ObjectiveData;
  onRefresh?: () => void;
}

type Panel = "none" | "deposit" | "request";

export function ObjectiveCard({ objective, onRefresh }: ObjectiveCardProps) {
  const { name, totalAssets, targetAmount, status, padrinhoStatus, padrinho, pendingPadrinho, withdrawalRequest } =
    objective;

  const pct = progressPercent(totalAssets, targetAmount);
  const isCompleted = status === VaultStatus.Completed;
  const goalReached = !isCompleted && totalAssets >= targetAmount && targetAmount > 0n;
  const hasPadrinho = padrinhoStatus === PadrinhoStatus.Active;
  const belowGoal = !goalReached && !isCompleted;
  const canRequestWithdrawal = hasPadrinho && belowGoal && !withdrawalRequest.exists;

  const [panel, setPanel] = useState<Panel>("none");

  const { withdrawGoal, status: wdStatus, txHash: wdHash, error: wdError, reset: wdReset } =
    useWithdrawalRequest(objective.address);

  useEffect(() => {
    if (wdStatus === "confirmed") onRefresh?.();
  }, [wdStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isCompleted) {
    return <CompletionMoment objective={objective} />;
  }

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>
            {name}
          </h3>
          <p className="mt-0.5 text-xs text-white/40">
            {padrinhoLabel(padrinhoStatus, padrinho, pendingPadrinho)}
          </p>
        </div>
        {goalReached && (
          <span
            className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
            style={{ borderColor: "#a9cbff", color: "#a9cbff" }}
          >
            Goal reached
          </span>
        )}
      </div>

      {/* Balance */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold gradient-text" style={{ letterSpacing: "-0.03em" }}>
          ${formatUsdc(totalAssets)}
        </span>
        <span className="text-sm text-white/40">/ ${formatUsdc(targetAmount)}</span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full gradient-bar transition-all duration-300"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <p className="mt-1 text-right text-xs text-white/30">{pct}%</p>
      </div>

      {/* Pending withdrawal request */}
      {withdrawalRequest.exists && !isCompleted && (
        <div
          className="rounded-xl border px-3 py-2.5"
          style={{ borderColor: "rgba(255,214,170,0.3)", background: "rgba(255,214,170,0.05)" }}
        >
          <p className="text-xs font-medium" style={{ color: "var(--warning)" }}>
            Withdrawal request pending — ${formatUsdc(withdrawalRequest.amount)}
          </p>
          <p className="mt-0.5 text-xs text-white/40">Waiting for padrinho response.</p>
        </div>
      )}

      {/* Actions */}
      {!isCompleted && (
        <div className="space-y-3">
          {goalReached && (
            <div className="space-y-2">
              <p className="text-xs text-white/50">Goal reached — full withdrawal available.</p>
              <button
                onClick={() => withdrawGoal()}
                disabled={wdStatus === "signing" || wdStatus === "submitted" || wdStatus === "confirmed"}
                className="btn-primary w-full"
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
                <button onClick={wdReset} className="text-xs text-white/40 underline hover:text-white">
                  Try again
                </button>
              )}
            </div>
          )}

          {belowGoal && !withdrawalRequest.exists && (
            <div className="flex gap-2">
              <button
                onClick={() => setPanel(panel === "deposit" ? "none" : "deposit")}
                className="btn-ghost flex-1"
              >
                Deposit
              </button>
              {canRequestWithdrawal && (
                <button
                  onClick={() => setPanel(panel === "request" ? "none" : "request")}
                  className="btn-ghost flex-1"
                >
                  Request withdrawal
                </button>
              )}
            </div>
          )}

          {panel === "deposit" && (
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.03)" }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-white/70">Deposit USDC</span>
                <button
                  onClick={() => setPanel("none")}
                  className="text-xs text-white/30 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <DepositForm
                vaultAddress={objective.address}
                onSuccess={() => { setPanel("none"); onRefresh?.(); }}
              />
            </div>
          )}

          {panel === "request" && (
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.03)" }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-white/70">Request early withdrawal</span>
                <button
                  onClick={() => setPanel("none")}
                  className="text-xs text-white/30 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <WithdrawalRequestForm
                vaultAddress={objective.address}
                maxAmount={totalAssets}
                onSuccess={() => { setPanel("none"); onRefresh?.(); }}
                onCancel={() => setPanel("none")}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
