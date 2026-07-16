# 09 · Quy ước API

## Một HTTP client duy nhất
`src/shared/api/client.ts` xuất ra một `apiClient` (axios) đã cấu hình sẵn.
- Không bao giờ gọi `axios` trực tiếp hay `fetch` trong component.
- Request interceptor gắn bearer token từ `useAuthStore`.
- Response interceptor chuẩn hóa lỗi thành `NormalizedError` và xóa auth khi gặp 401.

## Tầng API của feature
Mỗi feature có một `api/<feature>-api.ts` — nơi **duy nhất** chứa các URL endpoint:
```ts
export const usersApi = {
  list: (params) => apiClient.get('/users', { params }).then(r => r.data),
  get:  (id)     => apiClient.get(`/users/${id}`).then(r => r.data),
  create: (input) => apiClient.post('/users', input).then(r => r.data),
  update: (id, input) => apiClient.put(`/users/${id}`, input).then(r => r.data),
  remove: (id) => apiClient.delete(`/users/${id}`).then(() => undefined),
};
```
Component gọi **hook**, hook gọi **api**, api gọi **apiClient**.

## Type
- Các shape response dùng chung trong `src/shared/api/types.ts`: `Paginated<T>`,
  `ListParams`, `ApiErrorBody`.
- Type request/response của feature trong `features/x/types.ts`.
- Endpoint dạng list trả về `Paginated<T>` = `{ items, total, page, pageSize }`.

## Lỗi (Errors)
Các hàm API ném ra `NormalizedError` (`{ status, message, code }`). Hook hiển thị nó
qua toast trong `onError`; xem `12-error-handling.md`.

## Cấu hình
Base URL đến từ `env.apiBaseUrl` (`VITE_API_BASE_URL`). Ở môi trường dev, Vite proxy
`/api` sang backend (`vite.config.ts`).
