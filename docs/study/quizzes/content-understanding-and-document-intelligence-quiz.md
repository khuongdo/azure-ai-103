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

**Correct: D.** One PDF holds several document types, so you need **classification plus routing**. In Content Understanding you create one analyzer with `enableSegment: true` and `contentCategories`. The service splits the file into page ranges (segments), assigns each to a category, and runs the analyzer linked to that category, so each segment is extracted with the right field schema. Include an **"other"** category, otherwise every page is forced into a listed category. A classifier supports up to 200 categories.

Walkthrough: pages 1-2 → category `loan_application` → `loanAnalyzer` extracts applicant and amount; page 3 → `pay_slip` → `paySlipAnalyzer`; pages 4-6 → `bank_statement`; a cover sheet → `other`.

```json
// illustrative sketch of the analyzer definition
{
  "baseAnalyzerId": "prebuilt-document",
  "config": {
    "enableSegment": true,
    "contentCategories": {
      "loan":      { "description": "Loan application form", "analyzerId": "loanAnalyzer" },
      "pay_slip":  { "description": "Employee pay slip",     "analyzerId": "paySlipAnalyzer" },
      "statement": { "description": "Bank statement",        "analyzerId": "statementAnalyzer" },
      "other":     { "description": "Anything else" }
    }
  }
}
```

**Why the others are wrong:**
- **A. Three manual uploads:** manual, does not scale, and you must know the page boundaries.
- **B. Layout model only:** reads text and structure but does not classify.
- **C. Translator:** translates language; it does not classify document types.

Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/classifier

</details>

### 2. A field must be copied exactly as printed on an invoice. Which method?

- A. classify
- B. generate
- C. extract
- D. none

<details><summary>Answer</summary>

**Correct: C.** Every field in a schema has a **method**:
| Method | Behavior | Example |
|---|---|---|
| `extract` | Copies the value as it appears in the content (with source location and confidence) | Invoice number, total |
| `classify` | Chooses one of a fixed set of values you list | Document type, sentiment |
| `generate` | Writes new text from the content | Summary, description |

"Exactly as printed" rules out `generate` (may rephrase) and `classify` (fixed categories).

```json
"fieldSchema": { "fields": {
  "InvoiceNumber": { "type": "string", "method": "extract", "description": "Invoice number exactly as printed" }
}}
```

**Why the others are wrong:**
- **A. classify:** picks from fixed categories.
- **B. generate:** free generation; may change the text.
- **D. none:** a method is needed; extract is the answer.

Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/analyzer-reference

</details>

### 3. You want deterministic extraction from standard invoices. What fits best?

- A. Document Intelligence prebuilt invoice (or CU prebuilt-invoice)
- B. Translator
- C. Video analyzer
- D. Speech

<details><summary>Answer</summary>

**Correct: A.** Standard invoices have a stable layout and well-known fields, so use a **prebuilt invoice model**: Document Intelligence `prebuilt-invoice`, or Content Understanding `prebuilt-invoice`. It returns vendor, dates, line items and totals with **confidence scores and bounding regions**, without training or prompts. This is the most predictable and cheapest choice; build a custom analyzer only for formats the prebuilt models do not cover.

```python
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import AnalyzeDocumentRequest
from azure.core.credentials import AzureKeyCredential   # or DefaultAzureCredential()

client = DocumentIntelligenceClient(endpoint, AzureKeyCredential(key))
poller = client.begin_analyze_document("prebuilt-invoice", AnalyzeDocumentRequest(url_source=invoice_url))
doc = poller.result().documents[0]
total = doc.fields.get("InvoiceTotal")
if total and total.confidence < 0.8:
    send_to_human_review(doc)        # route low-confidence fields to a person
```

**Why the others are wrong:**
- **B. Translator, C. Video analyzer, D. Speech:** wrong modality for a document.

Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/document/overview

</details>

### 4. Analyzer creation fails after specifying a model. You used a deployment name. What is the fix?

- A. Use the catalog model name and connect the deployment at resource level
- B. Disable OCR
- C. Use API key
- D. Rename the analyzer

<details><summary>Answer</summary>

**Correct: A.** In an analyzer's `models` property you give **catalog model names** (for example `gpt-4.1`), **not your deployment names**. The Content Understanding resource is connected once, at resource level, to your Foundry model deployments, and the service maps each model name to the deployment you connected. Using a deployment name makes the analyzer definition invalid.

```json
"models": { "completion": "gpt-4.1", "embedding": "text-embedding-3-large" }
```

Debug steps: (1) check the model names against the supported list; (2) confirm the resource-level default deployments are configured for those models; (3) confirm the deployment region/quota; (4) retry creation.

**Why the others are wrong:**
- **B. Disable OCR:** OCR is a separate step and does not validate model names.
- **C. API key:** authentication is not what failed.
- **D. Rename the analyzer:** the analyzer ID is not the problem.

Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/analyzer-reference

</details>

### 5. A pipeline must pull spoken-topic fields and on-screen text from training videos into one structured result. What is the simplest design?

- A. One Content Understanding video analyzer with a field schema
- B. Pro mode with reference documents
- C. Speech to text, then OCR frames, then a custom LLM merge
- D. Document Intelligence Layout

<details><summary>Answer</summary>

**Correct: A.** A **video analyzer** (based on `prebuilt-video`) understands both modalities in one call: the **transcript** of the speech and the **visual frames** (on-screen text, scenes). Define the fields you need once, for example `SpokenTopics` (generate) and `SlideTitle` (extract), and receive one structured JSON result with each video segment. No pipeline to maintain.

**Why the others are wrong:**
- **B. Pro mode:** multi-step reasoning for documents, not video.
- **C. STT → OCR frames → custom LLM merge:** works but needs three components, frame sampling and timestamp alignment that the analyzer already does.
- **D. Document Intelligence Layout:** reads documents and images of pages, not video.

Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/video/overview

</details>
