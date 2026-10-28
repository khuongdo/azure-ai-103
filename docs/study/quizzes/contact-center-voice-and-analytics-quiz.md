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

**Correct: B.** **End-of-turn detection** decides when the caller has really finished speaking. A simple silence timer treats a pause ("I want to... um... cancel") as the end and the agent barges in. A semantic end-of-turn model considers the words as well as the silence, so natural thinking pauses are allowed while real endings still get a fast reply. Tune it by testing with real recordings that contain hesitations, and measure end-to-end latency, because waiting longer makes responses slower.

**Why the others are wrong:**
- **A. TTS voice / D. Avatar:** presentation only; they change how the agent sounds or looks, not when it speaks.
- **C. Phrase list:** improves recognition of specific words, not turn timing.

Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live

</details>

### 2. Callers say product names such as "FiberMax Duo" and the transcript is wrong. What is the lightest fix?

- A. Train a custom speech model
- B. Add a phrase list
- C. Switch the language
- D. Use text-to-speech avatars

<details><summary>Answer</summary>

**Correct: B.** A **phrase list** gives the recognizer a list of expected words and names at run time ("just-in-time" customization). It needs no training data, no model hosting and no extra cost, and you can change it per call. It biases recognition toward "FiberMax Duo" rather than "fiber max duo".

```python
import azure.cognitiveservices.speech as speechsdk

recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)
phrases = speechsdk.PhraseListGrammar.from_recognizer(recognizer)
phrases.addPhrase("FiberMax Duo")
phrases.addPhrase("FiberMax Solo")
```

Escalation path: phrase list first; custom speech (train on audio/text, separate training and hosting cost) only if measurements show phrase lists are not enough.

**Why the others are wrong:**
- **A. Custom speech model:** heavier and charged separately.
- **C. Switch language:** the language is already right; the issue is vocabulary.
- **D. TTS avatars:** output feature, unrelated to recognition.

Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live

</details>

### 3. Call summaries sometimes contain customers' names and phone numbers. The pipeline summarizes first, then redacts. What is wrong?

- A. Nothing
- B. PII redaction should run on the transcript **before** summarization and other analysis
- C. Summaries should be longer
- D. Use a cascaded model

<details><summary>Answer</summary>

**Correct: B.** If PII is in the transcript when the summary is created, the LLM copies names and numbers into the summary and into every later field (topics, reason, quotes). Redacting afterwards means each output must be cleaned separately, and one miss leaks. Redact the **transcript first**, then run summarization and analytics on the redacted text; everything downstream can be stored and shown more widely. Use the Language service's **conversation PII** detection (turn-aware, asynchronous job) and choose a redaction style that keeps analytics useful (for example `[PERSON]` instead of blanks).

Pipeline: batch transcription → **PII redaction** → summary / sentiment / reason code → store. Measure **PII recall** on a labeled sample, since a missed phone number is worse than an over-redaction.

**Why the others are wrong:**
- **A. Nothing:** the summaries leak PII.
- **C. Longer summaries:** more text, more exposure.
- **D. Cascaded model:** an architecture choice for live voice, unrelated to redaction order.

Source: case study Part B

</details>

### 4. Recordings are mono and contain three speakers (caller, agent, supervisor). Which batch setting do you need?

- A. `diarizationEnabled: true` only
- B. `diarizationEnabled: true` plus `diarization` with minimum and maximum speaker counts
- C. Stereo channels
- D. `wordLevelTimestampsEnabled` only

<details><summary>Answer</summary>

**Correct: B.** **Diarization** labels who spoke and works **only on mono audio** (on stereo, put each speaker on its own channel instead). `diarizationEnabled: true` alone handles **two speakers**. For **three or more** you must also give the `diarization` property with minimum and maximum speaker counts (maximum below 36). Files with diarization can be at most 240 minutes.

```json
{
  "displayName": "call-0001",
  "locale": "en-US",
  "contentUrls": ["https://<account>.blob.core.windows.net/calls/0001.wav?<sas>"],
  "properties": {
    "diarizationEnabled": true,
    "diarization": { "speakers": { "minCount": 1, "maxCount": 3 } },
    "wordLevelTimestampsEnabled": true
  }
}
```

**Why the others are wrong:**
- **A. `diarizationEnabled` only:** enough for two speakers.
- **C. Stereo channels:** would need re-recording; the files are already mono.
- **D. `wordLevelTimestampsEnabled`:** gives timing per word, not who said it.

Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/batch-transcription-create

</details>

### 5. You need lowest-latency, natural conversations and want to avoid hosting any models. Which approach fits?

- A. Chain separate speech-to-text, LLM and text-to-speech services yourself
- B. Voice Live with a native speech-to-speech model
- C. Batch transcription
- D. Fast transcription

<details><summary>Answer</summary>

**Correct: B.** **Voice Live** is a fully managed API for real-time speech-to-speech conversations. It handles speech recognition, the model, voice synthesis, noise suppression, echo cancellation and end-of-turn detection in one connection over WebSocket, so you host nothing and avoid the hops between separate services. A *native speech-to-speech* model gives the lowest latency and the most natural prosody.

Compare with a **cascaded** design (STT → LLM → TTS): you control each stage (phrase lists, custom speech, a specific text model) but you build more, and latency adds up across the hops.

**Why the others are wrong:**
- **A. Chain separate services yourself:** more engineering and more latency.
- **C. Batch transcription / D. Fast transcription:** both transcribe audio *files*; neither holds a live conversation.

Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live

</details>

### 6. Your dashboard of call reasons is unusable because every summary names the reason differently. What fixes it?

- A. A bigger model
- B. A controlled list of reason codes in a fixed JSON schema
- C. Longer summaries
- D. Disable sentiment

<details><summary>Answer</summary>

**Correct: B.** A dashboard needs the same label for the same cause. If the model writes "billing problem", "bill issue" and "wrong charge", a group-by counts them as three reasons. Give the model a **controlled list of reason codes** and a **fixed JSON schema** (an enum), and validate the output. Free-text fields remain for details.

```python
from pydantic import BaseModel
from typing import Literal

class CallSummary(BaseModel):
    reason: Literal["billing", "outage", "plan_change", "equipment", "other"]
    sentiment: Literal["positive", "neutral", "negative"]
    resolved: bool
    summary: str   # free text, not aggregated

# use structured outputs / response_format with this schema so the model cannot invent codes
```

**Why the others are wrong:**
- **A. Bigger model / C. Longer summaries:** do not standardize wording.
- **D. Disable sentiment:** unrelated to reason naming.

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
