---
name: ai103-quiz
description: Generate English flashcards and practice questions (with explanations and sources) for the Microsoft AI-103 exam from a note in docs/study/. Use this skill whenever the user wants a quiz, flashcards, multiple-choice questions, a practice test or to be "tested" on an AI-103 topic that already has a note, even if they only say "write questions for RAG" or "make flashcards for this note".
---

# ai103-quiz

The output file is written entirely in **English**, so the learner gets used to the style of real exam questions. These instructions are in English too; talk to the user in Vietnamese in chat, as required by the repo `CLAUDE.md`.

Turn an existing note in `docs/study/` into a set of flashcards and practice questions, saved in `docs/study/quizzes/`. A question is only valuable if the answer is correct and sourced, so every question must trace back to the content of the note (which already cites Microsoft Learn sources).

## Workflow

1. **Pick the note**: the user names a file; if not, list `docs/study/` and pick the closest match, saying which one you picked. If no note exists for the topic, suggest using the `ai103-note` skill first instead of inventing content.
2. **Read the note** and its frontmatter (`skill`, `sources`). Cover the bullets in "Exam scope" evenly instead of piling onto one part.
3. **Generate the content** into `docs/study/quizzes/<note-name>-quiz.md` (for `deep-dives/<topic>.md` the quiz is `quizzes/<topic>-quiz.md`) using the template below. Link back to the note with a relative path such as `../deep-dives/<topic>.md`, and set `note:` in the frontmatter to the note's full path.
4. **Register it**: add the quiz to the `nav:` in `mkdocs.yml` and to the pairs table in `docs/study/index.md`, then run `mkdocs build --strict`.
5. **Report** briefly: the file, number of flashcards, number of questions, and any `[NEEDS VERIFICATION]` items.

## File template

```markdown
---
note: <path to source note>
skill: <copy from note>
retrieved: <YYYY-MM-DD>
---

# Quiz: <title>

## Flashcards
**Q:** <short question>
**A:** <short answer>

(8–15 cards, one idea each)

## Practice questions

### 1. <scenario / question>
- A. ...
- B. ...
- C. ...
- D. ...

<details><summary>Answer</summary>

**Correct: B.** <why>
**Incorrect:** A — <why wrong>; C — <...>; D — <...>
Source: <link>

</details>
```

(5–10 questions per file.)

For notes in `docs/study/real-world/`, add a final section `## Design questions` with two open questions ("Design X for situation Y") and a collapsed **model answer and checklist** for each, so the learner writes their own design before comparing. Keep flashcards and scenario questions as above.

## How to write questions

AI-103 questions are scenario-heavy ("You need to X. Which ... should you use?"), so prefer:

- Scenario and comparison questions over pure definition questions.
- Plausible wrong answers (real services or features that do not fit), not absurd ones, so the learner has to tell them apart.
- Explanations that say why each wrong answer is wrong, because that is where most of the learning happens.
- Shuffled position of the correct answer; do not cluster it on one letter.

## Rules

- Only ask about what the note or its sources support. Do not add new facts from memory; if needed, check Microsoft Learn and cite the source, or drop the question.
- Mark uncertain items with `[NEEDS VERIFICATION]` right in the question (keep this exact marker so it can be found with grep).
- Write in English in the style of Microsoft exam questions ("You need to ... Which ... should you use?"), using the exact terms from Microsoft Learn.
- Do not edit `docs/official/` or the source note.
