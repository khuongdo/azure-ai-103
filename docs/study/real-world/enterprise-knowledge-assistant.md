---
domain: Information extraction; Generative AI and agents; Plan and manage
skill: Build retrieval and grounding pipelines; build agents by using Foundry (knowledge integration); implement responsible AI
sources:
  - https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq
  - https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search
  - https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview
  - https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-chunk-documents
  - https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/rag-evaluators
  - https://learn.microsoft.com/en-us/azure/foundry/agents/overview
retrieved: 2026-10-12
---

# Real-world: an enterprise knowledge assistant

Part of [Real-world practice](index.md). The reasoning behind each building block is in the [deep dives](../deep-dives/best-practices-and-real-world-scenarios.md).

## 1. The problem

A company with 8,000 employees keeps policies, runbooks, product specs and contracts in SharePoint, Blob Storage and a few wikis. People waste time searching, ask the same questions in chat, and sometimes act on outdated documents.

**Goals**

- Employees ask in natural language and get a **correct answer with citations**.
- **Each person sees only what they are allowed to see.** A junior engineer must not get answers drawn from HR or legal folders.
- New and changed documents appear in answers within a day.
- The company can **prove quality** and **detect regressions**.

**Constraints:** documents in many formats (PDF, Office, scanned files), some confidential; no tolerance for invented policy; modest budget.

## 2. Why this is an AI-103 problem

| Need | Skill area |
|---|---|
| Ingest and index documents, images, audio, video; semantic, hybrid and vector search | Build retrieval and grounding pipelines |
| Connect retrieval to agent tools | Build agents by using Foundry |
| Detect fabrications, relevance and quality | Evaluate models and apps |
| Security trimming, keyless access, private networking | Manage, monitor and secure AI systems |
| Guardrails and auditing | Implement responsible AI |

## 3. Solution architecture

```
Employee ── Entra sign-in ──► Web / Teams app
                                  │  (caller identity forwarded)
                                  ▼
                        Foundry prompt agent  ◄── instructions: answer only from sources, cite, say "not found"
                                  │ knowledge tool
                                  ▼
                   Foundry IQ knowledge base  (agentic retrieval)
                     ├─ knowledge source: SharePoint   (ACLs synced, remote or indexed)
                     ├─ knowledge source: Blob / ADLS  (indexed: chunk + embed + metadata)
                     └─ knowledge source: OneLake / web (optional)
                                  │
                        Azure AI Search (index + semantic ranker)
```

| Component | Role | Why this choice |
|---|---|---|
| **Foundry prompt agent** | Holds instructions, model and the knowledge tool | No orchestration code to maintain; versioned |
| **Foundry IQ knowledge base** | One reusable, permission-aware knowledge layer shared by agents | Handles chunking, embedding, metadata, scheduled refresh, query planning and citations |
| **Knowledge sources** | Connections to content (Blob, SharePoint, OneLake, web) | Indexed sources for speed; remote sources when freshness or compliance forbids copying |
| **Azure AI Search** | Underlying indexing and retrieval | Hybrid, vector, semantic reranking, security features |
| **Microsoft Entra identity** | Authenticates the user and the agent's calls | Lets retrieval run under the **caller's identity** |
| **Application Insights** | Tracing and monitoring | See what was retrieved and why |

**When a simpler design is enough:** for a small, static document set a single team owns, the agent's built-in **file search** tool (managed vector store) may do. If you do not need an agent or chatbot, **classic search** (query one index directly) is cheaper and has predictable latency. Choose the knowledge base when you need several sources, several agents, permissions, or multi-step retrieval.

### Walkthrough: what happens at each step

**A. When someone asks a question** (the online path). Example: Lan from Support asks, *"What is the laptop refresh policy for contractors?"*

1. **Sign-in and identity.** Lan signs in with Microsoft Entra ID. The app keeps her identity because retrieval must later run *as Lan*, not as a powerful service account. If the app used a service identity, every answer could draw on documents Lan should not see.
2. **The agent receives the message.** The prompt agent has instructions ("answer only from the knowledge base, cite sources, say when you cannot find it") and a knowledge tool. The model reads the question and decides it needs company knowledge, so it calls the tool instead of answering from memory.
3. **The knowledge base plans the retrieval.** Foundry IQ's **agentic retrieval** uses an LLM to understand the question and, if it has several parts, split it into **sub-queries** ("laptop refresh policy", "contractor eligibility"). A **reasoning effort** setting (minimal, low, medium) controls how much of this planning happens: more effort, better handling of complex questions, more latency and cost.
4. **Sources are searched in parallel.** Each knowledge source is queried: indexed sources (Blob) use keyword, vector or hybrid search; remote sources (live SharePoint) are queried directly. Searching in parallel keeps latency low.
5. **Permissions are applied at query time.** Only content Lan may read comes back, using synchronized access control lists, Purview sensitivity labels, and the caller's identity. This is **security trimming**: a restricted HR document is never a candidate, so it cannot leak through the model.
6. **Results are merged and reranked.** Hybrid results are fused (RRF) and the **semantic ranker** reorders the best candidates by how well they answer the question.
7. **Extractive results with citations return to the agent.** The knowledge base returns the passages (not a generated answer) with source references, so the agent reasons over real text.
8. **The model composes the answer.** It writes a short answer and cites the documents. Because the instructions forbid guessing, if nothing relevant came back it says so.
9. **Guardrails and the response.** The output guardrail scans the answer; tool responses were scanned for hidden instructions. The answer, with citations Lan can click, reaches her.
10. **Trace and feedback.** The trace records the sub-queries, the sources used and the tokens; Lan's thumbs-up or down is stored for the evaluation set.

**B. When a document changes** (the ingestion path). Example: the contractor policy is updated in SharePoint.

1. **Detect the change.** A scheduled **indexer run** (incremental refresh) notices the modified file. If a source is remote there is nothing to refresh because it is queried live.
2. **Extract and chunk.** The file is read (OCR if scanned), structure is kept, and the text is split into chunks with metadata (title, effective date, department).
3. **Embed.** Each chunk is turned into a vector with the embedding model.
4. **Update the index.** Old chunks of that file are replaced, with their **access information** attached so security trimming still works.
5. **Verify.** Document counts and failure logs confirm the update; a test question about the changed rule should return the new text.

If step B fails silently, users get answers from the old policy while everything looks healthy: this is why index health and refresh failures need alerts.

## 4. Build it, step by step

1. **Inventory content and owners.** List sources, formats, languages, sensitivity and how often each changes. Decide which content is out of scope. Quality starts with *what you put in*: delete obsolete versions or mark them.
2. **Choose indexed vs remote per source.** Indexed gives low latency and full retrieval features; remote queries the source live (useful for permission-sensitive SharePoint content or when you cannot copy data). Foundry IQ supports both.
3. **Prepare documents for good chunks.** Use layout-aware extraction so tables and headings survive. Scanned files need OCR. For the chunking defaults and why, see the [retrieval deep dive](../deep-dives/rag-retrieval-and-grounding.md).
4. **Create knowledge sources, then the knowledge base.** Set the retrieval **reasoning effort**. Higher effort means more LLM planning, more latency and cost, and better answers for multi-part questions. Check what is generally available for your API version: with Search REST API `2026-04-01` the `searchIndex`, `azureBlob`, `indexedOneLake` and `web` knowledge source types are **GA**, while other source types, **answer synthesis**, **non-minimal reasoning effort** (low and medium) and multi-turn messages remain in **preview**. Schedule indexer runs for incremental refresh.
5. **Turn on access control.** Sync ACLs for sources that support it, honor Microsoft Purview **sensitivity labels**, and run queries under the caller's Entra identity so permissions are enforced **at query time**. For sources without ACL support, use a security-filter field (a security group ID stored per document) as the workaround.
6. **Create the agent.** Write instructions: answer only from retrieved content; quote sources; if nothing relevant is found, say so and suggest where to ask; refuse out-of-scope topics. Connect the knowledge base.
7. **Add guardrails.** Attach a guardrail with a **tool response** indirect-attack control, because retrieved documents are third-party content that may contain hidden instructions. Use tools that support moderation. See [agent safety](../deep-dives/agent-safety-and-identity.md).
8. **Secure the platform.** Entra ID and managed identities, no keys; private endpoints if required; roles per the [platform deep dive](../deep-dives/platform-network-and-reliability.md).
9. **Pilot with real questions** from 20 to 30 employees, then build the evaluation set from their questions (see section 5).
10. **Publish** to Teams or a web endpoint; keep versions so you can roll back.

## 5. Quality and safety plan

**Build a golden set.** Collect 100 to 300 real questions with the expected source document and a short reference answer, covering easy lookups, multi-document questions, questions with no answer, and permission-sensitive questions. Review it with subject-matter owners.

| What you measure | Tool | Target (example, set your own) |
|---|---|---|
| Are the retrieved chunks relevant? | **Retrieval** evaluator; **Document Retrieval** (NDCG, Fidelity) with labeled documents | Trend upward; no drop after any change |
| Does the answer stay inside the sources? | **Groundedness** | At least 95% passing |
| Does it answer the question asked? | **Relevance** | At least 90% passing |
| Does it miss key facts? | **Response Completeness** (Preview) with reference answers | Track by question type |
| Does it correctly say "I don't know"? | Custom check on the no-answer subset | Near 100% |
| Does it leak restricted content? | Test accounts with different permissions; **AI red teaming agent** | Zero leaks |

Run the golden set **before every release** and a sampled version on **production traffic** continuously. Use a **parameter sweep** (chunk size, `top_k`, reasoning effort, vector vs hybrid) to choose settings with data rather than opinion.

## 6. Operating it

- **Freshness:** scheduled incremental indexer runs; alert when a run fails or a source is empty.
- **Index health:** watch document counts, failed documents, and query latency; a sudden drop in indexed documents usually means a permission or credential change at the source.
- **Cost drivers:** model tokens (instructions + retrieved context + answer), retrieval LLM planning, semantic ranker usage, Search tier, embeddings at ingestion. Reduce context by returning fewer, better chunks; use the smallest model that passes the golden set; start with the free Search tier and free token allocation for a proof of concept.
- **Feedback loop:** thumbs up/down in the UI, store the question, answer, retrieved sources and trace ID; review the worst-rated weekly and add them to the golden set.
- **Content owners:** give each source an owner. Most "AI errors" are content errors (outdated or contradictory documents).

## 7. What goes wrong in practice

| Symptom | Likely cause | Fix |
|---|---|---|
| Confident wrong answer from an old policy | Outdated document still indexed | Retire old versions; add effective dates as metadata and prefer the latest |
| Answer mixes two policies | Conflicting documents retrieved | Add metadata filters (department, region); instruct the agent to ask which applies |
| Users see content they should not | ACLs not synced, or app queries with the service identity | Run under the caller's identity; test with limited accounts |
| Good document, not found | Poor chunking, scanned file without OCR, jargon | Layout-aware extraction, OCR, hybrid search for exact terms |
| Slow answers | High reasoning effort, many sources queried | Lower effort for simple use; narrow sources by intent |
| Costs grow | Large context per question | Fewer chunks, smaller model, caching of repeated prefixes |
| Hidden instructions in a document change behavior | Indirect prompt injection | Tool response guardrail; restrict who can add documents |

## 8. Variations

- **Customer-facing version:** much stricter guardrails, only approved public content, human handoff, and stronger red teaming.
- **Multilingual company:** multilingual embeddings can match across languages; consider translating answers. See [multilingual content](multilingual-content-pipeline.md).
- **Mixed media:** index videos and recordings with Content Understanding search analyzers. See [media pipeline](multimodal-media-and-marketing.md).

## Sources and open items

See the frontmatter. Targets in the table are illustrative; your thresholds should come from your own baseline. GA versus preview status follows the migration page for Search REST API `2026-04-01` (checked 2026-10-12) and can change.
