# 06 · Theming (Token · AntD + Tailwind · Dark Mode)

**Quy tắc quan trọng nhất: không bao giờ hardcode màu, spacing, bo góc (radius) hay
font.** Mọi thứ đều dẫn xuất từ MỘT file token để các theme luôn đồng bộ.

## Một nguồn chân lý duy nhất
`src/shared/theme/tokens.ts` định nghĩa mọi màu/radius/font, theo từng chế độ
(`light`/`dark`). Nó cấp cho hai bên tiêu thụ:

1. **Ant Design** — `buildAntdTheme(mode)` ánh xạ token → `theme.token` của
   `ConfigProvider` (+ algorithm cho dark).
2. **Tailwind** — `ThemeProvider` ghi token vào các CSS variable `--app-*` trên
   `<html>`; `src/styles/index.css` ánh xạ chúng thành utility của Tailwind trong `@theme`.

```
tokens.ts ──► buildAntdTheme() ──► <ConfigProvider theme> ──► component AntD
          └─► tokensToCssVars()  ──► :root --app-*  ──► @theme --color-* ──► utility Tailwind
```

## Cách dùng token

**Trong AntD:** dựa vào props của component + theme; khi cần inline tùy biến thì đọc
token của AntD qua `theme.useToken()`:
```tsx
const { token } = theme.useToken();
<div style={{ color: token.colorText, padding: token.paddingLG }} />
```

**Trong Tailwind:** dùng các utility đã được ánh xạ (chúng bám theo token và tự đảo
màu khi ở dark mode):

| Utility | Token |
|---------|-------|
| `bg-primary` `text-primary` `border-primary` | màu chủ đạo (primary) |
| `text-ink` | chữ chính |
| `text-muted` | chữ phụ (secondary) |
| `text-subtle` | chữ cấp ba (tertiary) |
| `bg-canvas` | nền trang |
| `bg-surface` | nền card/container |
| `border-line` / `border-line-soft` | viền (border) |
| `rounded-app` / `rounded-app-sm` / `rounded-app-lg` | bo góc (radius) |
| `text-success/warning/error/info` | màu trạng thái |

**Không bao giờ:** `style={{ color: '#1677ff' }}`, `className="bg-[#fff]"`,
`className="text-blue-500"`, `p-[13px]`. Thay vào đó, thêm hoặc dùng một token.

## Đổi theme / thêm một brand
1. Sửa giá trị trong `tokens.ts` (`colorTokens.light` / `.dark`).
2. Xong — cả AntD và Tailwind đều cập nhật. Thêm token mới bằng cách thêm một key,
   rồi phơi (expose) nó trong `@theme` của `index.css` nếu muốn có một utility Tailwind.

## Dark mode
Được xử lý bởi `useThemeStore` (có lưu lại - persisted). `ThemeProvider` đặt
`data-theme` và tráo algorithm + token của AntD. Bật/tắt qua nút trên header (`toggleMode`).

## Thêm một theme khác (ví dụ "compact" hoặc brand thứ hai)
Mở rộng `ThemeMode` và `colorTokens` với một mục mới, thêm bộ algorithm/token AntD
tương ứng trong `buildAntdTheme`, và phơi ra một bộ chuyển đổi (switcher). Phần đường
ống token (plumbing) đã hỗ trợ sẵn N theme.

## Ghi chú về việc Tailwind ↔ AntD cùng tồn tại
Preflight của Tailwind v4 được bật mặc định. Nếu bản reset của nó xung đột với style
của component AntD, hãy tắt Preflight bằng cách import các layer của Tailwind một cách
tường minh trong `index.css` thay vì chỉ dùng một dòng `@import "tailwindcss";`:
```css
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);
```
Tiếp tục dùng Tailwind cho **layout/spacing**; để AntD nắm phần **giao diện component**.
