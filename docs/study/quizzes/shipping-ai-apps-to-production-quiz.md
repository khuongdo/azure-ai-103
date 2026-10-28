---
note: docs/study/real-world/shipping-ai-apps-to-production.md
skill: Set up AI solutions in Foundry (deployment options, CI/CD); manage, monitor and secure AI systems; optimize and operationalize generative AI systems
retrieved: 2026-10-12
---

# Quiz: shipping AI apps to production

Based on the [case study](../real-world/shipping-ai-apps-to-production.md). The last two are **design questions**.

## Flashcards

**Q:** Why create Foundry projects through infrastructure as code?
**A:** Portal-created projects do not inherit network controls, and portal actions run under the service identity.

**Q:** How should environments be separated?
**A:** Separate Foundry resources for experimentation, testing and production; a dedicated resource per major production workload.

**Q:** Why a self-hosted CI runner inside the VNet?
**A:** Data-plane access to a private Foundry is blocked from public workstations (403 or connection errors).

**Q:** What does an evaluation gate compare against?
**A:** The current production version's baseline, not only a fixed number.

**Q:** Are agent versions mutable?
**A:** No; immutable, referenced as `<agent_name>:<version>`.

**Q:** How do you stop silent model behavior changes?
**A:** Set the model version to **no auto-upgrade** and validate new versions.

**Q:** Does Foundry provide canary or blue-green routing?
**A:** No; build a routing layer.

**Q:** Does Foundry Agent Service provide built-in disaster recovery?
**A:** No; use agents as code, Cosmos DB continuous backup, delete locks and a failover replica.

**Q:** How do you enforce no API keys?
**A:** Azure Policy to disable key-based (local) authentication; use Entra ID and managed identities.

**Q:** What three log categories exist for Foundry Models?
**A:** RequestResponse, Trace, Audit.

**Q:** What must you redo after publishing an agent?
**A:** Reassign roles to the new distinct agent identity.

## Practice questions

### 1. Your CI pipeline deploys to a private Foundry resource but fails with 403 on data-plane calls from a hosted runner. What do you change?

- A. Re-enable public access
- B. Run the pipeline on a self-hosted runner inside the VNet
- C. Use a larger agent subnet
- D. Switch to API keys

<details><summary>Answer</summary>

**Correct: B.** Control-plane calls (ARM) work from anywhere, but data-plane calls (agents, files, project endpoint) go to **private endpoints** that only resolve and route inside your network. A Microsoft-hosted runner is on the public internet, so the call fails with 403 or a connection error. Run the job on a **self-hosted runner** (VM, container or scale set) **in or peered to the VNet**, with private DNS resolving the private endpoints.

```yaml
jobs:
  deploy:
    runs-on: [self-hosted, linux, vnet]       # label of a runner inside the VNet
    steps:
      - uses: actions/checkout@v4
      - run: azd deploy --no-prompt
```

**Why the others are wrong:**
- **A. Re-enable public access:** undermines the isolation requirement.
- **C. Larger agent subnet:** affects the agent runtime, not the pipeline's reachability.
- **D. API keys:** discouraged, and keys do not fix networking.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/virtual-networks

</details>

### 2. A prompt change slightly lowers task adherence but raises helpfulness scores. The release process has an evaluation gate. What should the gate do?

- A. Always pass when the average improves
- B. Fail on a regression of any critical metric versus the current version
- C. Ignore safety metrics
- D. Skip red teaming

<details><summary>Answer</summary>

**Correct: B.** An average can hide a critical regression: a big gain in helpfulness can offset a small loss in task adherence, yet adherence (following rules and policy) may be the dimension that matters most. Design the gate with two rule types: **absolute floors** for critical metrics (and safety evaluators) and a **no-regression rule versus the current production version** on the same dataset. Safety metrics and red teaming are never skipped.

```python
CRITICAL = ["task_adherence", "groundedness", "violence_defect_rate"]

def gate(new: dict, prod: dict, tolerance: float = 0.0) -> bool:
    return all(new[m] >= prod[m] - tolerance for m in CRITICAL)   # fail on any regression
```

**Why the others are wrong:**
- **A. Pass when the average improves:** averages hide regressions.
- **C. Ignore safety / D. Skip red teaming:** safety must be gated.

Source: case study sections 4 and 5

</details>

### 3. How do you roll out a new agent version to 5% of traffic and roll back instantly?

- A. Edit the saved version in place
- B. Deploy a new immutable version beside the old one and use a routing layer to split traffic
- C. Delete the old version first
- D. Use the playground

<details><summary>Answer</summary>

**Correct: B.** Agent versions are **immutable** (`name:version`), so a new version can sit beside the old one. Foundry has **no native canary routing**, so add a routing layer (API Management, an app gateway, or your own code) that sends 5% of requests to `support:4` and 95% to `support:3`. Rollback is changing the weight back to 0%: instant, since `support:3` was never removed. Compare metrics (quality scores, errors, latency, cost, human-change rate) during the canary before raising the percentage.

```python
import random

def pick_version(user_id: str) -> str:
    bucket = hash(user_id) % 100              # sticky per user, so a conversation stays on one version
    return "support:4" if bucket < CANARY_PERCENT else "support:3"
```

**Why the others are wrong:**
- **A. Edit in place:** saved versions cannot be edited.
- **C. Delete the old version first:** removes your rollback.
- **D. Playground:** not production traffic.

Source: https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat

</details>

### 4. Responses change after a platform upgrade although nobody edited the agent. What control prevents this?

- A. Model version upgrade set to no auto-upgrade, with evaluation before adopting new versions
- B. More tools
- C. A higher temperature
- D. Disable tracing

<details><summary>Answer</summary>

**Correct: A.** A new **model version** can change tone, tool use and formatting. If the deployment is set to **auto-upgrade**, the platform can move to a newer version without any change in your repo. Set the deployment's version upgrade option to **no auto-upgrade** (pin it), run your **evaluation suite on the new version** in a separate deployment, then promote it through the normal release process.

```json
"properties": { "model": { "name": "gpt-4.1", "version": "2025-04-14" }, "versionUpgradeOption": "NoAutoUpgrade" }
```

**Why the others are wrong:**
- **B. More tools / C. Higher temperature:** do not control model versions (temperature adds randomness).
- **D. Disable tracing:** hides the change.

Source: https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat

</details>

### 5. An engineer deletes agent data. Foundry has no built-in DR. Which combination gives recovery?

- A. A support ticket only
- B. Agents as code plus Cosmos DB continuous backup and delete locks
- C. A bigger quota
- D. A second playground

<details><summary>Answer</summary>

**Correct: B.** There is no built-in backup/DR for Agent Service data, so you prepare it before an incident:
1. **Agents as code** (definitions, prompts, tools in Git) → redeploy in minutes.
2. **Cosmos DB continuous backup** (point-in-time restore) for conversations and state. It **must be enabled in advance**; you cannot restore from a backup that was never turned on.
3. **Delete locks** and restricted roles to prevent the accident.
4. Optionally a secondary region and tested runbooks (high availability and resiliency guidance).

```bash
az lock create --name protect-foundry --lock-type CanNotDelete --resource-group rg-foundry
```

**Why the others are wrong:**
- **A. Support ticket only:** not a documented recovery path.
- **C. Bigger quota / D. Second playground:** unrelated to data recovery.

Source: https://learn.microsoft.com/en-us/azure/foundry/how-to/high-availability-resiliency

</details>

### 6. Compliance asks who called which model deployment and when, without changing application code. What do you enable?

- A. Application Insights sampling at 100%
- B. A diagnostic setting sending RequestResponse and Audit logs to Log Analytics
- C. A second agent
- D. Spillover

<details><summary>Answer</summary>

**Correct: B.** Foundry Models write **resource logs** in three categories: **RequestResponse**, **Trace** and **Audit**. A **diagnostic setting** routes them to a Log Analytics workspace (or Storage / Event Hubs) with **no application code change**, then you query with KQL: who (caller identity / IP), which deployment, when, status code.

```bash
az monitor diagnostic-settings create --name audit-to-law \
  --resource <foundry-resource-id> --workspace <law-id> \
  --logs '[{"category":"RequestResponse","enabled":true},{"category":"Audit","enabled":true}]'
```

```kusto
AzureDiagnostics
| where ResourceProvider == "MICROSOFT.COGNITIVESERVICES"
| summarize requests = count() by CallerIPAddress, bin(TimeGenerated, 1h)
```

(Table and column names depend on the destination mode `[NEEDS VERIFICATION]`.)

**Why the others are wrong:**
- **A. Application Insights sampling:** collects app telemetry and traces, not resource audit logs.
- **C. Second agent / D. Spillover:** unrelated.

Source: https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/monitor-models

</details>

## Design questions

### 7. Design the CI/CD pipeline for a customer-facing agent in a regulated company.

<details><summary>Model answer and checklist</summary>

1. Infrastructure and agent definitions **as code**; reviewed pull requests.
2. CI on a **self-hosted runner in the VNet**: fast checks, deploy to TEST, **evaluations versus baseline**, red teaming on major changes.
3. **Human approval** with the evaluation report; deploy to PROD beside the old version with **pinned model versions**.
4. **Canary** through a routing layer; compare metrics; **promote or roll back**.
5. **Operate:** tracing, dashboards, alerts, continuous evaluation, cost reports; feedback into the golden dataset.

</details>

### 8. Write a go-live checklist for the first production launch.

<details><summary>Model answer and checklist</summary>

Identity (no keys, least privilege, roles reassigned after publish), network (public access disabled where required, DNS verified), data (where state lives, retention), safety (guardrail on the agent, red team passed), quality (golden set passing, no regressions), cost (budget, quota for peak, per-conversation cost), operations (dashboards, alerts, runbooks, rollback tested), privacy (traces redacted and restricted), compliance (disclosures, human oversight), change control (everything versioned and deployed from code).

</details>
