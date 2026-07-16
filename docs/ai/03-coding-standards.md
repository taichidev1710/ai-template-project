# 03 · Chuẩn viết code (Coding Standards)

## TypeScript
- **Bật strict mode** (`strict`, `noUncheckedIndexedAccess`,
  `noUnusedLocals/Parameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`).
- Không dùng `any`. Dùng `unknown` + thu hẹp kiểu (narrowing), hoặc một type chính xác.
- Dùng `import type { ... }` cho các import chỉ-là-type (bắt buộc bởi
  `verbatimModuleSyntax`).
- Không dùng `enum` (bị cấm bởi `erasableSyntaxOnly`). Thay bằng object union
  `as const` hoặc union của string literal.
- Ưu tiên `type` cho union/props; `interface` cho object shape có thể mở rộng (extend).
- Truy cập theo index có thể ra `undefined` — hãy xử lý (`arr[0] ?? fallback`).

## React
- **Chỉ dùng function component**, props được gõ kiểu (typed) qua một interface.
- Mỗi file một component; tên file khớp tên component (PascalCase.tsx).
- Xuất kiểu named export cho component (`export function Foo`). Tránh default export
  trừ khi công cụ nào đó bắt buộc.
- Giữ component nhỏ. Tách logic ra hook; tách markup thành component con khi một
  component vượt quá ~150 dòng.
- Suy dẫn (derive) state; đừng nhân bản nó. Đừng lưu thứ có thể tính ra được.
- Effect dùng để đồng bộ với hệ thống bên ngoài, **không** dùng để fetch dữ liệu
  (dùng TanStack Query) và **không** dùng để suy dẫn state.

## Style / định dạng
- Prettier + ESLint là nguồn chân lý. Chạy `npm run lint:fix`.
- Thụt lề 2 khoảng trắng, nháy đơn (single quote), có dấu chấm phẩy, dấu phẩy cuối
  (trailing comma), rộng 100 cột.

## Comment
- Giải thích **tại sao**, không phải cái gì. Xóa code bị comment lại.
