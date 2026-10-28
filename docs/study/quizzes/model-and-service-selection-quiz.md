---
note: docs/study/deep-dives/model-and-service-selection.md
skill: Select models and deployment options
retrieved: 2026-10-12
---

# Quiz: model and service selection

Based on the [deep dive](../deep-dives/model-and-service-selection.md).

## Flashcards

**Q:** Two catalog categories?
**A:** Sold directly by Azure; partners and community.

**Q:** Preferred deployment option?
**A:** Serverless API.

**Q:** Managed compute in preview: content filtering?
**A:** Not available.

**Q:** Where are reasoning tokens billed?
**A:** As output tokens; they share the context window.

**Q:** Initial reserve for reasoning plus output?
**A:** At least 25,000 tokens.

**Q:** Which effort for latency-critical tasks?
**A:** none (where supported).

**Q:** Which API returns reasoning summaries?
**A:** Responses API only.

**Q:** How avoid silent model changes?
**A:** Pin model version, no auto-upgrade, evaluate before adopting.

## Practice questions

### 1. You need an open-source model on dedicated GPUs. Which option?

- A. Instant access
- B. Serverless API
- C. Managed compute
- D. Batch

<details><summary>Answer</summary>

**Correct: C.** Foundry offers several ways to run a model:
| Option | You get | Typical models |
|---|---|---|
| Serverless / standard deployment | Hosted by Azure, pay per token, no infrastructure | Catalog models |
| Provisioned | Reserved throughput (PTUs) | Azure-sold models |
| **Managed compute** | **Dedicated GPU VMs that you size and pay for per hour** | **Open-source and custom models** |
| Batch | Offline, discounted processing | Selected models |

If the requirement says "open-source model" plus "dedicated GPUs", the answer is managed compute. Remember you also pay for idle GPU time and manage quota for VM cores.

**Why the others are wrong:**
- **A. Instant access:** not a hosting option in this list.
- **B. Serverless API:** hosted catalog models without dedicated GPUs.
- **D. Batch:** offline processing, not a hosting option for open-source models.

Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/foundry-models-overview

</details>

### 2. A reasoning model returns an empty answer with status incomplete. What is likely?

- A. Reasoning consumed the token limit
- B. Missing tools
- C. Wrong endpoint
- D. Temperature too low

<details><summary>Answer</summary>

**Correct: A.** A reasoning model produces hidden **reasoning tokens** before the visible answer, and they **count toward the output token cap** (`max_output_tokens` / `max_completion_tokens`). If the cap is small, the model spends it all on thinking and stops with `status: incomplete` and no visible text. Fix: raise the cap (leave generous headroom, for example thousands of tokens), or lower `reasoning_effort`.

```python
r = client.responses.create(
    model="o-series-deployment",
    input="Plan a 3-step rollout.",
    max_output_tokens=4000,            # includes reasoning tokens
    reasoning={"effort": "low"},
)
if r.status == "incomplete":
    print(r.incomplete_details.reason)         # "max_output_tokens"
print(r.usage.output_tokens_details.reasoning_tokens)
```

**Why the others are wrong:**
- **B. Missing tools:** the model would answer without them.
- **C. Wrong endpoint:** you would get an error, not an incomplete answer.
- **D. Temperature too low:** reasoning models typically do not use temperature the way chat models do, and it would not empty the answer.

Source: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/reasoning

</details>

### 3. A voice assistant needs the lowest latency from a reasoning-capable model. What setting?

- A. Larger context
- B. reasoning_effort max
- C. Higher temperature
- D. reasoning_effort none

<details><summary>Answer</summary>

**Correct: D.** `reasoning_effort` controls how much the model thinks before it answers. `none` (where supported) minimizes or skips reasoning, giving the **lowest latency**, which a voice assistant needs. Higher levels (`low`, `medium`, `high`, and `max` where available) improve hard multi-step problems but cost more time and tokens.

```python
r = client.responses.create(model="gpt-5-deployment", input=user_text, reasoning={"effort": "none"})
```

(Supported effort values depend on the model; check the model page `[NEEDS VERIFICATION]`.)

**Why the others are wrong:**
- **A. Larger context:** bigger prompts are slower, not faster.
- **B. `max` effort:** the slowest setting.
- **C. Higher temperature:** changes randomness, not speed.

Source: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/reasoning

</details>

### 4. Which category gets Microsoft support and SLAs?

- A. Any marketplace model
- B. Unlisted models
- C. Sold directly by Azure
- D. Community

<details><summary>Answer</summary>

**Correct: C.** The model catalog groups models by who sells and supports them:
- **Sold directly by Azure:** billed by Microsoft under Microsoft product terms, with **Microsoft support and SLAs** (for example Azure OpenAI models and some partner models).
- **Partner and community models:** the **provider** supplies support and terms; billing may be through Azure Marketplace.
- Unlisted or community models you bring yourself: you are responsible.

So when a question asks for Microsoft support, SLA and enterprise-grade terms, pick the "sold directly by Azure" category.

**Why the others are wrong:**
- **A. Marketplace models:** support comes from the provider.
- **B. Unlisted models / D. Community:** no Microsoft SLA.

Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/foundry-models-overview

</details>
