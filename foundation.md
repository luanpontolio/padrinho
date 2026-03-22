# Padrinho
### Savings with Delegated Social Trust

---

## 1. The Problem

Saving money is hard. For some people, it's something they can figure out alone, with the right habit or the right tool. For many others, it isn't. Not because they don't want to save, not because they don't know they should, but because wanting something and being able to do it by yourself are two different things.

This is the problem Padrinho exists to solve: helping people save, even when they feel like they can't do it by themselves.

Most savings tools are built on a single assumption: that the right interface will fix the behavioral gap. A cleaner dashboard. A smarter automation. A more motivating progress bar. They help, up to a point. But they all share the same fundamental weakness: you can always opt out. You can delete the app. Turn off the automation. Transfer the money back. The system has no real teeth, because the system is just software, and software obeys you.

The only thing that has ever reliably worked for people who struggle to save alone is another person.

When someone you trust is watching, when opting out means facing them and explaining yourself, the calculus changes. You don't quit the diet when your trainer is waiting at the gym. You don't spend the rent money when your sister is counting on it. Social accountability is the oldest behavioral technology in existence. It works because the cost of failure is not just financial. It's relational.

But there's no infrastructure for this relationship when it comes to money. You can ask a friend to hold your savings, but then you have to trust them completely and blindly. You can't see your balance. You can't verify they haven't touched it. And they have no way to enforce the rules you agreed on, except awkward conversations and goodwill.

The result: the most effective savings mechanism humans have ever had is locked inside informal arrangements that don't scale, don't have rules, and fall apart under pressure.

---

## 2. The Insight

Trust is not binary. You don't go from "I trust the bank to hold my money" to "I trust myself to manage it alone" in one step. That transition is hard, and for most people, it never fully happens.

Self-custody assumes users are ready to be their own bank. Most aren't, not because they're incapable, but because they've spent their whole lives in a world where financial discipline was enforced externally. By institutions. By necessity. By other people.

The bridge between those two states is not better UX. It's not a smarter algorithm. It's a person you already trust, given the right tools to hold you accountable.

Padrinho doesn't ask you to trust yourself. It asks you to trust someone you already do, but for money.

---

## 3. The Solution

Padrinho is a savings protocol. It helps you save toward a goal, on your own terms, at your own pace. If you can do it alone, Padrinho gives you the structure: a goal, a balance, a clear finish line.

And if you can't do it alone, Padrinho gives you something more: the ability to invite a trusted person into your savings process. Not to control your money, not to manage it for you, but to be the reason you think twice before giving up.

That person is your padrinho.

Solo mode means no active padrinho: there is no gatekeeper on early withdrawal, and the contract encodes that the same way—see §7.

You deposit freely. You watch your balance grow toward your goal. With an active padrinho, if you want to withdraw before you get there, you have to ask them. They can approve it or deny it, and they can tell you why.

When you reach your goal, the money is yours automatically, without asking anyone.

The padrinho never controls your funds. They can't spend your money, move it, or block you from it once your goal is reached. Their only power is the power to say no to an early withdrawal, and to explain their reasoning. That's enough. Because it's not really about the money. It's about the conversation you'd have to have, and what that conversation costs you.

Padrinho works as a solo tool. It works even better with someone in your corner.

---

## 4. How It Works

### The Actors

**Afilhado:** the person saving. Creates the objective, makes deposits, requests early withdrawals if needed, receives the full balance automatically when the goal is reached.

**Padrinho:** the trusted person. Invited by the afilhado. Receives withdrawal requests with a message. Approves or denies with a response. Cannot access, move, or control the funds at any time.

### The Flow

1. The afilhado creates an objective: a name, a target amount.
2. The afilhado invites a padrinho by sharing a link or wallet address.
3. The afilhado deposits any amount at any time. There is no required schedule.
4. Both parties can see the current balance and progress toward the goal at any time via a public view. No wallet required to read it.
5. If the afilhado wants to withdraw before reaching the goal and an active padrinho is in place, they submit a withdrawal request with an optional message to their padrinho. With no active padrinho, they withdraw freely (see §7).
6. The padrinho receives the request, reviews it, and responds with an approval or denial and a message back.
7. If approved, the withdrawal is processed. If denied, the funds remain locked.
8. When the balance reaches the target amount, the full balance becomes available to the afilhado automatically. No padrinho approval needed.

### What the Padrinho Cannot Do

- Withdraw funds
- Block the afilhado from reaching their goal
- Prevent the automatic release when the goal is met
- See the afilhado's other financial information

The padrinho's power is narrow and specific: say no to an early exit, and say why. Nothing more.

---

## 5. Why Onchain

A fintech app could approximate this flow. But it would require trusting the company behind it: that they won't go bankrupt, change their terms, freeze accounts, or quietly allow withdrawals in edge cases.

Onchain changes the nature of the rules. The contract is not a policy that a company can update. It is code that executes exactly as written, always, for anyone, without exception. The padrinho's approval is not a feature that could be toggled off in the next update. It is a condition baked into the settlement layer.

This matters because the product only works if the rules are genuinely hard to break. An app you can override is a suggestion. A contract you can't override is a commitment.

There is one more property that onchain enables and fintech cannot: the afilhado never gives custody to anyone. Not to Padrinho as a company, not to the padrinho as a person, and not to a bank. The funds sit in a smart contract that only releases them according to rules both parties agreed to upfront. Self-custody with social accountability, not self-custody instead of it.

---

## 6. Why Monad

Padrinho's core user is not a crypto native. They are someone with R$50–200 to save per month. At that scale, every cent of gas fee is a percentage of the deposit. On most EVM chains, the cost of interacting with a smart contract would erode the balance of a small saver meaningfully over time.

Monad delivers 10,000 TPS, 400ms block times, and near-zero fees, which means deposits of any size are viable, and the experience of saving feels like using a payment app, not executing a blockchain transaction.

Sub-second finality also matters for real-time feedback. When an afilhado deposits and sees their progress update instantly, the behavioral loop closes. Delay breaks the moment. Monad eliminates the delay.

Padrinho is exactly the kind of consumer application Monad was built for: high-frequency, low-value transactions that need to feel fast and cost nothing.

---

## 7. The Contract Logic

The following rules define the system in plain language. These are the rules from which the smart contract is derived.

**Objective creation**
- Any address can create an objective with a name and a target amount.
- The creator becomes the afilhado of that objective.

**Padrinho assignment**
- The afilhado invites a padrinho by specifying an address.
- The padrinho must accept the invitation before the role is active.
- An objective without an active padrinho allows free withdrawal at any time.

**Deposits**
- The afilhado can deposit any amount at any time.
- Anyone can deposit into an objective (to support gifting in future versions).
- Deposits are denominated in stablecoins (USDC on Monad).

**Withdrawal goal reached**
- When `balance >= targetAmount`, the afilhado can withdraw the full balance at any time without approval.
- This condition is checked automatically on every deposit.

**Withdrawal early (before goal)**
- The afilhado submits a withdrawal request specifying an amount and an optional message.
- The padrinho receives the request and responds with approval or denial and an optional message.
- If approved, the specified amount is transferred to the afilhado.
- If denied, the funds remain in the contract.

**Padrinho constraints**
- The padrinho cannot initiate any transfer of funds.
- The padrinho cannot modify the target amount.
- The padrinho cannot resign while a withdrawal request is pending.

**Objective closure**
- Once the goal is reached and the balance is withdrawn, the objective is marked complete.
- A completed objective is read-only and serves as a permanent record.

---

## 8. What We're Not Building Yet

The following are recognized as natural next steps but are explicitly out of scope for the first version:

- **Yield on idle balance** the balance earns nothing in v1. This is intentional: simplicity first.
- **Padrinho deposits as gift or loan** the ability for the padrinho to contribute to the afilhado's goal, either as a donation or as a structured loan with repayment terms.
- **Multiple afilhados per padrinho** one padrinho managing several savings relationships at once.
- **Reputation system** onchain record of a padrinho's history of approvals and denials, which could eventually serve as a primitive for trust scoring.
- **Credit access** using a track record of completed savings goals as a basis for lending.
- **PIX → onchain onramp** direct integration with Brazilian instant payment infrastructure. Targeted for v2.

---

## 9. The Bigger Vision

Padrinho is not a savings app. It is the first product in a longer arc toward financial self-sovereignty for people who have never had it.

The trajectory looks like this:

**Now:** You can't save alone. Padrinho gives you a person to lean on while the habit forms.

**Next:** The habit is formed. You have a track record. The padrinho becomes less necessary and eventually, optional.

**Later:** Your track record onchain becomes collateral for something new: access to credit, to yield, to financial products that have always required institutional gatekeeping to access.

The goal is not to keep you dependent on a padrinho forever. The goal is to get you to a place where you don't need one and to build the onchain history that proves you got there.

Most people don't need better financial tools. They need a first step they can actually take. Padrinho is that step.

---

## 10. Technical Stack (Reference)

- **Chain:** Monad Testnet
- **Contract language:** Solidity
- **Stablecoin:** USDC (native on Monad)
- **Authentication:** WalletConnect + injected browser wallet (wagmi)
- **Onramp:** Transak or Moonpay (PIX → USDC on Monad)
- **Frontend:** Web-first, mobile-responsive
- **Public view:** Shareable, read-only objective page; anyone can see progress without connecting a wallet

---

*Padrinho v0.1 lightpaper*
*Work in progress. Not a financial product. Not investment advice.*
