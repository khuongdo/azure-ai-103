---
domain: All domains (mixed practice test, 25 questions)
skill: Review of a third-party practice test, mapped to the skills-measured sections
sources:
  - https://learn.microsoft.com/en-us/azure/foundry/what-is-foundry
  - https://learn.microsoft.com/en-us/azure/foundry/agents/overview
  - https://learn.microsoft.com/en-us/azure/foundry/concepts/observability
  - https://learn.microsoft.com/en-us/azure/foundry/guardrails/guardrails-overview
  - https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types
  - https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/video-generation
  - https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search
  - https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/overview
retrieved: 2026-10-12
---

# Practice test 1: review and answer notes

Notes on a 25-question practice test from a third-party course. The question text is not reproduced here; each item has a short topic title. **The answers below are not official.** The course did not show correct answers for most questions, so they were inferred from Azure knowledge. Each answer is cross-checked against the Microsoft Learn pages listed in the frontmatter and given a confidence label.

Confidence labels:

- **Verified**: matches a Microsoft Learn page read on the retrieved date.
- **Plausible**: consistent with Azure behavior, not yet checked on Learn.
- **Outdated wording**: the idea is right but the term has changed in current Foundry docs.
- **[NEEDS VERIFICATION]**: could not be confirmed; check Learn before relying on it.

Your result column is what you got in the test (✅ correct, ❌ missed).

## Score

17 of 25 correct. Missed: Q2, Q3, Q4, Q10, Q14, Q17, Q21, Q24.

## Answer table

| # | Topic | Domain | Result | Answer (unofficial) | Confidence |
|---|---|---|---|---|---|
| 1 | Detect answers not supported by retrieved context | GenAI and agents | ✅ | **Groundedness** evaluator | Verified |
| 2 | Code-first multi-step orchestration, GA, checkpointing | GenAI and agents | ❌ | Microsoft Agent Framework workflows (checkpoints saved at the end of each superstep) | Verified (checkpointing); GA label not stated on the pages read |
| 3 | Find adaptive attacks before release | Plan and manage (responsible AI) | ❌ | **AI red teaming agent** (PyRIT-based) in the Evaluation SDK | Verified |
| 4 | Best Content Understanding output for LLM input | Information extraction | ❌ | **Markdown** | Verified |
| 5 | Consistent entity format and vocabulary (for example MedDRA) | Text analysis | ✅ | **Few-shot** prompting | Plausible |
| 6 | Topic segments, speakers, transcript, semantic search over video | Computer vision | ✅ | **Azure AI Video Indexer** | Verified (capabilities); not named in the skills outline |
| 7 | Managed tool selection, thread state, built-in tools | GenAI and agents | ✅ | **Foundry Agent Service** | Verified (terms changed) |
| 8 | Generate video from a prompt | Computer vision | ✅ | **Sora**-style async job: create, poll, download | Verified (Preview) |
| 9 | Guard a banking agent (approval over $500, topic limits, escalation) | Plan and manage (responsible AI) | ✅ | Layered controls: approval on the tool, instructions, escalation | Plausible |
| 10 | Low-latency, low-cost chatbot, 10,000 sessions | Plan and manage | ❌ | **Small model** on Standard or **Global Standard** pay-per-token | Verified |
| 11 | Reliable JSON entity extraction | Text analysis | ✅ | Schema in prompt + few-shot; prefer **Structured Outputs** | Verified |
| 12 | Stop runaway tool loops | GenAI and agents | ✅ | Max run steps + truncation strategy | Outdated wording |
| 13 | Agent telemetry | Plan and manage | ✅ | **OpenTelemetry tracing** to **Application Insights** | Verified |
| 14 | Video Indexer: create a clip from chosen ranges | Computer vision | ❌ | Request body with a list of **time ranges** (a project that stitches clips, then render) | [NEEDS VERIFICATION] exact field names |
| 15 | Audit Azure OpenAI calls without code changes | Plan and manage | ✅ | **Diagnostic settings** → Log Analytics → KQL | Plausible |
| 16 | Knowledge for an agent without AI Search | GenAI and agents | ✅ | Agent Service **file search** (managed vector store) | Verified |
| 17 | Model that accepts images and text | Computer vision | ❌ | A **multimodal (vision-capable)** deployment | Plausible |
| 18 | Tools for PDFs, price REST API, charts | GenAI and agents | ✅ | File search, OpenAPI tool, Code Interpreter | Verified |
| 19 | Answers grounded only in the image | Computer vision | ✅ | Prompt: answer only from what is visible, say "not visible" | Plausible |
| 20 | Spiky, unpredictable traffic | Plan and manage | ✅ | **Standard pay-per-token** (Global Standard by default) | Verified |
| 21 | Detect AI-generated images in a pipeline | Computer vision (responsible AI) | ❌ | Check **C2PA Content Credentials** (and watermarks) with the **Content Provenance Detection** tool or API | Verified |
| 22 | Shared infrastructure for several teams | Plan and manage | ✅ | Hub + projects | **Outdated wording** (see below) |
| 23 | Search by SKU code and natural language | Information extraction | ✅ | **Hybrid search** + semantic ranker | Verified |
| 24 | Custom filter thresholds per category and a drug-name blocklist | Plan and manage (responsible AI) | ❌ | Custom content filter with per-category severity + blocklist | Outdated wording |
| 25 | OCR for rotated scanned PDFs in an indexer | Information extraction | ✅ | **OcrSkill**; note `detectOrientation` applies only to the legacy OCR v3.2 path | Verified (with a caveat) |

## Notes on the missed questions

**Q2: code-first orchestration with checkpointing.** The two clue words are "generally available" and "checkpointing". Microsoft Agent Framework workflows do support **checkpointing**: a checkpoint is saved at the end of each **superstep** and captures executor state, pending messages, pending requests and responses, and shared state. You can resume from a `checkpoint_id`, and storage options are in-memory, file, or **Azure Cosmos DB** (the production choice, with managed identity). The five built-in orchestrations are Sequential, Concurrent, Handoff, Group Chat and Magentic. The pages I read do not state a GA label, so if a question hinges on "generally available" check the current status. Source: [Agent Framework checkpoints](https://learn.microsoft.com/en-us/agent-framework/workflows/checkpoints).

**Q3: red teaming.** A fixed dataset only replays known questions. The **AI red teaming agent** simulates attacks using Microsoft's PyRIT framework to find safety and security weaknesses before deployment, and works best with human review. Scheduled red teaming also exists after deployment. Source: [Observability](https://learn.microsoft.com/en-us/azure/foundry/concepts/observability).

**Q4: Content Understanding output.** The service outputs **Markdown** for search and retrieval scenarios, or **structured JSON** matching your schema for automation. For feeding an LLM, Markdown keeps headings, tables and structure. Source: [Content Understanding overview](https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/overview).

**Q10: cost and latency.** Start with Global Standard unless you need data residency, reserved throughput or batch. Provisioned types (PTU) only pay off for steady high volume. A smaller model reduces both latency and cost. Source: [Deployment types](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types).

**Q14: Video Indexer clip parameter.** Video Indexer lets you build a **project** that stitches clips from one or more videos (up to 10 source files in the web editor and 100 through the API; the videos must be indexed in the same language) and then **render** it. The exact request field names for ranges were not found in the pages I could read. [NEEDS VERIFICATION] Check the Video Indexer REST API reference (Projects operations). Both Q6 and Q14 are about Video Indexer; the study guide links its docs even though it is not named in the skills outline. Sources: [overview](https://learn.microsoft.com/en-us/azure/azure-video-indexer/video-indexer-overview), [FAQ](https://learn.microsoft.com/en-us/azure/azure-video-indexer/faq).

**Q17: image input.** Pick a deployment of a vision-capable (multimodal) model. Text-only and embedding models cannot take images. Azure Vision is not the fit when the task needs a natural-language description of several images with reasoning.

**Q21: AI image detection.** Microsoft marks AI-generated content from supported Foundry models with **Content Credentials (C2PA)** (cryptographically signed metadata) and **invisible watermarks**. For images this covers models such as `gpt-image-1-mini`, `gpt-image-1.5` and `gpt-image-2`. To check content, use the free **Content Provenance Detection** website or its **API**, which look for C2PA credentials and Microsoft watermarks. Limits: provenance does not prove truthfulness or authorship, and cropping, resizing, format conversion or re-saving can remove metadata (watermarks may survive). Source: [Content provenance](https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/content-safety/provenance-disclosure).

**Q24: custom content filter.** In current docs "content filters" are part of **guardrails**: a guardrail is a named collection of controls. Content risks (hate, sexual, self-harm, violence) use severity thresholds Low, Medium, High. "Off" is only for approved customers. Custom blocklists come from Azure AI Content Safety. Source: [Guardrails overview](https://learn.microsoft.com/en-us/azure/foundry/guardrails/guardrails-overview).

## Terminology updates that affect these answers

The practice test uses older names in places. The exam outline uses the new ones.

| In the practice test | Current term |
|---|---|
| Azure AI Foundry hub + projects (Q22) | **Foundry resource** containing **projects**; hub-based projects are the classic experience |
| Threads, runs, run settings (Q7, Q12) | Conversations, items, responses (Responses API, Agents v2) |
| Bing grounding (Q7) | Both exist: the **Web search** tool (also available in a toolbox) and **Grounding with Bing** (direct integration only) |
| Content filters (Q24) | Guardrails made of controls |
| Azure AI Content Safety, Azure AI Search | Content Safety is a Foundry Tool; AI Search keeps its name |

Q12 and Q22 are the answers most likely to be framed differently on the real exam. For Q12, the Responses API page I read documents `previous_response_id` chaining and the function-call loop but **does not document a "max run steps" setting or a "truncation strategy"**, and states no maximum number of tool-call iterations. Learn's reference architecture does list `max_output_tokens` and `truncation` as cost controls for self-hosted orchestration. Treat "max run steps" as an Assistants-era setting. [NEEDS VERIFICATION] in the Responses API parameter reference.

## Weak areas from this test

1. **Responsible AI controls**: red teaming (Q3), guardrails and filters (Q24), provenance (Q21).
2. **Video**: Video Indexer (Q6, Q14) and video generation (Q8). Video appears in the computer vision domain.
3. **Deployment choice**: model size and deployment type for cost and latency (Q10, Q20).
4. **Multimodal models and Content Understanding outputs** (Q4, Q17).

## Study next

- Read the [services map](../overview/azure-services-overview.md) sections on guardrails, deployment types and Content Understanding.
- Run `ai103-note` for the responsible AI section, then `ai103-quiz` to generate more questions on the weak areas.
- Remaining items marked [NEEDS VERIFICATION] above (Q14 field names, Q12 parameters) need the REST API references; everything else on this page was checked on 2026-10-12.
