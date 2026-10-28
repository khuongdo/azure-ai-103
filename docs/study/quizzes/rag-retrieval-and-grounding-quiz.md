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

**Q:** Search with k=3 misses specific answers. First fix?
**A:** Raise top-k; add hybrid search if exact names matter.

**Q:** On Your Data: how to answer only when evidence is strong?
**A:** Raise strictness (higher precision, lower recall). Note: On Your Data retired Oct 14, 2026; the idea is a relevance-score threshold.

## Practice questions

### 1. A support bot gives confident answers that include facts missing from the retrieved documents. Evaluation shows high Relevance scores. You need to measure how often answers contain unsupported content. Which evaluator should you use?

- A. Coherence
- B. Relevance
- C. Groundedness
- D. Response Completeness

<details><summary>Answer</summary>

**Correct: C.** The RAG evaluators answer different questions:
| Evaluator | Measures | Low score means |
|---|---|---|
| Retrieval | Is the retrieved context relevant to the query? | Search found the wrong chunks |
| **Groundedness** | Is every claim in the answer **supported by the context** (precision)? | **Answer contains invented content** |
| Relevance | Does the answer address the question? | Off-topic answer |
| Response Completeness | Does the answer include the expected information (recall)? | Missing content |
| Coherence | Is the text logically fluent? | Disorganized text |

A response can be relevant yet hold invented facts, which is exactly the case described.

```python
from azure.ai.evaluation import GroundednessEvaluator

groundedness = GroundednessEvaluator(model_config=judge_config)
print(groundedness(query=q, context=retrieved_chunks, response=answer))   # 1-5, with a reason
```

**Why the others are wrong:**
- **A. Coherence:** flow only.
- **B. Relevance:** passes if the answer addresses the question, even with invented facts.
- **D. Response Completeness:** about missing information, not extra content.

Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/rag-evaluators

</details>

### 2. Users search an internal catalog with exact product codes such as `SKU-48213-B` and also with natural-language descriptions. Pure vector search often returns the wrong item for code queries. You need the most relevant results for both query styles. What should you implement?

- A. Vector search with a larger `k`
- B. Hybrid search (full-text plus vector) with the semantic ranker
- C. Full-text search only, with an `orderby` on the code field
- D. Semantic ranker on a vector-only query

<details><summary>Answer</summary>

**Correct: B.** Two failure modes are being fixed:
- **Exact codes** like `SKU-48213-B`: embeddings represent meaning, so near-identical codes look the same; **keyword (BM25)** matches exact tokens.
- **Natural-language descriptions:** keyword search misses synonyms; **vectors** match meaning.

**Hybrid search** runs both queries in parallel and merges the two ranked lists with **Reciprocal Rank Fusion (RRF)**. The **semantic ranker** then re-ranks the top results with a language-understanding model.

```python
from azure.search.documents.models import VectorizableTextQuery

results = search_client.search(
    search_text="SKU-48213-B red waterproof jacket",             # keyword leg
    vector_queries=[VectorizableTextQuery(text="red waterproof jacket", k_nearest_neighbors=50, fields="contentVector")],
    query_type="semantic", semantic_configuration_name="default",   # re-rank
    top=5,
)
```

**Why the others are wrong:**
- **A. Larger `k`:** returns more vector neighbors but does not fix exact-code weakness.
- **C. Full-text only with `orderby`:** loses synonyms and overrides relevance order.
- **D. Semantic ranker on vector-only:** reranks existing results; adds no exact matching.

Source: https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview

</details>

### 3. A hybrid query returns two lists. Document X is rank 1 in the keyword list and absent from the vector list. Document Y is rank 3 in the keyword list and rank 2 in the vector list. Using RRF with k = 60 (score = 1/(rank + k) summed across lists), which statement is correct?

- A. Y ranks above X because it appears in both lists
- B. X ranks above Y because it has the best single rank
- C. X and Y tie
- D. Neither appears because RRF drops documents found by only one method

<details><summary>Answer</summary>

**Correct: A.** RRF gives each document `1 / (rank + k)` for every list it appears in, then adds the scores (k = 60).
- **X:** only keyword rank 1 → 1/(1+60) = 1/61 = **0.0164**.
- **Y:** keyword rank 3 → 1/63 = 0.0159, vector rank 2 → 1/62 = 0.0161 → sum = **0.0320**.

Y has about twice X's score, so Y ranks first. Lesson: RRF rewards **agreement between methods**; one top rank is not enough against two good ranks.

```python
def rrf(ranks: list[int], k: int = 60) -> float:
    return sum(1 / (r + k) for r in ranks)

rrf([1])      # X = 0.0164
rrf([3, 2])   # Y = 0.0320
```

**Why the others are wrong:**
- **B. Best single rank wins:** the numbers show otherwise.
- **C. Tie:** the scores differ.
- **D. RRF drops single-list documents:** they stay, with a lower score.

Source: https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking (the calculation is illustrative)

</details>

### 4. A hybrid query returns many results, and the best passage is at position 80 of the initial ranking. After enabling the semantic ranker the passage is still not promoted. What is the most likely reason?

- A. The semantic ranker only works on pure vector queries
- B. Semantic ranking requires an empty search string
- C. The reranker score must be above 4 to promote a document
- D. The semantic ranker reranks only the top 50 initial results

<details><summary>Answer</summary>

**Correct: D.** The semantic ranker is a **second stage**: it takes only the **top 50** results of the first stage (BM25, vector or hybrid) and re-ranks them. A passage at position 80 never enters the window, so it cannot be promoted. Fix the first stage: set vector `k` and the text result size so that the right passage lands in the top 50, improve chunking, add hybrid search, fix field weights or filters.

```
Stage 1: BM25 + vector + RRF  → ranked list of many results
Stage 2: semantic ranker      → re-ranks only the TOP 50 → returns top N with captions/answers
```

**Why the others are wrong:**
- **A. Only pure vector queries:** it re-ranks text, hybrid and the text part of vector queries.
- **B. Needs an empty search string:** not true.
- **C. Score above 4:** reranker scores range 0 to 4, but they do not gate promotion this way.

Source: https://learn.microsoft.com/en-us/azure/search/semantic-search-overview

</details>

### 5. You are chunking long documents for embeddings and have no workload data yet. Which starting configuration does Microsoft recommend?

- A. 128 tokens with no overlap
- B. 512 tokens with 25% overlap
- C. 2,048 tokens with 75% overlap
- D. One chunk per document

<details><summary>Answer</summary>

**Correct: B.** Microsoft's starting point is **512 tokens per chunk with 25% overlap (128 tokens)**. Too small loses context; too large blurs the embedding and may exceed limits; **overlap** keeps sentences that fall on a boundary in both chunks. Then tune with your own questions: compare Retrieval scores for different sizes.

```json
{
  "@odata.type": "#Microsoft.Skills.Text.SplitSkill",
  "textSplitMode": "pages",
  "unit": "azureOpenAITokens",
  "maximumPageLength": 512,
  "pageOverlapLength": 128,
  "context": "/document",
  "inputs":  [{ "name": "text", "source": "/document/content" }],
  "outputs": [{ "name": "textItems", "targetName": "pages" }]
}
```

(For the Text Split skill the overlap must be less than half the maximum length.)

**Why the others are wrong:**
- **A. 128 tokens, no overlap:** small chunks lose context, no overlap cuts answers in half.
- **C. 2,048 tokens with 75% overlap:** overlap above half is not allowed and wastes embeddings.
- **D. One chunk per document:** may exceed the model limit and mixes topics.

Source: https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-chunk-documents

</details>

### 6. An extraction pipeline must always return JSON that matches a defined schema, and one field is optional. Which approach should you use?

- A. Ask for JSON in the system prompt and add few-shot examples
- B. Enable JSON mode
- C. Use Structured Outputs with `strict: true`, list every field as required, and allow `null` for the optional field
- D. Use Structured Outputs and omit the optional field from `required`

<details><summary>Answer</summary>

**Correct: C.** Three levels of JSON control:
| Method | Guarantee |
|---|---|
| Prompt + few-shot | Better consistency, no guarantee |
| JSON mode | Output is **valid JSON**, any shape |
| **Structured Outputs** (`strict: true`) | Output **matches your schema** |

In strict mode every property must be in `required`; an optional field is expressed as a **union with `null`**, and `additionalProperties` is `false`.

```python
schema = {
  "name": "invoice",
  "strict": True,
  "schema": {
    "type": "object",
    "properties": {
      "vendor": {"type": "string"},
      "po_number": {"type": ["string", "null"]},      # optional field
    },
    "required": ["vendor", "po_number"],              # all fields required
    "additionalProperties": False,
  },
}
r = client.chat.completions.create(model="gpt-4.1", messages=msgs,
                                   response_format={"type": "json_schema", "json_schema": schema})
```

**Why the others are wrong:**
- **A. Prompt and few-shot:** no guarantee.
- **B. JSON mode:** valid JSON, but fields can be missing or renamed.
- **D. Omit the optional field from `required`:** not allowed in strict mode.

Source: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs

</details>

### 7. RAG evaluation shows a high Retrieval score, a low Groundedness score and a good Response Completeness score. What should you change first?

- A. The generation step: stricter prompt (answer only from the context), lower temperature or a stronger model
- B. The chunk size
- C. The OCR settings
- D. The `top_k` value to retrieve more documents

<details><summary>Answer</summary>

**Correct: A.** Read the three scores together:
- **Retrieval high** → the right context reached the model.
- **Completeness good** → the answer includes the expected information.
- **Groundedness low** → but it also contains claims **not in the context**.

So the problem is **generation**. Tighten the prompt ("answer only from CONTEXT; otherwise say you don't know"), lower temperature, or use a stronger model; then re-run the same evaluation set to confirm.

**Why the others are wrong:**
- **B. Chunk size / C. OCR settings:** they affect retrieval, already high.
- **D. Higher `top_k`:** helps recall, not unsupported claims.

Source: deep dive section 6 (evaluator patterns), based on https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/rag-evaluators

</details>

### 8. Scanned PDFs are indexed, but searches return nothing from them. Which change addresses the cause?

- A. Increase the chunk overlap to 50%
- B. Switch to the semantic ranker
- C. Add vector queries to the request
- D. Extract text with OCR in the indexing pipeline before chunking

<details><summary>Answer</summary>

**Correct: D.** A scanned PDF is a picture of text. The indexer extracts no text, so there is nothing to chunk, embed or search. Add **OCR** to the indexing pipeline: configure the indexer to generate normalized images (`imageAction: generateNormalizedImages`) and add the **OCR skill**, then **merge** the OCR text with the document text before chunking, and map the output to a field.

```json
{
  "@odata.type": "#Microsoft.Skills.Vision.OcrSkill",
  "context": "/document/normalized_images/*",
  "inputs":  [{ "name": "image", "source": "/document/normalized_images/*" }],
  "outputs": [{ "name": "text",  "targetName": "ocrText" }]
}
```

Check: run the indexer and confirm that `ocrText` is non-empty for a scanned page.

**Why the others are wrong:**
- **A. More overlap:** cannot create text that was never extracted.
- **B. Semantic ranker:** cannot rank content that is not in the index.
- **C. Vector queries:** vectors need text to embed.

Source: https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search

</details>

### 9. You want to use Structured Outputs for an agent built in Foundry Agent Service so its answers always match a schema. What do you need to know?

- A. It works only with the Assistants API
- B. Structured Outputs are not supported with Foundry Agent Service, so validate outputs and tool arguments yourself
- C. It works only if `parallel_tool_calls` is `true`
- D. It is supported but only for Preview models

<details><summary>Answer</summary>

**Correct: B.** Learn states that **Structured Outputs are not supported with Foundry Agent Service** (and bring-your-own-data scenarios). So you cannot rely on the platform to enforce the schema for agent answers. Instead: ask for the format in instructions, **validate** the output (for example with Pydantic) and tool arguments in your code, and retry or fall back on failure. Use Structured Outputs where they are supported (direct model calls).

```python
from pydantic import BaseModel, ValidationError

class Answer(BaseModel):
    vendor: str
    po_number: str | None

try:
    answer = Answer.model_validate_json(agent_output_text)
except ValidationError:
    answer = retry_with_error_feedback(agent_output_text)
```

**Why the others are wrong:**
- **A. Assistants API only:** Assistants are also listed as unsupported.
- **C. Needs `parallel_tool_calls` true:** it requires `false` where it applies.
- **D. Only Preview models:** the limit is about the scenario, not model status.

Source: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs

</details>

### 10. You change the embedding model used for queries to a newer one, but leave the index vectors generated by the old model. Search quality drops sharply. Why?

- A. Newer models always require HNSW instead of exhaustive KNN
- B. Vector fields cannot be queried after a model upgrade
- C. Query vectors and index vectors must come from the same embedding model
- D. The semantic ranker is disabled automatically

<details><summary>Answer</summary>

**Correct: C.** A vector similarity score is only meaningful when both vectors come from the **same embedding model** (same space and dimensions). If you switch the query model, you compare "new-language" vectors with "old-language" vectors: the vectors are still queryable but the ranking is nearly random. Options: keep the old model for queries, or **re-embed every document** with the new model (re-index) and update the vectorizer and the field dimensions if they differ.

```
documents: embed(text, model=A) → stored vectors (space A)
queries:   embed(question, model=B) → compared to space A   ✗ mismatch
fix:       re-embed documents with model B, or query with model A
```

**Why the others are wrong:**
- **A. Needs HNSW:** the algorithm is unrelated.
- **B. Cannot be queried:** they can, with meaningless results.
- **D. Semantic ranker disabled:** nothing does that.

Source: deep dive section 2 (vector search rules), based on https://learn.microsoft.com/en-us/azure/search/vector-search-overview

</details>

### 11. A grounded assistant should only answer when a strong match exists. Which setting?

- A. Raise temperature
- B. Raise strictness
- C. Lower top-k to 1
- D. Disable citations

<details><summary>Answer</summary>

**Correct: B.** In Azure OpenAI **On Your Data**, *strictness* sets how aggressively search results are filtered by relevance score. Higher strictness gives higher precision and lower recall: weak documents are dropped, and when nothing strong remains the model says it cannot determine the answer. On Your Data is retired (Oct 14, 2026), so the same idea in your own RAG is a **relevance-score threshold**: if the best reranker or similarity score is below it, do not call the model with weak context.

```python
hits = [h for h in results if h["@search.reranker_score"] >= 2.0]      # threshold: tune on your data
if not hits:
    return "I couldn't find a reliable answer in the documents."
```

(Exact strictness scale `[NEEDS VERIFICATION]`.)

**Why the others are wrong:**
- **A. Raise temperature:** more randomness.
- **C. Lower top-k to 1:** fewer documents, but still no relevance filter.
- **D. Disable citations:** removes traceability.

Source: https://learn.microsoft.com/azure/ai-services/openai/references/on-your-data

</details>
