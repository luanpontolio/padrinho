<!--
Sync Impact Report
- Version change: 2.0.1 → 2.0.2 (MVP defaults to wagmi+viem; Web3 stack row)
- Modified: Technology & Security Baseline — Stack table (Web3 provider row prioritizes wagmi + viem)
- Modified principles: none (III unchanged; SDK waiver remains for non-wagmi stacks)
- Added sections: none
- Removed sections: none
- Templates: none
- Follow-up TODOs: none
-->

# Padrinho Constitution

## Core Principles

### I. Code Quality

#### Solidity (`contract/`)

- All Solidity code MUST pass `forge fmt` and `forge build` before merge; no warnings suppressed without a comment explaining why.
- Contracts MUST follow the Checks-Effects-Interactions (CEI) pattern; any deviation MUST be justified in the feature plan's Complexity Tracking table.
- Public and external functions MUST have NatSpec (`@notice`, `@param`, `@return`); internal helpers require it only when non-obvious.
- Storage layout changes MUST be explicitly documented in the plan; upgradeable contracts MUST use the OpenZeppelin Upgrades pattern and include a storage gap.
- Dead code, unreachable branches, and unused imports MUST be removed before merge.

#### Next.js (`web/`)

- All TypeScript MUST compile without errors (`tsc --noEmit`); `any` types require an inline comment explaining the exception.
- Components MUST be co-located with their styles and tests; shared primitives live in `web/src/components/ui/`.
- `eslint` and `prettier` MUST pass; config is at repo root and shared across packages.
- No inline styles; use Tailwind utility classes or CSS Modules. Design tokens (colors, spacing, typography) MUST come from the shared theme — one-off values require design sign-off.
- **Rationale**: Consistent, readable code across both layers reduces defect surface, eases onboarding, and supports security review at the contract boundary.

### II. Testing Standards

#### Solidity (`contract/test/`)

- Every behavior change MUST ship a Forge test; the appropriate level is:
  - **Unit**: pure logic, view functions, helper libraries.
  - **Integration**: multi-contract flows, state transitions across calls.
  - **Fuzz**: any function that accepts user-supplied numeric input or where edge-case arithmetic matters — use `forge test --fuzz-runs 10000` locally before merge.
  - **Invariant**: core accounting identities (e.g., "total supply equals sum of balances") MUST have at least one invariant test.
- Tests MUST be named `test_<behavior>_<condition>` (e.g., `test_transfer_revertsWhenPaused`).
- Every fixed on-chain bug MUST include a regression test that reproduces the exact failure scenario.
- Gas snapshots (`forge snapshot`) MUST be committed and reviewed on every PR that touches contract logic; regressions beyond 5% require justification.

#### Next.js (`web/`)

- UI components MUST have unit tests with Vitest + React Testing Library; tests target behavior, not implementation (no snapshot tests of raw HTML).
- User flows that span multiple components or pages MUST have an integration test (Playwright or Cypress).
- Wallet-interaction code (transaction submission, signature requests, chain switching) MUST be tested with a mocked provider — never against a live network in CI.
- **Rationale**: Tests are the executable specification; the on-chain layer has no "undo" — gaps in test coverage are potential fund-loss vectors.

### III. User Experience Consistency

- **Terminology**: On-chain concepts (transaction, wallet, gas, block) MUST use the same terms across all surfaces: UI copy, error messages, docs, and CLI output. Define terms once in `docs/glossary.md`; reference it, never redefine.
- **Transaction lifecycle**: Every action that submits a transaction MUST communicate four states to the user — *pending signature*, *submitted* (with tx hash), *confirmed*, and *failed* — using a shared `TransactionStatus` component.
- **Error taxonomy**: Errors fall into three categories; all surfaces MUST use this taxonomy:
  - `USER` — bad input or rejected signature (recoverable by user action).
  - `NETWORK` — RPC failure, chain congestion (recoverable by retry).
  - `CONTRACT` — revert with a known reason string (show the decoded reason); unknown reverts show a safe fallback with a support link.
- **Loading states**: Every async operation (wallet connection, contract read, contract write) MUST show a loading indicator within 200 ms of initiation; skeleton screens are preferred over spinners for data-heavy views.
- **Responsive layout**: All primary flows MUST be fully usable on mobile (375 px width minimum). **Wallet connectivity**: When the app wires wallets **directly** with wagmi/viem, flows MUST support **both** WalletConnect and browser-injected providers. When the MVP uses a **single** third-party embedded-wallet or auth SDK (e.g. `@getpara/react-sdk`) as the only connection and signing layer, that choice MUST be recorded in the feature plan’s **Complexity Tracking** with SDK name and version, confirmation that mobile and desktop flows remain viable through that SDK, and a **follow-up issue or milestone** to reassess WalletConnect/injected parity before mainnet (or by an explicit date).
- **Rationale**: Web3 UX is uniquely hostile — users lose real value when they misunderstand state. Consistency and clear feedback reduce errors, support costs, and trust erosion.

## Technology & Security Baseline

### Stack

| Layer | Technology | Minimum Version |
|-------|-----------|-----------------|
| Smart contracts | Solidity + Foundry | `^0.8.20` / latest Foundry |
| Contract libs | OpenZeppelin Contracts | pinned in `contract/lib/` |
| Target chain | Monad Testnet (chain 10143) | — |
| Frontend | Next.js + TypeScript | Next.js 14+ / TS 5+ |
| Styling | Tailwind CSS | v3+ |
| Web3 provider | **wagmi + viem** (WalletConnect + injected connectors). Alternative: viem + embedded-wallet/auth SDK only with **Complexity Tracking** waiver | latest stable |
| Package manager | pnpm workspaces | v8+ |

### Security Rules

- Secrets and private keys MUST never be committed; use Foundry keystores for deployment accounts and `.env.local` (git-ignored) for frontend env vars. Only `.env.example` (without values) is committed.
- Third-party Solidity dependencies MUST be version-pinned as git submodules; adopting unaudited or deprecated libraries requires documented risk acceptance in the plan.
- npm/pnpm dependencies MUST be reviewed with `pnpm audit` before merge; HIGH/CRITICAL findings block merge unless a waiver is recorded in Complexity Tracking.
- Contracts that hold user funds MUST have a documented upgrade or pause mechanism before mainnet deployment.
- ABI-breaking changes (renamed functions, changed signatures) MUST ship with a migration note and a frontend compatibility check.

## Quality Gates & Review

- Pull requests MUST demonstrate constitution compliance:
  - Linked spec/plan for substantive changes.
  - `forge fmt`, `forge build`, `forge test` passing.
  - `tsc --noEmit`, `eslint`, `prettier` passing.
  - Gas snapshot committed (if contract logic changed).
  - UX consistency checklist completed for user-visible changes.
- Reviewers MUST explicitly consider: correctness, test adequacy, UX terminology and error handling, gas impact, and security at the contract/frontend boundary (ABI alignment, input validation, wallet error handling).
- Published contract addresses and ABIs MUST follow semantic versioning; breaking changes require migration or upgrade notes in `docs/`.

## Governance

- This constitution supersedes informal team habits when they conflict with written rules here.
- Amendments require a pull request that updates `.specify/memory/constitution.md`, bumps **Version** per semantic rules below, and completes the Sync Impact Report comment at the top of that file.
- **Versioning**: MAJOR — removed or incompatible redefinition of principles; MINOR — new principle or materially expanded guidance; PATCH — clarifications and non-semantic edits.
- Compliance is enforced at plan time (Constitution Check in plan.md) and in code review; waivers MUST be captured in Complexity Tracking with rationale, owner, and expiry or follow-up issue.

**Version**: 2.0.2 | **Ratified**: 2026-03-22 | **Last Amended**: 2026-03-22
