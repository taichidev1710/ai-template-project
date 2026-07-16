*Áp dụng cho toàn bộ platform (không riêng FE) — xem cách nó tương tác với quy tắc FE tại 99-ai-rules.md.*

# Quy tắc cốt lõi (luôn áp dụng)

> Bộ quy tắc ngắn gọn, luôn có hiệu lực. Được `scripts/sync-standards.mjs` phân
> phối vào thư mục `.ai/standards/` của mọi repo tiêu thụ (consumer repo). Giữ nội
> dung tinh gọn và không phụ thuộc ngôn ngữ (language-agnostic) — chỉ chứa các
> ràng buộc bắt buộc cho toàn platform.

1. **Một nguồn chân lý duy nhất (single source of truth).** Các quy tắc dùng chung
   cho toàn platform và data-model dùng chung nằm trong repo **platform-standards**.
   Mỗi consumer repo chỉ giữ một *bản sao* dưới `.ai/standards/` — **không bao giờ
   sửa các bản sao đó**; hãy sửa ở nguồn trong platform-standards, phát hành một
   version mới, rồi để các repo sync (đồng bộ) về.
2. **Tôn trọng ranh giới platform ↔ repo.** Quy tắc cấp platform là không phụ thuộc
   ngôn ngữ (architecture, API contract, security, git, naming, versioning,
   data-model). Quy tắc riêng theo stack (React, Spring, ...) nằm trong thư mục
   `docs/` của từng repo.
3. **Code theo contract & data-model dùng chung, không code theo nội bộ (internals)
   của repo khác.** Frontend code theo `.ai/standards/02-api-contract.md` và
   data-model — không bao giờ code theo schema vật lý của database.
4. **API là một contract (giao kèo).** Thay đổi một shape (hình dạng dữ liệu) dùng
   chung nghĩa là phải sửa ở nguồn trong platform-standards (contract + data-model)
   và bump version của nó — tuyệt đối không "chữa cháy" cục bộ trong một repo.
5. **Bảo mật là điều không thể thương lượng.** Không để secret trong code hay trong
   bundle phía client; tuân theo `.ai/standards/03-security.md`. Kiểm tra phía
   client chỉ là trải nghiệm người dùng (UX), không phải cơ chế phân quyền
   (authorization).
6. **Nhất quán quan trọng hơn khôn khéo.** Ưu tiên dùng một pattern đã được ghi
   tài liệu sẵn; nếu một quy tắc cản trở công việc, vẫn tuân theo nó và để lại một
   `TODO` giải thích mâu thuẫn đó.
7. **Định nghĩa "hoàn thành" (definition of done):** lint + typecheck + test đều
   pass; thư mục `.ai/standards/` đồng bộ đúng với version đã pin (CI sẽ kiểm tra
   điều này).
