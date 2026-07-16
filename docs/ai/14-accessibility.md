# 14 · Accessibility (khả năng tiếp cận — mức nền)

Một sàn chất lượng, không phải chuyện tính sau. AntD cho khởi đầu tốt; đừng phá hỏng nó.

- **Label:** mọi input có `Form.Item label` hoặc `aria-label`. Nút chỉ có icon phải
  có `aria-label` (xem nút sửa/xóa trong `UsersTable`).
- **Bàn phím:** mọi phần tử tương tác đều tới được và thao tác được bằng bàn phím;
  vòng focus (focus ring) nhìn thấy được không được xóa bỏ. Modal giữ focus bên
  trong (AntD lo việc này).
- **Ngữ nghĩa (semantics):** dùng button/link thật (component AntD), không dùng `div`
  bấm-được.
- **Tương phản (contrast):** dựa vào token; đừng đặt màu tùy biến độ tương phản thấp.
- **Chuyển động (motion):** tôn trọng `prefers-reduced-motion`; tránh animation thừa thãi.
- **Ảnh/icon:** icon trang trí đặt `aria-hidden`; icon có ý nghĩa thì kèm chữ.
- **Ngôn ngữ:** đặt `<html lang>`; dùng chữ i18n, không phải chuỗi hardcode.

Kiểm tra nhanh: điều hướng toàn bộ luồng chỉ bằng bàn phím. Nếu không được, hãy sửa.
