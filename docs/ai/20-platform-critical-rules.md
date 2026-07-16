*Áp dụng cho toàn bộ platform (không riêng FE) — xem cách nó tương tác với quy tắc FE tại 99-ai-rules.md.*

# Quy tắc cốt lõi (luôn áp dụng)

> Bộ quy tắc ngắn gọn, luôn có hiệu lực, áp dụng cho toàn bộ platform chứ không
> riêng phần frontend. Giữ nội dung tinh gọn và không phụ thuộc ngôn ngữ
> (language-agnostic) — chỉ chứa các ràng buộc bắt buộc cho toàn platform.

1. **Một nguồn chân lý duy nhất (single source of truth).** Các quy tắc dùng chung
   cho toàn platform và data-model dùng chung nằm trong `docs/ai/20-29-platform-*.md`
   của chính repo này — **không viết đè lên các quy ước cross-cutting này ở nơi
   khác**; muốn thay đổi thì sửa trực tiếp tại nguồn (các file `20-29`) và cập nhật
   mọi chỗ phụ thuộc trong cùng một lần đổi.
2. **Tôn trọng ranh giới platform ↔ FE.** Quy tắc cấp platform là không phụ thuộc
   ngôn ngữ (architecture, API contract, security, git, naming, versioning,
   data-model). Quy tắc riêng theo stack (React/AntD) nằm ở `docs/ai/00-19`.
3. **Code theo contract & data-model dùng chung, không code theo nội bộ (internals)
   của backend.** Frontend code theo `docs/ai/22-platform-api-contract.md` và
   data-model — không bao giờ code theo schema vật lý của database.
4. **API là một contract (giao kèo).** Thay đổi một shape (hình dạng dữ liệu) dùng
   chung nghĩa là phải sửa có chủ đích tại `docs/ai/22-platform-api-contract.md` /
   `docs/ai/28-platform-data-model.md` — tuyệt đối không "chữa cháy" cục bộ ở nơi
   dùng mà không cập nhật tài liệu nguồn.
5. **Bảo mật là điều không thể thương lượng.** Không để secret trong code hay trong
   bundle phía client; tuân theo `docs/ai/23-platform-security.md`. Kiểm tra phía
   client chỉ là trải nghiệm người dùng (UX), không phải cơ chế phân quyền
   (authorization).
6. **Nhất quán quan trọng hơn khôn khéo.** Ưu tiên dùng một pattern đã được ghi
   tài liệu sẵn; nếu một quy tắc cản trở công việc, vẫn tuân theo nó và để lại một
   `TODO` giải thích mâu thuẫn đó.
7. **Định nghĩa "hoàn thành" (definition of done):** lint + typecheck + test đều
   pass; nếu một quy ước cross-cutting (20–29) thay đổi, tài liệu phải được cập
   nhật trong cùng PR.
