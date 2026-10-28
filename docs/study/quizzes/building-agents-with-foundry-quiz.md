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

**Correct: C.** A run that is waiting for function output **expires 10 minutes after it was created**, and the 10 minutes counts total elapsed time, not time inside one function. A tool that blocks for a long job will therefore lose the run. Make the tool return quickly with a **status** (for example a job ID and `"status": "running"`); the model tells the user the work started, and your app (or a later tool call such as `check_job`) **polls** for completion separately.

```python
def start_report(customer_id: str) -> dict:
    job_id = queue.enqueue(build_report, customer_id)      # returns immediately
    return {"job_id": job_id, "status": "running"}

def check_report(job_id: str) -> dict:
    return {"job_id": job_id, "status": queue.status(job_id)}
```

**Why the others are wrong:**
- **A. Disable strict:** `strict` only enforces the argument schema; it has no effect on time limits.
- **B. Block for an hour:** the run expires after 10 minutes.
- **D. Return secrets:** never do this; tool outputs go to the model and into logs.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/runtime-components

</details>

### 2. Preferences like preferred name should be fetched when?

- A. Only at the end
- B. Once at conversation start
- C. Never
- D. Every token

<details><summary>Answer</summary>

**Correct: B.** **User profile memory** holds stable facts (preferred name, language, dietary needs). It is retrieved **once at the start of a conversation** and injected as context, because those facts rarely change during a chat. Retrieving per token or per turn wastes calls and counts against request limits (preview: 1,000 requests per minute for search). **Chat summary memory** is different: it summarizes what happened in earlier conversations.

Memory is partitioned by `scope`. For per-user isolation set the scope to `{{$userId}}` on the memory search tool so each end user only sees their own memories.

**Why the others are wrong:**
- **A. Only at the end:** the agent would greet the user without knowing their name.
- **C. Never:** then memory has no value.
- **D. Every token:** not recommended; it is excessive and not how retrieval works.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-memory

</details>

### 3. The model asks for a tool run. What comes next?

- A. Portal runs it
- B. App executes and returns function_call_output
- C. Model executes code
- D. Search index runs it

<details><summary>Answer</summary>

**Correct: B.** A function tool is only a *request*: the model decides it needs `get_order`, and the response contains a `function_call` item with a `call_id` and JSON `arguments`. **Your app** runs the code (and your authorization checks), then sends the result back as a `function_call_output` item. The model then uses it to write the final answer.

```python
for item in response.output:
    if item.type == "function_call":
        result = get_order(**json.loads(item.arguments))
        outputs.append({"type": "function_call_output",
                        "call_id": item.call_id, "output": json.dumps(result)})
final = openai.responses.create(input=outputs, conversation=conversation.id, extra_body=ref)
```

**Why the others are wrong:**
- **A. Portal runs it:** the portal can run an agent but does not execute your function.
- **C. Model executes code:** the model only produces arguments.
- **D. Search index runs it:** unrelated; search is a hosted tool, not a function runner.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/runtime-components

</details>

### 4. Which unit is versioned and reusable?

- A. Response
- B. Agent
- C. Token
- D. Trace

<details><summary>Answer</summary>

**Correct: B.** Foundry has three runtime components: **agent** (the definition: model + instructions + tools), **conversation** (durable history), and **response** (one execution). Only the agent is **versioned and reusable**: each change creates a new version you can pin, test and roll back. A response is a single run, a token is a unit of text, and a trace is a telemetry record.

```python
agent = project.agents.create_version(
    agent_name="support",
    definition=PromptAgentDefinition(model="gpt-4.1-mini", instructions="Help with orders."),
)
print(agent.name, agent.version)   # a new version each time you call create_version
```

**Why the others are wrong:**
- **A. Response:** one step of work, not reusable.
- **C. Token:** a text unit used for billing and limits.
- **D. Trace:** observability data, not a definition.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/runtime-components

</details>

### 5. A model returns a function_call for `get_order`. What must the app do next?

- A. Nothing; the service runs it
- B. Run the function and send function_call_output with the same call_id and previous_response_id
- C. Redeploy the agent
- D. Switch to file search

<details><summary>Answer</summary>

**Correct: B.** The loop has five steps: (1) define the function tool, (2) send the user message, (3) the model returns a `function_call`, (4) **your app executes it and returns `function_call_output` with the same `call_id`**, (5) the model returns the final answer. Continue in the same conversation (or with `previous_response_id`) so the model can match your result to its request. If you forget to return the output, the agent returns a function call but never a final answer; if several calls were requested in parallel, return **all** of them.

**Why the others are wrong:**
- **A. The service runs it:** only *hosted* tools (file search, Azure AI Search, code interpreter, Bing grounding, MCP, OpenAPI) run server-side.
- **C. Redeploy the agent:** nothing is wrong with the agent.
- **D. Switch to file search:** that is a different tool and does not execute your function.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/function-calling

</details>
