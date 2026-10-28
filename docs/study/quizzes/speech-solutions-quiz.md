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

**Correct: D.** Two clues: *500 long recordings* → **batch** (asynchronous, files in Blob Storage, results written to a container); *three speakers* → **diarization with minimum and maximum speaker counts** (only on **mono** audio; `diarizationEnabled: true` alone is for two speakers).

```json
{
  "displayName": "calls-batch-1",
  "locale": "en-US",
  "contentContainerUrl": "https://<account>.blob.core.windows.net/calls?<sas>",
  "properties": {
    "diarizationEnabled": true,
    "diarization": { "speakers": { "minCount": 1, "maxCount": 3 } },
    "timeToLiveHours": 48
  }
}
```

Poll the transcription until it succeeds, then read the result files. Remember the time-to-live: results are deleted after it.

**Why the others are wrong:**
- **A. Fast transcription:** synchronous API for one file, quick results; not for bulk jobs.
- **B. Text to speech:** the wrong direction (text → audio).
- **C. Real-time STT:** live audio streams, not 500 files.

Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-speech-overview

</details>

### 2. The base model misrecognizes your product names. You only run batch transcription. What is true about using a custom model?

- A. You can use the custom model with batch transcription without a deployed endpoint
- B. Custom speech cannot be used with batch
- C. You must use text to speech instead
- D. You must deploy and pay for a custom endpoint

<details><summary>Answer</summary>

**Correct: A.** A custom speech model must be **deployed to an endpoint** for **real-time** recognition (which is billed for hosting), but **batch transcription can use a custom model without a hosted endpoint**: you pass the model reference in the transcription request. This is the cheapest way to improve accuracy when you only process files.

```json
{ "displayName": "calls", "locale": "en-US", "contentUrls": ["<blob-sas-url>"],
  "model": { "self": "https://<region>.api.cognitive.microsoft.com/speechtotext/models/<custom-model-id>" } }
```

Note that you still pay for training and the custom-model transcription usage; try a **phrase list** first when only a few product names are wrong (real-time/SDK).

**Why the others are wrong:**
- **B. Custom speech cannot be used with batch:** it can.
- **C. Use text to speech instead:** wrong direction.
- **D. Must deploy and pay for an endpoint:** only needed for real-time recognition.

Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-speech-overview

</details>

### 3. An app must speak an audiobook longer than 10 minutes. Which synthesis approach fits?

- A. Viseme events
- B. Speech translation
- C. Real-time SDK synthesis only
- D. Batch synthesis API

<details><summary>Answer</summary>

**Correct: D.** The **batch synthesis API** is built for long text: it takes the text (or SSML) in a request, runs asynchronously, and writes audio files to Azure Storage; it is intended for audio **longer than 10 minutes** (audiobooks, long content). Real-time synthesis through the SDK or REST suits short, interactive output, and returns audio as it is generated.

Flow: create synthesis job (text + voice + output format) → poll status → download audio from the destination container.

```python
# real-time (short text) for comparison
synth = speechsdk.SpeechSynthesizer(speech_config=speech_config)
synth.speak_text_async("Hello, welcome to the store.").get()
```

**Why the others are wrong:**
- **A. Viseme events:** lip-sync timing data for avatars.
- **B. Speech translation:** translates speech between languages.
- **C. Real-time SDK synthesis only:** meant for shorter interactive output.

Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech

</details>

### 4. You need live speech translated into five languages. What is the constraint?

- A. Speech translates to two targets directly; use a Foundry resource for more
- B. Only text output
- C. No limit
- D. Maximum one target

<details><summary>Answer</summary>

**Correct: A.** Speech translation can translate **directly into up to two target languages** per request. For more targets you need a **Foundry (multi-service) resource**, and each extra language is billed. Five languages therefore means using a Foundry resource, or running separate recognizers.

```python
import azure.cognitiveservices.speech as speechsdk

cfg = speechsdk.translation.SpeechTranslationConfig(subscription=key, region=region)
cfg.speech_recognition_language = "en-US"
cfg.add_target_language("fr")
cfg.add_target_language("de")           # two targets are included directly
recognizer = speechsdk.translation.TranslationRecognizer(translation_config=cfg)
result = recognizer.recognize_once()
print(result.translations["fr"], result.translations["de"])
```

For live meetings that auto-detect and switch the spoken language, use **Live Interpreter**.

**Why the others are wrong:**
- **B. Only text output:** speech translation can also synthesize speech.
- **C. No limit / D. Maximum one target:** the direct limit is two, not none or one.

Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-translation

</details>
