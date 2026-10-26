---
domain: Mixed practice test (topics grouped by exam domain)
skill: Review of a fourth third-party practice test (Udemy, score 22/25), mapped to the skills-measured sections
sources:
  - https://learn.microsoft.com/en-us/azure/search/cognitive-search-custom-skill-web-api
  - https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-create-index
  - https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/video-generation
  - https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/data-platform-metrics
  - https://learn.microsoft.com/en-us/azure/azure-video-indexer/video-indexer-overview
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live
  - https://learn.microsoft.com/en-us/azure/foundry/concepts/built-in-evaluators
  - https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/agent-to-agent
  - https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview
  - https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-service-endpoints-overview
retrieved: 2026-10-26
---

# Practice test 4: review and answer notes

Notes from the "AI-103 Azure AI Apps and Agents Developer Practice Tests" set (Udemy). Score on the site: **22/25**. Question text is not reproduced. Practice test 3 has no review page yet.

**The answers are not official.** Labels: *Verified on Learn* (page read on 2026-10-26), *Own reasoning* (not yet checked, treat as **[NEEDS VERIFICATION]**), *Per quiz explanation* (the practice site's explanation, not Learn).

## The five missed questions

| Q | Topic | Answer | Confidence | Lesson |
|---|---|---|---|---|
| 3 | Evaluator for copyrighted content (lyrics, recipes, published text) | **Protected Materials** evaluator (risk and safety group; text covers lyrics, articles, recipes) | Verified on Learn ([built-in evaluators](https://learn.microsoft.com/en-us/azure/foundry/concepts/built-in-evaluators)) | [Responsible AI governance](../deep-dives/responsible-ai-governance.md) |
| 7 | Network isolation | **Private endpoint** (private IP, can disable public access), not service endpoint (public IP, subnet filter) | Verified on Learn ([private endpoint](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview), [service endpoints](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-service-endpoints-overview)) | [Platform and network](../deep-dives/platform-network-and-reliability.md) |
| 9 | Reference image in video generation | `input_reference` file in **multipart/form-data**; image size must match video `size` | Verified on Learn | [Image and video generation](../deep-dives/image-and-video-generation.md) |
| 10 | Orchestrator calling specialists | **Agent-as-tool**: the orchestrator calls the other agent as a tool and writes the final answer. In the new Foundry Agent Service this is the **A2A tool** (`a2a`, GA) or a workflow; the classic Connected Agents tool is gone. Pick the option that matches the product the question names | Verified on Learn ([A2A tool](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/agent-to-agent)); the exact wording of the quiz option is unknown | [Building agents](../deep-dives/building-agents-with-foundry.md) |
| 22 | Skillset for scanned PDFs and MP3 | OCR skill plus a **custom Web API skill** that calls Azure Speech, all inside the indexer | Per quiz explanation; Web API skill verified on Learn | [Search configuration](../deep-dives/azure-ai-search-configuration.md) |

Answers for 3, 7 and 10 were researched on Microsoft Learn on 2026-10-26, not copied from the site. If the site's key differs, the key wins for that exam wording; tell me and I will adjust.

## Topics seen, by exam domain

### Plan and manage an Azure AI solution

- **TPM ceiling:** shrink the prompt first (system prompt, context, history), then quota or PTU. [Capacity](../deep-dives/capacity-cost-and-throttling.md)
- **Metrics without queries:** Azure Monitor Metrics on the Azure OpenAI resource, filter 429, split by `ModelDeploymentName`; kept **93 days** (Verified on Learn); use a diagnostic setting for longer. [Observability](../deep-dives/observability-and-agent-lifecycle.md)
- **Defect rate:** share of outputs at or above the severity threshold, not an average. [Governance](../deep-dives/responsible-ai-governance.md)
- **Network:** private versus service endpoint (Q7).

### Implement generative AI and agent solutions

- **On Your Data:** raise `strictness` to answer only on strong matches. Note that Learn says On Your Data **retired on 2026-10-14**; the concept (relevance threshold) is still the answer pattern. [RAG](../deep-dives/rag-retrieval-and-grounding.md)
- **Responses API function calling:** model returns `function_call`; app runs it and sends `function_call_output` with the same `call_id` and `previous_response_id`. [Agents](../deep-dives/building-agents-with-foundry.md)
- **Output constraints** (for example 150 words, prose): role, explicit constraints, few-shot examples, code check after generation. [Prompt engineering](../deep-dives/prompt-engineering-parameters-and-reflection.md)
- **Prompt Shields and images:** injection in an image can bypass a text shield; OCR then scan, separate data, JSON schema output, no execution rights. [Agent safety](../deep-dives/agent-safety-and-identity.md)
- **Voice bot:** Direct Line Speech channel with a Speech resource, telephony bridge for calls. Learn's Direct Line Speech URL now redirects to **Voice Live**, so it is legacy. [Speech](../deep-dives/speech-solutions.md)

### Implement computer vision solutions

- **Video generation:** `input_reference` (Q9).
- **Video Indexer:** Azure OpenAI IDs do not work; download, upload to Video Indexer, wait for indexing, then use its ID. [Multimodal understanding](../deep-dives/multimodal-understanding.md)

### Implement text analysis solutions

- **PII:** use redaction (`[SSN]`) rather than flagging or storing the `entities` array. [Text analysis](../deep-dives/text-analysis-language-and-llms.md)

### Implement information extraction solutions

- **Vector field:** `vectorSearch` profile, `vectorSearchProfile` on the field, `dimensions` (ada-002 = 1536). Query and index vectors from the same model; integrated vectorization avoids drift. (Verified on Learn)
- **Low retrieval quality for specific questions:** raise top-k (k=3 is low) before changing anything else.
- **Skillset:** OCR with `generateNormalizedImages`; no built-in audio skill; Web API skill `uri`, `inputs`, `outputs` with `targetName`; timeout 30 s default, 230 s max; batchSize 1000. (Verified on Learn)

## Why the misses happened

1. Mixing up a feature with a thing that does the job (Translation skill with audio, Prompt Shields with image text).
2. Missing the stated constraint ("exclusively within the pipeline").
3. Not knowing one exact parameter name (`input_reference`).

Exam technique drawn from this test: [Lessons from practice test 4](../exam-tips/reading-exam-questions.md#lessons-from-practice-test-4).

## Open items

1. Compare Q3, Q7, Q10 with the site's key if you can see it.
2. Direct Line Speech retirement date and the `strictness` 1 to 5 scale are not on Learn.
3. The Video Indexer ID rule is from the quiz explanation, not Learn.
