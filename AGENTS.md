# AGENTS.md

Chỉ dẫn xuyên công cụ cho các AI coding agent. Cùng ý đồ với `CLAUDE.md`.

**Thứ tự ưu tiên khi sinh code:**
1. `docs/ai/99-ai-rules.md` (ưu tiên cao nhất — ghi đè mọi thứ bên dưới)
2. `docs/ai/90-anti-patterns.md` (những gì KHÔNG được làm)
3. Phần còn lại của `docs/ai/` (được lập mục lục trong `docs/ai/README.md`)
4. Code sẵn có trong `src/features/users` (pattern tham chiếu để sao chép)

**Stack:** React 19, TypeScript (strict), Vite 8, Ant Design 6, Tailwind CSS 4,
React Router 7, TanStack Query 5, Zustand 5, Axios.

**Điều không thể thương lượng:**
- Không hardcode màu/spacing/radius — chỉ token (`docs/ai/06-theming.md`).
- Server state → TanStack Query; client state → Zustand. Không fetch trong `useEffect`.
- Tái sử dụng component từ `src/shared/ui` trước khi tạo mới.
- Feature mới phản chiếu cấu trúc `src/features/users` y hệt.
- Chỉ import feature qua API công khai `index.ts` của nó.

Chạy `npm run lint && npm run typecheck && npm run test` trước khi coi một task là xong.


## Platform-wide standards (áp dụng toàn platform — cũng phải đọc)
Các quy tắc xuyên suốt (cross-cutting) và **data-model** dùng chung nằm trong
`docs/ai/` cùng với mọi tài liệu khác. Hãy đọc chúng để code frontend khớp với cấu
trúc app dùng chung:
- `docs/ai/20-platform-critical-rules.md` — quy tắc platform luôn-bật
- `docs/ai/22-platform-api-contract.md` — API contract mà FE code theo
- `docs/ai/28-platform-data-model.md` — shape entity dùng chung (code theo chúng, không theo DB)
- `docs/ai/29-platform-glossary.md` — thuật ngữ dùng chung

Quy tắc đặc thù FE nằm ở `docs/ai/` (00–19). Nếu một quy tắc xung đột, thì các
quy tắc platform (20–29, critical rules) thắng cho các mối quan tâm xuyên suốt;
quy tắc FE (00–19) thắng cho phần đặc thù React/AntD.
