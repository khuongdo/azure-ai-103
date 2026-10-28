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

**Correct: C.** Adaptive custom translation takes a small set of aligned bilingual pairs (5 to 10,000, each up to 500 characters) and builds an index that steers an LLM translation toward your terminology and style. 3,000 pairs sits inside that range, and the result is ready in minutes because nothing is trained. At request time you pass the adaptive dataset index ID, or up to five reference translations, together with the LLM model choice. (Exact request field names are not shown here; check the API reference `[NEEDS VERIFICATION]`.)


**Why the others are wrong:**
- **A. Language detection** only identifies the source language of a text. It does not change how text is translated.
- **B. Transliterate** converts a script (for example Cyrillic to Latin) without translating meaning.
- **D. Voice Live** is a real-time speech interaction feature, not a text translation customization.

**Exam clue:** "small dataset" + "quick" + "LLM" points to adaptive custom translation; "large parallel corpus" + "BLEU" points to Custom Translator (question 2).

Source: https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/overview

</details>

### 2. You have a large parallel corpus and want a trained NMT model with BLEU reporting. What do you use?

- A. Custom Translator
- B. Speech translation
- C. Content Safety
- D. Glossary only

<details><summary>Answer</summary>

**Correct: A.** Custom Translator is the only option that trains a custom NMT system. The workflow is: create a workspace and project, upload parallel documents (and optional dictionaries), train, review the **BLEU** score on the test set, publish, then call text translation with the published custom model identifier. BLEU compares machine output with a human reference; higher is better, but only compare scores measured on the same test set.

**Why the others are wrong:**
- **B. Speech translation** translates live audio. It is not a text-model training tool.
- **C. Content Safety** detects harmful content; it has nothing to do with translation quality.
- **D. Glossary only** forces fixed term mappings in a document translation job (CSV, XLIFF or TSV). It trains nothing and produces no BLEU score.

**Exam clue:** the words "trained" and "BLEU" together mean Custom Translator.

Source: https://learn.microsoft.com/en-us/azure/ai-services/translator/custom-translator/overview

</details>

### 3. A request returns 403 with a valid key. What is the likely cause?

- A. Missing language
- B. Unsupported operation or configuration for the region/resource
- C. Invalid JSON
- D. Rate limit

<details><summary>Answer</summary>

**Correct: B.** A 403 means the service accepted your credentials but refuses the operation. Typical cases: you asked for an LLM translation on a resource that is not a Foundry resource, or the feature is not available in that region. Fix it by checking the resource type, region and the model/operation you call, not the key.

| Status | Meaning |
|---|---|
| 400 | Invalid payload or unsupported language |
| 401 | Missing or bad key |
| 403 | Valid credentials, unsupported operation or configuration |
| 429 | Rate limit |

**Why the others are wrong:**
- **A. Missing language** and **C. Invalid JSON** are payload problems, so they return **400**.
- **D. Rate limit** returns **429**; retry with backoff.

**Exam clue:** "valid key" removes 401; "403" removes 400 and 429.

Source: https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/overview

</details>

### 4. Which path suits tone and gender controls?

- A. Language detection
- B. Transliterate
- C. LLM-based translation
- D. NMT

<details><summary>Answer</summary>

**Correct: C.** Tone (formal, informal, neutral) and gender controls are supported only on the LLM translation path, which needs a Foundry resource. NMT is a fixed neural model with no such parameters, so keep NMT for high-volume baseline traffic and send only text where tone or context matters to an LLM. Remember the lower limits on the LLM path: 50 array elements and 5,000 characters per element (NMT: 1,000 and 50,000), and billing per token instead of per source character.

**Why the others are wrong:**
- **A. Language detection** and **B. Transliterate** are separate operations; neither controls how a sentence is translated.
- **D. NMT** translates quickly and cheaply but has no tone or gender controls.

**Exam clue:** "formal/informal" or "gender" means LLM translation.

Source: https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/overview

</details>
