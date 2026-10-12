---
note: docs/study/deep-dives/platform-network-and-reliability.md
skill: Set up AI solutions in Foundry; design Azure infrastructure; configure security (private networking, keyless credentials, role policies)
retrieved: 2026-10-12
---

# Quiz: platform, network and reliability

Answers and explanations come from the [deep dive](../deep-dives/platform-network-and-reliability.md), which cites Microsoft Learn. Try each question before opening the answer.

## Flashcards

**Q:** What is the current resource model replacing "hub + projects"?
**A:** A **Foundry resource** that contains **projects**.

**Q:** How many model deployments can one Foundry resource hold?
**A:** **32**.

**Q:** How many projects can one Foundry resource hold?
**A:** **250**.

**Q:** Which three BYO resources does a network-secured standard agent setup require?
**A:** **Azure Cosmos DB** (conversations), **Azure Storage** (files), **Azure AI Search** (vector stores).

**Q:** How many containers and RU/s does each project need in Cosmos DB?
**A:** **3 to 5 containers**, each **1,000 RU/s**.

**Q:** Which delegation must the agent subnet have?
**A:** `Microsoft.App/environments`.

**Q:** Can an agent subnet be shared by several Foundry resources?
**A:** No. Each Foundry resource needs a **dedicated** agent subnet.

**Q:** Must the Foundry resource and its VNet be in the same region?
**A:** Yes.

**Q:** Are private endpoints for Storage, Search and Cosmos DB created automatically with Foundry?
**A:** No. You create them yourself.

**Q:** Which IP does a custom DNS server forward private zones to?
**A:** The Azure DNS virtual server **168.63.129.16**.

**Q:** Does Agent Service include built-in backup or disaster recovery?
**A:** No. Use **agents as code** and **Cosmos DB continuous backup** (7-day PITR).

**Q:** Why avoid TLS inspection on agent traffic?
**A:** Inspection certificates can break agent connections.

**Q:** What should you use to disable key-based authentication across many resources?
**A:** **Azure Policy**.

**Q:** Why should projects be created through infrastructure as code in production?
**A:** Portal-created projects do not inherit network controls, and portal actions can bypass constraints.

## Practice questions

### 1. You are designing a new Foundry environment for several teams. Which resource structure should you use?

- A. One Azure OpenAI resource per team plus a shared hub
- B. One hub with one workspace per team
- C. Classic hub-based projects, because they have the most features
- D. A Foundry resource with a project per team or access pattern

<details><summary>Answer</summary>

**Correct: D.** The current model is a Foundry resource (administrative, security and monitoring boundary) containing projects. Hub-based projects belong to the classic experience.
**Incorrect:** A and B — they describe the older hub and Azure OpenAI structure; C — new investment is on Foundry projects, and there is no direct upgrade path for agents and data from hub-based projects.
Source: https://learn.microsoft.com/en-us/azure/foundry/what-is-foundry

</details>

### 2. You disabled public network access on a Foundry resource and added a private endpoint. Agents still cannot reach the Cosmos DB account that stores their conversations. What should you do?

- A. Re-enable public access on the Foundry resource
- B. Create private endpoints for Cosmos DB (and Storage and AI Search) and link the private DNS zones to the VNet
- C. Add another Foundry project
- D. Change the model deployment type

<details><summary>Answer</summary>

**Correct: B.** Private endpoints to Azure AI Search, Storage and Cosmos DB are not created automatically. You must create them and make sure private DNS resolves each endpoint to a private IP.
**Incorrect:** A — it defeats the isolation goal; C — a project does not change dependency networking; D — deployment type is unrelated.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/virtual-networks

</details>

### 3. A Foundry account has three projects. All three use agents built on the Responses API with a bring-your-own Cosmos DB account. What minimum throughput should the Cosmos DB account provide for agent data?

- A. 3,000 RU/s
- B. 6,000 RU/s
- C. 15,000 RU/s
- D. 9,000 RU/s

<details><summary>Answer</summary>

**Correct: C.** Each project needs up to 5 containers of 1,000 RU/s when it uses Responses API agents: 5 x 1,000 x 3 = 15,000 RU/s.
**Incorrect:** A — that is the minimum account throughput for a standard setup in general; B — it ignores the two containers created for Responses API agents in some projects; D — it assumes 3 containers per project (3 x 1,000 x 3), which only holds for classic agents.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/use-your-own-resources

</details>

### 4. Compliance requires that all agent files, conversations and vector stores stay in the company's own Azure resources. Which option meets this?

- A. Basic agent setup
- B. Standard agent setup with your own Storage, Cosmos DB and AI Search
- C. Use the Developer deployment type
- D. Store the data in Application Insights

<details><summary>Answer</summary>

**Correct: B.** The standard setup stores files, conversations and vector stores in your resources, giving full ownership and control.
**Incorrect:** A — basic setup uses platform-managed storage; C — deployment types do not control agent data storage; D — Application Insights stores telemetry, not agent state.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/use-your-own-resources

</details>

### 5. An engineer accidentally deletes agents and their backing data. Foundry Agent Service has no built-in backup. What gives you recovery?

- A. Use the portal's restore feature for agents
- B. Open a support ticket to restore the agent service
- C. Re-create agents from source-controlled definitions and restore Cosmos DB from continuous backup
- D. Switch to a Standard deployment

<details><summary>Answer</summary>

**Correct: C.** Agents defined as code can be redeployed, and Cosmos DB continuous backup (7-day point-in-time restore) recovers definitions and conversations. Delete locks help prevent this in the first place.
**Incorrect:** A — there is no built-in agent restore; B — not a documented recovery path; D — deployment type has no effect on agent state.
Source: https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat

</details>

### 6. You are creating the agent subnet for a network-secured setup. Which requirement is correct?

- A. A shared subnet used by all Foundry resources
- B. A public IP range
- C. A subnet delegated to `Microsoft.App/environments`, dedicated to one Foundry resource
- D. A /30 subnet to save addresses

<details><summary>Answer</summary>

**Correct: C.** The agent subnet must be delegated to `Microsoft.App/environments` and cannot be shared across Foundry resources. A /24 is recommended.
**Incorrect:** A — subnets cannot be shared; B — public ranges are not allowed; D — far too small; the portal flow needs /27 or larger and /24 is recommended.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/virtual-networks

</details>

### 7. Your CI pipeline runs `azd up` from a public hosted runner against a Foundry project that has public access disabled. Control-plane calls work, but data-plane calls fail with 403 or connection errors. What should you do?

- A. Re-enable public network access
- B. Add the runner's public IP to the Storage firewall only
- C. Use a different region
- D. Run the pipeline on a self-hosted runner inside the VNet

<details><summary>Answer</summary>

**Correct: D.** Data-plane access to a private Foundry requires network reachability, so run CI from a self-hosted runner or agent in the VNet (or use Bastion to a jump host).
**Incorrect:** A — it removes the isolation requirement; B — it does not make the Foundry data plane reachable; C — the region does not change reachability.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/virtual-networks

</details>

### 8. Security requires that no application uses API keys for Foundry. How can you enforce this across the subscription?

- A. Ask developers not to copy keys
- B. Store keys in Key Vault
- C. Rotate keys weekly
- D. Use Azure Policy to disable key-based (local) authentication and use Microsoft Entra ID with managed identities

<details><summary>Answer</summary>

**Correct: D.** Policy enforces the rule centrally. Entra ID with managed identities gives per-caller identity and role limits.
**Incorrect:** A — a convention, not enforcement; B — keys still exist and grant full access; C — rotation reduces exposure but does not remove keys.
Source: https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat

</details>

### 9. Two teams share one Foundry resource and must not be able to use each other's tool connections or data. What design supports this?

- A. One project, with all agents sharing connections at the resource level
- B. Separate projects with project-level connections and scoped roles
- C. One project and a naming convention
- D. Assign Foundry Owner to both teams

<details><summary>Answer</summary>

**Correct: B.** All agents in a project share one managed identity, and project-level connections prevent future projects from inheriting access.
**Incorrect:** A — resource-level connections would be inherited by other projects; C — naming is not access control; D — Foundry Owner is highly privileged and grants broad access.
Source: https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat

</details>

### 10. A deployment pipeline grants the deploying identity Storage Blob Data Contributor and Cosmos DB Operator on the bring-your-own resources. Provisioning succeeds, but agents fail at runtime to read and write conversations. What is missing?

- A. Data-plane roles for the project managed identity on Cosmos DB, AI Search and Storage
- B. A second subscription
- C. The Foundry Account Owner role for the agents
- D. A larger agent subnet

<details><summary>Answer</summary>

**Correct: A.** Provisioning and runtime use different identities. The project managed identity is what running agents use to reach Cosmos DB, Search and Storage, and it needs its own data-plane roles.
**Incorrect:** B — not related; C — that role is for managing accounts, not for agent data access; D — subnet size does not grant data access.
Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/virtual-networks

</details>
