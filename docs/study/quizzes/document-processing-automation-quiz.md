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

**Correct: B.** Content Understanding has *content-extraction* analyzers that turn a file into Markdown plus structure, and *field-extraction* analyzers that return named fields. A scan is just pixels, so it needs **OCR**: `prebuilt-read` returns text; `prebuilt-layout` adds tables, selection marks and structure. Use layout when the invoice has line-item tables, and then extract fields on top of it (for example with `prebuilt-invoice`).

```python
# pseudo-flow
markdown = analyze("prebuilt-layout", scanned_invoice)   # OCR + tables
fields   = analyze("prebuilt-invoice", scanned_invoice)  # typed invoice fields
```

**Why the others are wrong:**
- **A. `prebuilt-digitalParse`:** reads the embedded text of born-digital files; a scan has no embedded text.
- **C. `prebuilt-documentFieldSchema`:** proposes a field schema; it is not OCR.
- **D. `prebuilt-callCenter`:** analyzes call recordings.

Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/prebuilt-analyzers

</details>

### 2. Mixed procurement documents (invoices, purchase orders, receipts) arrive in one inbox. You want automatic classification and routing to the correct extractor. What do you use?

- A. `prebuilt-procurement`
- B. A separate custom model per sender
- C. `prebuilt-layout` only
- D. Manual sorting

<details><summary>Answer</summary>

**Correct: A.** `prebuilt-procurement` is a *composed* prebuilt analyzer: it first **classifies** each document as invoice, purchase order, receipt and so on, then **routes** it to the matching extractor, so the inbox can be processed without per-type logic. You can later copy and adapt it to add your own document types or fields.

**Why the others are wrong:**
- **B. Custom model per sender:** a lot of work, and a new sender breaks the process.
- **C. `prebuilt-layout` only:** gives text and structure but not typed fields such as `VendorName` or `Total`.
- **D. Manual sorting:** defeats automation.

Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/prebuilt-analyzers

</details>

### 3. A prebuilt analyzer's output changed after you moved to a new API version. How could you have avoided this?

- A. Use a larger model
- B. Retrieve the prebuilt definition and create your own custom analyzer copy for production
- C. Disable confidence scores
- D. Use only the preview API

<details><summary>Answer</summary>

**Correct: B.** Prebuilt analyzers are maintained by Microsoft and can change between API versions (new fields, better models). A production pipeline whose downstream mapping expects a fixed output should not depend on that. Learn recommends **retrieving the prebuilt definition and creating your own custom analyzer from it**. Your copy is stable until you change it, and you can regression-test a new API version against a golden set before moving.

```http
GET  {endpoint}/contentunderstanding/analyzers/prebuilt-invoice?api-version=<ver>     # read the definition
PUT  {endpoint}/contentunderstanding/analyzers/contoso-invoice?api-version=<ver>      # create your copy
```

(Check the REST reference for the current version and exact path.)

**Why the others are wrong:**
- **A. Larger model / C. Disable confidence scores:** unrelated to versioning.
- **D. Preview API only:** preview versions are not recommended for production and change more often.

Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/prebuilt-analyzers

</details>

### 4. An analysis returns success, but the invoice total field is empty. A guardrail warning is present. What is the right pipeline behavior?

- A. Post the invoice with a zero total
- B. Treat the warning or missing required field as a trigger for human review
- C. Retry forever
- D. Ignore warnings

<details><summary>Answer</summary>

**Correct: B.** A call can return success (the file was processed) while a field is empty because a **content guardrail** blocked generating that value; the extracted source content is preserved, but the derived value is withheld. Your pipeline must not equate "HTTP 200" with "usable data". Rule: any warning, or any **required field that is missing**, sends the document to **human review** with the reason. Never post to the ERP with an invented value.

```python
required = ["VendorName", "InvoiceId", "InvoiceTotal"]
missing = [f for f in required if not fields.get(f)]
if missing or result.warnings:
    queue_for_review(doc_id, reason={"missing": missing, "warnings": result.warnings})
else:
    post_to_erp(fields)
```

**Why the others are wrong:**
- **A. Zero total:** creates bad financial data.
- **C. Retry forever:** the guardrail will trigger again; retries only cost money.
- **D. Ignore warnings:** the same risk as A.

Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/overview

</details>

### 5. Finance wants to auto-approve only invoices whose total is reliable. Which combination supports that decision per field?

- A. Confidence scores and grounding, plus business-rule validation
- B. OCR alone
- C. Summaries of the document
- D. A larger chunk size

<details><summary>Answer</summary>

**Correct: A.** Three signals work together:
- **Confidence** says how sure the service is about each field (0 to 1).
- **Grounding** points to where the value came from (page and bounding box), so a reviewer can verify quickly.
- **Business rules** catch errors a confident model can still make: line items sum to the subtotal, subtotal + tax = total, vendor exists in master data, PO matches.

Set thresholds per field (total stricter than notes), and measure the **error rate of auto-approved documents** with a monthly audit sample.

```python
def auto_approve(f: dict) -> bool:
    total_ok = f["InvoiceTotal"].confidence >= 0.95
    rules_ok = abs(sum(l.amount for l in f["Items"]) + f["Tax"].value - f["InvoiceTotal"].value) < 0.01
    return total_ok and rules_ok and vendor_exists(f["VendorId"].value)
```

**Why the others are wrong:**
- **B. OCR alone:** reads characters, gives no reliability for a field.
- **C. Summaries:** do not measure field reliability.
- **D. Larger chunk size:** a RAG setting, unrelated.

Source: case study sections 4 and 5

</details>

### 6. The same invoice arrives twice from two email threads. How do you avoid paying twice?

- A. Ask the model to detect duplicates
- B. Use an idempotency key and a file hash check before posting
- C. Increase confidence thresholds
- D. Delete older invoices daily

<details><summary>Answer</summary>

**Correct: B.** A model can only guess whether two documents are the same, and guesses are wrong sometimes. Use **deterministic** checks: a **file hash** (SHA-256) catches the identical file; an **idempotency key** built from vendor + invoice number + amount catches the same invoice in another file or format. Store the key with a unique constraint, so a retry or duplicate insert is rejected or returns the existing result.

```python
import hashlib

file_hash = hashlib.sha256(pdf_bytes).hexdigest()
idem_key = f"{vendor_id}|{invoice_number}|{amount:.2f}"
if db.exists(file_hash) or db.exists(idem_key):
    return "duplicate: skipped"
post_to_erp(fields, idempotency_key=idem_key)
db.save(file_hash, idem_key)
```

**Why the others are wrong:**
- **A. Ask the model:** probabilistic, can miss or invent duplicates.
- **C. Higher confidence thresholds:** measures extraction certainty, not duplication.
- **D. Delete older invoices:** loses the audit trail.

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
