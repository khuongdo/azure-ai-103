---
domain: All domains
skill: Exam technique
retrieved: 2026-10-12
---

# Reading exam questions

Exam questions describe a small situation with constraints and ask what you should do. The constraints decide the answer. Underline them first.

Underline the constraint words. They usually decide the answer:

| Constraint word | Usually points to |
|---|---|
| "predictable" or "steady" high throughput, SLO | Provisioned (PTU) |
| "unpredictable", "spiky", "pay only for use" | Standard or Global Standard pay-per-token |
| "data must stay in the EU" | Data Zone type (or a geography type) |
| "no code to maintain" | Prompt agent |
| "own code or framework" | Hosted agent |
| "exact product codes plus natural language" | Hybrid search |
| "no secrets in code", "least privilege" | Managed identity, Entra ID, RBAC |
| "audit", "who called what" | Diagnostic logs to Log Analytics |
| "before release" + "attacks" | AI red teaming agent |
| "generally available" | Avoid Preview-only features |

## A routine for scenario questions

1. **Find the goal and the constraints** (cost, latency, residency, security, effort, "generally available").
2. **Name the layer** the problem lives in: retrieval, generation, safety, identity, network, capacity, observability.
3. **Eliminate by constraint**: answers that break a stated constraint are out, even if they are good ideas.
4. **Prefer enforcement over instruction**: if a rule must hold, the answer usually puts it in code, permissions or a guardrail rather than only in a prompt.
5. **Prefer the managed, simplest option** that meets the requirement (prompt agent before hosted agent, Global Standard before provisioned) unless a clue demands more.
6. **Watch the wording** of "most cost-effective", "least administrative effort" and "least privilege": they point to different answers.

Other habits that help (from the retrieval deep dive): read the symptom, name the broken step in the pipeline, then pick the tool for that step.
