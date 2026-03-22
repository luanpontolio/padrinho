# Feature Specification: Padrinho MVP

**Feature Branch**: `001-padrinho-mvp`
**Created**: 2026-03-22
**Status**: Draft
**Input**: User description: "MVP DApp where a user can save money and add a padrinho (godfather) to protect against withdrawals. Two views: afilhado (saver) and padrinho (guardian)."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Afilhado Creates a Savings Objective (Priority: P1)

The afilhado connects their wallet (browser extension or WalletConnect), fills in the objective name and target amount, and saves. The system deploys a dedicated ERC-4626 vault for that objective. Optionally, the afilhado provides a wallet address to invite a padrinho. After completing the flow, the objective appears on the afilhado dashboard ready to receive deposits.

**Why this priority**: This is the core of the product. Without creating an objective there is no vault, no padrinho, and no savings. Every other story depends on this flow.

**Independent Test**: Can be fully tested by creating an objective without a padrinho — the vault is deployed onchain and the objective appears on the afilhado dashboard with zero balance and 0% progress.

**Acceptance Scenarios**:

1. **Given** a connected wallet with no existing objectives, **When** the afilhado fills in the objective name and target amount and saves, **Then** an ERC-4626 vault is deployed onchain with `afilhado = msg.sender`, `targetAmount` set, and `balance = 0`.
2. **Given** the newly created objective, **When** the afilhado enters a padrinho wallet address in the optional field and saves, **Then** the contract registers the address as `pendingPadrinho` and emits a `PadrinhoInvited` event.
3. **Given** the padrinho field is left blank, **When** the afilhado saves without filling it in, **Then** the objective is created in solo mode (no padrinho) and allows free withdrawal at any time.
4. **Given** an invalid address in the padrinho field, **When** the afilhado attempts to save, **Then** the frontend shows a validation error before submitting any transaction.
5. **Given** the afilhado's own address entered as padrinho, **When** the afilhado attempts to save, **Then** the contract reverts and the frontend displays a `USER` error explaining self-assignment is not allowed.

---

### User Story 2 - Afilhado Deposits Into an Objective (Priority: P1)

The afilhado selects an existing objective and deposits USDC. The vault balance updates and the progress bar reflects the new percentage toward `targetAmount`. If `balance >= targetAmount` after the deposit, the objective is automatically marked as goal reached.

**Why this priority**: Deposit is the most frequent action and the heartbeat of the savings experience. Without it the vault is inert.

**Independent Test**: Can be fully tested by depositing any amount into a solo objective (no padrinho) and verifying the onchain balance increase and progress bar update in the UI.

**Acceptance Scenarios**:

1. **Given** an active objective with balance below the target, **When** the afilhado approves USDC spending and submits a deposit, **Then** the vault mints ERC-4626 shares, `balance` increases, and the progress bar updates.
2. **Given** a deposit that brings balance exactly to the target, **When** the transaction confirms, **Then** the contract emits `GoalReached` and the UI displays "Goal reached — full withdrawal available".
3. **Given** the afilhado has insufficient USDC balance, **When** they attempt to deposit, **Then** the frontend blocks the action before signature and displays a `USER` error.
4. **Given** an objective in `completed` status, **When** the afilhado attempts a deposit, **Then** the transaction reverts with a descriptive reason string.

---

### User Story 3 - Automatic Withdrawal When Goal Is Reached (Priority: P1)

When `balance >= targetAmount`, the afilhado can withdraw the full balance at any time without padrinho approval. The objective is then marked `completed` and becomes read-only.

**Why this priority**: This is the reward for saving behavior. Removing friction on a successful withdrawal is essential to the motivational loop and is the primary exit path.

**Independent Test**: Can be fully tested by reaching the target balance and clicking "Withdraw all" — verifying USDC arrives in the afilhado wallet without any approval request and the objective transitions to `completed`.

**Acceptance Scenarios**:

1. **Given** `balance >= targetAmount`, **When** the afilhado clicks "Withdraw all", **Then** the contract transfers the full balance to the afilhado without consulting the padrinho and emits `GoalWithdrawn`.
2. **Given** a successful goal withdrawal, **When** the transaction confirms, **Then** the objective status changes to `completed` and becomes read-only.
3. **Given** an objective in `completed` status, **When** any party attempts to deposit, withdraw, or create a withdrawal request, **Then** all transactions revert.

---

### User Story 4 - Padrinho Accepts the Invitation (Priority: P2)

The padrinho connects their wallet and sees pending invitations on their dashboard. They accept an invitation from an afilhado, becoming the active guardian of that objective.

**Why this priority**: Without acceptance the padrinho role has no effect. This story activates the accountability mechanism that differentiates Padrinho from a plain savings vault.

**Independent Test**: Can be fully tested with two distinct wallet addresses — after acceptance the objective transitions from `pendingPadrinho` to `padrinho active` and the padrinho appears on the afilhado's objective view.

**Acceptance Scenarios**:

1. **Given** a pending invitation visible on the padrinho dashboard, **When** the padrinho accepts, **Then** the contract sets `padrinho = pendingPadrinho`, clears `pendingPadrinho`, and emits `PadrinhoAccepted`.
2. **Given** a pending invitation, **When** the padrinho declines or ignores it, **Then** the objective remains in solo mode (free withdrawal allowed).
3. **Given** an already active padrinho on an objective, **When** a second accept attempt is made for the same objective, **Then** the transaction reverts.

---

### User Story 5 - Afilhado Requests an Early Withdrawal (Priority: P2)

With an active padrinho and balance below the target, the afilhado submits a withdrawal request specifying the amount and an optional message explaining the reason. Funds remain locked until the padrinho responds.

**Why this priority**: This is the core social accountability mechanism. It forces the afilhado to articulate the reason for early exit and surfaces it to the padrinho.

**Independent Test**: Can be fully tested by submitting a withdrawal request and verifying funds remain in the vault and the request appears on the padrinho dashboard.

**Acceptance Scenarios**:

1. **Given** an active padrinho and balance below the target, **When** the afilhado submits a request with amount and optional message, **Then** the contract records a `WithdrawalRequest` with status `pending` and emits `WithdrawalRequested`.
2. **Given** an existing `pending` request, **When** the afilhado attempts to create another request, **Then** the transaction reverts.
3. **Given** a solo objective (no active padrinho), **When** the afilhado requests a withdrawal, **Then** the withdrawal is processed immediately without approval.
4. **Given** a requested amount greater than the current balance, **When** the afilhado attempts to submit, **Then** the frontend validates and blocks before signature with a `USER` error.

---

### User Story 6 - Padrinho Approves or Denies a Withdrawal Request (Priority: P2)

The padrinho accesses their dashboard, reviews the pending request showing the requested amount and the afilhado's message, and responds with an approval or denial plus an optional reply message.

**Why this priority**: Closes the accountability loop. This is the unique value delivery of Padrinho over a plain savings contract.

**Independent Test**: Can be fully tested by approving a pending request and verifying USDC reaches the afilhado wallet and the vault balance decreases; then testing denial and verifying the balance is unchanged.

**Acceptance Scenarios**:

1. **Given** a `pending` request on the padrinho dashboard, **When** the padrinho approves, **Then** the contract transfers the requested amount to the afilhado, the request status changes to `approved`, and `WithdrawalApproved` is emitted.
2. **Given** a `pending` request, **When** the padrinho denies with an optional message, **Then** funds remain in the vault, the request status changes to `denied`, and `WithdrawalDenied` is emitted.
3. **Given** the padrinho with a pending request active, **When** they attempt to resign from the objective, **Then** the transaction reverts with `PendingRequestExists`.
4. **Given** an approved request, **When** the afilhado views their dashboard, **Then** they see the request history with status `approved` and the padrinho's reply message.

---

### Edge Cases

- What happens when the padrinho address is the same as the afilhado? → Contract MUST revert on objective creation.
- What happens if the afilhado cancels the padrinho invitation before it is accepted? → Invite is cancelled; objective reverts to solo mode.
- What happens if the network is congested and a transaction takes longer than expected? → UI MUST maintain `pending signature` / `submitted` state with tx hash linked to explorer and MUST NOT block unrelated actions.
- What happens if USDC allowance expires between approve and deposit? → Contract reverts; frontend decodes the revert reason and displays a `CONTRACT` error prompting the user to re-approve.
- What happens with an objective that never reaches its target and has no padrinho? → Afilhado can withdraw freely at any time.
- What happens if the padrinho's wallet is compromised or unresponsive? → [NEEDS CLARIFICATION: timeout / escalation mechanism not yet defined for v1 — afilhado may be locked indefinitely on an early withdrawal request]

---

## Requirements *(mandatory)*

### Functional Requirements

**Smart Contract**

- **FR-001**: System MUST allow any address to create an objective with a `name` (string) and `targetAmount` (uint256 in USDC, 6 decimals).
- **FR-002**: Each objective MUST be backed by its own ERC-4626 vault contract that accepts USDC as the underlying asset.
- **FR-003**: The afilhado MUST be able to invite a padrinho by providing a wallet address; the invite remains in `pending` state until accepted.
- **FR-004**: The padrinho MUST be able to accept or decline pending invitations.
- **FR-005**: The afilhado MUST be able to deposit any USDC amount into the vault at any time while the objective is active.
- **FR-006**: System MUST automatically check if `balance >= targetAmount` on every deposit and emit `GoalReached` when the condition is met.
- **FR-007**: With an active padrinho and balance below the target, the afilhado MUST submit a `WithdrawalRequest` to withdraw; only one `pending` request per objective is allowed at a time.
- **FR-008**: The padrinho MUST be able to approve or deny a `WithdrawalRequest`; approval MUST execute the transfer atomically in the same transaction.
- **FR-009**: The padrinho MUST NOT be able to initiate fund transfers, modify `targetAmount`, or resign while a `pending` withdrawal request exists.
- **FR-010**: When `balance >= targetAmount`, the afilhado MUST be able to withdraw the full balance without padrinho approval.
- **FR-011**: After a goal withdrawal, the objective MUST be marked `completed` and become read-only.
- **FR-012**: In solo mode (no active padrinho), the afilhado MUST be able to withdraw freely at any time.

**Frontend**

- **FR-013**: The frontend MUST render two distinct dashboard views — **Afilhado Dashboard** and **Padrinho Dashboard** — determined by the connected wallet address.
- **FR-014**: The objective creation flow MUST be split into two steps: (1) name and target amount; (2) optional padrinho address.
- **FR-015**: Every transaction-triggering action MUST communicate four lifecycle states — *awaiting signature*, *submitted* (with explorer-linked tx hash), *confirmed*, *failed* — via a shared `TransactionStatus` component.
- **FR-016**: The Afilhado Dashboard MUST display: objective list, current balance per objective, percentage progress bar, padrinho status, and withdrawal request history.
- **FR-017**: The Padrinho Dashboard MUST display: objectives under guardianship, balance and progress per objective, pending withdrawal requests with amount and afilhado message, and decision history.
- **FR-018**: A public objective view (no wallet required) MUST be accessible via shareable URL and display name, balance, and progress — without exposing sensitive data.

### Key Entities *(include if feature involves data)*

- **Objective**: Represents the savings goal. Key attributes: `id`, `name`, `targetAmount`, `balance`, `status` (`active` | `completed`), `afilhado` (address), `padrinho` (address | null), `padrinhoStatus` (`none` | `pending` | `active`).
- **Vault**: ERC-4626 contract deployed 1-to-1 with an Objective. Accepts USDC as asset; mints shares to the afilhado on deposit.
- **WithdrawalRequest**: Early withdrawal request. Key attributes: `id`, `objectiveId`, `amount`, `message` (optional), `status` (`pending` | `approved` | `denied`), `responseMessage` (optional), `createdAt`, `resolvedAt`.
- **PadrinhoInvite**: Pending padrinho invitation. Key attributes: `objectiveId`, `invitedAddress`, `status` (`pending` | `accepted` | `rejected`).

### Non-Functional Requirements *(constitution: UX consistency & performance)*

- **NFR-001 (UX)**: All user-visible copy, error messages, and primary flows MUST use consistent product terminology: *afilhado*, *padrinho*, *objective*, *goal*, *withdrawal*, *withdrawal request*. Errors MUST indicate category (`USER` / `NETWORK` / `CONTRACT`) and suggest a next step.
- **NFR-002 (UX)**: All UI interactions MUST reuse established component patterns (e.g., shared `TransactionStatus`); any new component that deviates from existing patterns MUST be documented as a design exception.
- **NFR-003 (Performance)**: Deposit confirmation MUST be visible in the UI within 2 s of block inclusion on Monad Testnet (400 ms block time). The frontend MUST NOT issue more than 3 RPC calls per page render.
- **NFR-004 (Performance)**: Under RPC failure or chain congestion, the UI MUST display a degraded state with a retry option rather than silently stalling. Gas per critical operation (deposit, approve withdrawal) MUST be documented via `forge snapshot` and MUST NOT exceed 150,000 gas each.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An afilhado can create an objective, optionally add a padrinho, and make a first deposit in a single flow requiring no more than 3 onchain transactions.
- **SC-002**: Deposit confirmation is reflected in the UI within 2 s of block inclusion on Monad Testnet.
- **SC-003**: A withdrawal request submitted by the afilhado appears on the padrinho dashboard without requiring a manual page reload.
- **SC-004**: 100% of critical paths (create objective, deposit, create withdrawal request, approve/deny, goal withdrawal) have Forge test coverage (unit + integration) before merge.
- **SC-005**: The full end-to-end flow — objective creation through goal withdrawal — is executable on testnet by a user with no prior blockchain experience.
- **SC-006**: Gas cost per operation is committed via `forge snapshot`; deposit and withdrawal approval MUST NOT exceed 150,000 gas each.
- **SC-007**: The public objective view loads without a connected wallet in under 3 s on a simulated 4G connection.
