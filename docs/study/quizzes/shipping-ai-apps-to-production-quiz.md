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

**Correct: B.** The runner needs network reachability to the private endpoints.
**Incorrect:** A — undermines isolation; C — unrelated; D — keys are discouraged and do not fix networking.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/virtual-networks

</details>

### 2. A prompt change slightly lowers task adherence but raises helpfulness scores. The release process has an evaluation gate. What should the gate do?

- A. Always pass when the average improves
- B. Fail on a regression of any critical metric versus the current version
- C. Ignore safety metrics
- D. Skip red teaming

<details><summary>Answer</summary>

**Correct: B.** Gate on no regression of critical metrics.
**Incorrect:** A — averages can hide regressions; C and D — safety must be gated.
Source: case study sections 4 and 5

</details>

### 3. How do you roll out a new agent version to 5% of traffic and roll back instantly?

- A. Edit the saved version in place
- B. Deploy a new immutable version beside the old one and use a routing layer to split traffic
- C. Delete the old version first
- D. Use the playground

<details><summary>Answer</summary>

**Correct: B.** Versions are immutable and Foundry has no native canary routing, so you add one.
**Incorrect:** A — not editable; C — removes rollback; D — not production traffic.
Source: https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat

</details>

### 4. Responses change after a platform upgrade although nobody edited the agent. What control prevents this?

- A. Model version upgrade set to no auto-upgrade, with evaluation before adopting new versions
- B. More tools
- C. A higher temperature
- D. Disable tracing

<details><summary>Answer</summary>

**Correct: A.**
**Incorrect:** B, C, D — do not control model versions.
Source: https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat

</details>

### 5. An engineer deletes agent data. Foundry has no built-in DR. Which combination gives recovery?

- A. A support ticket only
- B. Agents as code plus Cosmos DB continuous backup and delete locks
- C. A bigger quota
- D. A second playground

<details><summary>Answer</summary>

**Correct: B.** Configure recovery before incidents; continuous backup must be enabled in advance.
**Incorrect:** A, C, D — not recovery mechanisms.
Source: https://learn.microsoft.com/en-us/azure/foundry/how-to/high-availability-resiliency

</details>

### 6. Compliance asks who called which model deployment and when, without changing application code. What do you enable?

- A. Application Insights sampling at 100%
- B. A diagnostic setting sending RequestResponse and Audit logs to Log Analytics
- C. A second agent
- D. Spillover

<details><summary>Answer</summary>

**Correct: B.** Resource logs routed with a diagnostic setting can be queried with KQL.
**Incorrect:** A — telemetry for traces, not resource audit; C and D — unrelated.
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
