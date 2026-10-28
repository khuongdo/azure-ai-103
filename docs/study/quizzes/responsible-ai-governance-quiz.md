---
note: docs/study/deep-dives/responsible-ai-governance.md
skill: Responsible AI framework and evaluation
retrieved: 2026-10-12
---

# Quiz: responsible AI and governance

Based on the [deep dive](../deep-dives/responsible-ai-governance.md).

## Flashcards

**Q:** Three activities of the framework?
**A:** Discover, Protect, Govern.

**Q:** Text severity scale?
**A:** 0 to 7 (trimmed 0, 2, 4, 6).

**Q:** Image severity scale?
**A:** 0, 2, 4, 6.

**Q:** Default threshold for harm evaluators?
**A:** 3; pass if score is at or below.

**Q:** What is defect rate?
**A:** Share of test cases exceeding the threshold.

**Q:** Which evaluator targets prompt injection through content?
**A:** Indirect attack (XPIA).

**Q:** Which tool generates adversarial probes?
**A:** AI Red Teaming Agent.

**Q:** Which categories does Content Safety classify?
**A:** Hate and fairness, sexual, violence, self-harm.

**Q:** Which Foundry evaluator detects copyrighted lyrics, recipes or published text in outputs?
**A:** Protected Materials.

## Practice questions

### 1. You must test for jailbreaks before release. What do you run?

- A. AI Red Teaming Agent
- B. Spillover
- C. Latency test
- D. Only unit tests

<details><summary>Answer</summary>

**Correct: A.** The **AI Red Teaming Agent** (built on the open-source PyRIT toolkit) automatically generates adversarial probes, such as jailbreak attempts, in several attack strategies, sends them to your target (model or app), and scores each response with the risk and safety evaluators. The result is an **attack success rate** per risk category. Run it before release and on a schedule, and combine it with human red teaming.

```python
from azure.ai.evaluation.red_team import RedTeam, RiskCategory, AttackStrategy

red_team = RedTeam(azure_ai_project=project_endpoint, credential=credential,
                   risk_categories=[RiskCategory.Violence, RiskCategory.HateUnfairness], num_objectives=5)
result = await red_team.scan(target=app_callback, attack_strategies=[AttackStrategy.Base64, AttackStrategy.Flip])
```

**Why the others are wrong:**
- **B. Spillover:** capacity feature for provisioned deployments.
- **C. Latency test:** measures speed.
- **D. Only unit tests:** test known cases, not adaptive attacks.

Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/risk-safety-evaluators

</details>

### 2. A harm evaluator scores 2 with default threshold. Result?

- A. Pass
- B. Fail
- C. Undefined
- D. Error

<details><summary>Answer</summary>

**Correct: A.** Harm evaluators (Violence, Sexual, Self-harm, Hate and Unfairness) return a severity score from 0 to 7 and a label. The default threshold is **3**, and the result is **pass when the score is less than or equal to 3** (low is good). A score of 2 passes. Scores 4 or higher fail.

```python
from azure.ai.evaluation import ViolenceEvaluator

violence = ViolenceEvaluator(credential=credential, azure_ai_project=project_endpoint)
r = violence(query=q, response=a)
# r["violence"] -> "Very low"/"Low"/..., r["violence_score"] -> 0-7, r["violence_result"] -> "pass"/"fail"
```

You can change the threshold when your risk tolerance is stricter (for example, 1).

**Why the others are wrong:**
- **B. Fail:** only for scores above the threshold.
- **C. Undefined / D. Error:** a valid score always produces a result.

Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/risk-safety-evaluators

</details>

### 3. Which activity covers audit logs and approvals?

- A. Govern
- B. Train
- C. Discover
- D. Protect

<details><summary>Answer</summary>

**Correct: A.** Microsoft's responsible AI approach for generative apps has three activities: **Discover** (find risks: red teaming, evaluations, inventory), **Protect** (runtime controls: guardrails, content filters, Prompt Shields), **Govern** (accountability: policies, audit logs, approvals, compliance reporting, ownership). Audit logs and approvals are evidence for auditors and owners, so they are Govern.

| Activity | Example |
|---|---|
| Discover | Red teaming scan, risk evaluation |
| Protect | Guardrail blocks an injection at runtime |
| **Govern** | **Approval record, audit log, policy compliance** |

**Why the others are wrong:**
- **B. Train:** not one of the three.
- **C. Discover:** finds risks.
- **D. Protect:** blocks or filters at runtime.

Source: https://learn.microsoft.com/en-us/azure/foundry/responsible-use-of-ai-overview

</details>

### 4. Image model severities returned?

- A. 0 to 7
- B. 1 to 4
- C. 0 or 1
- D. 0, 2, 4, 6

<details><summary>Answer</summary>

**Correct: D.** The Azure AI Content Safety **image** model returns the **trimmed severity scale: 0, 2, 4, 6**. (Text returns 0 to 7, trimmed on request; the multimodal image-with-text model returns the full 0 to 7.) Thresholds must be set against the right scale, for example "block image at 4 or higher".

```python
from azure.ai.contentsafety.models import AnalyzeImageOptions, ImageData

resp = client.analyze_image(AnalyzeImageOptions(image=ImageData(content=image_bytes)))
for c in resp.categories_analysis:
    print(c.category, c.severity)        # 0, 2, 4 or 6
```

**Why the others are wrong:**
- **A. 0 to 7:** the text scale (and image with text).
- **B. 1 to 4 / C. 0 or 1:** not scales used by the service.

Source: https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/harm-categories

</details>

### 5. You must check a model's outputs for song lyrics, recipes and published articles. Which evaluator?

- A. Groundedness
- B. Protected Materials
- C. Coherence
- D. Violence

<details><summary>Answer</summary>

**Correct: B.** **Protected Materials** detects use of copyrighted or protected content in the model's output: for text, song lyrics, recipes, news articles and other published works; a separate code variant detects licensed code. It is an output control, because the risk is in what the model *reproduces*.

```python
from azure.ai.evaluation import ProtectedMaterialEvaluator

pm = ProtectedMaterialEvaluator(credential=credential, azure_ai_project=project_endpoint)
print(pm(query="Write the lyrics of ...", response=model_output))     # label true/false plus reason
```

**Why the others are wrong:**
- **A. Groundedness:** checks that claims are supported by context.
- **C. Coherence:** language quality.
- **D. Violence:** a harm category, not copyright.

Source: https://learn.microsoft.com/en-us/azure/foundry/concepts/built-in-evaluators

</details>
