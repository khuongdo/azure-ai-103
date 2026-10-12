---
domain: Implement generative AI and agent solutions
skill: Build generative AI apps with the Foundry SDK, the project endpoint and OpenAI-compatible APIs
sources:
  - https://learn.microsoft.com/en-us/azure/foundry/how-to/develop/sdk-overview
  - https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/reasoning
retrieved: 2026-10-12
---

# Deep dive: the Foundry SDK and generative apps

The hardest part for beginners is not the code. It is knowing **which endpoint and which client** to use for which job. This page sorts that out first, then walks through a first call.

Items marked `[NEEDS VERIFICATION]` are not confirmed on Microsoft Learn.

---

## 1. One resource, several endpoints

A **Foundry resource** gives unified access to models, agents and tools. An **Azure OpenAI resource** gives only the `/openai/v1` endpoint.

| Endpoint | Format | Use it for |
|---|---|---|
| **Project endpoint** | `https://<resource>.services.ai.azure.com/api/projects/<project>` | Foundry SDK: agents, connections, evaluations, tracing, Responses |
| **OpenAI-compatible endpoint** | `https://<resource>.openai.azure.com/openai/v1/` | OpenAI SDK, full OpenAI API surface, best latency, **embeddings** |
| **Tool-specific endpoints** | One per tool (Speech, Language, Vision, Content Safety ...) | Foundry Tools SDKs |

Important details from Learn:
- The project endpoint does **not currently route embedding requests**. Create embeddings through the `/openai/v1` endpoint.
- If your organization uses a custom subdomain, replace `<resource>` with it in the URL.
- Higher-level SDKs build on the Foundry SDK; the Agent Framework `foundry` package depends on it, so you do not wire the project endpoint twice.

### Which SDK for which job?
| Job | SDK |
|---|---|
| Call a model, manage agents, run evaluations, read project connections | **Foundry SDK** (`azure-ai-projects`) |
| Use the full OpenAI API surface or existing OpenAI code | **OpenAI SDK** on `/openai/v1` |
| Hosted agents and multi-agent systems in code (C#/.NET, Python) | **Agent Framework** |
| Speech, Vision, Language, Content Safety | **Foundry Tools SDKs** |

---

## 2. Packages and versions

| Language | Install | Notes |
|---|---|---|
| Python | `pip install "azure-ai-projects>=2.3.0" "openai>=3.0.0"` | 2.x = Foundry (new), needs Python 3.10+. 1.x (`==1.0.0`) = Foundry classic |
| JavaScript | `npm install @azure/ai-projects @azure/identity` | Classic version shown as 1.0.1 on the page |
| .NET | `dotnet add package Azure.AI.Projects`, `Azure.AI.Projects.Agents`, `Azure.AI.Extensions.OpenAI`, `Azure.Identity` | Classic version shown as 1.1.0 |
| Java | `azure-ai-agents` / `azure-ai-projects` | Same single-endpoint model |

`[NEEDS VERIFICATION]` Exact package versions change quickly; confirm on the SDK overview page before pinning.

Why the version matters: **1.x targets Foundry classic and 2.x targets the new Foundry**. Mixing them is a common cause of "method not found" or missing features.

---

## 3. First call, step by step

1. **Get the project endpoint** from the Foundry portal and confirm the format `https://<resource>.services.ai.azure.com/api/projects/<project>`.
2. **Give yourself a role.** Learn lists **Foundry User** to use a project and **Foundry Project Manager** to manage a project and its connections.
3. **Sign in locally** (`az login`). In Azure, use a managed identity.
4. **Create the client** with `DefaultAzureCredential` (keyless).
5. **Get the OpenAI-compatible client** from the project client.
6. **Call the Responses API** with a model deployment name.
7. **Read the result** and check status, usage and any tool calls.

```python
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

project = AIProjectClient(
    endpoint="https://<resource>.services.ai.azure.com/api/projects/<project>",
    credential=DefaultAzureCredential(),
)
openai = project.get_openai_client()

response = openai.responses.create(
    model="<deployment-name>",
    input="Summarize our refund policy in two sentences.",
    max_output_tokens=300,
)
print(response.output_text)
```

*What can go wrong, and how to check:*

| Symptom | Likely cause | Check |
|---|---|---|
| 401 / 403 | Missing role or wrong tenant | `az account show`; verify the role on the project |
| 404 on the model | Using the model name instead of the **deployment name** | Compare with the Deployments list |
| Endpoint errors | Wrong URL format or custom subdomain not applied | Re-check the format above |
| Embeddings fail on project client | Project endpoint does not route embeddings | Use the `/openai/v1` endpoint |
| Output empty with a reasoning model | Token cap consumed by reasoning | Check `status` and `reasoning_tokens` (see [Model selection](model-and-service-selection.md)) |

### Direct OpenAI SDK
When you want the full OpenAI surface, point the OpenAI client at `https://<resource>.openai.azure.com/openai/v1/`. API keys are allowed here, but prefer Entra ID tokens.

---

## 4. Worked example: choosing clients for one app

An internal assistant must (a) answer questions with a model, (b) index documents with embeddings, (c) transcribe uploaded calls, (d) run nightly evaluations.
- (a) Foundry SDK `project.get_openai_client()` → `responses.create`.
- (b) OpenAI-compatible client on `/openai/v1` → embeddings (project endpoint does not route them).
- (c) Speech SDK on the Speech endpoint (see [Speech solutions](speech-solutions.md)).
- (d) Foundry SDK evaluations (OpenAI-compatible client handles evaluations and fine-tuning).

---

## 5. Quality and cost levers in the app
- **Retrieval first** (ground answers; see [Retrieval and grounding](rag-retrieval-and-grounding.md)).
- **Structured Outputs** when your code parses the result.
- **`max_output_tokens`** on every call to bound cost.
- **Retries with backoff** on 429; log request IDs.
- **Tracing** through the project client so each call can be inspected (see [Observability](observability-and-agent-lifecycle.md)).
- **Identity:** keyless auth; no keys in code or repos.

---

## Sources
- [Foundry SDKs and endpoints](https://learn.microsoft.com/en-us/azure/foundry/how-to/develop/sdk-overview)
- [Reasoning models](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/reasoning)
