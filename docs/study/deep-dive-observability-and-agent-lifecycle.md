---
domain: Plan and manage; Generative AI and agents
skill: Monitor model performance, safety events and grounding quality; evaluate agent behavior; set up observability (tracing, token analytics, latency)
sources:
  - https://learn.microsoft.com/en-us/azure/foundry/concepts/observability
  - https://learn.microsoft.com/en-us/azure/foundry/observability/concepts/trace-agent-concept
  - https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/agent-evaluators
  - https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/rag-evaluators
  - https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/development-lifecycle
  - https://learn.microsoft.com/en-us/azure/foundry/agents/overview
  - https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat
retrieved: 2026-10-12
---

# Deep dive: seeing inside agents and shipping them safely

Traditional software is deterministic: the same input gives the same output, so a unit test is enough. Models and agents are **non-deterministic** and take a **different path each time**, so you need three tools together: **tracing** (what happened), **evaluation** (was it good), and **monitoring** (is it still good in production). This page explains each and the release process around them.

Part of the [best practices overview](best-practices-and-real-world-scenarios.md). Items marked `[NEEDS VERIFICATION]` are not confirmed on Microsoft Learn.

---

## 1. Tracing: the flight recorder

### Why agents are hard to debug
- A single answer can involve many steps, and the sequence changes with user input.
- Inputs and outputs at each step can be long.
- Steps nest: an agent calls a tool, which runs a process, which calls another tool. When the final answer is strange, you cannot tell where the mistake entered.

A **trace** records every step of one request in order, so you can open it and see the inputs and outputs at each point.

### Vocabulary (OpenTelemetry)
| Term | Meaning |
|---|---|
| **Trace** | The whole journey of one request or workflow |
| **Span** | One operation inside a trace, with start and end time and nested children |
| **Attributes** | Key-value metadata on a span (tool arguments, results, tokens) |
| **Semantic conventions** | Standard names for attributes so tools understand each other |
| **Exporter** | Sends traces to a backend. In Foundry the backend is **Azure Monitor Application Insights** |

Foundry uses OpenTelemetry GenAI semantic conventions (status: Development, may change). For multi-agent systems the standard spans include `invoke_agent` (an agent call, nestable for agent-to-agent), `plan` (task decomposition), `invoke_workflow`, `execute_tool`, and memory operations (`create_memory`, `search_memory`, `update_memory`, `upsert_memory`, `delete_memory`). Useful attributes: `gen_ai.tool.definitions`, `gen_ai.tool.call.arguments`, `gen_ai.tool.call.result`.

### What a trace captures
User inputs and agent outputs; **tool calls and results**; **token consumption**; **durations and latencies**; retries; costs.

### Reading a trace (examples of what you learn)
| You see | Meaning | Action |
|---|---|---|
| Expected tool never called | Agent chose not to use it | Improve tool description or instructions |
| Right tool, wrong arguments | Poor argument extraction | Fix schema, add examples; check Tool Input Accuracy |
| One `execute_tool` span takes 8 s | Slow downstream API | Optimize or cache the API |
| Same tool called repeatedly | Loop or poor stop condition | Tighten instructions, limit tools |
| Retries then success | Intermittent tool failure | Add reliability at the tool |

### Setup and requirements
- Connect the project to an **Application Insights** resource; you need a **Log Analytics reader** role to view traces in the portal.
- Tracing is **GA for prompt and hosted agents**; workflow and external agents are **Preview**.
- Frameworks supported: LangChain, LangGraph, OpenAI Agents SDK, Microsoft Agent Framework.
- Telemetry costs depend on Application Insights volume and retention; **retention and sampling follow your Application Insights configuration**.

### Privacy
Traces can contain user text, model output and tool arguments. Do **not** put secrets in prompts, arguments or span attributes; **redact or minimize** personal data before it reaches telemetry; apply the **same access controls and retention** as production logs. There is a way to route sensitive content to a dedicated table with restricted access.

### If traces do not appear
Check the project is connected to Application Insights, your account can query telemetry, and your code has the instrumentation for your framework.

---

## 2. Evaluation: unit tests for non-deterministic systems

Evaluators take agent messages as input and return Pass/Fail (or a 1 to 5 score converted to Pass/Fail by a **threshold**, default 3). Most are **AI-assisted**: another model acts as the judge (`deployment_name` parameter).

### Two best-practice views
- **System evaluation:** did the whole agent reach a good *outcome*?
- **Process evaluation:** was each *step* done well?

### The agent evaluators

| Evaluator | View | Question | Failure it catches |
|---|---|---|---|
| **Task Completion** (Preview) | System | Did the agent finish the task with a usable deliverable? | Agent stops halfway |
| **Task Adherence** (Preview) | System | Did it follow system instructions and policy? | Agent gives advice it was told not to |
| **Intent Resolution** (Preview) | System | Did it understand what the user wanted? | Answers a different question |
| **Task Navigation Efficiency** | System | Were tool steps efficient versus an expected sequence? | Needless extra calls (needs ground truth; modes `exact_match`, `in_order_match`, `any_order_match`) |
| **Customer Satisfaction** (Preview) | System | Would the user be satisfied (helpful, complete, clear, tone, resolution, adaptability)? | Frustrating interactions (1 to 5) |
| **Tool Call Accuracy** | Process | Right tools, right parameters, no redundancy? | Wrong tool or bad arguments |
| **Tool Selection** | Process | Chose the needed tools, no unnecessary ones? | Calling a tool that is not required |
| **Tool Input Accuracy** | Process | Every parameter correct (grounded, type, format, required, no extras, sensible value)? | One malformed argument |
| **Tool Output Utilization** | Process | Did the agent use the tool's result correctly? | Ignores or misreads the result |
| **Tool Call Success** | Process | Did the tool call technically succeed? | API errors, timeouts |

Also: **Output Quality** (Preview, batches fluency, coherence, intent resolution, task adherence, groundedness, task completion in one judge call) and **Tool Use Quality** (Preview, batches the five tool evaluators). The primary composite result passes only if **every applicable component** passes; use components to find the cause. **Quality Grader is deprecated.**

Practical limits: agent evaluators fully support File Search, function tools, MCP and knowledge-based MCP. For Azure AI Search, Bing grounding, SharePoint, Code Interpreter, Fabric Data Agent and Web Search, avoid `tool_call_accuracy`, tool input accuracy, tool output utilization, tool call success and `groundedness` because support is limited.

For RAG quality evaluators (groundedness, relevance, retrieval and others) see the [retrieval deep dive](deep-dive-rag-retrieval-and-grounding.md).

### Dataset shape
Rows contain `query`, `response` (and optionally `tool_definitions`), or a full `messages` array with roles `system`, `user`, `assistant`, `tool` and tool calls/results. Turn-level scores one response; conversation-level scores the whole interaction (`evaluation_level`).

```python
testing_criteria = [
    {
        "type": "azure_ai_evaluator",
        "name": "task_adherence",
        "evaluator_name": "builtin.task_adherence",
        "initialization_parameters": {"deployment_name": model_deployment},
        "data_mapping": {
            "query": "{{item.query}}",
            "response": "{{item.response}}",
        },
    },
]
```

This follows the Learn sample. `model_deployment` is the judge model deployment name.

---

## 3. The three stages of evaluation across the lifecycle

| Stage | Question | Tools |
|---|---|---|
| **1. Base model selection** | Which model fits? | Foundry **benchmarks** on public or your own data; the Evaluation SDK on a model endpoint |
| **2. Pre-production** | Is it ready to ship? | Your **dataset** with quality, safety and custom evaluators; the **AI red teaming agent** (PyRIT) for attacks; edge-case tests |
| **3. Post-production** | Is it still good? | **Continuous evaluation** of sampled production traffic; **scheduled evaluation** with a test set to detect **drift**; **scheduled red teaming**; **Azure Monitor alerts** |

**Custom evaluators** exist for domain-specific rules. Evaluation results can be analyzed with **cluster analysis** to group failures. Evaluations in the **agent playground are on by default and billed** by consumption; turn them off by unselecting the evaluators.

---

## 4. Monitoring in production

- The **Foundry observability dashboard** (integrated with Application Insights) shows operational metrics, **token consumption, latency, error rates and quality scores** in real time.
- Set **alerts** when outputs fail quality thresholds or produce harmful content.
- Watch **HTTP 429 and 503** to detect throttling.
- Send resource diagnostics to **Log Analytics** for audit with KQL (who called which deployment and when). `[NEEDS VERIFICATION]` exact log categories.
- Add **token tracking** in Application Insights and **baseline alerts** in Azure Monitor.
- Log activity on **jump boxes and build agents**, because they have direct data-plane access.
- Voice agents: monitoring cards need Application Insights; evaluation supports full-conversation runs only.

---

## 5. The agent lifecycle as a release process

```
choose type → create & test → add tools/data → save version → trace → evaluate → (optimize) → publish → monitor → iterate
```

### Versions are immutable
Every saved change creates a **new version**; an existing version never changes. You can compare **setup, chat output and YAML** between versions and **send requests to a specific version**, which makes rollout and rollback controlled. Unsaved edits are temporary and cannot be fully evaluated or monitored. A saved agent's name cannot change; in code you refer to `<agent_name>:<version>`.

### Safe change process
1. Change the prompt, tool or model **in a new version**.
2. Run your **evaluation suite** (realistic prompts) against old and new versions.
3. **Gate**: promote only if scores do not regress.
4. Publish; monitor; keep the old version for rollback.
5. Pin the model version (**no auto-upgrade**), because a silent model change alters behavior.

### Reliability habits in code
- **Get-or-create:** look up the agent by name at startup; create only on 404; reuse the ID.
- **Treat 404 for a previously valid ID as terminal:** it was deleted; recreate rather than retry in a loop.
- Define agents **as code in source control** and deploy by CI/CD from inside the network.
- Use separate Foundry resources for experimentation, testing and production.

### Publishing changes who the agent is
Publishing creates a stable endpoint and a **distinct agent identity**. Permissions on the shared project identity **do not transfer**; reassign them. Check tool connections still work.

### Agent optimizer (Preview)
Evaluates behavior and automatically proposes better instructions, skills, tool descriptions and model choices for prompt and hosted agents. Treat its output as a suggestion to test.

### Rollout patterns Foundry does not provide
Canary and blue-green releases need a **routing layer** you build. Keep the UI and agents loosely coupled so they deploy independently.

---

## 6. Worked example: "the agent got worse after Friday's change"

1. **Open traces** for failing conversations. Observation: the `search_orders` tool is no longer called.
2. **Compare versions** (setup and chat output with identical inputs). Observation: the new instructions removed the line that told the agent to look up orders.
3. **Run evaluators** on both versions: Tool Selection fails on the new one; Task Completion drops.
4. **Roll back** by directing traffic to the previous version while fixing.
5. **Prevent recurrence:** add the failing prompts to the test suite and make evaluation a required check before publish.

Each step uses a different tool, which is exactly how exam questions are built: match the *symptom* to the *tool*.

| Symptom | Reach for |
|---|---|
| "Where did it go wrong in this one request?" | Tracing |
| "Is the new version better than the old one?" | Evaluation on both versions |
| "Is quality drifting in production?" | Continuous or scheduled evaluation, alerts |
| "Who called the model and when?" | Diagnostic logs in Log Analytics |
| "Is it vulnerable to attacks?" | AI red teaming agent |
| "Why is it slow or expensive?" | Trace latency and token breakdown, dashboard |

---

## 7. Exam traps

| Trap | Correct thinking |
|---|---|
| "Run evaluation once before launch" | Evaluate continuously in production and after every meaningful change |
| "Evaluators are deterministic tests" | Most are LLM-judged and need a judge deployment |
| "Edit the agent in place" | Versions are immutable; save a new version |
| "Traces are safe to log everything" | They can capture sensitive data; redact and restrict access |
| "Task Adherence = Task Completion" | Adherence = followed rules; Completion = finished the job |
| "Tool Call Success proves correct behavior" | It only proves the call did not error |
| "Let models auto-upgrade" | Pin and validate first |
| "Publishing keeps permissions" | New identity; reassign |
| "Foundry provides canary releases" | You must build the routing layer |

## Sources

See the frontmatter. The worked debugging example and symptom table are teaching syntheses of the cited guidance.
