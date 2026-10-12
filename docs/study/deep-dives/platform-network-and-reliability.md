---
domain: Plan and manage an Azure AI solution
skill: Set up AI solutions in Foundry; design Azure infrastructure; configure security (private networking, keyless credentials, role policies)
sources:
  - https://learn.microsoft.com/en-us/azure/foundry/what-is-foundry
  - https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat
  - https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/virtual-networks
  - https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/use-your-own-resources
  - https://learn.microsoft.com/en-us/azure/foundry/concepts/rbac-foundry
  - https://learn.microsoft.com/en-us/azure/foundry/foundry-models/quotas-limits
retrieved: 2026-10-12
---

# Deep dive: designing the platform (structure, network, data, recovery)

A typical situation: "Three teams will build agents. Security requires no public endpoints, no secrets, and customer-owned data. How do you set it up?" This page explains the building blocks and the reasons behind each choice.

Part of the [best practices overview](best-practices-and-real-world-scenarios.md). Items marked `[NEEDS VERIFICATION]` are not confirmed on Microsoft Learn.

---

## 1. The resource model

```
Subscription
 └─ Foundry resource  (administrative, security and monitoring boundary; holds model deployments, connections)
     ├─ Project A  (organizes work and access control; its own managed identity and connections)
     │    └─ Agents (versioned)
     └─ Project B
```

Key facts:

- A **Foundry resource** is the top-level scope for networking, policy, RBAC and quota. Model deployments live here (max **32** per resource); a resource can have up to **250** projects; **100** Foundry resources per region per subscription.
- A **project** is a sub-scope for organizing work and enforcing access for APIs, tools and developer workflows. Agents live in projects.
- Older **hub-based projects** (hub + Azure OpenAI + AI Services) are the *classic* experience. Current guidance and new features target Foundry resources and projects. There is **no direct upgrade path** for agents, files, conversations or vector stores from hub-based projects to Foundry projects, nor from Azure OpenAI Assistants to Foundry agents. You can reuse model deployments and quota. You can also upgrade an Azure OpenAI resource to a Foundry resource while keeping endpoint, keys and state.
- SDK note: hub-based projects used a **connection string**; Foundry projects use a **project endpoint**. Current SDKs no longer accept connection strings.

### How many resources and projects? A decision guide

| Situation | Design | Reason |
|---|---|---|
| Production vs experimentation vs testing | **Separate Foundry resources** per environment | Isolates quota, policy, data and blast radius |
| One high-value production workload | **Dedicated Foundry resource** | Keeps quota and compliance scope separate |
| Different agents need different access to data | **One project per distinct access pattern** | All agents in a project share one managed identity |
| Two teams must not see each other's data | Separate projects with scoped roles and **project-level connections** | Resource-level connections would be inherited by future projects |
| Many similar internal prototypes | One project per team, shared resource | Fewer resources to govern |

---

## 2. Identity: no keys, least privilege

### Why not keys
An API key grants **full access** to the resource with no role restrictions and cannot say *who* did something. **Microsoft Entra ID** with **managed identities** gives per-caller identity, role-based limits, and no secret to leak or rotate. Use **Azure Policy** to turn off key-based (local) authentication.

### Managed identity design rules
- Create identities **per resource and function** (isolation limits blast radius).
- Assign an identity **only when a resource must authenticate to another Azure service**.
- Prefer Entra-based connections over preshared secrets. A dedicated **Key Vault** holds only the secrets Foundry still requires.
- Use a **user-assigned managed identity** for projects when you want role assignments to survive project recreation.

### Roles (recap)
Foundry User (build and test), Agent Consumer (call agents only), Project Manager (publish agents, assign Foundry User), Account Owner (accounts, models), Owner (all). Give the **project's managed identity** Foundry User on the Foundry resource too, or features fail silently.

Provisioning vs runtime are **two different identities needing two sets of roles**: the person or pipeline that deploys needs roles such as Storage Blob Data Contributor and Cosmos DB Operator on bring-your-own resources; the **project managed identity** needs data-plane roles at runtime. A common failure is granting only the first set.

### Application-level authorization
Foundry does **not** enforce per-user access to conversations. Your application must check that the caller owns the conversation, otherwise one user could read another's by guessing an ID (broken object-level authorization).

---

## 3. Network isolation: how a "private" Foundry works

### The goal
No traffic crosses the public internet, and nothing outside your network can call the service. The pattern combines **inbound** private endpoints and **outbound** subnet injection.

| Direction | Mechanism | Detail |
|---|---|---|
| Inbound (clients to Foundry) | **Private endpoint** to the Foundry resource, public network access **Disabled** | Applies to REST and WebSocket |
| Outbound (agents to your data) | **Virtual network injection** of the agent runtime into a **delegated subnet** | Subnet delegated to `Microsoft.App/environments` |
| Data stores | **Private endpoints** for Storage, AI Search, Cosmos DB | **Not auto-created**; you create them yourself |
| Name resolution | **Private DNS zones** linked to the VNet | Otherwise names still resolve to public IPs |

DNS zones to remember:

| Service | Private DNS zone(s) |
|---|---|
| Foundry | `privatelink.cognitiveservices.azure.com`, `privatelink.openai.azure.com`, `privatelink.services.ai.azure.com` |
| AI Search | `privatelink.search.windows.net` |
| Cosmos DB | `privatelink.documents.azure.com` |
| Storage (blob) | `privatelink.blob.core.windows.net` |

Custom DNS servers forward these zones to the Azure DNS virtual server `168.63.129.16`.

### Rules and limits that cause real failures
- The **Foundry resource must be in the same region as the VNet**; other resources may be elsewhere (cost implications).
- Agent subnet: private address space (RFC 1918 or `100.64.0.0/10` with exclusions), **dedicated per Foundry resource** (cannot be shared), size **/24 recommended** (minimum /27 for portal injection), name up to 63 bytes. No overlapping ranges with peered networks.
- Required resource providers: `Microsoft.KeyVault`, `CognitiveServices`, `Storage`, `MachineLearningServices`, `Search`, `Network`, `App`, `ContainerService` (and `Bing` for Bing grounding).
- Firewall: allow Entra endpoints (for example `login.microsoftonline.com`) or the AzureActiveDirectory service tag; **do not do TLS inspection** on agent traffic, since a substituted certificate breaks connections. NSGs on the agent subnet need matching outbound rules.
- **Hosted agents:** network injection must be set when the Foundry account is **first created** (cannot be added later); the agent endpoint itself stays publicly addressable in the azd preview, so isolate **sessions per user**.
- **Tool limits in a private setup:** Blob Storage files with the File Search tool are not supported; Code Interpreter works without file upload/download unless you pre-create a container via the SDK; Bing grounding is limited to listed regions.
- To access a locked-down project: VPN gateway, ExpressRoute, or **Azure Bastion to a jump box** inside the VNet. Build agents run from **self-hosted runners inside the VNet**, because public workstations get 403 or connection errors.
- Delete order: purge the Foundry resource before deleting the VNet, or the subnet keeps a service association link.

### Typical network symptoms and causes

| Symptom | Likely cause |
|---|---|
| Names resolve to public IPs from inside the VNet | Private DNS zone not linked, or no conditional forwarder to `168.63.129.16` |
| "Timeout" loading the Agents page | Cannot reach Cosmos DB (private endpoint or DNS) |
| Provisioning fails on subnet | Missing delegation to `Microsoft.App/environments`, or wrong address range |
| Capability host creation error about connections | One of the three BYO resources missing |
| Works in portal, fails from CI | CI runner is outside the VNet |

---

## 4. Who owns the data? Bring your own resources

By default Agent Service manages storage for files, conversations and vector stores. The **standard agent setup** puts them in **your** resources so you have full ownership, customer-managed keys and network isolation:

| Data | Stored in |
|---|---|
| Conversations, agent definitions, run state | **Azure Cosmos DB for NoSQL** |
| Uploaded files | **Azure Storage** |
| Vector stores for file search | **Azure AI Search** |

A **network-secured standard setup requires all three**. Choosing:

| Option | State lives in | Use when |
|---|---|---|
| **Basic setup** | Platform-managed storage; compatible with Assistants | Getting started; no ownership requirement |
| **Standard setup** | Your Storage, Cosmos DB, AI Search | Compliance, data residency, CMK, private networking |

Capacity planning for Cosmos DB (a worked calculation): each project needs **3 to 5 containers of 1,000 RU/s each**; 3 are created at provisioning and up to 2 more appear when Responses API agents are used. So:

```
2 projects, both with Responses API agents:  5 containers × 1,000 RU/s × 2 = 10,000 RU/s
2 projects with only classic (Assistants) agents: 3 × 1,000 × 2 = 6,000 RU/s
```

Minimum account throughput is 3,000 RU/s; provisioned and serverless are both supported. Too few RU/s causes **provisioning failures**. Keep the Azure OpenAI resource, Foundry account and project in the **same region**.

Roles on BYO resources: give the Foundry account's managed identity access (for example Storage Blob Data Reader/Contributor on storage, search roles on AI Search, Cosmos data-plane roles). `Cosmos DB Built-in Data Reader` is a **Cosmos data-plane role**, assigned with `az cosmosdb sql role assignment create`, not `az role assignment create`.

---

## 5. Reliability: what Foundry does **not** do for you

| Concern | Reality | What you do |
|---|---|---|
| Backup and disaster recovery of agents | **No built-in backup, DR or point-in-time restore** in Agent Service | Define agents **as code**; **Cosmos DB continuous backup** (7-day PITR), restore to the same account and database |
| Zone failure | Depends on your dependencies | Zone-redundant Cosmos DB, **ZRS/GZRS** storage, **at least 3 AI Search replicas**, Azure Firewall across all zones with multiple public IPs |
| Model deployment failover | Foundry does **not** load-balance or fail over deployments | Gateway such as **API Management** (routing, health checks, circuit breaking); Data Zone/Global types; provisioned **spillover** |
| Standard deployments | Single region, no availability-zone support | Use Global or Data Zone types where residency allows |
| Accidental deletion | State can be lost catastrophically | **Delete locks** on Agent Service dependencies |
| Regional outage | **Foundry itself does not provide automatic failover or disaster recovery.** You and Microsoft share responsibility: Microsoft runs the control plane and agent runtime; you own the durability of Cosmos DB, AI Search and Storage in standard setup | Cosmos DB **read replica in a failover region with service-managed failover**; GZRS storage; rebuild from code (see the recovery checklist below) |
| Recreating a project | Role assignments tied to the old identity | User-assigned managed identity reused across recreations |

Isolate Agent Service dependencies from other workloads' resources so one workload's failure or recovery does not affect another.

### Recovery checklist (from Learn's resiliency guidance)

Configure these **before** an incident; the recovery steps assume they exist.

| Resource | Setting | Why |
|---|---|---|
| Foundry project | **User-assigned** managed identity, not system-assigned | Restores access to dependencies without reapplying role assignments |
| Foundry Agent Service | **Standard** agent setup | Basic mode has almost no recovery options for resource loss |
| Azure Cosmos DB | **Continuous backup** with point-in-time restore (7, 30 or 35-day retention tiers; point-in-time restore is unavailable unless enabled beforehand) | Recover the `enterprise_memory` database, containers, or the whole account |
| Azure Cosmos DB | A **unique, organization-specific account name** | A restore creates a new account with the original name; the restore fails if the name is taken |
| Azure Cosmos DB | Read replication to the failover region + **service-managed failover** | Lets the service switch the write region in a prolonged regional outage |
| Azure AI Search | A unique, organization-specific service name | A restore creates a new service with the original name |
| Azure Storage | **GZRS** | Allows customer-managed failover to a predetermined region |
| Foundry account | Explicit connection to **Microsoft Purview** | Data continuity for compliance (for example eDiscovery) after thread data is lost |
| All critical resources | **Delete locks** (need Owner to create) plus Azure Policy `denyAction` | Locks do not protect data inside containers, indexes or individual agents and threads |

Also dedicate Cosmos DB, AI Search and Storage **exclusively** to one workload's Agent Service (single responsibility), and use zone-redundant configurations (they protect against zone failure, not regional outage or human error). Even built-in roles such as Foundry User can delete operational data through the Agent Service APIs, and no built-in AI role is read-only for those operations, so grant standing delete permissions to no one in production. Source: [High availability and resiliency](https://learn.microsoft.com/en-us/azure/foundry/how-to/high-availability-resiliency).

### Encryption with customer-managed keys

Foundry supports **customer-managed keys** held in Azure Key Vault or Azure Managed HSM. You create or import a key, grant the Foundry resource's managed identity permission to use it (for Key Vault with Azure RBAC, the **Key Vault Crypto User** role), then enable CMK on the resource; you can do this when creating the resource or on an existing one. For agents: **prompt agents support CMK only with bring-your-own (customer-managed) storage**, so configure CMK separately on Cosmos DB, Storage and AI Search; **hosted agents are only partly covered** because the `$HOME` filesystem is on platform-managed storage that is not encrypted with CMK. Source: [Customer-managed keys in Foundry](https://learn.microsoft.com/en-us/azure/foundry/concepts/customer-managed-keys).

---

## 6. Governing the whole estate

- **Infrastructure as code** for resources, projects, agents and connections. Reason: portal actions run under the service identity and can bypass constraints; portal-created projects do not inherit network controls; untracked portal edits are unreproducible. Treat **project creation as privileged**.
- **Azure Policy:** require private endpoints and NSGs, customer-managed keys, allowed regions, disable local auth, and restrict deployment types (deny `sku.name` on `Microsoft.CognitiveServices/accounts/deployments`).
- **Defender for AI services:** alerts on jailbreak attempts and data leakage.
- **Models:** approved consumers only (prevents cost exposure); set model version to **no auto-upgrade** so changes are validated first.
- **Entry point:** only an Application Gateway with WAF (plus DDoS protection) faces the internet; scope WAF exclusions to the chat message field to avoid false positives without disabling rules.
- **Egress control:** a dedicated agent subnet with a user-defined route to Azure Firewall and FQDN rules prevents data exfiltration.

---

## 7. Worked scenario

> **Problem.** A bank wants three internal agent teams. Rules: no public access, no stored secrets, conversation data in the bank's own subscription, production must survive a zone failure, and teams must not read each other's data.

A defensible design:

1. **Environments:** one Foundry resource per environment (dev, test, prod); prod is its own resource.
2. **Teams:** one **project per team** (or per access pattern) with **project-level connections**; role **Foundry User** scoped to each team's project only; callers use **Agent Consumer**.
3. **Network:** private endpoints on Foundry, Storage, AI Search, Cosmos DB; public access disabled; VNet-injected agent subnet (/24, delegated); private DNS zones linked; Application Gateway + WAF as the only public door; Azure Firewall for egress.
4. **Data:** **standard agent setup** with the bank's Cosmos DB, Storage and AI Search; size Cosmos DB RU/s by the container rule; customer-managed keys via policy.
5. **Identity:** managed identities and Entra only; Azure Policy disables keys; project managed identity has Foundry User; application enforces conversation ownership.
6. **Reliability:** zone-redundant Cosmos DB and storage, 3+ search replicas, agents as code, continuous backup, delete locks, APIM gateway for model routing, provisioned throughput with spillover for production SLOs.
7. **Operations:** IaC deploy from self-hosted runners in the VNet; evaluation gates; diagnostics to Log Analytics.


## Sources

See the frontmatter. The bank scenario and decision tables are teaching syntheses of the cited guidance.
