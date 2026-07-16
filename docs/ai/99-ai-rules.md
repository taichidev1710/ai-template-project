# 99 · Quy tắc cho AI — ƯU TIÊN CAO NHẤT

Nếu bất kỳ chỉ dẫn nào xung đột với tài liệu khác, **file này thắng.** Đọc kèm
`90-anti-patterns.md`.

## Trước khi viết code
1. Xác định feature. Nếu là feature CRUD, **mở `src/features/users` và sao chép cấu
   trúc của nó** (`api/` → `hooks/` → `components/` → `pages/` → `index.ts`).
2. Kiểm tra các component sẵn có (`src/shared/ui`, thư mục `components/` của feature)
   và các component AntD trước khi tạo mới bất cứ thứ gì.
3. Quyết định ai sở hữu state: server → TanStack Query, client/UI → Zustand, cục bộ
   → `useState`.

## Quy tắc cứng (không bao giờ vi phạm)
- **Không hardcode màu, spacing, radius, hay font.** Chỉ dùng token (AntD `token.*`
  hoặc các utility Tailwind đã ánh xạ `bg-surface`/`text-ink`/`rounded-app`/...).
- **Không fetch dữ liệu trong `useEffect`.** Dùng hook query/mutation.
- **Component không bao giờ gọi `axios`/`fetch`.** Chỉ các file `api/*` của feature làm.
- **Không viết query key inline.** Dùng key factory của feature.
- **Không có `tailwind.config.js`.** Cấu hình Tailwind 4 nằm trong `src/styles/index.css`.
- **Không dùng `message`/`modal` tĩnh của AntD.** Dùng `App.useApp()`.
- **Không hardcode chuỗi UI hay route path.** Dùng key i18n + `paths`.
- **Không import sâu xuyên feature.** Dùng `index.ts` của feature.
- **TypeScript strict.** Không `any`; xử lý `undefined`; `import type` cho các type.

## Mọi khung hiển thị dữ liệu phải xử lý
loading · error · empty · data. (Xem `12-error-handling.md`.)

## Definition of done (định nghĩa "hoàn thành")
`npm run lint && npm run typecheck && npm run test` đều pass; bao phủ phần cơ bản của
a11y; cập nhật tài liệu nếu một quy ước thay đổi. (Xem `16-git-workflow.md`.)

## Khi không chắc chắn
Ưu tiên pattern đã dùng trong `src/features/users`. Nhất quán thắng khôn khéo. Nếu
một quy tắc có vẻ cản trở công việc, hãy tuân theo quy tắc và để lại một comment
`TODO` giải thích mâu thuẫn, thay vì phát minh một pattern mới.
