# 01 · Tech Stack (bộ công nghệ)

Các version được **pin (ghim) có chủ đích**. Đừng nâng major nào mà chưa cập nhật
bộ tài liệu này, bởi các API được mô tả ở đây giả định đúng những version này.

| Thư viện | Version | Vai trò |
|---------|---------|------|
| React | 19 | Thư viện UI |
| TypeScript | 5.8+ | Kiểu (bật strict mode) |
| Vite | 8 | Dev server + bundler |
| Ant Design (`antd`) | 6 | Thư viện component / design system |
| `@ant-design/icons` | 6 | Bộ icon (phải khớp major của antd) |
| Tailwind CSS | 4 | CSS utility cho layout/spacing |
| React Router (`react-router-dom`) | 7 | Định tuyến (chế độ data mode) |
| TanStack Query (`@tanstack/react-query`) | 5 | Server state / fetch dữ liệu |
| Zustand | 5 | Client/UI state |
| Axios | 1 | HTTP client |
| i18next / react-i18next | 25 / 15 | Đa ngôn ngữ (i18n) |
| Recharts | 2 | Biểu đồ (tùy chọn) |
| dayjs | 1 | Ngày tháng (peer của AntD) |
| Vitest + Testing Library | 3 / 16 | Testing |

## Vì sao chọn những thứ này
- **Ant Design 6** — component doanh nghiệp dùng được ngay; mặc định dùng CSS
  variables; đi kèm tài liệu design hướng-AI. Hợp nhất cho dashboard/ERP/CRM.
- **Tailwind 4** — layout/spacing nhanh mà không rời khỏi JSX; cấu hình theo hướng
  CSS-first qua `@theme` (không có `tailwind.config.js`). Ta ánh xạ nó lên các token
  của AntD (xem theming).
- **TanStack Query** — chuẩn mực cho server state: cache, dedupe (khử trùng lặp),
  refresh nền, để bạn không phải tự tay quản lý cờ loading/error.
- **Zustand** — store client-state nhỏ gọn, không rườm rà (boilerplate), dành cho
  UI state mà TanStack Query không nên sở hữu.

## Yêu cầu Node
Node **22.12+** (mức nền của Vite 8 / React Router 7). Xem `.nvmrc`.

## Các API đặc thù theo version cần tôn trọng
- **Tailwind 4:** cấu hình theo hướng CSS-first trong `src/styles/index.css` qua
  `@theme`. **Không có `tailwind.config.js`**. Đừng tạo file đó.
- **Ant Design 6:** import từ `antd`; icon từ `@ant-design/icons`. Dùng
  `App.useApp()` cho `message`/`modal`/`notification` (không dùng `message.x` tĩnh).
- **React Router 7:** `createBrowserRouter` + `RouterProvider`, import từ
  `react-router-dom`.
