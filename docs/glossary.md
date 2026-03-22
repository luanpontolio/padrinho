# Glossary

Single source of truth for **terminology** across UI copy, error messages, documentation, and CLI output. Do not redefine these terms elsewhere; link or reference this file.

## Product roles

| Term | Definition |
|------|------------|
| **Afilhado** | The person saving. Creates the objective, deposits, may request early withdrawals, and receives the balance when the goal is reached. |
| **Padrinho** | The trusted person invited by the afilhado. May accept an invitation, approve or deny early withdrawal requests with a message. Cannot move funds or change the goal. |

## Product concepts

| Term | Definition |
|------|------------|
| **Objective** | A savings goal: name, target amount, onchain vault, and lifecycle (active → completed). |
| **Goal** / **target amount** | The USDC amount the afilhado is saving toward. Use **goal** in user-facing copy where it reads naturally; **target amount** when precision or forms need it. |
| **Solo mode** | No **active** padrinho: early withdrawal does not require approval. Not a degraded experience — same product, different rules. |
| **Active padrinho** | Invitation accepted; early withdrawals require padrinho response until the goal is reached. |
| **Early withdrawal** | Withdrawal while `balance < target amount` when a padrinho is active — goes through a **withdrawal request** flow. |
| **Withdrawal request** | Recorded ask to withdraw early (amount + optional message), pending padrinho approval or denial. |
| **Completed** | Goal reached and final withdrawal taken; objective is read-only. |

## Correspondence (withdrawal messages)

Product narrative: request and response texts are **letters** — things that might be said IRL, **worth documenting for history**. Use UI copy that fits **correspondence**, not bureaucracy or trial language.

| Term | Definition |
|------|------------|
| **Correspondence** | The paired **request message** (afilhado) and **response message** (padrinho) for a given early withdrawal attempt. Treat as one **thread** in the record. |
| **Request message** | Optional text from the afilhado with an early withdrawal request. Not a “mandatory justification”; neutral labels: e.g. *Your note*, *What you want to say*. |
| **Response message** | Optional text from the padrinho when approving or denying. Not a verdict — a **reply** in the same thread. |
| **Registry (informal)** | The onchain + UI **record** of deposits, requests, and responses — accountability as **history**, not surveillance. |

**Microcopy verbs that fit:** write, send, read, keep, reply — **avoid** framing that implies wrongdoing or evidence (*justify*, *explain yourself*, *prove*) unless legally required elsewhere.

## Onchain / wallet (use consistently)

| Term | When to use |
|------|-------------|
| **Wallet** | The user’s Ethereum account connection (extension or WalletConnect). |
| **Transaction** | A signed chain operation (create objective, deposit, approve USDC, request withdrawal, etc.). |
| **Signature** | Wallet prompt to authorize a transaction or message. Prefer over “sign” alone in error copy if clarity needs it. |
| **Gas** | Network fee for a transaction. Monad Testnet: fees are low; still use the word when explaining failures or delays. |
| **Network** / **chain** | **Monad Testnet** for MVP; use **network** in recovery/retry copy (e.g. “Network busy”), **chain** when switching or showing chain ID. |

## Deprecated or avoid

| Avoid | Prefer |
|-------|--------|
| “Godfather” (literal English) | **Padrinho** (product name) or role description in tooltip/help. |
| “Guardian” alone | **Padrinho** (per spec/plan) unless translating for a locale. |
| Judgmental framing (“bad save”, “failed”) | Neutral mirror copy — see `behaviors.md`. |
| “Smash the bank”, “steal from savings”, theft / crime metaphors | **Detour** / **request** / **witness** framing — see `behaviors.md` principles 9–10 and Visual & narrative metaphor. |
| “Justification” as default label for request text | **Note** / **message** / **letter** — correspondence tone per **Correspondence** section. |

---

*Amend via PR when adding new user-visible concepts.*
