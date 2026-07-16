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
- CI phải pass: lint, typecheck, test, build, **và bước kiểm tra đồng bộ tài liệu
  AI (AI-docs sync check)**.
- Nếu bạn đã sửa `repo platform-standards/**` hoặc `platform/ai/**`, hãy chạy
  `npm run sync:standards` và commit lại các file được tạo lại (regenerated), nếu
  không CI sẽ fail.

## Definition of done (định nghĩa "hoàn thành")
Xem `00-critical-rules.md`.
