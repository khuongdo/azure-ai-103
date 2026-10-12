---
note: docs/study/real-world/multilingual-content-pipeline.md
skill: Build solutions that translate text with Azure Translator in Foundry Tools or LLM-powered translation flows; translate speech; customize outputs for domain tasks
retrieved: 2026-10-12
---

# Quiz: multilingual content pipeline

Based on the [case study](../real-world/multilingual-content-pipeline.md). The last two are **design questions**.

## Flashcards

**Q:** Which two text translation API versions are GA?
**A:** v3 and `2026-06-06` (adds LLM selection, adaptive custom translation, more parameters).

**Q:** What is adaptive custom translation?
**A:** Upload **5 to 10,000** aligned segment pairs (up to **500 characters** each); the service builds a custom bilingual index in minutes to adapt a supported LLM.

**Q:** Custom Translator vs adaptive custom translation?
**A:** Custom Translator trains customized models with dictionaries (heavier, own portal); adaptive is quick and LLM-based.

**Q:** Batch vs synchronous document translation?
**A:** Batch = many or large files, needs Blob containers; synchronous = one file returned directly, no storage account, custom-domain endpoint needed.

**Q:** How does batch translation authorize storage access?
**A:** **SAS tokens** or **managed identities** (prefer managed identity).

**Q:** Which glossary formats are supported?
**A:** CSV, XLIFF, TSV (tab).

**Q:** What determines where document content is processed?
**A:** The **region of the Translator resource**.

**Q:** What changes with VNet "selected networks and private endpoints"?
**A:** You must use the **custom endpoint**, not the global endpoint, and cannot use an access token.

**Q:** How are scanned PDFs handled?
**A:** OCR extracts and translates the text while retaining layout.

**Q:** Legacy format conversions on output?
**A:** `.doc`, `.odt`, `.rtf` become `.docx`; `.xls`, `.ods` become `.xlsx`; `.ppt`, `.odp` become `.pptx`.

**Q:** Where does the Foundry portal support document translation?
**A:** Synchronous single-file only; batch needs REST or SDK.

## Practice questions

### 1. Thousands of product manuals in Word and PowerPoint must be translated into 12 languages, keeping layout. Which feature fits?

- A. Synchronous document translation per file
- B. Asynchronous batch document translation
- C. Speech translation
- D. Text translation of copied paragraphs

<details><summary>Answer</summary>

**Correct: B.** Batch handles many and large files while preserving structure and format.
**Incorrect:** A — one file at a time; C — speech; D — loses layout.
Source: https://learn.microsoft.com/en-us/azure/ai-services/translator/document-translation/overview

</details>

### 2. Your product name "FlowSet" keeps being translated. What is the best control?

- A. Translate twice
- B. Add the term to a glossary (or prevent-translation markup)
- C. Increase quota
- D. Use speech translation

<details><summary>Answer</summary>

**Correct: B.** Glossaries (and prevent-translation) control protected terms.
**Incorrect:** A — no effect; C and D — unrelated.
Source: https://learn.microsoft.com/en-us/azure/ai-services/translator/overview

</details>

### 3. You have 3,000 approved human-translated segment pairs (each under 500 characters) and want domain adaptation quickly, without training a full model. What do you use?

- A. Custom Translator only
- B. Adaptive custom translation
- C. Document translation sync
- D. Language detection

<details><summary>Answer</summary>

**Correct: B.** 5 to 10,000 pairs build a custom index in minutes to adapt a supported LLM.
**Incorrect:** A — heavier; C and D — unrelated.
Source: https://learn.microsoft.com/en-us/azure/ai-services/translator/overview

</details>

### 4. Translator is configured with private endpoints, but your app gets authentication errors using the global endpoint and an access token. What is wrong?

- A. The resource must be recreated
- B. With selected networks and private endpoints you must use the resource's custom endpoint and key-based or supported auth, not the global endpoint or an access token
- C. Add more glossary entries
- D. Use Blob Storage

<details><summary>Answer</summary>

**Correct: B.** Learn states the custom endpoint is required and access tokens are not supported in that configuration.
**Incorrect:** A, C, D — unrelated.
Source: https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/v3/reference

</details>

### 5. A translated safety manual drops the word "not" in one sentence. Which pipeline step should catch this class of error?

- A. Automatic placeholder checks only
- B. Risk-tiered human review (Tier 1 for safety) plus automated checks for numbers and negations
- C. Faster batch jobs
- D. Larger source files

<details><summary>Answer</summary>

**Correct: B.** High-stakes content needs bilingual review; automatic checks help but are not enough.
**Incorrect:** A — placeholders do not catch meaning; C and D — unrelated.
Source: case study sections 5 and 6

</details>

### 6. An unchanged paragraph is re-translated every week, raising cost. What is the fix?

- A. Hash source segments and translate only what changed
- B. Switch languages
- C. Disable glossaries
- D. Use larger documents

<details><summary>Answer</summary>

**Correct: A.** Cache by source hash; record glossary and model versions.
**Incorrect:** B, C, D — do not reduce repeated work.
Source: case study section 7

</details>

## Design questions

### 7. Design a pipeline that translates manuals into German, French and Japanese with consistent terminology.

<details><summary>Model answer and checklist</summary>

1. **Terminology first:** approved terms per language, protected product names, forbidden terms as a glossary (CSV, XLIFF or TSV).
2. **Customization** only if measurements show domain errors: adaptive custom translation, then Custom Translator.
3. **Storage and access:** source and target containers, managed identity, right roles; mind the Translator resource region for residency.
4. **Batch translation** with glossary and language detection; poll job and document status.
5. **Automated checks:** placeholders, numbers and units, glossary hits, untranslated blocks, length.
6. **Risk tiers:** Tier 1 human review, Tier 2 spot check, Tier 3 machine only.
7. **Learn:** reviewer edits become segment pairs for the next adaptive update; record glossary and model versions.

</details>

### 8. When would you add an LLM step to a translation pipeline, and what controls would you add?

<details><summary>Model answer and checklist</summary>

- Use it where **tone, context or reasoning** matter (marketing copy, nuanced replies), often after or beside Translator.
- Give it the **glossary** and forbid changes to protected terms; keep it away from Tier 1 safety text.
- You own **layout handling, consistency, cost, safety and evaluation**; compare outputs with the source.
- Add guardrails and regression tests per language.

</details>
