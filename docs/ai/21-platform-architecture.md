*Áp dụng cho toàn bộ platform (không riêng FE) — xem cách nó tương tác với quy tắc FE tại 99-ai-rules.md.*

# Architecture (kiến trúc — cấp platform)

Kiến trúc hệ thống không phụ thuộc ngôn ngữ (language-agnostic). Chi tiết theo
stack nằm trong từng module.

## Các module
- **frontend** — ứng dụng web hướng người dùng (SPA / admin dashboard).
- **backend** — các service ứng dụng / API.
- **monitoring** — khả năng quan sát (observability): metrics, logs, traces, cảnh báo.
- **infrastructure** — hạ tầng dưới dạng code (IaC), triển khai (deployment).
- **database** — schema, migration.

## Ranh giới (boundaries)
- Các module chỉ giao tiếp qua những interface đã được ghi tài liệu (HTTP API, event).
- Không module nào chọc thẳng vào nội bộ (internals) hay database của module khác;
  backend sở hữu database, frontend sở hữu UI.
- Các contract dùng chung (shape của API, schema của event) được định nghĩa ở cấp
  platform để cả hai phía cùng thống nhất.

## Nguyên tắc xuyên suốt (cross-cutting)
- Phân lớp (layering) rõ ràng bên trong mỗi module (xem tài liệu architecture riêng
  của module đó).
- Ưu tiên service phi trạng thái (stateless) khi có thể; đẩy trạng thái ra ngoài
  (DB, cache, queue).
- Lỗi thì "kêu to" ở môi trường dev, suy giảm nhẹ nhàng (degrade gracefully) ở prod.
- Mọi request đều truy vết được (correlation id) xuyên suốt từ đầu đến cuối (xem
  monitoring).
