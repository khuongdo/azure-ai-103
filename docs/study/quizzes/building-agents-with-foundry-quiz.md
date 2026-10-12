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
