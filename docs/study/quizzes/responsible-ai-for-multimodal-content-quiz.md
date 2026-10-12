---
note: docs/study/deep-dives/responsible-ai-for-multimodal-content.md
skill: Responsible AI for generated content
retrieved: 2026-10-12
---

# Quiz: responsible AI for multimodal content

Based on the [deep dive](../deep-dives/responsible-ai-for-multimodal-content.md).

## Flashcards

**Q:** Image severities?
**A:** 0, 2, 4, 6.

**Q:** Image with text severities?
**A:** Full 0 to 7.

**Q:** Check provenance with?
**A:** Content Provenance Detection site or API.

**Q:** What can strip C2PA metadata?
**A:** Cropping, resizing, format conversion, re-saving.

**Q:** Invisible watermark visible?
**A:** No.

**Q:** Filter where?
**A:** Inputs and outputs.

**Q:** Disclose what?
**A:** That content is AI-generated.

**Q:** Log what for audit?
**A:** Prompt, model, version, reviewer.

## Practice questions

### 1. Provenance check fails after resizing. Why?

- A. Watermarks visible
- B. Metadata was stripped
- C. Model failed
- D. C2PA is video only

<details><summary>Answer</summary>

**Correct: B.** Transformations can remove metadata.
**Incorrect:** the other options do not fit — incorrect.
Source: https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/content-safety/provenance-disclosure

</details>

### 2. Which severity scale does the multimodal image-with-text model use?

- A. None
- B. 0, 2 only
- C. 1 to 3
- D. Full 0 to 7

<details><summary>Answer</summary>

**Correct: D.** Full scale.
**Incorrect:** the other options do not fit — incorrect.
Source: https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/harm-categories

</details>

### 3. Before publishing generated visuals what step is key?

- A. Human approval with logged reviewer
- B. Auto publish
- C. Skip filters
- D. Delete logs

<details><summary>Answer</summary>

**Correct: A.** Approval and audit trail.
**Incorrect:** the other options do not fit — unsafe.
Source: https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/content-safety/provenance-disclosure

</details>

### 4. Where apply content filters?

- A. Logs
- B. Neither
- C. Input and output
- D. Output only

<details><summary>Answer</summary>

**Correct: C.** Both sides.
**Incorrect:** the other options do not fit — incomplete.
Source: https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/harm-categories

</details>
