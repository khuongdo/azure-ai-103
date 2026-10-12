---
domain: Generative AI and agents
skill: Implement orchestrated multi-agent solutions; build autonomous or semiautonomous workflows with safeguards and approval controls; orchestrate multiple models, flows, or hybrid LLM and rules engines
sources:
  - https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/toolbox-overview
  - https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/workflow
  - https://learn.microsoft.com/en-us/agent-framework/overview/agent-framework-overview
  - https://learn.microsoft.com/en-us/azure/foundry/agents/overview
  - https://learn.microsoft.com/en-us/azure/foundry/observability/concepts/trace-agent-concept
  - https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/agent-identity
retrieved: 2026-10-12
---

# Real-world: multi-agent workflow automation (employee onboarding)

Part of [Real-world practice](index.md).

## 1. The problem

When someone joins a 5,000-person company, an onboarding coordinator must: answer policy questions, create the Microsoft Entra account, request laptop and software, grant access to systems, enroll them in training, draft a personalized welcome email, and post in the team's Teams channel. It touches six systems, three teams, and takes days of copy-pasting and chasing approvals.

**Goals**

- Automate the repeatable steps with AI where judgment or language is needed, and with plain code where it is not.
- Keep **humans in control** of risky steps (access grants, spending).
- Handle partial failure and long-running steps (a laptop order takes days).
- Be auditable: who or what did what, when, and why.

## 2. Why this is an AI-103 problem

| Need | Skill area |
|---|---|
| Specialist agents, orchestration, agent-to-agent calls | Implement orchestrated multi-agent solutions |
| Approval steps and safeguards | Autonomous or semiautonomous workflows |
| Combine models, flows and rules | Orchestrate multiple models, flows or hybrid LLM + rules engines |
| Identity, tool access control | Responsible AI and security |

## 3. First decision: do you need agents at all?

Microsoft's own guidance is blunt: *if you can write a function to handle the task, do that instead of using an AI agent.* Use this split:

| Use an agent when... | Use a workflow (explicit steps) when... |
|---|---|
| The task is open-ended or conversational | The process has well-defined steps |
| You need autonomous tool use and planning | You need explicit control over execution order |
| A single LLM call (possibly with tools) suffices | Multiple agents or functions must coordinate |

For onboarding, the **backbone is a workflow** (deterministic order, approvals, retries) and **agents are used inside it** where language or judgment is needed (answering questions, drafting the email, deciding which software bundle fits a role description).

## 4. Where to orchestrate: an important change

- **Foundry workflows** (the visual designer with sequential, group-chat and human-in-the-loop patterns, branching, variables and Power Fx) are **Preview and being retired on December 1, 2026.** The docs direct new work to **Microsoft Agent Framework**. After that date the visual designer and in-portal execution are not supported, although Foundry continues to run YAML-based workflow definitions deployed as a **hosted agent**. Export your workflow YAML before the retirement if you have any.
- **Microsoft Agent Framework** (Python, .NET and Go in preview) provides agents, workflows (graph-based, with explicit execution paths), middleware, session state, tools and MCP clients, and OpenTelemetry-based observability. It is the successor to Semantic Kernel and AutoGen. You can run its workflows in Foundry as a **hosted agent**.
- **Azure Logic Apps** is the option if you want a low-code visual designer that mixes deterministic steps (built-in actions, APIs, MCP servers) with Foundry agents.
- **Agent-to-agent (A2A)** suits lightweight handoffs: expose an agent as an A2A endpoint and let another agent call it (A2A v1.0 is GA, v0.3 Preview).

Pick the **simplest** that fits: a single agent with tools; then a workflow; then multi-agent orchestration. Each step adds cost, latency and failure modes.

## 5. Solution architecture

```
HR system event: "new hire accepted"
          │
          ▼
  Onboarding workflow (Agent Framework, hosted agent)
          │
   ┌──────┼───────────────────────────────────────────────────────────────┐
   │ 1. Create identity     → function/REST tool (deterministic, idempotent)│
   │ 2. Determine access    → "Access agent" (reads role, proposes bundle)  │
   │        └─ HUMAN APPROVAL (manager / IT)  ◄── approval node           │
   │ 3. Provision resources → long-running agent / function with retries    │
   │ 4. Policy Q&A          → "Knowledge agent" (knowledge base, citations) │
   │ 5. Welcome email       → "Comms agent" (drafts; human can edit)        │
   │ 6. Post to Teams       → MCP server tool                               │
   └──────────────────────────────────────────────────────────────────────┘
          │
   Toolbox (one managed MCP endpoint, central auth, versioned) shared by agents
          │
   Tracing (invoke_agent / plan / execute_tool spans) → Application Insights
```

This mirrors the example in Learn's toolbox article: onboarding needs knowledge retrieval, a REST API for the Entra account, a long-running agent for provisioning, agent skills for the welcome email, and an MCP server for Teams. That is five tool types and five authentication models for one agent, which is why a **toolbox** (curate once, expose through one MCP-compatible endpoint, authenticate centrally, version, govern) pays off as agents multiply.

### Toolbox facts to design with
- Supported in a toolbox: MCP, web search, Azure AI Search, code interpreter, file search, OpenAPI, A2A, browser automation, Fabric IQ, Work IQ, plus tool search and skills (Preview) and the reminder tool. Function calling runs client-side and is not in a toolbox.
- **Tool search (Preview)** hides tool definitions behind `tool_search` and `call_tool` so a toolbox with hundreds of tools does not bloat context or hurt selection accuracy. **Skills (Preview)** package reusable multi-step workflows, versioned and immutable.
- **Versioning:** create and test a new toolbox version, then promote it to default; consuming agents pick it up without redeploying.

### Walkthrough: what happens for one new hire

Example: **Mai Tran** accepts a job as a data analyst, starting on Monday.

1. **Trigger.** The HR system emits "new hire accepted" with role, manager, location and start date. The workflow starts and a **trace** begins; its ID follows every later step.
2. **Create the identity (code, not AI).** A deterministic tool creates the Microsoft Entra account. It uses an idempotency key (employee ID), so if the step is retried no second account appears. *Why not an agent:* the rule is fixed and the action is sensitive, so predictable code is safer than model judgment.
3. **The Access agent proposes access.** It reads Mai's role and the company's access catalog and proposes a bundle: analytics workspace, data catalog read access, standard laptop. Language and judgment are useful here because role descriptions are messy.
4. **Human approval.** The workflow **pauses** and sends an approval request to Mai's manager and IT with the proposed bundle and the reasoning. Hard-to-reverse changes require a person. The workflow resumes only after approval, and the approver and time are logged. If nobody answers in two days, a reminder goes out.
5. **Provision resources (long-running).** A long-running step orders the laptop and grants access in several systems, each with retries and timeouts. State is **checkpointed**, so a restart continues where it stopped. If a later grant fails, a **compensation** step disables what was already created.
6. **The Knowledge agent answers questions.** During the first week Mai asks policy questions in chat. This agent searches the knowledge base and answers with citations, running as Mai.
7. **The Comms agent drafts the welcome email.** It combines the role, team and start details into a personal message; a person can edit before it is sent. It has no access to salary or sensitive data.
8. **Post to Teams (MCP tool).** The team channel receives a welcome post through an MCP server tool exposed by the toolbox.
9. **Completion and audit.** The workflow records every action, approval and tool call. Dashboards show step durations and stuck onboardings; the trace shows `invoke_agent`, `plan` and `execute_tool` spans for each agent.

## 6. Build steps

1. **Draw the process as a flow chart first**, with owner, system, risk and failure handling for each step. Mark which steps need language/judgment (agent) and which are rules (code).
2. **Implement deterministic steps as tools or functions** with idempotency keys so retries are safe.
3. **Create specialist agents with narrow roles** (access, knowledge, comms). One clear job each; narrow tool sets; explicit outputs (use structured output where supported, or validate in code).
4. **Wire the workflow** in code. A minimal agent in Agent Framework (Python) looks like this (adapted from Learn's overview sample):

```python
from agent_framework import Agent
from agent_framework.foundry import FoundryChatClient
from azure.identity import AzureCliCredential

agent = Agent(
    client=FoundryChatClient(
        project_endpoint="https://<your-foundry-service>.services.ai.azure.com/api/projects/<your-project>",
        model="<model-deployment-name>",
        credential=AzureCliCredential(),
    ),
    name="KnowledgeAgent",
    instructions="Answer onboarding policy questions only from the knowledge base and cite sources.",
)

result = await agent.run("What is the laptop refresh policy for new hires?")
print(result)
```

Use a managed identity credential in production rather than the Azure CLI credential used for local development. Workflow wiring (sequential, concurrent, handoff, group chat) is described in the Agent Framework workflow docs. `[NEEDS VERIFICATION]` exact orchestration class names and checkpoint APIs before writing production code.

5. **Insert approvals** where an action is hard to reverse: the workflow pauses, sends an approval request with the proposed action and evidence, and resumes only on approval. Enforce limits in code.
6. **Give every agent its own identity and least privilege.** Agents that only draft text need no write access. For system actions use the agent identity with narrow roles; for user-specific data use on-behalf-of. See [agent identity](../deep-dives/agent-safety-and-identity.md).
7. **Plan for long-running steps.** Persist workflow state (checkpoints), poll or react to events, set timeouts, and define what happens when a step never completes (reminder, escalation).
8. **Handle failure explicitly.** Retries with backoff for transient errors; compensation for partial completion (disable the account if provisioning fails); a dead-letter queue for human attention.
9. **Add guardrails per agent** (they apply to agents built in Foundry Agent Service) and moderation on tool calls and responses where supported.
10. **Trace everything.** Multi-agent traces use standard spans (`invoke_agent`, `plan`, `execute_tool`, memory operations) and attributes for tool arguments and results; correlate evaluation run IDs with traces.

## 7. Quality and safety plan

- **End-to-end tests** with synthetic new hires (different roles, regions, edge cases such as contractors, name conflicts, missing manager).
- **Agent-level evaluators:** Task Completion and Task Adherence for the workflow outcome; Tool Selection and Tool Input Accuracy for the access agent; Groundedness for the knowledge agent; Intent Resolution where users ask free-form questions.
- **Safety tests:** can a crafted resume or form field inject instructions into the access agent? (Third-party content in tool responses is an indirect-attack vector.) Can the comms agent leak salary details?
- **Human oversight metrics:** approval rate, time-to-approve, how often humans change the agent's proposal. A high change rate means the agent is not ready for more autonomy.
- **Autonomy ladder:** start with "agent proposes, human approves everything"; lower approval requirements step by step as measured accuracy supports it.

## 8. Operating it

- **Observability:** one trace per new hire from event to completion; dashboards for step durations, stuck workflows and approvals waiting.
- **Cost:** multi-agent designs multiply model calls; measure tokens per onboarding; use small models for simple agents; avoid agents talking in circles.
- **Reliability:** idempotent steps, checkpoints, retries; separate resources for production; infrastructure as code. See [production delivery](shipping-ai-apps-to-production.md).
- **Change control:** immutable agent versions, toolbox versions, evaluation gates before promotion.
- **Audit:** keep the proposal, approver, timestamp and the final action for every privileged change.

## 9. What goes wrong in practice

| Symptom | Likely cause | Fix |
|---|---|---|
| Agents bounce a task between each other | Overlapping roles, no stop rule | Narrow roles; explicit termination; maximum turns |
| Cost per onboarding grows | Chatty multi-agent loop | Replace agent steps with code where possible; cap rounds |
| Duplicate accounts after a retry | Non-idempotent tool | Idempotency keys |
| Workflow stuck for days | Waiting on an approval nobody sees | Reminders, escalation, dashboards |
| Agent grants too much access | Instruction-only limit | Enforce in code; approvals; least-privilege roles |
| Hidden instructions in a form change behavior | Indirect prompt injection | Tool response guardrails; treat form text as data |
| Visual workflow stops being supported | Foundry workflows retire on December 1, 2026 | Migrate to Agent Framework (or Logic Apps) |
| Can't see why a step failed | No tracing across agents | Instrument all agents; trace IDs in logs |

## 10. Variations

- **Procure-to-pay:** extraction agent + validation rules + approval workflow. See [document automation](document-processing-automation.md).
- **IT helpdesk:** a router agent hands off to specialists (network, access, hardware).
- **Incident response:** parallel investigation agents with a human incident commander approving actions.

## Sources and open items

See the frontmatter. The onboarding design extends the example in Learn's toolbox overview; approval node placement and metrics are illustrative. `[NEEDS VERIFICATION]` Agent Framework orchestration APIs, hosted-agent packaging details, and A2A authentication specifics for your tenant.
