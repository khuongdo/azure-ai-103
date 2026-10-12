# CLAUDE.md

Study repo for the **Microsoft AI-103: Developing AI Apps and Agents on Azure** exam (Azure AI Apps and Agents Developer Associate). This is not a code repo; the content is mostly Markdown.

## Project memory

Persistent working preferences for this repo are stored in `.claude/memory/` (index: `.claude/memory/MEMORY.md`). Read it at the start of a session and follow it. Keep it in sync when a preference changes, and do not store secrets or personal data there (the repo is public).

## Structure

```
docs/
├── official/   # Copies of Microsoft material; do NOT edit the content
│   ├── skills-measured.md   # Study guide: skills tested + weights (local only, gitignored)
│   ├── learning-paths.md    # 4 learning paths / 31 modules of course AI-103T00
│   └── links.md             # Official links
└── study/      # AI-generated study material based on docs/official (grouped by purpose)
    ├── index.md          # Study hub: explains the folders and pairs deep dives with quizzes
    ├── overview/         # One-page summary, Azure services map
    ├── deep-dives/       # Topic notes: mechanisms, worked examples, decision guides, traps
    ├── real-world/       # End-to-end case studies of real problems (no exam tips; those go elsewhere)
    ├── quizzes/          # <topic>-quiz.md: flashcards and scenario questions for a deep dive
    ├── practice-tests/   # Reviews of full practice tests
    └── mind-maps/        # Markmap pages (mindmap.md embeds the *-view.html files)
```

## Rules

- `docs/official/`: copy only from official sources (learn.microsoft.com). Every file has `source` and `retrieved` frontmatter. Do not add AI commentary here. When updating, change `retrieved`.
- `docs/study/`: every file must map to one section of `skills-measured.md`, say which one, and cite official module/doc links as sources. Never invent API names, parameters, limits or prices. If unsure, write `[NEEDS VERIFICATION]` and check Microsoft Learn again.
- Prefer GA features; clearly mark Preview ones.
- **Explain every step.** When a page shows a pipeline, flow, lifecycle or architecture diagram, explain each step: its goal, what happens inside, a concrete example, what can go wrong and how to check it. A list of steps or a failure table alone is not enough. After an architecture diagram add a walkthrough with a concrete scenario. Split flows into phases when natural (for example offline indexing vs online query).
- Language:
  - **Conversation between the user and Claude: Vietnamese** (chat, reports, clarifying questions).
  - **Code: English** (variable/function/file names, code comments, commit messages, config such as `mkdocs.yml` and workflows).
  - All content in `docs/study/` (notes, flashcards, questions, explanations) is written in **English**, because the exam is in English and the learner needs the exact terms and phrasing used in questions. Use simple, clear wording.
- File names: kebab-case and descriptive (for example `plan-manage-ai-solution.md`).
- Placement: put each new study file in the folder that matches its purpose (see Structure). A quiz for `deep-dives/<topic>.md` is `quizzes/<topic>-quiz.md`.
- **Navigation is explicit.** `mkdocs.yml` has a hand-written `nav:`. When you add, move or rename a study file, update `nav:` and the tables in `docs/study/index.md`, then run `mkdocs build --strict`. Use relative links between folders (for example `../deep-dives/<topic>.md`).
- When reporting to the user: be concise and list unresolved questions at the end.

## Website (MkDocs Material, GitHub Pages)

- The repo is **public**. The site contains only `docs/index.md` and `docs/study/`; `docs/official/` is excluded from the site through `exclude_docs` in `mkdocs.yml`.
- `docs/official/skills-measured.md` is a verbatim copy of Microsoft's text, so it is in `.gitignore` (kept local, not pushed to the public repo). If it is lost, fetch it again from https://aka.ms/AI103-StudyGuide.
- Mind maps use Markmap on standalone pages (`docs/study/mindmap-view.html`, `docs/study/mindmap-services-view.html`) without the theme CSS, because Material's CSS breaks the Markmap layout. They are embedded in `mindmap.md` with iframes. Edit the mind map content inside the `<script type="text/template">` block of each HTML file. Use Mermaid `mindmap` for small diagrams inside individual notes.
- Build locally: `pip install -r requirements.txt && mkdocs build --strict`. A push to `main` triggers `.github/workflows/deploy.yml`, which publishes the site.

## Kinds of study material to create (in `docs/study/`)

1. Notes per domain (5 domains: Plan/manage 25–30%, GenAI & agents 30–35%, Vision 10–15%, Text analysis 10–15%, Information extraction 10–15%).
2. Flashcards (short Q/A) and practice questions with explanations.
3. Service comparisons / "when to choose what" (tables).
4. Python code samples (the exam expects Python experience), with SDK and version.
5. A weekly revision plan.

## Source status

The study guide is effective from 2026-04-16 (page updated 2026-04-14). Recheck before the exam: https://aka.ms/AI103-StudyGuide
