---
name: explain-every-step-in-study-docs
description: "User wants study docs to explain every step of a pipeline, flow or diagram in detail, not just list the steps or give a terse summary"
metadata:
  node_type: memory
  type: feedback
  originSessionId: b798d91c-1675-4f60-a7a1-657e568ee753
  modified: 2026-10-12T08:57:05.817Z
---

When a study page shows a pipeline, flow, lifecycle, or architecture diagram (for example the RAG pipeline `documents → extract → chunk → embed → index → retrieve → rerank → prompt → LLM`), explain **each step**, not only the arrow chain or a failure table.

**Why:** The user (studying for AI-103) said an earlier page was "too sketchy" (giải thích sơ sài quá), then pointed at section 1 of the RAG deep dive and asked for each pipeline step to be explained, and for the same treatment wherever similar chains appear in other pages. A list of steps or a "what can go wrong" table is not enough for them; they want to understand what actually happens.

**How to apply:** For every step give: the goal (why the step exists), what happens inside, a concrete example (a running example helps, such as a returns-policy PDF), what can go wrong, and how to check it. Split flows into phases when natural (offline/indexing vs online/query). Add a "walkthrough" with a concrete scenario after each architecture diagram. Apply this to deep dives, real-world case studies, overview pages and lifecycle lines in any new study material. Keep exam tips in a separate section, not mixed into these explanations. See [[study-docs-language-and-structure]].
