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

**Correct: A.** Fixed, sensitive, repeatable steps belong in deterministic code.
**Incorrect:** B, C, D — language and judgment tasks suit agents.
Source: https://learn.microsoft.com/en-us/agent-framework/overview/agent-framework-overview

</details>

### 2. Your team built a visual Foundry workflow last year. What should you plan for?

- A. Nothing; it is supported indefinitely
- B. Export the YAML and migrate to Microsoft Agent Framework (or Logic Apps) before December 1, 2026
- C. Convert it to a prompt agent only
- D. Delete it

<details><summary>Answer</summary>

**Correct: B.** The designer and in-portal execution are being retired; YAML definitions can run as hosted agents.
**Incorrect:** A — retiring; C — loses orchestration; D — unnecessary.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/workflow

</details>

### 3. A long-running provisioning step must survive a process restart and continue where it stopped. Which feature supports this?

- A. Higher temperature
- B. Workflow checkpointing with durable storage such as Cosmos DB
- C. Tool search
- D. Group chat

<details><summary>Answer</summary>

**Correct: B.** Checkpoints save workflow state at superstep boundaries and can be resumed.
**Incorrect:** A, C, D — unrelated.
Source: https://learn.microsoft.com/en-us/agent-framework/workflows/checkpoints

</details>

### 4. Three agents keep passing a task to each other and cost grows. What is the best fix?

- A. Add a fourth agent
- B. Narrow roles, add explicit termination and a maximum number of rounds, or replace agent steps with code
- C. Disable tracing
- D. Use a bigger model

<details><summary>Answer</summary>

**Correct: B.** Overlapping roles and no stop rule cause loops.
**Incorrect:** A, C, D — worsen or hide the problem.
Source: case study section 9

</details>

### 5. Twenty agents all need the same Teams, Entra and knowledge tools, each with different authentication. What reduces duplicated configuration?

- A. A toolbox shared through one MCP-compatible endpoint with central authentication
- B. Hard-coding credentials in each agent
- C. One giant agent
- D. Disabling authentication

<details><summary>Answer</summary>

**Correct: A.** Toolboxes centralize credentials, governance and versioning.
**Incorrect:** B and D — insecure; C — not scalable.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/toolbox-overview

</details>

### 6. A resume field contains hidden instructions that make the Access agent over-grant access. Which controls reduce this risk?

- A. Treat form text as untrusted, apply tool response guardrails, enforce limits in code and require approval for grants
- B. Longer prompts only
- C. Remove approvals
- D. Share one identity across all agents

<details><summary>Answer</summary>

**Correct: A.** Indirect injection arrives via third-party data; enforcement and approvals limit damage.
**Incorrect:** B — insufficient; C and D — increase risk.
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
