---
note: docs/study/deep-dives/rag-retrieval-and-grounding.md
skill: Build retrieval and grounding pipelines; evaluate generative apps (fabrications, relevance, quality)
retrieved: 2026-10-12
---

# Quiz: retrieval, grounding and structured output

Answers and explanations come from the [deep dive](../deep-dives/rag-retrieval-and-grounding.md), which cites Microsoft Learn. Try each question before opening the answer.

## Flashcards

**Q:** What two things does Reciprocal Rank Fusion (RRF) use to merge keyword and vector results?
**A:** Only the **rank position** in each list (score = sum of 1 / (rank + k), k = 60), not the raw scores.

**Q:** How many results does the semantic ranker rerank?
**A:** Only the **top 50** of the initial result list.

**Q:** What is the score range of `@search.rerankerScore`?
**A:** 0 to 4 (4 = highly relevant and answers completely).

**Q:** Which search type is best for product codes, names and dates?
**A:** Keyword (full-text, BM25) matching; combine with vectors as **hybrid search**.

**Q:** What chunking starting point does Learn recommend?
**A:** **512 tokens** with **25% overlap** (128 tokens).

**Q:** Groundedness measures which aspect, precision or recall?
**A:** **Precision**: the answer contains nothing outside the grounding context.

**Q:** Response Completeness measures which aspect?
**A:** **Recall**: the answer does not miss expected information from the ground truth.

**Q:** What is the default pass threshold for LLM-judged RAG evaluators (1 to 5 scale)?
**A:** **3**.

**Q:** What is the difference between JSON mode and Structured Outputs?
**A:** JSON mode guarantees valid JSON; **Structured Outputs** guarantee adherence to your JSON Schema.

**Q:** How do you make a field optional in a strict structured-output schema?
**A:** Keep it in `required` and allow `null` in its type (for example `["string", "null"]`).

**Q:** Which parameter must be set to `false` when using strict function calling with structured outputs?
**A:** `parallel_tool_calls`.

**Q:** Which service output format keeps headings and tables for RAG?
**A:** **Markdown** from Content Understanding.

**Q:** Must the index and the query use the same embedding model?
**A:** Yes. Changing the model means re-embedding the content.

## Practice questions

### 1. A support bot gives confident answers that include facts missing from the retrieved documents. Evaluation shows high Relevance scores. You need to measure how often answers contain unsupported content. Which evaluator should you use?

- A. Coherence
- B. Relevance
- C. Groundedness
- D. Response Completeness

<details><summary>Answer</summary>

**Correct: C.** Groundedness checks that the response stays inside the provided context (precision), so invented facts score low.
**Incorrect:** A — Coherence only measures logical flow; B — Relevance can still pass when the answer addresses the question but contains invented facts; D — Response Completeness measures missing expected information (recall), not extra content.
Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/rag-evaluators

</details>

### 2. Users search an internal catalog with exact product codes such as `SKU-48213-B` and also with natural-language descriptions. Pure vector search often returns the wrong item for code queries. You need the most relevant results for both query styles. What should you implement?

- A. Vector search with a larger `k`
- B. Hybrid search (full-text plus vector) with the semantic ranker
- C. Full-text search only, with an `orderby` on the code field
- D. Semantic ranker on a vector-only query

<details><summary>Answer</summary>

**Correct: B.** Hybrid search runs keyword and vector queries in parallel and merges them with RRF. Keyword matching handles exact codes; vectors handle meaning. The semantic ranker improves the final order.
**Incorrect:** A — a larger `k` does not fix the weakness of embeddings on near-identical codes; C — full-text alone loses natural-language matching, and an explicit `orderby` overrides relevance ranking; D — the semantic ranker only reranks existing results and does not add exact-match ability.
Source: https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview

</details>

### 3. A hybrid query returns two lists. Document X is rank 1 in the keyword list and absent from the vector list. Document Y is rank 3 in the keyword list and rank 2 in the vector list. Using RRF with k = 60 (score = 1/(rank + k) summed across lists), which statement is correct?

- A. Y ranks above X because it appears in both lists
- B. X ranks above Y because it has the best single rank
- C. X and Y tie
- D. Neither appears because RRF drops documents found by only one method

<details><summary>Answer</summary>

**Correct: A.** X scores 1/61 = 0.0164. Y scores 1/63 + 1/62 = 0.0159 + 0.0161 = 0.0320. Documents that appear in several lists are rewarded.
**Incorrect:** B — a single top rank is worth less than two good ranks; C — the scores differ; D — RRF keeps documents found by only one method, they just score lower.
Source: https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking (the calculation is illustrative)

</details>

### 4. A hybrid query returns many results, and the best passage is at position 80 of the initial ranking. After enabling the semantic ranker the passage is still not promoted. What is the most likely reason?

- A. The semantic ranker only works on pure vector queries
- B. Semantic ranking requires an empty search string
- C. The reranker score must be above 4 to promote a document
- D. The semantic ranker reranks only the top 50 initial results

<details><summary>Answer</summary>

**Correct: D.** Only the top 50 results move to semantic ranking. A document outside that window is never considered, so improve first-stage retrieval (for example set vector `k` to 50, tune chunking).
**Incorrect:** A — it reranks text, hybrid and the text portion of vector queries; B — an empty search string is not charged and does not help ranking; C — scores range from 0 to 4, they do not gate promotion this way.
Source: https://learn.microsoft.com/en-us/azure/search/semantic-search-overview

</details>

### 5. You are chunking long documents for embeddings and have no workload data yet. Which starting configuration does Microsoft recommend?

- A. 128 tokens with no overlap
- B. 512 tokens with 25% overlap
- C. 2,048 tokens with 75% overlap
- D. One chunk per document

<details><summary>Answer</summary>

**Correct: B.** Learn recommends starting at 512 tokens with 25% overlap (128 tokens) and tuning from there.
**Incorrect:** A — very small chunks lose context and no overlap risks cutting answers in half; C — the Text Split overlap must be less than half the maximum length and such a large overlap is wasteful; D — whole documents can exceed model limits and blur meaning.
Source: https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-chunk-documents

</details>

### 6. An extraction pipeline must always return JSON that matches a defined schema, and one field is optional. Which approach should you use?

- A. Ask for JSON in the system prompt and add few-shot examples
- B. Enable JSON mode
- C. Use Structured Outputs with `strict: true`, list every field as required, and allow `null` for the optional field
- D. Use Structured Outputs and omit the optional field from `required`

<details><summary>Answer</summary>

**Correct: C.** Structured Outputs enforce the schema. In the strict subset all fields must be required, and optional fields are emulated with a union that includes `null`.
**Incorrect:** A — prompts and few-shot improve consistency but do not guarantee the schema; B — JSON mode only guarantees valid JSON; D — strict mode requires all fields in `required`.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs

</details>

### 7. RAG evaluation shows a high Retrieval score, a low Groundedness score and a good Response Completeness score. What should you change first?

- A. The generation step: stricter prompt (answer only from the context), lower temperature or a stronger model
- B. The chunk size
- C. The OCR settings
- D. The `top_k` value to retrieve more documents

<details><summary>Answer</summary>

**Correct: A.** Good retrieval means the right context reached the model, but the answer contains content outside it, so the problem is in generation.
**Incorrect:** B and C — those affect retrieval quality, which is already high; D — more documents help recall, not unsupported claims.
Source: deep dive section 6 (evaluator patterns), based on https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/rag-evaluators

</details>

### 8. Scanned PDFs are indexed, but searches return nothing from them. Which change addresses the cause?

- A. Increase the chunk overlap to 50%
- B. Switch to the semantic ranker
- C. Add vector queries to the request
- D. Extract text with OCR in the indexing pipeline before chunking

<details><summary>Answer</summary>

**Correct: D.** Scanned pages are images with no text, so nothing can be chunked or embedded until OCR extracts it. In an indexer this is the OCR skill (`#Microsoft.Skills.Vision.OcrSkill`) working on normalized images.
**Incorrect:** A — overlap cannot create missing text; B — reranking cannot rank content that was never indexed; C — vectors need text to embed.
Source: https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search

</details>

### 9. You want to use Structured Outputs for an agent built in Foundry Agent Service so its answers always match a schema. What do you need to know?

- A. It works only with the Assistants API
- B. Structured Outputs are not supported with Foundry Agent Service, so validate outputs and tool arguments yourself
- C. It works only if `parallel_tool_calls` is `true`
- D. It is supported but only for Preview models

<details><summary>Answer</summary>

**Correct: B.** Learn notes that structured outputs are not supported with Foundry Agent Service or bring-your-own-data scenarios.
**Incorrect:** A — Assistants are also listed as unsupported; C — structured outputs require `parallel_tool_calls` to be `false`; D — the limitation is about the scenario, not the model's preview status.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs

</details>

### 10. You change the embedding model used for queries to a newer one, but leave the index vectors generated by the old model. Search quality drops sharply. Why?

- A. Newer models always require HNSW instead of exhaustive KNN
- B. Vector fields cannot be queried after a model upgrade
- C. Query vectors and index vectors must come from the same embedding model
- D. The semantic ranker is disabled automatically

<details><summary>Answer</summary>

**Correct: C.** Similarity only makes sense in one embedding space. Re-embed the content with the new model, or keep using the old one for queries.
**Incorrect:** A — the algorithm choice is unrelated; B — vector fields remain queryable, results are just meaningless; D — nothing disables the semantic ranker.
Source: deep dive section 2 (vector search rules), based on https://learn.microsoft.com/en-us/azure/search/vector-search-overview

</details>
