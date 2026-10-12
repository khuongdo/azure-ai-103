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

This page explains **how** the pieces work, so you can reason about new scenarios instead of memorizing answers. Examples are illustrative calculations unless a source is cited. Items marked `[NEEDS VERIFICATION]` are not confirmed on Microsoft Learn.

Part of the [best practices overview](best-practices-and-real-world-scenarios.md).

---

## 1. The RAG pipeline, step by step

**RAG (retrieval-augmented generation)** means: instead of asking a language model to answer from memory, you first **find the relevant passages** in your own content and **hand them to the model** together with the question, so it answers from evidence. The model has a knowledge cutoff and has never seen your private documents; retrieval fixes that.

A RAG system is really **two pipelines** that meet in the middle:

```
OFFLINE: build the knowledge (runs when content changes)
  1 Collect → 2 Extract → 3 Enrich → 4 Chunk → 5 Embed → 6 Index
                                                          │
                                                          ▼  (the index is the shared store)
ONLINE: answer a question (runs on every question)
  7 Understand → 8 Retrieve → 9 Merge and rerank → 10 Select → 11 Prompt → 12 Generate → 13 Check → 14 Log and evaluate
```

A running example used below: a company uploads a 40-page PDF named *Returns Policy 2026*. An employee later asks, *"Can I return a laptop after 45 days?"*

### Offline pipeline: turning documents into something searchable

**Step 1. Collect.** *Goal: get the content into the system and keep it up to date.*
- What happens: an **indexer** *pulls* content from a supported source (Blob Storage, Cosmos DB, SharePoint, OneLake) on a schedule, or your code *pushes* JSON documents into the index. Pull is easiest; push is the only choice when content must be synchronized in real time or no supported source exists.
- Also collected here: **metadata** (title, department, region, effective date) and **access information** (who may read this). You cannot add these later without re-reading the source.
- Example: the PDF arrives from a SharePoint library with metadata `department=Customer Care`, `effective=2026-01-01`, and its access list.
- What goes wrong: stale content (the old 2024 policy is still there), missing permissions, files the indexer cannot read.
- How you check: counts of documents found vs indexed; failed-document list.

**Step 2. Extract text and structure.** *Goal: turn a file into clean, ordered text that keeps meaning.*
- What happens: a digital PDF can be read directly; a **scanned** PDF is an image, so **OCR** must read the letters. **Layout analysis** keeps headings, paragraphs and **tables** (a table flattened into one line loses which number belongs to which column). Content Understanding can output **Markdown** that keeps headings and tables and describes figures.
- Example: the returns table *Product | Return window* becomes a Markdown table, not "Laptops 30 days Phones 14 days" in one string.
- What goes wrong: no text from scans, garbled columns, lost headers.
- How you check: open the extracted text for a few real files and read it yourself. This is the cheapest and most valuable test in the whole pipeline.

**Step 3. Enrich.** *Goal: add useful information the raw text does not have.*
- What happens: skills in the indexer pipeline can detect language, extract key phrases, describe images, or attach the metadata from step 1 to every piece. The goal is to make later filtering and ranking possible.
- Example: each piece of the policy gets `department` and `effective` so a query can prefer the latest version.
- What goes wrong: enrichment you do not need adds cost and noise.

**Step 4. Chunk.** *Goal: cut long text into pieces that are small enough to embed and focused enough to retrieve.*
- Why it is needed: (1) embedding and chat models have **token limits** (for example 8,191 tokens for `text-embedding-3-small`); (2) one vector for a whole 40-page document blurs many topics together; (3) the model should receive a **focused passage**, not a book.
- What happens: split by size with overlap (starting point: **512 tokens, 25% overlap**), by sentences, or by headings and meaning (semantic chunking). Each chunk keeps a pointer to its source document, page and section.
- Example: the 40 pages become about 90 chunks; the "45 days" rule and the "30 days for laptops" rule land in the same chunk because the table was kept intact.
- What goes wrong: too large (blurry, expensive), too small (loses context), cut in the middle of a rule.
- How you check: read some chunks; run retrieval evaluators on test questions.

**Step 5. Embed.** *Goal: convert each chunk into a vector so meaning can be compared with math.*
- What happens: an **embedding model** maps text to a list of numbers. Chunks with similar meaning get similar numbers, so "give money back" and "refund" end up close together. With **integrated vectorization**, the indexer calls the embedding model for you.
- Rule: the **same embedding model and dimensions** must be used for chunks now and for questions later.
- What goes wrong: changing the model without re-embedding; text over the token limit being cut off silently.

**Step 6. Index.** *Goal: store chunks so they can be found quickly.*
- What happens: the search service writes each chunk into two structures: an **inverted index** (keyword lookup, scored with BM25) and a **vector index** (nearest-neighbor lookup, HNSW), together with the metadata and access fields. This is why one index can do keyword, vector and hybrid search.
- What goes wrong: schema changes require reindexing; permission fields forgotten.
- How you check: run a few searches directly in the portal before involving any LLM.

### Online pipeline: answering a question

**Step 7. Understand the question.** *Goal: make sure the search query reflects what the user really wants.*
- What happens: in simple systems the question is used as-is. Better systems rewrite it: fix typos, expand synonyms, or (in **agentic retrieval**) have an LLM **break a complex question into sub-questions** that are searched in parallel. Conversation history can be folded in so "and for phones?" becomes "return window for phones".
- Example: the question needs two facts (laptop rule, how many days since purchase), so it becomes two sub-queries.
- What goes wrong: follow-up questions searched without context; vague questions.

**Step 8. Retrieve.** *Goal: get a candidate set of chunks, typically dozens.*
- What happens: the question is embedded (step 5 model), then the engine runs a **keyword query and a vector query in parallel** (hybrid), applies **filters** (department, region, date) and **security trimming** (only chunks the user may read). Each method returns its own ranked list.
- Example: keyword search finds "laptop" and "45 days" exactly; vector search finds "refund window for computers".
- What goes wrong: keyword-only misses paraphrases; vector-only misses exact codes; filters removing everything.

**Step 9. Merge and rerank.** *Goal: put the best candidates first.*
- What happens: **Reciprocal Rank Fusion** merges the lists using rank positions. The optional **semantic ranker** then rereads the top 50 and scores each 0 to 4 for how well it answers the question. See sections 2 and 3 for how both work.
- What goes wrong: the right chunk was never in the top 50, so reranking cannot help.

**Step 10. Select context.** *Goal: choose what actually goes to the model.*
- What happens: keep the best few chunks that fit a **token budget**. More chunks help recall but cost money, add latency, and can distract the model.
- Example: top 5 chunks, about 2,500 tokens.
- What goes wrong: too few (missing facts) or too many (cost, noise, "lost in the middle" effects).

**Step 11. Build the prompt.** *Goal: tell the model exactly how to use the evidence.*
- What happens: the prompt combines (a) **system instructions** ("answer only from the sources; if the answer is not there, say so; cite sources"), (b) the **retrieved chunks**, each labeled with a source ID, (c) recent **conversation history**, and (d) the **user question**. Keep document text clearly separated from instructions, because retrieved documents are third-party content and can contain hidden instructions.
- What goes wrong: instructions that allow guessing; documents mixed into instructions (injection risk).

**Step 12. Generate.** *Goal: write the answer from the evidence.*
- What happens: the language model produces the answer. Lower **temperature** gives more consistent, less inventive wording. Choose the **smallest model that passes your quality tests**.
- Example answer: "Laptops can be returned within 30 days, so a return after 45 days is not eligible. [Returns Policy 2026, section 3]"
- What goes wrong: invented details (fabrication), ignoring the context, over-long answers.

**Step 13. Check the output.** *Goal: stop bad answers before the user sees them.*
- What happens: **guardrails** scan the output (harmful content, protected material), the app verifies that **citations** point to real chunks, and optionally a **groundedness** check confirms the claims appear in the context.
- What goes wrong: citations that look real but are not; checks added without measuring false blocks.

**Step 14. Log and evaluate.** *Goal: know whether the system works and improve it.*
- What happens: store the question, retrieved chunks, scores, prompt version, answer and a **trace**. Run evaluators (retrieval, groundedness, relevance, completeness) on a test set before each release and on sampled production traffic. User feedback adds new test questions.
- What goes wrong: not logging the retrieved chunks, so you cannot tell whether a bad answer was a retrieval or a generation problem.

### Where each step lives in Azure

| Steps | Typical Azure tools |
|---|---|
| 1 Collect | Azure AI Search indexers and data sources; Foundry IQ knowledge sources (Blob, SharePoint, OneLake) |
| 2 Extract | OCR and layout analysis; Content Understanding (`prebuilt-documentSearch`, Markdown) |
| 3 to 4 Enrich and chunk | AI Search skillsets (Text Split skill, Content Understanding skill) |
| 5 Embed | Azure OpenAI embedding models; integrated vectorization |
| 6 Index | Azure AI Search index (inverted + vector) |
| 7 to 9 Understand, retrieve, rerank | Hybrid queries, RRF, semantic ranker; agentic retrieval and knowledge bases |
| 10 to 12 Select, prompt, generate | Foundry Agent Service or your code with a Foundry model deployment |
| 13 Check | Foundry guardrails, Content Safety, evaluators |
| 14 Log and evaluate | Tracing to Application Insights; Foundry evaluations |

The general-practice parts (token budget, prompt layout, temperature) are standard RAG engineering rather than statements from a single Learn page; test them on your own data.

### Finding which step failed

When a bot gives a wrong answer, find **which step broke**. Each has its own tool and metric:

| Step | What can go wrong | Fix | How to measure |
|---|---|---|---|
| 2 Extract text | Scanned PDF has no text; tables flattened | OCR, layout analysis, Content Understanding (Markdown) | Spot-check extracted text |
| 4 Chunk | Chunks too large (blurry meaning) or too small (no context) | Tune size and overlap | Retrieval evaluators |
| 5 Embed | Different model for index and query; text over the token limit | Same embedding model and dimensions at both ends | Retrieval quality drops after a model change |
| 8 Retrieve | Misses exact codes, or misses meaning | Hybrid search | Document Retrieval metrics (needs ground truth) |
| 9 Rerank | Right document is found but ranked 30th | Semantic ranker | Compare rank before and after |
| 12 Generate | Model adds facts not in the context | Prompt rules, lower temperature, groundedness checks | Groundedness evaluator |


---

## 2. Vector search, keyword search and why hybrid wins

### Keyword (full-text) search
The engine tokenizes text into an inverted index and scores matches with **BM25**. It is excellent at **exact matches**: a product code `SKU-48213-B`, a person's name, a date, a rare technical term. It cannot see that "canine" and "dog" mean the same thing.

### Vector search
Text (or an image) is converted into a list of numbers called an **embedding**. Content with similar meaning ends up with similar numbers. A query is embedded the same way and the engine returns the **k nearest neighbors**. It finds "dog" when you search "canine", works across languages ("dog" and "hund") and across content types (text and image). It is weak on exact tokens: `SKU-48213-B` and `SKU-48231-B` look almost identical to an embedding model.

Two rules from how vectors work:

- **Index and query must use the same embedding model** (same dimensions). Changing the model means re-embedding everything.
- Embedding models have an input limit (for example 8,191 tokens for `text-embedding-3-small`), which is one reason to chunk.

Vector search uses nearest-neighbor algorithms:

| Algorithm | How it works | Use when |
|---|---|---|
| **HNSW** (approximate nearest neighbor) | Builds a hierarchical graph at indexing time; a query walks the graph from coarse to fine levels. All vectors sit in memory, so it uses **vector index size quota** | The usual choice: high recall, low latency, large or volatile data |
| **Exhaustive KNN** | Brute-force scan of all vectors; exact result; uses **no** vector index quota | **Small to medium** datasets, or when precision matters more than speed; also to build a **ground-truth set to measure the recall of HNSW** |

HNSW tuning parameters: `m` (how many neighbors each node links to), `efConstruction` (candidates considered while building; default **400**, range 100 to 1,000) and `efSearch` (size of the candidate queue at query time). A field indexed for HNSW can still be queried exhaustively with `"exhaustive": true`, but a field indexed as `exhaustiveKnn` cannot use HNSW. Similarity metrics: `cosine` (use this for Azure OpenAI embeddings), `dotProduct` (same as cosine for normalized vectors, slightly faster) and `euclidean`. The vector `@search.score` for cosine is `1 / (1 + cosine_distance)`, so it ranges from 0.333 to 1.0 and always decreases as similarity gets worse. Source: [Vector relevance and ranking](https://learn.microsoft.com/en-us/azure/search/vector-search-ranking).

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

- **Text-only PDFs** can be read directly. **Scanned PDFs and images** need OCR first, otherwise there is nothing to chunk. In an Azure AI Search skillset the **OCR skill** (`#Microsoft.Skills.Vision.OcrSkill`) reads printed and handwritten text from `.jpeg`, `.jpg`, `.png`, `.bmp` and `.tiff` files and from images embedded in PDFs or Office files. Set the indexer to `imageAction: generateNormalizedImages` so the skill receives `/document/normalized_images/*`; it outputs `text` and `layoutText` (lines, words and bounding boxes). Optional parameters: `defaultLanguageCode` and `lineEnding`. **`detectOrientation` applies only if the legacy OCR v3.2 path is used** (Greek and Serbian Cyrillic); for other languages the Read API is used. Use a **Merge skill** to put OCR text back into the document text at the right position. The skill is bound to Foundry Tools and needs a billable resource beyond 20 documents per indexer per day. Source: [OCR skill](https://learn.microsoft.com/en-us/azure/search/cognitive-search-skill-ocr).
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


## Sources

See the frontmatter. Worked examples (RRF scores, chunk count) are calculations from documented formulas and recommendations, not figures taken from Learn.
