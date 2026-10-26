---
domain: Implement text analysis solutions; Implement generative AI and agent solutions
skill: Build speech-to-text, text-to-speech, speech translation and voice agent solutions; customize with custom speech and SSML
sources:
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-translation
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-speech-overview
retrieved: 2026-10-12
---

# Deep dive: speech solutions

Speech work has three directions: **audio to text** (speech to text, STT), **text to audio** (text to speech, TTS) and **audio to audio in another language** (speech translation). A fourth topic, **Voice Live**, wraps them into a real-time voice agent. Items marked `[NEEDS VERIFICATION]` are not confirmed on Microsoft Learn.

---

## 1. Speech to text: pick the mode first

| Mode | Use when | Notes |
|---|---|---|
| **Real-time** (SDK, CLI, REST short audio) | Live captions, voice commands | Interim and final results as speech is heard |
| **Fast transcription** | One file, you want the result now | Synchronous; file under about 2 hours and 300 MB |
| **Batch transcription** | Many or long files, call archives | Asynchronous REST; results to storage; webhooks |
| **Custom speech** | Domain words, accents, noise | Improves any mode; see section 2 |

### Batch transcription step by step
1. **Submit** a transcription job (file URLs or a container) with options.
2. **Options:** `diarizationEnabled` (2 speakers) or diarization min/max for 3+ speakers (mono audio; up to 35 speakers), `languageIdentification` with 2 to 10 candidate locales, `timeToLiveHours` (6 hours to 31 days) and a `destinationContainerUrl` inside `properties`.
3. **Wait:** poll the job, or register a **webhook**. The validation request sends a `validationToken` you must echo back as plain text.
4. **Read** the result files: text, timestamps, speaker labels.

*What can go wrong:* diarization on stereo files (it needs mono), more than 10 candidate locales, results deleted after the time-to-live, wrong storage permissions.

---

## 2. Custom speech: improving accuracy

The **base model** (a Universal Language Model) fits most scenarios. Use a custom model when it mishears your vocabulary or your audio conditions.

**Data types you can provide:** plain text and structured text (for domain words), pronunciation files, and **audio with human-labeled transcripts** (for acoustic conditions).

**Workflow (from Learn):**
1. Create a project and pick a model (audio training needs a region with dedicated training hardware).
2. Upload test data.
3. Train.
4. Inspect recognition quality by listening in Speech Studio.
5. Measure with **word error rate (WER)**; a high WER suggests training.
6. **Deploy to a custom endpoint**. Exception: **batch transcription does not need a deployed endpoint**, which saves hosting cost.

**Facts to remember:** a custom model works for real-time STT, speech translation and batch. Models and endpoints are fixed until you change them but have a limited lifetime (see the model and endpoint lifecycle page). Several custom models are recommended when vocabularies differ strongly between areas of one domain.

*Decision:* first measure WER of the base model on real audio; train only if it is high.

---

## 3. Text to speech and SSML

- **Standard (neural) voices:** 100+ languages and locales, available at 24 kHz and 48 kHz.
- **HD voices** and **Azure OpenAI voices** give higher quality. Some SSML tags are not supported for HD voices, personal voices and embedded voices.
- **Custom voice** (professional voice fine-tuning, personal voice) is **limited access** for responsible use and needs disclosure of synthetic voice.
- **Real-time synthesis** via SDK or REST. **Batch synthesis API** for audio longer than 10 minutes (audiobooks).
- **Visemes** give lip-shape events for facial animation (en-US neural voices only).
- **Billing** counts characters, including SSML markup (except `<speak>` and `<voice>`). Each Chinese character counts as two.

### SSML in one minute
SSML is XML that controls speech. Typical uses: change **rate, pitch, volume** (`prosody`), insert pauses (`break`), fix pronunciation (`phoneme`, lexicons), switch **voice** or **style** inside one document, and set the **language** for multilingual voices.

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="VOICE-NAME">  <!-- pick a real name from the voice gallery -->
    Your order <prosody rate="-10%">ships tomorrow</prosody>.<break time="400ms"/>
  </voice>
</speak>
```

*What can go wrong:* tag not supported for the chosen voice, wrong voice name for the region, unescaped `&` in text.

---

## 4. Speech translation

- Real-time **speech to text** and **speech to speech** translation through the Speech SDK or CLI. Interim results arrive while speech continues; final results can be synthesized.
- **Standard API:** you set the source language and target languages.
- **Live Interpreter:** detects the spoken language continuously (no input language needed), switches languages mid-session, supports **bring-your-own personal voice**, and outputs target-language transcription.
- **Targets:** the Speech service translates into **two target languages** directly. For more, use a Foundry (multi-service) resource; translation fees then apply for each language beyond the second.
- Custom speech models can be used with speech translation.

*Decision:* speech in → text out in other languages = standard speech translation; conversation between speakers of unknown languages = Live Interpreter; documents or text = Translator (see [Translation](translation.md)).

---

## 5. Voice agents with Voice Live

**Voice Live** is a managed WebSocket API for speech-to-speech conversation. It bundles STT, a model, TTS, noise suppression, echo cancellation, and **interruption and end-of-turn detection**. It supports function calling (for example voice RAG), avatars, 140+ STT locales and 600+ voices, with Pro, Standard and Lite tiers. Telephony works through Teams Phone extensibility or Twilio; direct SIP is not offered.

**Voice channel for a bot.** For a Bot Framework bot that must take spoken input with low latency and let the caller interrupt (barge-in), use the **Direct Line Speech** channel linked to an Azure Speech resource: audio streams to Speech over one connection, the bot gets text, and the reply is synthesized back. For phone calls add a telephony bridge such as Azure Communication Services to bring call audio in. `[NEEDS VERIFICATION]` Direct Line Speech details and current status; the Learn page could not be read on 2026-10-26. For new voice agents compare with Voice Live above.

Why use it instead of wiring STT + LLM + TTS yourself: lower latency and fewer moving parts. Why not: less control of each stage.

---

## 6. Choosing quickly

| Need | Use |
|---|---|
| Transcribe call recordings with speakers | Batch transcription with diarization |
| Transcribe one meeting file now | Fast transcription |
| Captions for live talk | Real-time STT |
| Product names misheard | Custom speech (phrase list first, then custom model) |
| Read text aloud with brand sound | Neural/HD voice; custom voice if approved |
| Translate live speech | Speech translation / Live Interpreter |
| Talk to an agent by voice | Voice Live |

---

## Sources
- [Text to speech overview](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech)
- [Speech translation overview](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-translation)
- [Custom speech overview](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-speech-overview)
