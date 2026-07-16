*Áp dụng cho toàn bộ platform (không riêng FE) — xem cách nó tương tác với quy tắc FE tại 99-ai-rules.md.*

# Security (bảo mật — cấp platform)

## Xác thực (Auth)
- Token dạng JWT bearer; access token sống ngắn (short-lived) + luồng refresh.
- Backend xác thực (validate) mọi request; **kiểm tra role phía client chỉ là UX**,
  không bao giờ là ranh giới bảo mật.
- Mô hình phân quyền: RBAC (role/permission) được thực thi (enforce) ở phía server.

## Secret (thông tin bí mật)
- Không để secret trong source code, trong bundle phía client, hay trong file env
  được commit. Hãy dùng secrets manager / tiêm biến môi trường (env injection). Chỉ
  những cấu hình công khai (public config) mới được lộ ra client.

## Dữ liệu (Data)
- Validate và làm sạch (sanitize) mọi input ở phía server. Escape output; tránh
  render HTML thô từ dữ liệu người dùng.
- Không log token lẫn PII (thông tin định danh cá nhân). Làm sạch thông báo lỗi
  (error message) trả về cho client.
- Truyền tải luôn dùng TLS ở mọi nơi.

## Dependency (phụ thuộc)
- Luôn vá (patch) dependency; theo dõi các cảnh báo bảo mật (advisory). Pin
  (ghim cứng) version; review kỹ khi nâng cấp.
