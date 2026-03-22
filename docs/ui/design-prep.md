# UI/UX design prep (MVP)

This document aligns design work with existing product docs and the implementation plan. **Authoritative sources:** `foundation.md`, `behaviors.md`, `.specify/memory/constitution.md`, `specs/001-padrinho-mvp/plan.md`, `.specify/spec.md`.

## Current repo state

- **Contracts:** `contract/` (Foundry). Frontend **`web/`** is specified in the plan but **not scaffolded yet** — visual design can run in parallel once IA and components are agreed.
- **Stack (when built):** Next.js 14+ App Router, Tailwind, wagmi + viem, WalletConnect + injected wallets. **Viewport:** mobile-first, minimum **375px** width.

## Design principles (behaviors → UI)

From `behaviors.md` — non-negotiable for interaction and visual tone:

1. **Mirror, not judge** — data and history visible; no shaming copy.
2. **Awareness before action** — withdrawals, denials, goal reached: pause + reflection, not only buttons.
3. **Journey is the product** — deposits, requests, messages are first-class content, not clutter.
4. **Friction as feature** — early withdrawal request flow intentionally **not** one-tap; brief pause before send.
5. **Padrinho voice** — approval/denial messages get clear space and typographic weight (a person spoke).
6. **Letters, not forms** — request and response texts are **correspondence** (see glossary): document-like layout, archive tone; avoid “justify yourself” or evidence framing.
7. **Detours, not theft** — early withdrawal is **okay** and **witnessed**; never smashing-the-bank or sneaking visuals.
8. **Solo is first-class** — same clarity and dignity as padrinho mode.

**Completion screen (hero moment):** Must surface total saved, deposit count, early request/denial counts, the **correspondence** (request + response messages as one record), optional closing note from padrinho. See `behaviors.md` § Completion Moment.

---

## Brand symbol & metaphor (draft locked for design exploration)

Use this block to align illustration, motion, logo studies, and marketing with product behavior:

| Layer | Idea | Notes |
|-------|------|--------|
| **Path / witness** | A **line** of progress + onchain **registry** | Accountability = what was **said** and **saved**, not surveillance. |
| **Fill** | Empty → full (borrow **piggy-bank psychology**, not a literal pig) | Satisfaction at **completion**; optional “reveal” / tally feeling at goal — see `foundation.md` small-balance context. |
| **Detours** | Early requests as **bends** that rejoin or exit by agreement | Not punitive; not “breaking open” the savings. |
| **Closure** | **Open** journey while active → **whole** / closed chapter at goal | Braid-like **texture** optional; **completion** needs a clear **finished** state (ring, closed contour, full vessel — to be designed). |

**Creative north star (internal):** *Fullness you can trace.*

**Copy verbs that fit the letters metaphor:** write, send, read, keep — prefer over punitive or bureaucratic framing; see `docs/glossary.md` § Correspondence.

## Information architecture (planned routes)

| Route | Primary audience | Wallet required |
|-------|------------------|-----------------|
| `/` | Everyone | No (connect optional) |
| `/dashboard` | Afilhado or padrinho (role-aware) | Yes for actions |
| `/objective/new` | Afilhado | Yes |
| `/objective/[id]` | Everyone | **No** — public read-only progress |
| `/padrinho` | Padrinho | Yes |

**Cross-links:** objective share URL → public page; dashboards deep-link to objectives and pending items.

## Screen & flow inventory (~5 primary screens)

Use this as a Figma page list or milestone checklist.

1. **Landing** — connect wallet, short value prop, entry to dashboard or create objective.
2. **Afilhado dashboard** — list of objectives (`ObjectiveCard`: name, balance, progress, padrinho status).
3. **Create objective** — two steps: (1) name + target amount, (2) optional padrinho address; validation before tx.
4. **Objective detail (connected)** — deposit, progress (fill / path — align with metaphor), solo vs padrinho rules, early withdrawal **letter** flow, goal withdrawal when eligible, transaction status.
5. **Public objective** — same progress story without wallet; shareable.
6. **Padrinho dashboard** — pending invites (`InviteCard`), pending withdrawal requests (`WithdrawalRequestCard`).

**Flows to storyboard:**

- Afilhado: create → deposit → (optional) invite accepted → request early withdrawal → see response.
- Afilhado: create solo → deposit → withdraw early without approval.
- Afilhado: reach goal → withdraw all → **completion** screen.
- Padrinho: see invite → accept → see request → approve or deny with message.
- Anyone: open shared link → read-only objective.

## Components to design (contract with engineering)

Shared primitives live under `web/src/components/ui/` in the plan: Button, Input, Badge, ProgressBar, etc.

**Product-specific (name in plan):**

- `TransactionStatus` — four states: *pending signature*, *submitted* (tx hash), *confirmed*, *failed* (same component everywhere).
- `ObjectiveCard`, `CreateObjectiveForm`, `DepositForm`, `WithdrawalRequestForm`, `WithdrawalRequestCard`, `InviteCard` — design **request/response** surfaces as **correspondence** (readable width, letter-like spacing, not cramped form rows).

**Error model (copy + UI):** three categories — `USER`, `NETWORK`, `CONTRACT` — with consistent treatment (constitution).

## Visual system constraints (implementation)

- **Styling:** Tailwind + shared theme tokens — avoid one-off hex/spacing unless design explicitly signs off (constitution).
- **Loading:** Async reads/writes show feedback within **~200ms**; prefer **skeletons** for data-heavy views.
- **Density:** Small balances (R$50–200/mo context in `foundation.md`) — amounts and fees must stay readable and honest.

## Metrics to surface (behaviors § Mechanisms)

**v0 must-have:**

- Withdrawal attempt rate: how many early requests; how many approved vs denied — shown at “the right moment” (design + product to define placement).
- **Initial intent vs current behavior:** objective name (intent) visible alongside withdrawal request history — no explicit “you failed” comparison; juxtaposition only.

**Later:** streak, extrapolation, AI guilt categories — **post–v0**.

## Open design questions

1. **Primary mark** — how the **open path → closure / fullness** system renders in logo, app icon, and hero illustrations (see Brand symbol table above).
2. **Brand / art direction** — choose direction before high-fidelity polish.
3. **Portuguese vs English UI** — product terms (`afilhado`, `padrinho`) may stay Portuguese in any locale; decide copy locale for MVP.
4. **Public page privacy** — progress is public by spec; confirm disclosure line in UI (“anyone with the link”).
5. **USDC and decimals** — 6 decimals; formatting and “small amount” UX (thousands separators, fiat hint if any).

## Next steps

1. Lock **IA** and **user flows** in Figma (or tool of choice) using the routes above.
2. Design **TransactionStatus** and **withdrawal request** flows first — highest risk for trust and clarity.
3. Design **completion** screen to spec in `behaviors.md`.
4. After visual direction: define **design tokens** (colors, type, spacing) for Tailwind theme alignment.
5. Scaffold `web/` when ready (`specs/001-padrinho-mvp/plan.md` Phase 4).

---

*For term definitions, see `docs/glossary.md`.*
