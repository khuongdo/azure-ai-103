---
note: docs/study/real-world/contact-center-voice-and-analytics.md
skill: Implement speech solutions (speech to text, text to speech, speech as an agent modality, speech translation); apply language model text analysis (PII, sentiment, summaries)
retrieved: 2026-10-12
---

# Quiz: contact center voice agent and call analytics

Based on the [case study](../real-world/contact-center-voice-and-analytics.md). The last two are **design questions**.

## Flashcards

**Q:** What does the Voice Live API combine?
**A:** Speech recognition, a generative model and text to speech behind one real-time WebSocket interface.

**Q:** Name Voice Live's conversational features.
**A:** Noise suppression, echo cancellation, interruption detection, advanced end-of-turn detection.

**Q:** Native speech-to-speech vs cascaded?
**A:** Native = lowest latency, most natural; cascaded = recognition → text model → synthesis, more control and choice, more latency.

**Q:** How is Voice Live priced?
**A:** In tiers (**Pro, Standard, Lite**) by the model you choose; roughly 10 input and 20 output tokens per second of audio for Azure OpenAI models.

**Q:** What do you use for product names the recognizer misses?
**A:** A **phrase list** (lightweight) or **custom speech** (training and hosting cost).

**Q:** Which speech-to-text mode for thousands of recordings?
**A:** **Batch transcription** (asynchronous, REST).

**Q:** Fast transcription limits?
**A:** Files under 2 hours and 300 MB.

**Q:** When does diarization work?
**A:** On **mono** recordings; not for stereo. Set `diarizationEnabled` (two speakers) or `diarization` min/max for three or more.

**Q:** What is Conversation PII?
**A:** Turn-aware PII detection for transcripts, run as an **asynchronous job**, with redaction policies.

**Q:** Which analyzer extracts topics and sentiment from recordings in one step?
**A:** Content Understanding **`prebuilt-callCenter`**.

**Q:** Why a controlled reason-code list?
**A:** Free text does not aggregate into dashboards.

## Practice questions

### 1. The voice agent often starts talking while the caller is still thinking mid-sentence. Which capability should you tune?

- A. Text-to-speech voice
- B. End-of-turn detection
- C. Phrase list
- D. Avatar

<details><summary>Answer</summary>

**Correct: B.** It decides when the caller has really finished, allowing natural pauses.
**Incorrect:** A and D — presentation only; C — improves recognition of terms.
Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live

</details>

### 2. Callers say product names such as "FiberMax Duo" and the transcript is wrong. What is the lightest fix?

- A. Train a custom speech model
- B. Add a phrase list
- C. Switch the language
- D. Use text-to-speech avatars

<details><summary>Answer</summary>

**Correct: B.** Phrase lists are lightweight just-in-time customization.
**Incorrect:** A — heavier and charged separately; C and D — unrelated.
Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live

</details>

### 3. Call summaries sometimes contain customers' names and phone numbers. The pipeline summarizes first, then redacts. What is wrong?

- A. Nothing
- B. PII redaction should run on the transcript **before** summarization and other analysis
- C. Summaries should be longer
- D. Use a cascaded model

<details><summary>Answer</summary>

**Correct: B.** Redact first so everything downstream can be stored and shown more widely.
**Incorrect:** A — it leaks; C and D — unrelated.
Source: case study Part B

</details>

### 4. Recordings are mono and contain three speakers (caller, agent, supervisor). Which batch setting do you need?

- A. `diarizationEnabled: true` only
- B. `diarizationEnabled: true` plus `diarization` with minimum and maximum speaker counts
- C. Stereo channels
- D. `wordLevelTimestampsEnabled` only

<details><summary>Answer</summary>

**Correct: B.** For three or more speakers you also set the `diarization` property (min and max). Diarization works only on mono audio.
**Incorrect:** A — enough for two speakers only; C — would require re-recording; D — timestamps are not speaker labels.
Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/batch-transcription-create

</details>

### 5. You need lowest-latency, natural conversations and want to avoid hosting any models. Which approach fits?

- A. Chain separate speech-to-text, LLM and text-to-speech services yourself
- B. Voice Live with a native speech-to-speech model
- C. Batch transcription
- D. Fast transcription

<details><summary>Answer</summary>

**Correct: B.** It is fully managed, low-latency speech-to-speech.
**Incorrect:** A — more engineering and latency; C and D — file transcription, not live conversation.
Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live

</details>

### 6. Your dashboard of call reasons is unusable because every summary names the reason differently. What fixes it?

- A. A bigger model
- B. A controlled list of reason codes in a fixed JSON schema
- C. Longer summaries
- D. Disable sentiment

<details><summary>Answer</summary>

**Correct: B.** Controlled values aggregate; free text does not.
**Incorrect:** A and C — do not standardize; D — unrelated.
Source: case study Part B step 5

</details>

## Design questions

### 7. Design the call analytics pipeline for 120,000 calls a month, including privacy.

<details><summary>Model answer and checklist</summary>

1. Store recordings in Blob Storage with metadata; record caller and agent on **separate channels** where possible.
2. **Batch transcription** with timestamps and speaker labels (diarization if mono).
3. **Conversation PII redaction first**; choose a redaction style that keeps analytics useful.
4. **Summarize** (issue and resolution), then **sentiment, topics, reason code** (controlled list) and **compliance flags** with evidence quotes and timestamps; or use `prebuilt-callCenter`.
5. **Store and route:** flagged calls to QA; confirmed labels improve prompts.
6. **Quality:** word error rate by condition, PII recall (priority), summary faithfulness, agreement with human labels.
7. **Operations:** retries, idempotency, retention limits, restricted access, pipeline health dashboards.

</details>

### 8. How would you roll out the live voice agent safely?

<details><summary>Model answer and checklist</summary>

- Start with **read-only intents** (outage status, plan details); add actions later with approvals.
- **Pilot** a small share of calls with an easy opt-out to a person.
- Test with **real recordings**, noise, accents and interruptions; measure end-to-end latency.
- **Guardrail on the agent**; authorization enforced in tools using the verified caller identity.
- **Handoff** with a summary on verification failure, request, or repeated misunderstanding.
- **Monitoring** in Application Insights; remember voice evaluation supports full-conversation runs only.
- Check **cost** by model tier and add call-length limits.

</details>
