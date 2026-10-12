---
domain: Text analysis
skill: Build solutions that translate text with Azure Translator in Foundry Tools or LLM-powered translation flows; translate speech; customize outputs for domain tasks
sources:
  - https://learn.microsoft.com/en-us/azure/ai-services/translator/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/translator/document-translation/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/language-service/overview
retrieved: 2026-10-12
---

# Real-world: a multilingual content pipeline

Part of [Real-world practice](index.md).

## 1. The problem

A medical-device manufacturer sells in 30 countries. Product manuals, safety notices, support articles, training decks and customer emails must exist in many languages. Today, translation takes weeks, terminology is inconsistent ("infusion set" translated three different ways), formatting breaks, and an urgent safety notice cannot wait.

**Goals**

- Translate **documents** (Word, PowerPoint, PDF, HTML) while **keeping layout and formatting**.
- Translate **short text** (UI strings, chat, support replies) in real time.
- Use **approved terminology** and brand tone; keep **product names** untranslated.
- Support **speech** (live webinars, support calls).
- Keep humans in the loop where the stakes are high (safety, legal).

## 2. Why this is an AI-103 problem

| Need | Skill area |
|---|---|
| Translator text and document translation, or LLM-powered translation | Apply language model text analysis |
| Domain customization (terminology, compliance summaries) | Customize language model outputs |
| Translate speech to other languages | Implement speech solutions |
| Safe handling of sensitive content | Responsible AI |

## 3. Choosing the translation approach

| Option | Strength | Limits and cautions |
|---|---|---|
| **Translator text translation, v3 (GA)** | Real-time neural machine translation, **dynamic dictionary** and **prevent-translation** markers, SDKs, container support | General-purpose; terminology control through dictionaries |
| **Translator text translation `2026-06-06` (GA)** | Option to **select a specific LLM**, **adaptive custom translation**, more request parameters | Newer API shape; see the migration guide |
| **Adaptive custom translation** | Upload **5 to 10,000** pre-aligned source/target segment pairs (up to **500 characters each**); the service builds a custom bilingual index in minutes to adapt a supported LLM | Needs good segment pairs; quality depends on your data |
| **Custom Translator** | Train a **customized model** for domain language, terminology and style; phrase or sentence **dictionaries** | Separate portal and training effort |
| **Document translation (batch, async)** | Many or large files; preserves structure and format; glossaries; auto language detection | Requires Blob containers and storage authorization |
| **Document translation (synchronous)** | One document, returned directly; optional glossary | One file at a time; no storage account needed; custom-domain endpoint required |
| **LLM-powered translation flow** (your own prompt on a Foundry model) | Flexible tone, context, formatting instructions, domain rules | You own consistency, cost, evaluation and safety; layout preservation is your job (Document Translation is the Learn-documented service that preserves format) |
| **Speech translation (Azure Speech)** | Speech-to-speech and speech-to-text, real time | Separate from text; consider latency |

**Rule of thumb:** use Translator for **volume, formats and consistency**; use an LLM flow where **context, tone or reasoning** matter (marketing copy, nuanced support replies), often *after* or *beside* Translator, with terminology rules in the prompt. Many pipelines combine them.

## 4. Solution architecture

```
Authoring / CMS / uploads
        │
        ▼
 Blob: source container ──► Document translation (batch)
        │                       ├─ glossary (csv / xlf / tsv)
        │                       ├─ custom model or adaptive custom translation
        │                       └─ auto-detect source language
        ▼
 Blob: target container (translated files, same format)
        │
        ├──► Automated checks (placeholders, numbers, terms, length)
        ├──► Risk-based human review (safety, legal)
        ▼
 Publish ──► CMS / site / print

UI strings, chat, tickets ──► Text translation API (real time, dictionary rules)
Live events / calls     ──► Speech translation
```

**Batch translation flow (from Learn):** upload documents to the source container → submit a batch request → monitor job and document status → download translated documents from the target container. Storage access is authorized with **SAS tokens** or **managed identities** (prefer managed identity: no secrets to leak). Foundry portal supports only the synchronous single-file flow; use the REST API or SDKs for batch.

Supported batch formats include PDF (OCR extracts and translates text in scanned PDFs while retaining layout), Word, Excel, PowerPoint, HTML, Markdown, CSV, TSV, XLIFF, ODF files and Outlook `.msg`. Some legacy types convert on output (`.doc`, `.odt`, `.rtf` become `.docx`; `.xls`, `.ods` become `.xlsx`; `.ppt`, `.odp` become `.pptx`). Image translation (`.jpeg`, `.png`, `.bmp`, `.webp`, priced per image) and translating images inside `.docx` and `.pptx` are newer, preview-labeled capabilities.

### Walkthrough: what happens to one document

Example: `infusion-pump-manual.docx` must go from English into German, French and Japanese.

1. **Upload to the source container.** The file and its metadata (content tier, languages needed) are stored. The tier decides how much human review follows.
2. **Submit a batch translation job.** The request names the source container, one target container per language, the **glossary**, and optionally a custom model. The service authenticates to storage with the Translator resource's **managed identity** (or a SAS token), so no secret travels in the request.
3. **The service reads the document structure.** It separates *text* from *formatting* (styles, tables, headers, images), so it can translate the words and put them back into the same layout.
4. **Language is detected** if you did not specify it (also useful for documents with mixed-language content).
5. **Text is translated** with the chosen model. Glossary terms are applied (for example "infusion set" always becomes the approved German term, and the product name stays unchanged).
6. **The document is rebuilt** in the same format. Legacy formats may change extension (`.doc` becomes `.docx`).
7. **Job and document status are reported.** The pipeline polls status; a failed document gets a reason (unsupported file, storage permission) instead of silently disappearing.
8. **Automated checks run on the output:** placeholders and tags intact, numbers and units unchanged, glossary terms present, no untranslated blocks, length within limits. A numeric mismatch or a missing negation in a safety document is treated as a defect.
9. **Risk-based review.** Tier 1 (safety, legal) goes to a bilingual reviewer; Tier 2 gets a spot check; Tier 3 is published directly.
10. **Publish and learn.** Approved files go to the CMS. Reviewer edits are saved as segment pairs for the next glossary or adaptive custom translation update, and the glossary/model version used is recorded.

## 5. Build steps

1. **Segment content by risk.** Tier 1: safety and legal (always human review). Tier 2: customer-facing marketing and manuals (spot review). Tier 3: internal and low-risk (machine only).
2. **Build the terminology asset first.** Collect approved terms per language, product names to **keep untranslated**, and forbidden terms. Store as a glossary (CSV, XLIFF or TSV). This is the highest-leverage step for consistency.
3. **Decide customization.** Start with general translation plus glossary. If measurements show domain errors, add **adaptive custom translation** (cheap, minutes) or **Custom Translator** (heavier). Segment pairs come from your existing human-translated, approved content.
4. **Set up storage and access.** Source and target containers, managed identity for the Translator resource, and the right roles. The Translator resource's **region determines where document content is processed and temporarily stored**, which matters for data residency.
5. **Automate the flow.** Trigger on new files, submit batch jobs, poll status, validate, and place outputs for review or publish.
6. **Add automated checks after translation:** placeholders and tags intact (`{0}`, HTML), numbers, units and dates preserved, glossary terms present, length within UI limits, no untranslated chunks.
7. **Run human review where needed** and capture edits. Edits are your best data for the next glossary or adaptive model update.
8. **Handle speech separately.** For live events, speech translation or transcript + text translation; for calls, see [contact center](contact-center-voice-and-analytics.md).
9. **Add an LLM step only where it helps**, for example rewriting translated marketing copy in a brand voice, or producing a localized summary. Give it the glossary and do not let it change protected terms.

## 6. Quality plan

| Check | Method |
|---|---|
| Fidelity and fluency | Bilingual reviewer scoring on a sample per language and content type |
| Terminology | Automatic glossary hit rate; list of violated terms |
| Formatting | Diff of structure (headings, tables, tags) between source and target |
| Safety-critical meaning | Back-translation or second reviewer for Tier 1; any numeric or negation difference is a defect |
| Regression | Fixed test set per language re-run after any change (glossary, model, API version) |

Automatic metrics can rank systems but do not replace bilingual review for high-stakes content. Which automatic scoring Microsoft recommends for Translator customizations was not found in the pages read, so rely on bilingual review plus your own regression set.

## 7. Operating it

- **Throughput and limits:** respect document translation request limits (see the service limits page); batch large jobs and monitor status.
- **Cost:** Translator is billed by characters (documents) and per image for image files; LLM-based steps are billed by tokens. Translate once and cache; avoid re-translating unchanged content (hash source segments).
- **Versioning:** keep glossary and custom-model versions; record which version produced each translation so you can audit and redo.
- **Data protection:** confidential documents stay in your storage; restrict access; delete temporary containers. Translator supports virtual networks in all public-cloud regions: once you enable "selected networks and private endpoints" you must call the **custom endpoint** (not the global `api.cognitive.microsofttranslator.com`) and you cannot authenticate with an access token. With service endpoints the **Custom Translator portal is not accessible** but the REST API still works. The region of the Translator resource decides where document content is processed and temporarily stored.
- **Language coverage:** check language support for the specific feature (text, document, custom) per language pair; not all combinations support all features.

## 8. What goes wrong in practice

| Symptom | Likely cause | Fix |
|---|---|---|
| Product name translated | No protection | Glossary entry or prevent-translation markup |
| Same term translated differently | No glossary, or glossary language mismatch | Central glossary; check casing/inflection |
| Layout broken | Unsupported element or format conversion | Test the format; use a supported format; check `.doc` to `.docx` conversion |
| Translation of scanned PDF poor | Low-quality scan | Better scans; check OCR output first |
| Meaning inverted ("do not") | Negation error | Tier 1 human review; automated negation checks on key phrases |
| Mixed-language source content | Multiple languages in one document | Use auto-detect for mixed content and test results |
| Batch job stuck/failed | Storage authorization or unsupported file | Check job and document status; confirm SAS/identity; verify formats |
| LLM rewrites a safety statement | Over-creative prompt | Tight instructions; restrict LLM to Tier 3; compare against source |

## 9. Variations

- **Customer support in many languages:** detect language, translate the question, answer from a knowledge base in the source language, translate the answer. See [knowledge assistant](enterprise-knowledge-assistant.md).
- **Localizing apps:** XLIFF in and out of the pipeline to fit translation tools.
- **Multilingual search:** multilingual embeddings can match across languages without translation; translation still helps for display.

## Sources and open items

See the frontmatter. Tiers, checks and metrics are an illustrative design. Current document translation limits are on the Translator service limits page.
