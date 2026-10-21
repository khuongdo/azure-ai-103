---
domain: Mixed practice test (topics grouped by exam domain)
skill: Review of a second third-party practice test, mapped to the skills-measured sections
sources:
  - https://learn.microsoft.com/en-us/azure/search/search-indexer-overview
  - https://learn.microsoft.com/en-us/azure/search/semantic-search-overview
  - https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/video/overview
  - https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/dall-e
  - https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-memory
  - https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/monitor-models
retrieved: 2026-10-21
---

# Practice test 2: review and answer notes

Notes from a second practice test of the same third-party course (it covers different questions from [practice test 1](practice-test-1-review.md)). Question order in the quiz view was not stable, so this page is organized by **topic**, not by question number. Question text is not reproduced.

**The answers are not official.** Each item carries a confidence label:

- **Confirmed by quiz**: the quiz's own explanation text was read.
- **Own reasoning**: derived from Azure knowledge, not yet checked against the quiz key or Microsoft Learn. Treat as **[NEEDS VERIFICATION]**.
- **Not captured**: the answer was not recorded.

Knowledge from this test is now also in the lessons: [prompt caching](../deep-dives/capacity-cost-and-throttling.md), [blob deletion detection](../deep-dives/azure-ai-search-configuration.md), [smartCrops](../deep-dives/multimodal-understanding.md), [Content Understanding modes](../deep-dives/content-understanding-and-document-intelligence.md) and [Azure ML drift monitoring](../deep-dives/observability-and-agent-lifecycle.md), each with quiz questions.

Exam-day technique drawn from this test is in [Reading exam questions](../exam-tips/reading-exam-questions.md#lessons-from-practice-test-2), not here.

## Build generative applications by using Foundry

| Topic | Answer | Confidence |
|---|---|---|
| Client and auth for a Foundry project | `AIProjectClient` from `azure-ai-projects`, built with the project endpoint and a `TokenCredential` such as `DefaultAzureCredential()` | Confirmed by quiz |
| Persona, tone, forbidden topics, scope | Put them in the **system-role message** | Confirmed by quiz |
| Reduce unsupported claims in RAG answers | **Reflection**: a second model call checks each claim against the sources, then revises or refuses | Own reasoning |
| Build a grounded prompt | Retrieved chunks as labeled context, "answer only from the context", "say I don't know", ask for citations | Own reasoning |

**Client and credential.** `DefaultAzureCredential` (package `azure-identity`) tries several sources in order. With a Microsoft Entra service principal it reads `AZURE_TENANT_ID`, `AZURE_CLIENT_ID` and `AZURE_CLIENT_SECRET` from environment variables, so no secret appears in code. The `AzureOpenAI` client reaches Azure OpenAI only, not a Foundry project, so it is the wrong tool when the scenario says "project endpoint". A credential object is always required; there is no anonymous mode.

**System prompt versus other levers.** Few-shot examples shape output format, user-role messages are overridable by the user, and temperature or `max_tokens` tune randomness and length. Only the system message is meant to define persona and scope.

**Reflection step, walked through.**

1. *Retrieve and draft*: the normal RAG call returns a draft answer. Example: "The warranty is 3 years."
2. *Critique call*: send the question, the retrieved sources and the draft to the model with the instruction "list each claim and mark it supported or unsupported by the sources". Example: the sources say 2 years, so the claim is unsupported.
3. *Revise or refuse*: rewrite using supported claims only, or say the sources do not cover it.
4. *Check*: log how often step 3 changes the draft; a rising rate points to a retrieval problem, not a prompt problem.

Cost: one extra model call per answer, so higher latency. Azure AI Content Safety **groundedness detection** is an alternative or complement. [NEEDS VERIFICATION] the exact quiz answer.

## Optimize and operationalize generative AI systems

| Topic | Answer | Confidence |
|---|---|---|
| Cheaper repeated long static prompt prefix | **Prompt caching** | Confirmed by quiz |
| DALL-E 3 photographic look, no temporary URL | `style="natural"`, `response_format="b64_json"` | Own reasoning |

**Prompt caching.** It lowers cost and latency when many requests share the same long prefix. The prefix must be at least **1,024 tokens** and **identical** from the start, so put static content (system prompt, documents, tool definitions) first and variable content (the user question) last. Common wrong answers: **batch deployments** are cheaper but asynchronous, so they fail a tight latency target; **quota** changes how much you can send, not what each token costs. The 1,024-token minimum and identical-prefix rule were **verified on Learn on 2026-10-21** ([prompt caching](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/prompt-caching)). Batch and quota are not discussed on that page; those two points come from the quiz explanation and the deployment-types material.

**DALL-E 3 parameters.** `style` is `vivid` by default; `natural` gives a more photographic result. `response_format` of `b64_json` returns the image in the response body instead of a temporary URL, which suits networks that block the image host. See the [image generation page](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/dall-e). [NEEDS VERIFICATION] against the quiz key.

## Manage, monitor, and secure AI systems

| Topic | Answer | Confidence |
|---|---|---|
| Detect production data changing from training data | Azure ML **model monitoring** with a **data drift** signal against a baseline, alert at a threshold | Verified on Learn (2026-10-21); the retrain trigger is not on the page read |
| Agent remembers facts across sessions | A **long-term memory store** scoped per user; thread storage covers one session only | Own reasoning |

Learn confirms built-in signals (data drift, prediction drift, data quality), scheduled jobs and a default alert email ([Azure ML model monitoring](https://learn.microsoft.com/en-us/azure/machine-learning/how-to-monitor-model-performance)). For Foundry-side monitoring see [monitor models](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/monitor-models); for agent memory see [what is memory](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-memory).

## Build retrieval and grounding pipelines

| Topic | Answer | Confidence |
|---|---|---|
| Blob indexer should remove deleted blobs from the index | **Soft-delete deletion detection policy** on a custom metadata property | Confirmed by quiz |
| Better relevance without index rebuild or vectors | **Semantic ranker**: add a semantic configuration, query with `queryType` = `semantic` | Confirmed by quiz |

**Indexer sync from Blob Storage.** Change detection for new and edited blobs is built in and uses the `lastModified` timestamp. **Deletions are not detected automatically.** Mark a blob as deleted by setting a custom metadata property (for example `IsDeleted` = `true`) and configure a soft-delete policy on that property; the next indexer run then removes the document. A **high water mark** policy is for databases (a rising column), not Blob Storage. A faster schedule or enrichment caching does not detect deletions. Source: [indexer overview](https://learn.microsoft.com/en-us/azure/search/search-indexer-overview).

**Semantic ranker.** It **re-ranks** the top keyword results by meaning, so it needs no vector fields and no rebuild beyond adding a semantic configuration to the index definition. It cannot add documents that had no keyword match, so it does not fix recall; use hybrid search with vectors for that. Source: [semantic search](https://learn.microsoft.com/en-us/azure/search/semantic-search-overview).

## Design and implement multimodal understanding workflows

| Topic | Answer | Confidence |
|---|---|---|
| Video: transcript fields and on-screen text in one result | Content Understanding **standard mode** video analyzer with a **field schema** | Confirmed by quiz |
| Crop a photo to a square around the subject | Image Analysis 4.0 **`smartCrops`** with aspect ratio `1.0`, apply the returned bounding box | Confirmed by quiz |

**Content Understanding modes.** Standard mode handles documents, images, audio, video and text. **Pro mode** (multi-step reasoning, multiple input files, reference data) is for **documents only**, so it is wrong for video. One analyzer with a field schema returns everything in one structured result, so chaining separate speech, OCR and LLM pipelines is unnecessary. **Caveat:** the Learn overview and analyzer reference read on 2026-10-21 do not use the terms "standard mode" or "pro mode"; they describe `config.workflow` (`default` or `agentic`, agentic being preview and document-only). The mode wording here comes from the quiz explanation, so treat it as `[NEEDS VERIFICATION]`. Sources: [overview](https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/overview), [video](https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/video/overview).

**Smart crops.** `smartCrops` returns suggested crop rectangles for the aspect ratios you request (supported range 0.75 to 1.8 inclusive; checked on [Learn](https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/how-to/call-analyze-image-40) on 2026-10-21). `tags`, `objects` and `denseCaptions` describe content but return no framing rectangle for a target ratio.

## Not captured yet

Answers were not recorded for these questions. Open each in review mode after answering and add the result here.

- Speech custom vocabulary
- Content filter in annotate-only mode
- `AIProjectClient` chat completions call
- SSML for emphasis and speaking rate
- Customer-managed keys (CMK) with managed identity
- Multimodal image embeddings
- Content Understanding field schema
- S1 tier throttling alert
- Artwork modality choice
- Agent binding to a search tool
- Audio-input model
- Function-calling tool definition
- Content filter assigned to a deployment

## Open items

1. Verify the remaining **own reasoning** rows against the quiz key and Microsoft Learn (reflection, grounded prompt, DALL-E 3 parameters, long-term memory).
2. Fill in the **not captured** list above.
3. Confirm the "standard" and "pro" mode wording for Content Understanding (not found on current Learn pages).
4. Confirm the target exam name: the repo is `azure-ai-103` and the quiz is AI-103; the "az-103" name in the source chat appears to be a slip.
