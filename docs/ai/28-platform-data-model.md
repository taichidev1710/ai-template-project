*Áp dụng cho toàn bộ platform (không riêng FE) — xem cách nó tương tác với quy tắc FE tại 99-ai-rules.md.*

# Data Model (v1.0.0)

Data-model dùng chung cho toàn platform. Đây là nguồn chân lý duy nhất về shape (hình dạng) của các entity mà cả frontend lẫn backend code theo. Chỉ sửa tại đây.

Mọi repo code theo các shape này (qua API contract), không code theo bất kỳ schema
vật lý nào của database.

## User

Một người dùng ứng dụng có thể đăng nhập.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | id | yes | Định danh duy nhất |
| `name` | string | yes |  |
| `email` | string | yes | Email đăng nhập, duy nhất |
| `role` | enum(admin | editor | viewer) | yes |  |
| `createdAt` | datetime | yes |  |

## Order

Một đơn đặt hàng do người dùng tạo.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | id | yes |  |
| `userId` | ref → User | yes | Chủ sở hữu của đơn hàng |
| `status` | enum(pending | paid | shipped | cancelled) | yes |  |
| `total` | number | yes | Tổng số tiền, tính theo đơn vị nhỏ nhất (minor units) |
| `createdAt` | datetime | yes |  |

## Relationships (quan hệ)

- **Order** many-to-one **User** (qua `userId`)
