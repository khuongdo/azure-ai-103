---
note: docs/study/real-world/multilingual-content-pipeline.md
skill: Build solutions that translate text with Azure Translator in Foundry Tools or LLM-powered translation flows; translate speech; customize outputs for domain tasks
retrieved: 2026-10-12
---

# Quiz: multilingual content pipeline

Based on the [case study](../real-world/multilingual-content-pipeline.md). The last two are **design questions**.

## Flashcards

**Q:** Which two text translation API versions are GA?
**A:** v3 and `2026-06-06` (adds LLM selection, adaptive custom translation, more parameters).

**Q:** What is adaptive custom translation?
**A:** Upload **5 to 10,000** aligned segment pairs (up to **500 characters** each); the service builds a custom bilingual index in minutes to adapt a supported LLM.

**Q:** Custom Translator vs adaptive custom translation?
**A:** Custom Translator trains customized models with dictionaries (heavier, own portal); adaptive is quick and LLM-based.

**Q:** Batch vs synchronous document translation?
**A:** Batch = many or large files, needs Blob containers; synchronous = one file returned directly, no storage account, custom-domain endpoint needed.

**Q:** How does batch translation authorize storage access?
**A:** **SAS tokens** or **managed identities** (prefer managed identity).

**Q:** Which glossary formats are supported?
**A:** CSV, XLIFF, TSV (tab).

**Q:** What determines where document content is processed?
**A:** The **region of the Translator resource**.

**Q:** What changes with VNet "selected networks and private endpoints"?
**A:** You must use the **custom endpoint**, not the global endpoint, and cannot use an access token.

**Q:** How are scanned PDFs handled?
**A:** OCR extracts and translates the text while retaining layout.

**Q:** Legacy format conversions on output?
**A:** `.doc`, `.odt`, `.rtf` become `.docx`; `.xls`, `.ods` become `.xlsx`; `.ppt`, `.odp` become `.pptx`.

**Q:** Where does the Foundry portal support document translation?
**A:** Synchronous single-file only; batch needs REST or SDK.

## Practice questions

### 1. Thousands of product manuals in Word and PowerPoint must be translated into 12 languages, keeping layout. Which feature fits?

- A. Synchronous document translation per file
- B. Asynchronous batch document translation
- C. Speech translation
- D. Text translation of copied paragraphs

<details><summary>Answer</summary>

**Correct: B.** Thousands of files in 12 languages is the **asynchronous batch** case. You put source documents in a Blob container, give Translator a source and one target container per language (managed identity preferred over SAS), and start a job. The service translates in the background, **preserves format and layout** (Word, PowerPoint, PDF, even OCR on scans), and you poll job and document status.

```python
from azure.ai.translation.document import DocumentTranslationClient, TranslationTarget
from azure.identity import DefaultAzureCredential

client = DocumentTranslationClient(endpoint, DefaultAzureCredential())
poller = client.begin_translation(
    source_url, targets=[TranslationTarget(target_url=url_for(lang), language=lang) for lang in LANGS]
)
for doc in poller.result():
    print(doc.source_document_url, doc.status)
```

**Why the others are wrong:**
- **A. Synchronous per file:** one file per request through the custom domain endpoint; fine for a single document, not for thousands.
- **C. Speech translation:** for audio.
- **D. Copy paragraphs into text translation:** loses layout and is manual.

Source: https://learn.microsoft.com/en-us/azure/ai-services/translator/document-translation/overview

</details>

### 2. Your product name "FlowSet" keeps being translated. What is the best control?

- A. Translate twice
- B. Add the term to a glossary (or prevent-translation markup)
- C. Increase quota
- D. Use speech translation

<details><summary>Answer</summary>

**Correct: B.** Two tools protect fixed names:
- A **glossary** (CSV, XLIFF or TSV) maps terms to required translations; map "FlowSet" to "FlowSet" in every target language. Used with document translation.
- **Prevent-translation markup** around a term in text translation: `<span class="notranslate">FlowSet</span>` (or `translate="no"` in HTML).

```python
text = 'Install <span class="notranslate">FlowSet</span> on your device.'
# send with textType="html" so the markup is honored
```

For a product catalog with many protected names, a glossary kept in source control is easier to maintain than markup in every sentence.

**Why the others are wrong:**
- **A. Translate twice:** the second pass may change it again.
- **C. Increase quota:** capacity, not behavior.
- **D. Speech translation:** a different modality.

Source: https://learn.microsoft.com/en-us/azure/ai-services/translator/overview

</details>

### 3. You have 3,000 approved human-translated segment pairs (each under 500 characters) and want domain adaptation quickly, without training a full model. What do you use?

- A. Custom Translator only
- B. Adaptive custom translation
- C. Document translation sync
- D. Language detection

<details><summary>Answer</summary>

**Correct: B.** **Adaptive custom translation** needs only 5 to 10,000 aligned pairs (each up to 500 characters). The service builds an index in minutes; at translation time it retrieves the most similar approved pairs and gives them to a supported **LLM** as examples, so terminology and style match your domain. No training run is needed. Custom Translator trains a full custom NMT model, which makes sense with a large parallel corpus and a stable domain.

**Why the others are wrong:**
- **A. Custom Translator only:** heavier, wants more data and a training and publishing cycle.
- **C. Sync document translation / D. Language detection:** unrelated to customization.

Source: https://learn.microsoft.com/en-us/azure/ai-services/translator/overview

</details>

### 4. Translator is configured with private endpoints, but your app gets authentication errors using the global endpoint and an access token. What is wrong?

- A. The resource must be recreated
- B. With selected networks and private endpoints you must use the resource's custom endpoint and key-based or supported auth, not the global endpoint or an access token
- C. Add more glossary entries
- D. Use Blob Storage

<details><summary>Answer</summary>

**Correct: B.** When the Translator resource uses **selected networks or private endpoints**, the global endpoint (`api.cognitive.microsofttranslator.com`) is not reachable the same way and **access tokens are not supported**. Use the resource's **custom endpoint** (`https://<resource-name>.cognitiveservices.azure.com`) with the key-based or otherwise supported authentication, and make sure your app runs inside the network (or has DNS resolving the private endpoint).

Debug checklist: (1) which URL does the app call? (2) does DNS from the app resolve to a private IP? (3) is the app's subnet allowed? (4) is the auth mode supported in this configuration?

**Why the others are wrong:**
- **A. Recreate resource:** not required.
- **C. More glossary entries:** unrelated.
- **D. Blob Storage:** unrelated to text translation auth.

Source: https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/v3/reference

</details>

### 5. A translated safety manual drops the word "not" in one sentence. Which pipeline step should catch this class of error?

- A. Automatic placeholder checks only
- B. Risk-tiered human review (Tier 1 for safety) plus automated checks for numbers and negations
- C. Faster batch jobs
- D. Larger source files

<details><summary>Answer</summary>

**Correct: B.** Machine translation can drop a negation ("do **not** open") and still produce fluent text; automatic checks only see surface patterns. For safety content use a **risk-tiered** process: Tier 1 (safety, legal) gets **bilingual human review**; Tier 2 a spot check; Tier 3 machine only. Add automated checks for numbers, units and **negation words** to flag suspect sentences for the reviewer.

```python
def suspicious(src: str, tgt: str) -> bool:
    nums = lambda s: sorted(re.findall(r"\d+(?:[.,]\d+)?", s))
    return nums(src) != nums(tgt) or (has_negation(src) != has_negation(tgt))
```

**Why the others are wrong:**
- **A. Placeholder checks only:** verify tags like `{0}`, not meaning.
- **C. Faster batch jobs / D. Larger source files:** unrelated to accuracy.

Source: case study sections 5 and 6

</details>

### 6. An unchanged paragraph is re-translated every week, raising cost. What is the fix?

- A. Hash source segments and translate only what changed
- B. Switch languages
- C. Disable glossaries
- D. Use larger documents

<details><summary>Answer</summary>

**Correct: A.** Translating the same paragraph every week pays for work that was already done. **Hash each source segment** (for example SHA-256 of the normalized text + target language + glossary version + model version) and keep the translation in a **translation memory** table. On the next run, look up the hash and call Translator only for new or changed segments. Include the glossary and model version in the key, so changing them invalidates the cache.

```python
import hashlib

def cache_key(text: str, lang: str, glossary_v: str, model_v: str) -> str:
    return hashlib.sha256(f"{text}|{lang}|{glossary_v}|{model_v}".encode()).hexdigest()

key = cache_key(segment, "de", GLOSSARY_VERSION, MODEL_VERSION)
translation = cache.get(key) or translate_and_store(key, segment)
```

**Why the others are wrong:**
- **B. Switch languages / C. Disable glossaries / D. Larger documents:** do not remove repeated translations.

Source: case study section 7

</details>

## Design questions

### 7. Design a pipeline that translates manuals into German, French and Japanese with consistent terminology.

<details><summary>Model answer and checklist</summary>

1. **Terminology first:** approved terms per language, protected product names, forbidden terms as a glossary (CSV, XLIFF or TSV).
2. **Customization** only if measurements show domain errors: adaptive custom translation, then Custom Translator.
3. **Storage and access:** source and target containers, managed identity, right roles; mind the Translator resource region for residency.
4. **Batch translation** with glossary and language detection; poll job and document status.
5. **Automated checks:** placeholders, numbers and units, glossary hits, untranslated blocks, length.
6. **Risk tiers:** Tier 1 human review, Tier 2 spot check, Tier 3 machine only.
7. **Learn:** reviewer edits become segment pairs for the next adaptive update; record glossary and model versions.

</details>

### 8. When would you add an LLM step to a translation pipeline, and what controls would you add?

<details><summary>Model answer and checklist</summary>

- Use it where **tone, context or reasoning** matter (marketing copy, nuanced replies), often after or beside Translator.
- Give it the **glossary** and forbid changes to protected terms; keep it away from Tier 1 safety text.
- You own **layout handling, consistency, cost, safety and evaluation**; compare outputs with the source.
- Add guardrails and regression tests per language.

</details>
