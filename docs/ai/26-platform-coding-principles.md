*Áp dụng cho toàn bộ platform (không riêng FE) — xem cách nó tương tác với quy tắc FE tại 99-ai-rules.md.*

# Coding Principles (nguyên tắc viết code — cấp platform)

Nguyên tắc không phụ thuộc stack; quy tắc cụ thể nằm trong tài liệu của từng module.

- **Trách nhiệm đơn (single responsibility);** đơn vị nhỏ; ranh giới rõ ràng.
- **Tường minh hơn ngầm định (explicit over implicit);** không dùng global ẩn;
  dependency được truyền vào (passed in).
- **Xử lý lỗi có chủ đích** — không nuốt lỗi âm thầm (silent catch); hiển thị thông
  báo có thể hành động được (actionable).
- **Mọi khung hiển thị dữ liệu đều xử lý đủ** các trạng thái: loading, error, empty
  (rỗng), và data (có dữ liệu).
- **Tái sử dụng trước khi tạo mới (reuse before creating);** không trùng lặp
  utility/component.
- **Type/contract trước** ở nơi ngôn ngữ hỗ trợ; không dùng thứ tương đương `any`.
- **Test cho phần logic và các luồng quan trọng;** có tính tất định (deterministic),
  không gọi network thật.
- **Comment giải thích *tại sao*, không phải *cái gì*;** xóa code chết (dead code).
- **Nhất quán thắng khôn khéo** — mỗi việc chỉ có một cách làm đã được ghi tài liệu.
