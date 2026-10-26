---
name: mock-exam-requirements
description: "What the user requires from AI-103 mock exams: modeled on the real exam, same structure, real-world scenarios, grade-at-the-end mode with timer, explanations for right and wrong options"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 01JnnyAvy8BNKhR8wAZKJjKJ
  modified: 2026-10-26T00:00:00.000Z
---

When the user asks for practice tests or mock exams, each test must: (1) be modeled on the real AI-103 exam, (2) have a similar structure (question count, domain mix), (3) use real-world scenarios, (4) have a mode where they answer everything and then press grade, with a timer, and (5) explain both the correct and the wrong options.

**Why:** The user (Vietnamese speaker studying for AI-103) asked for five such tests and a skill to create more. They want to practice under exam conditions, not read answers inline.

**How to apply:** Use the `ai103-mock-exam` skill. Tests are built from `tools/mock-exams/mock-N.txt` by `tools/mock-exams/build_mock_exams.py` into `docs/study/practice-tests/`. Blueprint is 50 questions (14 / 16 / 7 / 7 / 6 across the five domains), default timer 120 minutes. Real exam questions are confidential: say the tests are modeled on the skills measured, not copied. Keep sources to Learn links already cited in the notes. See [[study-docs-language-and-structure]].
