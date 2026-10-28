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

**Q:** Private endpoint versus service endpoint?
**A:** Private endpoint gives a private IP in your VNet and allows disabling public access; service endpoint keeps the public IP and filters by subnet.

## Practice questions

### 1. You are designing a new Foundry environment for several teams. Which resource structure should you use?

- A. One Azure OpenAI resource per team plus a shared hub
- B. One hub with one workspace per team
- C. Classic hub-based projects, because they have the most features
- D. A Foundry resource with a project per team or access pattern

<details><summary>Answer</summary>

**Correct: D.** In the current Foundry model, the **Foundry resource** (a Cognitive Services account of kind AIServices) is the top-level boundary for administration, security, networking and monitoring, and it contains **projects**. Create one project per team or per access pattern: each project has its own agents, files, connections and managed-identity scope, so teams are separated without separate top-level resources. **Hub-based projects** belong to the classic experience and there is no direct upgrade path for agents and data.

```
Foundry resource (network, policy, monitoring)
 ├── project-team-a   (agents, connections, role assignments for team A)
 └── project-team-b
```

**Why the others are wrong:**
- **A. One Azure OpenAI resource per team plus a hub / B. One hub with a workspace per team:** describe the older structure.
- **C. Classic hub-based projects:** new investment is on Foundry projects.

Source: https://learn.microsoft.com/en-us/azure/foundry/what-is-foundry

</details>

### 2. You disabled public network access on a Foundry resource and added a private endpoint. Agents still cannot reach the Cosmos DB account that stores their conversations. What should you do?

- A. Re-enable public access on the Foundry resource
- B. Create private endpoints for Cosmos DB (and Storage and AI Search) and link the private DNS zones to the VNet
- C. Add another Foundry project
- D. Change the model deployment type

<details><summary>Answer</summary>

**Correct: B.** Turning off public access and adding a private endpoint for the Foundry resource secures only that resource. Agent Service also uses **dependencies**: Cosmos DB (conversations), Storage (files) and Azure AI Search (vector stores). **Their private endpoints are not created automatically.** Each dependency needs its own private endpoint, and a **private DNS zone** linked to the VNet so that its name resolves to a private IP.

| Resource | Typical private DNS zone |
|---|---|
| Foundry / Cognitive Services | `privatelink.cognitiveservices.azure.com`, `privatelink.openai.azure.com`, `privatelink.services.ai.azure.com` |
| Cosmos DB (NoSQL) | `privatelink.documents.azure.com` |
| Storage (blob) | `privatelink.blob.core.windows.net` |
| Azure AI Search | `privatelink.search.windows.net` |

```bash
az network private-endpoint create -g rg -n pe-cosmos --vnet-name vnet --subnet pe-subnet \
  --private-connection-resource-id <cosmos-account-id> --group-id Sql --connection-name cosmos-conn
```

Verify with `nslookup <account>.documents.azure.com` from inside the VNet: it must return a private IP.

**Why the others are wrong:**
- **A. Re-enable public access:** defeats the goal.
- **C. Another project / D. Deployment type:** neither changes how dependencies are reached.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/virtual-networks

</details>

### 3. A Foundry account has three projects. All three use agents built on the Responses API with a bring-your-own Cosmos DB account. What minimum throughput should the Cosmos DB account provide for agent data?

- A. 3,000 RU/s
- B. 6,000 RU/s
- C. 15,000 RU/s
- D. 9,000 RU/s

<details><summary>Answer</summary>

**Correct: C.** For agents built on the Responses API with a bring-your-own Cosmos DB account, **each project** needs up to **5 containers at 1,000 RU/s each** (5,000 RU/s per project). Three projects: 3 x 5 x 1,000 = **15,000 RU/s**.

| Answer | Arithmetic it matches |
|---|---|
| 3,000 | 1 container x 3 projects |
| 6,000 | 2 containers x 3 projects |
| 9,000 | 3 containers x 3 projects (classic agents) |
| **15,000** | **5 containers x 3 projects (Responses API agents)** |

Plan this when you size the account and set autoscale or provisioned throughput; a too-small account causes 429 errors on agent conversations.

**Why the others are wrong:** each uses the wrong container count (see the table).

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/use-your-own-resources

</details>

### 4. Compliance requires that all agent files, conversations and vector stores stay in the company's own Azure resources. Which option meets this?

- A. Basic agent setup
- B. Standard agent setup with your own Storage, Cosmos DB and AI Search
- C. Use the Developer deployment type
- D. Store the data in Application Insights

<details><summary>Answer</summary>

**Correct: B.** Agent Service has two setups:
- **Basic:** Microsoft-managed storage for agent data.
- **Standard:** your own **Azure Storage** (files), **Cosmos DB** (conversations, agent state) and **Azure AI Search** (vector stores). You own, secure, back up and audit the data, and can put it behind private endpoints.

If the requirement is "our own Azure resources", choose Standard. You also take on throughput planning (RU/s), roles for the project identity and DNS.

**Why the others are wrong:**
- **A. Basic setup:** platform-managed storage.
- **C. Developer deployment type:** deployment types control model inference, not agent data.
- **D. Application Insights:** telemetry only.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/use-your-own-resources

</details>

### 5. An engineer accidentally deletes agents and their backing data. Foundry Agent Service has no built-in backup. What gives you recovery?

- A. Use the portal's restore feature for agents
- B. Open a support ticket to restore the agent service
- C. Re-create agents from source-controlled definitions and restore Cosmos DB from continuous backup
- D. Switch to a Standard deployment

<details><summary>Answer</summary>

**Correct: C.** There is no built-in agent backup, so protect state yourself:
1. **Definitions as code:** keep agent definitions and prompts in Git (IaC or SDK scripts) and redeploy.
2. **Cosmos DB continuous backup** (point-in-time restore, 7-day window in the standard tier) for conversations and thread data.
3. **Delete locks** on the Foundry resource and dependencies, and restricted roles, to prevent accidental deletion.

```bash
az cosmosdb restore --target-database-account-name cosmos-restored \
  --account-name cosmos-prod --restore-timestamp 2026-10-27T08:00:00Z \
  --location westeurope --resource-group rg
az lock create --name no-delete --lock-type CanNotDelete --resource-group rg
```

**Why the others are wrong:**
- **A. Portal restore:** does not exist.
- **B. Support ticket:** not a documented recovery path.
- **D. Standard deployment:** has no effect on agent state.

Source: https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat

</details>

### 6. You are creating the agent subnet for a network-secured setup. Which requirement is correct?

- A. A shared subnet used by all Foundry resources
- B. A public IP range
- C. A subnet delegated to `Microsoft.App/environments`, dedicated to one Foundry resource
- D. A /30 subnet to save addresses

<details><summary>Answer</summary>

**Correct: C.** For a network-secured Agent Service, the **agent subnet** hosts the agent runtime (container apps environment), so it must be **delegated to `Microsoft.App/environments`**, and it is **dedicated to one Foundry resource** (cannot be shared). Use at least /27 for the portal flow; **/24 is recommended**. It must be a private range.

```bicep
resource agentSubnet 'Microsoft.Network/virtualNetworks/subnets@2024-05-01' = {
  parent: vnet
  name: 'agent-subnet'
  properties: {
    addressPrefix: '10.0.2.0/24'
    delegations: [ { name: 'app-env', properties: { serviceName: 'Microsoft.App/environments' } } ]
  }
}
```

**Why the others are wrong:**
- **A. Shared subnet:** not allowed.
- **B. Public IP range:** not allowed.
- **D. /30:** far too small.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/virtual-networks

</details>

### 7. Your CI pipeline runs `azd up` from a public hosted runner against a Foundry project that has public access disabled. Control-plane calls work, but data-plane calls fail with 403 or connection errors. What should you do?

- A. Re-enable public network access
- B. Add the runner's public IP to the Storage firewall only
- C. Use a different region
- D. Run the pipeline on a self-hosted runner inside the VNet

<details><summary>Answer</summary>

**Correct: D.** Control-plane calls (create resources) go through Azure Resource Manager, which is public. Data-plane calls (create agents, upload files, call the project endpoint) go to the private endpoint, which a public hosted runner cannot reach. Run the pipeline on a **self-hosted runner or agent inside the VNet** (or a peered VNet), or use Bastion to a jump host.

```yaml
jobs:
  deploy:
    runs-on: [self-hosted, vnet-runner]      # runner VM or container inside the VNet
```

**Why the others are wrong:**
- **A. Re-enable public access:** removes the isolation requirement.
- **B. Add runner IP to Storage firewall only:** does not make the Foundry data plane reachable.
- **C. Different region:** does not change reachability.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/virtual-networks

</details>

### 8. Security requires that no application uses API keys for Foundry. How can you enforce this across the subscription?

- A. Ask developers not to copy keys
- B. Store keys in Key Vault
- C. Rotate keys weekly
- D. Use Azure Policy to disable key-based (local) authentication and use Microsoft Entra ID with managed identities

<details><summary>Answer</summary>

**Correct: D.** A rule needs **enforcement**. **Azure Policy** can *audit or deny* resources with key-based (local) authentication enabled, across a subscription or management group, using a built-in definition such as "Cognitive Services accounts should have local authentication methods disabled". Applications then authenticate with **Microsoft Entra ID and managed identities**, which give per-caller identity, role-based limits and an audit trail.

```bicep
resource foundry 'Microsoft.CognitiveServices/accounts@2025-06-01' = {
  name: foundryName
  properties: { disableLocalAuth: true }     // keys no longer work
}
```

**Why the others are wrong:**
- **A. Ask developers:** a convention, not enforcement.
- **B. Key Vault:** the keys still exist and grant full access.
- **C. Rotate weekly:** shortens exposure but keys remain.

Source: https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat

</details>

### 9. Two teams share one Foundry resource and must not be able to use each other's tool connections or data. What design supports this?

- A. One project, with all agents sharing connections at the resource level
- B. Separate projects with project-level connections and scoped roles
- C. One project and a naming convention
- D. Assign Foundry Owner to both teams

<details><summary>Answer</summary>

**Correct: B.** Think of the **project** as the isolation unit inside a Foundry resource: agents in a project share one managed identity, and **project-level connections** are visible only to that project. With separate projects for Team A and Team B, each team's tools, data connections and role assignments are separate. Resource-level connections are inherited by every project, so avoid them for team-specific secrets or data.

**Why the others are wrong:**
- **A. One project, shared connections:** every agent can use every connection.
- **C. Naming convention:** not access control.
- **D. Foundry Owner:** highly privileged; gives each team broad access, including to the other's resources.

Source: https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat

</details>

### 10. A deployment pipeline grants the deploying identity Storage Blob Data Contributor and Cosmos DB Operator on the bring-your-own resources. Provisioning succeeds, but agents fail at runtime to read and write conversations. What is missing?

- A. Data-plane roles for the project managed identity on Cosmos DB, AI Search and Storage
- B. A second subscription
- C. The Foundry Account Owner role for the agents
- D. A larger agent subnet

<details><summary>Answer</summary>

**Correct: A.** Two different identities act at two different times:
- **Provisioning time:** the deploying identity (pipeline) needs rights to create resources and assign roles.
- **Run time:** the **project managed identity** reads and writes conversations, files and vectors. It needs **data-plane roles** on the dependencies, for example Cosmos DB data roles for the agent databases/containers, Storage Blob Data Contributor, and Search Index Data Contributor (plus Search Service Contributor if it creates indexes).

Provisioning succeeds because the pipeline identity has its rights; running agents fail because the project identity has none.

```bash
az role assignment create --assignee-object-id <project-identity-principal-id> \
  --assignee-principal-type ServicePrincipal --role "Storage Blob Data Contributor" --scope <storage-id>
```

**Why the others are wrong:**
- **B. Second subscription:** unrelated.
- **C. Foundry Account Owner:** a management role, not agent data access.
- **D. Larger subnet:** address space does not grant access.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/virtual-networks

</details>

### 11. An Azure OpenAI resource must not be reachable over the public internet. What do you configure?

- A. Service endpoint on the subnet
- B. Private endpoint and disable public network access
- C. Only an NSG rule
- D. A larger quota

<details><summary>Answer</summary>

**Correct: B.** A **private endpoint** gives the resource a private IP inside your VNet. Once it exists and DNS resolves to it, set **public network access = Disabled**, so the public endpoint stops answering. Traffic from outside the VNet (or peered networks) can no longer reach the resource.

```bash
az cognitiveservices account update -g rg -n my-aoai --public-network-access Disabled
```

**Why the others are wrong:**
- **A. Service endpoint:** the service keeps its public IP; the subnet is only allowed through a firewall rule.
- **C. NSG rule only:** does not remove the public endpoint.
- **D. Larger quota:** unrelated.

Source: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/virtual-networks

</details>
