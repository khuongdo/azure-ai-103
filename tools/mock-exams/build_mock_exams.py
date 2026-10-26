#!/usr/bin/env python3
"""Build the mock exam pages from the authoring files in tools/mock-exams/*.txt.

Usage:
    python3 tools/mock-exams/build_mock_exams.py            # build all mock-N.txt
    python3 tools/mock-exams/build_mock_exams.py mock-2     # build one

Authoring format (see .claude/skills/ai103-mock-exam/SKILL.md):

    @id: mock-1
    @title: AI-103 Mock Exam 1
    @short: Mock exam 1
    @description: One sentence about the theme of this test.

    === D1 single            (D1..D5 = exam domain; single | multi)
    Q: Scenario text. May span several lines and contain ``` code blocks.
    + Correct option :: why it is correct
    - Wrong option :: why it is wrong
    SRC: https://learn.microsoft.com/en-us/azure/...   (comma separated)
    REF: capacity-cost-and-throttling                   (deep-dive file names, comma separated)

Correct options are shuffled with a fixed seed, so author them in any order.
"""

import json
import random
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC_DIR = ROOT / "tools" / "mock-exams"
OUT_DIR = ROOT / "docs" / "study" / "practice-tests"
DEEP_DIVES = ROOT / "docs" / "study" / "deep-dives"

DOMAINS = [
    {"id": 1, "name": "Plan and manage an Azure AI solution", "weight": "25-30%", "count": 14},
    {"id": 2, "name": "Implement generative AI and agentic solutions", "weight": "30-35%", "count": 16},
    {"id": 3, "name": "Implement computer vision solutions", "weight": "10-15%", "count": 7},
    {"id": 4, "name": "Implement text analysis solutions", "weight": "10-15%", "count": 7},
    {"id": 5, "name": "Implement information extraction solutions", "weight": "10-15%", "count": 6},
]
DEFAULT_MINUTES = 120

KNOWN_URL_RE = re.compile(r"https://learn\.microsoft\.com/[^\s)\"'>`,]+")


def known_urls() -> set:
    """Learn URLs already cited in the study notes. Mock exam sources must come from this set (no invented links)."""
    urls = set()
    for md in (ROOT / "docs" / "study").rglob("*.md"):
        urls.update(u.rstrip(".") for u in KNOWN_URL_RE.findall(md.read_text(encoding="utf-8")))
    return urls


LETTER_REF = re.compile(r"\b(option|answer|choice)\s+[A-E]\b", re.I)


class BuildError(Exception):
    pass


def parse(path: Path) -> dict:
    meta, questions = {}, []
    current = None
    in_code = False
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.rstrip()
        if current is None and line.startswith("@"):
            key, _, value = line[1:].partition(":")
            meta[key.strip()] = value.strip()
            continue
        if line.startswith("```"):
            in_code = not in_code
        if not in_code and line.startswith("=== "):
            m = re.match(r"=== D([1-5]) (single|multi)$", line)
            if not m:
                raise BuildError(f"{path.name}: bad header: {line}")
            current = {"d": int(m.group(1)), "kind": m.group(2), "q": [], "o": [], "src": [], "ref": [],
                       "line": len(questions) + 1}
            questions.append(current)
            continue
        if current is None:
            continue
        if not in_code and line.startswith("Q:"):
            current["q"].append(line[2:].strip())
        elif not in_code and (line.startswith("+ ") or line.startswith("- ")):
            text, sep, why = line[2:].partition(" :: ")
            if not sep or not why.strip():
                raise BuildError(f"{path.name} Q{current['line']}: option without ' :: explanation': {line[:70]}")
            current["o"].append({"t": text.strip(), "c": line[0] == "+", "e": why.strip()})
        elif not in_code and line.startswith("SRC:"):
            current["src"] = [s.strip() for s in line[4:].split(",") if s.strip()]
        elif not in_code and line.startswith("REF:"):
            current["ref"] = [s.strip() for s in line[4:].split(",") if s.strip()]
        elif not current["o"]:
            current["q"].append(line)  # continuation of the question text
        elif line.strip():
            raise BuildError(f"{path.name} Q{current['line']}: unexpected line after options: {line[:70]}")
    return {"meta": meta, "questions": questions}


def validate(name: str, data: dict) -> list:
    problems = []
    allowed = known_urls()
    counts = {d["id"]: 0 for d in DOMAINS}
    for qn, q in enumerate(data["questions"], 1):
        counts[q["d"]] += 1
        tag = f"{name} Q{qn} (D{q['d']})"
        q["text"] = "\n".join(q["q"]).strip()
        if not q["text"]:
            problems.append(f"{tag}: empty question")
        right = sum(1 for o in q["o"] if o["c"])
        total = len(q["o"])
        if right == 0:
            problems.append(f"{tag}: no correct option")
        if q["kind"] == "single" and right != 1:
            problems.append(f"{tag}: single question needs exactly one '+' (has {right})")
        if q["kind"] == "multi" and not 2 <= right <= 3:
            problems.append(f"{tag}: multi question needs 2-3 '+' (has {right})")
        if not 4 <= total <= 6:
            problems.append(f"{tag}: needs 4-6 options (has {total})")
        if right >= total - 1:
            problems.append(f"{tag}: too many correct options")
        if not q["src"] or not all(s.startswith("https://learn.microsoft.com/") for s in q["src"]):
            problems.append(f"{tag}: SRC must list learn.microsoft.com URLs")
        for url in q["src"]:
            if url not in allowed:
                problems.append(f"{tag}: SRC not cited anywhere in docs/study (verify it on Learn, add it to a note first): {url}")
        for slug in q["ref"]:
            if not (DEEP_DIVES / f"{slug}.md").exists():
                problems.append(f"{tag}: REF '{slug}' is not a file in docs/study/deep-dives")
        if not q["ref"]:
            problems.append(f"{tag}: missing REF")
        for o in q["o"]:
            if LETTER_REF.search(o["e"]) or LETTER_REF.search(o["t"]):
                problems.append(f"{tag}: explanation refers to an option letter (options are shuffled)")
            if "[NEEDS VERIFICATION]" in o["e"] or "[NEEDS VERIFICATION]" in q["text"]:
                problems.append(f"{tag}: contains [NEEDS VERIFICATION]; verify or drop the question")
    for d in DOMAINS:
        if counts[d["id"]] != d["count"]:
            problems.append(f"{name}: domain {d['id']} has {counts[d['id']]} questions, blueprint says {d['count']}")
    return problems


def balanced_positions(count: int, rng: random.Random) -> list:
    """Correct-option positions for single-answer questions: cycle A..D evenly, then shuffle."""
    cycle = [i % 4 for i in range(count)]
    rng.shuffle(cycle)
    return cycle


def build_json(data: dict, test_id: str) -> dict:
    questions = []
    singles = [q for q in data["questions"] if sum(1 for o in q["o"] if o["c"]) == 1]
    slots = iter(balanced_positions(len(singles), random.Random(f"{test_id}-positions")))
    for qn, q in enumerate(data["questions"], 1):
        rng = random.Random(f"{test_id}-{qn}")
        options = [dict(o) for o in q["o"]]
        rng.shuffle(options)
        if sum(1 for o in options if o["c"]) == 1:
            want = next(slots)
            at = next(i for i, o in enumerate(options) if o["c"])
            options[at], options[want] = options[want], options[at]
        questions.append({"d": q["d"], "q": q["text"], "o": options, "src": q["src"], "ref": q["ref"]})
    meta = data["meta"]
    return {
        "id": test_id,
        "title": meta["title"],
        "shortTitle": meta.get("short", meta["title"]),
        "description": meta.get("description", ""),
        "defaultMinutes": DEFAULT_MINUTES,
        "domains": DOMAINS,
        "questions": questions,
    }


HTML = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<link rel="stylesheet" href="mock-exam-engine/engine.css">
</head>
<body>
<div id="app"></div>
<script>window.MOCK_EXAM = {payload};</script>
<script src="mock-exam-engine/engine.js"></script>
</body>
</html>
"""

PAGE = """---
domain: All domains (mock exam)
skill: Full-length practice test modeled on the AI-103 skills measured; scenario questions across the five exam domains
sources:
  - https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-apps-and-agents-developer-associate/
  - https://aka.ms/AI103-StudyGuide
retrieved: {today}
---

# {title}

{description}

Use **Open full screen** on a tablet or phone; the test also works in the frame below. Your progress is saved in this browser, so a refresh does not lose answers.

<iframe src="../{view}" title="{title}" style="width:100%;height:85vh;border:1px solid var(--md-default-fg-color--lightest);border-radius:6px"></iframe>

[Open full screen]({view}){{ target=_blank }}

## Blueprint

{blueprint}

How the test works, and how it was built, is explained on the [mock exams overview](index.md).
"""


def main(argv):
    from datetime import date

    wanted = set(argv)
    sources = sorted(SRC_DIR.glob("mock-*.txt"))
    if not sources:
        raise BuildError("no tools/mock-exams/mock-*.txt files found")
    all_problems, seen, parsed = [], {}, {}
    for path in sources:
        data = parse(path)
        name = path.stem
        all_problems += validate(name, data)
        for qn, q in enumerate(data["questions"], 1):
            key = re.sub(r"\W+", " ", q["text"].lower()).strip()
            if key in seen:
                all_problems.append(f"{name} Q{qn}: duplicate of {seen[key]}")
            seen[key] = f"{name} Q{qn}"
        parsed[name] = data
    if all_problems:
        print("\n".join(all_problems))
        raise BuildError(f"{len(all_problems)} problem(s) found")

    for name, data in parsed.items():
        if wanted and name not in wanted:
            continue
        payload = build_json(data, name)
        text = json.dumps(payload, ensure_ascii=False).replace("</", "<\\/")
        view = f"{name.replace('mock-', 'mock-exam-')}-view.html"
        (OUT_DIR / view).write_text(HTML.format(title=payload["title"], payload=text), encoding="utf-8")
        page = OUT_DIR / f"{name.replace('mock-', 'mock-exam-')}.md"
        if not page.exists():
            rows = "\n".join(f"| {d['name']} | {d['weight']} | {d['count']} |" for d in DOMAINS)
            blueprint = "| Exam domain | Official weight | Questions |\n|---|---|---|\n" + rows + f"\n| **Total** | | **{len(payload['questions'])}** |"
            page.write_text(PAGE.format(today=date.today().isoformat(), title=payload["title"],
                                        description=payload["description"], blueprint=blueprint, view=view),
                            encoding="utf-8")
        pos = [0, 0, 0, 0, 0, 0]
        for q in payload["questions"]:
            for k, o in enumerate(q["o"]):
                if o["c"]:
                    pos[k] += 1
        print(f"{name}: {len(payload['questions'])} questions -> {view}; correct-option positions A..F = {pos}")


if __name__ == "__main__":
    try:
        main(sys.argv[1:])
    except BuildError as err:
        print(f"ERROR: {err}")
        sys.exit(1)
