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
