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

**Correct: B.** A model is trained to produce an answer, so when the context lacks the answer it often **invents** one (hallucination). Giving an explicit "out" such as "If the answer is not in the context, reply: I don't know" makes the safe behavior available and cheap. Combine with grounding data, citations, and an evaluation case where the answer is missing, to check that the model really says it.

```python
system = """Answer using only the CONTEXT below.
If the CONTEXT does not contain the answer, reply exactly: "I don't have that information."
CONTEXT:
{context}"""
```

**Why the others are wrong:**
- **A. Remove examples:** may lower quality, and examples can actually anchor the format.
- **C. Raise temperature:** adds randomness and more invention.
- **D. Shorten context:** can remove the needed facts and increase guessing.

Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/prompt-engineering

</details>

### 2. Output ignores a rule at the top of a long prompt. What helps?

- A. Lower max tokens
- B. Use top_p and temperature together
- C. Add emoji
- D. Repeat the key rule at the end

<details><summary>Answer</summary>

**Correct: D.** Models pay more attention to text near the end of the prompt (**recency**), so a rule placed only at the top of a long prompt can fade. Repeat the key rule (or a short reminder) at the end, close to where the model starts answering. Other helpers: clear sections, delimiters, and putting the question last.

```python
messages = [
    {"role": "system", "content": "Rules: answer in JSON. Never give legal advice. ..."},
    {"role": "user", "content": long_document + "\n\nQuestion: " + q +
                                "\n\nReminder: answer in JSON and never give legal advice."},
]
```

**Why the others are wrong:**
- **A. Lower max tokens:** cuts the answer short; it does not enforce a rule.
- **B. `top_p` and temperature together:** Microsoft recommends changing one of them, not both; neither enforces a rule.
- **C. Add emoji:** no effect on instruction following.

Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/prompt-engineering

</details>

### 3. You want repeatable classification. Which setting?

- A. Low temperature
- B. High temperature
- C. Max tokens 1
- D. Both high

<details><summary>Answer</summary>

**Correct: A.** **Temperature** controls randomness when choosing the next token: a low value (0 to about 0.3) makes the model pick the most likely tokens, so the same input gives the same (or nearly the same) output, which is what classification needs. A high value gives varied, creative output. Change **either temperature or `top_p`, not both**. Reasoning models may not accept these parameters; check the model page.

```python
r = client.chat.completions.create(
    model="gpt-4.1-mini",
    messages=[{"role": "system", "content": "Classify the ticket as billing, outage or other. Reply with one word."},
              {"role": "user", "content": ticket_text}],
    temperature=0,
    max_tokens=5,
)
```

Low temperature gives *consistent* output, not necessarily *correct* output; measure with a labeled test set.

**Why the others are wrong:**
- **B. High temperature:** random labels.
- **C. Max tokens 1:** a length limit; it can cut a label and does not make output repeatable.
- **D. Both high:** maximum randomness.

Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/prompt-engineering

</details>

### 4. Reflection loops add what cost?

- A. Fewer tokens
- B. None
- C. Extra calls and latency
- D. Less quality

<details><summary>Answer</summary>

**Correct: C.** A **reflection loop** (generate → critique → revise) improves quality, but every round is **another model call**: more tokens, more cost, more latency. Control it: set a **maximum number of rounds** (often 1 to 2), stop when the critique passes a clear criterion, and use reflection only where quality matters more than speed (important documents, code), not for simple chat.

```python
draft = generate(task)
for _ in range(2):                       # hard cap on rounds
    critique = review(draft, rubric)
    if critique.passed:
        break
    draft = revise(draft, critique.feedback)
```

Cost example: 1 draft + 2 rounds of (critique + revision) = 5 calls instead of 1.

**Why the others are wrong:**
- **A. Fewer tokens / B. None:** the extra calls add tokens.
- **D. Less quality:** reflection usually improves quality, which is why it is used.

Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/prompt-engineering

</details>
