---
note: docs/study/deep-dives/responsible-ai-governance.md
skill: Responsible AI framework and evaluation
retrieved: 2026-10-12
---

# Quiz: responsible AI and governance

Based on the [deep dive](../deep-dives/responsible-ai-governance.md).

## Flashcards

**Q:** Three activities of the framework?
**A:** Discover, Protect, Govern.

**Q:** Text severity scale?
**A:** 0 to 7 (trimmed 0, 2, 4, 6).

**Q:** Image severity scale?
**A:** 0, 2, 4, 6.

**Q:** Default threshold for harm evaluators?
**A:** 3; pass if score is at or below.

**Q:** What is defect rate?
**A:** Share of test cases exceeding the threshold.

**Q:** Which evaluator targets prompt injection through content?
**A:** Indirect attack (XPIA).

**Q:** Which tool generates adversarial probes?
**A:** AI Red Teaming Agent.

**Q:** Which categories does Content Safety classify?
**A:** Hate and fairness, sexual, violence, self-harm.

## Practice questions

### 1. You must test for jailbreaks before release. What do you run?

- A. AI Red Teaming Agent
- B. Spillover
- C. Latency test
- D. Only unit tests

<details><summary>Answer</summary>

**Correct: A.** It generates adversarial probes scored by safety evaluators.
**Incorrect:** the other options do not fit — do not test attacks.
Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/risk-safety-evaluators

</details>

### 2. A harm evaluator scores 2 with default threshold. Result?

- A. Pass
- B. Fail
- C. Undefined
- D. Error

<details><summary>Answer</summary>

**Correct: A.** Pass if score is less than or equal to 3.
**Incorrect:** the other options do not fit — incorrect.
Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/risk-safety-evaluators

</details>

### 3. Which activity covers audit logs and approvals?

- A. Govern
- B. Train
- C. Discover
- D. Protect

<details><summary>Answer</summary>

**Correct: A.** Govern covers accountability and proof.
**Incorrect:** the other options do not fit — detection and runtime blocking.
Source: https://learn.microsoft.com/en-us/azure/foundry/responsible-use-of-ai-overview

</details>

### 4. Image model severities returned?

- A. 0 to 7
- B. 1 to 4
- C. 0 or 1
- D. 0, 2, 4, 6

<details><summary>Answer</summary>

**Correct: D.** The image model returns the trimmed scale.
**Incorrect:** the other options do not fit — text; C and D — incorrect.
Source: https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/harm-categories

</details>
