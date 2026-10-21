---
note: docs/study/deep-dives/azure-ai-search-configuration.md
skill: Configure indexers, skillsets, vectorization, security and agentic retrieval
retrieved: 2026-10-12
---

# Quiz: configuring Azure AI Search

Based on the [deep dive](../deep-dives/azure-ai-search-configuration.md).

## Flashcards

**Q:** Four objects in indexer-based ingestion?
**A:** Data source, index, skillset (optional), indexer.

**Q:** How often can an indexer run on a schedule?
**A:** As little as every five minutes.

**Q:** Are output field mappings required?
**A:** Yes, for any enriched content you want in the index.

**Q:** Which stage extracts text and images from files?
**A:** Document cracking.

**Q:** Rule for vectorizer and embedding skill?
**A:** They must use the same embedding model.

**Q:** What are index projections?
**A:** Chunks written to a secondary index while the parent index holds the whole document.

**Q:** Agentic retrieval default reasoning effort?
**A:** low (minimal skips LLM query planning).

**Q:** What identity should indexers use to reach data sources?
**A:** Managed identity.

**Q:** Does a blob indexer detect deleted blobs automatically?
**A:** No. Change detection is automatic, but deletion needs a soft delete policy (native blob soft delete or a custom metadata property).

**Q:** When must the deletion policy be configured?
**A:** Before the first indexer run; earlier deletions stay in the index.

**Q:** Which change detection policy is for databases, not Blob Storage?
**A:** High water mark.

## Practice questions

### 1. An enrichment pipeline runs but the OCR text never appears in the index. What is missing?

- A. A suggester
- B. A larger tier
- C. A replica
- D. Output field mapping

<details><summary>Answer</summary>

**Correct: D.** Enriched content needs output field mappings to reach index fields.
**Incorrect:** the other options do not fit — unrelated.
Source: https://learn.microsoft.com/en-us/azure/search/search-indexer-overview

</details>

### 2. Vector queries return poor results after you changed the embedding model for the indexing skill only. What is wrong?

- A. TLS version
- B. The vectorizer still uses the old model
- C. Semantic ranker is off
- D. The index is too small

<details><summary>Answer</summary>

**Correct: B.** Vectorizer and skill must use the same model.
**Incorrect:** the other options do not fit — not the cause.
Source: https://learn.microsoft.com/en-us/azure/search/vector-search-integrated-vectorization

</details>

### 3. You need updates visible within seconds. Which approach?

- A. Push documents through the API
- B. Indexer on a 5 minute schedule
- C. Reset the indexer daily
- D. Enable semantic ranker

<details><summary>Answer</summary>

**Correct: A.** Indexers have a 5 minute minimum; push is faster.
**Incorrect:** the other options do not fit — slower or unrelated.
Source: https://learn.microsoft.com/en-us/azure/search/search-indexer-overview

</details>

### 4. A user asks a multi-part question that depends on earlier chat. Which feature helps?

- A. Synonym maps only
- B. Scoring profile
- C. Lower temperature
- D. Agentic retrieval

<details><summary>Answer</summary>

**Correct: D.** It decomposes the query using chat history and runs subqueries in parallel.
**Incorrect:** the other options do not fit — do not plan subqueries.
Source: https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-overview

</details>

### 5. Users still find documents in Azure AI Search after their source blobs were deleted. The indexer runs hourly. What should you configure?

- A. A faster indexer schedule
- B. A deletion detection policy based on a custom metadata property, then flag blobs before deleting them
- C. A high water mark policy on the data source
- D. Enrichment caching

<details><summary>Answer</summary>

**Correct: B.** Indexers do not track deletions; a soft delete policy removes the search document first.
**Incorrect:** A — a faster schedule still never sees deletions; C — high water mark is for databases; D — caching saves enrichment cost only.
Source: https://learn.microsoft.com/en-us/azure/search/search-how-to-index-azure-blob-changed-deleted

</details>
