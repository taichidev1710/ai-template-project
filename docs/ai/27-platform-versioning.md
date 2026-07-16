*Áp dụng cho toàn bộ platform (không riêng FE) — xem cách nó tương tác với quy tắc FE tại 99-ai-rules.md.*

# Versioning (đánh version — cấp platform)

- **Semantic Versioning** cho các artifact được phát hành (`MAJOR.MINOR.PATCH`).
- **Version hóa API** qua tiền tố URL (`/v1`, `/v2`) cho các breaking change; giữ
  các version cũ cho đến khi consumer di trú (migrate) xong.
- **Dependency được pin (ghim cứng)**; nâng cấp major là các PR có chủ đích, cập
  nhật luôn tài liệu module liên quan trong cùng thay đổi đó.
- **Tài liệu được version cùng với code:** thay đổi quy tắc platform phải qua review
  PR; bước sync check bảo đảm bản sao ở các module khớp với nguồn đã được review.
- **Migration** (DB/schema) chỉ tiến về phía trước (forward-only) và có thể đảo
  ngược (reversible) khi có thể; xem tài liệu database.
