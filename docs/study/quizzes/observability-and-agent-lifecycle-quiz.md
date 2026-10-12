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

## Practice questions

### 1. Users report that an agent sometimes gives a wrong answer. You need to see, for one failing request, which tools were called, with which arguments, and where the time went. What should you use?

- A. The AI red teaming agent
- B. Agent tracing with Application Insights
- C. Quota usage in the portal
- D. The Groundedness evaluator

<details><summary>Answer</summary>

**Correct: B.** A trace records each model call, tool call, input and output in order, with latency and token usage.
**Incorrect:** A — it simulates attacks, it does not explain one request; C — quota shows capacity, not behavior; D — it scores one quality dimension but does not show the steps.
Source: https://learn.microsoft.com/en-us/azure/foundry/observability/concepts/trace-agent-concept

</details>

### 2. A team enabled tracing, but a developer cannot see traces in the Foundry portal. The project is connected to Application Insights. What is the most likely missing permission?

- A. Foundry Owner on the subscription
- B. A Log Analytics reader role
- C. Contributor on the Storage account
- D. Cognitive Services User

<details><summary>Answer</summary>

**Correct: B.** Viewing traces, insights and visualizations in Foundry requires a Log Analytics reader role, because telemetry lives in Application Insights.
**Incorrect:** A — it manages resources but is not the telemetry read role; C — Storage is unrelated; D — it is a Cognitive Services role not intended for Foundry scenarios.
Source: https://learn.microsoft.com/en-us/azure/foundry/observability/concepts/trace-agent-concept

</details>

### 3. An agent was instructed never to give investment advice, but it recommended a fund while completing the user's request successfully. Which evaluator detects that the agent broke its rules?

- A. Task Completion
- B. Task Adherence
- C. Tool Call Success
- D. Intent Resolution

<details><summary>Answer</summary>

**Correct: B.** Task Adherence measures whether the agent's actions follow its assigned task, rules and policy constraints.
**Incorrect:** A — completion passes because the task was finished; C — it only checks technical tool errors; D — it checks whether the user's intent was understood.
Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/agent-evaluators

</details>

### 4. A tool call returns the correct order status with no errors, but the agent's final answer ignores it and states a different status. Which evaluator best identifies this process failure?

- A. Tool Call Success
- B. Tool Selection
- C. Tool Output Utilization
- D. Task Navigation Efficiency

<details><summary>Answer</summary>

**Correct: C.** Tool Output Utilization measures whether the agent correctly understood and used the tool result in its reasoning and final response.
**Incorrect:** A — the call succeeded, so this passes; B — the right tool was chosen; D — it compares the sequence of steps with an expected path and needs ground truth.
Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/agent-evaluators

</details>

### 5. A production agent passed all tests at launch, but you worry its quality may degrade over time as data and models change. Which approach detects this drift?

- A. Run the pre-production evaluation again once a year
- B. Rely on tracing alone
- C. Scheduled evaluation with a test dataset plus continuous evaluation of sampled production traffic, with alerts
- D. Increase the model's temperature

<details><summary>Answer</summary>

**Correct: C.** Post-production monitoring includes continuous evaluation, scheduled evaluation to detect drift, scheduled red teaming and Azure Monitor alerts on failed thresholds.
**Incorrect:** A — too infrequent; B — tracing helps debugging but does not score quality; D — temperature changes randomness, not monitoring.
Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/observability

</details>

### 6. You change an agent's instructions and want to compare behavior with the previous setup using identical inputs, and be able to roll back. What should you do?

- A. Edit the saved version in place
- B. Delete the agent and create a new one with the same name
- C. Keep the changes unsaved in the playground
- D. Save the change as a new version and compare versions

<details><summary>Answer</summary>

**Correct: D.** Saved versions are immutable. You can compare setup, chat output and YAML between versions and send requests to a specific version for rollout and rollback.
**Incorrect:** A — saved versions cannot be edited in place; B — it loses history and the old ID becomes invalid; C — unsaved changes are temporary and cannot be fully evaluated or monitored.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/development-lifecycle

</details>

### 7. An agent's behavior changed overnight although no one modified the agent. A platform setting had allowed the model deployment to move to a newer model version. What should you set to prevent this?

- A. Model version upgrade to no auto-upgrade, and validate new versions with evaluations before adopting them
- B. A higher token quota
- C. A smaller agent subnet
- D. Application Insights sampling to 100%

<details><summary>Answer</summary>

**Correct: A.** Pinning the model version prevents unvalidated model changes from altering responses.
**Incorrect:** B — quota does not control versions; C — networking is unrelated; D — sampling affects telemetry volume, not model versions.
Source: https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat

</details>

### 8. At startup your service calls an agent by an ID it stored earlier and receives `404 Not Found`. What is the correct handling?

- A. Retry the same ID every second until it works
- B. Treat the 404 as terminal: the agent was deleted, so recreate it (or use a get-or-create pattern)
- C. Increase the client timeout
- D. Switch to key-based authentication

<details><summary>Answer</summary>

**Correct: B.** An ID is invalidated when the agent is deleted. Polling a deleted ID never succeeds and only produces error traffic. Look up by name and create only if missing.
**Incorrect:** A — it never succeeds; C — the problem is not latency; D — authentication is not the cause of a 404.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/development-lifecycle

</details>

### 9. The Output Quality composite evaluator reports a failed primary result. How do you find which quality dimension caused it?

- A. Run a red teaming scan
- B. Inspect the component results and reasons, such as `groundedness_result` and `output_quality_reason`
- C. Re-run with a different judge model
- D. Disable the evaluator

<details><summary>Answer</summary>

**Correct: B.** The primary result passes only when every applicable component passes. Component scores, results and reasons identify the failing dimension.
**Incorrect:** A — it tests attack resistance; C — it does not explain the failure; D — it hides the problem.
Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/agent-evaluators

</details>

### 10. A published agent worked in testing, but after publishing, dashboards show tool calls failing. Which release-process habit would most likely have prevented the outage?

- A. Running more evaluations on the unpublished agent only
- B. Rechecking and reassigning permissions to the published agent's distinct identity as part of the publish checklist
- C. Using a smaller model
- D. Turning off tracing

<details><summary>Answer</summary>

**Correct: B.** Publishing creates a distinct agent identity, and permissions held by the project identity do not transfer. The publish checklist should include reassigning the minimum required access.
**Incorrect:** A — it tests the unpublished identity and would not catch the permission change; C — model size is unrelated; D — it removes visibility.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/development-lifecycle

</details>
