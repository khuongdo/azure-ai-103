---
note: docs/study/real-world/document-processing-automation.md
skill: Extract content from documents (OCR, layout analysis, field extraction; Content Understanding analyzers)
retrieved: 2026-10-12
---

# Quiz: invoice and contract automation

Based on the [case study](../real-world/document-processing-automation.md). The last two are **design questions**.

## Flashcards

**Q:** What does `prebuilt-procurement` do?
**A:** A **composed analyzer** that classifies a procurement document and routes it to the right analyzer (invoice, purchase order, receipt, credit memo, utility bill).

**Q:** Which analyzers need no language or embedding model?
**A:** Content-extraction analyzers: `prebuilt-read`, `prebuilt-layout`, `prebuilt-digitalParse`.

**Q:** When do you use `prebuilt-digitalParse`?
**A:** For machine-readable files; for scans use `prebuilt-read` or `prebuilt-layout`.

**Q:** What are the three field methods?
**A:** **Extract**, **Classify**, **Generate**.

**Q:** Which setting returns confidence and grounding?
**A:** `estimateFieldSourceAndConfidence` (confidence 0 to 1; source regions).

**Q:** Which API version is GA for production?
**A:** `2025-11-01`; `2026-06-01-preview` is preview.

**Q:** Why copy a prebuilt analyzer before production use?
**A:** Prebuilt definitions **can change across API versions**; your copy is stable.

**Q:** What can happen when a guardrail detects something during analysis?
**A:** The call can **succeed with warnings** and some fields missing.

**Q:** What does the `usage` object let you do?
**A:** Attribute cost per document (`documentPagesStandard`, `contextualizationTokens`, per-model tokens, and so on).

**Q:** What should you protect against when posting to the ERP?
**A:** Duplicates: use an **idempotency key** (vendor + invoice number + amount).

**Q:** Which metric matters most for automation risk?
**A:** The **error rate among auto-approved** documents.

## Practice questions

### 1. A pipeline receives scanned invoices as images. Which content-extraction analyzer family is appropriate before field extraction?

- A. `prebuilt-digitalParse`
- B. `prebuilt-read` or `prebuilt-layout`
- C. `prebuilt-documentFieldSchema`
- D. `prebuilt-callCenter`

<details><summary>Answer</summary>

**Correct: B.** Scans need OCR; read and layout provide it.
**Incorrect:** A — it reads machine-readable internals; C — it proposes a schema; D — it analyzes call recordings.
Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/prebuilt-analyzers

</details>

### 2. Mixed procurement documents (invoices, purchase orders, receipts) arrive in one inbox. You want automatic classification and routing to the correct extractor. What do you use?

- A. `prebuilt-procurement`
- B. A separate custom model per sender
- C. `prebuilt-layout` only
- D. Manual sorting

<details><summary>Answer</summary>

**Correct: A.** It classifies and routes to the right procurement analyzer.
**Incorrect:** B — unnecessary effort; C — extracts structure but not typed fields; D — defeats automation.
Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/prebuilt-analyzers

</details>

### 3. A prebuilt analyzer's output changed after you moved to a new API version. How could you have avoided this?

- A. Use a larger model
- B. Retrieve the prebuilt definition and create your own custom analyzer copy for production
- C. Disable confidence scores
- D. Use only the preview API

<details><summary>Answer</summary>

**Correct: B.** Learn advises copying the prebuilt analyzer rather than relying on it directly in production.
**Incorrect:** A and C — unrelated; D — preview versions are not recommended for production.
Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/prebuilt-analyzers

</details>

### 4. An analysis returns success, but the invoice total field is empty. A guardrail warning is present. What is the right pipeline behavior?

- A. Post the invoice with a zero total
- B. Treat the warning or missing required field as a trigger for human review
- C. Retry forever
- D. Ignore warnings

<details><summary>Answer</summary>

**Correct: B.** Guardrails can block field generation while preserving extracted source content, so analysis can succeed with missing values.
**Incorrect:** A and D — would create bad data; C — retries do not fix a guardrail detection.
Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/overview

</details>

### 5. Finance wants to auto-approve only invoices whose total is reliable. Which combination supports that decision per field?

- A. Confidence scores and grounding, plus business-rule validation
- B. OCR alone
- C. Summaries of the document
- D. A larger chunk size

<details><summary>Answer</summary>

**Correct: A.** Confidence says how sure the model is; grounding lets a reviewer verify; rules catch errors a confident model can still make.
**Incorrect:** B — OCR does not rate field reliability; C and D — unrelated.
Source: case study sections 4 and 5

</details>

### 6. The same invoice arrives twice from two email threads. How do you avoid paying twice?

- A. Ask the model to detect duplicates
- B. Use an idempotency key and a file hash check before posting
- C. Increase confidence thresholds
- D. Delete older invoices daily

<details><summary>Answer</summary>

**Correct: B.** Deterministic identifiers make retries and duplicates harmless.
**Incorrect:** A — probabilistic; C — does not detect duplicates; D — loses audit trail.
Source: case study sections 5 and 9

</details>

## Design questions

### 7. Design the confidence-based review flow for 40,000 invoices a month.

<details><summary>Model answer and checklist</summary>

1. **Per-field thresholds** by importance (total and tax stricter than notes).
2. **Validation rules:** line items sum to subtotal; subtotal plus tax equals total; vendor in master data; PO match.
3. **Route:** all important fields above threshold and all rules pass → straight-through; otherwise → review queue **with reasons**.
4. **Review UI** shows the page with **grounding highlights** and only uncertain fields.
5. **Close the loop:** corrections become labeled data for analyzer improvement.
6. **Measure:** field accuracy, auto-approval rate, **error rate of auto-approved** documents (monthly audit sample), review time, confidence calibration, cost per document.
7. **Failure handling:** unreadable or password-protected files go to a manual queue with a reason code.

Pick thresholds so the auto-approved error rate stays under an agreed limit, not to maximize automation.

</details>

### 8. When would you choose Document Intelligence instead of, or beside, Content Understanding?

<details><summary>Model answer and checklist</summary>

- **Document Intelligence:** deterministic, high-accuracy extraction from structured documents and known forms; prebuilt models (invoice, receipt, ID and more), custom neural/template/composed models and classifiers; current API v4.0 (2024-11-30).
- **Content Understanding:** LLM-powered, multimodal (documents, images, audio, video), schema-driven fields with confidence and grounding, Markdown for RAG, domain analyzers and composed routing.
- Use both when a high-volume fixed-layout form benefits from deterministic extraction while varied or complex content uses Content Understanding. They are complementary.

</details>
