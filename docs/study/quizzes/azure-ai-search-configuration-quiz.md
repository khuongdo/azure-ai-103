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

**Correct: D.** A skillset writes its results into an in-memory **enrichment tree** (for example `/document/normalized_images/*/text`). Nothing from that tree reaches the index unless an **output field mapping** in the indexer copies a tree node to an index field. The skill runs fine, which is why the pipeline "works" but the field stays empty.

```json
"outputFieldMappings": [
  { "sourceFieldName": "/document/normalized_images/*/text", "targetFieldName": "ocr_text" }
]
```

Debug order: run the indexer, open the **debug session** or check the execution status for skill warnings, confirm the node path exists, then confirm the target field exists in the index and is `searchable`.

**Why the others are wrong:**
- **A. Suggester:** powers autocomplete, not data flow.
- **B. Larger tier / C. Replica:** capacity settings, unrelated to a missing mapping.

Source: https://learn.microsoft.com/en-us/azure/search/search-indexer-overview

</details>

### 2. Vector queries return poor results after you changed the embedding model for the indexing skill only. What is wrong?

- A. TLS version
- B. The vectorizer still uses the old model
- C. Semantic ranker is off
- D. The index is too small

<details><summary>Answer</summary>

**Correct: B.** Vectors are only comparable if the **query** and the **documents** were embedded by the **same model** (and same dimensions). If you changed the model in the indexing skill but the vectorizer (used at query time) still points to the old one, the query vector lives in a different space than the stored vectors, so similarity scores are meaningless and results look random. Fix: use the same deployment in the skill and the vectorizer, then **re-index** all documents.

```json
"vectorizers": [{ "name": "my-vectorizer", "kind": "azureOpenAI",
  "azureOpenAIParameters": { "resourceUri": "https://<aoai>.openai.azure.com",
    "deploymentId": "text-embedding-3-large", "modelName": "text-embedding-3-large" } }]
```

**Why the others are wrong:**
- **A. TLS version:** would break the connection, not the quality.
- **C. Semantic ranker off:** affects re-ranking, but would not make vector matches wrong.
- **D. Small index:** size does not corrupt similarity.

Source: https://learn.microsoft.com/en-us/azure/search/vector-search-integrated-vectorization

</details>

### 3. You need updates visible within seconds. Which approach?

- A. Push documents through the API
- B. Indexer on a 5 minute schedule
- C. Reset the indexer daily
- D. Enable semantic ranker

<details><summary>Answer</summary>

**Correct: A.** An indexer is a **pull** mechanism with a minimum schedule interval of **5 minutes**, so it can never give "within seconds". **Pushing** documents through the API (REST or SDK) writes straight into the index, and they are searchable almost immediately.

```python
from azure.search.documents import SearchClient

client = SearchClient(endpoint, index_name, credential)
client.upload_documents(documents=[{"id": "42", "title": "New price list"}])  # or merge_or_upload_documents
```

**Why the others are wrong:**
- **B. Indexer every 5 minutes:** that is the fastest schedule, still minutes.
- **C. Reset indexer daily:** reprocesses everything, much slower.
- **D. Semantic ranker:** improves ranking, has no effect on freshness.

Source: https://learn.microsoft.com/en-us/azure/search/search-indexer-overview

</details>

### 4. A user asks a multi-part question that depends on earlier chat. Which feature helps?

- A. Synonym maps only
- B. Scoring profile
- C. Lower temperature
- D. Agentic retrieval

<details><summary>Answer</summary>

**Correct: D.** **Agentic retrieval** uses an LLM to plan the query: it reads the chat history, resolves references ("it", "that plan"), splits a multi-part question into focused **subqueries**, runs them **in parallel**, merges and semantically ranks the results, and returns grounding data plus a response with citations. A classic single query cannot do this because it sees only the last message.

Example: chat so far is about "Plan A". User asks "Compare it with Plan B and tell me the cancellation fee." The planner produces subqueries such as "Plan A features", "Plan B features", "Plan B cancellation fee" and runs them together.

**Why the others are wrong:**
- **A. Synonym maps:** expand terms ("car" = "auto") but do not use history.
- **B. Scoring profile:** boosts fields or freshness; it does not plan subqueries.
- **C. Lower temperature:** a model parameter; nothing to do with query decomposition.

Source: https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-overview

</details>

### 5. Users still find documents in Azure AI Search after their source blobs were deleted. The indexer runs hourly. What should you configure?

- A. A faster indexer schedule
- B. A deletion detection policy based on a custom metadata property, then flag blobs before deleting them
- C. A high water mark policy on the data source
- D. Enrichment caching

<details><summary>Answer</summary>

**Correct: B.** Indexers detect new and changed documents but **do not detect deletions** by default. A deleted blob simply stops appearing, and its search document stays. For blobs, configure a **soft delete** detection policy: add a metadata property such as `IsDeleted`, set it to `true` on the blob **first**, let the indexer run (it removes the search document), and only then delete the blob.

```json
"dataDeletionDetectionPolicy": {
  "@odata.type": "#Microsoft.Azure.Search.SoftDeleteColumnDeletionDetectionPolicy",
  "softDeleteColumnName": "IsDeleted",
  "softDeleteMarkerValue": "true"
}
```

**Why the others are wrong:**
- **A. Faster schedule:** the indexer still never sees a missing blob.
- **C. High water mark:** a *change* detection policy for databases (for example a rowversion column), not deletions.
- **D. Enrichment caching:** saves skill cost on re-runs, nothing more.

Source: https://learn.microsoft.com/en-us/azure/search/search-how-to-index-azure-blob-changed-deleted

</details>

### 6. An index has a `Collection(Edm.Single)` field but vector queries fail. Embeddings come from text-embedding-ada-002. What is most likely missing?

- A. Switch to Edm.Double
- B. A vectorSearch profile assigned with vectorSearchProfile and dimensions set to 1536
- C. A scoring profile
- D. A larger replica count

<details><summary>Answer</summary>

**Correct: B.** A vector field needs more than its type. You must set `dimensions` to the **exact output size of the embedding model** (text-embedding-ada-002 produces **1536**), and assign a `vectorSearchProfile`, which points to an **algorithm** (HNSW or exhaustive KNN) and optionally a vectorizer. With a wrong dimension count, indexing or querying fails.

```json
{ "name": "contentVector", "type": "Collection(Edm.Single)",
  "searchable": true, "dimensions": 1536, "vectorSearchProfile": "my-profile" }
```

**Why the others are wrong:**
- **A. Edm.Double:** `Collection(Edm.Single)` is the correct type for vectors.
- **C. Scoring profile:** tunes keyword relevance, not vectors.
- **D. More replicas:** add query capacity, they do not define a vector field.

Source: https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-create-index

</details>

### 7. An indexer must process scanned PDFs and MP3 calls entirely inside the pipeline, with no external pre-processing. Which design fits?

- A. OCR skill for PDFs and a Translation skill for MP3
- B. OCR skill (generateNormalizedImages) for PDFs and a custom Web API skill that calls Azure Speech for MP3
- C. Transcribe MP3 offline and upload text
- D. Key phrase skill on the MP3 files

<details><summary>Answer</summary>

**Correct: B.** For scanned PDFs, the built-in **OCR** skill works on images; set `imageAction: generateNormalizedImages` in the indexer configuration so page images exist in the tree. There is **no built-in audio-to-text skill**, so use a **custom Web API skill** that calls Azure Speech (for example a function that submits the audio and returns the transcript). Both stay inside the indexer, so reruns and incremental updates keep working.

**Why the others are wrong:**
- **A. Translation for MP3:** the Translation skill takes text, not audio.
- **C. Offline transcription:** leaves the pipeline, which the requirement forbids.
- **D. Key phrase skill on MP3:** it also takes text input.

Source: https://learn.microsoft.com/en-us/azure/search/cognitive-search-custom-skill-web-api

</details>

### 8. In a Web API skill, which property makes the returned transcript appear in the enrichment tree?

- A. uri
- B. httpMethod
- C. outputs with a targetName
- D. batchSize

<details><summary>Answer</summary>

**Correct: C.** In a Web API skill, `inputs` define what is sent to your endpoint and **`outputs`** define the values you return in the `data` object. Each output has a `name` (the key in your response) and a `targetName` (the node created in the enrichment tree). An output field mapping then copies that node to an index field.

```json
{
  "@odata.type": "#Microsoft.Skills.Custom.WebApiSkill",
  "uri": "https://<func>.azurewebsites.net/api/transcribe",
  "httpMethod": "POST",
  "batchSize": 1,
  "context": "/document",
  "inputs":  [{ "name": "audioUrl", "source": "/document/metadata_storage_path" }],
  "outputs": [{ "name": "transcript", "targetName": "transcript" }]
}
```

**Why the others are wrong:**
- **A. uri:** the endpoint to call.
- **B. httpMethod:** the verb (POST).
- **D. batchSize:** how many records go in one request.

Source: https://learn.microsoft.com/en-us/azure/search/cognitive-search-custom-skill-web-api

</details>
