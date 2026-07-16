# GitHub Copilot Instructions

Stack: React 19 + TypeScript (strict) + Vite 8 + Ant Design 6 + Tailwind CSS 4 +
React Router 7 + TanStack Query 5 + Zustand 5 + Axios.

Các quy tắc có thẩm quyền nằm trong `docs/ai/` (bắt đầu tại `docs/ai/99-ai-rules.md`
và `docs/ai/90-anti-patterns.md`). Hãy tuân theo khi gợi ý code:

- Không bao giờ hardcode màu, spacing, radius, hay font. Dùng theme token của Ant
  Design (`token.*`) hoặc các utility Tailwind ánh xạ tới token (`bg-surface`,
  `text-ink`, `border-line`, `rounded-app`).
- Server state dùng TanStack Query; client/UI state dùng Zustand. Không fetch dữ
  liệu bên trong `useEffect`.
- Phản chiếu feature tham chiếu `src/features/users` cho bất kỳ feature CRUD mới nào.
- Component ở dạng trình bày và nhận dữ liệu qua props/hook; chỉ tầng `api/*` của
  feature gọi HTTP client.
- Dùng alias import `@/`. Chỉ import feature qua `index.ts` của nó.
- Ưu tiên tái sử dụng component `src/shared/ui` thay vì tạo mới.


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
