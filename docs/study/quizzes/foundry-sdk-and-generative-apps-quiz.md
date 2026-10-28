---
note: docs/study/deep-dives/foundry-sdk-and-generative-apps.md
skill: Build generative AI apps with the Foundry SDK
retrieved: 2026-10-12
---

# Quiz: Foundry SDK and generative apps

Based on the [deep dive](../deep-dives/foundry-sdk-and-generative-apps.md).

## Flashcards

**Q:** What does the Foundry SDK connect to?
**A:** A single project endpoint.

**Q:** Which SDK versions target the new Foundry?
**A:** azure-ai-projects 2.x.

**Q:** Which client for connections and tracing?
**A:** The project client.

**Q:** Which client for Responses and evaluations?
**A:** The OpenAI-compatible client.

**Q:** Preferred credential?
**A:** DefaultAzureCredential (Entra ID).

**Q:** Which roles access the project?
**A:** Foundry User or Project Manager.

**Q:** OpenAI endpoint format?
**A:** https://<resource>.openai.azure.com/openai/v1

**Q:** Do Speech/Language use the project endpoint?
**A:** No; they use tool-specific endpoints.

## Practice questions

### 1. You need keyless authentication in Azure-hosted code. What?

- A. Anonymous
- B. Hard-coded key
- C. DefaultAzureCredential with managed identity
- D. Shared secret

<details><summary>Answer</summary>

**Correct: C.** `DefaultAzureCredential` tries a chain of identities: environment variables, workload identity, **managed identity** (when running on Azure), then developer sign-ins (Azure CLI, VS Code). The same code works on a laptop (your `az login`) and in Azure (managed identity), and **no key exists in code or config**. Grant the identity a role (for example Azure AI User) on the project.

```python
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

project = AIProjectClient(endpoint=PROJECT_ENDPOINT, credential=DefaultAzureCredential())
```

In production prefer a specific credential (such as `ManagedIdentityCredential`) when you want faster, more predictable authentication.

**Why the others are wrong:**
- **A. Anonymous:** Foundry does not allow anonymous calls.
- **B. Hard-coded key / D. Shared secret:** keys leak through source control and cannot be tied to a person or app.

Source: https://learn.microsoft.com/en-us/azure/foundry/how-to/develop/sdk-overview

</details>

### 2. Which client calls responses.create?

- A. Speech client
- B. Project client only
- C. OpenAI-compatible client from get_openai_client
- D. Search client

<details><summary>Answer</summary>

**Correct: C.** `AIProjectClient` manages project resources (agents, connections, evaluations, deployments). To call the **Responses API** (and chat completions, embeddings, conversations) you ask the project client for an **OpenAI-compatible client** with `get_openai_client()`; it is already pointed at your project and authenticated with the same credential.

```python
openai = project.get_openai_client()
response = openai.responses.create(model="gpt-4.1-mini", input="Say hello in French.")
print(response.output_text)
```

**Why the others are wrong:**
- **A. Speech client:** for speech recognition and synthesis.
- **B. Project client only:** it has no `responses.create`; it hands you the OpenAI client.
- **D. Search client:** queries Azure AI Search indexes.

Source: https://learn.microsoft.com/en-us/azure/foundry/how-to/develop/sdk-overview

</details>

### 3. You still see 1.x behavior and missing features. Why?

- A. Low quota
- B. Old azure-ai-projects version
- C. Wrong region
- D. No tracing

<details><summary>Answer</summary>

**Correct: B.** The new Foundry experience (agents, Responses API, conversations) is exposed by **`azure-ai-projects` 2.x**. Version 1.x targets the earlier model and lacks the new features. Check and upgrade, then rerun.

```bash
pip show azure-ai-projects          # check the installed version
pip install --upgrade azure-ai-projects
```

**Why the others are wrong:**
- **A. Low quota:** produces 429 errors, not missing methods.
- **C. Wrong region:** produces "model not available" errors.
- **D. No tracing:** only affects telemetry.

Source: https://learn.microsoft.com/en-us/azure/foundry/how-to/develop/sdk-overview

</details>

### 4. Where is the project endpoint hosted?

- A. services.ai.azure.com/api/projects/<project>
- B. blob.core.windows.net
- C. search.windows.net
- D. openai.azure.com

<details><summary>Answer</summary>

**Correct: A.** A Foundry project endpoint has the form `https://<resource-name>.services.ai.azure.com/api/projects/<project-name>`. It is one URL for the project's agents, evaluations and the OpenAI-compatible routes. Set it as an environment variable, not in code.

```python
import os
PROJECT_ENDPOINT = os.environ["PROJECT_ENDPOINT"]   # https://my-resource.services.ai.azure.com/api/projects/my-project
```

Other service hostnames to recognize: `blob.core.windows.net` (Storage), `search.windows.net` (Azure AI Search), `openai.azure.com` (Azure OpenAI resource endpoint, an older style used by direct model calls).

**Why the others are wrong:**
- **B, C, D:** they are the endpoints of Storage, Search and Azure OpenAI, not of a Foundry project.

Source: https://learn.microsoft.com/en-us/azure/foundry/how-to/develop/sdk-overview

</details>
