---
note: docs/study/deep-dives/building-agents-with-foundry.md
skill: Build agents with Foundry Agent Service
retrieved: 2026-10-12
---

# Quiz: building agents with Foundry

Based on the [deep dive](../deep-dives/building-agents-with-foundry.md).

## Flashcards

**Q:** Three runtime components?
**A:** Agent, conversation, response.

**Q:** Who runs a function tool?
**A:** Your app, not the model.

**Q:** What item returns the function result?
**A:** function_call_output with call_id.

**Q:** Run expiry for function calls?
**A:** 10 minutes.

**Q:** Can the portal add function definitions?
**A:** No.

**Q:** Two memory types in the newest overview?
**A:** User profile memory and chat summary memory.

**Q:** Memory store recommendation?
**A:** One dedicated store per agent.

**Q:** Memory limits in preview?
**A:** 100 scopes per store, 10,000 memories per scope.

**Q:** Who executes a function tool, and who executes file search?
**A:** Your app runs function tools (return `function_call_output` with the same `call_id`); the agent service runs hosted tools such as file search.

**Q:** What does the orchestrator keep in the agent-as-tool pattern?
**A:** Control of the conversation; the remote or specialist agent returns a response and the orchestrator writes the final answer.

**Q:** Is the Connected Agents tool available in the new Foundry Agent Service?
**A:** No. Use the A2A tool (`a2a`, GA) or workflows; hosted agents can expose an agent as a function tool.

## Practice questions

### 1. A long task exceeds the function call window. What should the tool do?

- A. Disable strict
- B. Block for an hour
- C. Return a status and let the app poll
- D. Return secrets

<details><summary>Answer</summary>

**Correct: C.** Runs expire after 10 minutes; use polling.
**Incorrect:** the other options do not fit — wrong.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/runtime-components

</details>

### 2. Preferences like preferred name should be fetched when?

- A. Only at the end
- B. Once at conversation start
- C. Never
- D. Every token

<details><summary>Answer</summary>

**Correct: B.** User profile memory is retrieved once at start.
**Incorrect:** the other options do not fit — not recommended.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-memory

</details>

### 3. The model asks for a tool run. What comes next?

- A. Portal runs it
- B. App executes and returns function_call_output
- C. Model executes code
- D. Search index runs it

<details><summary>Answer</summary>

**Correct: B.** The app executes and returns the output.
**Incorrect:** the other options do not fit — wrong.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/runtime-components

</details>

### 4. Which unit is versioned and reusable?

- A. Response
- B. Agent
- C. Token
- D. Trace

<details><summary>Answer</summary>

**Correct: B.** Agents are versioned definitions.
**Incorrect:** the other options do not fit — not versioned.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/runtime-components

</details>

### 5. A model returns a function_call for `get_order`. What must the app do next?

- A. Nothing; the service runs it
- B. Run the function and send function_call_output with the same call_id and previous_response_id
- C. Redeploy the agent
- D. Switch to file search

<details><summary>Answer</summary>

**Correct: B.** The model only requests the call; the app executes it and replies with the matching call_id.
**Incorrect:** A — only hosted tools run server-side; C, D — unrelated.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/function-calling

</details>
