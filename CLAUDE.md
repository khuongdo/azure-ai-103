# CLAUDE.md

Repo học chứng chỉ **Microsoft AI-103: Developing AI Apps and Agents on Azure** (Azure AI Apps and Agents Developer Associate). Không phải repo code; nội dung chính là Markdown.

## Cấu trúc

```
docs/
├── official/   # Tài liệu gốc từ Microsoft, chép lại, KHÔNG sửa nội dung
│   ├── skills-measured.md   # Study guide: các skill được thi + tỷ trọng
│   ├── learning-paths.md    # 4 learning path / 31 module của khóa AI-103T00
│   └── links.md             # Link chính thức
└── study/      # Tài liệu học do AI tạo, dựa trên docs/official
```

## Quy tắc

- `docs/official/`: chỉ chép từ nguồn chính thức (learn.microsoft.com). Mỗi file có frontmatter `source`, `retrieved`. Không thêm diễn giải của AI vào đây. Cập nhật thì đổi `retrieved`.
- `docs/study/`: mỗi file phải bám một mục trong `skills-measured.md`, ghi rõ mục nào, và dẫn link module/doc chính thức làm nguồn. Không bịa tên API, tham số, giới hạn, giá. Không chắc thì ghi `[CẦN XÁC MINH]` và kiểm tra lại trên Microsoft Learn.
- Ưu tiên tính năng GA; đánh dấu rõ nếu là Preview.
- Ngôn ngữ: toàn bộ nội dung trong `docs/study/` (ghi chú, flashcard, câu hỏi, giải thích) viết bằng **tiếng Anh**, vì kỳ thi bằng tiếng Anh và cần quen đúng thuật ngữ/cách diễn đạt của đề. Dùng văn phong đơn giản, rõ ràng. Giao tiếp với user trong chat vẫn bằng tiếng Việt.
- Tên file: kebab-case, mô tả rõ (vd `plan-manage-ai-solution.md`).
- Khi viết báo cáo cho user: ngắn gọn, liệt kê câu hỏi chưa giải quyết ở cuối.

## Website (MkDocs Material, GitHub Pages)

- Repo **public**. Site chỉ gồm `docs/index.md` và `docs/study/`; `docs/official/` bị loại khỏi site bằng `exclude_docs` trong `mkdocs.yml`.
- `docs/official/skills-measured.md` là bản chép nguyên văn của Microsoft nên được `.gitignore` (chỉ giữ local, không đưa lên repo public). Mất file thì lấy lại từ https://aka.ms/AI103-StudyGuide.
- Mindmap dùng Markmap (`docs/study/mindmap.md`, khối `<div class="markmap">`, không để dòng trống ngoài `---` trong template) và Mermaid `mindmap` cho sơ đồ nhỏ trong từng ghi chú.
- Build thử: `pip install -r requirements.txt && mkdocs build --strict`. Push lên `main` thì workflow `.github/workflows/deploy.yml` tự đăng.

## Thể loại tài liệu học nên tạo (trong `docs/study/`)

1. Ghi chú theo domain (5 domain: Plan/manage 25–30%, GenAI & agents 30–35%, Vision 10–15%, Text analysis 10–15%, Information extraction 10–15%).
2. Flashcard (Q/A ngắn) và câu hỏi ôn tập kèm giải thích.
3. So sánh dịch vụ / "chọn cái nào khi nào" (bảng).
4. Code mẫu Python (kỳ thi yêu cầu kinh nghiệm Python), ghi rõ SDK + version.
5. Lộ trình ôn theo tuần.

## Trạng thái nguồn

Study guide hiệu lực từ 2026-04-16 (page cập nhật 2026-04-14). Kiểm tra lại trước khi thi: https://aka.ms/AI103-StudyGuide
