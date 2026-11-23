---
domain: Implement information extraction solutions (question bank)
skill: All mock exam questions of one exam domain, gathered in one interactive set
sources:
  - https://aka.ms/AI103-StudyGuide
  - https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-apps-and-agents-developer-associate/
retrieved: 2026-11-23
---

# Question bank: Implement information extraction solutions

60 scenario questions for this domain (10-15% of the exam), collected from mock exams 1 to 10. They are shuffled, so topics are mixed. Use **Practice mode** to learn (check each answer, read the concept block), or **Exam mode** to measure yourself on one domain.

<iframe src="../question-bank-d5-view.html" title="Question bank: Implement information extraction solutions" style="width:100%;height:85vh;border:1px solid var(--md-default-fg-color--lightest);border-radius:6px"></iframe>

[Open full screen](question-bank-d5-view.html){ target=_blank }

## Where to study the topics behind these questions

- [Azure ai search configuration](../deep-dives/azure-ai-search-configuration.md)
- [Capacity cost and throttling](../deep-dives/capacity-cost-and-throttling.md)
- [Content understanding and document intelligence](../deep-dives/content-understanding-and-document-intelligence.md)
- [Platform network and reliability](../deep-dives/platform-network-and-reliability.md)
- [Rag retrieval and grounding](../deep-dives/rag-retrieval-and-grounding.md)

## Flashcards (37)

Short recall cards from the topic quizzes of this domain. Read the question, answer in your head, then open the card.

### Configuring azure ai search

From the [quiz](../quizzes/azure-ai-search-configuration-quiz.md).

??? question "Four objects in indexer-based ingestion?"
    Data source, index, skillset (optional), indexer.

??? question "How often can an indexer run on a schedule?"
    As little as every five minutes.

??? question "Are output field mappings required?"
    Yes, for any enriched content you want in the index.

??? question "Which stage extracts text and images from files?"
    Document cracking.

??? question "Rule for vectorizer and embedding skill?"
    They must use the same embedding model.

??? question "What are index projections?"
    Chunks written to a secondary index while the parent index holds the whole document.

??? question "Agentic retrieval default reasoning effort?"
    low (minimal skips LLM query planning).

??? question "What identity should indexers use to reach data sources?"
    Managed identity.

??? question "Does a blob indexer detect deleted blobs automatically?"
    No. Change detection is automatic, but deletion needs a soft delete policy (native blob soft delete or a custom metadata property).

??? question "When must the deletion policy be configured?"
    Before the first indexer run; earlier deletions stay in the index.

??? question "Which change detection policy is for databases, not Blob Storage?"
    High water mark.

??? question "Which skill turns MP3 audio into text inside an indexer?"
    No built-in skill does. Use a custom Web API skill that calls Azure Speech (for example through an Azure Function).

??? question "In a Web API skill, what do `uri`, `inputs` and `outputs` (with `targetName`) do?"
    `uri` is the HTTPS endpoint; `inputs` are the enrichment-tree values sent; `outputs` are returned values placed in the tree at `targetName`.

??? question "Web API skill defaults: timeout, max timeout, batchSize?"
    Timeout 30 s (max 230 s); batchSize 1000; degreeOfParallelism 5 (max 10).

??? question "Which three settings make a vector field complete?"
    `vectorSearch` profile/algorithm in the index, `vectorSearchProfile` on the field, and `dimensions` equal to the model (ada-002 = 1536).

??? question "Which `imageAction` makes the OCR skill read scanned PDF pages?"
    `generateNormalizedImages`.

### Content understanding and document intelligence

From the [quiz](../quizzes/content-understanding-and-document-intelligence-quiz.md).

??? question "What is an analyzer?"
    A reusable configuration defining content type, extraction, output shape and models.

??? question "Field methods?"
    extract, classify, generate.

??? question "Which base analyzers exist?"
    prebuilt-document, prebuilt-audio, prebuilt-video, prebuilt-image.

??? question "What goes in models: names or deployment names?"
    Model names from the catalog; the service maps to your deployments.

??? question "How do you split a multi-document file?"
    enableSegment true with contentCategories.

??? question "Why include an 'other' category?"
    Otherwise every page is forced into a listed category.

??? question "Max classifier categories?"
    200.

??? question "When use confidence and grounding?"
    Route low-confidence fields to human review.

??? question "Which content types can pro mode (multi-step reasoning) handle?"
    Documents only (per the study material; the current Learn pages describe agentic mode for documents instead) `[NEEDS VERIFICATION]`.

??? question "One analyzer must return transcript-based fields and on-screen text from videos. What do you use?"
    A video analyzer with a field schema (standard processing), not separate pipelines.

### Invoice and contract automation

From the [quiz](../quizzes/document-processing-automation-quiz.md).

??? question "What does `prebuilt-procurement` do?"
    A **composed analyzer** that classifies a procurement document and routes it to the right analyzer (invoice, purchase order, receipt, credit memo, utility bill).

??? question "Which analyzers need no language or embedding model?"
    Content-extraction analyzers: `prebuilt-read`, `prebuilt-layout`, `prebuilt-digitalParse`.

??? question "When do you use `prebuilt-digitalParse`?"
    For machine-readable files; for scans use `prebuilt-read` or `prebuilt-layout`.

??? question "What are the three field methods?"
    **Extract**, **Classify**, **Generate**.

??? question "Which setting returns confidence and grounding?"
    `estimateFieldSourceAndConfidence` (confidence 0 to 1; source regions).

??? question "Which API version is GA for production?"
    `2025-11-01`; `2026-06-01-preview` is preview.

??? question "Why copy a prebuilt analyzer before production use?"
    Prebuilt definitions **can change across API versions**; your copy is stable.

??? question "What can happen when a guardrail detects something during analysis?"
    The call can **succeed with warnings** and some fields missing.

??? question "What does the `usage` object let you do?"
    Attribute cost per document (`documentPagesStandard`, `contextualizationTokens`, per-model tokens, and so on).

??? question "What should you protect against when posting to the ERP?"
    Duplicates: use an **idempotency key** (vendor + invoice number + amount).

??? question "Which metric matters most for automation risk?"
    The **error rate among auto-approved** documents.

Back to the [question bank overview](question-bank.md).
