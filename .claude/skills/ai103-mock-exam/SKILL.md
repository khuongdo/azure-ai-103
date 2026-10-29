---
name: ai103-mock-exam
description: Create or extend full-length interactive mock exams (50 scenario questions, timer, grade-at-the-end mode, explanation for every option and a concept explanation for every question) for the Microsoft AI-103 exam in docs/study/practice-tests/. Use this skill whenever the user wants a new practice test, a mock exam, more exam-style questions in the timed format, or to fix, replace or review questions of an existing mock exam, even if they only say "make another practice test" or "add 10 more questions to mock 3".
---

# ai103-mock-exam

A mock exam is a standalone page that the learner takes in the browser. It is built from a plain-text source file by a script, so the content (questions) and the behavior (timer, grading, review) stay separate.

The questions, options and explanations are written in **English**, because the exam is in English. These instructions are in English too; talk to the user in Vietnamese in chat, as required by the repo `CLAUDE.md`. Also follow `.claude/memory/MEMORY.md` (ask before committing or pushing).

## What exists

| Path | Role |
|---|---|
| `tools/mock-exams/mock-N.txt` | **Source of truth**: questions, options, option explanations, concept explanations, links |
| `tools/mock-exams/build_mock_exams.py` | Parses and validates the sources, shuffles options, writes the pages |
| `docs/study/practice-tests/mock-exam-engine/engine.js`, `engine.css` | Shared test engine (start screen, exam mode, practice mode, timer, grading, review) |
| `docs/study/practice-tests/mock-exam-N-view.html` | **Generated** standalone test page. Never edit by hand |
| `docs/study/practice-tests/mock-exam-N.md` | Page that embeds the test in an iframe (generated once, then editable) |
| `docs/study/practice-tests/index.md` | Overview of all mock exams, how they were built, how they work |

## Honesty about "based on the real exam"

The real AI-103 questions are confidential and must never be copied or reconstructed from memory. A mock exam is **modeled on**:

1. The skills measured and their weights (`docs/official/skills-measured.md` if present locally, otherwise the summary in `docs/study/overview/summary.md`).
2. The format of the real exam as documented in the repo (scenario questions, "You need to ... Which ... should you use?").
3. Patterns from the practice test reviews in `docs/study/practice-tests/*-review.md` and the habits in `docs/study/exam-tips/`.

Say this clearly to the user when reporting. Do not claim the questions are real exam questions.

## Researching recent sample questions (when the user asks for it)

When the user asks for tests "based on recent sample exams", do this before writing:

1. **Official first.** Microsoft's official Practice Assessment lives on AI Skills Navigator and **needs a sign-in**, so it cannot be fetched. The exam sandbox only shows the UI. Say this to the user instead of pretending to have official questions.
2. **Third-party samples** (search "AI-103 practice questions", open the free-sample pages of reputable banks): read them only to learn the **style**: stem length, number of options, topics, distractor type. Never copy their question text or answer keys, and never use "dumps" sites (they are exam-policy violations and often wrong).
3. **Write original questions** with the same style and topics, grounded in the deep dives. Record in the test `@description` that the tests are modeled on the public skills outline, not on real exam content.
4. **Coverage matrix.** Fetch the current skills list (https://aka.ms/AI103-StudyGuide redirects to learn.microsoft.com/credentials/certifications/resources/study-guides/ai-103; `docs/official/skills-measured.md` is gitignored and may be missing). Map every "skills measured" bullet to at least one question across the new tests; aim for more than 90% of bullets covered, and list the uncovered ones in the report. Check the existing tests first (`grep -E '^(=== |Q: )' tools/mock-exams/mock-*.txt`) so new questions use new angles instead of repeating a scenario.
5. If five tests are not enough to cover the matrix, add more tests (the build script accepts any `mock-N.txt`).

## Blueprint (do not change without asking)

Every test has **50 questions** with this mix, which sits inside the official weight ranges:

| Domain id | Exam domain | Official weight | Questions |
|---|---|---|---|
| D1 | Plan and manage an Azure AI solution | 25-30% | 14 |
| D2 | Implement generative AI and agentic solutions | 30-35% | 16 |
| D3 | Implement computer vision solutions | 10-15% | 7 |
| D4 | Implement text analysis solutions (text, speech, translation) | 10-15% | 7 |
| D5 | Implement information extraction solutions | 10-15% | 6 |

Default timer 120 minutes. If the study guide weights change, update `DOMAINS` in the build script, `docs/study/practice-tests/index.md` and this table together.

## Workflow

1. **Choose the scope.** For a new test, take the next number (the highest existing `mock-N.txt` plus one). List which lessons in `docs/study/deep-dives/` each question will cover, and compare with the existing tests so topics are spread and the same scenario is not reused. Read the lessons before writing: every fact in a question must be supported by a deep dive or the Learn page it cites.
2. **Write `tools/mock-exams/mock-N.txt`** in the format below. Write questions domain by domain so the counts are easy to hit.
3. **Build and validate**: `python3 tools/mock-exams/build_mock_exams.py` (all tests) or `... mock-N`. The script fails with a list of problems; fix them all. It also prints the positions of the correct options, which should be roughly even across A to D.
4. **Test the page** in a browser (Playwright is installed): open `docs/study/practice-tests/mock-exam-N-view.html`, start, answer, grade, open the review. Check there are no console errors, and that the "Concept behind this question" block appears after **Check answer** in practice mode and in the review.
5. **Register the test** (only for a new one): add `mock-exam-N.md` to `nav:` in `mkdocs.yml` under "Exam preparation > Mock exams", add a row to the table in `docs/study/practice-tests/index.md`, then run `mkdocs build --strict`.
6. **Report** briefly: the files, counts per domain, number of multiple-answer questions, topics covered, any `[NEEDS VERIFICATION]` decisions, and unresolved questions at the end. Ask before committing or pushing.

## Source file format

````text
@id: mock-6
@title: AI-103 Mock Exam 6
@short: Mock exam 6
@description: One or two sentences on the focus of this test.

=== D1 single
Q: Scenario text. It may continue on the next lines and contain code blocks:
```python
client.responses.create(model="...", input="...")
```
+ The correct option :: Why it is correct, in one or two sentences.
- A wrong option :: Why it is wrong, in one or two sentences.
- Another wrong option :: Why it is wrong.
- A third wrong option :: Why it is wrong.
CONCEPT: First paragraph of the question-level explanation (the concepts behind the question).

Second paragraph. Blank lines separate paragraphs; the block ends at the SRC: line.
SRC: https://learn.microsoft.com/en-us/azure/...
REF: capacity-cost-and-throttling

=== D2 multi
Q: ... Which TWO actions should you take?
+ First correct option :: ...
+ Second correct option :: ...
- Wrong option :: ...
- Wrong option :: ...
- Wrong option :: ...
CONCEPT: ...
SRC: ...
REF: ...
````

Rules the script enforces:

- Header is `=== D<1-5> single|multi`. `single` has exactly one `+`. `multi` has two or three `+` and at least two `-`.
- 4 to 6 options. Every option needs ` :: explanation`.
- `CONCEPT:` is required for every question, goes after the options and before `SRC:`, and needs at least 90 words (see "Concept explanation" below). It may span many lines and paragraphs; code blocks are not needed.
- `SRC:` lists `learn.microsoft.com` URLs (comma separated) **that are already cited somewhere in `docs/study/`**. If you need a new link, verify the page on Microsoft Learn, cite it in the matching study note first, then use it.
- `REF:` lists deep-dive file names (without `.md`) that exist in `docs/study/deep-dives/`. The review screen links to them.
- Domain counts must match the blueprint. No duplicate question text across all tests.
- No `[NEEDS VERIFICATION]` inside a question or explanation. If a fact is unverified, drop the question or verify it first.
- Explanations must not say "option A" or "answer B": options are shuffled, and correct options are placed so that positions are balanced.

Correct options can be written in any position; the script shuffles them with a fixed seed.

## Concept explanation (one per question)

Option explanations say why each choice is right or wrong. The `CONCEPT:` block teaches the topic itself, for a learner who may not know the terms. Write it **after** the options are final, in plain English, 90 to 250 words, in short paragraphs. Use this shape:

1. **Define the key terms** the question depends on, in everyday words, before using them. Example: what KNN is and what HNSW is, not only that "KNN is the ground truth".
2. **Explain how the mechanism works** step by step with a small concrete example or numbers (a calculation question should show the arithmetic).
3. **Relate the ideas**: how the terms in the question fit together, and what the question is really asking. Mention why the nearest wrong idea does not fit, in general terms, without referring to option letters.
4. **End with a memory aid** (an analogy or a one-line rule) when it helps.

Rules: no option letters (options are shuffled); no `[NEEDS VERIFICATION]`; every fact must be supported by a deep dive or the cited Learn page; do not just repeat the correct option's explanation. The page shows the block as "Concept behind this question" after the option explanations, in practice mode after **Check answer** and in the final review.

Reference example (question about measuring HNSW recall): define KNN (compare the query with every vector, exact but slow), define HNSW (layered graph of neighbors, like highways and local streets, fast but approximate), explain how they relate (KNN is the reference answer, recall = share of KNN neighbors that HNSW also returns), then the memory aid (checking every house in town versus using a map to get near it).

## How to write good questions

- **Scenario first.** Two to four sentences with concrete constraints (traffic shape, network rule, data residency, latency, cost, compliance). The constraints must decide the answer.
- **Plausible distractors.** Each wrong option is a real service, setting or practice that fits a different situation. Avoid joke options and "all of the above".
- **Explain every option.** The correct option says why it fits; each wrong option says what it is actually for or why it fails here. This is where most learning happens.
- **Add the concept explanation** (`CONCEPT:`) so the learner understands the topic, not only the answer.
- **Mix the types.** Roughly: decision questions (which service or setting), diagnosis questions (symptom to cause), calculation questions (PTU sizing, RRF, defect rate, RU/s), code questions (what is wrong in a snippet), and "select TWO" questions (3 to 6 per test).
- **Use exact Microsoft terms** as in the lessons: Foundry resource and project, Responses API, prompt agent and hosted agent, guardrails and controls, Content Understanding analyzers, and so on.
- **Prefer GA features.** When a question depends on a Preview feature, say "(preview)" in the question or the explanation.
- **Vary difficulty.** About 40% direct recall of a documented rule, 40% scenario application, 20% close-distractor or multi-step reasoning.
- **Do not copy** from Microsoft Learn sentence by sentence, and never from real exam dumps or memory of real questions.

## Editing an existing test

Change the `.txt` file, rebuild, and re-test. If a question is replaced, keep the domain counts unchanged. Learners' saved attempts live in their browser and are keyed by test id, so changing a question while keeping the id can mismatch a half-finished attempt; tell the user if that matters.

## Engine changes

Behavior (timer, scoring, review) lives in `mock-exam-engine/engine.js` and `engine.css` and is shared by all tests. After any change, rebuild is not needed, but re-test at least one generated page in a browser, in both exam and practice mode, with the timer running out, and at phone width. Keep browser storage access inside try/catch (it can be blocked).
