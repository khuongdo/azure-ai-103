---
domain: All domains (cross-cutting, scenario-based)
skill: Best practices and real-world problems behind the AI-103 skills outline
sources:
  - https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat
  - https://learn.microsoft.com/en-us/azure/foundry/foundry-models/quotas-limits
  - https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types
  - https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/development-lifecycle
  - https://learn.microsoft.com/en-us/azure/foundry/agents/overview
  - https://learn.microsoft.com/en-us/azure/foundry/guardrails/guardrails-overview
  - https://learn.microsoft.com/en-us/azure/foundry/concepts/observability
  - https://learn.microsoft.com/en-us/azure/foundry/concepts/rbac-foundry
  - https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs
  - https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview
  - https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-chunk-documents
  - https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/overview
retrieved: 2026-10-12
---

# Best practices and real-world scenarios

Exam questions are written as small real-world problems: "You need to X under constraints Y. What should you do?" This page explains the reasoning behind the right answers. Each scenario follows the same pattern: **the problem**, **what goes wrong if you ignore the practice**, **the best practice and why**, and **the exam angle**.

It connects to the [practice test review](practice-test-1-review.md) (question numbers in brackets) and the [services map](azure-services-overview.md). Items marked `[NEEDS VERIFICATION]` are not confirmed on Microsoft Learn yet.

## How to read an exam scenario

Underline the constraint words. They usually decide the answer:

| Constraint word | Usually points to |
|---|---|
| "predictable" or "steady" high throughput, SLO | Provisioned (PTU) |
| "unpredictable", "spiky", "pay only for use" | Standard or Global Standard pay-per-token |
| "data must stay in the EU" | Data Zone type (or a geography type) |
| "no code to maintain" | Prompt agent |
| "own code or framework" | Hosted agent |
| "exact product codes plus natural language" | Hybrid search |
| "no secrets in code", "least privilege" | Managed identity, Entra ID, RBAC |
| "audit", "who called what" | Diagnostic logs to Log Analytics |
| "before release" + "attacks" | AI red teaming agent |
| "generally available" | Avoid Preview-only features |

---

## 1. Grounded answers over company documents (RAG)

**Scenario [Q1, Q16, Q23, Q25].** A support bot answers from internal PDFs. Users report confident answers that are not in the documents, and searches for exact product codes fail.

**What goes wrong**

- The model fills gaps from general knowledge (fabrication).
- Pure vector search finds meaning but can miss exact tokens such as product codes, dates and names.
- Scanned or rotated PDFs have no text to index.
- Chunks that are too big hide the relevant passage, chunks that are too small lose context.

**Best practices and why**

1. **Measure groundedness, not just relevance.** The Groundedness evaluator checks whether the answer is supported by the retrieved context. Relevance only checks that the answer addresses the question, so a relevant answer can still be fabricated. Foundry also offers coherence, fluency and safety evaluators for other dimensions.
2. **Use hybrid search for mixed queries.** A hybrid query runs full-text (BM25) and vector search in parallel and merges results with **Reciprocal Rank Fusion (RRF)**. Keyword search is better for product codes, specialized jargon, dates and names; vector search finds conceptually similar text. Add the **semantic ranker** for reranking, and set `k` to 50 to give it enough input. Do not add `orderby`: an explicit sort overrides relevance ranking.
3. **Chunk deliberately.** Chunking keeps inputs under model token limits (for example 8,191 tokens for `text-embedding-3-small`) and avoids poor single-vector representations. Learn recommends starting at **512 tokens with 25% overlap (128 tokens)**. The Text Split skill defaults suggested for character-based chunking are `pages` mode, `maximumPageLength` 2000 and `pageOverlapLength` 500. Tune with token counts from your real documents; an overlap that is too large can lead to no overlap at all.
4. **Preserve structure at ingestion.** Content Understanding can output **Markdown** that keeps headings, tables and figure descriptions, which suits RAG. It is also available as a skill in AI Search for semantic chunking. Use JSON fields only when you need schema-based values for automation.
5. **OCR scanned content in the indexing pipeline.** An OCR skill in the skillset extracts text from images and scanned pages before chunking. `[NEEDS VERIFICATION]` exact skill name and the `detectOrientation` parameter on Learn.
6. **Pick push or pull on purpose.** Pull (indexer) works for supported data sources; push is the only choice when content must be synchronized in real time or no supported source exists.
7. **Do not assume you need vectors.** LLMs and agents do not require vectors; use them when you need similarity search.

**Exam angle.** "Answers include facts not in the documents" → groundedness. "Exact codes and natural language" → hybrid + semantic ranker. "Scanned PDFs" → OCR in the pipeline.

---

## 2. Reliable structured output (entity extraction, JSON)

**Scenario [Q5, Q11].** A pipeline extracts medical terms into JSON for a downstream system. Free text responses break the parser.

**What goes wrong.** Prompt-only JSON can drift: extra text, missing fields, wrong types. JSON mode guarantees valid JSON but **not** adherence to your schema.

**Best practices and why**

1. **Few-shot examples** give the model the exact format and vocabulary (for example a controlled terminology such as MedDRA). They improve consistency; they do not make medical output correct, so keep a validation or review step.
2. **Structured Outputs** make the model follow a JSON Schema you supply (`response_format` in Chat Completions, `text.format` in Responses). Use `strict: true`.
3. **Respect the schema subset:**
   - Make every field required; emulate optional fields with a union that includes `null`.
   - Set `additionalProperties: false` on every object.
   - At most 100 object properties total and 5 levels of nesting.
   - Unsupported keywords include `minLength`, `maxLength`, `pattern`, `format`, `minimum`, `maximum`, `minItems`, `maxItems`.
   - Root objects cannot be `anyOf`.
4. **Handle refusals.** Check the `refusal` field before reading parsed output.
5. **Function calling:** structured outputs are not supported with parallel function calls; set `parallel_tool_calls` to `false`.
6. **Know the gap.** Learn notes that structured outputs are **not supported with Foundry Agent Service** (and with bring-your-own-data scenarios). For agents, validate tool arguments and outputs yourself.

**Exam angle.** "Must always match a schema" → Structured Outputs, not just JSON mode. "Consistent terminology and format" → few-shot.

---

## 3. Safe agents that take real actions

**Scenario [Q9, Q12, Q3, Q24].** A banking agent can transfer money. The business wants approval above a limit, no investment advice, and protection against attacks.

**What goes wrong.** A single prompt instruction can be bypassed (prompt injection). An agent can also loop on tools or call tools you never intended.

**Best practices and why**

1. **Defend in layers; enforce at the tool level, not only in the prompt.**
   - Instructions limit scope and tell the agent to refuse out-of-scope topics.
   - The sensitive tool itself requires **human approval** above the threshold, and your code enforces the limit.
   - **Least-privilege** access: the agent's identity gets only what the tool needs. Limit MCP servers with `allowed_tools` and log approvals for high-risk operations.
   - **Escalation** to a human when confidence is low.
2. **Use guardrails with the right intervention points.** A guardrail is a named collection of controls (risk + intervention point + action). Intervention points: user input, **tool call**, **tool response**, output. Tool call and tool response matter for agents because **indirect (cross-prompt) injection** often arrives through tool results and documents.
3. **Remember the override rule.** An agent's guardrail **fully overrides** its model's guardrail. If the agent's guardrail has no control for a risk at an intervention point, that point is not scanned. Without a custom guardrail, the agent inherits the model deployment's guardrail.
4. **Tune severity per risk.** Hate, sexual, self-harm and violence use thresholds Low, Medium, High (turning filtering Off requires approval). Add blocklists from Azure AI Content Safety for domain terms. Manage custom policies as code.
5. **Control runaway cost and loops.** Connect only the tools you need (the agent might invoke any of them on each request), and cap output with `max_output_tokens` and `truncation` where you run orchestration yourself. `[NEEDS VERIFICATION]` how "max run steps" maps to the current Responses-based agents.
6. **Red team before release and on a schedule.** Fixed datasets replay known inputs. The **AI red teaming agent** generates attacks (PyRIT-based) to find weaknesses, best used with human review. Scheduled red teaming continues after deployment. Defender for AI services can alert on jailbreak attempts and data leakage.

**Exam angle.** "Prompt alone is not enough" → enforce in tools and guardrails. "Agent's guardrail vs model's" → agent overrides. "Find vulnerabilities before deployment" → red teaming agent.

---

## 4. Cost, latency and throttling

**Scenario [Q10, Q20].** A chatbot must answer in under 500 ms for 10,000 concurrent sessions on a tight budget. Another app has traffic spikes.

**What goes wrong.** An oversized model is slower and costlier. Provisioned capacity for spiky traffic wastes money. Hitting limits returns **HTTP 429**.

**Best practices and why**

1. **Use the smallest model that meets quality needs.** It lowers latency and cost. Validate quality with evaluations before downsizing.
2. **Match the deployment type to the load pattern.**
   - Unpredictable or bursty: Global Standard / Standard (pay-per-token).
   - Stable, high volume or strict SLOs: Provisioned (PTU) gives guaranteed capacity and lower latency variance.
   - Large non-urgent jobs: Batch (50% cheaper, 24-hour target).
   - Data residency: Data Zone or geography types.
3. **Handle throttling correctly.** On 429 use retry with **exponential backoff** and honor the `Retry-After` header. Ramp load gradually and avoid sharp changes. Move quota between deployments or request an increase.
4. **Know the quota model.** For onboarded models, quota is managed at the **subscription level**: all Global Standard deployments of the same model and version share one pool across regions, and Data Zone Standard shares one pool per data zone. The portal's Quota page shows each model's scope. Other models still use per-region, per-subscription, per-model limits.
5. **Set client timeouts explicitly.** Learn gives up to 60 seconds for streaming non-reasoning models and up to 29 minutes for reasoning models or non-streaming requests; set a lower value tuned to your traffic. Reasoning effort controls how many reasoning tokens are produced.
6. **Add your own gateway for resilience.** Foundry does not provide load balancing or failover across model deployments. A custom gateway such as Azure API Management can route, health-check and break circuits. Use data zone deployments with spillover where supported, and keep models in the same region as agents to cut latency.
7. **Monitor 429 and 503** to detect throttling at peak times.

**Exam angle.** Read the load words: "steady and high" vs "spiky". Remember that Provisioned buys predictability, not lower price per token.

---

## 5. Observability and audit

**Scenario [Q13, Q15].** An agent behaves differently in production. Compliance needs to know who called which model deployment and when, without changing the app.

**Best practices and why**

1. **Trace agents with OpenTelemetry into Application Insights.** Tracing shows each model call, tool invocation and decision, and where latency comes from. It supports LangChain, LangGraph, OpenAI Agents SDK and Microsoft Agent Framework.
2. **Use the three capabilities together:** evaluation (quality, safety), monitoring (dashboards, alerts), tracing (debugging).
3. **Evaluate continuously, not once.** Pre-production: datasets and red teaming. Production: sampled continuous evaluation, scheduled evaluation to detect drift, scheduled red teaming, Azure Monitor alerts on failed quality thresholds.
4. **Send resource logs to Log Analytics** via diagnostic settings and query with KQL, so audit needs no code change. Also send diagnostics, baseline alerts and token tracking from Azure Monitor and Application Insights. `[NEEDS VERIFICATION]` exact log category names for the resource type.
5. **Log the machines with direct data-plane access** (jump boxes, build agents).

**Exam angle.** "Without modifying the application" → diagnostic settings. "See each tool call" → tracing.

---

## 6. A shared Foundry platform for several teams

**Scenario [Q22].** Several teams need isolated work but shared governance. Security wants no keys, no public endpoints.

**Note on wording.** Older material uses "hub + projects". Current docs use a **Foundry resource** that contains **projects**; hub-based projects are the classic experience.

**Best practices and why**

1. **Structure.** Foundry resource = administrative, security and monitoring boundary. Project = organizes work and access control. Limits: 100 Foundry resources per region per subscription, 250 projects per resource, 32 deployments per resource. Use a **dedicated Foundry resource per production workload** to keep quota and compliance scope separate, and separate experimentation, testing and production resources.
2. **One project per distinct agent access pattern**, because all agents in a project share one managed identity. Use **project-level connections**, not resource-level, so future projects do not inherit access.
3. **Identity: Entra ID and managed identities, no keys.** Isolate managed identities per resource, assign identity only when needed to reach another Azure service, and use Azure Policy to disable key-based (local) authentication. Keys give full access without role restrictions.
4. **Least-privilege roles.** Foundry User for builders, Foundry Agent Consumer for callers only, Project Manager to publish, Account Owner for accounts and models. Give the **project managed identity** Foundry User too.
5. **Network isolation.** Bring your own virtual network, private endpoints for Foundry, AI Search, Storage and Cosmos DB, private DNS zones, a dedicated agent egress subnet with a route to Azure Firewall, and public access blocked. Do not inspect TLS on agent traffic, since inspection certificates can break connections.
6. **Treat the portal as read-mostly in production.** Portal actions run under the service identity and can bypass constraints, and portal-created projects do not inherit network controls. Create projects through infrastructure as code.
7. **Application owns authorization.** Foundry does not enforce per-user access to conversations, so the application must check conversation ownership to prevent broken object-level authorization.
8. **Govern with Azure Policy** for network rules, private endpoints, customer-managed keys and allowed regions, and to restrict deployment types.

**Exam angle.** "No secrets" → managed identity + Entra. "Teams must not see each other's data" → separate projects with scoped roles and connections.

---

## 7. Reliability and recovery

**Scenario.** A region or zone has an outage, or someone deletes an agent's backing data.

**Best practices and why**

- Foundry Agent Service has **no built-in backup, disaster recovery or point-in-time restore**. Define agents **as code** in source control and redeploy; use **Cosmos DB continuous backup** (7-day point-in-time restore) to recover agent definitions and conversations; use zone-redundant Cosmos DB, ZRS/GZRS storage and at least three AI Search replicas; add **delete locks** on dependencies.
- **Standard** deployments are single-region without availability-zone support; Global and Data Zone deployments give more resilience.
- Use a **user-assigned managed identity** for projects so role assignments survive recreation.
- The reference architecture is single-region; multi-region design is out of its scope, so plan it separately. `[NEEDS VERIFICATION]` current guidance for multi-region Foundry.

**Exam angle.** "Recover agents after deletion" → agents as code + Cosmos DB backup.

---

## 8. Shipping agents safely (lifecycle and versioning)

**Scenario [Q2, Q7, Q18].** A team ships an agent, then a prompt change silently reduces quality.

**Best practices and why**

1. Follow the lifecycle: choose type → create and test → add tools and data → **save versions** → trace → evaluate → optimize (Preview) → publish → monitor.
2. **Agent versions are immutable.** Any change creates a new version; you can send requests to a specific version for controlled rollout and rollback. Unsaved changes are temporary and cannot be fully evaluated.
3. **Evaluate before publishing and after any meaningful change.** Agents behave non-deterministically, so keep a test suite of realistic prompts and run it as a quality gate in CI/CD.
4. **Pin model versions.** Set model version upgrade to **no auto-upgrade** so unvalidated model changes do not alter responses.
5. **Get-or-create, and treat 404 as terminal.** Reference agents as `<agent_name>:<version>`, create once and reuse the ID. A 404 on a previously valid ID means it was deleted: recreate it instead of retrying forever.
6. **Re-check permissions after publishing.** Permissions given to the project identity do **not** transfer to the published agent's identity. Reassign only what it needs.
7. **Use the right tool for the job.** File search for uploaded documents, OpenAPI tool for REST APIs, Code Interpreter for calculation and charts. Use a **toolbox** to share curated tools through one MCP endpoint with central authentication and versioning. Fewer tools means faster runs and lower cost.
8. **Roll out gradually.** Foundry does not provide canary or blue-green natively; add a routing layer.

**Exam angle.** "Roll back a bad change" → versions. "Quality regression" → evaluation gate. "Agent can't access resource after publish" → reassign permissions to the agent identity.

---

## 9. Image and video generation

**Scenario [Q8, Q14, Q17, Q19, Q21].** An app generates videos and images, describes uploaded photos, and must label AI content.

**Best practices and why**

- **Video generation is asynchronous.** Create a job, poll its status until `succeeded`, `failed` or `cancelled`, then download the result. Never block a request thread waiting for it. Sora 2 is Preview, so confirm availability before depending on it.
- **Image generation:** `dall-e-3` is retired; use `gpt-image` models. Use the **edit** endpoint with a mask for inpainting (transparent mask areas are edited). Handle `content_policy_violation` and content filter errors gracefully. Default quota is low (5 images per minute per deployment for some models), so queue requests.
- **Image understanding:** send images to a **vision-capable (multimodal) model** and instruct it to answer only from visible evidence and say "not visible" otherwise, which reduces hallucination.
- **Provenance and policy:** moderate inputs and outputs, filter unsafe visuals, and watch for **indirect prompt injection** through text embedded in images. For labeling AI-generated content, C2PA content credentials are the likely mechanism `[NEEDS VERIFICATION]`.

**Exam angle.** "Long-running generation" → async job pattern. "Describe images" → multimodal model, not a text-only or embedding model.

---

## Quick pitfall checklist

| Pitfall | Better practice |
|---|---|
| Relying on the prompt to block risky actions | Enforce at the tool, add guardrails at tool call and tool response |
| Assuming the model's guardrail covers the agent | Agent guardrail overrides; assign one explicitly |
| Using API keys | Entra ID, managed identity, disable local auth with Azure Policy |
| Provisioned capacity for spiky traffic | Pay-per-token; Provisioned only for steady high load |
| Retrying 429 instantly | Exponential backoff + `Retry-After`, ramp load gradually |
| Pure vector search for codes and names | Hybrid search + semantic ranker |
| Oversized chunks, no overlap | Start at 512 tokens with 25% overlap and tune |
| JSON mode when a schema is required | Structured Outputs with `strict: true` |
| Editing agents in the portal in production | Agents and projects as code, immutable versions |
| One Foundry resource for everything | Separate resources per environment and production workload |
| Forgetting permissions after publish | Reassign to the published agent identity |
| Letting models auto-upgrade | Pin versions, validate with evaluations first |
| Counting on built-in DR for agents | Agents as code + Cosmos DB continuous backup |

## Sources

All pages were read on 2026-10-12 and are listed in the frontmatter. The reference architecture ([Baseline Foundry chat](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat)) is the main source for platform and operations practices.
