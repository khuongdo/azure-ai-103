---
note: docs/study/deep-dives/cicd-for-foundry-projects.md
skill: Set up CI/CD with evaluation gates
retrieved: 2026-10-12
---

# Quiz: CI/CD for Foundry projects

Based on the [deep dive](../deep-dives/cicd-for-foundry-projects.md).

## Flashcards

**Q:** Command to deploy a hosted agent with azd?
**A:** azd deploy (after azd provision).

**Q:** Command to run a stored evaluation?
**A:** azd ai agent eval run --no-prompt.

**Q:** Where does it read evaluation config?
**A:** eval.yaml in project root.

**Q:** Authentication from GitHub Actions without secrets?
**A:** OIDC federated credentials.

**Q:** Why a concurrency group?
**A:** Serialize deployments.

**Q:** How specify agents in the evaluation Action?
**A:** agent-name:version.

**Q:** Should the evaluation run on every commit?
**A:** No; Learn advises limiting for cost.

**Q:** What should a smoke test check?
**A:** Expected response content, not just non-empty.

## Practice questions

### 1. You want to avoid storing Azure secrets in GitHub. What do you use?

- A. Federated credentials (OIDC)
- B. Public endpoint
- C. Shared key in repo
- D. Admin account

<details><summary>Answer</summary>

**Correct: A.** OIDC lets the workflow log in without stored secrets.
**Incorrect:** the other options do not fit — insecure.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/set-up-ci-cd-cli

</details>

### 2. Deployment fails if two pushes run at once. What helps?

- A. Concurrency group
- B. More replicas
- C. Disable tests
- D. Bigger runner

<details><summary>Answer</summary>

**Correct: A.** A concurrency group serializes deployments.
**Incorrect:** the other options do not fit — do not serialize.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/set-up-ci-cd-cli

</details>

### 3. The pipeline must fail when scores drop below thresholds. What?

- A. azd ai agent eval run with thresholds in eval.yaml
- B. Disable tracing
- C. Manual review only
- D. Smoke test only

<details><summary>Answer</summary>

**Correct: A.** Evaluation step returns failure below thresholds.
**Incorrect:** the other options do not fit — not automated gate.
Source: https://learn.microsoft.com/en-us/azure/foundry/observability/how-to/azure-developer-cli-evaluation

</details>

### 4. Compare two agent versions in CI. What input to the Action?

- A. A key
- B. One model name
- C. Multiple agent-name:version IDs
- D. Only a dataset

<details><summary>Answer</summary>

**Correct: C.** Listing several agents enables comparison against a baseline.
**Incorrect:** the other options do not fit — insufficient.
Source: https://learn.microsoft.com/en-us/azure/foundry/how-to/evaluation-github-action

</details>
