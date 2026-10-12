---
domain: Plan and manage an Azure AI solution
skill: Choose deployment options; manage quotas, scaling, rate limits and cost footprints for model and agent workloads
sources:
  - https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types
  - https://learn.microsoft.com/en-us/azure/foundry/foundry-models/quotas-limits
  - https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/provisioned-throughput
  - https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat
retrieved: 2026-10-12
---

# Deep dive: capacity, cost and throttling

Questions in this area describe a workload ("10,000 concurrent chats", "traffic spikes at 9 am", "nightly batch of 2 million documents") and ask which deployment, model or setting fits. This page gives you the model in your head to answer them.

Part of the [best practices overview](best-practices-and-real-world-scenarios.md). Items marked `[NEEDS VERIFICATION]` are not confirmed on Microsoft Learn.

---

## 1. The mental model: you are renting model capacity

Think of a deployment as a way to rent GPU capacity. Two questions decide everything:

1. **Do you pay for what you use, or for capacity you reserve?** (pay-per-token vs provisioned)
2. **Where may your data be processed?** (global, data zone, geography)

A third question, **how fast must it be?**, is answered by (1) plus the model you choose.

### Deployment families

| Family | You pay | Capacity | Latency promise | Pick when |
|---|---|---|---|---|
| **Standard** (Global, Data Zone, regional) | Per token | Shared with other customers, best effort | None | Development, testing, variable or spiky traffic |
| **Priority processing** | Per token at a priority rate | Shared, prioritized | A defined latency target per model | Latency-sensitive but no commitment |
| **Provisioned** (PTU) | Per PTU per hour (or reservation), **even when idle** | Dedicated to you | A defined latency target per model | Steady, high-volume, mission-critical |
| **Batch** | Per token, discounted (50%) | Separate batch quota | None; 24-hour target | Large jobs that are not time-sensitive |
| **Developer** | Per token | Shared | No SLA; 24-hour lifetime | Evaluating fine-tuned models only |

### Where data is processed

| Prefix | Meaning |
|---|---|
| **Global** | May be processed in any Azure region. Highest quota, newest models first, lowest price |
| **Data Zone** | Processed only within the zone (US, EU or APAC). Follows the Azure EU Data Boundary for EU |
| *(none)* Standard / Regional Provisioned | Processed within the Azure geography you pick |

Data **at rest** always stays in the designated geography; only **inference processing** location differs. Geography-based types arrive last for new models and have no guaranteed availability date.

SKU names for code and policy: `GlobalStandard`, `GlobalProvisionedManaged`, `GlobalBatch`, `DataZoneStandard`, `DataZoneProvisionedManaged`, `DataZoneBatch`, `Standard`, `ProvisionedManaged`, `DeveloperTier`.

---

## 2. Choosing: a decision procedure

Work top to bottom and stop at the first yes.

1. Data must stay in a specific country or region? → **Standard** or **Regional Provisioned** (geography). Data must stay in the EU/US/APAC zone? → **Data Zone** types.
2. Job is large, asynchronous and not time-sensitive? → **Batch** (Global or Data Zone).
3. Evaluating a fine-tuned model briefly? → **Developer**.
4. Traffic is steady, high, and latency must be consistent (SLO)? → **Provisioned**.
5. Traffic is spiky or unknown, you want to pay only for use? → **Global Standard** (the documented default) or **Standard**.
6. Need faster responses without a commitment? → **Priority processing** on pay-as-you-go.

**Why Provisioned is not "faster tokens":** it buys *reserved capacity*, so there is no neighbor competition. You get lower, **more consistent** latency and no throttling until your own capacity is full. Under Global Standard, customers with high sustained usage on a model may see more latency variability.

**Why Provisioned is wrong for spiky traffic:** you pay the hourly PTU rate all day, but your peak might last minutes. You size for the peak and waste the rest.

### Worked reasoning: two apps

| | App A: internal Q&A bot | App B: customer-facing copilot |
|---|---|---|
| Traffic | Office hours, unpredictable bursts, low volume | 24/7, high and steady, strict SLO |
| Choose | Global Standard pay-per-token | Provisioned (Global or Data Zone) with **spillover** to a standard deployment |
| Reason | Idle time costs nothing | Guaranteed capacity and consistent latency; spillover absorbs bursts |

---

## 3. PTU: the unit of provisioned capacity

- A **PTU (provisioned throughput unit)** is a normalized slice of model processing capacity. You choose a number; Foundry reserves it and **bills it hourly whether or not you send requests**.
- PTUs are **model-independent** (the same quota can deploy different models) but **region-specific** and per deployment type (Global, Data Zone and Regional Provisioned are separate quota pools).
- **Throughput per PTU depends on the model**: heavier models need more PTUs for the same tokens per minute. Each model has a **minimum** PTU count.

### Quota is not capacity
| | Quota | Capacity |
|---|---|---|
| What | A policy limit: maximum PTUs you may deploy (per subscription, region, deployment type) | Real PTUs available **right now** for a model version |
| Cost | Free | Billed once deployed |
| Guarantee | Having quota does **not** guarantee capacity | Allocated at deployment and held until you delete or scale down |

If capacity is short, the **deployment fails**. Check first in the portal or with the model capacities API; try fewer PTUs, another region, or retry later. Deleting or scaling down releases capacity back to the pool, with no promise you can get it back.

### Sizing (concept)
Three inputs: **request shape** (requests per minute, average input tokens, average output tokens), the model's **output-to-input ratio** (output tokens cost more capacity than input tokens), and your **cache rate** (cached input tokens do not consume PTU capacity). These are turned into one normalized tokens-per-minute figure, then divided by the model's **input TPM per PTU**. The portal has a capacity calculator. `[NEEDS VERIFICATION]` exact formulas on the sizing page.

### Spillover
When a provisioned deployment is full and returns a non-200 (such as **429**), **spillover** redirects the overflow to a **standard deployment in the same Foundry resource**. Enable it for all requests or per request with the `x-ms-spillover-deployment` header. Azure OpenAI models support it; DeepSeek and Llama deployments from other providers currently do not.

### Billing
- **Hourly** (per PTU per hour): good for benchmarking or a short event. Do **not** plan to scale up and down with daily traffic: capacity may not be there when you scale back up, and continuous hourly billing at high use usually costs more than a reservation.
- **Azure Reservation** (1 month or 1 year): a discount on the PTU meter, not tied to a particular deployment. A reservation **does not guarantee capacity**, so **create the deployment first, confirm capacity, then buy the reservation**.

---

## 4. Quota and rate limits for pay-per-token deployments

### Two units
- **TPM**: tokens per minute. **RPM**: requests per minute. Each unit of deployment capacity gives roughly 1,000 TPM and 1 RPM for the models listed in Learn's example (Grok 4.7 table). Your deployment's limit depends on the capacity you set and the quota you were allocated.

### Where quota lives (changed in 2026)
For models onboarded to **subscription-level quota management** (started after May 7, 2026):

- All **Global Standard** deployments of the same model and version in a subscription share **one pool across all regions**.
- All **Data Zone Standard** deployments share one pool **per data zone**.
- Existing quota carries over automatically.

Check the **Quota** page in the portal: the *Scope* column says Global, Data Zone (subscription-level) or a region (per-region). For models not onboarded, limits are per region, per subscription, per model or deployment type. Limits are enforced at the **subscription**, not the tenant.

Resource limits to remember: **100** Foundry resources per region per subscription, **250** projects per resource, **32** model deployments per resource, **10** custom headers per request (more gives HTTP 431).

### Usage tiers
Global Standard routes traffic dynamically for good availability. A customer's **usage** (tokens across all deployments, subscriptions and regions of the tenant, per model) determines the point after which latency may vary more.

### Increasing limits
Submit the quota increase request form (also in the portal's Quota page). Requests are evaluated individually and priority goes to customers who already use their quota. You can also **move quota from an unused deployment**. Partner and community models generally do not support increases (Anthropic models are an exception).

---

## 5. Handling HTTP 429 properly

**429 Too Many Requests** means you exceeded TPM or RPM. What to do:

1. **Retry with exponential backoff** (wait longer after each failure) and **honor the `Retry-After` header**.
2. **Ramp load gradually**; avoid sharp jumps, and test different ramp patterns.
3. **Give the deployment more quota** (move it or request an increase).
4. If it is chronic, move to **Provisioned** or add **spillover**, or add a **gateway** that spreads load.

```python
import random
import time

from openai import OpenAI, RateLimitError


def call_with_backoff(client: OpenAI, max_attempts: int = 5, **request):
    """Call the API, backing off on 429 and honoring Retry-After when present."""
    delay = 1.0
    for attempt in range(1, max_attempts + 1):
        try:
            return client.responses.create(**request)
        except RateLimitError as error:
            if attempt == max_attempts:
                raise
            retry_after = error.response.headers.get("retry-after")
            wait = float(retry_after) if retry_after else delay
            time.sleep(wait + random.uniform(0, 0.5))  # small jitter avoids retry stampedes
            delay *= 2
```

The shape follows the Learn guidance (exponential backoff plus `Retry-After`); the jitter is a common additional practice. `[NEEDS VERIFICATION]` that the SDK exposes `retry-after` exactly as shown for your SDK version.

**Related symptoms** from the troubleshooting table:

| Symptom | Cause | Fix |
|---|---|---|
| 429 | TPM or RPM exceeded | Backoff, `Retry-After`, more quota |
| 431 | More than 10 custom headers | Send 10 or fewer |
| Quota page shows 0 available | All quota allocated | Move quota or request an increase |
| Deployment type unavailable | Model does not support that type | Check availability by type and region |

Also watch **503** during peaks (monitor 429 and 503 together).

### Client timeouts
Set them explicitly; the library default may not match the service. Guidance: non-reasoning streaming up to **60 seconds**; non-streaming or reasoning models up to **29 minutes** (set lower, tuned to your traffic). Reasoning models generate and summarize all reasoning tokens **before** the first output token, so even streaming shows a long wait. The **reasoning effort** parameter controls how many reasoning tokens are produced.

---

## 6. Reducing cost without hurting quality

| Lever | How it saves | Caution |
|---|---|---|
| **Smaller model** | Lower price and latency per token | Validate with evaluations first |
| **Right deployment type** | Pay-per-token for spiky; provisioned for steady; batch for non-urgent | Do not scale PTUs up and down hourly |
| **Fewer connected tools** | The agent may invoke any tool on each request | Keep only what the task needs |
| **Cap output** (`max_output_tokens`, `truncation`) | Bounds tokens per response | Applies where you run orchestration yourself |
| **Prompt caching** | Cached input tokens do not consume PTU capacity | Needs repeated prefixes |
| **Batch** | 50% discount | 24-hour target, no real-time SLA |
| **Delete unused agents and conversations** | Stale data keeps using storage and RUs | Do it on a schedule |
| **Keep resources in one region** | Avoids cross-region bandwidth charges | Check residency rules |
| **Restrict playground use in production** | Prevents unplanned spend | Use pre-production for experiments |
| **Azure Policy** | Block expensive deployment types | Deny `sku.name` on `Microsoft.CognitiveServices/accounts/deployments` |

Flex processing (lower cost for delay-tolerant workloads) and priority processing (faster responses pay-as-you-go) are request-level options on Global Standard; priority is also available on Data Zone Standard.

---

## 7. Resilience: Foundry does not load-balance for you

Model deployments are not automatically load-balanced or failed over by Foundry. For production:

- Put a **gateway** such as Azure API Management in front for routing, health checks and circuit breaking across deployments or regions.
- Prefer **Data Zone or Global** types for resilience; **Standard** deployments are single-region without availability-zone support.
- Use **spillover** from provisioned to standard.
- Keep models in the **same region as the agents** to cut latency.
- Production SLOs need **Provisioned**: shared consumption is best effort and subject to noisy neighbors.

---

## 8. Exam traps

| Trap | Correct thinking |
|---|---|
| "Provisioned = cheaper" | It is cheaper only at sustained high utilization; it is billed even when idle |
| "I have PTU quota, so I can deploy" | Quota is not capacity; deployment can fail |
| "Buy a reservation first" | Create the deployment, confirm capacity, then reserve |
| "Scale PTUs with the traffic curve" | Capacity may not return; hourly billing at high use costs more |
| "Retry immediately on 429" | Backoff and honor `Retry-After`; ramp gradually |
| "Standard is the fix for residency" | Standard = geography; Data Zone = zone; Global = anywhere |
| "Batch for a chatbot" | Batch has no real-time SLA |
| "Foundry will fail over my deployments" | Add a gateway such as API Management |
| "A bigger model is safer" | Slower and costlier; choose the smallest that meets quality |
| "Quota is per resource" | For onboarded models it is per subscription pool; others per region, subscription and model |

## Sources

See the frontmatter. The two-app comparison and decision procedure are teaching syntheses of the cited guidance.
