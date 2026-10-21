---
domain: Implement information extraction solutions
skill: Extract content and fields from documents, images, audio and video with Azure Content Understanding and Document Intelligence
sources:
  - https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/analyzer-reference
  - https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/document/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/classifier
  - https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/layout
retrieved: 2026-10-21
---

# Deep dive: Content Understanding and Document Intelligence

Both services turn unstructured files into structured data. **Document Intelligence** gives high-accuracy, deterministic extraction from structured documents. **Content Understanding (CU)** adds LLM-powered analyzers for complex, unstructured and multimodal content. Learn describes them as complementary. The applied case is [Invoice and contract automation](../real-world/document-processing-automation.md). Items marked `[NEEDS VERIFICATION]` are not confirmed on Microsoft Learn.

---

## 1. The analyzer idea

An **analyzer** is a reusable configuration that says what content to process, what to extract, how to shape the output and which models to use.

| Analyzer type | Examples | Use |
|---|---|---|
| **Base** | `prebuilt-document`, `prebuilt-audio`, `prebuilt-video`, `prebuilt-image` | Starting point for custom analyzers |
| **RAG** | `prebuilt-documentSearch`, `prebuilt-videoSearch` | Markdown and descriptions optimized for retrieval |
| **Domain-specific** | `prebuilt-invoice`, `prebuilt-receipt`, `prebuilt-idDocument` | Common business documents |
| **Custom** | You extend a base with a `fieldSchema` | Your own fields |

GA API version is `2025-11-01`; `2026-06-01-preview` adds agentic mode, in-page segmentation and more.

### Analyzer properties
`analyzerId`, `name`, `description` (used by the model as context, so write it clearly), `baseAnalyzerId`, `models` (**model names from the catalog, not deployment names**; the service maps them to deployments you connect at resource level: `completion` and `embedding`), `config`, `fieldSchema`.

### Key `config` options (documents)

| Option | Default | Meaning |
|---|---|---|
| `enableOcr` | true | OCR for scans; disable for digital PDFs to go faster |
| `enableLayout` | true | Paragraphs, lines, reading order |
| `enableFormula` / `enableBarcode` | true | LaTeX formulas / barcode values |
| `tableFormat` | html | `html` or `markdown` |
| `enableFigureDescription` / `enableFigureAnalysis` | false | Alt text / chart data |
| `returnDetails` | false | Bounding boxes, confidence, spans (bigger response) |
| `estimateFieldSourceAndConfidence` | false | Source location and confidence per field |
| `enableSegment`, `contentCategories`, `segmentPerPage`, `omitContent` | off | Classification and splitting |

---

## 2. Field extraction

`fieldSchema` lists the fields. Types: `string`, `number`, `boolean`, `date`, `object`, `array` (avoid nesting deeper than 2 to 3 levels). Each field has a `description`, which acts as a mini-prompt, and a **`method`**:

| Method | Behavior | Best for |
|---|---|---|
| `extract` | Value as it appears in the content (requires source and confidence estimation) | Invoice number, dates, totals |
| `classify` | Pick from a fixed `enum` | Sentiment, document subtype |
| `generate` | Free generation or interpretation | Summaries, complex line items |

Values like dates and numbers are **normalized** automatically. Use **confidence and grounding** to route low-confidence results to human review.

---

## 3. Classification and splitting

`contentCategories` + `enableSegment` classify and split inside the same analyze call.

- **Classify only:** whole file gets one category.
- **Classify and analyze:** each category can name an `analyzerId` (linked, not copied) to run extraction.
- **Classify and segment:** `enableSegment: true` finds multiple documents inside one file (loan package: application + pay slip + bank statement). Minimum unit is a **page** (in-page segmentation is preview via `allowInPageSegments` on the analyzer).
- **Hierarchical:** categories can point to classifier analyzers; up to **five** nesting levels for documents, **two** for video.
- Up to **200** categories; no training data needed; include an **`other`** category or every page is forced into a listed category.
- **Video** supports segmentation only, with a **single** content category.

---

## 4. Calling it (step by step)

1. **Create the analyzer:** `PUT .../contentunderstanding/analyzers/{analyzerId}?api-version=...` with the JSON definition. Response `201` plus an `Operation-Location` header to track creation.
2. **Connect models:** map the model names to deployments on the resource.
3. **Analyze:** submit the file (URL or bytes); the call is **asynchronous**; poll the operation.
4. **Read the result:** Markdown content, structured fields, optional segments.
5. **Validate:** compare against labeled samples; use confidence for routing.

*What can go wrong:* model deployment not connected, using a deployment name where a model name is required, `extract` field without source/confidence estimation, deep nesting hurting accuracy, guardrails on the deployment suppressing generated values (content stays available).

---

## 5. Document Intelligence: Read, Layout, prebuilt, custom

- **Read:** text and handwriting, words, lines, languages.
- **Layout:** Read plus **tables, selection marks, paragraphs, titles/section headings, headers/footers** and structure; Markdown output suited to RAG chunking by section. `[NEEDS VERIFICATION]` exact add-on names and limits (the Learn page was fetched but not read in full).
- **Prebuilt models:** invoice, receipt, ID, and others for fixed forms.
- **Custom models:** train on labeled examples of your own forms.

### Which tool?

| Need | Choose |
|---|---|
| Standard invoice/receipt/ID, deterministic output | Document Intelligence prebuilt |
| Layout-aware Markdown for RAG | Document Intelligence Layout or CU `prebuilt-documentSearch` |
| Fields from messy, variable or multi-page documents, summaries, reasoning | CU custom analyzer (`generate`) |
| Mixed packet of documents | CU classify-and-segment |
| Audio, video, images | CU (Document Intelligence is for documents) |
| Search enrichment inside indexer | Search skillset: Layout/Content Understanding skill |

Learn points to its page "Choose the right Azure AI tool for document processing" for the official comparison.

---

### Standard mode and pro mode (outline wording)

The skills outline says "single-task and pro-mode". On the Learn pages read on 2026-10-21 (overview and analyzer reference) **neither term appears**; the current pages describe the `config.workflow` setting (`default` or `agentic`) and **standard versus advanced** contextualization rates instead. Use this working model for the exam and `[NEEDS VERIFICATION]` the wording:

| | Standard (single-task) | Pro (multi-step reasoning) |
|---|---|---|
| Content | Documents, images, audio, video, text | **Documents only** |
| Typical job | One analyzer, one schema, one result (video analyzer with a field schema returns transcript fields and on-screen text together) | Reason across several documents or **reference data**, for example check an invoice against a contract |

Rule: do not pick pro mode for video or audio, and do not chain separate pipelines when one standard analyzer covers the modalities. The closest documented feature today is agentic mode below (documents, one input file per request).

## 6. Agentic mode (preview)
For answers that must be *built from evidence* (calculations, validations, complex tables), set `config.workflow` to `agentic` (document analyzers, `2026-06-01-preview`, one input file per request). It uses more tokens and time and the **advanced** contextualization rate.

---

## Sources
- [Analyzer reference](https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/analyzer-reference)
- [Document overview](https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/document/overview)
- [Classifier](https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/classifier)
- [Layout model](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/layout)
