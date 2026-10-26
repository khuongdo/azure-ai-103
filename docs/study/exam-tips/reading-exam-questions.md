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

## Lessons from practice test 2

Patterns seen in [practice test 2](../practice-tests/practice-test-2-review.md). The facts behind them are in that review.

1. **Find the constraint that eliminates options.** Phrases like "without rebuilding the index", "no vector embeddings", "within 30 seconds", "single pipeline" or "no stored credentials" usually rule out the most obvious answer.
2. **Cost versus latency.** A cheap option can be asynchronous (batch). Check it against the latency requirement before choosing it.
3. **Throughput versus price.** Quota and rate limits change throughput, not unit price.
4. **Pick the purpose-built feature.** The answer is usually the feature designed for the job (`smartCrops` for framing, a soft-delete policy for blob deletions), not a workaround.
5. **Check modality and scope.** Many wrong answers are real features used on the wrong input: Content Understanding pro mode with video (pro mode is documents only), or a high water mark policy with Blob Storage.
6. **Auth questions.** Prefer keyless, identity-based access (`DefaultAzureCredential`, managed identity) when the scenario mentions Entra ID or "no stored credentials".
7. **Read all four options.** Distractors are often partly correct; choose the one that meets every stated requirement.
8. **Review mistakes by reason.** After each practice test, record whether a miss was a knowledge gap or a missed constraint.

## Lessons from practice test 4

Patterns from [practice test 4](../practice-tests/practice-test-4-review.md) (22/25).

1. **Constraint words decide.** "Exclusively within the pipeline", "without custom code", "not reachable over the public internet", "only answer on a strong match" and "single low-latency channel" eliminate the convenient option.
2. **Feature versus job.** Ask "can this service really do that?" Translation skill does not take audio; Key phrase skill takes text only; Prompt Shields may not see text inside an image.
3. **Network wording.** "Private IP" or "not reachable from the internet" means private endpoint; "restrict to subnet" can be a service endpoint.
4. **Configuration-error questions.** Look for the missing property (`vectorSearchProfile`, `dimensions`, `input_reference`, `call_id`, `targetName`) before changing service or model.
5. **Governance questions.** Prefer the answer that keeps every step inside the allowed boundary.
6. **Numbers worth memorizing.** 93 days (platform metrics), 1536 (ada-002 dimensions), Web API skill timeout 30 s default and 230 s max, batchSize 1000.
