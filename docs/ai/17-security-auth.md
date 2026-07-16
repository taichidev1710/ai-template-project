# 17 · Security & Auth (bảo mật & xác thực)

## Luồng auth
- Đăng nhập trả về một token + user; lưu qua `useAuthStore.setAuth({ token, user })`.
- Request interceptor của `apiClient` gắn `Authorization: Bearer <token>`.
- Khi gặp `401`, response interceptor gọi `clearAuth()`; `ProtectedRoute` chuyển
  hướng về `/login`.
- `LoginPage` trong template là bản giả (stub) — hãy thay `onFinish` bằng một
  mutation `POST /auth/login` thật.

## Lưu trữ token
- Template persist token qua `persist` của Zustand (localStorage) cho đơn giản. Để
  bảo mật cao hơn, ưu tiên cookie httpOnly do backend đặt và bỏ việc persist token ở
  phía client. Hãy ghi tài liệu lựa chọn của bạn theo từng dự án.

## Authorization (phân quyền theo vai trò)
- `AuthUser.roles` mang các vai trò. Chặn (gate) UI theo role ở nơi cần thiết;
  **luôn luôn thực thi ở backend nữa** — kiểm tra phía client là UX, không phải bảo mật.

## Quy tắc chung
- Không bao giờ đặt secret ở phía client. Chỉ config công khai `VITE_*` được phơi ra.
- Không log token hay PII. Làm sạch thông báo lỗi hiển thị cho người dùng.
- Validate/escape mọi nội dung do người dùng tạo được render dưới dạng HTML (tránh
  `dangerouslySetInnerHTML`; nếu bất khả kháng, hãy sanitize).
- Luôn vá dependency (lưu ý: dùng các bản phát hành React 19.x đã được vá).
