# Admin Dashboard Template

Một **starter admin dashboard bằng React** hướng production, được thiết kế để tái sử
dụng qua nhiều dự án và để làm cho **code do AI sinh ra luôn nhất quán**. Thư mục
`docs/ai/` là một bộ quy tắc đầy đủ mà Claude Code, Cursor, Copilot, và ChatGPT đều đọc.

## Stack

React 19 · TypeScript (strict) · Vite 8 · Ant Design 6 · Tailwind CSS 4 ·
React Router 7 · TanStack Query 5 · Zustand 5 · Axios · i18next · Vitest.

## Bắt đầu nhanh

```bash
# Node 22.12+ required (see .nvmrc)
cp .env.example .env
npm install
npm run dev
```

> Đăng nhập là bản giả (stub) — bất kỳ email/mật khẩu nào cũng đăng nhập được (xem
> `src/pages/LoginPage.tsx`). Hãy thay bằng endpoint auth thật của bạn. Trang Users
> gọi `/api/users`; trỏ `VITE_API_BASE_URL` / proxy của Vite vào backend của bạn,
> hoặc gắn một mock.

## Scripts

| Lệnh | Làm gì |
|---------|------|
| `npm run dev` | Dev server (Vite) |
| `npm run build` | Typecheck + build production |
| `npm run preview` | Xem thử bản build |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run typecheck` | `tsc` không xuất file (no-emit) |
| `npm run test` / `test:watch` | Vitest |
| `npm run format` | Prettier |

## Ý tưởng chính

- **Một file token điều khiển mọi thứ.** `src/shared/theme/tokens.ts` cấp cho cả
  Ant Design và Tailwind, nên không có màu hardcode và dark mode là miễn phí. Xem
  `docs/ai/06-theming.md`.
- **State được tách bạch.** Server state → TanStack Query; client/UI state → Zustand.
- **Feature-first.** `src/features/users` là feature CRUD tham chiếu — hãy sao chép nó.
- **Bộ quy tắc cho AI.** Bắt đầu tại `docs/ai/README.md`; ưu tiên cao nhất là
  `docs/ai/99-ai-rules.md` và `docs/ai/90-anti-patterns.md`.

## Cấu trúc

```
src/
├── app/        # providers, router, layout (lắp ghép, không business logic)
├── shared/     # api, config, theme, stores, ui, hooks, lib, types
├── features/   # mỗi thư mục một feature (users = tham chiếu)
├── pages/      # page cấp route ở tầng trên
├── locales/    # i18n (vi, en)
└── styles/     # Tailwind @theme (index.css)
```

## Dùng cho một dự án mới

1. Clone/copy, cập nhật `name` trong `package.json` và `VITE_APP_NAME`.
2. Sửa màu thương hiệu trong `src/shared/theme/tokens.ts`.
3. Thêm feature bằng cách sao chép `src/features/users` (xem
   `docs/ai/examples/feature-crud.md`).
4. Trỏ công cụ AI của bạn vào repo — các file entry (`CLAUDE.md`, `AGENTS.md`,
   `.cursor/rules`, `.github/copilot-instructions.md`) tự động nạp quy tắc.

## Tùy chọn thêm (yêu cầu nếu muốn có)

CI workflow · Playwright e2e · error boundary · một mock API server (MSW) ·
thêm feature ví dụ · pre-commit hook Husky + lint-staged.
