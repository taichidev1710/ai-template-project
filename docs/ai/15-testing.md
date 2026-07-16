# 15 · Testing

Vitest + Testing Library. Cấu hình nằm trong `vite.config.ts` (khối `test`); thiết
lập toàn cục trong `src/test/setup.ts`.

## Test cái gì (theo ưu tiên)
1. **Utility / hàm thuần (pure function)** — rẻ, giá trị cao (xem `utils.test.ts`).
2. **Hook** — logic query/mutation với một wrapper `QueryClientProvider`.
3. **Component** — hành vi từ góc nhìn người dùng (render, tương tác, khẳng định),
   không phải chi tiết cài đặt.
4. **Luồng quan trọng** — đăng nhập, một happy path tạo/sửa/xóa CRUD.

## Nguyên tắc
- Tìm phần tử theo role/label/text (`getByRole`, `getByLabelText`), không theo test
  id khi có thể. Cách này cũng đồng thời ép buộc tính accessibility.
- Dùng `@testing-library/user-event` cho các tương tác.
- Mock tầng API (`usersApi`) hoặc HTTP client, không mock chính React Query.
- Giữ test có tính tất định (deterministic); không gọi network thật.

```ts
import { render, screen } from '@testing-library/react';
// wrap with providers (QueryClientProvider + ThemeProvider) via a test helper.
```

## Các lệnh
- `npm run test` — chạy một lần (CI).
- `npm run test:watch` — chế độ watch.

## Bước tiếp theo (tùy chọn)
Thêm Playwright cho các luồng end-to-end khi app ổn định. Không bao gồm sẵn để giữ
template gọn nhẹ.
