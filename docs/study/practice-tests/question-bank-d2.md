---
domain: Implement generative AI and agentic solutions (question bank)
skill: All mock exam questions of one exam domain, gathered in one interactive set
sources:
  - https://aka.ms/AI103-StudyGuide
  - https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-apps-and-agents-developer-associate/
retrieved: 2026-11-23
---

# Question bank: Implement generative AI and agentic solutions

160 scenario questions for this domain (30-35% of the exam), collected from mock exams 1 to 10. They are shuffled, so topics are mixed. Use **Practice mode** to learn (check each answer, read the concept block), or **Exam mode** to measure yourself on one domain.

<iframe src="../question-bank-d2-view.html" title="Question bank: Implement generative AI and agentic solutions" style="width:100%;height:85vh;border:1px solid var(--md-default-fg-color--lightest);border-radius:6px"></iframe>

[Open full screen](question-bank-d2-view.html){ target=_blank }

## Where to study the topics behind these questions

- [Agent safety and identity](../deep-dives/agent-safety-and-identity.md)
- [Azure ai search configuration](../deep-dives/azure-ai-search-configuration.md)
- [Building agents with foundry](../deep-dives/building-agents-with-foundry.md)
- [Capacity cost and throttling](../deep-dives/capacity-cost-and-throttling.md)
- [Cicd for foundry projects](../deep-dives/cicd-for-foundry-projects.md)
- [Foundry sdk and generative apps](../deep-dives/foundry-sdk-and-generative-apps.md)
- [Model and service selection](../deep-dives/model-and-service-selection.md)
- [Observability and agent lifecycle](../deep-dives/observability-and-agent-lifecycle.md)
- [Prompt engineering parameters and reflection](../deep-dives/prompt-engineering-parameters-and-reflection.md)
- [Rag retrieval and grounding](../deep-dives/rag-retrieval-and-grounding.md)
- [Responsible ai governance](../deep-dives/responsible-ai-governance.md)
- [Speech solutions](../deep-dives/speech-solutions.md)

## Flashcards (90)

Short recall cards from the topic quizzes of this domain. Read the question, answer in your head, then open the card.

### Foundry sdk and generative apps

From the [quiz](../quizzes/foundry-sdk-and-generative-apps-quiz.md).

??? question "What does the Foundry SDK connect to?"
    A single project endpoint.

??? question "Which SDK versions target the new Foundry?"
    azure-ai-projects 2.x.

??? question "Which client for connections and tracing?"
    The project client.

??? question "Which client for Responses and evaluations?"
    The OpenAI-compatible client.

??? question "Preferred credential?"
    DefaultAzureCredential (Entra ID).

??? question "Which roles access the project?"
    Foundry User or Project Manager.

??? question "OpenAI endpoint format?"
    https://<resource>.openai.azure.com/openai/v1

??? question "Do Speech/Language use the project endpoint?"
    No; they use tool-specific endpoints.

### Prompt engineering, parameters and reflection

From the [quiz](../quizzes/prompt-engineering-parameters-and-reflection-quiz.md).

??? question "Temperature and top_p guidance?"
    Change one, not both.

??? question "Why repeat instructions at the end?"
    Recency bias.

??? question "What is an 'out'?"
    Permission to answer 'unknown' when evidence is missing.

??? question "Few-shot means?"
    Providing examples in the prompt.

??? question "Best temperature for classification?"
    Low.

??? question "Reflection pattern?"
    Draft, critique, revise, stop after fixed rounds.

??? question "Hybrid LLM and rules?"
    Rules for exact steps, LLM for language.

??? question "Are chain-of-thought tricks recommended for reasoning models?"
    No.

### Retrieval, grounding and structured output

From the [quiz](../quizzes/rag-retrieval-and-grounding-quiz.md).

??? question "What two things does Reciprocal Rank Fusion (RRF) use to merge keyword and vector results?"
    Only the **rank position** in each list (score = sum of 1 / (rank + k), k = 60), not the raw scores.

??? question "How many results does the semantic ranker rerank?"
    Only the **top 50** of the initial result list.

??? question "What is the score range of `@search.rerankerScore`?"
    0 to 4 (4 = highly relevant and answers completely).

??? question "Which search type is best for product codes, names and dates?"
    Keyword (full-text, BM25) matching; combine with vectors as **hybrid search**.

??? question "What chunking starting point does Learn recommend?"
    **512 tokens** with **25% overlap** (128 tokens).

??? question "Groundedness measures which aspect, precision or recall?"
    **Precision**: the answer contains nothing outside the grounding context.

??? question "Response Completeness measures which aspect?"
    **Recall**: the answer does not miss expected information from the ground truth.

??? question "What is the default pass threshold for LLM-judged RAG evaluators (1 to 5 scale)?"
    **3**.

??? question "What is the difference between JSON mode and Structured Outputs?"
    JSON mode guarantees valid JSON; **Structured Outputs** guarantee adherence to your JSON Schema.

??? question "How do you make a field optional in a strict structured-output schema?"
    Keep it in `required` and allow `null` in its type (for example `["string", "null"]`).

??? question "Which parameter must be set to `false` when using strict function calling with structured outputs?"
    `parallel_tool_calls`.

??? question "Which service output format keeps headings and tables for RAG?"
    **Markdown** from Content Understanding.

??? question "Must the index and the query use the same embedding model?"
    Yes. Changing the model means re-embedding the content.

??? question "Search with k=3 misses specific answers. First fix?"
    Raise top-k; add hybrid search if exact names matter.

??? question "On Your Data: how to answer only when evidence is strong?"
    Raise strictness (higher precision, lower recall). Note: On Your Data retired Oct 14, 2026; the idea is a relevance-score threshold.

### Building agents with foundry

From the [quiz](../quizzes/building-agents-with-foundry-quiz.md).

??? question "Three runtime components?"
    Agent, conversation, response.

??? question "Who runs a function tool?"
    Your app, not the model.

??? question "What item returns the function result?"
    function_call_output with call_id.

??? question "Run expiry for function calls?"
    10 minutes.

??? question "Can the portal add function definitions?"
    No.

??? question "Two memory types in the newest overview?"
    User profile memory and chat summary memory.

??? question "Memory store recommendation?"
    One dedicated store per agent.

??? question "Memory limits in preview?"
    100 scopes per store, 10,000 memories per scope.

??? question "Who executes a function tool, and who executes file search?"
    Your app runs function tools (return `function_call_output` with the same `call_id`); the agent service runs hosted tools such as file search.

??? question "What does the orchestrator keep in the agent-as-tool pattern?"
    Control of the conversation; the remote or specialist agent returns a response and the orchestrator writes the final answer.

??? question "Is the Connected Agents tool available in the new Foundry Agent Service?"
    No. Use the A2A tool (`a2a`, GA) or workflows; hosted agents can expose an agent as a function tool.

### Agent safety and identity

From the [quiz](../quizzes/agent-safety-and-identity-quiz.md).

??? question "What is a guardrail in Foundry?"
    A named collection of **controls**. Each control = risk + intervention point + action.

??? question "Name the four intervention points."
    User input, tool call (Preview), tool response (Preview), output.

??? question "Which intervention point defends against indirect prompt injection from tool results?"
    **Tool response**.

??? question "What happens to a guardrail on a model when an agent has its own guardrail?"
    The agent's guardrail **fully overrides** the model's.

??? question "Which guardrail is the default for models?"
    `Microsoft.DefaultV2`.

??? question "How much latency does each intervention point add, roughly?"
    About **50 to 100 ms**.

??? question "What are the two attack families in Prompt Shields?"
    **User prompt attacks** (the user attacks) and **document attacks** (a third party hides instructions in content).

??? question "How does Spotlighting protect against document attacks?"
    It marks documents as lower trust by **base64-encoding** them. Preview, models via Chat Completions only, not agents.

??? question "Which tool is used for adaptive attack simulation before release?"
    The **AI red teaming agent** (PyRIT-based).

??? question "Which identity do unpublished agents in a project use for tool calls?"
    The **shared project identity**.

??? question "What changes when you publish an agent?"
    It gets a **distinct agent identity**; roles from the shared project identity do not transfer.

??? question "What is the recommended credential type for an agent identity blueprint?"
    A **federated credential** with a managed identity (no stored secret).

??? question "Which role lets a service principal only call agent endpoints?"
    **Foundry Agent Consumer**.

??? question "What does &quot;audience&quot; mean in agent token exchange?"
    The resource identifier of the downstream service the token is for (for example `https://storage.azure.com`).

??? question "Can Prompt Shields miss injection text inside an image?"
    Yes, it may. OCR first, scan the extracted text, separate untrusted data, constrain output, grant no execution rights.

### Enterprise knowledge assistant

From the [quiz](../quizzes/enterprise-knowledge-assistant-quiz.md).

??? question "What does a Foundry IQ knowledge base contain?"
    One or more **knowledge sources** plus parameters that control retrieval (including reasoning effort). Agents query it with **agentic retrieval**.

??? question "Where are user permissions enforced?"
    At **query time**, using synchronized ACLs, Purview sensitivity labels and the **caller's Entra identity**.

??? question "What is the workaround when a source has no ACL support?"
    A **security filter**: store a security group ID per document and filter on it.

??? question "Which knowledge source types are GA with Search REST API `2026-04-01`?"
    `searchIndex`, `azureBlob`, `indexedOneLake` and `web`.

??? question "Which Foundry IQ capabilities are still preview in that version?"
    Other source types, **answer synthesis**, **non-minimal reasoning effort** (low and medium) and multi-turn messages.

??? question "Indexed vs remote knowledge source?"
    Indexed = copied and searchable with full retrieval features; remote = queried live (freshness, or when you cannot copy data).

??? question "When is the agent's built-in file search enough?"
    A small, static document set owned by one team.

??? question "When is classic search enough?"
    No agent or chatbot is needed; one index; predictable low latency and lower cost.

??? question "Why does the tool response need a guardrail here?"
    Retrieved documents are third-party content that may contain hidden instructions (indirect attack).

??? question "How big should the golden set be?"
    Roughly 100 to 300 real questions with expected sources, including no-answer and permission-sensitive cases (a design suggestion, not a Microsoft rule).

??? question "What does a high Retrieval score with a low Groundedness score point to?"
    The **generation step** (prompt, temperature, model), not retrieval.

### Customer support agent

From the [quiz](../quizzes/customer-support-agent-quiz.md).

??? question "When do you choose a hosted agent over a prompt agent?"
    Custom orchestration, custom protocols, or logic that must run in your own code.

??? question "Where is customer authorization enforced?"
    **In the tool**, using the authenticated customer ID from your app, never from the model.

??? question "How do you require approval for an MCP tool?"
    `require_approval="always"`; handle `mcp_approval_request` and reply with `mcp_approval_response`.

??? question "How do you limit which MCP tools are exposed?"
    `allowed_tools`.

??? question "How should tool descriptions and results from remote MCP servers be treated?"
    As **untrusted input** (possible indirect prompt injection).

??? question "Which authentication gives access limited to what the signed-in user may reach?"
    On-behalf-of (OBO).

??? question "What changes when you publish an agent?"
    A distinct agent identity is created; roles must be reassigned.

??? question "Why keep the tool count small?"
    Every tool costs tokens, the agent may call any of them, and more tools increase wrong selection.

??? question "Which evaluator catches the agent ignoring a correct tool result?"
    **Tool Output Utilization**.

??? question "Which evaluator catches broken instructions or policy?"
    **Task Adherence**.

??? question "Why make tools idempotent?"
    Retries must not create a second return or refund.

### Multi-agent workflow automation

From the [quiz](../quizzes/multi-agent-workflow-automation-quiz.md).

??? question "Microsoft's rule of thumb for agents vs code?"
    If you can write a function to handle the task, do that instead of using an AI agent.

??? question "Use an agent when...?"
    The task is open-ended or conversational, needs autonomous tool use and planning, or one LLM call (with tools) suffices.

??? question "Use a workflow when...?"
    The process has well-defined steps, you need control over execution order, or multiple agents or functions must coordinate.

??? question "What happens to Foundry visual workflows?"
    Preview; **retiring December 1, 2026**; migrate to Microsoft Agent Framework (or Logic Apps).

??? question "Name the five Agent Framework orchestrations."
    Sequential, Concurrent, Handoff, Group chat, Magentic.

??? question "When are checkpoints created?"
    At the end of each **superstep**; they capture executor state, pending messages, requests and responses, and shared state.

??? question "Which checkpoint storage suits production?"
    `CosmosCheckpointStorage` with managed identity.

??? question "What is a toolbox?"
    A curated set of tools exposed through one managed, MCP-compatible endpoint with central auth, governance and versioning.

??? question "What does tool search (Preview) do?"
    Hides tools behind `tool_search` and `call_tool` so hundreds of tools do not bloat context.

??? question "Which protocol lets one agent call another?"
    **A2A** (v1.0 GA, v0.3 Preview).

??? question "Why idempotency keys?"
    Retries must not create duplicate accounts or actions.

Back to the [question bank overview](question-bank.md).
