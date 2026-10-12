---
domain: All domains
skill: Exam technique
retrieved: 2026-10-12
---

# Traps and patterns by topic

For each topic: **patterns** (if the question says X, think Y) and **traps** (tempting but wrong ideas). The explanations behind each answer are in the linked deep dive.


## Retrieval, grounding and structured output

Explanations: [deep dive](../deep-dives/rag-retrieval-and-grounding.md) · self-test: [quiz](../quizzes/rag-retrieval-and-grounding-quiz.md)

### Patterns

- "Answers include facts not in the documents" → groundedness. "Exact codes and natural language" → hybrid + semantic ranker. "Scanned PDFs" → OCR in the pipeline.
- "Must always match a schema" → Structured Outputs, not just JSON mode. "Consistent terminology and format" → few-shot.
- **Habit:** read the symptom, name the broken step, then pick the tool for that step.
- **Rule of thumb:** product codes, names, dates, jargon → keyword matters. Paraphrased natural language, multilingual, images → vectors matter. Both present → hybrid.

### Traps

| Trap | Correct thinking |
|---|---|
| "Relevance fixes fabrication" | No: relevance can pass for an invented answer. Use groundedness |
| "Vectors make keyword search obsolete" | No: exact codes and names still need keyword matching; use hybrid |
| "Semantic ranker searches the whole index" | No: it reranks the top 50 only |
| "Add `orderby` to keep relevance" | No: sorting overrides relevance |
| "Bigger chunks are always better" | No: they blur meaning and may exceed limits |
| "JSON mode guarantees the schema" | No: only valid JSON; use Structured Outputs |
| "Few-shot guarantees accurate content" | No: it improves format consistency, not correctness |
| "Change the embedding model later, no reindex" | No: query and index vectors must come from the same model |
| "LLMs need vectors" | No: vectors are optional, used for similarity search |


## Agent safety and identity

Explanations: [deep dive](../deep-dives/agent-safety-and-identity.md) · self-test: [quiz](../quizzes/agent-safety-and-identity-quiz.md)

### Patterns

- "Prompt alone is not enough" → enforce in tools and guardrails. "Agent's guardrail vs model's" → agent overrides. "Find vulnerabilities before deployment" → red teaming agent.
- "find vulnerabilities proactively" → red teaming agent; "measure quality on a known set" → dataset evaluation.

### Traps

| Trap | Correct thinking |
|---|---|
| "Put the rule in the system prompt" | Enforce in the tool and with permissions; prompts can be bypassed |
| "The model guardrail protects the agent" | The agent's guardrail overrides it |
| "User-input filter stops all injection" | Indirect attacks arrive via tool responses and documents |
| "Agent works in test, fails after publish" | New distinct identity with no roles: reassign |
| "Give the managed identity the storage role" | The agent identity needs it |
| "Use an API key for the MCP server" | Prefer agent identity (federated, no secret) where supported |
| "Spotlighting for agents" | Not available for agents; models via Chat Completions only |
| "Guardrails scan every tool" | Only tools that support moderation |
| "Run red teaming once" | Before release and on a schedule |


## Capacity, cost and throttling

Explanations: [deep dive](../deep-dives/capacity-cost-and-throttling.md) · self-test: [quiz](../quizzes/capacity-cost-and-throttling-quiz.md)

### Patterns

- Read the load words: "steady and high" vs "spiky". Remember that Provisioned buys predictability, not lower price per token.

### Traps

| Trap | Correct thinking |
|---|---|
| "Provisioned = cheaper" | It is cheaper only at sustained high utilization; it is billed even when idle |
| "I have PTU quota, so I can deploy" | Quota is not capacity; deployment can fail |
| "Buy a reservation first" | Create the deployment, confirm capacity, then reserve |
| "Scale PTUs with the traffic curve" | Capacity may not return; hourly billing at high use costs more |
| "Retry immediately on 429" | Backoff and honor `Retry-After`; ramp gradually |
| "Standard is the fix for residency" | Standard = geography; Data Zone = zone; Global = anywhere |
| "Batch for a chatbot" | Batch has no real-time SLA |
| "Foundry will fail over my deployments" | Add a gateway such as API Management |
| "A bigger model is safer" | Slower and costlier; choose the smallest that meets quality |
| "Quota is per resource" | For onboarded models it is per subscription pool; others per region, subscription and model |


## Platform, network and reliability

Explanations: [deep dive](../deep-dives/platform-network-and-reliability.md) · self-test: [quiz](../quizzes/platform-network-and-reliability-quiz.md)

### Patterns

- "No secrets" → managed identity + Entra. "Teams must not see each other's data" → separate projects with scoped roles and connections.
- "Recover agents after deletion" → agents as code + Cosmos DB backup.

### Traps

| Trap | Correct thinking |
|---|---|
| "Private endpoint on Foundry makes everything private" | Storage, Search and Cosmos DB need their **own** private endpoints |
| "Disable public access, done" | Also need private DNS zones and a delegated subnet |
| "Share one agent subnet across resources" | One dedicated subnet per Foundry resource |
| "Foundry resource can be in a different region from the VNet" | Must be the same region |
| "Hub + projects" for a new design | Foundry resource + projects |
| "Keys are fine in Key Vault" | Prefer Entra and managed identities; remove keys |
| "Foundry backs up my agents" | It does not; use code and Cosmos DB continuous backup |
| "Foundry load-balances models" | It does not; add a gateway |
| "Grant the caller roles only" | The project managed identity needs runtime roles too |
| "Create projects in the portal in production" | Use IaC so network controls apply |


## Observability and agent lifecycle

Explanations: [deep dive](../deep-dives/observability-and-agent-lifecycle.md) · self-test: [quiz](../quizzes/observability-and-agent-lifecycle-quiz.md)

### Patterns

- "Without modifying the application" → diagnostic settings. "See each tool call" → tracing.
- "Roll back a bad change" → versions. "Quality regression" → evaluation gate. "Agent can't access resource after publish" → reassign permissions to the agent identity.

### Traps

| Trap | Correct thinking |
|---|---|
| "Run evaluation once before launch" | Evaluate continuously in production and after every meaningful change |
| "Evaluators are deterministic tests" | Most are LLM-judged and need a judge deployment |
| "Edit the agent in place" | Versions are immutable; save a new version |
| "Traces are safe to log everything" | They can capture sensitive data; redact and restrict access |
| "Task Adherence = Task Completion" | Adherence = followed rules; Completion = finished the job |
| "Tool Call Success proves correct behavior" | It only proves the call did not error |
| "Let models auto-upgrade" | Pin and validate first |
| "Publishing keeps permissions" | New identity; reassign |
| "Foundry provides canary releases" | You must build the routing layer |

## Image and video generation

Explanations: [best practices overview](../deep-dives/best-practices-and-real-world-scenarios.md) · [media case study](../real-world/multimodal-media-and-marketing.md)

### Patterns

- "Long-running generation" → asynchronous job pattern (create, poll, download).
- "Describe images" → a multimodal (vision-capable) model, not a text-only or embedding model.
- "Edit only part of an image" → the edit endpoint with a mask (transparent areas are changed).
- "Label or verify AI-generated content" → Content Credentials (C2PA) and the Content Provenance Detection tool or API.


## Language, speech, translation and extraction

Explanations: [Text analysis](../deep-dives/text-analysis-language-and-llms.md) · [Speech](../deep-dives/speech-solutions.md) · [Translation](../deep-dives/translation.md) · [Search configuration](../deep-dives/azure-ai-search-configuration.md) · [CU and Document Intelligence](../deep-dives/content-understanding-and-document-intelligence.md)

### Patterns

- "Redact personal data before the model" → Language PII detection.
- "New sentiment, summary or intent project" → Foundry models (Language versions retire March 31, 2029).
- "Many call recordings with speakers" → batch transcription with diarization; custom speech needs no endpoint for batch.
- "More than two translation targets in speech" → Foundry resource, extra fees.
- "Quick domain adaptation from a few thousand pairs" → adaptive custom translation; large parallel corpus → Custom Translator.
- "Enriched text missing from the index" → output field mapping.
- "Vectorizer must match the embedding skill model."
- "Multi-document PDF" → Content Understanding `enableSegment` with `contentCategories` (include `other`).

### Traps

| Trap | Reality |
|---|---|
| "Custom speech always needs a deployed endpoint" | Not for batch transcription |
| "Models field takes the deployment name" | Content Understanding wants the model name |
| "Indexers update in real time" | Minimum schedule is five minutes; push for faster |
| "Image severity is 0 to 7" | Image model returns 0, 2, 4, 6 |
