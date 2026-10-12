---
domain: Information extraction; Computer vision
skill: Extract content from documents (OCR, layout analysis, field extraction; Content Understanding analyzers)
sources:
  - https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/prebuilt-analyzers
  - https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/overview
  - https://learn.microsoft.com/en-us/azure/foundry/guardrails/guardrails-overview
retrieved: 2026-10-12
---

# Real-world: automating invoice and contract processing

Part of [Real-world practice](index.md).

## 1. The problem

A finance team receives about 40,000 invoices a month as PDFs, scans and photographed receipts in dozens of layouts, plus purchase orders and supplier contracts. Clerks retype fields into the ERP system, errors cause payment disputes, and month-end is a bottleneck.

**Goals**

- Extract vendor, invoice number, dates, totals, tax and **line items** into structured data.
- **Straight-through processing** for documents the system is confident about; **human review** for the rest.
- Every value must be **traceable** to where it came from on the page.
- Contracts: pull key terms (parties, term, renewal, payment) and summarize obligations.

## 2. Why this is an AI-103 problem

| Need | Skill area |
|---|---|
| OCR, layout analysis and field extraction | Extract content from documents |
| Analyzers producing structured or Markdown output | Implement analyzers with Content Understanding |
| Classifying and routing document types | Content Understanding classification |
| Guardrails, confidence, human oversight | Responsible AI and agent oversight |

## 3. Choosing the extraction service

| Question | Content Understanding | Document Intelligence |
|---|---|---|
| Approach | Generative AI with multiple models that cross-validate; schema-driven | Machine-learning OCR and document models; deterministic |
| Best for | Varied or complex documents, multimodal inputs, RAG-ready Markdown, prebuilt domain analyzers | High-accuracy extraction from structured documents and known forms |
| Output | Markdown or fields as JSON, with **confidence and grounding** | Structured fields, text, tables |
| Customization | Custom analyzer (copy a prebuilt, change fields); label data in Content Understanding Studio | Custom neural, template, composed models; custom classifier |

Learn positions them as complementary: Document Intelligence for reliable extraction from structured documents, Content Understanding for LLM-powered, multimodal and complex content. For this scenario start with **Content Understanding prebuilt analyzers** and keep Document Intelligence in mind for very high-volume, fixed-layout forms.

## 4. Solution architecture

```
Email / scanner / upload
        │  files land in Blob Storage ("inbox")
        ▼
 Orchestrator (function or workflow)
        │
        ├─ 1. prebuilt-procurement (composed): classify → route
        │         ├─ prebuilt-invoice
        │         ├─ prebuilt-purchaseOrder
        │         └─ prebuilt-receipt / creditMemo / utilityBill
        │     contracts → prebuilt-contract
        │
        ├─ 2. Validate (business rules)  ── totals add up? vendor known? PO match?
        │
        ├─ 3. Route by confidence ──► high: post to ERP
        │                          └► low / failed rule: review queue (human)
        ▼
  ERP / database  +  archive of source file and extraction JSON
```

Key analyzer facts (from Learn):

- `prebuilt-procurement` is a **composed analyzer** that classifies a procurement document and routes it to the right analyzer. `prebuilt-invoice` covers invoices, utility bills, sales orders and purchase orders; there are also receipt, purchase order, credit memo and utility bill analyzers. `prebuilt-contract` handles business contracts.
- Content-extraction analyzers (`prebuilt-read`, `prebuilt-layout`, `prebuilt-digitalParse`) do OCR/layout and need **no** language or embedding model. `prebuilt-digitalParse` reads machine-readable files from their internal structure; use `prebuilt-read` or `prebuilt-layout` for scans.
- Fields can be produced by **Extract** (value as written), **Classify** (pick a category) or **Generate** (free text such as a summary).
- `estimateFieldSourceAndConfidence` returns **confidence (0 to 1)** and **source grounding** for each field.
- Call an analyzer with `POST /analyzers/<analyzer-id>:analyze`.

### Walkthrough: what happens to one invoice

Example: a PDF named `inv_2291.pdf` arrives by email from a supplier.

1. **Land and register.** The attachment is saved in the Blob "inbox" and a record is created (file hash, received time, sender). The hash lets you detect the **same invoice arriving twice**, which would otherwise cause a duplicate payment.
2. **Classify and route.** The composed analyzer `prebuilt-procurement` looks at the document and decides what it is: an invoice, a purchase order, a receipt, a credit memo. *Why:* each type has different fields and different rules, and using the wrong schema yields wrong or missing fields.
3. **Extract.** The matching analyzer (`prebuilt-invoice`) first does **OCR and layout analysis** (words, tables, line-item rows), then **field extraction** into your schema: vendor name, invoice number, dates, subtotal, tax, total, and a table of line items. Each field comes back with a **confidence** (0 to 1) and a **grounding** reference (the region of the page it was read from).
4. **Check warnings.** Content Understanding inherits Foundry guardrails; a detection can appear as a warning and some fields may be missing even though the call "succeeded". The pipeline treats any warning or missing required field as a reason for review.
5. **Validate with business rules.** Plain code (not AI) checks: do line items sum to the subtotal? Does subtotal plus tax equal the total? Is the vendor in the vendor master? Does the PO number match an open purchase order? Rules catch errors that a confident model can still make, such as a misread digit.
6. **Decide by confidence.** If every important field is above its threshold and all rules pass, the invoice goes straight through. If a total is below threshold, a rule fails, or a warning exists, it goes to the review queue **with the reasons** attached.
7. **Review (when needed).** The reviewer sees the PDF with highlighted regions for the uncertain fields (this is what grounding enables), corrects them, and approves. The correction is saved as labeled data.
8. **Post to the ERP.** The approved data is written with an **idempotency key** (vendor + invoice number + amount) so a retry cannot create a second entry.
9. **Archive and learn.** Source file, extraction JSON, confidence values and the approver are archived for audit. Corrections feed analyzer improvement, and monthly sampling of auto-approved invoices measures the real error rate.

## 5. Build it, step by step

1. **Collect a representative sample**: 200+ real documents across vendors, languages, scan quality, and unusual cases (handwriting, stamps, multi-page invoices, credit notes).
2. **Run the prebuilt analyzer on the sample** and compare with the verified ERP values. Measure field-level accuracy. Prebuilt first; customize only where it falls short.
3. **Customize if needed.** Retrieve a prebuilt analyzer definition (`GET /analyzers/prebuilt-invoice`), edit the field schema, and create your own copy (`PUT /analyzers/<your-id>`). Learn warns that **prebuilt definitions can change across API versions**, so use your own copy in production for stable behavior.
4. **Pin the API version.** `2025-11-01` is GA and recommended for production. `2026-06-01-preview` adds features (agentic mode, signature detection, document metadata, richer classification) that are Preview; evaluate them in a separate environment.
5. **Design the validation layer.** Examples: line items sum to subtotal; subtotal + tax = total; currency and date formats; vendor exists; purchase order number matches an open PO. Disagreement between a "confident" value and a business rule is a review trigger.
6. **Route by confidence per field.** Set thresholds per field importance (total amount stricter than a free-text note). Use grounding to show the reviewer the highlighted region of the page.
7. **Build the review UI.** The reviewer sees the document, extracted fields with highlights, and only the uncertain fields. Save corrections as labeled data.
8. **Close the loop.** Feed corrections into analyzer improvement (labeled examples in Content Understanding Studio), and re-measure.
9. **Handle failures explicitly.** Unreadable file, wrong document type, password-protected PDF: send to a manual queue with a reason code; never drop silently.
10. **Archive** the source file, extraction JSON and the user who approved changes, for audit.

## 6. Quality plan

| Metric | How | Why |
|---|---|---|
| Field accuracy per field (exact match, tolerance for amounts) | Compare against the verified sample | Shows which fields can be automated |
| Auto-approval rate | Share of documents posted without review | Business value |
| **Error rate among auto-approved** | Audit a random sample monthly | The cost of false confidence |
| Review rate and handling time | Review queue stats | Staffing |
| Confidence calibration | Does 0.95 really mean about 95% correct? | Sets thresholds with evidence |
| Cost per document | Extraction + review minutes | Business case |

Pick thresholds so that the **auto-approved error rate** stays below an agreed limit (for example, errors that finance considers acceptable), not simply to maximize automation.

## 7. Safety, privacy and compliance

- Invoices and contracts contain personal and financial data. Use Entra ID/managed identities, private networking if required, and restrict who can read the archive.
- Content Understanding **inherits Foundry guardrails** on the model deployments it uses. A detection can show as a warning, and analysis can **succeed with some fields missing**. Treat any warning as a review trigger rather than ignoring it. You can use annotate-only behavior (with required approval) to keep detections for human review instead of automatic blocking.
- Detect and redact personal data before sharing extraction results widely (see PII detection in [contact-center analytics](contact-center-voice-and-analytics.md)).

## 8. Operating it

- **Throughput:** process asynchronously from a queue; respect service limits and retry throttling with backoff. See [capacity and throttling](../deep-dives/capacity-cost-and-throttling.md).
- **Monitoring:** track failures by reason, confidence distribution drift (a new vendor layout lowers confidence), and review queue age.
- **Change management:** treat analyzer changes like code: test on the sample, then promote.
- **Cost:** extraction uses contextualization tokens and model usage; high-resolution or figure analysis costs more. Each analyze response includes a `usage` object (for example `documentPagesStandard`, `audioHours`, `videoHours`, `contextualizationTokens` and per-model `tokens`), so you can attribute cost per document. Check the pricing explainer for how each meter is billed.

## 9. What goes wrong in practice

| Symptom | Likely cause | Fix |
|---|---|---|
| Totals correct, line items wrong | Multi-page table or merged cells | Layout analyzer first; test long invoices; custom field for line items |
| Low confidence on one vendor | New layout | Add to the sample; custom analyzer; labeled examples |
| Handwritten notes misread | Annotation detection limits | Treat handwriting as review-only |
| Silent missing fields | Guardrail warning or schema mismatch | Alert on warnings; validate required fields |
| Duplicate payments | Same invoice arrives twice | Idempotency key (vendor + invoice number + amount) |
| Wrong document type | Classification error | Review the routing; add a custom classifier if needed |

## 10. Variations

- **RAG over documents:** use `prebuilt-documentSearch` (Markdown, figure descriptions, chunked output for embeddings) instead of field schemas.
- **Identity checks:** `prebuilt-idDocument` and passport analyzers for onboarding flows.
- **Mortgage or tax packets:** composed analyzers (`prebuilt-mortgage.us`, `prebuilt-tax.us`) classify and route multi-document bundles.

## Sources and open items

See the frontmatter. Example metrics and the validation rules are illustrative design choices. Queues, functions and storage for orchestration are standard Azure components chosen for the example, not something Learn's Content Understanding pages prescribe.
