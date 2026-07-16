*Áp dụng cho toàn bộ platform (không riêng FE) — xem cách nó tương tác với quy tắc FE tại 99-ai-rules.md.*

# Naming (đặt tên — cấp platform)

Quy tắc đặt tên không phụ thuộc ngôn ngữ. Cách viết hoa/thường (casing) riêng theo
stack nằm trong tài liệu của từng module.

- **Repo/module/service:** `kebab-case`, dùng danh từ theo domain (`order-service`).
- **URL/resource:** số nhiều, viết thường (`/order-items`).
- **Biến môi trường (env var):** `UPPER_SNAKE_CASE`, có tiền tố theo phạm vi
  (`DB_URL`, `VITE_API_BASE_URL`).
- **Event/topic:** `domain.action.version` (`order.created.v1`).
- **Branch:** `feat/…`, `fix/…`, `chore/…` (xem git workflow).
- **Boolean:** `is/has/can/should`.
- Tên phải mô tả điều mà người dùng/domain nhìn thấy, không phải chi tiết cài đặt
  (implementation).
- Nhất quán: cùng một khái niệm thì giữ cùng một tên xuyên suốt mọi module.
