# 17 · Security & Auth (bảo mật & xác thực)

## Luồng auth
Đã nối với backend `be-template` thật (`/api/v1`). Feature `src/features/auth`:
- `POST /auth/login` trả `{ user, tokens: { accessToken, refreshToken } }`; hook
  `useLogin` gọi tiếp `GET /users/me` để lấy vai trò + quyền, rồi lưu qua
  `useAuthStore.setAuth({ token, refreshToken, user })`.
- Request interceptor của `apiClient` gắn `Authorization: Bearer <accessToken>`.
- **Silent refresh:** khi một request (không phải endpoint `/auth/*`) gặp `401`,
  response interceptor tự gọi `POST /auth/refresh` bằng refresh token, cập nhật cặp
  token rồi phát lại request cũ. Refresh thất bại → `clearAuth()` và `ProtectedRoute`
  chuyển về `/login`. Nhờ vậy phiên sống theo refresh token (7 ngày) chứ không chết
  sau mỗi 15 phút.
- `useLogout` gọi `POST /auth/logout` để thu hồi refresh token phía server rồi mới xoá
  state cục bộ.
- Backend bọc mọi response trong `{ success, data }` và lỗi trong
  `{ success:false, error:{ code, message } }`; `apiClient` bóc envelope lỗi, tầng
  `api/*` của feature bóc `data.data`.

## Lưu trữ token
- Template persist accessToken + refreshToken qua `persist` của Zustand (localStorage)
  cho đơn giản. Để bảo mật cao hơn, ưu tiên cookie httpOnly do backend đặt và bỏ việc
  persist token ở phía client. Hãy ghi tài liệu lựa chọn của bạn theo từng dự án.

## Authorization (phân quyền theo vai trò)
- `AuthUser.roles` mang các vai trò. Chặn (gate) UI theo role ở nơi cần thiết;
  **luôn luôn thực thi ở backend nữa** — kiểm tra phía client là UX, không phải bảo mật.

## Quy tắc chung
- Không bao giờ đặt secret ở phía client. Chỉ config công khai `VITE_*` được phơi ra.
- Không log token hay PII. Làm sạch thông báo lỗi hiển thị cho người dùng.
- Validate/escape mọi nội dung do người dùng tạo được render dưới dạng HTML (tránh
  `dangerouslySetInnerHTML`; nếu bất khả kháng, hãy sanitize).
- Luôn vá dependency (lưu ý: dùng các bản phát hành React 19.x đã được vá).
