# Implementation Plan: Padrinho MVP

**Branch**: `001-padrinho-mvp` | **Date**: 2026-03-22 | **Spec**: `.specify/spec.md`
**Input**: Feature specification from `.specify/spec.md`

---

## Summary

Build the Padrinho MVP — a DApp on Monad Testnet where a saver (afilhado) creates an ERC-4626 vault-backed savings objective, optionally assigns a trusted guardian (padrinho), and receives accountability on early withdrawals. The padrinho can approve or deny withdrawal requests; when the savings goal is reached the afilhado withdraws freely. The monorepo splits into `contract/` (Foundry + Solidity) for all onchain logic and `web/` (Next.js + TypeScript) for the frontend, using **wagmi + viem** with **WalletConnect v2** and **injected** browser wallets (e.g. MetaMask) for the MVP.

---

## Technical Context

**Language/Version**: Solidity `^0.8.20` (contract) · TypeScript 5+ / Node 20+ (web)
**Primary Dependencies**:
- Contract: Foundry (latest), OpenZeppelin Contracts 5.x (ERC-4626, ReentrancyGuard, Ownable), USDC mock for tests
- Web: Next.js 14+, `wagmi`, `viem`, `@tanstack/react-query`, WalletConnect v2 (`walletConnect` connector + `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`), `injected` connector, Tailwind CSS v3, ESLint + Prettier

**Storage**: Onchain state only — no off-chain database in v1. Frontend reads contract state via viem RPC calls.

**Testing**:
- Contract: `forge test` — unit, integration, fuzz (`--fuzz-runs 10000`), invariant; gas snapshots via `forge snapshot`
- Web: Vitest + React Testing Library (component unit); Playwright (end-to-end flows); mocked viem provider for wallet interactions in CI

**Target Platform**: Monad Testnet (chain ID 10143, RPC `https://testnet-rpc.monad.xyz`); web-first, mobile-responsive (375 px minimum)

**Project Type**: Monorepo DApp — smart contract backend + Next.js frontend

**Performance Goals**:
- Deposit confirmation visible in UI within 2 s of block inclusion (Monad 400 ms block time)
- Max 3 RPC calls per page render
- Gas per critical operation ≤ 150 000 (deposit, approve withdrawal)
- Public objective view loads < 3 s on simulated 4G

**Constraints**:
- No off-chain database; all state from contract
- Wallet layer is **wagmi** only: users connect via **injected** extension and/or **WalletConnect** (no embedded-wallet SDK in MVP)
- USDC only (6 decimals) as the vault asset in v1
- No yield on idle balance (explicit v1 constraint from foundation.md §8)

**Scale/Scope**: Monad Testnet — single contract deployment, ~5 primary screens, ~10 Forge test files

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Quality**: `forge fmt`, `forge build` gates in CI. All public/external functions will have NatSpec. CEI pattern enforced throughout — see Complexity Tracking for the one ERC-4626 `withdraw` override that requires an effects-before-interaction note. `tsc --noEmit`, `eslint`, `prettier` gates on the web package.

- **Testing Standards**: Unit tests for all pure logic and view functions; integration tests for full objective lifecycle (create → deposit → request → approve → withdraw); fuzz tests on deposit amounts and withdrawal amounts (numeric user input); invariant test: `totalAssets == sum of all objective balances`. Gas snapshots committed on every contract PR.

- **User Experience Consistency**: Terminology locked to *afilhado / padrinho / objective / goal / withdrawal request* across all UI copy, error messages, and contract event names. Shared `TransactionStatus` component handles all four tx lifecycle states. Error taxonomy (`USER` / `NETWORK` / `CONTRACT`) applied uniformly. **Wallet connectivity**: Meets constitution III — **WalletConnect + injected** both offered in the connect UI; mobile exercise via WalletConnect QR and Playwright at 375 px width.

- **Performance**: Gas targets defined (≤ 150 000 per op), measured via `forge snapshot`. Frontend RPC budget (≤ 3 calls/render) enforced in code review. 2 s confirmation target tied to Monad block time. 4G load target for public view covered by Playwright perf assertion.

- **Technology & Security**: OpenZeppelin 5.x pinned as git submodule. USDC address stored in deploy config, never hardcoded in tests without a named constant. `.env.local` git-ignored; only `.env.example` committed. `pnpm audit` run before merge. No upgrade mechanism needed for testnet v1 — documented as known gap for mainnet.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-padrinho-mvp/
├── plan.md          ← this file
└── tasks.md         ← created by /speckit.tasks (next step)
```

### Source Code (repository root)

```text
contract/                          # Foundry monorepo package
├── foundry.toml                   # chain 10143, rpc, metadata config
├── src/
│   ├── PadrinhoVault.sol          # ERC-4626 vault per objective (main contract)
│   ├── PadrinhoFactory.sol        # deploys a PadrinhoVault per objective creation
│   ├── mocks/
│   │   └── MockUSDC.sol           # ERC-20 (6 decimals) with public mint; testnet only
│   └── interfaces/
│       └── IPadrinhoVault.sol     # external interface + NatSpec
├── script/
│   ├── Deploy.s.sol               # deploys MockUSDC + PadrinhoFactory to Monad Testnet
│   └── HelperConfig.s.sol         # chain-aware addresses; returns MockUSDC address on testnet
├── test/
│   ├── unit/
│   │   ├── PadrinhoVault.t.sol    # unit: create, invite, accept, deposit, withdraw
│   │   └── PadrinhoFactory.t.sol  # unit: factory deploy, objective registry
│   ├── integration/
│   │   └── FullLifecycle.t.sol    # create → deposit → request → approve → withdraw
│   ├── fuzz/
│   │   └── FuzzDeposit.t.sol      # fuzz: deposit amounts, withdrawal amounts
│   └── invariant/
│       └── VaultInvariant.t.sol   # totalAssets == sum of objective balances
└── lib/
    ├── forge-std/                 # git submodule
    └── openzeppelin-contracts/    # git submodule (pinned)

web/                               # Next.js frontend package
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── .env.example                   # NEXT_PUBLIC_FACTORY_ADDRESS, NEXT_PUBLIC_CHAIN_ID, etc.
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # root layout: QueryClientProvider + WagmiProvider
│   │   ├── page.tsx               # landing / connect wallet
│   │   ├── dashboard/
│   │   │   └── page.tsx           # role-aware: renders AfilhadoDashboard or PadrinhoDashboard
│   │   ├── objective/
│   │   │   ├── new/
│   │   │   │   └── page.tsx       # create objective flow (2 steps)
│   │   │   └── [id]/
│   │   │       └── page.tsx       # public objective view (no wallet required)
│   │   └── padrinho/
│   │       └── page.tsx           # padrinho dashboard (pending invites + requests)
│   ├── components/
│   │   ├── ui/                    # shared primitives (Button, Input, Badge, ProgressBar)
│   │   ├── TransactionStatus.tsx  # shared tx lifecycle component (4 states)
│   │   ├── ObjectiveCard.tsx      # objective summary: name, balance, progress, padrinho status
│   │   ├── CreateObjectiveForm.tsx # 2-step form: (1) name+amount (2) padrinho address
│   │   ├── DepositForm.tsx        # deposit USDC into objective
│   │   ├── WithdrawalRequestForm.tsx # submit early withdrawal request
│   │   ├── WithdrawalRequestCard.tsx # padrinho: view + approve/deny request
│   │   └── InviteCard.tsx         # padrinho: accept/decline invitation
│   ├── hooks/
│   │   ├── useObjective.ts        # read objective state from contract
│   │   ├── useAfilhadoDashboard.ts # aggregated afilhado view
│   │   ├── usePadrinhoDashboard.ts # aggregated padrinho view
│   │   ├── useDeposit.ts          # deposit write + tx status
│   │   ├── useWithdrawalRequest.ts # request/approve/deny writes + tx status
│   │   └── useCreateObjective.ts  # factory write + tx status
│   ├── lib/
│   │   ├── wagmi.ts               # config: monadTestnet chain, injected + walletConnect connectors
│   │   ├── viem.ts                # optional shared chain/RPC helpers used by wagmi
│   │   └── contracts.ts           # ABI imports + contract addresses
│   └── types/
│       └── index.ts               # Objective, WithdrawalRequest, PadrinhoInvite types
└── src/__tests__/
    ├── components/                # Vitest + RTL component tests
    └── e2e/                       # Playwright end-to-end flows
```

**Structure Decision**: Monorepo with two top-level packages — `contract/` (Foundry, already initialized) and `web/` (Next.js, to be scaffolded). No shared package layer needed in v1 since the only shared artifact is the ABI, which is imported directly from `contract/out/` into `web/src/lib/contracts.ts` via a path alias or build step.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| ERC-4626 `withdraw` overrides CEI order for share burn | OpenZeppelin's ERC-4626 base calls `_burn` after `safeTransfer` to conform to the standard; the vault holds no third-party tokens beyond USDC and the transfer target is always the afilhado (not an arbitrary address), keeping reentrancy surface minimal | Rewriting transfer-before-burn would break ERC-4626 spec compliance and break integrations; ReentrancyGuard is added as compensating control |
| Per-objective vault deployment (factory pattern) | Each objective needs isolated accounting and an independent ERC-4626 surface; a single shared vault with internal ledgers would require complex share-class logic and increase audit surface | A single vault with internal mappings cannot cleanly implement ERC-4626 per-objective totalAssets without a bespoke accounting layer that adds more complexity than the factory pattern |

---

## Implementation Phases

### Phase 0 — Contract Design & Interfaces

**Goal**: Lock the data model, event schema, and function signatures before writing any implementation code.

**Deliverables**:
- `IPadrinhoVault.sol` — full NatSpec interface covering all external functions and events
- Storage layout documented inline in the interface file
- USDC address constant strategy (HelperConfig per chain)

**Key decisions**:
- `PadrinhoVault` extends `ERC4626` (OZ), `ReentrancyGuard`
- State variables: `afilhado`, `padrinho`, `pendingPadrinho`, `targetAmount`, `padrinhoStatus` (enum), `withdrawalRequest` (struct), `status` (enum `Active | Completed`)
- Events: `PadrinhoInvited`, `PadrinhoAccepted`, `Deposited`, `GoalReached`, `WithdrawalRequested`, `WithdrawalApproved`, `WithdrawalDenied`, `GoalWithdrawn`
- `MockUSDC`: ERC-20, 6 decimals, `mint(address to, uint256 amount)` public (no auth — testnet only); deployed by the deploy script and its address fed into `HelperConfig`
- `PadrinhoFactory`: maps `objectiveId → vaultAddress`; emits `ObjectiveCreated`

---

### Phase 1 — Smart Contract Implementation

**Goal**: Full `PadrinhoVault` and `PadrinhoFactory` implementation with all behaviors from spec FR-001–FR-012.

**Key implementation notes**:

`PadrinhoVault`:
- Constructor: `(IERC20 usdc, address _afilhado, uint256 _targetAmount, string memory _name)`
- `invitePadrinho(address)` — only afilhado; sets `pendingPadrinho`; reverts if `_afilhado == address`
- `acceptInvite()` — only `pendingPadrinho`; sets `padrinho = pendingPadrinho`
- `deposit(uint256 assets, address receiver)` — override ERC-4626; receiver MUST be afilhado; checks `status == Active`; emits `GoalReached` if threshold crossed
- `requestWithdrawal(uint256 amount, string calldata message)` — creates pending request; solo mode executes immediately
- `approveWithdrawal(string calldata message)` — only padrinho; executes `withdraw`; emits `WithdrawalApproved`
- `denyWithdrawal(string calldata message)` — only padrinho; clears request; emits `WithdrawalDenied`
- `withdrawGoal()` — only afilhado; requires `balance >= targetAmount`; marks `Completed`
- `resignPadrinho()` — reverts if pending request exists

`PadrinhoFactory`:
- `createObjective(string name, uint256 targetAmount, address padrinhoHint)` — deploys vault, optionally calls `invitePadrinho`; emits `ObjectiveCreated`
- `getObjectivesByAfilhado(address)` returns `address[]`
- `getObjectivesByPadrinho(address)` returns `address[]`

---

### Phase 2 — Contract Tests

**Goal**: Full test coverage across unit, integration, fuzz, and invariant levels before any frontend work.

**Test matrix**:

| File | Type | Scenarios |
|------|------|-----------|
| `PadrinhoVault.t.sol` | Unit | create, invite (valid/invalid/self), accept, deposit (normal/overgoal/completed), solo withdraw, request (pending conflict), approve, deny, resign with/without pending |
| `PadrinhoFactory.t.sol` | Unit | deploy vault, registry reads, objective lookup by afilhado/padrinho |
| `FullLifecycle.t.sol` | Integration | happy path (create→invite→accept→deposit→request→approve→withdraw), solo path, goal reached path |
| `FuzzDeposit.t.sol` | Fuzz | `deposit(uint256 amount)` — amounts from 1 wei to `type(uint128).max`; `requestWithdrawal(uint256 amount)` boundary |
| `VaultInvariant.t.sol` | Invariant | `vault.totalAssets() == usdc.balanceOf(vaultAddress)` always |

**Gas targets** (`forge snapshot`):
- `deposit` ≤ 150 000 gas
- `approveWithdrawal` ≤ 150 000 gas
- `createObjective` ≤ 500 000 gas (vault deploy)

---

### Phase 3 — Deploy Script & ABI Export

**Goal**: Deploy factory to Monad Testnet; export ABI to web package.

**Steps**:
1. `HelperConfig.s.sol` — returns `(usdcAddress, factoryAddress)` per `block.chainid`; on chain 10143 the USDC address is the freshly deployed `MockUSDC`; on a future mainnet chain it would point to the canonical USDC
2. `Deploy.s.sol` — deployment order: (a) deploy `MockUSDC`, (b) deploy `PadrinhoFactory(mockUsdcAddress)`; logs both addresses; uses Foundry keystore (no private key in env)
3. Post-deploy: copy `out/MockUSDC.sol/MockUSDC.json`, `out/PadrinhoVault.sol/PadrinhoVault.json`, and `out/PadrinhoFactory.sol/PadrinhoFactory.json` ABIs to `web/src/lib/abis/`
4. `web/src/lib/contracts.ts` — exports typed ABIs + address constants (factory + mockUsdc) keyed by chain ID
5. `web/.env.example` — add `NEXT_PUBLIC_MOCK_USDC_ADDRESS` alongside factory address

---

### Phase 4 — Frontend Scaffolding & Providers

**Goal**: Next.js 14 app with wagmi, viem, WalletConnect + injected connectors, Tailwind, and ESLint configured.

**Steps**:
1. `pnpm create next-app web --typescript --tailwind --eslint --app`
2. Install: `wagmi viem @tanstack/react-query`
3. `web/src/lib/wagmi.ts` — `createConfig` with `monadTestnet` (chain 10143), `http()` transport, connectors: `injected()` and `walletConnect({ projectId, ... })` using `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` from [WalletConnect Cloud](https://cloud.walletconnect.com/)
4. `web/src/lib/viem.ts` (optional) — shared RPC URL / explorer URLs for reuse in UI links
5. `web/src/app/layout.tsx` — `QueryClientProvider` + `WagmiProvider` wrapping the app (use a small client-only `Providers.tsx` if needed for SSR)
6. `.env.example` — `NEXT_PUBLIC_FACTORY_ADDRESS`, `NEXT_PUBLIC_CHAIN_ID=10143`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_MOCK_USDC_ADDRESS` (after deploy)
7. ESLint config: `eslint-config-next` + `prettier` + `@typescript-eslint`; no `any` without comment

---

### Phase 5 — Core Hooks

**Goal**: All contract read/write hooks with tx lifecycle management. No UI yet — hooks are independently testable against a mocked provider.

**Hooks**:
- `useCreateObjective` — calls `PadrinhoFactory.createObjective`; returns `{write, status, txHash, error}`
- `useDeposit(vaultAddress)` — approves USDC then calls `deposit`; handles allowance check
- `useWithdrawalRequest(vaultAddress)` — `requestWithdrawal`, `withdrawGoal`
- `usePadrinhoActions(vaultAddress)` — `acceptInvite`, `approveWithdrawal`, `denyWithdrawal`, `resignPadrinho`
- `useObjective(vaultAddress)` — reads all objective state via `viem` multicall
- `useAfilhadoDashboard(address)` — reads `getObjectivesByAfilhado` then multicalls each vault
- `usePadrinhoDashboard(address)` — reads `getObjectivesByPadrinho` + pending invites

All write hooks follow this shape:
```ts
{ write: () => void, status: 'idle' | 'signing' | 'submitted' | 'confirmed' | 'failed', txHash?: Hex, error?: string }
```

---

### Phase 6 — Shared UI Components

**Goal**: Design system primitives and shared components; no page-level composition yet.

**Components**:
- `ui/Button`, `ui/Input`, `ui/Badge`, `ui/ProgressBar`, `ui/Skeleton` — Tailwind-based primitives
- `TransactionStatus` — renders 4 tx states; shows explorer link on `submitted`/`confirmed`
- `ObjectiveCard` — name, balance/target, progress bar, padrinho status badge
- `CreateObjectiveForm` — 2-step wizard: step 1 (name + target amount), step 2 (optional padrinho address with skip)
- `DepositForm` — amount input, USDC balance display, approve + deposit CTA
- `WithdrawalRequestForm` — amount, optional message, submit CTA
- `WithdrawalRequestCard` — for padrinho: shows request details, approve/deny CTAs, reply message input
- `InviteCard` — for padrinho: shows objective name + afilhado address, accept/decline CTAs

All components tested with Vitest + React Testing Library; behavior tests only (no HTML snapshots).

---

### Phase 7 — Pages & Dashboard Views

**Goal**: Assemble pages from hooks + components; implement role-aware routing.

**Pages**:

`/` — Landing: connect wallet UI (injected + WalletConnect); redirects to `/dashboard` on connect

`/dashboard` — Role-aware: reads connected wallet; if has objectives as afilhado → renders `AfilhadoDashboard`; if has objectives as padrinho → renders `PadrinhoDashboard`; if both → tabs; if none → prompt to create first objective

`/objective/new` — `CreateObjectiveForm` two-step flow; on success → redirect to `/dashboard`

`/objective/[id]` — Public view: reads vault state via `useObjective`; displays name, balance, progress; no wallet required; skeleton loaders while fetching

**Afilhado Dashboard** (composed from components):
- List of `ObjectiveCard` components
- Per-objective: deposit button → `DepositForm` modal
- Per-objective (active padrinho + below goal): request withdrawal → `WithdrawalRequestForm` modal
- Per-objective (goal reached): "Withdraw all" CTA → `useWithdrawalRequest.withdrawGoal()`
- Withdrawal request history per objective

**Padrinho Dashboard**:
- Pending `InviteCard` list (accept/decline)
- Objectives under guardianship as `ObjectiveCard`
- Pending `WithdrawalRequestCard` list with approve/deny

---

### Phase 8 — End-to-End Tests & Hardening

**Goal**: Playwright e2e covering the three critical paths; performance assertions; final constitution check.

**E2E test scenarios**:
1. Afilhado solo path: create objective → deposit → reach goal → withdraw
2. Full accountability path: create objective → invite padrinho → accept → deposit → request → approve → receive funds
3. Denial path: create → invite → accept → deposit → request → deny → funds remain
4. Public view: access `/objective/[id]` without wallet → page loads with correct data

**Performance assertions**:
- Deposit confirmation reflected in UI within 2 s (Playwright network intercept)
- Public objective view first contentful paint < 3 s (Playwright `page.evaluate`)

**Final checklist**:
- [ ] `forge fmt && forge build && forge test` all green
- [ ] `forge snapshot` committed; no regression > 5%
- [ ] `tsc --noEmit && eslint && prettier --check` all green
- [ ] `pnpm audit` — no HIGH/CRITICAL unwaived
- [ ] UX terminology review: all copy uses defined terms
- [ ] `TransactionStatus` used on all write actions
- [ ] 375 px layout verified in Playwright
- [ ] `.env.local` not committed; `.env.example` up to date (includes `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`)
- [ ] Contract addresses and ABIs versioned in `web/src/lib/contracts.ts`
- [ ] Connect UI exposes both **injected** and **WalletConnect** on landing/dashboard
