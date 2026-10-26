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

**Q:** Which skill turns MP3 audio into text inside an indexer?
**A:** No built-in skill does. Use a custom Web API skill that calls Azure Speech (for example through an Azure Function).

**Q:** In a Web API skill, what do `uri`, `inputs` and `outputs` (with `targetName`) do?
**A:** `uri` is the HTTPS endpoint; `inputs` are the enrichment-tree values sent; `outputs` are returned values placed in the tree at `targetName`.

**Q:** Web API skill defaults: timeout, max timeout, batchSize?
**A:** Timeout 30 s (max 230 s); batchSize 1000; degreeOfParallelism 5 (max 10).

**Q:** Which three settings make a vector field complete?
**A:** `vectorSearch` profile/algorithm in the index, `vectorSearchProfile` on the field, and `dimensions` equal to the model (ada-002 = 1536).

**Q:** Which `imageAction` makes the OCR skill read scanned PDF pages?
**A:** `generateNormalizedImages`.

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

### 6. An index has a `Collection(Edm.Single)` field but vector queries fail. Embeddings come from text-embedding-ada-002. What is most likely missing?

- A. Switch to Edm.Double
- B. A vectorSearch profile assigned with vectorSearchProfile and dimensions set to 1536
- C. A scoring profile
- D. A larger replica count

<details><summary>Answer</summary>

**Correct: B.** A vector field needs a profile (algorithm) and the exact model dimensions; the type alone is not enough.
**Incorrect:** A — Single is the right type; C and D do not define vectors.
Source: https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-create-index

</details>

### 7. An indexer must process scanned PDFs and MP3 calls entirely inside the pipeline, with no external pre-processing. Which design fits?

- A. OCR skill for PDFs and a Translation skill for MP3
- B. OCR skill (generateNormalizedImages) for PDFs and a custom Web API skill that calls Azure Speech for MP3
- C. Transcribe MP3 offline and upload text
- D. Key phrase skill on the MP3 files

<details><summary>Answer</summary>

**Correct: B.** There is no built-in audio-to-text skill; a Web API skill keeps the work in the indexer.
**Incorrect:** A — Translation takes text; C — leaves the pipeline; D — Key phrase skill takes text.
Source: https://learn.microsoft.com/en-us/azure/search/cognitive-search-custom-skill-web-api

</details>

### 8. In a Web API skill, which property makes the returned transcript appear in the enrichment tree?

- A. uri
- B. httpMethod
- C. outputs with a targetName
- D. batchSize

<details><summary>Answer</summary>

**Correct: C.** Outputs name the values returned in `data` and place them in the tree; an output field mapping then sends them to the index.
**Incorrect:** A — endpoint; B — verb; D — batch size.
Source: https://learn.microsoft.com/en-us/azure/search/cognitive-search-custom-skill-web-api

</details>
