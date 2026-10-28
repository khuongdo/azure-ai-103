---
note: docs/study/deep-dives/capacity-cost-and-throttling.md
skill: Choose deployment options; manage quotas, scaling, rate limits and cost footprints for model and agent workloads
retrieved: 2026-10-12
---

# Quiz: capacity, cost and throttling

Answers and explanations come from the [deep dive](../deep-dives/capacity-cost-and-throttling.md), which cites Microsoft Learn. Try each question before opening the answer.

## Flashcards

**Q:** What is the documented default deployment type to start with?
**A:** **Global Standard**.

**Q:** How is a provisioned deployment billed?
**A:** Per **PTU per hour**, even when idle (or through an Azure Reservation).

**Q:** What discount and turnaround do Batch deployments offer?
**A:** **50%** cheaper, **24-hour** target, no real-time SLA.

**Q:** Where is inference data processed for Data Zone types?
**A:** Only within the zone: **US, EU or APAC**.

**Q:** Which deployment type is meant only for evaluating fine-tuned models?
**A:** **Developer** (`DeveloperTier`): 24-hour lifetime, no SLA.

**Q:** Does having PTU quota guarantee you can deploy?
**A:** No. **Quota is a limit, capacity is availability**; the deployment fails if capacity is short.

**Q:** In what order should you create a deployment and buy a reservation?
**A:** Create the **deployment first**, confirm capacity, then buy the reservation.

**Q:** What is spillover?
**A:** Overflow from a full provisioned deployment is routed to a **standard deployment in the same Foundry resource**.

**Q:** Which header enables spillover per request?
**A:** `x-ms-spillover-deployment`.

**Q:** What should you do on an HTTP 429?
**A:** Retry with **exponential backoff** and honor the **`Retry-After`** header.

**Q:** What HTTP error occurs with more than 10 custom headers?
**A:** **431**.

**Q:** Which Azure service can add routing, health checks and circuit breaking across model deployments?
**A:** **Azure API Management** (Foundry does not load-balance deployments itself).

**Q:** Which policy field blocks a deployment type?
**A:** `sku.name` on `Microsoft.CognitiveServices/accounts/deployments`.

**Q:** Which factors drive PTU sizing?
**A:** Request shape, the output-to-input ratio, and the cache rate.

**Q:** What does prompt caching require?
**A:** A prompt of at least 1,024 tokens whose first 1,024 tokens are identical to an earlier request.

**Q:** Where should variable content go in a prompt that uses caching?
**A:** At the end; stable content (system message, tools, documents) goes first.

**Q:** Which response field shows a cache hit?
**A:** `cached_tokens` under `prompt_tokens_details` (0 means a miss).

## Practice questions

### 1. A customer-facing copilot has steady, high traffic around the clock and must meet a strict latency SLO. Data may be processed in any region. Which deployment type should you choose?

- A. Global Batch
- B. Developer
- C. Global Provisioned
- D. Standard

<details><summary>Answer</summary>

**Correct: C.** Two clues decide this: *steady high traffic 24/7* and a *strict latency SLO*. **Provisioned** deployments reserve dedicated capacity (PTUs), so throughput and latency are predictable, and steady load keeps the reserved units well used. **Global** routing is allowed because data may be processed in any region; it is the more available routing option. For a strict SLO you pay for capacity whether or not it is used, so it only makes sense when the load is steady.

| Need | Deployment type |
|---|---|
| Variable traffic, pay per token | Standard |
| Steady load, strict latency | Provisioned |
| Large offline jobs, 50% discount | Batch |
| Fine-tuned model evaluation | Developer |

**Why the others are wrong:**
- **A. Global Batch:** asynchronous with a 24-hour target; no real-time SLA.
- **B. Developer:** for evaluating fine-tuned models, no SLA.
- **D. Standard:** best effort, pay per token, so latency can vary under load.

Source: https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types

</details>

### 2. An internal bot is used mostly during office hours with unpredictable bursts and low volume. Cost should be near zero when idle. What should you deploy?

- A. Global Provisioned with 100 PTUs
- B. Global Standard (pay-per-token)
- C. Regional Provisioned
- D. Data Zone Provisioned

<details><summary>Answer</summary>

**Correct: B.** Low, bursty, office-hours traffic means idle time. **Pay-per-token** (Global Standard) bills only tokens actually processed, so the idle cost is zero. Provisioned types bill every hour for the reserved PTUs even when nobody asks a question. Rough *example*: if a 100-PTU deployment runs all night and weekend with no traffic, you pay for ~70% idle hours.

**Why the others are wrong:**
- **A, C, D (all Provisioned):** hourly billing for reserved units regardless of use; they are meant for steady, high, latency-sensitive loads.

Source: https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types

</details>

### 3. Regulations require that prompts and responses are processed only within the European Union, and the workload is pay-per-token with variable volume. Which deployment type fits?

- A. Global Standard
- B. Data Zone Standard (EU)
- C. Global Batch
- D. Developer

<details><summary>Answer</summary>

**Correct: B.** Residency decides the routing scope: **Global** may process anywhere, **Data Zone** processes only inside a zone (the EU zone follows the Azure EU Data Boundary), and **Regional** stays in one region. The workload is pay-per-token and variable, so the answer is **Data Zone Standard (EU)**. Remember that the *resource location* stores data at rest; the deployment type controls where inference happens.

```bash
az cognitiveservices account deployment create -g rg -n my-foundry \
  --deployment-name gpt-eu --model-name gpt-4.1 --model-version <version> --model-format OpenAI \
  --sku-name DataZoneStandard --sku-capacity 100
```

**Why the others are wrong:**
- **A. Global Standard:** may process in any region, breaking the EU requirement.
- **C. Global Batch:** asynchronous and global.
- **D. Developer:** for fine-tune testing, no residency guarantee.

Source: https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types

</details>

### 4. A nightly job must summarize 2 million documents. Results are needed within a day and cost matters more than speed. What should you use?

- A. Global Batch
- B. Global Provisioned
- C. Standard with a larger quota
- D. Priority processing

<details><summary>Answer</summary>

**Correct: A.** Two million documents with a one-day deadline and cost over speed is the textbook **Batch** case. You upload a JSONL file where each line is a request, the service processes it within a 24-hour target at a **50% discount**, and it uses a **separate enqueued-token quota**, so the job does not consume the quota your online users rely on.

```json
{"custom_id": "doc-0001", "method": "POST", "url": "/chat/completions",
 "body": {"model": "gpt-4.1-batch", "messages": [{"role": "user", "content": "Summarize: ..."}]}}
```

**Why the others are wrong:**
- **B. Global Provisioned:** hourly reserved capacity for steady real-time load; expensive for a nightly job.
- **C. Standard with larger quota:** full price per token, and it competes with interactive traffic.
- **D. Priority processing:** for latency-sensitive traffic at a higher rate.

Source: https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types

</details>

### 5. You have PTU quota in a region but creating a provisioned deployment fails with a capacity error. What explains this?

- A. Quota is billed and was exhausted
- B. Provisioned deployments are not available in any region
- C. Quota is a policy limit and does not guarantee that capacity is currently available; try fewer PTUs, another region, or retry later
- D. You must buy a reservation before deploying

<details><summary>Answer</summary>

**Correct: C.** **Quota** is the amount you are *allowed* to deploy (a policy limit, free of charge). **Capacity** is what the region physically has *right now*, and it changes through the day. Having 100 PTUs of quota does not mean 100 PTUs are available. If the region is short, the deployment fails.

What to do: check the capacity API or portal for the region, try fewer PTUs, try another region or deployment type (Global, Data Zone), or retry later. Buy a reservation only after the deployment succeeds.

**Why the others are wrong:**
- **A. Quota is billed:** quota has no cost.
- **B. Not available anywhere:** provisioned types exist in many regions.
- **D. Buy a reservation first:** reservations discount the bill but do not guarantee capacity.

Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/provisioned-throughput

</details>

### 6. Your provisioned deployment occasionally returns HTTP 429 during short bursts. You want overflow requests to be served without changing client code. What should you configure?

- A. Spillover to a standard deployment in the same Foundry resource
- B. A second provisioned deployment in another subscription
- C. A larger client-side timeout
- D. Developer deployment type

<details><summary>Answer</summary>

**Correct: A.** A provisioned deployment returns **429** when its PTUs are fully used. **Spillover** forwards those rejected requests to a standard (pay-per-token) deployment in the **same Foundry resource**, so clients keep calling the same endpoint with no code change. You can enable it for all requests on the deployment, or per request by sending the header `x-ms-spillover-deployment` with the name of the standard deployment.

```python
client.chat.completions.create(
    model="gpt-ptu", messages=messages,
    extra_headers={"x-ms-spillover-deployment": "gpt-standard"},  # per-request spillover
)
```

**Why the others are wrong:**
- **B. Second provisioned deployment in another subscription:** spillover targets a standard deployment in the same resource; this would need client or gateway routing.
- **C. Larger timeout:** waiting longer adds no capacity.
- **D. Developer type:** no SLA, only for fine-tune evaluation.

Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/provisioned-throughput

</details>

### 7. Your application receives HTTP 429 from a pay-per-token deployment during a traffic ramp. Which approach follows Microsoft guidance?

- A. Retry immediately in a tight loop
- B. Retry with exponential backoff, honor the `Retry-After` header and ramp load gradually
- C. Disable retries and surface the error to the user
- D. Increase the number of custom headers

<details><summary>Answer</summary>

**Correct: B.** A 429 means "too many requests/tokens right now". Microsoft guidance: **retry with exponential backoff**, respect the **`Retry-After`** value, avoid sharp changes in workload (ramp gradually), and request more quota if load is genuinely higher. Immediate retries add load and keep you throttled.

```python
import time, random
from openai import RateLimitError

def call_with_backoff(fn, max_attempts=6):
    for attempt in range(max_attempts):
        try:
            return fn()
        except RateLimitError as e:
            wait = float(e.response.headers.get("retry-after", 2 ** attempt))
            time.sleep(wait + random.random())      # jitter avoids synchronized retries
    raise RuntimeError("Still throttled")
```

(The OpenAI Python client also retries 429s automatically; tune with `max_retries`.)

**Why the others are wrong:**
- **A. Tight loop:** worsens throttling.
- **C. Disable retries:** transient throttling is normal and should be absorbed.
- **D. More custom headers:** more than 10 custom headers causes HTTP 431, and it does not help.

Source: https://learn.microsoft.com/en-us/azure/foundry/foundry-models/quotas-limits

</details>

### 8. A subscription has Global Standard deployments of the same model and version in three regions, and the model uses subscription-level quota management. How is quota allocated?

- A. Separately per region
- B. Separately per deployment
- C. Per resource group
- D. One shared quota pool across all regions in the subscription

<details><summary>Answer</summary>

**Correct: D.** For models onboarded to **subscription-level quota management**, quota is one pool shared by all **Global Standard** deployments of the same model and version across regions, so you can put the traffic where it fits. **Data Zone Standard** gets one pool per data zone. For models not yet onboarded, quota is per region (and per model), which is the older behavior.

**Why the others are wrong:**
- **A, B. Per region / per deployment:** the old per-region model.
- **C. Per resource group:** quota is never scoped to resource groups.

Source: https://learn.microsoft.com/en-us/azure/foundry/foundry-models/quotas-limits

</details>

### 9. You need automatic failover and circuit breaking between model deployments in two regions. What should you do?

- A. Rely on Foundry to load-balance deployments automatically
- B. Use Standard deployments, which fail over between regions
- C. Place a gateway such as Azure API Management in front of the deployments
- D. Increase the quota on one deployment

<details><summary>Answer</summary>

**Correct: C.** Foundry does **not** load-balance or fail over between model deployments. If region A is down or throttling, nothing moves your traffic to region B. Put a **gateway** such as Azure API Management in front: it routes by priority or weight, health-checks backends, retries, and trips a **circuit breaker** so a failing backend is skipped for a while.

Flow: client → APIM → backend pool [deployment East US (priority 1), deployment West Europe (priority 2)]. On 429/5xx from the first, APIM retries the second and marks the first unhealthy.

**Why the others are wrong:**
- **A. Foundry load-balances:** it does not.
- **B. Standard fails over:** Standard deployments are single-region and have no availability-zone failover.
- **D. More quota:** adds throughput, not failover.

Source: https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat

</details>

### 10. You bought an Azure Reservation for PTUs, then discovered the region had no capacity for your deployment. What should you have done?

- A. Delete the reservation to release capacity
- B. Nothing; reservations guarantee capacity
- C. Request more quota only
- D. Create the deployment first to confirm capacity, then purchase the reservation

<details><summary>Answer</summary>

**Correct: D.** An **Azure Reservation** discounts the PTU billing meter (a commitment of 1 month or 1 year). It does **not** reserve physical capacity. Correct order: (1) create the deployment, which proves capacity exists; (2) buy the reservation sized to the deployed PTUs. If you buy first and the region has no capacity, you pay for a discount you cannot use.

**Why the others are wrong:**
- **A. Delete the reservation:** deleting does not create capacity.
- **B. Reservations guarantee capacity:** they do not.
- **C. Request more quota:** quota is a limit, not availability.

Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/provisioned-throughput

</details>

### 11. An app sends a 3,000-token policy document with every 30-token question and needs lower cost and latency without changing answers. What helps most?

- A. Move the question to the start of the prompt
- B. Keep the document first and identical in every request so prompt caching applies
- C. Switch to a batch deployment
- D. Request more quota

<details><summary>Answer</summary>

**Correct: B.** **Prompt caching** reuses the processed *prefix* of a prompt. It applies when the first **1,024+ tokens are identical** across requests, so put stable content (instructions, the 3,000-token policy) first and the variable question last. You get lower latency and discounted cached input tokens, and answers do not change.

```python
messages = [
    {"role": "system", "content": POLICY_TEXT},     # identical every time: cacheable prefix
    {"role": "user", "content": question},          # changes: goes last
]
r = client.chat.completions.create(model="gpt-4.1", messages=messages)
print(r.usage.prompt_tokens_details.cached_tokens)   # 0 = miss, >0 = cache hit
```

**Why the others are wrong:**
- **A. Question first:** a changing prefix breaks the cache.
- **C. Batch:** asynchronous (24-hour target), not for interactive calls.
- **D. More quota:** raises throughput limits, not price or latency.

Source: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/prompt-caching

</details>
