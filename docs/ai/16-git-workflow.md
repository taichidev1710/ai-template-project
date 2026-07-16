# 16 · Git Workflow

## Branch
- `main` — luôn deploy được.
- `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`.

## Commit — Conventional Commits
`<type>(<scope>): <summary>` với type ∈ `feat｜fix｜docs｜refactor｜test｜chore｜perf｜style`.
Ví dụ:
```
feat(users): add role filter to users table
fix(auth): clear token on 401 response
docs(ai): document theming token flow
```
Giữ commit tập trung; viết phần summary ở thể mệnh lệnh (imperative).

## Pull request
- Nhỏ và dễ review. Mô tả *cái gì* và *tại sao*.
- CI phải pass: `lint`, `typecheck`, `test`, `build`.
- Cập nhật `docs/ai/` khi bạn thay đổi một quy ước hoặc bump một dependency major.

## Definition of Done (định nghĩa "hoàn thành")
- [ ] Tuân theo các quy tắc trong `docs/ai/` (token, tách state, cấu trúc feature).
- [ ] `npm run lint && npm run typecheck && npm run test` đều pass.
- [ ] Xử lý các trạng thái loading / error / empty.
- [ ] Bao phủ phần cơ bản của a11y (label, bàn phím).
- [ ] Không hardcode màu/spacing/chuỗi; đã dùng key i18n.
