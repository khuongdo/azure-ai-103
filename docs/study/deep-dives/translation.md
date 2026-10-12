---
domain: Implement text analysis solutions
skill: Translate text and documents with Azure Translator in Foundry Tools or LLM-powered flows; customize output
sources:
  - https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/translator/custom-translator/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-translation
retrieved: 2026-10-12
---

# Deep dive: translation

This page covers text translation, customization and how it fits with document and speech translation. The applied pipeline is in [Multilingual content pipeline](../real-world/multilingual-content-pipeline.md). Items marked `[NEEDS VERIFICATION]` are not confirmed on Microsoft Learn.

---

## 1. Text translation API

Azure text translation is a REST API for **100+ languages and dialects**. The latest GA version is **`2026-06-06`**; **v3.0** still exists.

**Operations in `2026-06-06`:** **Languages** (no authentication needed), **Translate** (one `POST`, one or more target languages) and **Transliterate** (convert script, for example Cyrillic to Latin).

**What changed in `2026-06-06` (breaking vs v3.0):**
- Request array is `inputs`; response array is `value`.
- **Model choice:** standard **NMT** (neural machine translation) or a supported **LLM** deployment. LLM translation needs a **Foundry resource**.
- **Adaptive custom translation:** up to **five reference translations** or an adaptive dataset index ID to steer LLM style and terminology.
- **Tone** (formal, informal, neutral) and **gender** controls for LLM translation.

**Limits (Translate):**

| Path | Max array elements | Max size per element |
|---|---|---|
| NMT | 1,000 | 50,000 characters |
| LLM | 50 | 5,000 characters |

**Billing:** NMT per source character; LLM per input and output token.

**Authentication:** resource key (`Ocp-Apim-Subscription-Key`), bearer token, or **Microsoft Entra ID** (managed identity, keyless; preferred in enterprises).

**Troubleshooting table:** 401 bad or missing key; 403 valid credentials but unsupported operation or configuration; 429 rate limit; 400 invalid payload or unsupported language.

*Decision:* keep high-volume baseline traffic on NMT; send to an LLM only where tone, context or adaptive behavior matters.

---

## 2. Customization options compared

| Option | What it is | Data needed | When |
|---|---|---|---|
| **Glossary** | Fixed term mappings applied to a document translation job (CSV, XLIFF, TSV) | A list of terms | Product names and approved terms |
| **Adaptive custom translation** | LLM adapted by a small bilingual index | 5 to 10,000 aligned pairs, up to 500 characters each | Fast domain adaptation, minutes |
| **Custom Translator** | Trains a custom **NMT** system in its own portal | Parallel documents, dictionaries, tuning and test sets | Large parallel corpus, stable domain |

**Custom Translator steps:** create workspace and project → upload parallel documents (and dictionaries) → train → review **BLEU** score → publish → call text translation using the custom model identifier (the category id) `[NEEDS VERIFICATION]` exact parameter name. It supports translation to and from English for more than three dozen languages. With the right data, gains of **5 to 10 BLEU points** are common. Dictionary-only training is possible when no parallel data exists. Accepted file types include ALIGN, PDF, LCL, HTML, XLF, TMX, TXT, DOCX and XLSX.

**BLEU** compares machine output with a human reference; higher is better, but compare only on the same test set.

---

## 3. Document translation

| Mode | Use when | Needs |
|---|---|---|
| **Batch (asynchronous)** | Many or large files | Blob containers; SAS tokens or managed identity (prefer identity); glossary files in CSV, XLIFF or TSV |
| **Synchronous** | One file, result returned directly | Custom-domain endpoint; no storage account |

Format and layout are preserved; scanned PDFs go through OCR. Content is processed in the **region of the Translator resource**. With VNet or private endpoints enabled you must use the **custom endpoint** and cannot use an access token.

---

## 4. Speech translation in one line
Live audio in, translated text or audio out: use the Speech service (see [Speech solutions](speech-solutions.md)). It translates directly into two target languages; more require a Foundry resource.

---

## 5. LLM-powered translation flow (step by step)
1. **Detect** the source language (Translator or Language detection).
2. **Build the prompt:** target language, tone, audience, glossary, "do not translate" list.
3. **Call the model** with low temperature; request structured output when segments must align.
4. **Check:** placeholders, numbers, glossary hits, length.
5. **Review** high-risk content with a human.
6. **Cache** by source hash so unchanged text is not re-translated.

---

## Sources
- [Text translation overview](https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/overview)
- [Custom Translator overview](https://learn.microsoft.com/en-us/azure/ai-services/translator/custom-translator/overview)
