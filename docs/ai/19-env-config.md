# 19 · Environment & Config (môi trường & cấu hình)

## Quy tắc
- Chỉ các biến có tiền tố `VITE_` mới được phơi ra client. Đừng bao giờ đặt secret
  vào chúng — chúng đi vào bundle.
- Đừng bao giờ đọc `import.meta.env` trực tiếp trong code ứng dụng. Hãy import từ
  `src/shared/config/env.ts`, nơi gõ kiểu và tập trung hóa việc truy cập.

## Các biến
| Biến | Ý nghĩa | Ví dụ |
|-----|---------|---------|
| `VITE_API_BASE_URL` | Base URL của API / đường proxy | `/api` |
| `VITE_APP_NAME` | Tên hiển thị của app | `Admin Dashboard` |
| `VITE_ENABLE_DEVTOOLS` | Bật/tắt React Query devtools | `true` |

## Các file
- `.env.example` — template được commit (chép sang `.env` ở máy local).
- `.env`, `.env.*` — bị git-ignore (trừ `.env.example`).
- Theo từng môi trường: `.env.development`, `.env.production` nếu cần.

## Proxy khi dev
`vite.config.ts` proxy `/api` → backend (`http://localhost:8080` theo mặc định).
Chỉnh `target` theo từng dự án.
