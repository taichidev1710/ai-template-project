# 04 · Quy ước đặt tên (Naming Conventions)

| Đối tượng | Quy ước | Ví dụ |
|-------|-----------|---------|
| File component | `PascalCase.tsx` | `UsersTable.tsx` |
| Component | `PascalCase` | `function UsersTable()` |
| File hook | `kebab-case.ts`, tiền tố `use-` | `use-users.ts` |
| Hook | `camelCase`, tiền tố `use` | `useUsers()` |
| File không phải component | `kebab-case.ts` | `users-api.ts`, `query-client.ts` |
| Biến / hàm | `camelCase` | `pageSize`, `formatDate` |
| Type / interface | `PascalCase` (không tiền tố `I`) | `User`, `UserInput` |
| Hằng số | `UPPER_SNAKE` hoặc object `as const` | `paths`, `DEFAULT_PAGE_SIZE` |
| Hook của Zustand store | `use<Name>Store` | `useAuthStore` |
| Factory tạo query key | `<feature>Keys` | `usersKeys` |
| Boolean | tiền tố `is/has/can/should` | `isLoading`, `hasAccess` |
| Handler sự kiện | `handle<Event>` (phần cài đặt), `on<Event>` (prop) | `handleSubmit`, `onSubmit` |

## Thư mục
- Thư mục feature: `kebab-case`, danh từ số ít hoặc theo domain (`users`, `orders`).
- Các thư mục con trong một feature là cố định: `api`, `hooks`, `components`, `pages`.

## Nhất quán câu chữ (UI text)
Các hành động giữ cùng một động từ xuyên suốt một luồng: nút "Publish" tạo ra toast
"Published". Dùng key i18n, không bao giờ viết chuỗi thẳng trong code (inline)
(xem `18-i18n.md`).
