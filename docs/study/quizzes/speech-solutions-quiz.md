---
note: docs/study/deep-dives/speech-solutions.md
skill: Implement speech-to-text, text-to-speech, speech translation and voice agents
retrieved: 2026-10-12
---

# Quiz: speech solutions

Based on the [deep dive](../deep-dives/speech-solutions.md).

## Flashcards

**Q:** Which STT mode for thousands of recorded calls with speaker labels?
**A:** Batch transcription with diarization.

**Q:** Does batch transcription need a deployed custom speech endpoint?
**A:** No.

**Q:** How many speakers can diarization handle?
**A:** Up to 35 in batch (mono audio).

**Q:** Which metric tells you whether to train custom speech?
**A:** Word error rate (WER) versus human transcripts.

**Q:** What is SSML?
**A:** XML markup to control pitch, rate, volume, pauses, pronunciation, voices and styles.

**Q:** How many target languages does the Speech service translate to directly?
**A:** Two; more need a Foundry resource and extra translation fees.

**Q:** What is Live Interpreter?
**A:** Real-time speech translation that detects the spoken language, switches languages and can use personal voice.

**Q:** What does Voice Live provide?
**A:** A managed speech-to-speech WebSocket API with interruption and end-of-turn detection.

## Practice questions

### 1. You must transcribe 500 long call recordings and identify three speakers per call. What do you use?

- A. Fast transcription
- B. Text to speech
- C. Real-time STT
- D. Batch transcription with diarization min/max speakers

<details><summary>Answer</summary>

**Correct: D.** Batch handles many files asynchronously; diarization with min/max supports 3 or more speakers on mono audio.
**Incorrect:** the other options do not fit — not for bulk multi-speaker jobs; D — wrong direction.
Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-speech-overview

</details>

### 2. The base model misrecognizes your product names. You only run batch transcription. What is true about using a custom model?

- A. You can use the custom model with batch transcription without a deployed endpoint
- B. Custom speech cannot be used with batch
- C. You must use text to speech instead
- D. You must deploy and pay for a custom endpoint

<details><summary>Answer</summary>

**Correct: A.** Batch transcription does not require a hosted endpoint.
**Incorrect:** the other options do not fit — not for batch; C — wrong; D — unrelated.
Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-speech-overview

</details>

### 3. An app must speak an audiobook longer than 10 minutes. Which synthesis approach fits?

- A. Viseme events
- B. Speech translation
- C. Real-time SDK synthesis only
- D. Batch synthesis API

<details><summary>Answer</summary>

**Correct: D.** The batch synthesis API is designed for audio longer than 10 minutes.
**Incorrect:** the other options do not fit — for short real-time; C and D — different features.
Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech

</details>

### 4. You need live speech translated into five languages. What is the constraint?

- A. Speech translates to two targets directly; use a Foundry resource for more
- B. Only text output
- C. No limit
- D. Maximum one target

<details><summary>Answer</summary>

**Correct: A.** Beyond two target languages you need a multi-service Foundry resource and pay per extra language.
**Incorrect:** the other options do not fit — incorrect.
Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-translation

</details>
