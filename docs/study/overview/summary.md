---
domain: All domains
skill: Consolidated text summary of AI-103
sources:
  - https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-103
  - https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-apps-and-agents-developer-associate/
  - https://learn.microsoft.com/en-us/azure/foundry/what-is-foundry
  - https://learn.microsoft.com/en-us/azure/foundry/agents/overview
retrieved: 2026-10-12
---

# AI-103 summary

One-page text summary for review. Details and sources are in the [Azure services map](azure-services-overview.md). The [mind maps](../mind-maps/mindmap.md) are a memory aid for this page, not a replacement. Items marked `[NEEDS VERIFICATION]` are not yet confirmed on Microsoft Learn.

## Exam at a glance

- **Exam AI-103: Developing AI Apps and Agents on Azure** → *Microsoft Certified: Azure AI Apps and Agents Developer Associate*.
- 120 minutes, proctored (Pearson VUE). Passing score **700**. Retake allowed after 24 hours for the first retake.
- Audience: Azure AI engineer building agents and AI solutions on **Microsoft Foundry**; Python experience expected.
- Most questions cover GA features; commonly used Preview features can appear.
- Skills as of April 16, 2026.

| Domain | Weight |
|---|---|
| Implement generative AI and agentic solutions | **30–35%** |
| Plan and manage an Azure AI solution | **25–30%** |
| Implement computer vision solutions | 10–15% |
| Implement text analysis solutions | 10–15% |
| Implement information extraction solutions | 10–15% |

Study the first two domains first: together they are 55–65% of the exam.

## Domain 1: Generative AI and agents (30–35%)

- **Agent types in Foundry Agent Service**: *prompt agent* (config only, fully managed), *voice-based prompt agent* (Voice Live, real time), *hosted agent* (your code in a container), or call the *Responses API* yourself (ephemeral agent).
- **Tools**: built-in (web search, file search, code interpreter, memory), custom (functions, OpenAPI, MCP). A **toolbox** shares curated tools through one managed MCP endpoint.
- **Multi-agent / interoperability**: Microsoft Agent Framework (course module), **A2A** protocol (v1.0 GA).
- **Lifecycle**: create → test → trace → evaluate → optimize → publish → monitor. Agents are versioned.
- **RAG**: ground the model with retrieval (Azure AI Search), then evaluate groundedness and relevance.
- **Tune behavior**: be specific and descriptive, put instructions first and repeat them after long content (models show recency bias), give the model an "out" ("say not found"), use few-shot examples, break big tasks into steps, add clear syntax (Markdown or XML), ask for **inline citations**, and provide **grounding data**. Parameters: `temperature` ranges 0 to 2 (low for focused output such as legal text, higher for creative output) and `top_p` is another randomness control; **change one of the two, not both**. These techniques are **not recommended for reasoning models** (gpt-5, o-series), where you control effort with the reasoning-effort setting instead.
- **SDK**: unified project client `azure-ai-projects` 2.x with `OpenAI()` against one project endpoint.

## Domain 2: Plan and manage (25–30%)

- **Resource model**: one **Foundry resource** → **projects** → agents. One RBAC, networking and policy plane.
- **Deployment types** (Serverless API): Global / Data Zone / regional **Standard**; **Provisioned** (PTU, predictable latency); **Batch** (50% cheaper, 24 h); **Developer** (fine-tuned model testing only). Default choice: **Global Standard**. Pick Data Zone or regional types for data residency.
- **Quota and cost**: quota per subscription, region and model; request increases or change region or type. Azure Policy can block a deployment type.
- **Security**: Microsoft Entra ID (keyless) over API keys, because keys bypass RBAC. Roles: *Foundry User* (build), *Foundry Agent Consumer* (call agents only), *Foundry Project Manager* (publish agents), *Foundry Account Owner* (accounts, models), *Foundry Owner* (all). Give the **project managed identity** Foundry User too.
- **Responsible AI**: a **guardrail** = controls (risk + intervention point + action). Intervention points: user input, tool call, tool response, output. The agent's guardrail **overrides** the model's. Default guardrail for models: `Microsoft.DefaultV2`.
- **Monitoring**: evaluators (quality, RAG, safety, agent), tracing on OpenTelemetry with Application Insights, continuous and scheduled evaluation, red teaming agent (PyRIT), Azure Monitor alerts.

## Domain 3: Computer vision (10–15%)

- **Generate images** with `gpt-image` models (`dall-e-3` is **retired**). *Edit* endpoint takes up to 16 images; **inpainting** uses a mask PNG where transparent pixels are edited.
- **Generate video** with Sora 2 (Preview): asynchronous job → poll status → download. *Remix* edits an existing video.
- **Understand images and video**: multimodal LLMs and **Content Understanding**. Azure Vision Image Analysis 4.0 is deprecated (retires 2028-09-25).
- **Responsible AI**: content filters for unsafe visuals, **indirect prompt injection** via text embedded in images (indirect attacks / Prompt Shields), brand and policy rules.

## Domain 4: Text analysis (10–15%)

- **Azure Language**: core = PII detection, language detection, NER (prebuilt and custom), health. Legacy but supported = sentiment, key phrases, summarization (extractive vs abstractive), CLU, custom classification, question answering.
- **Azure Translator**: text translation (v3 and 2026-06-06 with LLM options), document translation (batch needs Blob; synchronous single file does not), adaptive custom translation, Custom Translator.
- **Azure Speech**: speech to text (real-time, fast, batch), text to speech (neural voices, SSML, custom voice), speech translation, language identification, **Voice Live** for voice agents.
- **Agents**: Azure Language MCP server and Speech MCP server (course modules).

## Domain 5: Information extraction (10–15%)

- **Azure AI Search**: *classic* (one index) vs *agentic retrieval* (knowledge base, query planning). Query types: full-text, vector, hybrid, multimodal. Ingest with **push** or **pull (indexer)**; enrich with skills; **integrated vectorization** builds embeddings in the pipeline.
- **Content Understanding**: analyzers produce **Markdown** (for RAG) or **JSON fields** (for automation). Field methods: Extract, Classify, Generate. Confidence + grounding via `estimateFieldSourceAndConfidence`. GA API `2025-11-01`.
- **Document Intelligence**: Read, Layout, prebuilt (invoice, receipt, ID...), custom (neural, template, composed), classifier. Current API v4.0 (2024-11-30).
- **Which one?** Document Intelligence = deterministic extraction from structured documents. Content Understanding = LLM-powered, multimodal (documents, images, audio, video).

## Memorize list

1. Renames: Azure AI Foundry → **Microsoft Foundry**; AI Services → **Foundry Tools**; Assistants API → **Responses API**.
2. Default deployment: **Global Standard**. Batch = **50%** cheaper, **24 h**.
3. Keys give **full access**; Entra gives **RBAC**.
4. Agent guardrail **fully overrides** model guardrail.
5. `dall-e-3` retired **2026-03-04**. Image Analysis 4.0 retires **2028-09-25**.
6. Document Intelligence v3.0 retires 2029-03-30; v2.1 retires 2027-09-15.
7. Retired Foundry Tools: Anomaly Detector, Content Moderator, LUIS, Metrics Advisor, Personalizer, QnA Maker.
8. Push = real-time sync; pull = indexer from supported sources.
9. Content Safety groundedness, protected material and custom categories (standard) support **English only**.
10. Foundry User for the **project managed identity** as well as for people.

## Sources

See the frontmatter and the [Azure services map](azure-services-overview.md).
