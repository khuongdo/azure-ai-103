---
domain: Implement generative AI and agent solutions
skill: Apply prompt engineering, tune parameters, use grounding, reflection and hybrid LLM-plus-rules patterns
sources:
  - https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/prompt-engineering
  - https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/reasoning
retrieved: 2026-10-12
---

# Deep dive: prompt engineering, parameters and reflection

A model continues text with whatever is most likely to follow. A prompt is therefore not a command to a program; it is context that makes the right continuation likely. Good prompting is about reducing guesswork.

Learn states that these techniques are **not recommended for reasoning models** (such as gpt-5 and o-series); see section 8. Items marked `[NEEDS VERIFICATION]` are not confirmed on Microsoft Learn.

---

## 1. Parts of a prompt

Learn splits a prompt into five components (not all are needed every time):

| Part | Meaning | Example |
|---|---|---|
| **Instructions** | What to do | "Write an introduction for a weekly newsletter for Contoso." |
| **Primary content** | The text being transformed | The paragraph to translate or summarize |
| **Examples** | Input/output pairs (one-shot, few-shot); no examples = zero-shot | Three headlines with topics, then a new headline |
| **Cue** | Start of the answer that steers form | "Key Points:\n•" |
| **Supporting content** | Context that influences output but is not the target | Today's date, user preferences, "my important topics" |

In the Chat API these map to roles: instructions go in the **system message**; few-shot examples are sample **user** and **assistant** turns after it.

---

## 2. Techniques, each with a before and after

### 2.1 Be specific and descriptive
Vague: "Write about our product."
Better: "Write a 100-word product description for a business-traveller audience. Mention battery life and weight. Tone: factual."
*Why:* leaving less to interpretation restricts the space of likely continuations.

### 2.2 Start with clear instructions, and repeat them at the end
Models show **recency bias**: text near the end of the prompt weighs more. Learn notes that for newer chat models the effect of placing the task first was small in its test, but repeating key instructions at the end is still worth testing.

```text
SYSTEM: Answer only from the CONTEXT. If the answer is not in the CONTEXT, reply "not found".
CONTEXT: ...long retrieved text...
QUESTION: ...
REMINDER: Answer only from the CONTEXT, otherwise reply "not found".
```

### 2.3 Give the model an "out"
When the task may be impossible, allow a safe answer: "respond with 'not found' if the answer isn't present". This avoids invented answers.

### 2.4 Prime the output (cue)
End the prompt with the beginning of the format you want, for example `"Here's a bulleted list of key points:\n- "`. Learn's example: the cue "One possible search query is:" makes the model produce **one** query instead of several.

### 2.5 Clear syntax
Use separators and labeled sections (`---`, UPPERCASE headings). If unsure, use **Markdown or XML**: models have seen a lot of both. A separator can double as a stop condition.

### 2.6 Break the task down
Instead of "fact-check this paragraph", do two steps: (1) extract factual claims, (2) write search queries for each claim. Each step is easier and easier to inspect.

### 2.7 Use affordances (tools)
Let the model call search instead of relying on memory. Simple form: stop when the model emits `SEARCH("query")`, run the search, paste the results back and ask for a verdict. In Foundry you do this with tools and function calling (see [Building agents](building-agents-with-foundry.md)).

### 2.8 Specify the output structure and ask for citations
"Do not fabricate" is a weak instruction. Asking for **inline citations** forces two errors for an invention (a false statement and a false citation) and makes checking easy; closer citations work better than citations at the end. Ask for a structure such as `BEHAVIOR("reason")` or JSON; for extraction, a triple `(entity1, relationship, entity2)` avoids compound claims.

### 2.9 Provide grounding context
The most effective way to get reliable answers is to give the data to answer from. The closer the source is to the final answer, the less the model must do. This is the basis of RAG (see [Retrieval and grounding](rag-retrieval-and-grounding.md)). Even then, validate outputs: a prompt that worked in one scenario may not generalize.

### 2.10 Few-shot examples
Examples condition the model for **this call only** (nothing is learned permanently). Learn's headline example: three labeled headlines make the model answer "Basketball" correctly even though that label was never shown. Choose examples that show edge cases; their **order can matter**.

### 2.11 Chain of thought (non-reasoning models only)
Ask for step-by-step reasoning before the final answer, in a fixed format ("ANSWER is: <name>"). It reduces errors and makes review easier. **Do not** use it with reasoning models, and do not try to extract hidden reasoning (see section 7).

---

## 3. Space efficiency (tokens)
Prompts compete for the context window. Learn's tips: tables are compact for tabular data; consecutive spaces cost tokens; spelling out a month can use fewer tokens than a fully numeric date. Trim retrieved context to what matters.

## 4. Parameters

| Parameter | Effect | Guidance |
|---|---|---|
| `temperature` (0 to 2) | Randomness | About 0.2 for focused, concrete output (legal text, extraction); about 0.7 for more varied output (stories) |
| `top_p` | Nucleus sampling, a different way to control randomness | **Change one of temperature or top_p, not both** |
| `max_output_tokens` | Output cap | For reasoning models it also covers reasoning tokens |
| `reasoning_effort` | Thinking depth | See [Model selection](model-and-service-selection.md) |

*How to check:* run the same prompt 10 times at your chosen temperature. If a classification changes between runs, lower the temperature or tighten the labels.

---

## 5. A prompt-improvement loop (step by step)
1. **Write the test first:** 30 to 50 real inputs with expected outcomes, including a few that should be refused.
2. **Baseline:** run the simple prompt; record the score.
3. **Change one thing** (add an out, add two examples, add a cue).
4. **Re-run** and compare. Keep the change only if the metric improves.
5. **Review failures by hand;** each failure suggests the next change.
6. **Lock** the prompt in version control with its test results.

*What can go wrong:* tuning to the examples you can see (overfitting), several changes at once, no test for refusals.

## 6. Reflection (self-critique) pattern
`[NEEDS VERIFICATION]` A Learn page naming this as a feature was not read; treat it as a design pattern.

1. **Generate** a draft.
2. **Critique:** the same or another model checks the draft against explicit criteria ("every claim has a citation", "tone is neutral").
3. **Revise** using the critique.
4. **Stop** after a fixed number of rounds (often one or two) or when the criteria pass.

*Trade-off:* each round is another call (cost and latency). Use it where errors are expensive. If criteria are objective (JSON valid, citation present, number matches source), check them with **code or an evaluator** instead of asking a model.

## 7. Hybrid LLM and rules
Use rules for exact, auditable decisions and the model for language.
- Rule: "refunds over $200 need approval" is enforced in code, not in the prompt.
- Model: classify the customer's message, draft the reply.
- Glue: validate the model's JSON against a schema; reject and retry or escalate on failure.

## 8. Reasoning models
For reasoning models Learn says the techniques above are not recommended, and that extracting reasoning by any means other than the reasoning-summary parameter is unsupported and may violate the Acceptable Use Policy. Keep prompts short and goal-oriented, use the developer message, and control cost with `reasoning_effort` and token caps.

---

## Sources
- [Prompt engineering techniques](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/prompt-engineering)
- [Reasoning models](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/reasoning)
