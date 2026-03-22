# Tasks: Padrinho MVP

**Input**: `specs/001-padrinho-mvp/plan.md`, `.specify/spec.md`

**Tests**: Per Padrinho Constitution and spec SC-004: Forge tests in Foundational phase; Vitest/RTL per web component; Playwright e2e in Polish phase.

**Organization**: Phases follow spec priorities — US1–US3 (P1) then US4–US6 (P2). Contracts and shared web shell are **Foundational** (no story label).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no ordering dependency on incomplete tasks in the same wave)
- **[USn]**: maps to User Story *n* in `.specify/spec.md`

### Path conventions (post-restructure)

The `web/` package uses **no `src/` prefix**. Template: `next-serwist-privy-embedded-wallet`. Auth: **Privy** + `@privy-io/wagmi`.

| Old path | Actual path |
|----------|-------------|
| `web/src/lib/` | `web/lib/` |
| `web/src/app/` | `web/app/` |
| `web/src/components/` | `web/app/components/` |
| `web/src/hooks/` | `web/hooks/` |
| `web/src/__tests__/` | `web/__tests__/` |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo layout, Next.js package, env template, linting

- [x] T001 Align `contract/foundry.toml` with plan (Monad Testnet chain ID 10143, RPC, optimizer, fuzz/invariant runs)
- [x] T002 Scaffold `web/` based on `next-serwist-privy-embedded-wallet` template (Next.js 14, App Router, Tailwind, Geist fonts, Serwist PWA, no `src/` prefix)
- [x] T003 Add root `pnpm-workspace.yaml` including package `web`
- [x] T004 [P] Create `web/.env.example` with `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_PRIVY_CLIENT_ID`, `NEXT_PUBLIC_CHAIN_ID=10143`, `NEXT_PUBLIC_FACTORY_ADDRESS`, `NEXT_PUBLIC_MOCK_USDC_ADDRESS`
- [ ] T005 [P] Add `prettier` + `.prettierrc` to `web/`; verify `eslint-config-next` + `@typescript-eslint` pass with zero errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Smart contracts, Forge tests, gas snapshot, deploy scripts, ABI export, Privy/wagmi shell

**⚠️ CRITICAL**: All contract tests green and `forge snapshot` updated before starting Phase 3

- [x] T006 Implement `contract/src/interfaces/IPadrinhoVault.sol` with full NatSpec, events, and storage notes
- [x] T007 [P] Implement `contract/src/mocks/MockUSDC.sol` (6 decimals, public `mint`, testnet-only)
- [x] T008 Implement `contract/src/PadrinhoVault.sol` (ERC-4626, ReentrancyGuard, FR-001–FR-012; `_padrinhoHint` in constructor)
- [x] T009 Implement `contract/src/PadrinhoFactory.sol` (`createObjective`, registry views)
- [x] T010 Remove sample `contract/src/Counter.sol` and its default test file
- [x] T011 [P] Add unit tests `contract/test/unit/PadrinhoVault.t.sol` (30 tests — all passing)
- [x] T012 [P] Add unit tests `contract/test/unit/PadrinhoFactory.t.sol` (10 tests — all passing)
- [x] T013 Add integration test `contract/test/integration/FullLifecycle.t.sol` (5 paths — all passing)
- ~~T014~~ ~~[P] Fuzz tests `contract/test/fuzz/FuzzDeposit.t.sol`~~ — **REMOVED** (deferred; fuzz file deleted; invariant tests cover accounting)
- [x] T015 Add invariant test `contract/test/invariant/VaultInvariant.t.sol` (2 invariants, 512 runs, 0 reverts — passing)
- [x] T016 Run `forge fmt`, `forge build`, `forge test` (45/45), commit gas snapshot
- [x] T017 [P] Implement `contract/script/HelperConfig.s.sol` (chain-aware USDC/factory addresses)
- [x] T018 Implement `contract/script/Deploy.s.sol` (MockUSDC then PadrinhoFactory; keystore-based broadcast)
- [x] T019 Copy ABIs → `web/lib/abis/{MockUSDC,PadrinhoVault,PadrinhoFactory}.json`
- [x] T020 Implement `web/lib/contracts.ts` (typed ABIs + `getAddresses(chainId)`)
- [x] T021 Implement `web/lib/wagmi.ts` (`@privy-io/wagmi` `createConfig`, Monad Testnet chain definition)
- [x] T022 Implement `web/app/components/privy-provider.tsx` (`PrivyProvider` + `WagmiProvider` + `QueryClientProvider`) and wire into `web/app/layout.tsx`
- [x] T023 Implement `web/app/components/TransactionStatus.tsx` (4 states: signing / submitted + explorer link / confirmed / failed; USER/NETWORK/CONTRACT error taxonomy)

**Checkpoint**: Contracts 45/45 green; ABIs in `web/lib/abis/`; Privy+wagmi providers mounted in layout ✓

---

## Phase 3: User Story 1 — Afilhado Creates a Savings Objective (Priority: P1)

**Goal**: Two-step create flow, optional padrinho invite, solo mode when blank, dashboard shows new objective with 0% progress

**Independent Test**: Create objective without padrinho → vault onchain + listed on afilhado dashboard with zero balance

### Tests for User Story 1

- [ ] T024 [P] [US1] Add Vitest + RTL tests `web/__tests__/components/CreateObjectiveForm.test.tsx` (step validation, self-address error, empty padrinho → solo mode)

### Implementation for User Story 1

- [x] T025 [US1] Implement `web/hooks/useCreateObjective.ts` — calls `PadrinhoFactory.createObjective` via `useWriteContract`; returns `{write, status, txHash, error}`
- [x] T026 [US1] Implement `web/app/components/CreateObjectiveForm.tsx` — step 1: name + target amount; step 2: optional padrinho address (validates non-self, non-zero format); wires `TransactionStatus`
- [x] T027 [US1] Implement `web/app/objective/new/page.tsx` — mounts form, redirects to `/dashboard` on confirmed tx
- [x] T028 [US1] Implement `web/hooks/useObjective.ts` — reads single vault state (name, balance, targetAmount, status, padrinhoStatus, withdrawalRequest) via `useReadContract` multicall
- [x] T029 [US1] Implement `web/hooks/useAfilhadoDashboard.ts` — reads `getObjectivesByAfilhado(address)` from factory, then `useObjective` per vault
- [x] T030 [US1] Implement `web/app/components/ObjectiveCard.tsx` — name, balance/target, progress bar %, padrinho status badge; minimal fields for US1
- [x] T031 [US1] Implement `web/app/dashboard/page.tsx` — detects connected wallet via `useAccount`; renders afilhado branch with `ObjectiveCard` list; shows empty state + "Create objective" CTA when list is empty

**Checkpoint**: US1 demonstrable end-to-end on testnet with Privy embedded wallet

---

## Phase 4: User Story 2 — Afilhado Deposits (Priority: P1)

**Goal**: USDC approve + deposit; progress bar updates; `GoalReached` UI when threshold met

**Independent Test**: Deposit into solo objective → balance + progress update onchain and in UI

### Tests for User Story 2

- [ ] T032 [P] [US2] Add Vitest + RTL tests `web/__tests__/components/DepositForm.test.tsx` (insufficient balance USER error, disabled when completed)

### Implementation for User Story 2

- [x] T033 [US2] Implement `web/hooks/useDeposit.ts` (allowance check → approve if needed → `deposit`; tx lifecycle; CONTRACT decode hint on revert)
- [x] T034 [US2] Implement `web/app/components/DepositForm.tsx` (amount input, USDC balance display, approve+deposit CTAs with `TransactionStatus`)
- [x] T035 [US2] Wire `DepositForm` into `ObjectiveCard` or dashboard modal

**Checkpoint**: US2 testable without padrinho acceptance flows

---

## Phase 5: User Story 3 — Goal Withdrawal (Priority: P1)

**Goal**: When `balance >= targetAmount`, afilhado withdraws full balance; objective becomes `completed` and read-only in UI

**Independent Test**: Reach target (via deposit), "Withdraw all", USDC received, UI read-only

### Tests for User Story 3

- [ ] T036 [P] [US3] Add Vitest tests `web/__tests__/hooks/useWithdrawalRequest.goal.test.tsx` (`withdrawGoal` happy path and completed-state guard)

### Implementation for User Story 3

- [x] T037 [US3] Implement `web/hooks/useWithdrawalRequest.ts` with `withdrawGoal` (calls vault `withdrawGoal`)
- [x] T038 [US3] Expose "Withdraw all" CTA on `ObjectiveCard` when `balance >= targetAmount`; show "Goal reached — full withdrawal available" copy; mark card read-only when `completed`

**Checkpoint**: US1–US3 form vertical MVP slice for afilhado solo journey

---

## Phase 6: User Story 4 — Padrinho Accepts Invitation (Priority: P2)

**Goal**: Padrinho dashboard lists pending invites; accept moves state to active padrinho visible to afilhado

**Independent Test**: Two wallets — accept invite → `PadrinhoAccepted` state in UI

### Tests for User Story 4

- [ ] T039 [P] [US4] Add Vitest + RTL `web/__tests__/components/InviteCard.test.tsx`

### Implementation for User Story 4

- [x] T040 [US4] Implement `web/hooks/usePadrinhoActions.ts` with `acceptInvite`; decline is UI-only (afilhado can cancel invite via `cancelInvite`)
- [x] T041 [US4] Implement `web/app/components/InviteCard.tsx` (accept CTA, objective summary, `TransactionStatus`)
- [x] T042 [US4] Implement `web/hooks/usePadrinhoDashboard.ts` and wire padrinho section in `web/app/dashboard/page.tsx`

**Checkpoint**: Invite lifecycle visible to both roles

---

## Phase 7: User Story 5 — Early Withdrawal Request (Priority: P2)

**Goal**: With active padrinho below goal, afilhado submits single pending request with optional message; solo path executes immediately

**Independent Test**: Request created → appears on padrinho dashboard; vault balance unchanged until approval

### Tests for User Story 5

- [ ] T043 [P] [US5] Add Vitest + RTL `web/__tests__/components/WithdrawalRequestForm.test.tsx` (amount > balance blocked, USER error)

### Implementation for User Story 5

- [x] T044 [US5] Extend `web/hooks/useWithdrawalRequest.ts` with `requestWithdrawal(amount, message)`
- [x] T045 [US5] Implement `web/app/components/WithdrawalRequestForm.tsx`
- [x] T046 [US5] Wire request CTA from afilhado `ObjectiveCard` when padrinho active and below goal

**Checkpoint**: Request visible to padrinho

---

## Phase 8: User Story 6 — Approve or Deny Request (Priority: P2)

**Goal**: Padrinho approves (transfer + history) or denies (funds stay + reply); history on afilhado view

**Independent Test**: Approve → USDC to afilhado; deny → balance unchanged

### Tests for User Story 6

- [ ] T047 [P] [US6] Add Vitest + RTL `web/__tests__/components/WithdrawalRequestCard.test.tsx`

### Implementation for User Story 6

- [x] T048 [US6] Extend `web/hooks/usePadrinhoActions.ts` with `approveWithdrawal` and `denyWithdrawal`
- [x] T049 [US6] Implement `web/app/components/WithdrawalRequestCard.tsx` (amount, afilhado message, approve/deny, reply field)
- [x] T050 [US6] Render pending requests on padrinho dashboard; show request history on afilhado `ObjectiveCard`

**Checkpoint**: Full accountability loop in UI

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Landing, public page, shared UI primitives, e2e, glossary, constitution checklist

- [ ] T051 [P] Implement `web/app/components/ui/{Button,Input,Badge,ProgressBar,Skeleton}.tsx` and refactor existing components to use them
- [x] T052 Implement `web/app/page.tsx` landing with Privy login CTA and redirect to `/dashboard` when connected
- [x] T053 Complete `web/app/dashboard/page.tsx` role-aware behavior (afilhado / padrinho / both tabs / empty state)
- [x] T054 Implement `web/app/objective/[id]/page.tsx` public read-only view (no wallet; skeleton loaders; < 3s on 4G)
- [ ] T055 [P] Add Playwright spec `web/__tests__/e2e/solo-path.spec.ts`
- [ ] T056 [P] Add Playwright spec `web/__tests__/e2e/accountability-path.spec.ts`
- [ ] T057 [P] Add Playwright spec `web/__tests__/e2e/denial-path.spec.ts`
- [ ] T058 [P] Add Playwright spec `web/__tests__/e2e/public-objective.spec.ts`
- [ ] T059 Add Playwright performance assertions (deposit UI ≤ 2s; public FCP < 3s)
- [ ] T060 [P] Add `docs/glossary.md` with terms per constitution III
- [ ] T061 Run final checklist from plan.md (forge, snapshot, tsc, eslint, prettier, pnpm audit, 375px, `.env.example` complete)

---

## Dependencies & Execution Order

- **Phase 1** → **Phase 2** → **Phases 3–8** → **Phase 9**
- US2–US3 depend on US1; US5–US6 depend on US4

---

## Task summary

| Phase | Task IDs | Count | Status |
|-------|----------|-------|--------|
| Setup | T001–T005 | 5 | 4 done; T005 open |
| Foundational | T006–T023 | 18 | 17 done; T014 removed |
| US1 | T024–T031 | 8 | 7 done; T024 open (Vitest) |
| US2 | T032–T035 | 4 | 3 done; T032 open (Vitest) |
| US3 | T036–T038 | 3 | 2 done; T036 open (Vitest) |
| US4 | T039–T042 | 4 | 3 done; T039 open (Vitest) |
| US5 | T043–T046 | 4 | 3 done; T043 open (Vitest) |
| US6 | T047–T050 | 4 | 3 done; T047 open (Vitest) |
| Polish | T051–T061 | 11 | 3 done (T052–T054); T051/T055–T061 open |
| **Total** | **T001–T061** | **60** | **47 done** |
