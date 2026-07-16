# 12 · Trạng thái Lỗi, Loading & Rỗng

Mọi khung hiển thị dữ liệu đều xử lý **bốn** trạng thái: loading, error (lỗi), empty
(rỗng), và data (có dữ liệu).

## Loading
- Table: truyền `loading={isFetching}` cho `Table` của AntD.
- Section/card: `Skeleton` hoặc `Spin` của AntD.
- Nút đang chạy mutation: `loading={mutation.isPending}`.

## Error (lỗi)
- Lỗi API được chuẩn hóa về `{ status, message, code }`.
- Mutation hiển thị một toast trong `onError` qua `App.useApp().message.error(...)`.
- Lỗi ở cấp query: render `Result status="error"` của AntD hoặc `Alert` kèm nút thử
  lại (`refetch`). Không bao giờ hiển thị stack trace thô.
- Câu chữ báo lỗi giải thích *chuyện gì đã xảy ra* + *cách khắc phục*; không xin lỗi
  và không bao giờ mơ hồ.

## Empty (rỗng)
- Dùng `Empty` của AntD hoặc trạng thái rỗng sẵn có của `Table`. Cung cấp một lời
  kêu gọi hành động ("Tạo user đầu tiên") thay vì một ngõ cụt.

## Lưới an toàn toàn cục
Bọc app (hoặc các nhánh route con) trong một error boundary để bắt các sự cố lúc
render. Thêm nó khi bạn đưa vào UI rủi ro; mặc định giữ template tối giản.

## API feedback
Luôn dùng `App.useApp()` (`message`/`modal`/`notification`) để feedback bám theo
theme và context. **Đừng** dùng các import tĩnh `message.success(...)` — chúng mất
context theme trong AntD 6.
