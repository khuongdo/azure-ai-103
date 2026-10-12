---
note: docs/study/deep-dives/prompt-engineering-parameters-and-reflection.md
skill: Prompt engineering and parameters
retrieved: 2026-10-12
---

# Quiz: prompt engineering, parameters and reflection

Based on the [deep dive](../deep-dives/prompt-engineering-parameters-and-reflection.md).

## Flashcards

**Q:** Temperature and top_p guidance?
**A:** Change one, not both.

**Q:** Why repeat instructions at the end?
**A:** Recency bias.

**Q:** What is an 'out'?
**A:** Permission to answer 'unknown' when evidence is missing.

**Q:** Few-shot means?
**A:** Providing examples in the prompt.

**Q:** Best temperature for classification?
**A:** Low.

**Q:** Reflection pattern?
**A:** Draft, critique, revise, stop after fixed rounds.

**Q:** Hybrid LLM and rules?
**A:** Rules for exact steps, LLM for language.

**Q:** Are chain-of-thought tricks recommended for reasoning models?
**A:** No.

## Practice questions

### 1. A model invents answers when the context lacks them. What prompt change helps?

- A. Remove examples
- B. Give an out such as 'say you don't know'
- C. Raise temperature
- D. Shorten context

<details><summary>Answer</summary>

**Correct: B.** An out reduces forced guessing.
**Incorrect:** the other options do not fit — worsen or unrelated.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/prompt-engineering

</details>

### 2. Output ignores a rule at the top of a long prompt. What helps?

- A. Lower max tokens
- B. Use top_p and temperature together
- C. Add emoji
- D. Repeat the key rule at the end

<details><summary>Answer</summary>

**Correct: D.** Models weigh recent text more.
**Incorrect:** the other options do not fit — not helpful.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/prompt-engineering

</details>

### 3. You want repeatable classification. Which setting?

- A. Low temperature
- B. High temperature
- C. Max tokens 1
- D. Both high

<details><summary>Answer</summary>

**Correct: A.** Low temperature reduces randomness.
**Incorrect:** the other options do not fit — incorrect.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/prompt-engineering

</details>

### 4. Reflection loops add what cost?

- A. Fewer tokens
- B. None
- C. Extra calls and latency
- D. Less quality

<details><summary>Answer</summary>

**Correct: C.** Each round is another model call.
**Incorrect:** the other options do not fit — incorrect.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/prompt-engineering

</details>
