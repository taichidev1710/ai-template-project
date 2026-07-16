# 08 · Quản lý State

Chọn đúng công cụ bằng cách hỏi **ai sở hữu dữ liệu**.

| Câu hỏi | Công cụ |
|----------|------|
| Do server sở hữu (fetch từ một API)? | **TanStack Query** |
| Client UI state dùng chung giữa nhiều component (sidebar, theme, auth)? | **Zustand** |
| UI state cục bộ, nhất thời (giá trị input, modal đang mở)? | **`useState`** |

Đa số state là server state hoặc `useState` cục bộ. Hãy giữ client state toàn cục
thật nhỏ.

## Server state — TanStack Query
- Đọc → `useQuery`; ghi → `useMutation`. **Không bao giờ fetch trong `useEffect`.**
- Query key đến từ một **key factory** theo từng feature (`usersKeys`) để việc
  invalidate (làm mất hiệu lực cache) chính xác. Không bao giờ viết mảng key inline.
- Đặt hook cùng chỗ trong `features/x/hooks`. Chúng gọi tầng `api/*` của feature.
- Sau một mutation, `invalidateQueries` các key list/detail liên quan.
- Mặc định toàn cục (staleTime, retry) nằm trong `src/shared/lib/query-client.ts`.

```tsx
export function useUsers(params: ListParams) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData, // smooth pagination
  });
}
```

## Client state — Zustand
- Mỗi mối quan tâm (concern) một store (`auth`, `ui`). Chỉ persist (lưu lại) những
  gì cần sống sót qua các lần reload.
- Chọn (select) hẹp: `useAuthStore(s => s.user)`, không lấy cả store, để tránh
  re-render thừa.
- Đọc một store bên ngoài React bằng `useStore.getState()` (xem interceptor của
  axios đọc token auth).

```tsx
export const useUiStore = create<UiState>()(persist((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}), { name: 'app-ui' }));
```

## Anti-pattern
**Đừng** lưu response của API vào Zustand/Redux rồi tự tay đồng bộ. Làm vậy tái tạo
lại đúng các bug về caching/loading mà TanStack Query đã giải quyết sẵn.
