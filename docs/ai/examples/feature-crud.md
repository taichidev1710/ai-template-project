# Ví dụ · Feature CRUD (pattern chuẩn mực)

Đây là hình dạng mà **mọi** feature CRUD mới phải tuân theo. Bản chạy thật là
`src/features/users`. Để thêm `orders`, chép `users/` → `orders/` rồi đổi tên.

## Cấu trúc
```
features/<feature>/
├── api/
│   ├── <feature>-api.ts     # các hàm endpoint (nơi DUY NHẤT chứa URL)
│   └── <feature>-keys.ts    # query key factory
├── hooks/
│   └── use-<feature>.ts     # useList / useOne / useMutations
├── components/
│   ├── <Feature>Table.tsx   # table trình bày (chỉ nhận props)
│   └── <Feature>FormModal.tsx
├── pages/
│   └── <Feature>Page.tsx    # container: sở hữu state, ráp nối hook + component
├── types.ts                 # type Entity + Input
└── index.ts                 # API công khai (export page + type)
```

## Luồng dữ liệu
```
<Feature>Page (state: page, search, modal)
   ├─ useList(params) ─────► useQuery ─► api.list ─► apiClient.get
   ├─ useMutations() ──────► useMutation ─► api.create/update/remove
   │                          └─ onSuccess: invalidate list key + toast
   ├─ <Feature>Table  (dữ liệu + handler qua props)
   └─ <Feature>FormModal (tạo/sửa; trạng thái mở do page sở hữu)
```

## Checklist cho một feature mới
- [ ] `types.ts`: `Entity` + `EntityInput` (`Omit` các trường do server quản lý).
- [ ] `api/*-api.ts`: `list/get/create/update/remove` dùng `apiClient`.
- [ ] `api/*-keys.ts`: key factory (`all/lists/list/details/detail`).
- [ ] `hooks/use-*.ts`: `useList` (với `keepPreviousData`), `useOne`,
      `useMutations` (invalidate + toast + `onError`).
- [ ] `components/*Table.tsx`: dạng trình bày, phân trang server, `aria-label` trên
      các nút icon.
- [ ] `components/*FormModal.tsx`: `Form` của AntD, label i18n, `form.submit()`.
- [ ] `pages/*Page.tsx`: sở hữu state page/search/modal; ráp nối mọi thứ.
- [ ] `index.ts`: export page + các type công khai.
- [ ] Đăng ký route trong `app/router/routes.tsx` + `paths.ts`.
- [ ] Thêm nav item trong `AppLayout` nếu nó thuộc sidebar.
- [ ] Thêm key i18n vào mọi file locale.
