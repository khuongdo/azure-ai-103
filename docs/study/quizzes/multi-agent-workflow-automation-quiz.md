---
note: docs/study/real-world/multi-agent-workflow-automation.md
skill: Implement orchestrated multi-agent solutions; build autonomous or semiautonomous workflows with safeguards and approval controls; orchestrate multiple models, flows, or hybrid LLM and rules engines
retrieved: 2026-10-12
---

# Quiz: multi-agent workflow automation

Based on the [case study](../real-world/multi-agent-workflow-automation.md). The last two are **design questions**.

## Flashcards

**Q:** Microsoft's rule of thumb for agents vs code?
**A:** If you can write a function to handle the task, do that instead of using an AI agent.

**Q:** Use an agent when...?
**A:** The task is open-ended or conversational, needs autonomous tool use and planning, or one LLM call (with tools) suffices.

**Q:** Use a workflow when...?
**A:** The process has well-defined steps, you need control over execution order, or multiple agents or functions must coordinate.

**Q:** What happens to Foundry visual workflows?
**A:** Preview; **retiring December 1, 2026**; migrate to Microsoft Agent Framework (or Logic Apps).

**Q:** Name the five Agent Framework orchestrations.
**A:** Sequential, Concurrent, Handoff, Group chat, Magentic.

**Q:** When are checkpoints created?
**A:** At the end of each **superstep**; they capture executor state, pending messages, requests and responses, and shared state.

**Q:** Which checkpoint storage suits production?
**A:** `CosmosCheckpointStorage` with managed identity.

**Q:** What is a toolbox?
**A:** A curated set of tools exposed through one managed, MCP-compatible endpoint with central auth, governance and versioning.

**Q:** What does tool search (Preview) do?
**A:** Hides tools behind `tool_search` and `call_tool` so hundreds of tools do not bloat context.

**Q:** Which protocol lets one agent call another?
**A:** **A2A** (v1.0 GA, v0.3 Preview).

**Q:** Why idempotency keys?
**A:** Retries must not create duplicate accounts or actions.

## Practice questions

### 1. Which onboarding step should be plain code rather than an agent?

- A. Creating the Entra account with a fixed rule and idempotency key
- B. Answering free-form policy questions
- C. Drafting a personalized welcome email
- D. Proposing an access bundle from messy role descriptions

<details><summary>Answer</summary>

**Correct: A.** Use an agent where **language and judgment** are needed; use **plain code** where the step is fixed, sensitive and must behave the same every time. Creating an account follows a fixed rule, has side effects, and must never run twice by accident, so write it as a normal function with an **idempotency key**. Free-form questions, personalized emails and messy role descriptions are language tasks and suit agents.

```python
def create_account(employee_id: str, upn: str) -> str:
    key = f"create-account:{employee_id}"
    if (existing := store.get(key)):          # retry or duplicate event: return the first result
        return existing
    user = graph.create_user(upn=upn, ...)    # the real side effect
    store.put(key, user.id)
    return user.id
```

**Why the others are wrong:**
- **B, C, D:** answering questions, drafting text and interpreting messy input are tasks where a model adds value.

Source: https://learn.microsoft.com/en-us/agent-framework/overview/agent-framework-overview

</details>

### 2. Your team built a visual Foundry workflow last year. What should you plan for?

- A. Nothing; it is supported indefinitely
- B. Export the YAML and migrate to Microsoft Agent Framework (or Logic Apps) before December 1, 2026
- C. Convert it to a prompt agent only
- D. Delete it

<details><summary>Answer</summary>

**Correct: B.** The Foundry visual workflow designer and in-portal execution are being retired (**December 1, 2026**). Plan the migration now: **export the workflow YAML**, then rebuild it in **Microsoft Agent Framework** (code-first) or **Azure Logic Apps** (low-code); YAML definitions can also run as **hosted agents**. Steps: inventory workflows → export YAML → map each node to code or a Logic Apps action → add tests with your golden scenarios → run old and new in parallel → switch → retire.

**Why the others are wrong:**
- **A. Supported indefinitely:** it is retiring.
- **C. Prompt agent only:** loses orchestration (branching, approvals, retries).
- **D. Delete it:** unnecessary and loses the logic.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/workflow

</details>

### 3. A long-running provisioning step must survive a process restart and continue where it stopped. Which feature supports this?

- A. Higher temperature
- B. Workflow checkpointing with durable storage such as Cosmos DB
- C. Tool search
- D. Group chat

<details><summary>Answer</summary>

**Correct: B.** A long process can be killed by a deployment, a crash or scaling. **Checkpointing** saves the workflow state at **superstep boundaries** (after each round of executors finishes) to **durable storage** such as Cosmos DB or a database. After a restart the workflow **resumes from the last checkpoint** instead of starting over, so completed steps (for example "mailbox created") are not repeated. Steps must still be idempotent, because the step that was running at the crash may run again.

Walkthrough: steps = create account → assign license → provision laptop. The process dies during "provision laptop". On restart it loads the checkpoint after "assign license" and continues with the third step only.

**Why the others are wrong:**
- **A. Higher temperature:** randomness only.
- **C. Tool search:** helps pick tools from a large set.
- **D. Group chat:** an orchestration pattern (agents talk in one thread), not persistence.

Source: https://learn.microsoft.com/en-us/agent-framework/workflows/checkpoints

</details>

### 4. Three agents keep passing a task to each other and cost grows. What is the best fix?

- A. Add a fourth agent
- B. Narrow roles, add explicit termination and a maximum number of rounds, or replace agent steps with code
- C. Disable tracing
- D. Use a bigger model

<details><summary>Answer</summary>

**Correct: B.** Ping-pong loops come from **overlapping roles** (each agent thinks the other should finish) and **no stop rule**. Fix the design: give each agent a narrow role and tool set, define a **termination condition** (who declares "done" and what "done" means), cap the **maximum rounds**, and replace agent steps with plain code where the step is deterministic.

```python
MAX_ROUNDS = 6
for round_no in range(MAX_ROUNDS):
    result = reviewer.run(draft)
    if result.approved:                 # explicit termination
        break
    draft = writer.run(result.feedback)
else:
    escalate_to_human(draft)            # budget exhausted: do not loop forever
```

Also track tokens per outcome so cost growth is visible.

**Why the others are wrong:**
- **A. Add a fourth agent:** more coordination, more cost.
- **C. Disable tracing:** hides the problem.
- **D. Bigger model:** costs more and does not add a stop rule.

Source: case study section 9

</details>

### 5. Twenty agents all need the same Teams, Entra and knowledge tools, each with different authentication. What reduces duplicated configuration?

- A. A toolbox shared through one MCP-compatible endpoint with central authentication
- B. Hard-coding credentials in each agent
- C. One giant agent
- D. Disabling authentication

<details><summary>Answer</summary>

**Correct: A.** A **toolbox** is a named, versioned set of tools exposed through **one MCP-compatible endpoint**, with authentication configured once. Agents just connect to the toolbox; the tools, credentials, governance and versioning live in one place. When the Teams connection changes, you change it once instead of in 20 agents.

Compare: 20 agents × 3 tools = 60 configurations and 60 places for a credential to leak; with a toolbox it is 1 configuration per tool and 20 simple connections.

**Why the others are wrong:**
- **B. Hard-coded credentials / D. No authentication:** insecure.
- **C. One giant agent:** too many tools raise wrong tool choices and tokens, and it removes separation of duties.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/toolbox-overview

</details>

### 6. A resume field contains hidden instructions that make the Access agent over-grant access. Which controls reduce this risk?

- A. Treat form text as untrusted, apply tool response guardrails, enforce limits in code and require approval for grants
- B. Longer prompts only
- C. Remove approvals
- D. Share one identity across all agents

<details><summary>Answer</summary>

**Correct: A.** The resume is third-party data that reaches the Access agent as input or a tool result: an **indirect injection**. No single control is enough, so layer them:
1. Treat form text as **untrusted data** (clearly delimited, never mixed into instructions).
2. **Tool-response guardrail** (indirect attack control) before the agent reads it.
3. **Limits in code**: the grant tool only offers allowed bundles for the employee's role, whatever the model asks.
4. **Human approval** for access grants.
5. **Separate least-privilege identity** per agent so one compromised agent cannot do everything.

```python
ALLOWED = {"engineer": {"repo-read", "ci-read"}, "hr": {"hris-read"}}

def grant_access(employee_role: str, bundle: str):
    if bundle not in ALLOWED.get(employee_role, set()):
        raise PermissionError("Bundle not allowed for role")      # code, not prompt
    return request_approval(employee_role, bundle)
```

**Why the others are wrong:**
- **B. Longer prompts only:** can be overridden by injected text.
- **C. Remove approvals:** removes the last safety net.
- **D. One shared identity:** one compromise grants everything.

Source: case study sections 7 and 9

</details>

## Design questions

### 7. Design the approval and failure handling for the onboarding workflow.

<details><summary>Model answer and checklist</summary>

- **Approval** for hard-to-reverse actions (access grants): the workflow pauses with the proposal and evidence; limits enforced in code; approver and time logged; reminders and escalation if nobody answers.
- **Idempotent** steps with keys; **retries** with backoff for transient errors.
- **Checkpointed state** for long-running steps; timeouts.
- **Compensation** for partial completion (disable the account if provisioning fails); dead-letter queue for human attention.
- **Tracing** (`invoke_agent`, `plan`, `execute_tool`) with one trace per new hire.

</details>

### 8. How would you decide between a single agent, a workflow and multi-agent orchestration?

<details><summary>Model answer and checklist</summary>

1. Start with code or a single agent with tools; each step up adds cost, latency and failure modes.
2. Use a **workflow** when steps and order are known and approvals or retries matter.
3. Use **multiple agents** only when specialist roles or parallel work clearly help; give each a narrow role and tool set.
4. Choose the platform: Agent Framework for code-first orchestration; Logic Apps for low-code visual flows; A2A for lightweight hand-offs.
5. Measure: tokens per outcome, completion rate, human-change rate, stuck workflows.

</details>
