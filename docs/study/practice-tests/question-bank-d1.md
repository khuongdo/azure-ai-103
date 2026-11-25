---
domain: Plan and manage an Azure AI solution (question bank)
skill: All mock exam questions of one exam domain, gathered in one interactive set
sources:
  - https://aka.ms/AI103-StudyGuide
  - https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-apps-and-agents-developer-associate/
retrieved: 2026-11-25
---

# Question bank: Plan and manage an Azure AI solution

140 scenario questions for this domain (25-30% of the exam), collected from mock exams 1 to 10. They are shuffled, so topics are mixed. Use **Practice mode** to learn (check each answer, read the concept block), or **Exam mode** to measure yourself on one domain.

<iframe src="../question-bank-d1-view.html" title="Question bank: Plan and manage an Azure AI solution" style="width:100%;height:85vh;border:1px solid var(--md-default-fg-color--lightest);border-radius:6px"></iframe>

[Open full screen](question-bank-d1-view.html){ target=_blank }

## Where to study the topics behind these questions

- [Agent safety and identity](../deep-dives/agent-safety-and-identity.md)
- [Azure ai search configuration](../deep-dives/azure-ai-search-configuration.md)
- [Capacity cost and throttling](../deep-dives/capacity-cost-and-throttling.md)
- [Cicd for foundry projects](../deep-dives/cicd-for-foundry-projects.md)
- [Content understanding and document intelligence](../deep-dives/content-understanding-and-document-intelligence.md)
- [Foundry sdk and generative apps](../deep-dives/foundry-sdk-and-generative-apps.md)
- [Model and service selection](../deep-dives/model-and-service-selection.md)
- [Observability and agent lifecycle](../deep-dives/observability-and-agent-lifecycle.md)
- [Platform network and reliability](../deep-dives/platform-network-and-reliability.md)
- [Rag retrieval and grounding](../deep-dives/rag-retrieval-and-grounding.md)
- [Responsible ai governance](../deep-dives/responsible-ai-governance.md)

## Flashcards (87)

Short recall cards from the topic quizzes of this domain. Read the question, answer in your head, then open the card.

### Model and service selection

From the [quiz](../quizzes/model-and-service-selection-quiz.md).

??? question "Two catalog categories?"
    Sold directly by Azure; partners and community.

??? question "Preferred deployment option?"
    Serverless API.

??? question "Managed compute in preview: content filtering?"
    Not available.

??? question "Where are reasoning tokens billed?"
    As output tokens; they share the context window.

??? question "Initial reserve for reasoning plus output?"
    At least 25,000 tokens.

??? question "Which effort for latency-critical tasks?"
    none (where supported).

??? question "Which API returns reasoning summaries?"
    Responses API only.

??? question "How avoid silent model changes?"
    Pin model version, no auto-upgrade, evaluate before adopting.

### Platform, network and reliability

From the [quiz](../quizzes/platform-network-and-reliability-quiz.md).

??? question "What is the current resource model replacing &quot;hub + projects&quot;?"
    A **Foundry resource** that contains **projects**.

??? question "How many model deployments can one Foundry resource hold?"
    **32**.

??? question "How many projects can one Foundry resource hold?"
    **250**.

??? question "Which three BYO resources does a network-secured standard agent setup require?"
    **Azure Cosmos DB** (conversations), **Azure Storage** (files), **Azure AI Search** (vector stores).

??? question "How many containers and RU/s does each project need in Cosmos DB?"
    **3 to 5 containers**, each **1,000 RU/s**.

??? question "Which delegation must the agent subnet have?"
    `Microsoft.App/environments`.

??? question "Can an agent subnet be shared by several Foundry resources?"
    No. Each Foundry resource needs a **dedicated** agent subnet.

??? question "Must the Foundry resource and its VNet be in the same region?"
    Yes.

??? question "Are private endpoints for Storage, Search and Cosmos DB created automatically with Foundry?"
    No. You create them yourself.

??? question "Which IP does a custom DNS server forward private zones to?"
    The Azure DNS virtual server **168.63.129.16**.

??? question "Does Agent Service include built-in backup or disaster recovery?"
    No. Use **agents as code** and **Cosmos DB continuous backup** (7-day PITR).

??? question "Why avoid TLS inspection on agent traffic?"
    Inspection certificates can break agent connections.

??? question "What should you use to disable key-based authentication across many resources?"
    **Azure Policy**.

??? question "Why should projects be created through infrastructure as code in production?"
    Portal-created projects do not inherit network controls, and portal actions can bypass constraints.

??? question "Private endpoint versus service endpoint?"
    Private endpoint gives a private IP in your VNet and allows disabling public access; service endpoint keeps the public IP and filters by subnet.

### Capacity, cost and throttling

From the [quiz](../quizzes/capacity-cost-and-throttling-quiz.md).

??? question "What is the documented default deployment type to start with?"
    **Global Standard**.

??? question "How is a provisioned deployment billed?"
    Per **PTU per hour**, even when idle (or through an Azure Reservation).

??? question "What discount and turnaround do Batch deployments offer?"
    **50%** cheaper, **24-hour** target, no real-time SLA.

??? question "Where is inference data processed for Data Zone types?"
    Only within the zone: **US, EU or APAC**.

??? question "Which deployment type is meant only for evaluating fine-tuned models?"
    **Developer** (`DeveloperTier`): 24-hour lifetime, no SLA.

??? question "Does having PTU quota guarantee you can deploy?"
    No. **Quota is a limit, capacity is availability**; the deployment fails if capacity is short.

??? question "In what order should you create a deployment and buy a reservation?"
    Create the **deployment first**, confirm capacity, then buy the reservation.

??? question "What is spillover?"
    Overflow from a full provisioned deployment is routed to a **standard deployment in the same Foundry resource**.

??? question "Which header enables spillover per request?"
    `x-ms-spillover-deployment`.

??? question "What should you do on an HTTP 429?"
    Retry with **exponential backoff** and honor the **`Retry-After`** header.

??? question "What HTTP error occurs with more than 10 custom headers?"
    **431**.

??? question "Which Azure service can add routing, health checks and circuit breaking across model deployments?"
    **Azure API Management** (Foundry does not load-balance deployments itself).

??? question "Which policy field blocks a deployment type?"
    `sku.name` on `Microsoft.CognitiveServices/accounts/deployments`.

??? question "Which factors drive PTU sizing?"
    Request shape, the output-to-input ratio, and the cache rate.

??? question "What does prompt caching require?"
    A prompt of at least 1,024 tokens whose first 1,024 tokens are identical to an earlier request.

??? question "Where should variable content go in a prompt that uses caching?"
    At the end; stable content (system message, tools, documents) goes first.

??? question "Which response field shows a cache hit?"
    `cached_tokens` under `prompt_tokens_details` (0 means a miss).

### Responsible ai and governance

From the [quiz](../quizzes/responsible-ai-governance-quiz.md).

??? question "Three activities of the framework?"
    Discover, Protect, Govern.

??? question "Text severity scale?"
    0 to 7 (trimmed 0, 2, 4, 6).

??? question "Image severity scale?"
    0, 2, 4, 6.

??? question "Default threshold for harm evaluators?"
    3; pass if score is at or below.

??? question "What is defect rate?"
    Share of test cases exceeding the threshold.

??? question "Which evaluator targets prompt injection through content?"
    Indirect attack (XPIA).

??? question "Which tool generates adversarial probes?"
    AI Red Teaming Agent.

??? question "Which categories does Content Safety classify?"
    Hate and fairness, sexual, violence, self-harm.

??? question "Which Foundry evaluator detects copyrighted lyrics, recipes or published text in outputs?"
    Protected Materials.

### Observability and agent lifecycle

From the [quiz](../quizzes/observability-and-agent-lifecycle-quiz.md).

??? question "What are the three core observability capabilities in Foundry?"
    **Evaluation**, **monitoring** and **tracing**.

??? question "Which standard does Foundry tracing use, and where are traces stored?"
    **OpenTelemetry**; stored in **Azure Monitor Application Insights**.

??? question "What is a span?"
    One operation inside a trace, with start and end times, attributes and nested child spans.

??? question "Which span name records an agent invocation in multi-agent conventions?"
    `invoke_agent` (with `plan`, `execute_tool` and memory operations as children).

??? question "Which role do you need to view traces in Foundry?"
    A **Log Analytics reader** role.

??? question "System evaluation vs process evaluation?"
    System = the final outcome; process = each step (such as tool calls).

??? question "What does Task Adherence measure?"
    Whether the agent followed its instructions, rules and policy constraints.

??? question "What does Task Completion measure?"
    Whether the agent finished the task with a usable deliverable.

??? question "What does Tool Call Success measure?"
    Only whether tool calls succeeded without technical errors.

??? question "Which evaluator checks that the agent used a tool's result correctly?"
    **Tool Output Utilization**.

??? question "When does a composite evaluator such as Output Quality pass?"
    Only when **every applicable component** passes.

??? question "What are the three lifecycle stages of evaluation?"
    Base model selection, pre-production evaluation, post-production monitoring.

??? question "Are agent versions mutable?"
    No. Each saved version is **immutable**; changes create a new version.

??? question "How do you refer to an agent in code?"
    `<agent_name>:<version>`.

??? question "What should you do if a previously valid agent ID returns 404?"
    Treat it as terminal (the agent was deleted) and recreate it; do not retry in a loop.

??? question "Which Azure ML monitoring signal detects production inputs changing from the baseline?"
    Data drift (alongside prediction drift and data quality).

??? question "What happens by default when a model monitoring threshold is exceeded?"
    Azure ML sends an alert email to the user who set up the monitor.

??? question "How long are Azure Monitor platform metrics kept?"
    93 days. Use a diagnostic setting to Log Analytics or Storage for longer.

??? question "Which tool shows 429 counts per deployment without writing a query?"
    Azure Monitor metrics explorer on the Azure OpenAI resource, filter by status code, split by ModelDeploymentName.

### Ci/cd for foundry projects

From the [quiz](../quizzes/cicd-for-foundry-projects-quiz.md).

??? question "Command to deploy a hosted agent with azd?"
    azd deploy (after azd provision).

??? question "Command to run a stored evaluation?"
    azd ai agent eval run --no-prompt.

??? question "Where does it read evaluation config?"
    eval.yaml in project root.

??? question "Authentication from GitHub Actions without secrets?"
    OIDC federated credentials.

??? question "Why a concurrency group?"
    Serialize deployments.

??? question "How specify agents in the evaluation Action?"
    agent-name:version.

??? question "Should the evaluation run on every commit?"
    No; Learn advises limiting for cost.

??? question "What should a smoke test check?"
    Expected response content, not just non-empty.

### Shipping ai apps to production

From the [quiz](../quizzes/shipping-ai-apps-to-production-quiz.md).

??? question "Why create Foundry projects through infrastructure as code?"
    Portal-created projects do not inherit network controls, and portal actions run under the service identity.

??? question "How should environments be separated?"
    Separate Foundry resources for experimentation, testing and production; a dedicated resource per major production workload.

??? question "Why a self-hosted CI runner inside the VNet?"
    Data-plane access to a private Foundry is blocked from public workstations (403 or connection errors).

??? question "What does an evaluation gate compare against?"
    The current production version's baseline, not only a fixed number.

??? question "Are agent versions mutable?"
    No; immutable, referenced as `<agent_name>:<version>`.

??? question "How do you stop silent model behavior changes?"
    Set the model version to **no auto-upgrade** and validate new versions.

??? question "Does Foundry provide canary or blue-green routing?"
    No; build a routing layer.

??? question "Does Foundry Agent Service provide built-in disaster recovery?"
    No; use agents as code, Cosmos DB continuous backup, delete locks and a failover replica.

??? question "How do you enforce no API keys?"
    Azure Policy to disable key-based (local) authentication; use Entra ID and managed identities.

??? question "What three log categories exist for Foundry Models?"
    RequestResponse, Trace, Audit.

??? question "What must you redo after publishing an agent?"
    Reassign roles to the new distinct agent identity.

Back to the [question bank overview](question-bank.md).
