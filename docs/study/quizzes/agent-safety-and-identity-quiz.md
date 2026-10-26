---
note: docs/study/deep-dives/agent-safety-and-identity.md
skill: Implement responsible AI for agentic systems; govern agent behavior; configure security (managed identity, role policies)
retrieved: 2026-10-12
---

# Quiz: agent safety and identity

Answers and explanations come from the [deep dive](../deep-dives/agent-safety-and-identity.md), which cites Microsoft Learn. Try each question before opening the answer.

## Flashcards

**Q:** What is a guardrail in Foundry?
**A:** A named collection of **controls**. Each control = risk + intervention point + action.

**Q:** Name the four intervention points.
**A:** User input, tool call (Preview), tool response (Preview), output.

**Q:** Which intervention point defends against indirect prompt injection from tool results?
**A:** **Tool response**.

**Q:** What happens to a guardrail on a model when an agent has its own guardrail?
**A:** The agent's guardrail **fully overrides** the model's.

**Q:** Which guardrail is the default for models?
**A:** `Microsoft.DefaultV2`.

**Q:** How much latency does each intervention point add, roughly?
**A:** About **50 to 100 ms**.

**Q:** What are the two attack families in Prompt Shields?
**A:** **User prompt attacks** (the user attacks) and **document attacks** (a third party hides instructions in content).

**Q:** How does Spotlighting protect against document attacks?
**A:** It marks documents as lower trust by **base64-encoding** them. Preview, models via Chat Completions only, not agents.

**Q:** Which tool is used for adaptive attack simulation before release?
**A:** The **AI red teaming agent** (PyRIT-based).

**Q:** Which identity do unpublished agents in a project use for tool calls?
**A:** The **shared project identity**.

**Q:** What changes when you publish an agent?
**A:** It gets a **distinct agent identity**; roles from the shared project identity do not transfer.

**Q:** What is the recommended credential type for an agent identity blueprint?
**A:** A **federated credential** with a managed identity (no stored secret).

**Q:** Which role lets a service principal only call agent endpoints?
**A:** **Foundry Agent Consumer**.

**Q:** What does "audience" mean in agent token exchange?
**A:** The resource identifier of the downstream service the token is for (for example `https://storage.azure.com`).

**Q:** Can Prompt Shields miss injection text inside an image?
**A:** Yes, it may. OCR first, scan the extracted text, separate untrusted data, constrain output, grant no execution rights.

## Practice questions

### 1. A model deployment has a guardrail with Violence set to High on user input and output. An agent using that model has its own guardrail with Violence set to Low on user input and output, and no Violence control on tool calls or tool responses. How is Violence handled for the agent?

- A. Both guardrails apply, so High is enforced
- B. Input and output are scanned at Low; tool calls and tool responses are not scanned for Violence
- C. Everything is scanned at High because the model setting wins
- D. Tool calls and responses inherit High from the model

<details><summary>Answer</summary>

**Correct: B.** An agent's guardrail fully overrides its model's guardrail. Where the agent's guardrail has no control, that intervention point is not scanned for the risk.
**Incorrect:** A and C — the model's guardrail is not merged or preferred; D — nothing is inherited per intervention point.
Source: https://learn.microsoft.com/en-us/azure/foundry/guardrails/guardrails-overview

</details>

### 2. A customer-support agent summarizes web pages and uploaded files. A web page contains hidden text telling the agent to email internal data to an outside address. You need to stop the agent from acting on such hidden instructions and keep them out of its memory. Which control should you add to the agent's guardrail?

- A. A Hate control on the output intervention point
- B. A user prompt attack control on user input only
- C. A Protected material control on the output intervention point
- D. An Indirect attack control on the tool response intervention point with Annotate and block

<details><summary>Answer</summary>

**Correct: D.** Tool responses carry third-party content before it is saved to the agent's memory. An indirect attack control there stops the agent and prevents the malicious content from being stored.
**Incorrect:** A — hate detection does not detect instruction injection; B — the attack arrives via a tool result, not the user's message; C — protected material detection concerns copyrighted text.
Source: https://learn.microsoft.com/en-us/azure/foundry/guardrails/intervention-points

</details>

### 3. A banking agent has a `transfer_money` tool. Requirements: transfers above $500 need human approval, even if a user or document tries to talk the agent into skipping it. Which design best meets the requirement?

- A. Add "never transfer more than $500 without approval" to the system prompt
- B. Enforce the limit and the approval step inside the tool itself and give the agent a least-privilege identity
- C. Rely on the model deployment's content filter
- D. Lower the temperature to 0

<details><summary>Answer</summary>

**Correct: B.** Prompts guide behavior but can be bypassed. The limit must be enforced in code and permissions at the tool.
**Incorrect:** A — a prompt instruction can be overridden by prompt injection; C — content filters detect harmful content, not business rules; D — temperature does not enforce rules.
Source: deep dive section 4, based on https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat

</details>

### 4. A hosted agent calls an Azure Storage MCP tool successfully during development. After you publish it, every tool call fails with an authorization error, and nothing in the tool configuration changed. What should you do?

- A. Assign the required role to the new distinct agent identity that was created at publish time
- B. Recreate the project managed identity
- C. Switch the tool to key-based authentication permanently
- D. Add the Foundry Owner role to the end users

<details><summary>Answer</summary>

**Correct: A.** Unpublished agents use the shared project identity. Publishing creates a distinct agent identity, and the roles granted to the shared identity do not carry over.
**Incorrect:** B — the managed identity is not the principal that needs the role on the target resource; C — keys weaken security and are not the fix; D — end-user roles do not govern the agent's own access to Storage.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/agent-identity

</details>

### 5. An agent identity has the correct RBAC role on an Azure Storage account, but tool calls to an MCP server that proxies Storage are rejected. The connection's audience value is the URL of the MCP server. What is the most likely cause?

- A. The agent identity blueprint uses a federated credential
- B. The audience must be the resource identifier of the downstream service, such as `https://storage.azure.com`
- C. The agent identity must be assigned the Foundry User role
- D. Storage does not support OAuth

<details><summary>Answer</summary>

**Correct: B.** The audience must match the downstream service's resource identifier, not the MCP server's URL. A wrong audience fails even when RBAC is correct.
**Incorrect:** A — federated credentials are the recommended, working option; C — Foundry roles are not what Storage checks; D — Storage supports Entra tokens.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/agent-identity

</details>

### 6. You configured a Tool response control in a guardrail assigned to an agent that uses the Code Interpreter tool, but injected content is never blocked. What explains this?

- A. Tool response controls apply only to models
- B. Annotate and block is not allowed for agents
- C. Tool call and tool response controls take effect only for tools that support moderation, and Code Interpreter is not in the supported list
- D. Tool response controls require Spotlighting

<details><summary>Answer</summary>

**Correct: C.** Learn lists the tools that support moderation (for example Azure AI Search, Azure Functions, OpenAPI, SharePoint grounding, Fabric Data Agent, Bing grounding, Bing Custom Search, Browser Automation). For other tools those controls do not take effect.
**Incorrect:** A — the tool response intervention point is for agents; B — agents support Annotate and block; D — Spotlighting is a separate, model-only feature.
Source: https://learn.microsoft.com/en-us/azure/foundry/guardrails/intervention-points

</details>

### 7. Before releasing an agent, you must find vulnerabilities from attacks that adapt to the agent's responses, not only questions you already know. Which should you use?

- A. A larger evaluation dataset of fixed prompts
- B. The Groundedness evaluator
- C. Application Insights tracing
- D. The AI red teaming agent

<details><summary>Answer</summary>

**Correct: D.** The AI red teaming agent simulates attacks (PyRIT-based, such as jailbreaks and prompt injection) and scores results by risk category. Use it with human review, before release and on a schedule afterwards.
**Incorrect:** A — fixed datasets only replay known inputs; B — groundedness checks support from context, not attack resistance; C — tracing shows what happened, it does not generate attacks.
Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/observability

</details>

### 8. Which statement about Spotlighting is correct?

- A. It is generally available for agents
- B. It protects against user prompt attacks only
- C. It is a Preview feature that base64-encodes documents and is available for models through Chat Completions, not for agents
- D. It reduces token usage

<details><summary>Answer</summary>

**Correct: C.** Spotlighting tags documents as lower-trust by base64-encoding them. It is Preview, off by default, and not applicable to agents.
**Incorrect:** A — not supported for agents; B — it targets document attacks; D — base64 increases token count, which can raise cost or exceed input limits.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/content-filter-prompt-shields

</details>

### 9. A web application's backend service principal only needs to send messages to published agents. It must not create or edit agents. Which role gives the least privilege?

- A. Foundry Owner
- B. Foundry User
- C. Foundry Agent Consumer
- D. Foundry Project Manager

<details><summary>Answer</summary>

**Correct: C.** Foundry Agent Consumer grants access to interact with agent endpoints only.
**Incorrect:** A — full access to manage and build; B — allows building and developing in the project, more than needed; D — can publish agents and assign roles.
Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/rbac-foundry

</details>

### 10. When an agent invokes a tool, Foundry exchanges tokens with Microsoft Entra ID. Which credential option for the agent identity blueprint is recommended for production because it stores no secret?

- A. A client secret
- B. A certificate stored in the blueprint
- C. A shared API key
- D. A federated credential with a managed identity

<details><summary>Answer</summary>

**Correct: D.** A federated credential establishes trust with the project's managed identity, and Azure rotates credentials automatically.
**Incorrect:** A — needs manual rotation and secure storage; B — stronger than a secret but needs lifecycle management; C — API keys are not a blueprint credential type here.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/agent-identity

</details>

### 11. A vision app reads user-uploaded images that may hide instructions. Which mitigation helps most?

- A. Raise temperature
- B. OCR the image and scan the extracted text, keep it as untrusted data, and give the model no action permissions
- C. Use a longer system prompt only
- D. Disable logging

<details><summary>Answer</summary>

**Correct: B.** Image text may bypass text shields, so extract and check it and limit what the model can do.
**Incorrect:** A, C, D — do not control the attack path.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/content-filter-prompt-shields

</details>
