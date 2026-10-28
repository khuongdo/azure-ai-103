---
note: docs/study/deep-dives/observability-and-agent-lifecycle.md
skill: Monitor model performance, safety events and grounding quality; evaluate agent behavior; set up observability (tracing, token analytics, latency)
retrieved: 2026-10-12
---

# Quiz: observability and agent lifecycle

Answers and explanations come from the [deep dive](../deep-dives/observability-and-agent-lifecycle.md), which cites Microsoft Learn. Try each question before opening the answer.

## Flashcards

**Q:** What are the three core observability capabilities in Foundry?
**A:** **Evaluation**, **monitoring** and **tracing**.

**Q:** Which standard does Foundry tracing use, and where are traces stored?
**A:** **OpenTelemetry**; stored in **Azure Monitor Application Insights**.

**Q:** What is a span?
**A:** One operation inside a trace, with start and end times, attributes and nested child spans.

**Q:** Which span name records an agent invocation in multi-agent conventions?
**A:** `invoke_agent` (with `plan`, `execute_tool` and memory operations as children).

**Q:** Which role do you need to view traces in Foundry?
**A:** A **Log Analytics reader** role.

**Q:** System evaluation vs process evaluation?
**A:** System = the final outcome; process = each step (such as tool calls).

**Q:** What does Task Adherence measure?
**A:** Whether the agent followed its instructions, rules and policy constraints.

**Q:** What does Task Completion measure?
**A:** Whether the agent finished the task with a usable deliverable.

**Q:** What does Tool Call Success measure?
**A:** Only whether tool calls succeeded without technical errors.

**Q:** Which evaluator checks that the agent used a tool's result correctly?
**A:** **Tool Output Utilization**.

**Q:** When does a composite evaluator such as Output Quality pass?
**A:** Only when **every applicable component** passes.

**Q:** What are the three lifecycle stages of evaluation?
**A:** Base model selection, pre-production evaluation, post-production monitoring.

**Q:** Are agent versions mutable?
**A:** No. Each saved version is **immutable**; changes create a new version.

**Q:** How do you refer to an agent in code?
**A:** `<agent_name>:<version>`.

**Q:** What should you do if a previously valid agent ID returns 404?
**A:** Treat it as terminal (the agent was deleted) and recreate it; do not retry in a loop.

**Q:** Which Azure ML monitoring signal detects production inputs changing from the baseline?
**A:** Data drift (alongside prediction drift and data quality).

**Q:** What happens by default when a model monitoring threshold is exceeded?
**A:** Azure ML sends an alert email to the user who set up the monitor.

**Q:** How long are Azure Monitor platform metrics kept?
**A:** 93 days. Use a diagnostic setting to Log Analytics or Storage for longer.

**Q:** Which tool shows 429 counts per deployment without writing a query?
**A:** Azure Monitor metrics explorer on the Azure OpenAI resource, filter by status code, split by ModelDeploymentName.

## Practice questions

### 1. Users report that an agent sometimes gives a wrong answer. You need to see, for one failing request, which tools were called, with which arguments, and where the time went. What should you use?

- A. The AI red teaming agent
- B. Agent tracing with Application Insights
- C. Quota usage in the portal
- D. The Groundedness evaluator

<details><summary>Answer</summary>

**Correct: B.** A **trace** is the recorded story of one request: spans for each model call, tool call (with arguments and result), retrieval step, with start/end times, latency and token usage. With tracing sent to **Application Insights** you can open the failing request and see "the agent called `get_order` with `order_id=47111` (typo), took 3.2 s, returned empty, then answered anyway". Other tools score or test; only a trace shows the steps of that single request.

```python
from azure.monitor.opentelemetry import configure_azure_monitor

conn = project.telemetry.get_application_insights_connection_string()
configure_azure_monitor(connection_string=conn)     # spans from instrumented SDK calls go to App Insights
```

**Why the others are wrong:**
- **A. AI red teaming agent:** simulates attacks; it does not explain one request.
- **C. Quota usage:** capacity, not behavior.
- **D. Groundedness evaluator:** one quality score, no steps.

Source: https://learn.microsoft.com/en-us/azure/foundry/observability/concepts/trace-agent-concept

</details>

### 2. A team enabled tracing, but a developer cannot see traces in the Foundry portal. The project is connected to Application Insights. What is the most likely missing permission?

- A. Foundry Owner on the subscription
- B. A Log Analytics reader role
- C. Contributor on the Storage account
- D. Cognitive Services User

<details><summary>Answer</summary>

**Correct: B.** Traces are stored in **Application Insights** (backed by a Log Analytics workspace). The Foundry portal reads them for you, so the signed-in person needs a **Log Analytics reader** role (for example Log Analytics Reader) on that workspace or Application Insights resource. Having a Foundry role is not enough because the data lives in a different resource.

```bash
az role assignment create --assignee <user-or-group-id> \
  --role "Log Analytics Reader" --scope <log-analytics-or-app-insights-resource-id>
```

**Why the others are wrong:**
- **A. Foundry Owner on the subscription:** manages resources but is not the telemetry read role.
- **C. Contributor on Storage:** unrelated.
- **D. Cognitive Services User:** lets you call Cognitive Services APIs, not read telemetry.

Source: https://learn.microsoft.com/en-us/azure/foundry/observability/concepts/trace-agent-concept

</details>

### 3. An agent was instructed never to give investment advice, but it recommended a fund while completing the user's request successfully. Which evaluator detects that the agent broke its rules?

- A. Task Completion
- B. Task Adherence
- C. Tool Call Success
- D. Intent Resolution

<details><summary>Answer</summary>

**Correct: B.** Agent evaluators look at different parts of the process:
| Evaluator | Question it answers |
|---|---|
| Intent Resolution | Did the agent understand what the user wanted? |
| Task Adherence | Did the agent follow its **assigned task, rules and policy**? |
| Task Completion | Was the task finished? |
| Tool Call Success | Did the tool calls run without technical errors? |
| Tool Selection / Tool Input Accuracy | Right tool, right arguments? |
| Tool Output Utilization | Did the agent use tool results correctly? |

Recommending a fund broke a rule while still completing the request, so only Task Adherence fails.

```python
from azure.ai.evaluation import TaskAdherenceEvaluator

evaluator = TaskAdherenceEvaluator(model_config=judge_model_config)
print(evaluator(query=user_msg, response=agent_response, tool_definitions=tools))
```

**Why the others are wrong:**
- **A. Task Completion:** passes; the task was completed.
- **C. Tool Call Success:** checks technical errors only.
- **D. Intent Resolution:** the intent was understood.

Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/agent-evaluators

</details>

### 4. A tool call returns the correct order status with no errors, but the agent's final answer ignores it and states a different status. Which evaluator best identifies this process failure?

- A. Tool Call Success
- B. Tool Selection
- C. Tool Output Utilization
- D. Task Navigation Efficiency

<details><summary>Answer</summary>

**Correct: C.** **Tool Output Utilization** checks whether the agent correctly *used* what a tool returned. Here the tool call was right and successful, but the final answer contradicts the result: a process failure after the tool step. To diagnose, compare the three stages: selection (right tool?), input (right arguments?), output use (right interpretation?). Fix with clearer instructions ("always base the order status on the tool result"), and check for stale memory or conflicting context.

**Why the others are wrong:**
- **A. Tool Call Success:** the call succeeded, so it passes.
- **B. Tool Selection:** the right tool was chosen.
- **D. Task Navigation Efficiency:** compares the sequence of steps with an expected path and needs ground truth.

Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/agent-evaluators

</details>

### 5. A production agent passed all tests at launch, but you worry its quality may degrade over time as data and models change. Which approach detects this drift?

- A. Run the pre-production evaluation again once a year
- B. Rely on tracing alone
- C. Scheduled evaluation with a test dataset plus continuous evaluation of sampled production traffic, with alerts
- D. Increase the model's temperature

<details><summary>Answer</summary>

**Correct: C.** Quality can drift without any code change: source content ages, user questions shift, the provider updates a model. Post-production monitoring has several layers: **continuous evaluation** of sampled production traffic, **scheduled evaluation** with a fixed test dataset (comparable over time), **scheduled red teaming**, and **Azure Monitor alerts** when scores cross thresholds.

Example: weekly run of the 200-question golden set; groundedness falls from 4.6 to 4.1; an alert opens a ticket before customers complain.

**Why the others are wrong:**
- **A. Yearly re-run:** far too infrequent.
- **B. Tracing alone:** helps debugging but does not score quality.
- **D. Higher temperature:** only changes randomness.

Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/observability

</details>

### 6. You change an agent's instructions and want to compare behavior with the previous setup using identical inputs, and be able to roll back. What should you do?

- A. Edit the saved version in place
- B. Delete the agent and create a new one with the same name
- C. Keep the changes unsaved in the playground
- D. Save the change as a new version and compare versions

<details><summary>Answer</summary>

**Correct: D.** Saved agent versions are **immutable**: any change creates a new version, referred to as `name:version`. That gives you what the scenario needs: run the same inputs against `support:3` and `support:4`, compare setup, outputs and YAML, send traffic to a specific version, and **roll back** by pointing to the old one. Compare with evaluations, not by eye.

```python
v4 = project.agents.create_version(
    agent_name="support",
    definition=PromptAgentDefinition(model="gpt-4.1-mini", instructions=NEW_INSTRUCTIONS),
)
# run the same dataset against "support:3" and "support:4"; roll back by using "support:3" again
```

**Why the others are wrong:**
- **A. Edit in place:** saved versions cannot be edited.
- **B. Delete and recreate:** loses history and invalidates the old ID.
- **C. Unsaved playground changes:** temporary; cannot be evaluated or monitored properly.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/development-lifecycle

</details>

### 7. An agent's behavior changed overnight although no one modified the agent. A platform setting had allowed the model deployment to move to a newer model version. What should you set to prevent this?

- A. Model version upgrade to no auto-upgrade, and validate new versions with evaluations before adopting them
- B. A higher token quota
- C. A smaller agent subnet
- D. Application Insights sampling to 100%

<details><summary>Answer</summary>

**Correct: A.** A model deployment can be set to **auto-upgrade** to newer model versions. A new version can phrase answers differently, follow instructions differently or call tools differently, so the agent "changes overnight". Set the deployment's version upgrade option to **no auto-upgrade** (pin the version), then run your evaluation suite on the new version in a separate deployment before switching.

```json
"properties": { "model": { "format": "OpenAI", "name": "gpt-4.1", "version": "2025-04-14" },
                "versionUpgradeOption": "NoAutoUpgrade" }
```

**Why the others are wrong:**
- **B. Higher quota:** capacity, not version control.
- **C. Smaller agent subnet:** networking is unrelated.
- **D. 100% sampling:** only changes how much telemetry you keep.

Source: https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat

</details>

### 8. At startup your service calls an agent by an ID it stored earlier and receives `404 Not Found`. What is the correct handling?

- A. Retry the same ID every second until it works
- B. Treat the 404 as terminal: the agent was deleted, so recreate it (or use a get-or-create pattern)
- C. Increase the client timeout
- D. Switch to key-based authentication

<details><summary>Answer</summary>

**Correct: B.** A 404 on an ID that existed means the agent was **deleted** (or lives in another project). Retrying will never succeed and only floods the service with errors. Treat 404 as terminal for that ID. Use a **get-or-create by name** pattern at startup so the service self-heals.

```python
from azure.core.exceptions import ResourceNotFoundError

def get_or_create_agent(project, name, definition):
    try:
        return project.agents.get(agent_name=name)           # look up by name, not a stored ID
    except ResourceNotFoundError:
        return project.agents.create_version(agent_name=name, definition=definition)
```

**Why the others are wrong:**
- **A. Retry every second:** a deleted ID never reappears.
- **C. Larger timeout:** 404 is not a latency problem.
- **D. Key-based auth:** an authentication failure would be 401/403, not 404.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/development-lifecycle

</details>

### 9. The Output Quality composite evaluator reports a failed primary result. How do you find which quality dimension caused it?

- A. Run a red teaming scan
- B. Inspect the component results and reasons, such as `groundedness_result` and `output_quality_reason`
- C. Re-run with a different judge model
- D. Disable the evaluator

<details><summary>Answer</summary>

**Correct: B.** The **Output Quality** composite evaluator runs several component evaluators (for example groundedness, relevance, coherence). Its primary result is **pass only when every applicable component passes**, so one weak dimension fails the whole. The result object includes each component's score, result and reason (for example `groundedness_result`, `output_quality_reason`). Read them to find the failing dimension, then fix that part (retrieval, prompt, model).

```python
result = output_quality_evaluator(query=q, response=r, context=ctx)
failed = {k: v for k, v in result.items() if k.endswith("_result") and v == "fail"}
print(failed, result.get("output_quality_reason"))
```

(Field names as in the question; confirm exact output keys in Learn.)

**Why the others are wrong:**
- **A. Red teaming:** tests attack resistance.
- **C. Different judge model:** does not explain the failure.
- **D. Disable the evaluator:** hides the problem.

Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/agent-evaluators

</details>

### 10. A published agent worked in testing, but after publishing, dashboards show tool calls failing. Which release-process habit would most likely have prevented the outage?

- A. Running more evaluations on the unpublished agent only
- B. Rechecking and reassigning permissions to the published agent's distinct identity as part of the publish checklist
- C. Using a smaller model
- D. Turning off tracing

<details><summary>Answer</summary>

**Correct: B.** **Publishing creates a distinct agent identity** and permissions given to the shared project identity **do not transfer**. In testing the agent used the project identity, so everything worked; after publishing the new identity has no roles on the tools' resources. Add a step to the **publish checklist**: list the resources the agent touches, grant **least-privilege** roles to the new identity, then run a smoke test on the published endpoint.

**Why the others are wrong:**
- **A. More evaluations on the unpublished agent:** they run with the old identity and cannot see the permission change.
- **C. Smaller model:** unrelated.
- **D. Tracing off:** removes the evidence.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/development-lifecycle

</details>

### 11. A deployed Azure ML model's input feature distribution slowly changes compared with its training data. Which feature detects this and alerts you?

- A. Model monitoring with a data drift signal and threshold
- B. Prompt caching
- C. Content filter annotations
- D. A larger compute SKU

<details><summary>Answer</summary>

**Correct: A.** Azure ML **model monitoring** compares production inputs with a **baseline** (usually training data) using signals such as **data drift**, prediction drift, data quality and feature attribution drift. When a metric crosses its **threshold**, Azure ML sends an **alert email** to the user who set up the monitor by default (you can add more recipients).

```python
from azure.ai.ml.entities import MonitorDefinition, MonitoringTarget, DataDriftSignal, AlertNotification

monitor = MonitorDefinition(
    compute=spark_compute,
    monitoring_target=MonitoringTarget(ml_task="classification", endpoint_deployment_id=deployment_id),
    monitoring_signals={"drift": DataDriftSignal()},
    alert_notification=AlertNotification(emails=["ml-team@contoso.com"]),
)
```

**Why the others are wrong:**
- **B. Prompt caching:** reduces cost for repeated prompt prefixes.
- **C. Content filter annotations:** report content safety categories.
- **D. Larger compute SKU:** more power, no drift detection.

Source: https://learn.microsoft.com/en-us/azure/machine-learning/how-to-monitor-model-performance

</details>

### 12. A finance team needs quarterly token and 429 reports for Azure OpenAI deployments, kept for a year. What should you do?

- A. Rely on the default metrics retention
- B. Use metrics explorer and export screenshots
- C. Create a diagnostic setting that sends metrics to a Log Analytics workspace
- D. Enable prompt caching

<details><summary>Answer</summary>

**Correct: C.** Azure Monitor **platform metrics** (processed tokens, request counts by status code, and so on) are kept for **93 days**. A year of quarterly reports needs a **diagnostic setting** that streams metrics to a **Log Analytics workspace** (or Storage) with the retention you choose; then query or build a workbook.

```bash
az monitor diagnostic-settings create --name to-law \
  --resource <azure-openai-resource-id> --workspace <log-analytics-workspace-id> \
  --metrics '[{"category":"AllMetrics","enabled":true}]'
```

For quick checks without a query, use **metrics explorer**, filter by status code and split by `ModelDeploymentName` to see 429s per deployment.

**Why the others are wrong:**
- **A. Default retention:** 93 days is shorter than a year.
- **B. Screenshots:** manual and not queryable.
- **D. Prompt caching:** unrelated.

Source: https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/data-platform-metrics

</details>
