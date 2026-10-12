---
name: ai103-note
description: Write English study notes for the Microsoft AI-103 exam (Developing AI Apps and Agents on Azure) in docs/study/, based on one section of docs/official/skills-measured.md. Use this skill whenever the user wants to write, expand or update notes or study material for an AI-103 domain, skill or topic (Foundry, agents, RAG, AI Search, Content Understanding, Speech, Document Intelligence, responsible AI...), even if they only say "write about RAG for AI-103" or "make a note for the monitoring section".
---

# ai103-note

Write the notes in **English**: the exam is in English, so the learner needs the exact terms and phrasing used in questions. These instructions are in English too; talk to the user in Vietnamese in chat, as required by the repo `CLAUDE.md`.

Create one study note file under `docs/study/` for exactly one section of the study guide. Goal: after reading, the learner knows the concepts, knows when to choose what, and knows how to do it in Python. The content must be verifiable, because this is exam material and wrong information does more harm than missing information.

## Workflow

1. **Identify the section**: read `docs/official/skills-measured.md`, find the exact heading (`####` level) and its bullets. If the user is vague, pick the closest section and say which one you picked. If the file is missing (it is gitignored), fetch it again from https://aka.ms/AI103-StudyGuide.
2. **Find related modules**: read `docs/official/learning-paths.md` and pick the Learn modules that match this section.
3. **Get real sources**: use WebFetch/WebSearch on `learn.microsoft.com` for the modules and related docs. Do not write volatile details from memory (SDK names, class names, parameters, limits, SKUs, prices, GA/Preview status), because Foundry and the agent SDKs change fast.
4. **Write the file** using the template below.
5. **Register it**: add the file to the `nav:` in `mkdocs.yml` and to the tables in `docs/study/index.md`, use relative links to other study folders, and run `mkdocs build --strict` to catch broken links.
6. **Report** briefly: the file created, which section, any `[NEEDS VERIFICATION]` spots, and open questions.

## File template

File name: descriptive English kebab-case, for example `build-rag-application.md`. Save it in the folder that matches its purpose: topic notes go in `docs/study/deep-dives/`, summaries and service maps in `docs/study/overview/`, and end-to-end case studies of real business problems in `docs/study/real-world/` (problem, why it is an AI-103 problem, architecture, build steps, quality plan, operations, failure modes, variations; keep exam tips out of these pages).

```markdown
---
domain: <domain name and weight>
skill: <heading from skills-measured.md>
sources:
  - <Microsoft Learn URLs used>
retrieved: <YYYY-MM-DD today>
---

# <Title>

## Exam scope
<Copy the bullets of this section from skills-measured.md as a checklist.>

## Key concepts
<Short explanations; every exam-scope bullet has at least one matching paragraph or point.>

## When to choose what
<Comparison tables: services, models, search types, deployment options... a common exam question style.>

## Python sample
<Short runnable code, with package and version, comments explaining why.>

## Common traps
<Points the exam likes to twist.>

## Sources
<Links, each noting what it supports.>
```

## Content rules

- Write in English with simple wording, and use the exact terms as on Microsoft Learn (Foundry, RAG, managed identity, hybrid search...). The marker for uncertainty is always `[NEEDS VERIFICATION]` so it can be found with grep.
- Say only what the sources support. If unsure or no source is found, write `[NEEDS VERIFICATION]` right at that spot instead of guessing.
- Prefer GA features. Mark Preview features with `(Preview)`, because the exam mostly asks about GA.
- Code samples: verify package/class/function names from the docs. If unsure, put `[NEEDS VERIFICATION]` next to that line. Use keyless auth (`DefaultAzureCredential`) instead of hardcoded keys, which matches the security section of the exam.
- **Explain every step of any pipeline, flow, lifecycle or diagram** you include: goal, what happens inside, a concrete example, what can go wrong, how to check. Never leave a bare arrow chain such as `A → B → C` without explaining each stage. After an architecture diagram add a walkthrough with a concrete scenario.
- Do not copy long passages from Microsoft Learn; rephrase in your own English and link to the source.
- Do not edit anything in `docs/official/`.
- One file = one section. Split sections that are too large.
