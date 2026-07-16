# 11 · Form & Table

Hai thứ này thống trị UI quản trị, nên chúng được chuẩn hóa. Xem `UserFormModal` và
`UsersTable` trong `src/features/users`.

## Form (AntD `Form`)
- Dùng `Form` với `layout="vertical"`, `Form.useForm()`, và rule trong `Form.Item`.
- Validation nằm trong `rules`; submit qua `onFinish` (đã gõ kiểu).
- Trong một modal: nút OK của modal gọi `form.submit()`; page sở hữu trạng thái mở.
- Reset/điền sẵn (prefill) khi mở bằng `form.setFieldsValue` trong một effect gắn
  theo khóa `open`.
- Nội dung label và thông báo đến từ key i18n.

```tsx
const [form] = Form.useForm<UserInput>();
<Form form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
  <Form.Item name="email" label={t('user.email')} rules={[{ required: true, type: 'email' }]}>
    <Input />
  </Form.Item>
</Form>
```

## Table (AntD `Table`)
- Phân trang phía server: truyền `pagination={{ current, pageSize, total, onChange }}`.
- Giữ table ở dạng **trình bày (presentational)** — dữ liệu + handler qua props (`UsersTable`).
- Dùng `keepPreviousData` trong query list để chuyển trang mượt mà.
- Dùng `render` của cột cho tag/ngày/hành động; gắn `aria-label` cho các nút hành động.
- Khóa dòng (row key) là id của entity (`rowKey="id"`).

## Tìm kiếm + bộ lọc
- State input cục bộ + `useDebounce` → đưa vào query key; reset trang về 1 khi từ
  khóa tìm kiếm thay đổi (xem `UsersPage`).

## Quy ước module chuẩn: Table ⇄ Grid + filter bar + modal

**Mọi module CRUD cơ bản** (không phải module đặc biệt — xem cuối mục này) phải có
hình dạng sau, y hệt `src/features/users`:

1. **List có 2 chế độ xem: Table (mặc định) và Grid.** Một `Segmented` ở góc phải
   phía trên list để chuyển đổi (`UsersPage`). `<Feature>Table` và `<Feature>Grid`
   là 2 component trình bày nhận **cùng một bộ props** (`data, total, page,
   pageSize, loading, onPageChange, onView, onEdit, onDelete`) — page chỉ chọn
   component nào để render theo state `view`, không nhân đôi logic dữ liệu.
   - Grid dùng CSS grid (Tailwind `grid grid-cols-*`) + `Card` mỗi item +
     `Pagination` riêng — **không dùng AntD `List`**, component này đã bị đánh dấu
     deprecated trong AntD 6 (xem `UsersGrid`).
2. **Filter bar nằm phía trên list, không nằm trong Table/Grid.** Gồm ô tìm kiếm
   (`Input.Search` + `useDebounce`) và một `Select` cho mỗi field lọc rời rạc
   (enum/role/status/...), tất cả trong một `Space wrap`. Đổi filter nào cũng phải
   reset trang về 1. Toggle Table/Grid nằm cùng hàng, canh phải
   (`flex justify-between`).
3. **Xem chi tiết (View) và Sửa (Edit) đều mở Modal — không phải trang/route
   riêng.** `<Feature>DetailModal` là modal **chỉ đọc** (dùng `Descriptions`),
   có action "View" riêng (icon mắt) trên cả Table lẫn Grid, tách biệt với
   "Edit" (icon bút). Modal chi tiết có nút "Sửa" ở footer để chuyển thẳng sang
   `<Feature>FormModal` (đóng modal chi tiết, mở modal sửa) — xem
   `UserDetailModal` + `UsersPage.openEdit`.
4. **Component trình bày (Table/Grid/DetailModal) không tự fetch data.** Tất cả
   nhận qua props/handler; page (`<Feature>Page`) sở hữu toàn bộ state: trang,
   filter, chế độ xem, modal nào đang mở.

### Khi nào được lệch khỏi chuẩn này
Module thường (danh sách CRUD đơn giản) **phải** theo đúng 4 điểm trên. Một module
có nhu cầu hiển thị đặc biệt (ví dụ: nội dung/action đổi theo tier hay quyền của
từng bản ghi) là **module đặc biệt** — xem `src/features/profile` làm ví dụ (card
render config-driven qua `config/tiers.tsx` + `config/conditions.ts`, chi tiết mở
bằng `Drawer` thay vì `Modal` vì nội dung dài). Module đặc biệt được phép lệch,
nhưng phải để lại lý do (comment hoặc ADR ngắn) giải thích vì sao không theo chuẩn.
