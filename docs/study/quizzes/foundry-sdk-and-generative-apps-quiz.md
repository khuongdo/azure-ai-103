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

**Correct: C.** Entra ID credentials avoid keys.
**Incorrect:** the other options do not fit — insecure.
Source: https://learn.microsoft.com/en-us/azure/foundry/how-to/develop/sdk-overview

</details>

### 2. Which client calls responses.create?

- A. Speech client
- B. Project client only
- C. OpenAI-compatible client from get_openai_client
- D. Search client

<details><summary>Answer</summary>

**Correct: C.** The OpenAI-compatible client handles Responses.
**Incorrect:** the other options do not fit — wrong.
Source: https://learn.microsoft.com/en-us/azure/foundry/how-to/develop/sdk-overview

</details>

### 3. You still see 1.x behavior and missing features. Why?

- A. Low quota
- B. Old azure-ai-projects version
- C. Wrong region
- D. No tracing

<details><summary>Answer</summary>

**Correct: B.** 2.x targets the new Foundry.
**Incorrect:** the other options do not fit — unrelated.
Source: https://learn.microsoft.com/en-us/azure/foundry/how-to/develop/sdk-overview

</details>

### 4. Where is the project endpoint hosted?

- A. services.ai.azure.com/api/projects/<project>
- B. blob.core.windows.net
- C. search.windows.net
- D. openai.azure.com

<details><summary>Answer</summary>

**Correct: A.** Matches the SDK overview.
**Incorrect:** the other options do not fit — other services.
Source: https://learn.microsoft.com/en-us/azure/foundry/how-to/develop/sdk-overview

</details>
