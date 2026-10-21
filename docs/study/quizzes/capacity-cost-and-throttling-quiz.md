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

**Correct: C.** Provisioned deployments reserve dedicated capacity for predictable throughput and consistent latency, and Global routing fits the unrestricted region requirement.
**Incorrect:** A — Batch has no real-time SLA; B — Developer is for fine-tuned model evaluation with no SLA; D — Standard is best effort and pay-per-token for variable traffic.
Source: https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types

</details>

### 2. An internal bot is used mostly during office hours with unpredictable bursts and low volume. Cost should be near zero when idle. What should you deploy?

- A. Global Provisioned with 100 PTUs
- B. Global Standard (pay-per-token)
- C. Regional Provisioned
- D. Data Zone Provisioned

<details><summary>Answer</summary>

**Correct: B.** Pay-per-token has no cost when idle, which suits spiky and low-volume traffic.
**Incorrect:** A, C and D — provisioned types bill hourly for reserved PTUs whether or not requests arrive.
Source: https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types

</details>

### 3. Regulations require that prompts and responses are processed only within the European Union, and the workload is pay-per-token with variable volume. Which deployment type fits?

- A. Global Standard
- B. Data Zone Standard (EU)
- C. Global Batch
- D. Developer

<details><summary>Answer</summary>

**Correct: B.** Data Zone Standard processes data only within the specified data zone (EU follows the Azure EU Data Boundary) and bills per token.
**Incorrect:** A — Global can process in any region; C — Global Batch is asynchronous and may process in any region; D — Developer is for fine-tuned model testing with no residency guarantee.
Source: https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types

</details>

### 4. A nightly job must summarize 2 million documents. Results are needed within a day and cost matters more than speed. What should you use?

- A. Global Batch
- B. Global Provisioned
- C. Standard with a larger quota
- D. Priority processing

<details><summary>Answer</summary>

**Correct: A.** Batch handles large asynchronous jobs at a 50% discount with a 24-hour target and its own enqueued token quota, so it does not disrupt online workloads.
**Incorrect:** B — provisioned capacity is billed hourly and suits steady real-time load; C — pay-per-token at full price costs more; D — priority processing is for latency-sensitive workloads and uses a higher rate.
Source: https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types

</details>

### 5. You have PTU quota in a region but creating a provisioned deployment fails with a capacity error. What explains this?

- A. Quota is billed and was exhausted
- B. Provisioned deployments are not available in any region
- C. Quota is a policy limit and does not guarantee that capacity is currently available; try fewer PTUs, another region, or retry later
- D. You must buy a reservation before deploying

<details><summary>Answer</summary>

**Correct: C.** Quota and capacity are different. Capacity changes through the day, and the deployment fails if the region lacks enough PTUs.
**Incorrect:** A — quota has no cost; B — provisioned types are available in many regions; D — reservations do not guarantee capacity and should be bought after the deployment succeeds.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/provisioned-throughput

</details>

### 6. Your provisioned deployment occasionally returns HTTP 429 during short bursts. You want overflow requests to be served without changing client code. What should you configure?

- A. Spillover to a standard deployment in the same Foundry resource
- B. A second provisioned deployment in another subscription
- C. A larger client-side timeout
- D. Developer deployment type

<details><summary>Answer</summary>

**Correct: A.** Spillover redirects requests that a full provisioned deployment would reject (such as 429) to a corresponding standard deployment in the same Foundry resource. It can apply to all requests or per request with `x-ms-spillover-deployment`.
**Incorrect:** B — spillover targets a standard deployment in the same resource; C — timeouts do not add capacity; D — Developer has no SLA and is for fine-tune evaluation.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/provisioned-throughput

</details>

### 7. Your application receives HTTP 429 from a pay-per-token deployment during a traffic ramp. Which approach follows Microsoft guidance?

- A. Retry immediately in a tight loop
- B. Retry with exponential backoff, honor the `Retry-After` header and ramp load gradually
- C. Disable retries and surface the error to the user
- D. Increase the number of custom headers

<details><summary>Answer</summary>

**Correct: B.** Learn recommends retry logic with exponential backoff, using the `Retry-After` value, avoiding sharp workload changes and raising quota if needed.
**Incorrect:** A — it worsens throttling; C — transient throttling is expected and should be retried; D — more than 10 custom headers causes HTTP 431.
Source: https://learn.microsoft.com/en-us/azure/foundry/foundry-models/quotas-limits

</details>

### 8. A subscription has Global Standard deployments of the same model and version in three regions, and the model uses subscription-level quota management. How is quota allocated?

- A. Separately per region
- B. Separately per deployment
- C. Per resource group
- D. One shared quota pool across all regions in the subscription

<details><summary>Answer</summary>

**Correct: D.** For models onboarded to subscription-level quota management, all Global Standard deployments of the same model and version in a subscription share one pool across regions. Data Zone Standard shares one pool per data zone.
**Incorrect:** A and B — that is how per-region quota works for models that are not onboarded; C — quota is not scoped to resource groups.
Source: https://learn.microsoft.com/en-us/azure/foundry/foundry-models/quotas-limits

</details>

### 9. You need automatic failover and circuit breaking between model deployments in two regions. What should you do?

- A. Rely on Foundry to load-balance deployments automatically
- B. Use Standard deployments, which fail over between regions
- C. Place a gateway such as Azure API Management in front of the deployments
- D. Increase the quota on one deployment

<details><summary>Answer</summary>

**Correct: C.** Foundry does not provide load balancing or failover for model deployments. A custom gateway can route, health-check and break circuits.
**Incorrect:** A — it does not; B — Standard deployments are single-region without availability-zone support; D — more quota does not provide failover.
Source: https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat

</details>

### 10. You bought an Azure Reservation for PTUs, then discovered the region had no capacity for your deployment. What should you have done?

- A. Delete the reservation to release capacity
- B. Nothing; reservations guarantee capacity
- C. Request more quota only
- D. Create the deployment first to confirm capacity, then purchase the reservation

<details><summary>Answer</summary>

**Correct: D.** Reservations discount the PTU billing meter but do not guarantee capacity, so confirm capacity by deploying first.
**Incorrect:** A — deleting a reservation does not create capacity; B — reservations do not guarantee capacity; C — quota is a limit and still does not guarantee availability.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/provisioned-throughput

</details>

### 11. An app sends a 3,000-token policy document with every 30-token question and needs lower cost and latency without changing answers. What helps most?

- A. Move the question to the start of the prompt
- B. Keep the document first and identical in every request so prompt caching applies
- C. Switch to a batch deployment
- D. Request more quota

<details><summary>Answer</summary>

**Correct: B.** Caching needs an identical prefix of at least 1,024 tokens, so stable content goes first.
**Incorrect:** A — a changing prefix breaks the cache; C — batch is asynchronous (24-hour target), unsuitable for interactive calls; D — quota affects throughput, not price.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/prompt-caching

</details>
