---
domain: Plan and manage an Azure AI solution
skill: Implement responsible AI: principles, risk and safety evaluation, governance, human oversight
sources:
  - https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/risk-safety-evaluators
  - https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/harm-categories
  - https://learn.microsoft.com/en-us/azure/foundry/responsible-use-of-ai-overview
  - https://learn.microsoft.com/en-us/azure/foundry/guardrails/guardrails-overview
retrieved: 2026-10-12
---

# Deep dive: responsible AI and governance

Runtime controls for agents are in [Agent safety and identity](agent-safety-and-identity.md); multimodal specifics are in [Responsible AI for multimodal content](responsible-ai-for-multimodal-content.md). This page covers the framework, the evaluation side, and the process around it. Items marked `[NEEDS VERIFICATION]` are not confirmed on Microsoft Learn. Numbers marked *example* are illustrative.

---

## 1. The framework: Discover, Protect, Govern

Microsoft's Responsible AI Standard is applied in Foundry as three activities. They repeat for the life of the system, not once.

| Activity | Question it answers | Examples in Foundry |
|---|---|---|
| **Discover** | What can go wrong here? | Red teaming, risk and safety evaluators, Defender for Cloud risks and alerts |
| **Protect** | How do we stop it at runtime? | Guardrails, content filters, Prompt Shields, grounding, tool limits |
| **Govern** | Who is accountable, and how do we prove it? | Policies, approvals, audit logs, ownership, incident process |

### Walkthrough: an HR policy assistant
1. **Discover.** The team lists risks: it might reveal another employee's data, give wrong legal advice, be tricked by a pasted document, or show bias in role suggestions. They turn each into test cases and run evaluators plus a red team before launch.
2. **Protect.** They attach a guardrail (user input and output controls), ground answers in the HR policy index with citations, and limit the tools so the assistant can only read the caller's own records.
3. **Govern.** An owner is named; changes need review; high-impact answers (termination, pay) are routed to HR staff; logs record who approved what; an incident process exists.
4. **Loop.** Production feedback and monitoring reveal new risks, which go back to step 1.

*What can go wrong:* treating the filter as the whole program (Protect without Discover), skipping Govern so nobody owns an incident, or never repeating the cycle after a model or prompt change.

---

## 2. Harm categories and severity

Content Safety classifies four categories: **hate and fairness, sexual, violence, self-harm**.

| Content | Severity scale returned |
|---|---|
| Text | Full **0 to 7**; can be trimmed to 0, 2, 4, 6 on request |
| Image | Trimmed only: **0, 2, 4, 6** |
| Image with text (multimodal) | Full 0 to 7 (trimmed on request) |

**Guardrails** present four levels: safe, low, medium, high. A threshold you set on a control flags content **at that level and above** (Learn describes the Low setting as flagging low severity and higher). `[NEEDS VERIFICATION]` how Learn labels Low and High as "restrictive"; read the direction from the flagged range, not the label. Content at "safe" is annotated but never filtered.

Text classifiers are trained and tested on English, German, Japanese, Spanish, French, Italian, Portuguese and Chinese. They can work in other languages with less reliability, so test your own languages.

### Choosing a threshold (step by step)
1. Start from the audience: a children's education app needs stricter settings than an internal security-research tool.
2. Run a sample of real and adversarial prompts at the default threshold.
3. Count false blocks (harmless content blocked) and misses (harmful content passed).
4. Adjust by category, not globally: a medical app may need more tolerance for violence-related words than for hate.
5. Re-test after every change; keep the results.

---

## 3. Risk and safety evaluators

These run in the hosted Foundry Evaluation service, so you do not deploy a judge model.

| Evaluator | What it detects |
|---|---|
| Hate and unfairness, Sexual, Violence, Self-harm | Harm categories, scored 0 to 7. **Default threshold 3; the case passes if score ≤ threshold** |
| Protected material | Copyrighted text or code in the output |
| Code vulnerability | Insecure patterns in generated code |
| Ungrounded attributes | Inferring protected traits (for example emotional state) not present in the context |
| Indirect attack (XPIA) | Attempts hidden in content: manipulated content, intrusion, information gathering |
| Prohibited actions (preview, agents) | Agent actions outside policy |
| Sensitive data leakage (preview, agents) | Agent exposing sensitive data |

**Defect rate** = share of test cases whose score is above the threshold (a failure).

*Worked example (example numbers):* 200 adversarial prompts; 6 outputs score 4 or higher on Violence with threshold 3. Defect rate = 6 / 200 = **3%**. Release rule: "no category above 1%". The build fails, the team strengthens the guardrail and grounding, and re-runs.

The **AI Red Teaming Agent** generates adversarial probes (attack strategies, harm categories) and scores the target with these evaluators, so you test attacks you did not think of.

### Evaluation process (step by step)
1. **Define risks** for this use case: who could be harmed and how. Output: a risk list.
2. **Build the dataset:** normal questions, edge cases and adversarial prompts. Output: a versioned test set.
3. **Run evaluators and the red team** before release. Output: scores and a defect rate per category.
4. **Set pass rules** per risk (thresholds, maximum defect rate) and make them a release gate (see [CI/CD](cicd-for-foundry-projects.md)).
5. **Mitigate and re-run:** prompt, guardrail, grounding, tool limits.
6. **Monitor in production:** sampled continuous evaluation and alerts (see [Observability](observability-and-agent-lifecycle.md)).

*What can go wrong:* a test set made only of polite prompts, thresholds never revisited, evaluating once and never after a model upgrade, judging only the final answer in an agent that is leaking data in intermediate tool calls.

---

## 4. Transparency and explainability

- **Disclose** that the user is talking to AI.
- **Cite sources** in grounded answers so users can verify.
- **State limits**: what the system is for, and what it should not be used for. Microsoft publishes transparency notes for its services; yours should exist for your app.
- **Keep traces** for audit: inputs, tool calls, outputs, model and version.
- `[NEEDS VERIFICATION]` Model-explanation tooling (feature attribution and similar) was not read on Learn; do not assume a specific Foundry feature for it.

## 5. Human oversight

| Pattern | Use when |
|---|---|
| **Human in the loop** (approve before action) | The action is hard to reverse or high impact (payments, access grants, messages to customers) |
| **Human on the loop** (monitor and intervene) | Actions are low risk but volume is high |
| **Human after the fact** (audit samples) | Low-risk content, with periodic review |

Record approver, time and evidence. Measure how often humans change or reject the system's proposal: a high change rate means autonomy should not increase yet (see [Customer support agent](../real-world/customer-support-agent.md)).

## 6. Governance checklist
- Named owner and escalation path.
- Documented intended use and prohibited use.
- Evaluation results stored with the release.
- Change control for prompts, models, tools and guardrails.
- Access control by role, no shared keys.
- Incident process, including reporting a model vulnerability to the Microsoft Security Response Center (MSRC).
- Periodic review (at least on every model or major prompt change).

---

## Sources
- [Risk and safety evaluators](https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/risk-safety-evaluators)
- [Harm categories](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/harm-categories)
- [Guardrails overview](https://learn.microsoft.com/en-us/azure/foundry/guardrails/guardrails-overview)
