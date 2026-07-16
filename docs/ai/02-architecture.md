# 02 · Kiến trúc & Cấu trúc thư mục

Bố cục feature-first. Nhóm theo feature, không theo loại file.

```
src/
├── app/                 # Lắp ghép ứng dụng (không chứa business logic)
│   ├── providers/       # QueryProvider, AppProviders (gốc lắp ghép context)
│   ├── router/          # routes.tsx, ProtectedRoute, paths.ts
│   └── layout/          # AppLayout (khung AntD: sider/header/content)
├── shared/              # Dùng lại được cho TẤT CẢ feature
│   ├── api/             # axios client + interceptor + type API dùng chung
│   ├── config/          # env.ts, i18n.ts
│   ├── theme/           # tokens.ts, antd-theme.ts, ThemeProvider, theme-store
│   ├── stores/          # các Zustand store toàn cục (auth, ui)
│   ├── ui/              # component trình bày dùng chung (PageContainer, ...)
│   ├── hooks/           # hook dùng chung (useDebounce, ...)
│   ├── lib/             # tiện ích không phụ thuộc framework, query-client
│   └── types/           # type TS dùng chung
├── features/            # Mỗi thư mục là một feature nghiệp vụ
│   ├── users/           # ← FEATURE THAM CHIẾU cho module CHUẨN (sao chép hình dạng này)
│   │   ├── api/         # users-api.ts (endpoint), users-keys.ts (query key)
│   │   ├── hooks/       # use-users.ts (query + mutation)
│   │   ├── components/  # trình bày: UsersTable, UsersGrid, UserDetailModal, UserFormModal
│   │   ├── pages/       # page bao (container): UsersPage (sở hữu state: page/filter/view/modal)
│   │   ├── types.ts     # type của feature
│   │   └── index.ts     # API CÔNG KHAI — mặt import duy nhất
│   └── profile/         # ← FEATURE THAM CHIẾU cho module ĐẶC BIỆT (config-driven theo tier/status)
├── domain/              # Nghiệp vụ THUẦN (no React/AntD) dùng chung nhiều feature
│   └── diagram/         # model + engine luật/suy ra của module Sơ đồ (xem DESIGN.md)
├── pages/               # Page cấp route không gắn với một feature nào
├── locales/             # json i18n (vi, en)
├── styles/              # index.css (Tailwind @theme)
└── test/                # thiết lập test
```

`src/domain/*` chứa logic nghiệp vụ độc lập framework (type + hàm thuần, có unit
test), được `features/*` import qua `@/domain/...`. Tách khỏi `features` để engine
kiểm thử được mà không cần render UI, và `shared` không import ngược từ đây.

## Ranh giới import (được thực thi theo quy ước)
- Import một feature **chỉ** qua `index.ts` của nó. Không bao giờ chọc thẳng vào
  `features/x/components/...` từ bên ngoài `features/x`.
- `shared/*` được import ở bất cứ đâu. `shared` KHÔNG được import từ `features`.
- `features/*` có thể import `shared/*` nhưng không import nội bộ của feature khác.
- Dùng alias `@/` cho mọi import xuyên thư mục (`@/shared/ui`).

## Code mới đặt ở đâu?
- Dùng bởi 2+ feature hoặc thực sự chung (generic) → `shared/`.
- Thuộc về một feature → `features/<feature>/`.
- Một route mới → thêm một page, rồi đăng ký nó trong `app/router/routes.tsx`.
