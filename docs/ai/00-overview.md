# 00 · Tổng quan

## Chúng ta xây dựng cái gì
Một **admin dashboard** (kiểu ERP/CRM/back-office): bảng dữ liệu, form CRUD, bộ lọc,
biểu đồ, phân quyền theo vai trò (role-based access). Ant Design là nền tảng
component vì nó hợp với các UI doanh nghiệp dày đặc, nhiều dữ liệu.

## Kiến trúc trong một bức tranh

```
UI (pages/components)
   │  sử dụng
   ▼
Hooks (feature hooks)  ──►  TanStack Query (server state)  ──►  API layer (axios)  ──►  Backend
   │                                                                  ▲
   └────────────►  Zustand stores (client/UI state)                   │
                                                                      Tokens (theme) cấp cho AntD + Tailwind
```

## Nguyên tắc cốt lõi
1. **Một nguồn chân lý duy nhất cho design** — một file token điều khiển cả AntD + Tailwind.
2. **Tách bạch state** — server state và client state không bao giờ trộn lẫn.
3. **Cấu trúc feature-first** — code được nhóm theo feature, không theo loại (type).
4. **Nhất quán hơn khôn khéo** — mỗi việc chỉ một cách làm, được ghi tài liệu ở đây.
5. **Thân thiện với AI** — quy tắc tường minh + một feature tham chiếu để bắt chước (pattern-match).

## Quy tắc quan trọng nhất
Khi thêm một feature, **hãy mở `src/features/users` và sao chép hình dạng của nó.**
Mọi quy ước trong bộ tài liệu này đều đã được minh họa sẵn ở đó.
