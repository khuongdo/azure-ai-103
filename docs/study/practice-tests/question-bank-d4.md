---
domain: Implement text analysis solutions (question bank)
skill: All mock exam questions of one exam domain, gathered in one interactive set
sources:
  - https://aka.ms/AI103-StudyGuide
  - https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-apps-and-agents-developer-associate/
retrieved: 2026-11-25
---

# Question bank: Implement text analysis solutions

70 scenario questions for this domain (10-15% of the exam), collected from mock exams 1 to 10. They are shuffled, so topics are mixed. Use **Practice mode** to learn (check each answer, read the concept block), or **Exam mode** to measure yourself on one domain.

<iframe src="../question-bank-d4-view.html" title="Question bank: Implement text analysis solutions" style="width:100%;height:85vh;border:1px solid var(--md-default-fg-color--lightest);border-radius:6px"></iframe>

[Open full screen](question-bank-d4-view.html){ target=_blank }

## Where to study the topics behind these questions

- [Building agents with foundry](../deep-dives/building-agents-with-foundry.md)
- [Prompt engineering parameters and reflection](../deep-dives/prompt-engineering-parameters-and-reflection.md)
- [Responsible ai governance](../deep-dives/responsible-ai-governance.md)
- [Speech solutions](../deep-dives/speech-solutions.md)
- [Text analysis language and llms](../deep-dives/text-analysis-language-and-llms.md)
- [Translation](../deep-dives/translation.md)

## Flashcards (47)

Short recall cards from the topic quizzes of this domain. Read the question, answer in your head, then open the card.

### Text analysis with azure language and llms

From the [quiz](../quizzes/text-analysis-language-and-llms-quiz.md).

??? question "When do sentiment analysis, summarization, key phrase extraction, CLU and CQA retire from Azure Language?"
    March 31, 2029; new projects go to Foundry models.

??? question "Which Language features are not in the retirement notices?"
    PII detection, language detection, NER, text analytics for health.

??? question "What does CLU return?"
    The intent of an utterance and extracted entities; it does not perform actions.

??? question "Two CLU paths?"
    LLM-powered quick deploy (schema, deploy, predict) and custom machine-learned model (label, train, evaluate, deploy).

??? question "Extractive vs abstractive summarization?"
    Extractive selects original sentences with rank scores; abstractive writes new sentences.

??? question "What is opinion mining?"
    Aspect-based sentiment: links sentiment to specific aspects such as room or staff.

??? question "Good hybrid pattern for sensitive text and an LLM?"
    Run Language PII redaction first, then send redacted text to the LLM.

??? question "How do you get parseable JSON from an LLM classifier?"
    Structured Outputs with a schema, low temperature, and an 'unknown' option.

??? question "PII detection: flag or redact?"
    Use the redacted text (for example `[SSN]`); the entities array alone leaves the original text.

### Speech solutions

From the [quiz](../quizzes/speech-solutions-quiz.md).

??? question "Which STT mode for thousands of recorded calls with speaker labels?"
    Batch transcription with diarization.

??? question "Does batch transcription need a deployed custom speech endpoint?"
    No.

??? question "How many speakers can diarization handle?"
    Up to 35 in batch (mono audio).

??? question "Which metric tells you whether to train custom speech?"
    Word error rate (WER) versus human transcripts.

??? question "What is SSML?"
    XML markup to control pitch, rate, volume, pauses, pronunciation, voices and styles.

??? question "How many target languages does the Speech service translate to directly?"
    Two; more need a Foundry resource and extra translation fees.

??? question "What is Live Interpreter?"
    Real-time speech translation that detects the spoken language, switches languages and can use personal voice.

??? question "What does Voice Live provide?"
    A managed speech-to-speech WebSocket API with interruption and end-of-turn detection.

### Translation

From the [quiz](../quizzes/translation-quiz.md).

??? question "Which Translator API version is latest GA?"
    2026-06-06 (v3.0 still exists).

??? question "Request and response arrays in 2026-06-06?"
    inputs and value.

??? question "What does LLM translation require?"
    A Microsoft Foundry resource.

??? question "Adaptive custom translation data size?"
    5 to 10,000 aligned pairs, up to 500 characters each (reference translations up to five per request).

??? question "What is BLEU?"
    A score comparing machine translation to human reference; higher is better.

??? question "Batch vs synchronous document translation?"
    Batch: many files, Blob storage; synchronous: one file, direct result.

??? question "Max array elements per Translate request?"
    1,000 for NMT, 50 for LLM.

??? question "Which endpoint with VNet/private endpoints?"
    The custom endpoint; no access token.

### Contact center voice agent and call analytics

From the [quiz](../quizzes/contact-center-voice-and-analytics-quiz.md).

??? question "What does the Voice Live API combine?"
    Speech recognition, a generative model and text to speech behind one real-time WebSocket interface.

??? question "Name Voice Live's conversational features."
    Noise suppression, echo cancellation, interruption detection, advanced end-of-turn detection.

??? question "Native speech-to-speech vs cascaded?"
    Native = lowest latency, most natural; cascaded = recognition → text model → synthesis, more control and choice, more latency.

??? question "How is Voice Live priced?"
    In tiers (**Pro, Standard, Lite**) by the model you choose; roughly 10 input and 20 output tokens per second of audio for Azure OpenAI models.

??? question "What do you use for product names the recognizer misses?"
    A **phrase list** (lightweight) or **custom speech** (training and hosting cost).

??? question "Which speech-to-text mode for thousands of recordings?"
    **Batch transcription** (asynchronous, REST).

??? question "Fast transcription limits?"
    Files under 2 hours and 300 MB.

??? question "When does diarization work?"
    On **mono** recordings; not for stereo. Set `diarizationEnabled` (two speakers) or `diarization` min/max for three or more.

??? question "What is Conversation PII?"
    Turn-aware PII detection for transcripts, run as an **asynchronous job**, with redaction policies.

??? question "Which analyzer extracts topics and sentiment from recordings in one step?"
    Content Understanding **`prebuilt-callCenter`**.

??? question "Why a controlled reason-code list?"
    Free text does not aggregate into dashboards.

### Multilingual content pipeline

From the [quiz](../quizzes/multilingual-content-pipeline-quiz.md).

??? question "Which two text translation API versions are GA?"
    v3 and `2026-06-06` (adds LLM selection, adaptive custom translation, more parameters).

??? question "What is adaptive custom translation?"
    Upload **5 to 10,000** aligned segment pairs (up to **500 characters** each); the service builds a custom bilingual index in minutes to adapt a supported LLM.

??? question "Custom Translator vs adaptive custom translation?"
    Custom Translator trains customized models with dictionaries (heavier, own portal); adaptive is quick and LLM-based.

??? question "Batch vs synchronous document translation?"
    Batch = many or large files, needs Blob containers; synchronous = one file returned directly, no storage account, custom-domain endpoint needed.

??? question "How does batch translation authorize storage access?"
    **SAS tokens** or **managed identities** (prefer managed identity).

??? question "Which glossary formats are supported?"
    CSV, XLIFF, TSV (tab).

??? question "What determines where document content is processed?"
    The **region of the Translator resource**.

??? question "What changes with VNet &quot;selected networks and private endpoints&quot;?"
    You must use the **custom endpoint**, not the global endpoint, and cannot use an access token.

??? question "How are scanned PDFs handled?"
    OCR extracts and translates the text while retaining layout.

??? question "Legacy format conversions on output?"
    `.doc`, `.odt`, `.rtf` become `.docx`; `.xls`, `.ods` become `.xlsx`; `.ppt`, `.odp` become `.pptx`.

??? question "Where does the Foundry portal support document translation?"
    Synchronous single-file only; batch needs REST or SDK.

Back to the [question bank overview](question-bank.md).
