---
domain: All domains (cross-cutting)
skill: Service map for the whole AI-103 skills-measured outline
sources:
  - https://learn.microsoft.com/en-us/azure/foundry/what-is-foundry
  - https://learn.microsoft.com/en-us/azure/ai-services/what-are-ai-services
  - https://learn.microsoft.com/en-us/azure/foundry/agents/overview
  - https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types
  - https://learn.microsoft.com/en-us/azure/foundry/concepts/rbac-foundry
  - https://learn.microsoft.com/en-us/azure/foundry/concepts/observability
  - https://learn.microsoft.com/en-us/azure/foundry/guardrails/guardrails-overview
  - https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search
  - https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/language-service/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/translator/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview
  - https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/dall-e
  - https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/video-generation
retrieved: 2026-10-12
---

# Azure services map for AI-103

This page lists the Azure services behind the AI-103 skills, with the facts most likely to matter on the exam. Everything here was read from Microsoft Learn on the retrieved date. Items I could not verify are marked `[CẦN XÁC MINH]`, and the last section lists topics not yet researched. Names and statuses change fast, so recheck before the exam.

## 1. Naming cheat sheet (old name → current name)

The exam uses the new names. Many blog posts and older docs use the old ones.

| Previous | Current |
|---|---|
| Azure AI Studio / Azure AI Foundry | **Microsoft Foundry** |
| Azure AI Services | **Foundry Tools** (e.g. "Azure Speech in Foundry Tools") |
| Hub + Azure OpenAI + Azure AI Services resources | One **Foundry resource** that contains **projects** |
| Assistants API (Agents v0.5/v1) | **Responses API** (Agents v2) |
| Threads, Messages, Runs, Assistants | Conversations, Items, Responses, Agent Versions |
| Monthly `api-version` parameters | v1 stable routes (`/openai/v1/`) |
| Many SDK packages (`azure-ai-inference`, `azure-ai-generative`, `azure-ai-ml`, `AzureOpenAI()`) | Unified project client (`azure-ai-projects` 2.x) + `OpenAI()` against one project endpoint |
| Azure AI User / Owner / Account Owner / Project Manager roles | **Foundry User / Owner / Account Owner / Project Manager** (same role IDs) |

Source: [What is Microsoft Foundry?](https://learn.microsoft.com/en-us/azure/foundry/what-is-foundry), [RBAC for Foundry](https://learn.microsoft.com/en-us/azure/foundry/concepts/rbac-foundry).

## 2. Service map

| Service | Used for | Main exam domain |
|---|---|---|
| **Microsoft Foundry** (resource, projects, portal, SDKs) | Platform: models, agents, tools, evaluation, governance | Plan/manage, GenAI & agents |
| **Foundry Models** (catalog + deployments) | Deploy and consume LLMs, small, code, multimodal models | Plan/manage, GenAI & agents |
| **Foundry Agent Service** | Build, host and publish agents | GenAI & agents |
| **Azure AI Search** (incl. agentic retrieval, Foundry IQ) | Retrieval, indexing, grounding, RAG | Information extraction, GenAI |
| **Content Understanding** | Multimodal extraction to Markdown or schema-based fields | Vision, Information extraction |
| **Document Intelligence** | OCR, layout, prebuilt and custom document models | Information extraction |
| **Azure Speech** (incl. Voice Live) | Speech to text, text to speech, speech translation, voice agents | Text analysis |
| **Azure Language** | NER, PII, sentiment, summarization, CLU, etc. | Text analysis |
| **Azure Translator** | Text and document translation | Text analysis |
| **Azure Vision** | Face, legacy Image Analysis and OCR | Vision |
| **Image and video generation models** (gpt-image, Sora 2) | Generate and edit images and video | Vision |
| **Azure AI Content Safety** + **Foundry guardrails** | Safety filters, prompt shields, groundedness | Plan/manage (Responsible AI), Vision |
| **Microsoft Entra ID**, managed identity, Azure RBAC | Keyless auth and access control | Plan/manage (security) |
| **Azure Monitor / Application Insights** | Tracing, monitoring, alerts | Plan/manage, GenAI & agents |

## 3. Microsoft Foundry (platform)

- Unifies agents, models and tools under one management grouping, with unified RBAC, networking and policies under one Azure resource provider.
- Resource hierarchy: **Foundry resource** (top-level administrative, security and monitoring boundary) → **Foundry project** (organizes work and access control for APIs, tools, workflows) → **agent** (a narrower scope, used for agent-endpoint access only).
- Hub-based projects belong to the classic portal; new investment is on Foundry projects.
- Developer surfaces: Foundry portal, SDKs (Python, C#, JavaScript, Java), Azure Developer CLI (`azd`), VS Code extension, coding agents + MCP.
- You can upgrade an Azure OpenAI resource to a Foundry resource and keep the endpoint, keys and state.
- Some platform capabilities are Preview (for example built-in observability dashboards). Check the general availability overview page for current status. `[CẦN XÁC MINH]` which exact features are GA on exam day.

## 4. Foundry Models and deployments

Deployment types for the **Serverless API** option (managed-compute models don't use these):

| Type | SKU code | Data processing | Billing | Best for |
|---|---|---|---|---|
| Global Standard | `GlobalStandard` | Any Azure region | Pay-per-token | Default; highest quota, newest models |
| Global Provisioned | `GlobalProvisionedManaged` | Any region | Reserved PTU | Predictable high throughput |
| Global Batch | `GlobalBatch` | Any region | 50% discount, 24 h target | Large async jobs |
| Data Zone Standard | `DataZoneStandard` | Within data zone (US, EU, APAC) | Pay-per-token | Data zone compliance |
| Data Zone Provisioned | `DataZoneProvisionedManaged` | Data zone | Reserved PTU | Data zone + throughput |
| Data Zone Batch | `DataZoneBatch` | Data zone | 50% discount | Async jobs in a data zone |
| Standard | `Standard` | Within the Azure geography | Pay-per-token | Geography compliance, low volume |
| Regional Provisioned | `ProvisionedManaged` | Geography | Reserved PTU | Geography + throughput |
| Developer | `DeveloperTier` | Any region | Pay-per-token | Fine-tuned model evaluation only; 24 h lifetime, no SLA |

Exam-style rules of thumb:

- Start with **Global Standard** unless you have a data residency, reserved-throughput or batch reason.
- **Provisioned** = lower, more consistent latency (PTUs). **Standard** types are best-effort and can show latency variance at high steady volume.
- Data at rest stays in the designated geography; **inference** location depends on the type (global, data zone, geography).
- Quota is a limit per subscription, region and model (tokens per minute). Raise it with a quota request, or use another region or deployment type. `[CẦN XÁC MINH]` exact TPM and RPM terminology and the Foundry Models quotas page.
- **Azure Policy** can block a deployment type by denying `sku.name` on `Microsoft.CognitiveServices/accounts/deployments`.
- "Instant access" (Preview) lets you call supported models by name without creating a deployment.
- Catalog: more than 10,000 models from Microsoft, OpenAI, Anthropic, Meta and others.

## 5. Foundry Agent Service

Agent types:

| Type | You manage | Use when |
|---|---|---|
| **Prompt agent** | Instructions, model, tools (no code or containers) | Fastest start; no custom orchestration |
| **Voice-based prompt agent** | Model, instructions, audio settings, tools; uses Voice Live | Real-time spoken experiences. Preview in parts |
| **Hosted agent** | Your code (Agent Framework, LangGraph, OpenAI Agents SDK, etc.) as a container or .zip | Custom orchestration, multi-agent, custom protocols |
| **Ephemeral agent** (Responses API called directly) | Definition lives in your app code | You already run agent code elsewhere |

Building blocks and facts:

- **Agent runtime** hosts and scales prompt and hosted agents. **Toolboxes** curate tools once (web search, file search, code interpreter, MCP servers, custom functions) behind a single managed MCP endpoint with central auth, governance and versioning.
- Built-in tools include web search, file search, code interpreter and memory (memory is Preview). Custom tools: functions, OpenAPI specs, MCP servers. MCP servers can be hosted on Azure Functions.
- Tool and MCP authentication options: key-based, Microsoft Entra (agent or project managed identity), OAuth identity passthrough (On-Behalf-Of), unauthenticated where appropriate.
- Lifecycle: create → test (playground) → trace → evaluate → optimize (agent optimizer, Preview) → publish → monitor. Agents are automatically versioned; publishing promotes an agent to a managed resource with a stable endpoint.
- Distribution: Microsoft Teams, Microsoft Copilot, Entra Agent Registry. Protocols: OpenResponses, Activity, Invocations, and **A2A** (v1.0 GA, v0.3 Preview).
- Enterprise: dedicated Entra **agent identity**, private networking (VNet) for prompt agents, BYO VNet for hosted agents, RBAC, content filters, bring-your-own resources (Storage, AI Search, Cosmos DB for conversation state).
- Multi-agent orchestration with Microsoft Agent Framework appears in the course (see the [AI-103T00 course](https://learn.microsoft.com/en-us/training/courses/ai-103t00)). `[CẦN XÁC MINH]` Agent Framework API names before writing code samples.

## 6. Azure AI Search

- **Classic search**: one index, one request, no LLM planning. **Agentic retrieval**: a **knowledge base** with one or more **knowledge sources**, optional LLM for query planning and answer synthesis; does planning, subqueries, parallel retrieval, semantic reranking, merging. Agentic retrieval has region restrictions and is GA with some preview capabilities.
- Query types: full-text, **vector**, **hybrid** (full-text + vector), **multimodal**. Semantic ranker for reranking `[CẦN XÁC MINH]` exact feature names and tier requirements.
- Ingestion: **push** (you upload JSON) vs **pull** (indexer, from supported data sources such as Blob Storage, Cosmos DB, SharePoint, OneLake). Real-time sync needs push. Search indexes only JSON documents.
- **AI enrichment**: skills chunk, vectorize and transform content at indexing time. **Integrated vectorization** generates embeddings in the pipeline. LLMs and agents do not require vectors.
- Security: Microsoft Entra ID, Azure Private Link, document-level access control, RBAC. Remote SharePoint is designed for user-permission inheritance; Blob and ADLS Gen2 can inherit permissions; otherwise use the security-filter workaround.
- Pricing model: **Dedicated** or **Serverless (Preview)**. Scaling terms (replicas, partitions) `[CẦN XÁC MINH]` on the tier page.
- **Foundry IQ** is the managed knowledge layer built on AI Search for permission-aware knowledge bases for agents.

## 7. Content Understanding (in Foundry Tools)

- Uses generative AI to turn **documents, images, video and audio** into your chosen output: **Markdown** (search, RAG) or **structured JSON** matching your schema.
- Core component is the **analyzer** (prebuilt or custom): content extraction settings, field schema, model deployments. Stages: inputs → content extraction (OCR, layout, tables, transcription) → **segmentation** (`enableSegment`) → **field extraction** → confidence and grounding → structured output.
- Field extraction methods: **Extract** (values as they appear, documents only), **Classify** (pick from categories, can route to another analyzer), **Generate** (free generation, for example summaries or scene descriptions).
- **Confidence scores** (0 to 1) and **grounding** (source regions) are enabled with `estimateFieldSourceAndConfidence` on document analyzers.
- You bring your own deployments of supported generative and embedding models.
- API versions: `2025-11-01` is GA (production); `2026-06-01-preview` adds agentic mode, in-page segmentation, signature detection, document metadata.
- Inherits Foundry **guardrails**; guardrail detections can show as warnings, so analysis can succeed with some fields missing.
- `single-task` versus `pro mode` pipelines appear in the skills outline. `[CẦN XÁC MINH]` exact meaning and current naming on Learn.
- Tools: Foundry portal (Content Understanding Tool for agent workflows) and Content Understanding Studio (analyzer improvement, labeling, easier move from Document Intelligence).

## 8. Document Intelligence (in Foundry Tools)

- Current API: **v4.0 (2024-11-30) GA**. v3.0 retires March 30, 2029; v2.1 retires September 15, 2027.
- Models: **Read** (printed and handwritten text), **Layout** (text, tables, structure), **prebuilt** (invoice, receipt, ID document, contract, health insurance card, tax and mortgage forms, and more), **custom** (neural, template, composed), **custom classifier** (identify document type before extraction).
- Custom field types: string, number, integer, date. Prebuilt field schemas are defined by Microsoft.
- Add-ons: high-resolution OCR, formulas, fonts, barcodes, searchable PDF, `queryFields`, `keyValuePairs`.
- Relationship to Content Understanding: Document Intelligence = deterministic extraction for structured documents; Content Understanding = LLM-powered, multimodal, complex content.

## 9. Azure Speech (in Foundry Tools)

- **Speech to text**: real-time (streaming), **fast transcription** (pre-recorded files), **batch transcription** (async, large volume, REST). **Custom speech** models for noise or jargon (acoustic, language, pronunciation data).
- **Text to speech**: neural voices, **SSML** for pitch, rate, pronunciation; standard vs **custom voice** (limited access); **text-to-speech avatar**.
- **Speech translation**: speech-to-speech and speech-to-text. **LLM speech (Preview)**: `transcribe` and `translate` for pre-recorded audio. **Language identification**, **pronunciation assessment**.
- **Voice Live**: low-latency conversational interface between a person and an agent; backs voice-based prompt agents. Two architectures: native speech-to-speech and cascaded (recognition → text model → synthesis).
- Access: Speech SDK, Speech CLI, REST. Containers for on-premises use.

## 10. Azure Language (in Foundry Tools)

| Core (recommended for new work) | Legacy (supported for existing use) |
|---|---|
| PII detection, language detection, NER (prebuilt and custom), text analytics for health | Conversational language understanding (CLU), custom text classification, entity linking, key phrase extraction, orchestration workflow, question answering, sentiment analysis and opinion mining, summarization |

- **Summarization**: extractive (selects key sentences) vs abstractive (writes new sentences); also conversation and call center summarization.
- Agents: **Azure Language MCP server** (remote in the Foundry Tool Catalog, or local), plus prebuilt Intent Routing and Exact Question Answering agents (Preview).
- Retired services in the Foundry Tools family: Anomaly Detector, Content Moderator, LUIS, Metrics Advisor, Personalizer, QnA Maker.
- The exam outline also lists LLM-based extraction (entities, topics, summaries, JSON output) with generative prompting. `[CẦN XÁC MINH]` which tasks are expected via Language versus an LLM.

## 11. Azure Translator (in Foundry Tools)

- **Text translation**: version `2026-06-06` (GA) adds LLM selection, adaptive custom translation and more parameters; **v3** (GA) remains, with dynamic dictionary and prevent-translation.
- **Document translation**: asynchronous batch (needs Azure Blob containers) vs synchronous single file (no storage needed, optional glossary).
- **Adaptive custom translation**: 5 to 10,000 aligned segment pairs (up to 500 characters each) adapt a supported LLM. **Custom Translator** builds custom models with dictionaries.

## 12. Vision, image and video generation

- **Azure Vision**: Face, plus legacy Image Analysis and OCR. **Image Analysis 4.0 is deprecated and retires September 25, 2028**; migrate. Image limits: JPEG, PNG, GIF, BMP; under 4 MB; over 50 x 50 pixels.
- Multimodal understanding in the exam (captions, alt text, visual question answering) is done with **multimodal LLM deployments** and **Content Understanding**, not only Vision.
- **Image generation**: `dall-e-3` is **retired** (March 4, 2026). Use `gpt-image` series models. The Learn page lists GPT-image-2 and later as GA and GPT-image-1, 1.5 and mini as limited-access preview, but the page is not fully consistent. `[CẦN XÁC MINH]` current GA status.
- Endpoints: **generate** (JSON) and **edit** (multipart/form-data, up to 16 input images). **Inpainting** uses a `mask` PNG of the same size where transparent areas (alpha 0) are edited. Other parameters: `size`, `quality`, `n` (1 to 10), `output_format`, `input_fidelity`. Output is base64 (`b64_json`).
- **Video generation (Sora 2, Preview)**: text, image or video input; **remix** edits an existing video. It is **asynchronous**: create a job, poll its status (`succeeded`, `failed`, `cancelled`), then download the result.
- Azure adds input and output moderation and abuse monitoring on image generation models.

## 13. Safety: Content Safety and Foundry guardrails

- A **guardrail** is a named collection of **controls**. A control = a risk + intervention points + a response action.
- **Intervention points**: user input, tool call (Preview, agents), tool response (Preview, agents), output.
- **Risks**: hate, sexual, self-harm, violence (severity thresholds Low, Medium, High; Off only for approved customers); user prompt attacks; **indirect attacks** (cross-prompt injection, XPIA); protected material (text, code); groundedness (Preview, models only); PII (Preview); task adherence (Preview); spotlighting (Preview, models only).
- **Actions**: annotate, or annotate and block. Agents support annotate and block only (Preview).
- Default guardrail for models is **Microsoft.DefaultV2**. An agent's own guardrail **fully overrides** its model's guardrail; if none is assigned, the agent inherits the model deployment's guardrail.
- Hosted agents also support **network egress controls** (Preview) in the same guardrail.
- Guardrails use classification models from **Azure AI Content Safety**. Standalone Content Safety APIs: Analyze text, Analyze image, Prompt Shields, Protected material, Groundedness detection (Preview), Task adherence, custom categories (Preview). Tiers F0 and S0; managed identity is on by default.
- Content Safety groundedness, protected material and custom categories (standard) work with English only.

## 14. Security and identity

- RBAC applies when you use Microsoft Entra ID. **API keys give full access without role restrictions**, so prefer Entra (keyless) authentication.
- Built-in roles: **Foundry User** (build and develop in a project, reader access), **Foundry Agent Consumer** (only interact with agent endpoints, least privilege), **Foundry Project Manager** (manage projects, publish agents, assign Foundry User), **Foundry Account Owner** (create accounts and projects, manage models, no data-plane building), **Foundry Owner** (everything above). Role IDs, for example Foundry User `53ca6127-db72-4b80-b1b0-d745d6d5456d`; use IDs in code during the rename rollout.
- Minimum setup: Foundry User on the Foundry resource for the user principal **and** the project's managed identity; **Cognitive Services Usages Reader** at subscription scope to see quota.
- Do not use **Azure AI Developer** for Foundry work; it targets Azure Machine Learning workspaces and hubs.
- Publishing agents needs at least Foundry Project Manager on the Foundry resource. Fine-tuning needs both data-plane and control-plane permissions (Foundry Owner, or Foundry User + Foundry Account Owner).
- Using outside resources: give the Foundry account's managed identity access (for example Storage Blob Data Reader on a storage account).
- Private networking, Key Vault integration and customer-managed keys `[CẦN XÁC MINH]` not yet read from Learn for Foundry.

## 15. Observability and evaluation

Three capabilities: **evaluation**, **monitoring**, **tracing**.

- **Evaluators**: general quality (coherence, fluency), RAG (groundedness, relevance), safety and security (hate/unfairness, violence, protected material), agent evaluators (tool call accuracy, task completion, task adherence), plus custom evaluators.
- **Three lifecycle stages**: base model selection (Foundry benchmarks), pre-production evaluation (datasets, **AI red teaming agent** built on PyRIT), post-production monitoring (operational metrics, continuous evaluation of sampled production traffic, scheduled evaluation to detect drift, scheduled red teaming, Azure Monitor alerts).
- **Tracing**: distributed tracing on OpenTelemetry, integrated with **Application Insights**; supports LangChain, LangGraph, OpenAI Agents SDK and Microsoft Agent Framework.
- Voice agents' monitoring cards need Application Insights; single-turn and simulated-conversation evaluation are not supported for voice agents.
- Playground evaluations are on by default and billed by consumption.

## 16. Not yet researched (do these next)

Mark these as gaps before relying on this page:

- Foundry networking: private endpoints, VNet integration, firewall, data residency specifics.
- CI/CD for Foundry projects (GitHub Actions, Azure DevOps, `azd`, Bicep/Terraform) and infrastructure design.
- Microsoft Agent Framework API, multi-agent orchestration patterns, Foundry workflows.
- Prompt engineering and model parameters (temperature, top_p, max tokens), reflection and self-critique loops, hybrid LLM + rules.
- RAG implementation details: chunking, embeddings models, semantic ranker, evaluation of relevance.
- Azure Video Indexer (the study guide links its docs) and Azure OpenAI audio models. `[CẦN XÁC MINH]` whether they are tested.
- Cost management, quota and rate-limit handling (retry with backoff, load balancing), model drift monitoring.
- Responsible AI tooling: explanation tooling, provenance metadata, approval workflows for agents.

## Sources

All pages above were read on 2026-10-12 and are listed in the frontmatter. For each section, the first link is the overview page of that service.
