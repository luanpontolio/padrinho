# Tasks: Padrinho MVP

**Input**: `specs/001-padrinho-mvp/plan.md`, `.specify/spec.md` (feature spec; not co-located in `specs/`)

**Prerequisites**: plan.md ✓ · spec.md ✓ · research.md · data-model.md · contracts/ — optional; tasks derived from plan phases + spec user stories

**Tests**: Per Padrinho Constitution and spec SC-004: Forge tests in Foundational phase; Vitest/RTL per web component; Playwright e2e in Polish phase.

**Organization**: Phases follow spec priorities — US1–US3 (P1) then US4–US6 (P2). Contracts and shared web shell are **Foundational** (no story label).

**Note**: `check-prerequisites.sh` expects git branch `001-padrinho-mvp`. On `main`, run from that branch or set `SPECIFY_FEATURE=001-padrinho-mvp` if your tooling supports it.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no ordering dependency on incomplete tasks in the same wave)
- **[USn]**: maps to User Story *n* in `.specify/spec.md`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo layout, Next.js package, env template, linting

- [ ] T001 Align `contract/foundry.toml` with plan (Monad Testnet chain ID 10143, RPC, optimizer settings)
- [ ] T002 Scaffold `web/` with Next.js 14+ App Router, TypeScript, Tailwind, ESLint (`pnpm create next-app web` per plan Phase 4)
- [ ] T003 Add root `pnpm-workspace.yaml` including package `web` (if not already present at repo root)
- [ ] T004 [P] Create `web/.env.example` with `NEXT_PUBLIC_FACTORY_ADDRESS`, `NEXT_PUBLIC_CHAIN_ID=10143`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_MOCK_USDC_ADDRESS` placeholders
- [ ] T005 [P] Configure Prettier + ESLint for `web/` (`eslint-config-next`, `@typescript-eslint`, no `any` without comment per plan)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Smart contracts, Forge tests, gas snapshot, deploy scripts, ABI export, wagmi shell — **no user story work before this completes**

**⚠️ CRITICAL**: All contract tests green and `forge snapshot` updated before starting Phase 3

- [ ] T006 Implement `contract/src/interfaces/IPadrinhoVault.sol` with full NatSpec, events, and storage notes per plan Phase 0
- [ ] T007 [P] Implement `contract/src/mocks/MockUSDC.sol` (6 decimals, public `mint`, testnet-only)
- [ ] T008 Implement `contract/src/PadrinhoVault.sol` (ERC-4626, ReentrancyGuard, FR-001–FR-012, invite accept/decline/cancel invite per spec edge cases)
- [ ] T009 Implement `contract/src/PadrinhoFactory.sol` (`createObjective`, registry views per plan Phase 1)
- [ ] T010 Remove sample `contract/src/Counter.sol` and any default test-only references if present (keep Foundry layout clean)
- [ ] T011 [P] Add unit tests `contract/test/unit/PadrinhoVault.t.sol` covering create, invite, self-invite revert, accept/decline, deposits, goal, requests, approve/deny, completed reverts
- [ ] T012 [P] Add unit tests `contract/test/unit/PadrinhoFactory.t.sol` (deploy, registry, lookups by afilhado/padrinho)
- [ ] T013 Add integration test `contract/test/integration/FullLifecycle.t.sol` (full accountability path + solo + goal path per plan)
- [ ] T014 [P] Add fuzz tests `contract/test/fuzz/FuzzDeposit.t.sol` for deposit and request amounts (`forge test --fuzz-runs 10000` locally before merge)
- [ ] T015 Add invariant test `contract/test/invariant/VaultInvariant.t.sol` (`totalAssets` vs USDC `balanceOf(vault)` per plan)
- [ ] T016 Run `forge fmt`, `forge build`, `forge test`, commit gas snapshot at `contract/` root per constitution
- [ ] T017 [P] Implement `contract/script/HelperConfig.s.sol` (chain-aware USDC/factory addresses)
- [ ] T018 Implement `contract/script/Deploy.s.sol` (MockUSDC then PadrinhoFactory; keystore-based broadcast per plan)
- [ ] T019 Copy deployment ABIs from `contract/out/MockUSDC.sol/MockUSDC.json`, `contract/out/PadrinhoVault.sol/PadrinhoVault.json`, `contract/out/PadrinhoFactory.sol/PadrinhoFactory.json` into `web/src/lib/abis/`
- [ ] T020 Implement `web/src/lib/contracts.ts` (typed ABIs + address map keyed by `chainId`)
- [ ] T021 Implement `web/src/lib/wagmi.ts` (`createConfig`, Monad Testnet chain, `injected()` + `walletConnect({ projectId })` from `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`)
- [ ] T022 Add `web/src/app/providers.tsx` (`QueryClientProvider`, `WagmiProvider`) and wrap children in `web/src/app/layout.tsx` (client boundary as needed for SSR)
- [ ] T023 Implement `web/src/components/TransactionStatus.tsx` (four states: pending signature, submitted + explorer link, confirmed, failed) per spec FR-015 / constitution III

**Checkpoint**: Contracts deployable; ABIs in web; wallet providers ready — begin user story phases

---

## Phase 3: User Story 1 — Afilhado Creates a Savings Objective (Priority: P1)

**Goal**: Two-step create flow, optional padrinho invite, solo mode when blank, dashboard shows new objective with 0% progress

**Independent Test**: Create objective without padrinho → vault onchain + listed on afilhado dashboard with zero balance

### Tests for User Story 1

> Write/adjust tests first where practical; mock wagmi/viem in CI per constitution

- [ ] T024 [P] [US1] Add Vitest + RTL tests `web/src/__tests__/components/CreateObjectiveForm.test.tsx` (validation, two-step flow, error taxonomy hooks)

### Implementation for User Story 1

- [ ] T025 [US1] Implement `web/src/hooks/useCreateObjective.ts` calling `PadrinhoFactory.createObjective` with tx lifecycle shape from plan Phase 5
- [ ] T026 [US1] Implement `web/src/components/CreateObjectiveForm.tsx` (step 1: name + target; step 2: optional padrinho address with validation per spec scenarios 4–5)
- [ ] T027 [US1] Implement `web/src/app/objective/new/page.tsx` wiring form, `TransactionStatus`, redirect to `/dashboard` on success
- [ ] T028 [US1] Implement `web/src/hooks/useObjective.ts` (read vault state via viem/multicall for one address)
- [ ] T029 [US1] Implement `web/src/hooks/useAfilhadoDashboard.ts` (`getObjectivesByAfilhado` + per-vault reads)
- [ ] T030 [US1] Implement `web/src/components/ObjectiveCard.tsx` (name, balance, progress bar, padrinho status badge — minimal fields for US1)
- [ ] T031 [US1] Implement `web/src/app/dashboard/page.tsx` afilhado branch: list `ObjectiveCard` for connected wallet’s objectives (role-only slice; full role-aware polish in Phase 10)

**Checkpoint**: US1 demonstrable end-to-end on testnet with injected or WalletConnect

---

## Phase 4: User Story 2 — Afilhado Deposits (Priority: P1)

**Goal**: USDC approve + deposit; progress bar updates; `GoalReached` UI when threshold met

**Independent Test**: Deposit into solo objective → balance + progress update onchain and in UI

### Tests for User Story 2

- [ ] T032 [P] [US2] Add Vitest + RTL tests `web/src/__tests__/components/DepositForm.test.tsx` (insufficient balance `USER` error, disabled when completed)

### Implementation for User Story 2

- [ ] T033 [US2] Implement `web/src/hooks/useDeposit.ts` (allowance check, approve if needed, `deposit`, tx lifecycle + `CONTRACT` decode hint on revert per spec edge case)
- [ ] T034 [US2] Implement `web/src/components/DepositForm.tsx` (amount input, USDC balance display, CTAs with `TransactionStatus`)
- [ ] T035 [US2] Wire `DepositForm` from `web/src/components/ObjectiveCard.tsx` or dashboard modal per plan Phase 7

**Checkpoint**: US2 testable without padrinho acceptance flows

---

## Phase 5: User Story 3 — Goal Withdrawal (Priority: P1)

**Goal**: When `balance >= targetAmount`, afilhado withdraws full balance; objective becomes `completed` and read-only in UI

**Independent Test**: Reach target (via deposit), “Withdraw all”, USDC received, UI read-only

### Tests for User Story 3

- [ ] T036 [P] [US3] Add Vitest tests `web/src/__tests__/hooks/useWithdrawalRequest.goal.test.tsx` (or component test) for `withdrawGoal` happy path and completed-state guard

### Implementation for User Story 3

- [ ] T037 [US3] Extend `web/src/hooks/useWithdrawalRequest.ts` with `withdrawGoal` (calls vault `withdrawGoal` / plan naming)
- [ ] T038 [US3] Expose “Withdraw all” / goal CTA on `web/src/components/ObjectiveCard.tsx` when goal reached; show “Goal reached — full withdrawal available” copy per spec

**Checkpoint**: US1–US3 form vertical MVP slice for afilhado solo journey

---

## Phase 6: User Story 4 — Padrinho Accepts Invitation (Priority: P2)

**Goal**: Padrinho dashboard lists pending invites; accept moves state to active padrinho visible to afilhado

**Independent Test**: Two wallets — accept invite → `PadrinhoAccepted` equivalent state in UI

### Tests for User Story 4

- [ ] T039 [P] [US4] Add Vitest + RTL `web/src/__tests__/components/InviteCard.test.tsx`

### Implementation for User Story 4

- [ ] T040 [US4] Implement `web/src/hooks/usePadrinhoActions.ts` with `acceptInvite` and decline/ignore behavior per spec US4 (on-chain decline if implemented in T008; otherwise UI-only decline)
- [ ] T041 [US4] Implement `web/src/components/InviteCard.tsx` (accept / decline CTAs, objective summary)
- [ ] T042 [US4] Implement `web/src/hooks/usePadrinhoDashboard.ts` and wire `web/src/app/padrinho/page.tsx` OR padrinho section of `web/src/app/dashboard/page.tsx` per plan Phase 7

**Checkpoint**: Invite lifecycle visible to both roles

---

## Phase 7: User Story 5 — Early Withdrawal Request (Priority: P2)

**Goal**: With active padrinho below goal, afilhado submits single pending request with optional message; solo path executes immediately per spec

**Independent Test**: Request created → appears on padrinho dashboard; vault balance unchanged until approval

### Tests for User Story 5

- [ ] T043 [P] [US5] Add Vitest + RTL `web/src/__tests__/components/WithdrawalRequestForm.test.tsx` (amount > balance blocked, `USER` error)

### Implementation for User Story 5

- [ ] T044 [US5] Extend `web/src/hooks/useWithdrawalRequest.ts` with `requestWithdrawal(amount, message)` and solo-mode immediate path handling
- [ ] T045 [US5] Implement `web/src/components/WithdrawalRequestForm.tsx`
- [ ] T046 [US5] Wire request CTA from afilhado `ObjectiveCard` / dashboard when padrinho active and below goal

**Checkpoint**: Request visible to padrinho

---

## Phase 8: User Story 6 — Approve or Deny Request (Priority: P2)

**Goal**: Padrinho approves (transfer + history) or denies (funds stay + reply message); history on afilhado view

**Independent Test**: Approve → USDC to afilhado; deny → balance unchanged

### Tests for User Story 6

- [ ] T047 [P] [US6] Add Vitest + RTL `web/src/__tests__/components/WithdrawalRequestCard.test.tsx`

### Implementation for User Story 6

- [ ] T048 [US6] Extend `web/src/hooks/usePadrinhoActions.ts` with `approveWithdrawal` and `denyWithdrawal` (+ optional reply) per plan
- [ ] T049 [US6] Implement `web/src/components/WithdrawalRequestCard.tsx` (amount, afilhado message, approve/deny, reply field)
- [ ] T050 [US6] Render pending requests on padrinho dashboard; show request history on afilhado `ObjectiveCard` / dashboard per spec US6 scenario 4

**Checkpoint**: Full accountability loop in UI

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Landing, public page, shared UI primitives, e2e, glossary, constitution checklist

- [ ] T051 [P] Implement `web/src/components/ui/Button.tsx`, `web/src/components/ui/Input.tsx`, `web/src/components/ui/Badge.tsx`, `web/src/components/ui/ProgressBar.tsx`, `web/src/components/ui/Skeleton.tsx` and refactor existing components to use them
- [ ] T052 Implement `web/src/app/page.tsx` landing with connect UI (**injected** + **WalletConnect** buttons) and redirect to `/dashboard` when connected per plan
- [ ] T053 Complete `web/src/app/dashboard/page.tsx` role-aware behavior (afilhado / padrinho / both tabs / empty state per plan Phase 7)
- [ ] T054 Implement `web/src/app/objective/[id]/page.tsx` public read-only view (no wallet; skeleton loaders; under 3s target on 4G per NFR — assert in e2e)
- [ ] T055 [P] Add Playwright spec `web/src/__tests__/e2e/solo-path.spec.ts` (create → deposit → goal → withdraw)
- [ ] T056 [P] Add Playwright spec `web/src/__tests__/e2e/accountability-path.spec.ts` (invite → accept → deposit → request → approve)
- [ ] T057 [P] Add Playwright spec `web/src/__tests__/e2e/denial-path.spec.ts` (request → deny → funds remain)
- [ ] T058 [P] Add Playwright spec `web/src/__tests__/e2e/public-objective.spec.ts` (no-wallet `/objective/[id]`)
- [ ] T059 Add Playwright performance assertions (deposit UI ≤2s after inclusion; public FCP budget) per plan Phase 8
- [ ] T060 [P] Add `docs/glossary.md` with terms *afilhado*, *padrinho*, *objective*, *goal*, *withdrawal request* per constitution III
- [ ] T061 Run final checklist from `specs/001-padrinho-mvp/plan.md` (forge, snapshot, tsc, eslint, prettier, pnpm audit, 375px viewport, `.env.example` complete)

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1** → **Phase 2** → **Phases 3–8** (US1 → US2 → US3 → US4 → US5 → US6) → **Phase 9**
- **US2–US3** depend on **US1** (need vault + dashboard shell)
- **US5–US6** depend on **US4** for guarded early withdrawal path (solo US5 scenario can be tested before US4 using solo objectives)

### User story dependencies

- **US1**: after Foundational
- **US2, US3**: after US1
- **US4**: after US1 (invites from create flow)
- **US5**: after US4 for padrinho-guarded path; solo immediate-withdraw subset testable after US1–US2
- **US6**: after US5

### Parallel opportunities

- T007, T011, T012, T014, T017 can run in parallel once T006 exists
- Contract test files T011–T015 parallelizable after T008–T009 stubs exist
- Per-story `[P]` test tasks can run alongside prep for the same story’s implementation tasks
- Playwright specs T055–T058 parallel in CI after app is feature-complete

---

## Parallel Example: User Story 1

```bash
# After T025–T026 stubs exist, in parallel:
Task T024  # CreateObjectiveForm tests
Task T028  # useObjective (reads only)
```

---

## Implementation Strategy

### MVP first (US1 only after Foundational)

1. Complete Phase 1–2
2. Complete Phase 3 (US1)
3. **STOP and validate** on testnet: create solo objective + dashboard list

### Incremental delivery

1. US1 → US2 → US3 (afilhado solo product)
2. US4 → US5 → US6 (accountability)

### Suggested MVP scope

- **Minimum shippable demo**: Phases **1–2** + **Phase 3 (US1)** — create objective and see it on dashboard (0% progress)

---

## Task summary

| Phase | Task IDs | Count |
|-------|----------|-------|
| Setup | T001–T005 | 5 |
| Foundational | T006–T023 | 18 |
| US1 | T024–T031 | 8 |
| US2 | T032–T035 | 4 |
| US3 | T036–T038 | 3 |
| US4 | T039–T042 | 4 |
| US5 | T043–T046 | 4 |
| US6 | T047–T050 | 4 |
| Polish | T051–T061 | 11 |
| **Total** | **T001–T061** | **61** |

**Parallel opportunities**: 18 tasks marked `[P]` (see table above for waves).

**Independent test criteria**: Copied per phase from `.specify/spec.md` user stories.

**Format validation**: All lines use `- [ ] Tnnn` with file paths in descriptions; `[USn]` only on story phases 3–8.
