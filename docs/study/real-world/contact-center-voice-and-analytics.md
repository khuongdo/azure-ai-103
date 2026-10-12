---
domain: Text analysis; Generative AI and agents; Information extraction
skill: Implement speech solutions (speech to text, text to speech, speech as an agent modality, speech translation); apply language model text analysis (PII, sentiment, summaries)
sources:
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/overview
  - https://learn.microsoft.com/en-us/azure/foundry/agents/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/language-service/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/language-service/personally-identifiable-information/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/prebuilt-analyzers
retrieved: 2026-10-12
---

# Real-world: a contact center with a voice agent and call analytics

Part of [Real-world practice](index.md). Two connected problems: **talk to customers** (live voice agent) and **learn from every call** (analytics).

## 1. The problem

A telecom contact center takes 120,000 calls a month. Callers wait in queues for simple requests (plan details, bill questions, outage status), agents handle repetitive calls, and managers only review about 1% of calls by hand, so quality problems and compliance risks go unnoticed.

**Goals**

- **Live:** a voice agent that answers common calls naturally, handles interruptions, performs actions, and transfers to a human when needed.
- **After the call:** transcribe every call, **remove personal data**, summarize it, detect sentiment and topics, and flag compliance issues.
- Keep latency low (a pause of a few seconds on a phone call feels broken).

## 2. Why this is an AI-103 problem

| Need | Skill area |
|---|---|
| Speech to text and text to speech for agent interactions | Implement speech solutions |
| Speech as an agent modality, custom speech | Speech solutions |
| Sentiment, tone, sensitive content, summaries | Language model text analysis |
| Multimodal reasoning from audio | Speech solutions |

---

## Part A: the live voice agent

### 3. Architecture choices

Two ways to build a voice agent:

| Approach | What it is | Trade-off |
|---|---|---|
| **Voice Live API** | Fully managed speech-to-speech: speech recognition, a generative model and text to speech behind one WebSocket interface | Least engineering and low perceived latency; you do not host or deploy models |
| **Do it yourself** | You chain speech to text → LLM → text to speech | Maximum control; more engineering, more latency |
| **Voice-based prompt agent (Foundry Agent Service)** | A managed agent (model, instructions, audio settings, tools) that uses Voice Live; Foundry manages lifecycle and orchestration | Best when you want an agent with versioning, tools and governance (parts are Preview) |

**Voice Live features that matter in a call:**

- **Noise suppression** and **echo cancellation** (the agent does not hear itself).
- **Interruption detection** (barge-in) and **advanced end-of-turn detection** (natural pauses do not end the turn early).
- **Function calling** for actions and the *VoiceRAG* pattern for grounded answers.
- 140+ input locales and 600+ standard voices; **phrase lists** or **custom speech** for product names and jargon; **custom voice** for brand (limited-access approval required); optional avatar.
- Choice of model: native speech-to-speech models (`gpt-realtime` family) or a text model with Azure speech in front and behind (`gpt-4.1`, `gpt-5` family and others). Natively supported models are fully managed, so no deployment or capacity planning.

**Two model architectures** (from the voice agent docs): *native speech-to-speech* (lowest latency, most natural) and *cascaded* (speech recognition → text model → speech synthesis; broader model and voice choice and explicit control of transcription and turn detection, but each stage adds latency).

```
Caller ─ phone network ─► telephony channel (Teams Phone extensibility or Twilio)
                               │ audio
                               ▼
                       Voice-based prompt agent (Voice Live)
                         ├─ tools: account lookup (OpenAPI/function), outage status, knowledge base
                         ├─ guardrails, instructions, handoff tool
                         └─ trace + conversation data → Application Insights
                               │
                               ▼  transfer with context
                        Human agent desk
```

### Walkthrough: what happens during one live call

Example: a caller says, *"Hi, is there an outage in Hanoi today?"*

1. **The call is connected.** The telephony channel (Teams Phone extensibility or Twilio) turns the phone call into an audio stream sent to the voice agent over a real-time WebSocket connection.
2. **Audio is cleaned.** **Noise suppression** reduces background sound; **echo cancellation** stops the agent from "hearing" its own voice and answering itself.
3. **Speech is recognized continuously.** Audio streams in small pieces and text is produced as the caller speaks. A **phrase list** or custom speech helps with product names. In a *native speech-to-speech* model this step is internal; in a *cascaded* design it is a separate stage.
4. **Turn detection decides when the caller has finished.** **End-of-turn detection** waits through natural pauses so the agent does not cut the caller off, but replies promptly once the caller is done. This is the main driver of whether a call feels natural.
5. **The model decides what to do.** It reads instructions (short spoken sentences, confirm numbers) and decides it needs outage data, so it calls the `outage_status` function with the region.
6. **The tool returns data** (authorization enforced in your service), and the model composes a short spoken reply.
7. **Speech is synthesized and streamed back.** A neural voice reads the reply; the audio is streamed so the caller hears the start while the rest is still being generated, which reduces perceived latency.
8. **Barge-in works at any time.** If the caller interrupts, **interruption detection** stops the agent's audio and returns to listening.
9. **Handoff or close.** If verification fails, the caller asks for a person, or confusion repeats, the agent transfers with a summary. Otherwise it confirms the outcome and ends.
10. **Telemetry.** The conversation, latencies and token usage are traced to Application Insights for monitoring and for later full-conversation evaluation.

### 4. Build steps

1. **Pick the top call reasons** and their risk. Start with read-only intents (outage status, plan details); add actions later.
2. **Choose the architecture.** Start with a voice-based prompt agent or Voice Live with a managed model; choose cascaded only if you need explicit control (phrase lists, custom speech, a specific text model).
3. **Customize recognition** with phrase lists for product and plan names; add custom speech only if measurements show a need (it costs separate training and hosting).
4. **Pick the voice and persona** from standard voices; custom voice and avatar need limited-access approval.
5. **Write voice-specific instructions.** Short sentences, confirm numbers by repeating them, no markdown, no long lists, offer to transfer. Phone calls are low-bandwidth; the agent must lead.
6. **Connect tools** with authorization enforced in the tool, using the caller's verified identity (for example after a verification step), not the model's guess.
7. **Add the telephony channel.** Teams Phone extensibility (needs Azure Communication Services and Event Grid) or a Twilio connection; direct SIP is not offered as a supported customer flow in the docs. Voice-based agents and related telephony, avatar and WebRTC capabilities are in preview, so check the current status before committing to production.
8. **Define handoff.** Transfer when the caller asks, when verification fails, when confidence is low, or on repeated misunderstanding. Pass a summary to the human.
9. **Test with real recordings** and noisy conditions, accents and interruptions; measure latency end to end.
10. **Pilot** with a small percentage of calls and a quick opt-out to a person.

### 5. Quality, cost and operations for the live agent

- **Quality:** task completion rate, correct-intent rate, transfer rate, caller satisfaction, and **latency** (time from the caller finishing to the agent starting to speak). The docs note voice evaluation supports **full-conversation** runs from existing conversations; single-turn and simulated-conversation evaluation are not supported for voice agents, so build your own recorded-call test set.
- **Monitoring:** voice-specific cards and charts (token breakdowns, connection latency) require **Application Insights**; voice traces use a single trace-oriented view.
- **Cost:** Voice Live is priced in tiers (**Pro, Standard, Lite**) according to the model you choose. As an estimate, audio is about 10 input tokens per second and 20 output tokens per second for Azure OpenAI models. Custom speech, custom voice and avatars are charged separately for training and hosting. Also budget for Application Insights, Azure Communication Services calling and phone numbers, telephony, and connected tools.
- **Safety:** attach a guardrail to the agent; avoid reading back sensitive data; follow disclosure rules for synthetic voices; offer a human option.

---

## Part B: analytics on every call

### 6. Architecture

```
Call recordings (Blob Storage)
        │
        ▼
 Speech batch transcription  (diarization, timestamps; custom speech if needed)
        │ transcripts
        ├──► Conversation PII detection (async job)  ──► redacted transcript
        │
        ├──► Summarization (call center summarization: issue + resolution)
        ├──► Sentiment / topics / compliance checks (LLM or Language)
        │
        └──► (alternative single step) Content Understanding  prebuilt-callCenter
                 → topics, sentiment, key insights from the recording
        ▼
  Analytics store (Fabric / SQL) → dashboards, alerts, QA workflows
```

| Step | Tool | Notes |
|---|---|---|
| Transcribe | **Speech batch transcription** for large volumes (async, REST); **fast transcription** for single files; real-time for live captions | Custom speech for noisy audio and jargon |
| Remove personal data | **Conversation PII** (Azure Language): turn-based, transcript-aware, **asynchronous job** | Redact before storing or analyzing more widely |
| Summarize | Language **call center summarization** (issue and resolution) or an LLM prompt | Language summarization is a legacy-but-supported capability |
| Sentiment, topics, compliance | Language sentiment/opinion mining, or an LLM with a structured output schema | LLM extraction is flexible; Language features are preconfigured |
| One-step analysis | **Content Understanding `prebuilt-callCenter`** | Extracts topics, sentiment and key insights from call recordings |

### Walkthrough: what happens to one recorded call afterwards

1. **The recording is stored** in Blob Storage with call metadata (time, queue, agent ID). Where possible, caller and agent are on separate channels, which helps tell speakers apart.
2. **Batch transcription converts speech to text** asynchronously with timestamps and speaker labels. Batch is used because thousands of calls do not need real-time results and can be processed cheaply in bulk.
3. **PII detection runs on the transcript first.** Conversation PII works turn by turn (it understands that a number said after "my card is..." is a card number), finds names, phone numbers, addresses and account numbers, and returns a **redacted transcript** according to your policy (masking, entity-type replacement). *Why first:* everything after this step can then be stored and shown more widely.
4. **Summarization** produces the issue and the resolution in a few sentences, so a manager can read a call in seconds.
5. **Sentiment, topics and reason code.** A model or Language feature labels overall and per-segment sentiment and picks a **reason code from a controlled list**. A fixed list makes dashboards possible; free text does not aggregate.
6. **Compliance checks** look for required disclosures or forbidden statements and attach the **evidence quote and timestamp** to every flag.
7. **Store and route.** Results land in an analytics store; flagged calls go to a QA queue where a person confirms or rejects the flag.
8. **Learn.** Confirmed labels become test data for the next prompt or threshold change; dashboards track trends and pipeline health.

An alternative one-step route uses `prebuilt-callCenter` in Content Understanding to extract topics, sentiment and key insights directly from the recording; you would still apply PII handling on outputs you retain.

### 7. Build steps

1. **Define what managers want to know:** reasons for calling, resolution, sentiment trend, script adherence, compliance phrases (for example required disclosures), churn risk.
2. **Run a pilot on 500 calls** with human-reviewed ground truth for the top two or three outputs.
3. **Order the pipeline correctly:** transcribe → **PII redaction** → everything else. Do not send raw personal data to downstream tools, dashboards or prompts if you can avoid it. Choose redaction style (mask, entity-type replacement) according to what analytics needs.
4. **Use a schema for LLM analysis.** Ask for a fixed JSON schema (reason code from a controlled list, sentiment, resolved yes/no, compliance flags with evidence quotes). Controlled lists make dashboards possible. See structured outputs in the [retrieval deep dive](../deep-dives/rag-retrieval-and-grounding.md).
5. **Add evidence.** Each flag stores the supporting transcript snippet and timestamp so a reviewer can verify in seconds.
6. **Close the loop.** Route flagged calls to QA; use confirmed labels to improve prompts and thresholds.
7. **Run in batch** with retries and idempotency, and dashboards for pipeline health.

**Batch transcription options that matter for calls** (from Learn):

- **Diarization** separates speakers on **mono** recordings (it is not available for stereo). Set `diarizationEnabled: true` for two speakers; for three or more also set `diarization` with the minimum and maximum speaker count (the maximum must be below 36). Audio with diarization can be at most **240 minutes per file**. Because diarization works only on mono, recording agent and caller on **separate stereo channels** (channels 0 and 1 are transcribed by default) is the other way to know who spoke.
- **Fast transcription** is the alternative for files under 2 hours and 300 MB when you need consistent speed.
- Set `timeToLiveHours` (6 hours to 31 days; 48 hours recommended when you consume results directly) or delete jobs after you fetch results, and put `destinationContainerUrl` **inside** `properties` to store results in your own container (misplacing it silently writes to a Microsoft-managed container).
- **Language identification** needs 2 to 10 candidate locales and works only with base models; if you need both language identification and a custom model, use real-time recognition instead of batch.
- Use **webhooks** instead of polling; your endpoint must return the `validationToken` as plain text and allow inbound traffic from the `CognitiveServicesManagement` service tag.

### 8. Quality plan

| Output | Measure |
|---|---|
| Transcript | Word error rate on a labeled sample, by accent/noise condition |
| PII redaction | Recall on labeled entities (a missed entity is a privacy leak), precision for over-redaction |
| Summary | Human rating for faithfulness and completeness; groundedness-style check against the transcript |
| Sentiment / reason codes | Agreement with human labels |
| Compliance flags | Precision and recall; evidence snippet present |

Prioritize **PII recall**; tune for completeness over elegance. Re-measure when the audio mix changes (new marketing campaign, new product).

### 9. What goes wrong in practice

| Symptom | Likely cause | Fix |
|---|---|---|
| Product names misrecognized | Jargon, brand terms | Phrase list or custom speech |
| Agent talks over the caller | Turn detection or latency | Tune end-of-turn and interruption settings; shorter replies |
| Agent sounds slow | Cascaded pipeline, big model | Native speech-to-speech or a smaller model |
| Names leak into summaries | PII step after summarization | Redact first |
| Speakers mixed up in transcript | Diarization limits on mono recordings | Record agent and caller on separate channels where possible |
| Costs surprise | Token usage from long calls plus audio | Choose tier by model; set call-length limits; batch analytics |
| Dashboard trends meaningless | Free-text reasons | Controlled reason-code list |

## 10. Variations

- **Multilingual calls:** speech translation and language identification; see [multilingual content](multilingual-content-pipeline.md).
- **In-car or retail assistants:** same Voice Live pattern with different tools and guardrails.
- **Agent assist:** surface knowledge and next steps to human agents in real time.

## Sources and open items

See the frontmatter. Volumes, targets and the pipeline layout are illustrative. Language summarization options for call-center transcripts are described on the Language overview page (call center summarization is a legacy-but-supported capability).
