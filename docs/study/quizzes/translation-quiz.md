---
note: docs/study/deep-dives/translation.md
skill: Translate text and documents; customize output
retrieved: 2026-10-12
---

# Quiz: translation

Based on the [deep dive](../deep-dives/translation.md).

## Flashcards

**Q:** Which Translator API version is latest GA?
**A:** 2026-06-06 (v3.0 still exists).

**Q:** Request and response arrays in 2026-06-06?
**A:** inputs and value.

**Q:** What does LLM translation require?
**A:** A Microsoft Foundry resource.

**Q:** Adaptive custom translation data size?
**A:** 5 to 10,000 aligned pairs, up to 500 characters each (reference translations up to five per request).

**Q:** What is BLEU?
**A:** A score comparing machine translation to human reference; higher is better.

**Q:** Batch vs synchronous document translation?
**A:** Batch: many files, Blob storage; synchronous: one file, direct result.

**Q:** Max array elements per Translate request?
**A:** 1,000 for NMT, 50 for LLM.

**Q:** Which endpoint with VNet/private endpoints?
**A:** The custom endpoint; no access token.

## Practice questions

### 1. You have 3,000 approved segment pairs and want quick LLM domain adaptation. What do you use?

- A. Language detection
- B. Transliterate
- C. Adaptive custom translation
- D. Voice Live

<details><summary>Answer</summary>

**Correct: C.** Adaptive custom translation builds an index from 5 to 10,000 pairs.
**Incorrect:** the other options do not fit — unrelated.
Source: https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/overview

</details>

### 2. You have a large parallel corpus and want a trained NMT model with BLEU reporting. What do you use?

- A. Custom Translator
- B. Speech translation
- C. Content Safety
- D. Glossary only

<details><summary>Answer</summary>

**Correct: A.** Custom Translator trains custom NMT systems and reports BLEU.
**Incorrect:** the other options do not fit — no training; C and D — unrelated.
Source: https://learn.microsoft.com/en-us/azure/ai-services/translator/custom-translator/overview

</details>

### 3. A request returns 403 with a valid key. What is the likely cause?

- A. Missing language
- B. Unsupported operation or configuration for the region/resource
- C. Invalid JSON
- D. Rate limit

<details><summary>Answer</summary>

**Correct: B.** 403 means valid credentials but unsupported operation or configuration.
**Incorrect:** the other options do not fit — 429; C and D — 400.
Source: https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/overview

</details>

### 4. Which path suits tone and gender controls?

- A. Language detection
- B. Transliterate
- C. LLM-based translation
- D. NMT

<details><summary>Answer</summary>

**Correct: C.** Tone and gender controls apply to LLM translation.
**Incorrect:** the other options do not fit — not supported there.
Source: https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/overview

</details>
