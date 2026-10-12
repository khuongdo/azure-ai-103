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
