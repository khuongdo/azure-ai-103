---
domain: Implement information extraction solutions
skill: Configure Azure AI Search: data sources, indexers, skillsets, integrated vectorization, security, agentic retrieval
sources:
  - https://learn.microsoft.com/en-us/azure/search/search-indexer-overview
  - https://learn.microsoft.com/en-us/azure/search/cognitive-search-concept-intro
  - https://learn.microsoft.com/en-us/azure/search/vector-search-integrated-vectorization
  - https://learn.microsoft.com/en-us/azure/search/search-security-built-in
  - https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-overview
  - https://learn.microsoft.com/en-us/azure/search/search-how-to-index-azure-blob-changed-deleted
retrieved: 2026-10-21
---

# Deep dive: configuring Azure AI Search

The [retrieval and grounding](rag-retrieval-and-grounding.md) page explains *how queries are ranked*. This page explains *how content gets into the index* and how the service is secured and extended. Items marked `[NEEDS VERIFICATION]` are not confirmed on Microsoft Learn.

---

## 1. The four objects

| Object | Role |
|---|---|
| **Data source** | Connection to the origin (Blob, ADLS Gen2, Cosmos DB, SQL, Table, OneLake, and previews such as SharePoint, Azure Files, MySQL) |
| **Index** | The destination schema: fields, types, vector fields, vectorizers, semantic configuration |
| **Skillset** | Optional enrichment steps between reading and indexing |
| **Indexer** | The crawler that connects the three; runs on demand or on a schedule (as often as every five minutes) |

Rules: one indexer uses **one data source** and writes to **one index**. Many indexers can write to the same index. You create the index yourself; the indexer does not.

**Pull vs push:** indexers *pull* (no code to add documents). If you need updates faster than every five minutes, *push* documents with the SDK or REST API.

---

## 2. What an indexer does, stage by stage

1. **Document cracking:** opens files, extracts text, metadata and (if `imageAction` is enabled, for an extra fee) images.
2. **Field mappings:** copy a source field to an index field when names or types differ. Values go through unchanged.
3. **Skillset execution (optional):** skills build an **enriched document**, a tree of intermediate results.
4. **Output field mappings:** pick which nodes of the enriched tree go to which index fields. **Required** for any enriched content you want in the index.

*Example:* a PDF in Blob → crack text and images → OCR on images → split text into chunks → embed chunks → output mappings put chunk text and vector into index fields.

**Change detection:** automatic for blobs; must be enabled for Azure SQL and Cosmos DB. First run reads everything; later runs read the delta.

**Monitoring:** indexer status in the portal or the Get Indexer Status API; then run a query to verify results. A search service runs **one indexer job per search unit**, so add replicas for concurrency. Indexers have no dedicated compute, so run times vary and heavy indexing can cause query throttling.

### Changed and deleted blobs

- **Changed or new blobs** are picked up automatically: the indexer compares the built-in last-modified timestamp of each blob with what it already indexed.
- **Deleted blobs are not detected.** An indexer does not track deletion in the data source, so a blob you delete leaves an orphan document in the index. The fix is a **soft delete strategy**: remove the search document first, then delete the file.
- Two ways to do it:
  1. **Native blob soft delete** (Blob Storage only): enable soft delete on the storage account, set a `NativeBlobSoftDeleteDeletionDetectionPolicy` on the data source, and keep the retention period well above the indexer interval. Blob versioning must be off. The indexer removes a document only if it processes the blob while it is in the soft-deleted state.
  2. **Custom metadata**: add a metadata key such as `IsDeleted` = `false` to each blob. Set it to `true` to delete. The data source carries a `SoftDeleteColumnDeletionDetectionPolicy` with `softDeleteColumnName` and `softDeleteMarkerValue`. Run the indexer, then physically delete the blob.
- Set the policy **before the first indexer run**; documents deleted earlier stay in the index even after you add the policy and reset. It does not work for one-to-many indexing; delete those documents through the index API.
- A **high water mark** policy is a change-detection policy for databases (Azure SQL, Cosmos DB), not a blob deletion fix. A faster schedule or enrichment caching does not detect deletions either.

*Example:* the legal team deletes `contract-17.pdf` from the container but search still returns it. With no deletion policy the indexer never learns about it. With the `IsDeleted` policy, set `IsDeleted=true`, run the indexer, confirm the document is gone from the index, then delete the blob.

*What can go wrong:* index field type mismatch, missing output field mapping (enrichment silently not indexed), no change detection (full reread), throttled embedding calls.

---

## 3. Skillsets and AI enrichment

Skills come in two kinds:
- **Built-in** (use Foundry Tools): OCR, image analysis, language detection, translation, entity recognition, key phrases, PII detection, sentiment, **Text Split** (chunking, free), **Azure OpenAI embedding**, Azure Vision multimodal embeddings (preview), Content Understanding skill. Larger workloads need a billable **Foundry resource** attached to the skillset.
- **Custom skills**: your code behind a web API that follows the custom skill interface (for example a classification model).

**Outputs:** a searchable **index** (required), an optional **knowledge store** (blobs/tables in Storage for analytics, Power BI), and an optional **enrichment cache (preview)** that reuses skill outputs so unchanged documents are not reprocessed (saves OCR cost).

**Debug:** debug sessions show the enriched tree; **reset the indexer** before re-running after changing the pipeline.

*Decision:* built-in skill if one exists; custom skill if you need your own logic; Content Understanding when you need structured fields from complex documents.

---

## 4. Integrated vectorization

Adds **vector encoding at indexing time and at query time** with no separate pipeline.

**At indexing:** indexer + index + skillset with a **chunking skill** (Text Split, Content Understanding skill, or a parsing mode) and an **embedding skill** (Azure OpenAI embedding with text-embedding-ada-002, -3-small, -3-large; custom skill; Azure Vision multimodal; AML skill for catalog models).

**At query time:** a **vectorizer** defined in the index and assigned through a **vector profile** to the vector field turns the query text into a vector. **The vectorizer must use the same embedding model as the skill.**

| Embedding skill | Matching vectorizer |
|---|---|
| Azure OpenAI Embedding | Azure OpenAI vectorizer |
| Custom skill | Custom Web API vectorizer |
| Azure Vision multimodal (preview) | Azure Vision vectorizer |
| AML skill (catalog) | Foundry model catalog vectorizer (preview) |

**Index projections** create a secondary index of chunks while the parent index holds the whole document; matches in chunks return the parent. Good for chat/RAG.

**Operational notes:** built-in batching and retry are not configurable; schedule the indexer (for example every 5 minutes) to catch throttled documents. Azure OpenAI token-per-minute limits are per model per subscription, so use separate embedding deployments for indexing and querying. Shared private link works for Azure-to-Azure only (`openai_account` group ID for Azure OpenAI, `sites` for custom skills on App Service/Functions).

---

## 5. Security

**Built in (no action):** TLS 1.2/1.3 on port 443, 256-bit AES at rest, Microsoft backbone, compliance certifications. Same-region Storage traffic uses private IPs so you cannot add a storage firewall for it. Microsoft does not use your data to train models. Resource logs record operations and query text but **not user identity**.

**You configure:** network access (IP firewall, private endpoint), authentication (prefer **Microsoft Entra ID with RBAC** over keys), indexer connections with **managed identity**, document-level permissions, monitoring, optional **customer-managed keys** (second encryption layer) and confidential computing (limited regions, higher cost).

*Data residency:* data stays in the chosen geography unless you write to Storage in another region (knowledge store, enrichment cache, debug sessions). Do not put sensitive text in object names.

---

## 6. Agentic retrieval

Multi-query pipeline for complex questions:

1. App calls a **knowledge base** with a retrieve action plus conversation history.
2. **Query planning:** at `low` or `medium` reasoning effort an LLM splits the question into focused subqueries; at `minimal` this is skipped. Default effort is `low`.
3. **Execution:** subqueries run **in parallel** against knowledge sources (keyword, vector or hybrid); each is **semantically reranked**.
4. **Synthesis:** merged content is always returned; references and an activity log are optional.

**Components:** knowledge base (orchestrator), knowledge source (indexed or remote), search index with semantic configuration, semantic ranker, Azure OpenAI model.

**Versions:** REST `2026-04-01` is GA for generally available source types with minimal, extractive retrieval; `2026-08-01-preview` adds LLM query planning, answer synthesis, non-minimal effort and multi-turn messages.

**Billing:** Azure AI Search bills **retrieval tokens** (free monthly allowance, then pay-as-you-go); Azure OpenAI bills tokens for planning and answer synthesis. Classic search is billed per query. Lower cost by fewer knowledge sources and lower reasoning effort.

*Decision:* single-question lookup → classic hybrid search; multi-part or context-dependent questions → agentic retrieval (accept extra latency).

---

## Sources
- [Indexer overview](https://learn.microsoft.com/en-us/azure/search/search-indexer-overview)
- [AI enrichment overview](https://learn.microsoft.com/en-us/azure/search/cognitive-search-concept-intro)
- [Integrated vectorization](https://learn.microsoft.com/en-us/azure/search/vector-search-integrated-vectorization)
- [Built-in protections](https://learn.microsoft.com/en-us/azure/search/search-security-built-in)
- [Agentic retrieval](https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-overview)
