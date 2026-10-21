---
note: docs/study/deep-dives/content-understanding-and-document-intelligence.md
skill: Extract content and fields from documents, images, audio and video
retrieved: 2026-10-12
---

# Quiz: Content Understanding and Document Intelligence

Based on the [deep dive](../deep-dives/content-understanding-and-document-intelligence.md).

## Flashcards

**Q:** What is an analyzer?
**A:** A reusable configuration defining content type, extraction, output shape and models.

**Q:** Field methods?
**A:** extract, classify, generate.

**Q:** Which base analyzers exist?
**A:** prebuilt-document, prebuilt-audio, prebuilt-video, prebuilt-image.

**Q:** What goes in models: names or deployment names?
**A:** Model names from the catalog; the service maps to your deployments.

**Q:** How do you split a multi-document file?
**A:** enableSegment true with contentCategories.

**Q:** Why include an 'other' category?
**A:** Otherwise every page is forced into a listed category.

**Q:** Max classifier categories?
**A:** 200.

**Q:** When use confidence and grounding?
**A:** Route low-confidence fields to human review.

**Q:** Which content types can pro mode (multi-step reasoning) handle?
**A:** Documents only (per the study material; the current Learn pages describe agentic mode for documents instead) `[NEEDS VERIFICATION]`.

**Q:** One analyzer must return transcript-based fields and on-screen text from videos. What do you use?
**A:** A video analyzer with a field schema (standard processing), not separate pipelines.

## Practice questions

### 1. A PDF packet contains a loan form, pay slip and bank statement. How do you classify and extract each?

- A. Three separate uploads manually
- B. Layout model only
- C. Translator
- D. One analyzer with enableSegment true and contentCategories linked to analyzers

<details><summary>Answer</summary>

**Correct: D.** Segmentation classifies page ranges and routes each to an analyzer.
**Incorrect:** the other options do not fit — manual; C and D — do not classify.
Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/classifier

</details>

### 2. A field must be copied exactly as printed on an invoice. Which method?

- A. classify
- B. generate
- C. extract
- D. none

<details><summary>Answer</summary>

**Correct: C.** extract returns values as they appear (with source and confidence).
**Incorrect:** the other options do not fit — free generation; C — fixed categories.
Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/analyzer-reference

</details>

### 3. You want deterministic extraction from standard invoices. What fits best?

- A. Document Intelligence prebuilt invoice (or CU prebuilt-invoice)
- B. Translator
- C. Video analyzer
- D. Speech

<details><summary>Answer</summary>

**Correct: A.** Prebuilt invoice models are built for this.
**Incorrect:** the other options do not fit — wrong modality.
Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/document/overview

</details>

### 4. Analyzer creation fails after specifying a model. You used a deployment name. What is the fix?

- A. Use the catalog model name and connect the deployment at resource level
- B. Disable OCR
- C. Use API key
- D. Rename the analyzer

<details><summary>Answer</summary>

**Correct: A.** models expects model names, not deployment names.
**Incorrect:** the other options do not fit — not the cause.
Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/analyzer-reference

</details>

### 5. A pipeline must pull spoken-topic fields and on-screen text from training videos into one structured result. What is the simplest design?

- A. One Content Understanding video analyzer with a field schema
- B. Pro mode with reference documents
- C. Speech to text, then OCR frames, then a custom LLM merge
- D. Document Intelligence Layout

<details><summary>Answer</summary>

**Correct: A.** A video analyzer with a field schema returns both in one result.
**Incorrect:** B — pro mode is for documents; C — extra moving parts for something one analyzer does; D — Layout reads documents, not video.
Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/video/overview

</details>
