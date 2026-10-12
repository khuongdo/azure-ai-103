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

## Practice questions

### 1. You need to remove phone numbers and card numbers from call transcripts before sending them to a model. What should you use?

- A. Language detection
- B. Azure Language PII detection
- C. Sentiment analysis
- D. Key phrase extraction

<details><summary>Answer</summary>

**Correct: B.** PII detection finds and redacts personal data in text, conversations and documents.
**Incorrect:** the other options do not fit — do not redact personal data.
Source: https://learn.microsoft.com/en-us/azure/ai-services/language-service/overview

</details>

### 2. A new project needs sentiment analysis. What does Microsoft Learn recommend for new projects?

- A. Azure Language sentiment analysis, because it is cheaper
- B. Document Intelligence
- C. Custom Translator
- D. Foundry models, because the Language feature retires on March 31, 2029

<details><summary>Answer</summary>

**Correct: D.** The retirement notice directs new projects to Foundry models.
**Incorrect:** the other options do not fit — retiring; C and D — unrelated.
Source: https://learn.microsoft.com/en-us/azure/ai-services/language-service/key-phrase-extraction/overview

</details>

### 3. A bot must map 'turn off the lights in the kitchen' to an action and a room. Which concept fits?

- A. Intent and entity prediction
- B. Language detection
- C. Extractive summarization
- D. Protected material detection

<details><summary>Answer</summary>

**Correct: A.** CLU predicts intents and extracts entities.
**Incorrect:** the other options do not fit — different tasks.
Source: https://learn.microsoft.com/en-us/azure/ai-services/language-service/conversational-language-understanding/overview

</details>

### 4. Your FAQ bot must ask follow-up prompts and filter answers by metadata. Which Language feature offers this?

- A. Custom NER
- B. Custom question answering
- C. Opinion mining
- D. Key phrase extraction

<details><summary>Answer</summary>

**Correct: B.** CQA supports multi-turn prompts and metadata filtering.
**Incorrect:** the other options do not fit — do not provide a knowledge base.
Source: https://learn.microsoft.com/en-us/azure/ai-services/language-service/question-answering/overview

</details>
