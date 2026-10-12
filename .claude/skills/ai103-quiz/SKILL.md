---
name: ai103-quiz
description: Sinh flashcard và câu hỏi ôn tập bằng tiếng Anh (kèm giải thích và nguồn) cho kỳ thi Microsoft AI-103 từ một ghi chú trong docs/study/. Dùng skill này bất cứ khi nào user muốn tạo quiz, flashcard, câu hỏi trắc nghiệm, đề luyện tập hoặc "test mình" cho một chủ đề AI-103 đã có ghi chú, kể cả khi họ chỉ nói "ra đề phần RAG" hay "làm flashcard cho note này".
---

# ai103-quiz

File đầu ra viết hoàn toàn bằng **tiếng Anh** để người học quen với cách ra đề thật; hướng dẫn skill này viết tiếng Việt.

Biến một ghi chú đã có trong `docs/study/` thành bộ flashcard và câu hỏi ôn tập, lưu cạnh ghi chú đó. Câu hỏi chỉ có giá trị nếu đáp án đúng và có nguồn, nên mọi câu phải truy được về nội dung trong ghi chú (mà ghi chú đã dẫn nguồn Microsoft Learn).

## Quy trình

1. **Chọn ghi chú**: user chỉ định file; nếu không, liệt kê `docs/study/` và chọn file khớp nhất, nói rõ đã chọn file nào. Nếu chưa có ghi chú cho chủ đề đó, đề nghị dùng skill `ai103-note` trước thay vì tự bịa nội dung.
2. **Đọc ghi chú** cùng frontmatter (`skill`, `sources`). Phủ đều các bullet trong "Exam scope", không dồn vào một phần.
3. **Sinh nội dung** vào `docs/study/<tên-ghi-chú>-quiz.md` theo mẫu dưới.
4. **Báo cáo** ngắn: file, số flashcard, số câu hỏi, các câu `[CẦN XÁC MINH]`.

## Mẫu file

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

(5–10 câu hỏi mỗi file.)

## Cách ra câu hỏi

Đề AI-103 thiên về tình huống ("Bạn cần X, nên chọn gì?"), vì vậy ưu tiên:

- Câu hỏi tình huống và so sánh lựa chọn hơn là câu định nghĩa thuần.
- Đáp án sai phải hợp lý (dịch vụ/tính năng thật nhưng không phù hợp), không phải đáp án vô lý, để người học phải phân biệt được.
- Giải thích nêu vì sao từng đáp án sai, vì đó là chỗ học được nhiều nhất.
- Xáo vị trí đáp án đúng, không dồn vào một chữ cái.

## Quy tắc

- Chỉ hỏi điều ghi chú hoặc nguồn của nó hỗ trợ. Không thêm sự kiện mới từ trí nhớ; nếu cần, tra Microsoft Learn và ghi nguồn, hoặc bỏ câu đó.
- Mục không chắc ghi `[CẦN XÁC MINH]` ngay trong câu (giữ nguyên dấu này để grep).
- Viết bằng tiếng Anh, đề kiểu "You need to ... Which ... should you use?" như đề Microsoft; dùng đúng thuật ngữ trên Microsoft Learn.
- Không sửa `docs/official/` hay ghi chú gốc.
