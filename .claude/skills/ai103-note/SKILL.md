---
name: ai103-note
description: Tạo ghi chú học bằng tiếng Anh cho kỳ thi Microsoft AI-103 (Developing AI Apps and Agents on Azure) trong docs/study/, bám một mục trong docs/official/skills-measured.md. Dùng skill này bất cứ khi nào user muốn viết, mở rộng hoặc cập nhật ghi chú/tài liệu học cho một domain, skill hoặc chủ đề AI-103 (Foundry, agents, RAG, AI Search, Content Understanding, Speech, Document Intelligence, responsible AI...), kể cả khi họ chỉ nói "viết bài về RAG cho AI-103" hay "làm note phần monitor".
---

# ai103-note

Viết ghi chú bằng **tiếng Anh** (kỳ thi bằng tiếng Anh nên người học cần quen đúng thuật ngữ và cách diễn đạt của đề). Hướng dẫn của skill này viết tiếng Việt, nhưng file đầu ra hoàn toàn tiếng Anh.

Tạo một file ghi chú học trong `docs/study/` cho đúng một mục của study guide. Mục tiêu: người học đọc xong biết khái niệm, biết khi nào chọn cái gì, và biết cách làm bằng Python. Nội dung phải kiểm chứng được, vì đây là tài liệu ôn thi và thông tin sai gây hại hơn thiếu.

## Quy trình

1. **Xác định mục**: đọc `docs/official/skills-measured.md`, tìm đúng heading (cấp `####`) và các bullet của nó. Nếu user nói mơ hồ, chọn mục khớp nhất và nói rõ đã chọn mục nào.
2. **Tìm module liên quan**: đọc `docs/official/learning-paths.md`, chọn các module Learn khớp mục này.
3. **Lấy nguồn thật**: dùng WebFetch/WebSearch trên `learn.microsoft.com` cho module và tài liệu liên quan. Không viết từ trí nhớ cho các chi tiết dễ đổi (tên SDK, tên class, tham số, giới hạn, SKU, giá, trạng thái GA/Preview), vì Foundry và agent SDK thay đổi nhanh.
4. **Viết file** theo mẫu dưới đây.
5. **Báo cáo** ngắn: file đã tạo, mục nào, các chỗ `[CẦN XÁC MINH]`, câu hỏi còn lại.

## Mẫu file

Tên file: kebab-case tiếng Anh mô tả rõ, ví dụ `build-rag-application.md`.

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

## Quy tắc nội dung

- Viết bằng tiếng Anh, văn phong đơn giản, dùng đúng thuật ngữ như trên Microsoft Learn (Foundry, RAG, managed identity, hybrid search...). Dấu đánh dấu không chắc vẫn là `[CẦN XÁC MINH]` để grep thống nhất.
- Chỉ nói điều nguồn hỗ trợ. Nếu không chắc hoặc không tìm được nguồn, ghi `[CẦN XÁC MINH]` ngay tại chỗ đó thay vì đoán.
- Ưu tiên tính năng GA. Tính năng Preview thì ghi rõ `(Preview)`, vì exam chủ yếu hỏi GA.
- Code mẫu: xác minh tên package/class/hàm từ docs. Không chắc thì ghi `[CẦN XÁC MINH]` cạnh dòng đó. Dùng keyless auth (`DefaultAzureCredential`) thay cho key cứng, khớp mục bảo mật của exam.
- Không chép nguyên văn dài từ Microsoft Learn; diễn đạt lại bằng tiếng Anh của mình và dẫn link.
- Không sửa gì trong `docs/official/`.
- Một file = một mục. Mục quá lớn thì tách file.
