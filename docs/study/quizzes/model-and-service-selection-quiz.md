---
note: docs/study/deep-dives/model-and-service-selection.md
skill: Select models and deployment options
retrieved: 2026-10-12
---

# Quiz: model and service selection

Based on the [deep dive](../deep-dives/model-and-service-selection.md).

## Flashcards

**Q:** Two catalog categories?
**A:** Sold directly by Azure; partners and community.

**Q:** Preferred deployment option?
**A:** Serverless API.

**Q:** Managed compute in preview: content filtering?
**A:** Not available.

**Q:** Where are reasoning tokens billed?
**A:** As output tokens; they share the context window.

**Q:** Initial reserve for reasoning plus output?
**A:** At least 25,000 tokens.

**Q:** Which effort for latency-critical tasks?
**A:** none (where supported).

**Q:** Which API returns reasoning summaries?
**A:** Responses API only.

**Q:** How avoid silent model changes?
**A:** Pin model version, no auto-upgrade, evaluate before adopting.

## Practice questions

### 1. You need an open-source model on dedicated GPUs. Which option?

- A. Instant access
- B. Serverless API
- C. Managed compute
- D. Batch

<details><summary>Answer</summary>

**Correct: C.** Managed compute hosts open-source and custom models on dedicated GPUs.
**Incorrect:** the other options do not fit — hosted catalog models; C — no deployment; D — offline.
Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/foundry-models-overview

</details>

### 2. A reasoning model returns an empty answer with status incomplete. What is likely?

- A. Reasoning consumed the token limit
- B. Missing tools
- C. Wrong endpoint
- D. Temperature too low

<details><summary>Answer</summary>

**Correct: A.** Reasoning tokens count toward the output cap.
**Incorrect:** the other options do not fit — not typical causes.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/reasoning

</details>

### 3. A voice assistant needs the lowest latency from a reasoning-capable model. What setting?

- A. Larger context
- B. reasoning_effort max
- C. Higher temperature
- D. reasoning_effort none

<details><summary>Answer</summary>

**Correct: D.** none minimizes thinking time.
**Incorrect:** the other options do not fit — slower; C and D — unrelated.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/reasoning

</details>

### 4. Which category gets Microsoft support and SLAs?

- A. Any marketplace model
- B. Unlisted models
- C. Sold directly by Azure
- D. Community

<details><summary>Answer</summary>

**Correct: C.** Models sold by Azure are supported by Microsoft.
**Incorrect:** the other options do not fit — provider support.
Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/foundry-models-overview

</details>
