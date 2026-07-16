# Ví dụ · Feature CRUD (pattern chuẩn mực)

Đây là hình dạng mà **mọi module cơ bản** mới phải tuân theo: list Table ⇄ Grid,
filter bar phía trên, View/Edit đều mở Modal (chi tiết quy ước xem
`11-forms-tables.md`). Bản chạy thật là `src/features/users`. Để thêm `orders`,
chạy `npm run generate:feature orders` (xem `scripts/generate-feature.mjs`) hoặc
chép `users/` → `orders/` rồi đổi tên thủ công.

Nếu module cần hiển thị/hành vi biến đổi theo dữ liệu (tier, quyền, trạng thái...),
đó là **module đặc biệt** — xem `src/features/profile` thay vì bản mẫu này.

## Cấu trúc
```
features/<feature>/
├── api/
│   ├── <feature>-api.ts       # các hàm endpoint (nơi DUY NHẤT chứa URL)
│   └── <feature>-keys.ts      # query key factory
├── hooks/
│   └── use-<feature>.ts       # useList / useOne / useMutations
├── components/
│   ├── <Feature>Table.tsx     # list dạng bảng (trình bày, chỉ nhận props)
│   ├── <Feature>Grid.tsx      # list dạng lưới/card — CÙNG props với Table
│   ├── <Feature>DetailModal.tsx  # xem chi tiết, chỉ đọc (Descriptions)
│   └── <Feature>FormModal.tsx    # tạo/sửa (Form)
├── pages/
│   └── <Feature>Page.tsx      # container: sở hữu state (page/filter/view/modal)
├── types.ts                   # type Entity + Input + ListParams + ViewMode
└── index.ts                   # API công khai (export page + type)
```

## Luồng dữ liệu
```
<Feature>Page (state: page, filter, view: table|grid, modal nào đang mở)
   ├─ useList(params) ─────► useQuery ─► api.list ─► apiClient.get
   ├─ useMutations() ──────► useMutation ─► api.create/update/remove
   │                          └─ onSuccess: invalidate list key + toast
   ├─ filter bar (Input.Search + Select mỗi field lọc) + Segmented (Table/Grid)
   ├─ <Feature>Table  HOẶC <Feature>Grid (cùng props: data/onView/onEdit/onDelete)
   ├─ <Feature>DetailModal (chỉ đọc; nút "Sửa" ở footer → chuyển sang FormModal)
   └─ <Feature>FormModal (tạo/sửa; trạng thái mở do page sở hữu)
```

## Checklist cho một feature mới
- [ ] `types.ts`: `Entity` + `EntityInput` (`Omit` các trường do server quản lý) +
      `EntityListParams extends ListParams` (thêm field lọc) + `EntityViewMode`.
- [ ] `api/*-api.ts`: `list/get/create/update/remove` dùng `apiClient`.
- [ ] `api/*-keys.ts`: key factory (`all/lists/list/details/detail`).
- [ ] `hooks/use-*.ts`: `useList` (với `keepPreviousData`), `useOne`,
      `useMutations` (invalidate + toast + `onError`).
- [ ] `components/*Table.tsx` + `*Grid.tsx`: dạng trình bày, cùng props
      (`onView/onEdit/onDelete`), phân trang server, `aria-label` trên nút icon.
      Grid dùng CSS grid + `Card` + `Pagination` — không dùng AntD `List`
      (deprecated ở v6).
- [ ] `components/*DetailModal.tsx`: chỉ đọc (`Descriptions`), có nút "Sửa" ở
      footer chuyển sang `*FormModal.tsx`.
- [ ] `components/*FormModal.tsx`: `Form` của AntD, label i18n, `form.submit()`.
- [ ] `pages/*Page.tsx`: sở hữu state page/filter/view/modal; filter bar +
      Segmented Table/Grid nằm trên list; ráp nối mọi thứ.
- [ ] `index.ts`: export page + các type công khai.
- [ ] Đăng ký route trong `app/router/routes.tsx` + `paths.ts`.
- [ ] Thêm nav item trong `AppLayout` nếu nó thuộc sidebar.
- [ ] Thêm key i18n vào mọi file locale (kể cả `view.table`/`view.grid` nếu chưa
      có, và `<feature>.detailTitle`/`filterX`).
