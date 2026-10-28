---
domain: All domains (mock exams and practice test reviews)
skill: Full-length practice under exam conditions, mapped to the five skills-measured domains
sources:
  - https://aka.ms/AI103-StudyGuide
  - https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-apps-and-agents-developer-associate/
retrieved: 2026-10-26
---

# Practice tests

This folder has two kinds of material:

| Kind | What it is | Use it for |
|---|---|---|
| **Mock exams 1 to 5** | Five interactive, full-length tests (50 questions each) that you take in the browser, with a timer and a grading step at the end | Practicing under exam conditions and finding weak domains |
| **Practice test reviews 1, 2 and 4** | Notes on three third-party practice tests you already took, grouped by topic, with the answers checked against Microsoft Learn | Learning from questions you missed |

## The five mock exams

| Test | Focus | Open |
|---|---|---|
| Mock exam 1 | Balanced. Core decisions: deployment types, private networking, function calling, hybrid search, Speech, Content Understanding | [Take it](mock-exam-1.md) |
| Mock exam 2 | Architecture and operations: bring-your-own resources, evaluation gates, structured output rules, agent run limits, indexer design | [Take it](mock-exam-2.md) |
| Mock exam 3 | Design decisions and calculations: PTU sizing, Reciprocal Rank Fusion, image size rules, resiliency, customer-managed keys, agent identity | [Take it](mock-exam-3.md) |
| Mock exam 4 | Troubleshooting and security: reasoning settings, subnet rules, quota and TPM, CI/CD, guardrail behavior, Search security | [Take it](mock-exam-4.md) |
| Mock exam 5 | Hardest: close distractors, governance, resiliency, voice channels, Translator behavior, indexer security | [Take it](mock-exam-5.md) |

No question text is repeated across the five tests (the build script checks this), so you can take them in any order. Some tests revisit the same topic from a different angle, on purpose. A suggested use: take tests 1 and 2 after finishing the lessons for domains 1 and 2, tests 3 and 4 in the second-to-last week, and test 5 as a dress rehearsal two or three days before the exam.

## How the tests were built

**These are not real exam questions.** The real AI-103 questions are confidential, and this repo never copies them. The tests are modeled on what is public and on what you have already seen:

1. **Blueprint.** The question mix follows the weights in the [official study guide](https://aka.ms/AI103-StudyGuide). Every test has 50 questions:

   | Exam domain | Official weight | Questions per test | Share |
   |---|---|---|---|
   | Plan and manage an Azure AI solution | 25-30% | 14 | 28% |
   | Implement generative AI and agentic solutions | 30-35% | 16 | 32% |
   | Implement computer vision solutions | 10-15% | 7 | 14% |
   | Implement text analysis solutions | 10-15% | 7 | 14% |
   | Implement information extraction solutions | 10-15% | 6 | 12% |

   Each share is inside the official range. The official exam length in this repo's [summary](../overview/summary.md) is 120 minutes, which is the default timer. The exact number of questions on the real exam is not published on the pages used here, so 50 is a working choice, not a claim about the real test.
2. **Question style.** Each question is a short real-world situation with constraints ("You need to ... Which ... should you use?"), the style described in [Reading exam questions](../exam-tips/reading-exam-questions.md) and seen in the three reviewed practice tests. Wrong options are real services or settings that do not fit, not absurd choices. Between 3 and 6 questions per test ask you to select two answers.
3. **Facts.** Every answer comes from a lesson in [deep-dives](../deep-dives/best-practices-and-real-world-scenarios.md) and links to the Microsoft Learn page behind it. A build check refuses any source link that is not already cited in the study notes, so links are not invented.
4. **Explanations.** Every option, right or wrong, has its own explanation of why it is correct or incorrect. Every question also has a **Concept behind this question** block: a plain-language lesson on the ideas the question tests (what each term means, how the mechanism works, how the ideas relate, and a memory aid), so you can learn the topic and not only the answer.

## How a test works

1. **Start screen.** Choose a mode and a timer (120, 90 or 60 minutes, or no timer).
   - **Exam mode** (default): you answer all questions, can flag and revisit any of them, and nothing is revealed. When you press **Grade my test**, the test is scored.
   - **Practice mode**: after you answer a question, **Check answer** shows the explanations immediately. Use it for learning, not for measuring.
2. **During the test.** The question map on the side shows answered (blue) and flagged (dot) questions. A summary dialog before grading lists unanswered and flagged questions so you can jump back to them. The timer turns amber at 10 minutes and red at 5 minutes. When it reaches zero, the test is graded automatically with the answers you have given.
3. **Grading.** A single-answer question is correct when you pick the right option. A "select N" question is correct only when you select exactly the right set (no partial credit). The result shows your score, your score by domain, and a map of right, wrong and unanswered questions.
4. **Review.** Every question is listed with all options. For each option you see whether it is correct, whether you picked it, and **why**, followed by the concept explanation for the question. Wrong and unanswered questions open automatically. Filter by wrong, unanswered or flagged, and follow the links to the matching lesson and Microsoft Learn page.
5. **Saved state.** Your answers, flags and timer are saved in this browser (local storage), so a refresh or a closed tab does not lose the attempt. Use **Resume saved attempt** on the start screen. If browser storage is blocked, the test still works but cannot resume.

### What can go wrong

| Problem | Cause and fix |
|---|---|
| The timer seems wrong after the laptop slept | The deadline is stored as a clock time, so the remaining time is correct when you return. If it already passed, the test is graded at once |
| Resume button missing | The attempt was graded, or the browser cleared site data. Start a new attempt |
| The score looks low compared with your real exam target | The percentage is only a guide. Microsoft reports a scaled score (700 of 1000 to pass). Use the domain breakdown and the explanations, not the single number |

## How to read your result

1. Look at **score by domain** first. A domain under 60% needs lesson time; 60 to 80% needs targeted review; above 80% is on track.
2. Open the **wrong** filter and read the explanation of the *correct* option, then of the option you picked. The second one shows which idea you mixed up.
3. Follow the **Study** link, read the section, and then take the matching [quiz](../quizzes/model-and-service-selection-quiz.md) for that lesson.
4. Retake the same test after a few days. Positions of the answers are fixed for each test, so a second attempt measures recall of reasons, not luck.

## Adding or changing tests

The tests are generated from plain-text source files in `tools/mock-exams/` by `tools/mock-exams/build_mock_exams.py`. The `ai103-mock-exam` skill in `.claude/skills/` describes the format and the rules. Do not edit the generated `mock-exam-N-view.html` files by hand.
