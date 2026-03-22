# Behaviors

Behavioral design principles for Padrinho. Referenced when making UI, copy, and interaction decisions.

---

## Core Principles

**1. The system is a mirror, not a judge.**
Padrinho never tells the user they are doing something wrong. It shows them what they are doing, clearly and without editorializing. The data speaks. The product stays neutral.

**2. Awareness before action.**
Every key moment — a withdrawal request, a denied request, a goal reached — is an opportunity to reflect, not just to transact. The UI slows the user down just enough to make the moment felt.

**3. The journey is the product.**
The completion screen is only meaningful because of what came before it. Every deposit, every request, every denial is part of a story the product is quietly building. Nothing is throwaway data.

**4. Friction is a feature, not a bug.**
Asking your padrinho for permission is supposed to feel like something. The request flow should not be frictionless. There should be a moment of pause before the user sends it — enough to ask themselves if they really mean it.

**5. The padrinho's voice matters.**
The response to a withdrawal request is not a binary outcome. It is a message from a person. The UI should treat it that way — giving it weight, space, and presence.

**6. Guilt reasons emerge, they are not assigned.**
Users say why in free text, not from a dropdown. In v0 that text is shown as-is. Later, categories can surface from what they write (e.g. via AI)—patterns reflected back in their own words, not assigned by the system.

**7. Celebrate the whole story, not just the ending.**
When a goal is reached, the product doesn't just say congratulations. It shows everything that happened to get there. The celebration is earned by the journey being visible.

**8. The product works without a padrinho.**
Solo mode is a real mode, not a degraded mode. The behavioral principles apply equally — the mirror still works, the journey is still tracked. The padrinho adds accountability. The product adds awareness.

---

## Behavioral Mechanisms

Prioritized for implementation. **v0** should cover everything under **Must Have.** **Nice to Have** items ship when ready; AI-assisted guilty-reason categorization is explicitly **post–v0.**

### Must Have

**Withdrawal attempt rate**
How many times did the user try to withdraw early? How many were approved, how many denied? This number, shown at the right moment, makes visible a pattern the user may not have noticed in themselves.

**Initial intent vs current behavior**
The goal has a name the user gave it at the start (that name is their stated intent). Withdrawal requests are shown alongside it. The system does not make the comparison explicit — it simply keeps both visible at the same time.

### Could Have

**Streak**
Days since last withdrawal request. Longest clean streak. A quiet signal of momentum that rewards consistency without making it the point.

**Extrapolation**
At your current request rate, you would have spent this savings multiple times over. The math that makes the abstract concrete and the future feel real.

### Nice to Have

**Guilty reasons (AI categorization)**
Withdrawal request texts categorized by the system over time—not by the user picking from a list—so the user sees their most common reasons reflected back in their own words. **Post–v0;** v0 relies on raw messages only.

**Anonymous social pressure**
Aggregate, anonymized data about how other users behave at similar stages. Not comparison for its own sake — comparison as context that makes the user's own behavior legible.

---

## Completion Moment

The goal reached screen is the most important screen in the product. It must show:

- Total saved
- Number of deposits made
- Number of early withdrawal requests submitted
- Number of requests denied by the padrinho
- The user’s own words on early withdrawal requests (the journey in text)
- Most common guilty reason category (post–v0; requires AI categorization)
- A message from the padrinho, if they choose to leave one

The celebration is earned by the journey being visible. Without the journey, it is just a number.
