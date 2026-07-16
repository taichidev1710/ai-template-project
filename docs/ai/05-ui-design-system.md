# 05 · UI Design System (hệ thống thiết kế giao diện)

Mục tiêu: mọi màn hình trông như do một người làm ra. Sự nhất quán đến từ một tập
cố định các khối cơ bản (primitive) — spacing, kiểu chữ, component — chứ không phải
từ những lựa chọn tùy hứng.

## Thang spacing (px)
Chỉ dùng: **4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64**.

Spacing mặc định của Tailwind vốn đã khớp thang này (gốc 0.25rem):
`p-1`=4, `p-2`=8, `p-3`=12, `p-4`=16, `p-5`=20, `p-6`=24, `p-8`=32, `p-10`=40,
`p-12`=48, `p-16`=64. Không bao giờ dùng giá trị tùy tiện như `p-[13px]`.

## Layout
- Nội dung trang nằm trong `<PageContainer title=...>` (`src/shared/ui`).
- Lưới (grid) dùng `Row`/`Col` của AntD với `gutter={[16, 16]}` (hoặc `[24, 24]`).
- Padding của container/card: `p-6` (24px). Khoảng cách section: `gap-4`/`gap-6`.

## Typography (kiểu chữ)
- Một họ font duy nhất (token `--app-font-family`). Đừng thêm font mới.
- Tiêu đề dùng `Typography.Title` của AntD (`level` 1–5). Nội dung dùng `Typography.Text`.
- Thang cỡ chữ thuộc quyền các token của AntD; đừng đặt `font-size` tùy tiện.

## Component (một bộ duy nhất)
- Dùng component AntD cho: Button, Input, Select, Form, Table, Card, Modal, Drawer,
  Tabs, Tag, Dropdown, Menu, DatePicker, v.v.
- **Chỉ một bộ icon:** `@ant-design/icons`. Không bao giờ trộn thêm thư viện icon khác.
- Đừng tự dựng button/input/modal riêng — hãy dùng của AntD và cấu hình qua props.

## Các khối dựng nhất quán
| Khối | Dùng |
|-------|-----|
| Form | `Form` của AntD (xem `11-forms-tables.md`) |
| Table | `Table` của AntD với phân trang phía server |
| Card | `Card` của AntD / `bg-surface rounded-app p-6` |
| Modal | `Modal` của AntD; trạng thái mở do page sở hữu |
| Drawer | `Drawer` của AntD cho panel bên/bộ lọc |
| Feedback | `App.useApp()` → `message` / `modal` / `notification` |

## Responsive
Dùng breakpoint của AntD và các tiền tố tương ứng của Tailwind:
`xs<576 · sm≥576 · md≥768 · lg≥992 · xl≥1200 · xxl≥1600`.
Thiết kế mobile-first; kiểm tra layout co lại còn một cột.
