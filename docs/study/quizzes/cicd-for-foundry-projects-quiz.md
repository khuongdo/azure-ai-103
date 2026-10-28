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

**Correct: A.** With **OIDC federated credentials** you register your GitHub repo/branch as a trusted issuer on a Microsoft Entra app (or managed identity). At run time GitHub issues a short-lived token for that workflow, and `azure/login` exchanges it for an Azure token. There is no client secret or key stored in GitHub that could leak or expire. The workflow needs `permissions: id-token: write`.

```yaml
permissions:
  id-token: write
  contents: read
steps:
  - uses: azure/login@v2        # no secret: only IDs, not credentials
    with:
      client-id: ${{ vars.AZURE_CLIENT_ID }}
      tenant-id: ${{ vars.AZURE_TENANT_ID }}
      subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

**Why the others are wrong:**
- **B. Public endpoint:** exposes the service; it is not an authentication method.
- **C. Shared key in repo:** a leaked key gives full access, and the repo history keeps it.
- **D. Admin account:** violates least privilege and usually needs a stored password.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/set-up-ci-cd-cli

</details>

### 2. Deployment fails if two pushes run at once. What helps?

- A. Concurrency group
- B. More replicas
- C. Disable tests
- D. Bigger runner

<details><summary>Answer</summary>

**Correct: A.** Two pushes to `main` start two workflow runs. Both run `azd provision` and `azd deploy` against the same environment, so they collide (one overwrites the other or fails on a locked resource). A GitHub Actions **concurrency group** lets only one run with that group name execute at a time; the others wait (or are cancelled if you set `cancel-in-progress`).

```yaml
concurrency:
  group: deploy-agent     # same name = one deployment at a time
```

**Why the others are wrong:**
- **B. More replicas:** scaling the running agent does not stop pipeline runs from overlapping.
- **C. Disable tests:** removes quality gates and does not serialize anything.
- **D. Bigger runner:** more CPU, same race.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/set-up-ci-cd-cli

</details>

### 3. The pipeline must fail when scores drop below thresholds. What?

- A. azd ai agent eval run with thresholds in eval.yaml
- B. Disable tracing
- C. Manual review only
- D. Smoke test only

<details><summary>Answer</summary>

**Correct: A.** The command `azd ai agent eval run --no-prompt` reads `eval.yaml` from the project root (dataset reference, evaluators, thresholds), runs the agent over the dataset, scores it, and **exits with a failure code when scores fall below thresholds**, which fails the job and blocks the merge or deployment. Keep `eval.yaml` in source control so every run uses comparable thresholds. `--no-prompt` is required in CI because nobody can answer prompts. This evaluation feature is Preview.

A good gate uses two rules: an absolute floor (for example groundedness at least 4) and a regression rule against the baseline (a score of 4 hides a drop from 4.8), plus a hard limit on safety evaluators.

```yaml
- run: azd ai agent eval run --no-prompt   # non-zero exit below thresholds fails the job
```

**Why the others are wrong:**
- **B. Disable tracing:** hides information, gates nothing.
- **C. Manual review only:** not automated and does not scale.
- **D. Smoke test only:** checks one or two prompts for sanity, not score thresholds across a dataset.

Source: https://learn.microsoft.com/en-us/azure/foundry/observability/how-to/azure-developer-cli-evaluation

</details>

### 4. Compare two agent versions in CI. What input to the Action?

- A. A key
- B. One model name
- C. Multiple agent-name:version IDs
- D. Only a dataset

<details><summary>Answer</summary>

**Correct: C.** The evaluation GitHub Action (`microsoft/ai-agent-evals`, Preview) takes agent IDs written as **`agent-name:version`**. Listing several makes it compare them: the **first is the baseline** by default, and the run summary shows scores with **confidence intervals** and pairwise comparisons, so you can tell a real improvement from noise. Because versions are immutable, `support:3` (production) vs `support:4` (candidate) is a reliable comparison.

```yaml
- uses: microsoft/ai-agent-evals@v3-beta        # tag as seen on Learn; check the current one
  with:
    azure-ai-project-endpoint: ${{ vars.PROJECT_ENDPOINT }}
    deployment-name: gpt-4.1                     # judge model
    data-path: ./eval/dataset.json
    agent-ids: support:3,support:4               # baseline first
```

(Input names are illustrative; verify them in the Action's README `[NEEDS VERIFICATION]`.) Learn advises not to run it on every commit, to control cost.

**Why the others are wrong:**
- **A. A key:** authentication uses `azure/login` with federated credentials, not a key input.
- **B. One model name:** the Action evaluates agents, and one item gives nothing to compare.
- **D. Only a dataset:** necessary, but without two agent IDs there is nothing to compare.

Source: https://learn.microsoft.com/en-us/azure/foundry/how-to/evaluation-github-action

</details>
