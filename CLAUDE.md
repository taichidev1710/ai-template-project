# CLAUDE.md

Đây là điểm vào (entry point) cho các trợ lý AI (Claude Code, Cursor, Copilot, v.v.).
**Đọc `docs/ai/99-ai-rules.md` trước tiên — nó có ưu tiên cao nhất.** Sau đó đọc
`docs/ai/README.md` để có mục lục đầy đủ.

## Dự án này là gì

Một starter **admin dashboard** (React 19 + TypeScript + Vite + Ant Design 6 +
Tailwind CSS 4). Server state qua TanStack Query, client state qua Zustand.

## Quy tắc vàng (tóm tắt — chi tiết đầy đủ trong `docs/ai/`)

1. **Không bao giờ hardcode màu, spacing, radius, hay font.** Dùng design token:
   `token.*` trong AntD, hoặc các utility Tailwind ánh xạ tới token (`bg-surface`,
   `text-ink`, `rounded-app`). Xem `docs/ai/06-theming.md`.
2. **Tái sử dụng trước khi tạo mới.** Kiểm tra `src/shared/ui` và các component
   feature sẵn có trước khi viết cái mới. Xem `docs/ai/07-component-rules.md`.
3. **Server state → TanStack Query. Client state → Zustand.** Không bao giờ fetch
   trong `useEffect`. Xem `docs/ai/08-state-management.md`.
4. **Sao chép pattern tham chiếu.** Feature CRUD mới phải phản chiếu
   `src/features/users` y hệt (api → keys → hooks → components → page → index).
   Xem `docs/ai/examples/feature-crud.md`.
5. **Component không bao giờ gọi API trực tiếp.** Chỉ các file `api/*` của feature
   biết URL endpoint; component dùng hook. Xem `docs/ai/09-api-conventions.md`.
6. **Tôn trọng ranh giới thư mục.** Chỉ import feature qua API công khai `index.ts`
   của nó. Xem `docs/ai/02-architecture.md`.
7. **Đọc `docs/ai/90-anti-patterns.md` trước khi sinh code** — nó liệt kê chính xác
   các lỗi cần tránh.

## Các lệnh

- `npm run dev` — khởi động dev server
- `npm run build` — typecheck + build production
- `npm run lint` / `npm run lint:fix`
- `npm run typecheck`
- `npm run test`

## Version được pin có chủ đích

Đừng nâng cấp một dependency major mà chưa cập nhật `docs/ai/01-tech-stack.md`. Bộ
tài liệu mô tả chính xác các API cho những version đã pin.


## Platform-wide standards (áp dụng toàn platform — cũng phải đọc)
Các quy tắc xuyên suốt (cross-cutting) và **data-model** dùng chung nằm trong
`docs/ai/` cùng với mọi tài liệu khác. Hãy đọc chúng để code frontend khớp với cấu
trúc app dùng chung:
- `docs/ai/20-platform-critical-rules.md` — quy tắc platform luôn-bật
- `docs/ai/22-platform-api-contract.md` — API contract mà FE code theo
- `docs/ai/28-platform-data-model.md` — shape entity dùng chung (code theo chúng, không theo DB)
- `docs/ai/29-platform-glossary.md` — thuật ngữ dùng chung

Quy tắc đặc thù FE nằm ở `docs/ai/` (00–19). Nếu một quy tắc xung đột, thì các
quy tắc platform (20–29, critical rules) thắng cho các mối quan tâm xuyên suốt;
quy tắc FE (00–19) thắng cho phần đặc thù React/AntD.
