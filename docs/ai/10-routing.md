# 10 · Routing (định tuyến)

React Router 7 ở **data mode**: `createBrowserRouter` + `RouterProvider`.

## Các file
- `src/app/router/paths.ts` — mọi chuỗi path dưới dạng hằng số. **Không bao giờ
  hardcode một path** trong component; hãy import `paths`.
- `src/app/router/routes.tsx` — cây route.
- `src/app/router/ProtectedRoute.tsx` — auth guard qua `<Outlet/>`.

## Cấu trúc
```
/login                    → LoginPage (công khai)
<ProtectedRoute>          → chuyển hướng về /login nếu chưa đăng nhập
  <AppLayout>             → sider + header + <Outlet/>
    /            → chuyển hướng → /dashboard
    /dashboard   → DashboardPage
    /users       → UsersPage
*                         → NotFoundPage
```

## Thêm một route
1. Tạo page (page của feature trong `features/x/pages`, hoặc `src/pages`).
2. Thêm một hằng số vào `paths.ts`.
3. Đăng ký nó trong `routes.tsx` dưới đúng layout/guard.
4. Thêm một mục điều hướng (nav item) trong `AppLayout` nếu nó thuộc sidebar.

## Điều hướng
- `useNavigate()` cho kiểu mệnh lệnh (imperative); `<Link to={paths.x}>` cho kiểu
  khai báo (declarative).
- Đọc param với `useParams()`, query string với `useSearchParams()`.

## Lazy loading (cho app lớn hơn)
Bọc các phần tử route bằng `React.lazy` + `<Suspense>` để chia code (code-split)
theo route. Giữ bản tham chiếu đơn giản; thêm lazy loading khi bundle phình to.
