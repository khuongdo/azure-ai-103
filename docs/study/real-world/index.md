# Real-world practice

AI-103 is about solving real business problems with Azure AI. Each page here takes **one realistic problem** and walks through it from end to end: the situation, why it needs these skills, the architecture, how to build it step by step, how to measure quality and safety, how to operate it, and what goes wrong in practice.

These pages are about **doing the job well**. Exam techniques are kept separate in [Exam tips](../exam-tips/index.md). For the mechanisms behind each building block, see the [deep dives](../deep-dives/best-practices-and-real-world-scenarios.md).

| Problem | What it shows | Main services |
|---|---|---|
| [Enterprise knowledge assistant](enterprise-knowledge-assistant.md) | Permission-aware answers with citations over company content | Foundry Agent Service, Foundry IQ, Azure AI Search |
| [Invoice and contract automation](document-processing-automation.md) | Structured extraction with confidence-based human review | Content Understanding, Document Intelligence |
| [Customer support agent](customer-support-agent.md) | An agent that answers and acts safely, with approvals and handoff | Foundry Agent Service, OpenAPI/MCP tools, guardrails |
| [Contact center voice and analytics](contact-center-voice-and-analytics.md) | A live voice agent plus analysis of every call | Voice Live, Azure Speech, Azure Language, Content Understanding |
| [Multilingual content pipeline](multilingual-content-pipeline.md) | Translating documents, text and speech with consistent terminology | Azure Translator, Azure Speech, Foundry models |
| [Media generation and understanding](multimodal-media-and-marketing.md) | Creating and searching images and video, with safety and provenance | Image and video generation, Content Understanding, AI Search |
| [Multi-agent workflow automation](multi-agent-workflow-automation.md) | Orchestrating agents, tools and human approvals (employee onboarding) | Microsoft Agent Framework, toolbox, A2A, MCP |
| [Shipping AI apps to production](shipping-ai-apps-to-production.md) | CI/CD, quality gates, security, cost and rollout for any of the above | Foundry, Azure Monitor, Azure Policy, IaC |

## How each page is organized

1. **The problem**: business situation, goals, constraints.
2. **Why this is an AI-103 problem**: the skills it uses.
3. **Solution architecture**: diagram and a table of components with the reason for each.
4. **Build it, step by step**.
5. **Quality and safety plan**: what to measure and how.
6. **Operating it**: monitoring, cost, change control.
7. **What goes wrong in practice**: symptoms, causes, fixes.
8. **Variations**: how the design changes in nearby situations.

## A note on certainty

Everything that comes from Microsoft Learn is cited in the page frontmatter. Example numbers, targets, timelines and pipeline layouts are **illustrative design choices**, not Microsoft requirements. Items marked `[NEEDS VERIFICATION]` still need to be confirmed on Microsoft Learn.
