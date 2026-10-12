---
domain: Information extraction; Generative AI and agents
skill: Build retrieval and grounding pipelines; evaluate generative apps (fabrications, relevance, quality)
sources:
  - https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search
  - https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview
  - https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking
  - https://learn.microsoft.com/en-us/azure/search/semantic-search-overview
  - https://learn.microsoft.com/en-us/azure/search/vector-search-overview
  - https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-chunk-documents
  - https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/rag-evaluators
  - https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/overview
  - https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs
retrieved: 2026-10-12
---

# Deep dive: retrieval, grounding and structured output

This page explains **how** the pieces work, so you can reason about new exam scenarios instead of memorizing answers. Examples are illustrative calculations unless a source is cited. Items marked `[NEEDS VERIFICATION]` are not confirmed on Microsoft Learn.

Part of the [best practices overview](best-practices-and-real-world-scenarios.md).

---

## 1. The RAG pipeline as a chain of failure points

A RAG answer is only as good as the weakest step in this chain:

```
documents → extract text → chunk → embed → index
                                              ↓
 user question → (embed) → retrieve → rerank → build prompt → LLM → answer
```

When a bot gives a wrong answer, find **which link broke**. Each link has its own tool and its own metric:

| Link | What can go wrong | Fix | How to measure |
|---|---|---|---|
| Extract text | Scanned PDF has no text; tables flattened | OCR, layout analysis, Content Understanding (Markdown) | Spot-check extracted text |
| Chunk | Chunks too large (blurry meaning) or too small (no context) | Tune size and overlap | Retrieval evaluators |
| Embed | Different model for index and query; text over the token limit | Same embedding model and dimensions at both ends | Retrieval quality drops after a model change |
| Retrieve | Misses exact codes, or misses meaning | Hybrid search | Document Retrieval metrics (needs ground truth) |
| Rerank | Right document is found but ranked 30th | Semantic ranker | Compare rank before and after |
| Generate | Model adds facts not in the context | Prompt rules, lower temperature, groundedness checks | Groundedness evaluator |

**Exam habit:** read the symptom, name the broken link, then pick the tool for that link.

---

## 2. Vector search, keyword search and why hybrid wins

### Keyword (full-text) search
The engine tokenizes text into an inverted index and scores matches with **BM25**. It is excellent at **exact matches**: a product code `SKU-48213-B`, a person's name, a date, a rare technical term. It cannot see that "canine" and "dog" mean the same thing.

### Vector search
Text (or an image) is converted into a list of numbers called an **embedding**. Content with similar meaning ends up with similar numbers. A query is embedded the same way and the engine returns the **k nearest neighbors**. It finds "dog" when you search "canine", works across languages ("dog" and "hund") and across content types (text and image). It is weak on exact tokens: `SKU-48213-B` and `SKU-48231-B` look almost identical to an embedding model.

Two rules from how vectors work:

- **Index and query must use the same embedding model** (same dimensions). Changing the model means re-embedding everything.
- Embedding models have an input limit (for example 8,191 tokens for `text-embedding-3-small`), which is one reason to chunk.

Vector search uses nearest-neighbor algorithms: **HNSW** (approximate, fast, the usual choice) and **exhaustive KNN** (exact, scans all vectors, slower). `[NEEDS VERIFICATION]` when to prefer exhaustive; the sample query in Learn sets `exhaustive: true` on one field and `false` on another.

### Hybrid search
One request that contains both a `search` text query and `vectorQueries`. The two run **in parallel** and the engine merges them.

**How the merge works: Reciprocal Rank Fusion (RRF).** BM25 scores and vector similarity scores are on different scales, so you cannot add them. RRF ignores the raw scores and uses only the **rank position** in each list:

```
score(document) = sum over each result list of  1 / (rank + k)      with k = 60
```

Worked example (illustrative, using the documented formula):

| Document | Rank in keyword list | Rank in vector list | Calculation | RRF score |
|---|---|---|---|---|
| A | 1 | 5 | 1/61 + 1/65 | 0.03178 |
| B | 2 | 1 | 1/62 + 1/61 | 0.03252 |
| C | 3 | not found | 1/63 | 0.01587 |

B wins even though A was first in the keyword list, because B is high in **both** lists. A document that appears near the top of several lists is rewarded. A document found by only one method scores about half as much.

Things worth knowing from the docs:

- The `k` in RRF (60) is **not** the same as the `k` nearest neighbors in a vector query.
- A full-text query plus one vector query is two executions; one text query plus two vector queries over five fields is 11 executions. All of them are fused.
- You can **weight** vector queries (multiplier above 1.0 raises importance, below 1.0 lowers it; default 1.0).
- Hybrid scores are small numbers and are only meaningful for ordering, not as an absolute relevance value.
- Never add `orderby`: an explicit sort overrides relevance ranking.
- Filters and facets work in hybrid queries. With semantic ranker you probably want post-filtering; test both.

**Rule of thumb for the exam:** product codes, names, dates, jargon → keyword matters. Paraphrased natural language, multilingual, images → vectors matter. Both present → hybrid.

---

## 3. Semantic ranker: what it does and what it cannot do

The semantic ranker is a second-stage reranker based on language models from Microsoft/Bing research. It sits **after** BM25 or RRF.

How it works, step by step:

1. Take the initial result list, but **only the top 50** move on.
2. For each document, build a summary string of up to **2,048 tokens** from the fields in the *semantic configuration*: `title` (max 128 tokens), `keywords` (max 128 tokens) and `content` (the remaining tokens).
3. Score each document from **0 to 4** (`@search.rerankerScore`): 4 = highly relevant and answers completely; 3 = relevant but incomplete; 2 = partially; 1 = small part; 0 = irrelevant.
4. Optionally return **captions** (verbatim highlighted passages) and **answers**. They are always text copied from your index; no generative model writes them.

Consequences you can reason about:

- **It only reorders what retrieval already found.** If the right document is not in the first 50, semantic ranker cannot rescue it. That is why the hybrid guidance says set vector `k` to 50.
- **Field order matters** in the semantic configuration, because long text is trimmed. Put the most informative fields first.
- It works best on **prose** (documentation, knowledge bases), not on short codes or numeric data.
- It is a **billed feature**: charged when `queryType=semantic` and the search string is not empty. Free plan has a monthly allowance. An empty search (`search=*`) is not charged.
- The reranker score distribution can shift slightly with infrastructure or model updates, so do not set very fine-grained thresholds on it.
- *Query rewrite* (Preview) can expand one query into up to 10 variants.

---

## 4. Chunking: how to choose size and overlap

Why chunk: (1) stay under model token limits, (2) avoid a single vector that blurs many topics, (3) return a focused passage to the LLM.

The documented starting point: **512 tokens with 25% overlap (128 tokens)**. The Text Split skill defaults suggested for character-based chunking are `pages` mode, `maximumPageLength` = 2000 characters and `pageOverlapLength` = 500.

Worked example: a 10,000-token document, chunk 512, overlap 128.

```
stride = 512 - 128 = 384 tokens
chunks ≈ ceil((10,000 - 512) / 384) + 1 = ceil(24.7) + 1 = 26
```

Overlap costs storage and embedding calls (about 30% more chunks here than with no overlap, which would give about 20), but it prevents an answer from being cut in half at a boundary.

Decision guide (from Learn's factors):

| Situation | Choice |
|---|---|
| Need intact passages or sentences | Larger chunks, sentence-aware splitting |
| Questions target specific facts | Larger chunks with overlap to keep context |
| Highly structured data | Less overlap |
| Conversational or narrative text | More overlap |
| Documents with headings (HTML, Markdown) | Chunk by section |
| Need meaning-preserving chunks across pages | Semantic chunking with Content Understanding Markdown |

The Text Split skill has two modes: `pages` (multiple sentences up to a maximum) and `sentences` (one sentence per chunk; thousands of tiny chunks). The overlap must be less than half the maximum length. Measure real token counts before choosing, because an overlap that is too large relative to short pages can end up as no overlap at all.

Agentic retrieval can build the indexer, skillset and index for you from a **knowledge source** (for example Blob Storage or OneLake).

---

## 5. Getting good text in: OCR, layout and Content Understanding

- **Text-only PDFs** can be read directly. **Scanned PDFs and images** need OCR first, otherwise there is nothing to chunk. In an Azure AI Search pipeline, OCR is a skill in the skillset. `[NEEDS VERIFICATION]` exact OCR skill name and `detectOrientation` option.
- **Layout matters.** Flattening a table into a run of text destroys the relationship between a row and its header. Layout analysis and Content Understanding keep tables, sections and hierarchy, and describe figures so charts become searchable.
- **Which service?**

| Need | Pick | Why |
|---|---|---|
| Clean text with structure for RAG or an LLM | Content Understanding, **Markdown** output | Keeps headings and tables; good LLM input |
| Typed fields for automation (invoice total, dates) | Content Understanding **fields** (JSON) or Document Intelligence prebuilt model | Schema-based output, confidence scores |
| Deterministic extraction from known form types | Document Intelligence (Read, Layout, prebuilt, custom) | Stable, structured documents |
| Mixed media (documents, images, audio, video) | Content Understanding | Multimodal |

- Content Understanding field methods: **Extract** (value as written, documents only), **Classify** (choose a category, can route to another analyzer), **Generate** (free generation such as a summary). Turn on `estimateFieldSourceAndConfidence` to get **confidence** (0 to 1) and **grounding** (where in the source the value came from), which lets you auto-approve high-confidence fields and send low-confidence ones to a human.
- Pull vs push indexing: pull uses an **indexer** with a supported source; push is the only option for real-time sync or unsupported sources.

---

## 6. Diagnosing a RAG system with evaluators

Foundry evaluators split into **process** (retrieval step) and **system** (final answer). Scores are 1 to 5 with a default pass threshold of 3 for the LLM-judge evaluators.

| Evaluator | Question it answers | Inputs | Notes |
|---|---|---|---|
| **Retrieval** | Are the retrieved chunks relevant to the query? | query, context | No ground truth needed |
| **Document Retrieval** | How well does ranking match human labels? | ground-truth labels, retrieved docs | Metrics: Fidelity, NDCG, XDCG, Max Relevance, Holes. Use for parameter sweeps |
| **Groundedness** | Does the answer stay inside the context (precision)? | response, context (query optional but helps) | The fabrication detector |
| **Groundedness Pro** (Preview) | Strict consistency with context | query, response, context | Uses Azure AI Content Safety; True/False |
| **Relevance** | Does the answer address the question? | query, response | Can pass even if fabricated |
| **Response Completeness** (Preview) | Did the answer miss expected facts (recall)? | ground truth, response | Needs ground truth |

**Precision vs recall:** groundedness is precision (nothing extra), completeness is recall (nothing missing).

Read the score pattern like a doctor reads symptoms:

| Pattern | Likely cause | Fix |
|---|---|---|
| Retrieval low | Search is returning poor chunks | Chunking, hybrid, semantic ranker, better OCR |
| Retrieval high, Groundedness low | Good context, but model invents | Stricter prompt ("answer only from context, say you don't know"), lower temperature, stronger model |
| Groundedness high, Completeness low | Answer is faithful but partial | Raise `top_k`, improve recall, larger chunks |
| Relevance low | Model answers a different question | Prompt, query rewriting |

**Parameter sweep:** generate retrieval results for several settings (vector vs semantic, `top_k`, chunk size), score each with Document Retrieval, keep the best.

Evaluator data format: a JSONL row with `query`, `context` (a plain string; join several chunks with `\n\n`) and `response`. Groundedness works best when you give all three fields. For agents, the evaluator can read context from tool call results.

---

## 7. Getting reliable structured output

### Why prompts alone are fragile
Asking for JSON in the prompt can still yield extra prose, a missing field or a wrong type. **JSON mode** guarantees *valid JSON* but not *your schema*. **Structured Outputs** make the model follow a JSON Schema you provide.

### Few-shot vs Structured Outputs: different jobs

| Technique | What it improves | What it does not do |
|---|---|---|
| Few-shot examples | Consistent format, vocabulary and style (for example a controlled medical terminology) | Guarantee schema validity; guarantee factual or clinical correctness |
| Structured Outputs (`strict: true`) | Output always matches the schema | Make the content true; work with every feature |

Use both when you need controlled vocabulary **and** a guaranteed shape.

### Rules of the strict schema subset
- **All fields must be `required`.** To make a field optional, allow `null` in its type (`["string", "null"]`).
- **`additionalProperties: false`** on every object.
- Limits: up to **100 properties** and **5 levels** of nesting. Root cannot be `anyOf`.
- Unsupported keywords: `minLength`, `maxLength`, `pattern`, `format`, `minimum`, `maximum`, `multipleOf`, `minItems`, `maxItems`, `uniqueItems` and others. Validate these in your code.
- Output follows the **order of the schema**.
- Supported: string, number, boolean, integer, object, array, enum, `anyOf`, `$defs` and recursion.

### Using it
- Chat Completions: `response_format`. Responses API: `text.format`.
- In Python, pass a Pydantic model; the SDK builds the schema and returns a parsed object.
- Authenticate with Microsoft Entra ID (`DefaultAzureCredential` with a bearer token provider) rather than a key.
- **Always check for refusals** before reading the parsed value.
- Function calling: set `strict: true`, and set `parallel_tool_calls` to `false` because structured outputs do not support parallel calls.
- Not supported with **Foundry Agent Service** or bring-your-own-data scenarios, so validate arguments yourself there.

```python
from pydantic import BaseModel
from openai import OpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

token_provider = get_bearer_token_provider(
    DefaultAzureCredential(), "https://ai.azure.com/.default"
)
client = OpenAI(
    base_url="https://YOUR-RESOURCE-NAME.openai.azure.com/openai/v1/",
    api_key=token_provider,
)

class AdverseEvent(BaseModel):
    term: str
    severity: str
    onset_date: str | None  # optional field emulated with null

response = client.responses.parse(
    model="MODEL_DEPLOYMENT_NAME",
    input="Extract the adverse event: patient reported mild nausea since Monday.",
    text_format=AdverseEvent,
)
print(response.output_parsed)
```

Adapted from the Learn Responses API sample (Pydantic with `text_format`). `AdverseEvent` is an invented example.

---

## 8. Exam traps for this topic

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

## Sources

See the frontmatter. Worked examples (RRF scores, chunk count) are calculations from documented formulas and recommendations, not figures taken from Learn.
