---
domain: Implement text analysis solutions
skill: Analyze text with Azure Language (PII, NER, language detection, sentiment, summarization, CLU, question answering) and decide when to use an LLM instead
sources:
  - https://learn.microsoft.com/en-us/azure/ai-services/language-service/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/language-service/key-phrase-extraction/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/language-service/conversational-language-understanding/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/language-service/question-answering/overview
retrieved: 2026-10-12
---

# Deep dive: text analysis with Azure Language, and when an LLM is the better tool

Text analysis means turning free text into structured facts: who is mentioned, how the writer feels, what the writer wants, what to redact. Microsoft offers two families of tools: the **Azure Language** features (task-specific APIs) and **Foundry models** (general LLMs you prompt). This page explains each Language feature, then the decision between the two.

Items marked `[NEEDS VERIFICATION]` are not confirmed on Microsoft Learn.

---

## 1. The retirement notice you must know

Several Language features carry an **Important** banner on Microsoft Learn:

| Feature | Retires from Azure Language | Microsoft's direction |
|---|---|---|
| Sentiment analysis and opinion mining | **March 31, 2029** | Migrate to Foundry models |
| Summarization | **March 31, 2029** | Migrate to Foundry models |
| Key phrase extraction | **March 31, 2029** | Migrate to Foundry models |
| Conversational language understanding (CLU) | **March 31, 2029** | Migrate to Foundry models |
| Custom question answering (CQA) | **March 31, 2029** | Migrate to Foundry models |

"Retire" does not mean "removed today". The features work until the date, but **new projects are directed to Foundry**. Features Learn lists as core in the Language overview (no retirement banner was seen on the pages read): **PII detection, language detection, named entity recognition (prebuilt and custom), text analytics for health**. `[NEEDS VERIFICATION]` whether the exam objective wording still expects the legacy features; study both the feature and its replacement.

---

## 2. The standard call pattern

All Language features follow the same four steps (from the key phrase overview):

1. **Create** an Azure Language (Foundry Tools) resource. You get a key and an endpoint.
2. **Build a request** with the REST API or an SDK (C#, Java, JavaScript, Python). You can batch several features in one asynchronous call.
3. **Send** the text. The key or Microsoft Entra ID authenticates.
4. **Read** the JSON response and store or stream it.

*Example:* the sentence "The food was delicious and the staff were wonderful." returns the key phrases "food" and "wonderful staff". No model training: prebuilt features run "as is".

*What can go wrong:* wrong region or endpoint, document too large, unsupported language code, or exceeding the request quota (HTTP 429).

---

## 3. Feature by feature

### 3.1 Language detection
- **Goal:** know the language before routing, translating or choosing a model.
- **Output:** language name, ISO code, confidence score per document.
- **Example:** "Bonjour tout le monde" → `fr`, 1.0. Mixed or very short text lowers confidence.

### 3.2 Named entity recognition (NER)
- **Prebuilt NER** returns categories such as Person, Location, Organization, DateTime, Quantity.
- **Custom NER** is trained on your labeled examples for domain entities (for example "policy number").
- **Decision:** use prebuilt first; use custom only if prebuilt categories do not cover what you need.

### 3.3 PII detection and redaction
- Detects personal data (names, phone numbers, card numbers) in **text**, **conversations** (asynchronous) and **documents** (asynchronous; PDF, DOCX, TXT).
- Returns redacted text and the entity list; you choose redaction policies and categories.
- **To reduce PII risk, use the redaction output**, not just the entity list. Flagging or storing the `entities` array still leaves the original text with the SSN in it. The redacted text replaces each entity with a mask or the category label (for example `[SSN]`), and that text is what you log, index or send to a model.
- **Why it matters:** run it *before* data goes to a model, a log or a search index.

### 3.4 Sentiment analysis and opinion mining
- Labels **positive, neutral, negative** with confidence scores (0–1) at **sentence** and **document** level.
- **Opinion mining** is aspect-based: in "The room was clean but the staff were rude" it links *room → positive* and *staff → negative*.

### 3.5 Key phrase extraction
- Returns the main concepts of unstructured text. No customization.

### 3.6 Summarization
- **Extractive:** selects the most important original sentences, with a rank score and positions.
- **Abstractive:** writes new sentences.
- **Conversation summaries:** aspects such as issue, resolution, chapter title, narrative, recap.
- Document summarization (preview) accepts txt, pdf and docx; results are retrievable for 24 hours.

### 3.7 Conversational language understanding (CLU)
CLU predicts the **intent** of an utterance and extracts **entities**. It does not perform actions.

Two paths (from Learn):

| Path | Steps |
|---|---|
| **LLM-powered quick deploy** | Define the schema (intents with descriptions) → deploy → predict intents and prebuilt entities |
| **Custom machine-learned model** | Define schema → label utterances → train → view evaluation → improve → deploy → predict |

*Example:* "Turn off the living room lights" → intent `TurnOff`, entity `Room=living room`. Data labeling quality is the main driver of accuracy in the custom path.

### 3.8 Custom question answering (CQA)
Builds a knowledge base from FAQs, manuals and documents. Key capabilities: automatic question-answer extraction, **multi-turn** follow-up prompts, **metadata filtering**, **active learning**, and deep-learning re-ranking over Azure AI Search. Flow: create project → test → deploy (REST endpoint) → integrate. Responses carry answers, **confidence scores** and follow-up prompts.

### 3.9 Orchestration workflow
Routes an utterance to the right CLU or CQA project. Useful for an enterprise bot that has both a calendar skill (CLU) and an FAQ (CQA).

---

## 4. Language service or an LLM?

| Situation | Prefer | Why |
|---|---|---|
| Fixed task, high volume, low cost per call, predictable output schema | Language feature | Cheap, deterministic, no prompt to maintain |
| PII redaction with auditable entity categories | Language PII | Purpose-built categories and offsets |
| Nuanced tone, sarcasm, long context, multi-step reasoning | LLM | Understands context a classifier misses |
| New project that needs sentiment, summary or intent | LLM on Foundry (per retirement notice) | Language versions retire in 2029 |
| Need guaranteed JSON shape from an LLM | LLM with **Structured Outputs** | Schema-constrained output |
| Training data is labeled and stable, latency matters | Custom Language model | Small, fast, cheap |

**Hybrid pattern:** run Language **PII** first, then send redacted text to an LLM for summary or intent. This keeps cost and risk low.

---

## 5. Using an LLM for text analysis (step by step)

1. **Define the output schema** (for example sentiment, topics, urgency).
2. **Write the prompt:** role, task, definitions of each label, a few examples, and an "out" (`unknown`) when text is unclear.
3. **Constrain output** with Structured Outputs so the app can parse it.
4. **Set temperature low** (0 to 0.3) for consistent labels.
5. **Evaluate** on a labeled sample: accuracy per label, and compare against the Language feature.
6. **Add safety:** treat the analyzed text as untrusted (it may contain instructions).

*What can go wrong:* drift between runs, labels invented outside the list, token cost at high volume.

---

## Sources
- [Azure Language overview](https://learn.microsoft.com/en-us/azure/ai-services/language-service/overview)
- [Key phrase extraction](https://learn.microsoft.com/en-us/azure/ai-services/language-service/key-phrase-extraction/overview)
- [CLU overview](https://learn.microsoft.com/en-us/azure/ai-services/language-service/conversational-language-understanding/overview)
- [Custom question answering](https://learn.microsoft.com/en-us/azure/ai-services/language-service/question-answering/overview)
