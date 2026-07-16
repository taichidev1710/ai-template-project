*Áp dụng cho toàn bộ platform (không riêng FE) — xem cách nó tương tác với quy tắc FE tại 99-ai-rules.md.*

# Git Workflow (quy trình Git — cấp platform)

## Branch
- `main` luôn ở trạng thái deploy được. Làm việc trên `feat/<name>` `fix/<name>`
  `chore/<name>`.

## Commit — Conventional Commits
`<type>(<scope>): <summary>` — `feat｜fix｜docs｜refactor｜test｜chore｜perf｜style`.
Scope có thể là tên module: `feat(frontend): ...`, `fix(backend): ...`.

## Pull request
- Nhỏ, tập trung, dễ review; mô tả *cái gì* và *tại sao*.
- CI phải pass: lint, typecheck, test, build.
- Nếu bạn đã sửa một quy ước cross-cutting (`docs/ai/20-29-platform-*.md`), cập
  nhật mọi chỗ phụ thuộc trong cùng PR — đừng để tài liệu và code lệch nhau.

## Definition of done (định nghĩa "hoàn thành")
Xem `20-platform-critical-rules.md`.
