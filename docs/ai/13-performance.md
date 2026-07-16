# 13 · Performance (hiệu năng)

Đừng tối ưu sớm — nhưng hãy theo các mặc định sau.

## Rendering
- Chọn (select) hẹp từ Zustand (`useStore(s => s.field)`).
- Memo hóa các giá trị suy dẫn tốn kém bằng `useMemo`; bọc các callback ổn định được
  truyền cho component con đã memo bằng `useCallback`. Đừng memo hóa mọi thứ.
- Cho danh sách các `key` ổn định (id của entity, không phải index của mảng).
- Compiler của React 19 giảm nhu cầu memo hóa thủ công — hãy đo trước khi thêm.

## Dữ liệu
- Đặt `staleTime` hợp lý để dữ liệu không bị refetch liên tục (mặc định toàn cục 60s
  trong `query-client.ts`).
- Dùng `keepPreviousData` cho các danh sách có phân trang/lọc.
- Prefetch (nạp trước) query của trang kế tiếp hoặc trang chi tiết khi hover/focus
  nếu điều đó có ích.

## Bundle
- Chia code (code-split) các route nặng với `React.lazy` + `<Suspense>`.
- Chỉ import thứ bạn dùng; tránh các file barrel sâu kéo theo tất cả.
- Biểu đồ (Recharts) và các thư viện nặng khác nên nằm trong các route được nạp lười (lazy).

## Đo lường
Dùng React DevTools Profiler và tab network trước khi tối ưu. Ship bản đơn giản trước.
