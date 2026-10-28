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

**Correct: B.** Provenance for supported Microsoft models has two layers: **Content Credentials (C2PA) metadata** written into the file, and **invisible watermarks** inside the pixels. Resizing, cropping, format conversion and re-saving can **strip the metadata layer**, so a check that looks for C2PA data finds nothing. This is expected, not a defect. Practice: keep the original file, check provenance when you ingest, record the result in your asset system, and label AI content explicitly in your UI.

**Why the others are wrong:**
- **A. Watermarks visible:** they are invisible.
- **C. Model failed:** the image was generated and signed correctly.
- **D. C2PA is video only:** images are covered.

Source: https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/content-safety/provenance-disclosure

</details>

### 2. Which severity scale does the multimodal image-with-text model use?

- A. None
- B. 0, 2 only
- C. 1 to 3
- D. Full 0 to 7

<details><summary>Answer</summary>

**Correct: D.** Azure AI Content Safety returns severity differently by content type:
| Content | Severity returned |
|---|---|
| Text | Full scale 0 to 7 (trimmed 0, 2, 4, 6 on request) |
| Image | Trimmed scale: 0, 2, 4, 6 |
| **Image with text (multimodal model)** | **Full 0 to 7** (trimmed on request) |

Why it matters: your thresholds must match the scale; "block at 4 or higher" selects different content on a 0-7 scale than on a 0/2/4/6 scale.

```python
from azure.ai.contentsafety import ContentSafetyClient
from azure.ai.contentsafety.models import AnalyzeTextOptions

client = ContentSafetyClient(endpoint, credential)
resp = client.analyze_text(AnalyzeTextOptions(text=user_text, output_type="EightSeverityLevels"))
blocked = any(c.severity >= 4 for c in resp.categories_analysis)
```

**Why the others are wrong:**
- **A. None:** every category returns a severity.
- **B. 0, 2 only / C. 1 to 3:** not scales used by the service.

Source: https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/harm-categories

</details>

### 3. Before publishing generated visuals what step is key?

- A. Human approval with logged reviewer
- B. Auto publish
- C. Skip filters
- D. Delete logs

<details><summary>Answer</summary>

**Correct: A.** Automated filters reduce risk but do not carry accountability. Before AI-generated visuals are published: run safety checks, then **human approval** with the reviewer recorded, and store an **audit record** (prompt, parameters, model and version, reviewer, time, decision). Keep Content Credentials, and label the asset as AI-generated. This lets you answer "who approved this and why" later.

```python
audit = {
    "asset_id": asset.id, "prompt": prompt, "model": "gpt-image-2", "model_version": ver,
    "safety": safety_result, "reviewer": reviewer_id, "decision": "approved",
    "approved_at": datetime.now(timezone.utc).isoformat(),
}
audit_log.insert(audit)
```

**Why the others are wrong:**
- **B. Auto publish / C. Skip filters:** remove controls.
- **D. Delete logs:** destroys the audit trail.

Source: https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/content-safety/provenance-disclosure

</details>

### 4. Where apply content filters?

- A. Logs
- B. Neither
- C. Input and output
- D. Output only

<details><summary>Answer</summary>

**Correct: C.** Filter **both directions**:
- **Input:** blocks harmful or attacking prompts (and prompt injection with Prompt Shields) before generation; saves cost.
- **Output:** catches harmful content the model produced anyway, including from a harmless-looking prompt.

For multimodal flows apply the same idea: check uploaded images, the text inside them, and the generated image or text.

```python
if is_blocked(analyze(user_input)):                 # input filter
    return refusal()
output = model(user_input)
if is_blocked(analyze(output)):                     # output filter
    return refusal()
```

**Why the others are wrong:**
- **A. Logs:** logs record events, they do not stop content.
- **B. Neither:** no protection.
- **D. Output only:** harmful input still reaches the model and costs tokens.

Source: https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/harm-categories

</details>
