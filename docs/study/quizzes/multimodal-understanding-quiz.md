---
note: docs/study/deep-dives/multimodal-understanding.md
skill: Analyze images and video
retrieved: 2026-10-12
---

# Quiz: multimodal understanding

Based on the [deep dive](../deep-dives/multimodal-understanding.md).

## Flashcards

**Q:** How are images sent to chat models?
**A:** As image_url content (URL or base64).

**Q:** Blob SAS image access role?
**A:** Storage Blob Data Reader with managed identity.

**Q:** Video analyzer for search?
**A:** prebuilt-videoSearch.

**Q:** Video sampling limit?
**A:** About 1 frame per second, resized to 512×512.

**Q:** What does video CU transcribe?
**A:** Speech only.

**Q:** How many contentCategories for video?
**A:** One.

**Q:** Image Analysis 4.0 retirement?
**A:** September 25, 2028.

**Q:** Risk of text in images?
**A:** Indirect prompt injection.

## Practice questions

### 1. Users need to find a moment in a video library. What?

- A. Compress video
- B. Translate
- C. Whole-file embeddings only
- D. Per-segment results from prebuilt-videoSearch indexed with timestamps

<details><summary>Answer</summary>

**Correct: D.** Segments allow moment-level retrieval.
**Incorrect:** the other options do not fit — coarse or unrelated.
Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/prebuilt-analyzers

</details>

### 2. A screenshot says 'ignore your rules'. What is it?

- A. Bias
- B. Blur
- C. Indirect prompt injection
- D. Rate limit

<details><summary>Answer</summary>

**Correct: C.** Embedded text can carry instructions.
**Incorrect:** the other options do not fit — different.
Source: https://learn.microsoft.com/en-us/azure/foundry/guardrails/guardrails-overview

</details>

### 3. Same fields extracted from many product photos. Which tool?

- A. Translator
- B. CU custom image analyzer
- C. Speech
- D. Language

<details><summary>Answer</summary>

**Correct: B.** Schema-based image field extraction.
**Incorrect:** the other options do not fit — wrong modality.
Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/image/overview

</details>

### 4. Video analyzer returns which outputs?

- A. Only audio
- B. Only images
- C. Only SQL
- D. Markdown and JSON

<details><summary>Answer</summary>

**Correct: D.** Markdown with transcript and key frames plus JSON.
**Incorrect:** the other options do not fit — wrong.
Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/video/overview

</details>
