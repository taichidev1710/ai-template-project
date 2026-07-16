# 07 · Quy tắc về Component

## Tái sử dụng trước tiên
Trước khi tạo một component:
1. Kiểm tra `src/shared/ui`.
2. Kiểm tra thư mục `components/` của feature đích.
3. Kiểm tra xem một component AntD + props đã làm được việc đó chưa.
Chỉ khi đó mới tạo mới. **Không trùng lặp component.**

## Container vs presentational (bao vs trình bày)
- **Page (container):** sở hữu state, gọi hook, ráp nối mọi thứ. Nằm trong
  `features/x/pages` hoặc `src/pages`.
- **Component trình bày (presentational):** nhận mọi thứ qua props, không fetch dữ
  liệu và không truy cập store toàn cục. Nằm trong `features/x/components` hoặc
  `shared/ui`. Dễ test và tái sử dụng.

`src/features/users` minh họa điều này: `UsersPage` (container) →
`UsersTable` + `UserFormModal` (trình bày).

## Props
- Định nghĩa một interface `Props`; destructure ngay trong chữ ký hàm.
- Ưu tiên props tường minh thay vì spread các object không rõ.
- Handler đặt tên `on<Event>` trong props (`onSubmit`, `onDelete`).
- Boolean mặc định `false`; đặt tên `is/has/can`.

## Cấu trúc một file component
```tsx
interface FooProps { /* ... */ }

export function Foo({ a, b }: FooProps) {
  // hooks
  // derived values
  // handlers
  return (/* JSX */);
}
```

## Đặt component dùng chung ở đâu
Dùng xuyên feature và chung chung → `src/shared/ui` với một barrel `index.ts`. Đặt
cho nó cái tên rõ ràng, hướng sản phẩm (điều người dùng thấy, không phải cách nó
được dựng).

## Style bên trong component
- Layout/spacing → utility Tailwind (đã ánh xạ token).
- Giao diện component → props/token của AntD.
- Không style hardcode inline; không dùng giá trị Tailwind tùy tiện.
