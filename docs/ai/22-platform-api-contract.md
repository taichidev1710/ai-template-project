*Áp dụng cho toàn bộ platform (không riêng FE) — xem cách nó tương tác với quy tắc FE tại 99-ai-rules.md.*

# API Contract (giao kèo API — cấp platform)

> Các quy ước chung (REST, list/error shape, auth...) ở dưới đây áp dụng lâu dài.
> Nhưng các endpoint/entity cụ thể (`/users`, ...) hiện đang khớp với data-model MẪU
> ở `28-platform-data-model.md` — khi kết nối một backend thật, hãy cập nhật cả hai
> file cho khớp API thật.

Thỏa thuận giữa frontend và backend. Cả hai phía đều phải tuân theo.

## Quy ước (conventions)
- REST trên HTTPS; body dạng JSON; `Content-Type: application/json`.
- URL của resource là danh từ số nhiều: `/users`, `/orders/{id}`.
- Động từ (verb): `GET` (đọc), `POST` (tạo), `PUT`/`PATCH` (cập nhật), `DELETE` (xóa).
- Xác thực (auth): `Authorization: Bearer <token>` (JWT). Xem phần security.

## Các shape chuẩn
- **List (danh sách):** `{ items: T[], total, page, pageSize }`.
- **Error (lỗi):** `{ message: string, code?: string, details?: object }` kèm đúng
  HTTP status (400/401/403/404/409/422/500).
- **Timestamp:** chuỗi ISO-8601 theo UTC.
- **ID:** định danh dạng chuỗi (string), ổn định.

## Quy tắc
- Trong cùng một version chỉ được thay đổi theo hướng tương thích ngược
  (backwards-compatible); thay đổi phá vỡ (breaking change) đòi hỏi version mới
  (`/v2`) — xem phần versioning.
- Contract được định nghĩa một lần duy nhất tại đây (hoặc trong một OpenAPI/schema
  dùng chung). Type của frontend và DTO của backend đều dẫn xuất từ nó — không bao
  giờ để phân kỳ (diverge) cục bộ.
