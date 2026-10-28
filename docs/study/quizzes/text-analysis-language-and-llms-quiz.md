---
note: docs/study/deep-dives/text-analysis-language-and-llms.md
skill: Implement text analysis solutions
retrieved: 2026-10-12
---

# Quiz: text analysis with Azure Language and LLMs

Based on the [deep dive](../deep-dives/text-analysis-language-and-llms.md).

## Flashcards

**Q:** When do sentiment analysis, summarization, key phrase extraction, CLU and CQA retire from Azure Language?
**A:** March 31, 2029; new projects go to Foundry models.

**Q:** Which Language features are not in the retirement notices?
**A:** PII detection, language detection, NER, text analytics for health.

**Q:** What does CLU return?
**A:** The intent of an utterance and extracted entities; it does not perform actions.

**Q:** Two CLU paths?
**A:** LLM-powered quick deploy (schema, deploy, predict) and custom machine-learned model (label, train, evaluate, deploy).

**Q:** Extractive vs abstractive summarization?
**A:** Extractive selects original sentences with rank scores; abstractive writes new sentences.

**Q:** What is opinion mining?
**A:** Aspect-based sentiment: links sentiment to specific aspects such as room or staff.

**Q:** Good hybrid pattern for sensitive text and an LLM?
**A:** Run Language PII redaction first, then send redacted text to the LLM.

**Q:** How do you get parseable JSON from an LLM classifier?
**A:** Structured Outputs with a schema, low temperature, and an 'unknown' option.

**Q:** PII detection: flag or redact?
**A:** Use the redacted text (for example `[SSN]`); the entities array alone leaves the original text.

## Practice questions

### 1. You need to remove phone numbers and card numbers from call transcripts before sending them to a model. What should you use?

- A. Language detection
- B. Azure Language PII detection
- C. Sentiment analysis
- D. Key phrase extraction

<details><summary>Answer</summary>

**Correct: B.** Azure Language **PII detection** finds personal data (phone numbers, card numbers, SSNs, names, addresses) in text, conversations and documents, and returns **redacted text** in which each value is replaced (for example by `[PhoneNumber]` or asterisks). Run it **before** sending content to a model, so the model, its logs and its outputs never see the raw values.

```python
from azure.ai.textanalytics import TextAnalyticsClient
from azure.identity import DefaultAzureCredential

client = TextAnalyticsClient(endpoint, DefaultAzureCredential())
doc = client.recognize_pii_entities([transcript], language="en")[0]
safe_text = doc.redacted_text            # send THIS to the model
```

**Why the others are wrong:**
- **A. Language detection:** returns the language code.
- **C. Sentiment analysis:** returns positive/neutral/negative.
- **D. Key phrase extraction:** returns important phrases and keeps the raw values.

Source: https://learn.microsoft.com/en-us/azure/ai-services/language-service/overview

</details>

### 2. A new project needs sentiment analysis. What does Microsoft Learn recommend for new projects?

- A. Azure Language sentiment analysis, because it is cheaper
- B. Document Intelligence
- C. Custom Translator
- D. Foundry models, because the Language feature retires on March 31, 2029

<details><summary>Answer</summary>

**Correct: D.** Learn's retirement notice for the Language features (key phrase extraction, sentiment analysis and others) says they retire on **March 31, 2029** and directs new projects to **Foundry models** (LLMs with structured output). So for a new sentiment project, prompt a model for a fixed schema, and evaluate it against labeled examples. Existing apps keep working until the retirement date but should plan migration.

```python
r = client.chat.completions.create(
    model="gpt-4.1-mini", temperature=0,
    messages=[{"role": "system", "content": "Return JSON: {\"sentiment\": \"positive|neutral|negative\", \"confidence\": 0-1}"},
              {"role": "user", "content": review_text}],
    response_format={"type": "json_object"},
)
```

**Why the others are wrong:**
- **A. Language sentiment because it is cheaper:** it is the retiring option, so not recommended for new work.
- **B. Document Intelligence:** extracts fields from documents.
- **C. Custom Translator:** custom machine translation.

Source: https://learn.microsoft.com/en-us/azure/ai-services/language-service/key-phrase-extraction/overview

</details>

### 3. A bot must map 'turn off the lights in the kitchen' to an action and a room. Which concept fits?

- A. Intent and entity prediction
- B. Language detection
- C. Extractive summarization
- D. Protected material detection

<details><summary>Answer</summary>

**Correct: A.** **Conversational language understanding (CLU)** maps an utterance to an **intent** (what the user wants: `TurnOffLight`) and **entities** (the details: `Room = kitchen`). You label example utterances, train, deploy, then call the prediction API; your bot decides the action from the top intent and fills in the entities.

```json
{ "query": "turn off the lights in the kitchen",
  "prediction": { "topIntent": "TurnOffLight",
                  "entities": [ { "category": "Room", "text": "kitchen" } ] } }
```

**Why the others are wrong:**
- **B. Language detection:** identifies the language.
- **C. Extractive summarization:** selects key sentences.
- **D. Protected material detection:** detects copyrighted text in output.

Source: https://learn.microsoft.com/en-us/azure/ai-services/language-service/conversational-language-understanding/overview

</details>

### 4. Your FAQ bot must ask follow-up prompts and filter answers by metadata. Which Language feature offers this?

- A. Custom NER
- B. Custom question answering
- C. Opinion mining
- D. Key phrase extraction

<details><summary>Answer</summary>

**Correct: B.** **Custom question answering (CQA)** builds a knowledge base from FAQ pages, documents or manual question-answer pairs. It supports **multi-turn conversations** (follow-up prompts attached to an answer) and **metadata filters** (for example `product=router`, restricting which answers are searched).

```python
from azure.ai.language.questionanswering import QuestionAnsweringClient
from azure.ai.language.questionanswering.models import MetadataFilter

client = QuestionAnsweringClient(endpoint, credential)
answer = client.get_answers(
    question="How do I reset it?", project_name="faq", deployment_name="production",
    filters={"metadata_filter": MetadataFilter(metadata=[("product", "router")])},
)
```

**Why the others are wrong:**
- **A. Custom NER:** extracts entities from text, no knowledge base.
- **C. Opinion mining:** sentiment about aspects of a text.
- **D. Key phrase extraction:** lists main phrases.

Source: https://learn.microsoft.com/en-us/azure/ai-services/language-service/question-answering/overview

</details>

### 5. Support transcripts must be stored without exposing SSNs. What should you store?

- A. The original text and the entities array
- B. The redacted text from PII detection
- C. A hash of the entities only
- D. The original text in a private blob

<details><summary>Answer</summary>

**Correct: B.** The goal is to leave no SSN in storage. PII detection returns both an **entities array** (what and where) and **redacted text** (the same text with each value replaced by a label). Store the **redacted text** and discard the original (or keep it only in a tightly controlled system if the law requires it). The entities array alone does not change the original text.

```python
doc = client.recognize_pii_entities([text], categories_filter=["USSocialSecurityNumber"])[0]
db.save(transcript_id, doc.redacted_text)         # "My SSN is ***********"
```

**Why the others are wrong:**
- **A. Original + entities / D. Original in a private blob:** both still contain the SSN.
- **C. Hash of the entities only:** the transcript text would be lost.

Source: https://learn.microsoft.com/en-us/azure/ai-services/language-service/personally-identifiable-information/overview

</details>
