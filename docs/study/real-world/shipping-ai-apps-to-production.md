---
domain: Plan and manage an Azure AI solution
skill: Set up AI solutions in Foundry (deployment options, CI/CD); manage, monitor and secure AI systems; optimize and operationalize generative AI systems
sources:
  - https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat
  - https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/development-lifecycle
  - https://learn.microsoft.com/en-us/azure/foundry/concepts/observability
  - https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types
  - https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/virtual-networks
  - https://learn.microsoft.com/en-us/azure/foundry/what-is-foundry
retrieved: 2026-10-12
---

# Real-world: taking an AI app from prototype to production

Part of [Real-world practice](index.md). This is the cross-cutting scenario: every solution on the other pages eventually has to be shipped, secured, monitored and paid for.

## 1. The problem

A team builds a promising agent in the playground. Leadership wants it in production in six weeks, for 20,000 users, in a regulated industry. The prototype uses an API key, one environment, hand-edited prompts, no tests, and nobody knows what it costs or how to roll back a bad change.

**Goals**

- Repeatable deployments to dev, test and production.
- Security that passes review: no keys, private networking, least privilege, audit.
- **Quality gates**: no release without passing evaluations.
- Observability and cost control from day one.
- Safe rollout and fast rollback.

## 2. Why this is an AI-103 problem

| Need | Skill area |
|---|---|
| Azure infrastructure for AI apps and agents; deployment options; CI/CD integration | Set up AI solutions in Foundry |
| Quotas, scaling, rate limits, cost | Manage, monitor and secure AI systems |
| Tracing, token analytics, latency | Optimize and operationalize generative AI systems |
| Auditing, approvals, safety | Implement responsible AI |

## 3. The target operating model

```
 Git repo
  ├─ infra/        Bicep or Terraform: Foundry resource, projects, networking, RBAC, policy
  ├─ agents/       agent definitions as code (instructions, tools, model, guardrail)
  ├─ evals/        golden datasets, evaluator config, red-team config
  └─ app/          application code
        │ pull request
        ▼
 CI (self-hosted runner inside the VNet)
  1. lint + unit tests
  2. deploy to TEST Foundry resource (IaC + agent version)
  3. run evaluations (quality, safety, tool use) → compare with baseline → gate
  4. red teaming (scheduled or on major change)
        │ approval
        ▼
 CD → PROD Foundry resource (separate)
  5. deploy new immutable agent version beside the old one
  6. route small % of traffic (your routing layer) → watch metrics → promote or roll back
        ▼
 Operate: tracing, dashboards, alerts, continuous + scheduled evaluation, cost reports
```

Foundry gives you immutable agent **versions**, tracing, evaluators and publishing. It does **not** give you canary/blue-green routing, backup/DR or load balancing of model deployments; you add those.

### Walkthrough: one change from pull request to production

Example: a developer edits the support agent's instructions so it confirms the order number before acting.

1. **Pull request.** The change is made in the `agents/` folder as code, not in the portal. Reviewers see the diff of the instructions, which is why prompts-as-code matter: every change has an author and a reason.
2. **Fast checks.** Linting and unit tests run in seconds on any pure-code part of the change, so cheap mistakes never reach the expensive steps.
3. **Deploy to TEST.** The pipeline (running on a **self-hosted runner inside the VNet**, because the TEST Foundry resource is private) deploys the infrastructure and creates a **new immutable agent version** in the test environment.
4. **Evaluate against the golden dataset.** Realistic and adversarial tasks run through the new version; evaluators score task adherence, tool accuracy, groundedness and safety. The results are compared with the **current production version's baseline**, not just against a fixed number.
5. **Gate.** If any critical metric regresses, the pipeline fails and the pull request cannot merge. This is the step that prevents "it seemed fine" releases.
6. **Red teaming.** On major changes (or on a schedule) the AI red teaming agent probes the new version for jailbreaks and injection.
7. **Approval.** For production, a person approves after seeing the evaluation report. Sensitive environments require this human gate.
8. **Deploy to PROD beside the old version.** The new agent version is created in the production Foundry resource; the old one keeps serving. Model versions are pinned, so the only thing that changed is what you intended.
9. **Canary.** Your routing layer sends a small share of traffic (for example 5%) to the new version while dashboards compare resolution, errors, latency, cost and safety detections with the old one.
10. **Promote or roll back.** If metrics hold, traffic increases to 100%. If not, traffic returns to the previous version immediately, because versions are immutable and still available.
11. **Observe and feed back.** Continuous evaluation samples production traffic, traces explain surprises, and user feedback and escalations become new golden-dataset cases for the next change.

## 4. Build steps

### Environments and structure
1. **Separate Foundry resources** for experimentation, testing and production (and a dedicated resource for each major production workload) to isolate quota, policy and blast radius.
2. **One project per distinct access pattern**, with **project-level connections**. Create resources and projects through **infrastructure as code**, because portal-created projects do not inherit network controls and portal actions run under the service identity.
3. **Agents as code** in source control (instructions, tools, model, guardrail, version). Treat prompts like code: review, test, version.

### Identity and network
4. **Entra ID and managed identities only.** Disable key-based authentication with Azure Policy. Use least-privilege Foundry roles; callers get Agent Consumer; give the project managed identity its roles; reassign roles after publishing (new agent identity). See [agent safety and identity](../deep-dives/agent-safety-and-identity.md).
5. **Network isolation when required:** private endpoints for Foundry, AI Search, Storage and Cosmos DB, VNet-injected agent subnet, private DNS, egress control through a firewall, and an Application Gateway with WAF as the only public entry. Run CI from **self-hosted runners inside the VNet**. See [platform and network](../deep-dives/platform-network-and-reliability.md).
6. **Data ownership:** standard agent setup with your Cosmos DB, Storage and AI Search when compliance requires; size Cosmos DB RU/s per project.

### Capacity and cost
7. **Pick deployment types by load**: pay-per-token for variable traffic, provisioned for steady high load (with spillover), batch for offline jobs, Data Zone or geography types for residency. Pin model versions (**no auto-upgrade**). See [capacity](../deep-dives/capacity-cost-and-throttling.md).
8. **Handle 429s** with backoff and `Retry-After`; load-test the ramp pattern before launch; request quota early because approvals take time.
9. **Gateway** (for example Azure API Management) for routing, health checks and circuit breaking across deployments, if you need regional resilience.
10. **Cost levers:** smallest model that passes evaluations, fewer tools, capped outputs, prompt caching where applicable, delete stale agents and conversations, restrict playground use in production, budgets and alerts.

### Quality gates
11. **Golden dataset** of real tasks plus adversarial cases. Evaluators matched to the app: groundedness and retrieval for RAG; intent resolution, task adherence, tool selection and tool accuracy for agents; safety evaluators and a red teaming run. See [observability and lifecycle](../deep-dives/observability-and-agent-lifecycle.md).
12. **Gate on regression**, not just absolute scores: a new version must not be worse than the current one on any critical metric.
13. **Version everything** that affects behavior (agent, toolbox, prompt, model version, retrieval settings, index schema).

### Observability
14. **Tracing to Application Insights** with consistent span attributes; redact sensitive content; restrict access to traces like production logs.
15. **Dashboards and alerts:** latency, errors (429 and 503 separately), tokens and cost, quality scores from continuous evaluation, safety detections, tool failure rates.
16. **Diagnostic logs** to Log Analytics for audit of who called which deployment. `[NEEDS VERIFICATION]` log categories for your resource type.
17. **Feedback loop:** user ratings and escalations feed the golden dataset.

### Rollout and recovery
18. **Immutable versions + routing layer:** send a small percentage of traffic to the new version, compare, promote or roll back.
19. **Recovery plan:** agent definitions in code, Cosmos DB continuous backup (7-day point-in-time restore), delete locks on dependencies, zone-redundant data stores, and a documented runbook. Foundry Agent Service has no built-in DR.
20. **Runbooks** for the common incidents: throttling, quota exhaustion, a guardrail false-positive spike, a bad prompt release, a provider outage.

## 5. Governance checklist before go-live

| Area | Question |
|---|---|
| Identity | Any keys left? Roles least-privilege? Roles reassigned for the published agent? |
| Network | Public access disabled where required? DNS verified from inside the VNet? |
| Data | Where are conversations and files stored? Retention and deletion defined? |
| Safety | Guardrail assigned to the **agent** (not just the model)? Red team passed? |
| Quality | Golden set passing; no regressions; thresholds documented? |
| Cost | Budget, alerts, per-conversation cost known? Quota sufficient for peak? |
| Operations | Dashboards, alerts, on-call, runbooks, rollback tested? |
| Privacy | Traces redacted and access-controlled? PII handled? |
| Compliance | Transparency notes and disclosures reviewed; human oversight where required? |
| Change control | Everything versioned and deployed from code? |

## 6. What goes wrong in practice

| Symptom | Likely cause | Fix |
|---|---|---|
| Production behavior differs from test | Different model version, quota, or auto-upgrade | Pin versions; parity between environments |
| Launch-day throttling | Quota or capacity not planned | Load test; request quota early; spillover or provisioned |
| Quality drops quietly after a change | No regression gate | Evaluations in CI; continuous evaluation |
| CI cannot deploy to the private Foundry | Runner outside the VNet | Self-hosted runner in the VNet |
| Agent worked before publish, fails after | Role assignments on the old identity | Reassign roles to the published identity |
| Cost doubles in a month | Prompt growth, extra tools, long conversations | Token analytics; trim context; budgets |
| Audit asks "who changed the prompt?" | Edits made in the portal | Agents as code; restrict portal edits |
| An outage loses agent definitions | No backup strategy | Agents as code; Cosmos DB continuous backup |

## 7. A realistic timeline (example)

| Weeks | Focus |
|---|---|
| 1 | IaC baseline: resources, projects, identity, networking skeleton; agents as code |
| 2 | Golden dataset, evaluators and CI pipeline; first gates |
| 3 | Safety: guardrails, red teaming, PII handling; observability |
| 4 | Capacity: load tests, quota, deployment types, cost dashboard |
| 5 | Pilot with real users; fix findings; runbooks; rollback drill |
| 6 | Staged rollout; go-live review against the checklist |

## Sources and open items

See the frontmatter. The pipeline, checklist and timeline are a synthesis of the cited Microsoft guidance and general delivery practice, not a Microsoft-prescribed process. `[NEEDS VERIFICATION]` CI/CD details for your tooling (Azure DevOps, GitHub Actions, `azd`), log categories, and multi-region guidance.
