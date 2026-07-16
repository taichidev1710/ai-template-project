# Mục lục tài liệu AI

Thư mục này là kho tri thức (knowledge base) cho các trợ lý AI và lập trình viên.
Nó mô tả chính xác cách code trong dự án phải được viết, để code do AI sinh ra luôn
nhất quán, dễ bảo trì và mở rộng trên mọi dự án được dựng từ template này.

**Các điểm vào (entry point)** ở gốc repo đều trỏ về đây: `CLAUDE.md`, `AGENTS.md`,
`.cursor/rules/project.mdc`, `.github/copilot-instructions.md`.

## Thứ tự đọc

| Ưu tiên | File | Mục đích |
|----------|------|---------|
| 🔴 1 | [99-ai-rules.md](./99-ai-rules.md) | **Quy tắc ưu tiên cao nhất. Đọc trước tiên.** |
| 🔴 2 | [90-anti-patterns.md](./90-anti-patterns.md) | Những gì KHÔNG được làm (kèm cách sửa) |
| 🟠 3 | [00-overview.md](./00-overview.md) | Nhìn nhanh sản phẩm & kiến trúc |
| 🟠 4 | [01-tech-stack.md](./01-tech-stack.md) | Thư viện, version, vai trò |
| 🟠 5 | [02-architecture.md](./02-architecture.md) | Cấu trúc thư mục & ranh giới |
| 🟡 6 | [03-coding-standards.md](./03-coding-standards.md) | Quy ước TS/React |
| 🟡 7 | [04-naming-conventions.md](./04-naming-conventions.md) | File, biến, type |
| 🟡 8 | [05-ui-design-system.md](./05-ui-design-system.md) | Spacing, kiểu chữ, layout |
| 🟡 9 | [06-theming.md](./06-theming.md) | Token, AntD + Tailwind, dark mode |
| 🟡 10 | [07-component-rules.md](./07-component-rules.md) | Tái sử dụng, cấu trúc, props |
| 🟡 11 | [08-state-management.md](./08-state-management.md) | Query vs Zustand |
| 🟡 12 | [09-api-conventions.md](./09-api-conventions.md) | HTTP client, service |
| 🟡 13 | [10-routing.md](./10-routing.md) | Route, guard, lazy loading |
| 🟡 14 | [11-forms-tables.md](./11-forms-tables.md) | Pattern Form & Table |
| 🟡 15 | [12-error-handling.md](./12-error-handling.md) | Lỗi, rỗng, loading |
| 🟢 16 | [13-performance.md](./13-performance.md) | Rendering, bundle, query |
| 🟢 17 | [14-accessibility.md](./14-accessibility.md) | Nền tảng A11y (khả năng tiếp cận) |
| 🟢 18 | [15-testing.md](./15-testing.md) | Vitest + Testing Library |
| 🟢 19 | [16-git-workflow.md](./16-git-workflow.md) | Branch, commit, PR |
| 🟢 20 | [17-security-auth.md](./17-security-auth.md) | Auth, token, guard |
| 🟢 21 | [18-i18n.md](./18-i18n.md) | Bản dịch & locale của AntD |
| 🟢 22 | [19-env-config.md](./19-env-config.md) | Biến môi trường & cấu hình |

## Platform-wide standards (áp dụng toàn platform, không riêng FE)

Các quy tắc xuyên suốt (cross-cutting) áp dụng cho toàn bộ platform — không phụ
thuộc React/AntD. Khi có xung đột với quy tắc đặc thù FE ở trên, xem cách phân xử
tại [99-ai-rules.md](./99-ai-rules.md).

| File | Mục đích |
|------|---------|
| [20-platform-critical-rules.md](./20-platform-critical-rules.md) | Quy tắc cốt lõi luôn áp dụng cho toàn platform |
| [21-platform-architecture.md](./21-platform-architecture.md) | Kiến trúc & ranh giới giữa các module |
| [22-platform-api-contract.md](./22-platform-api-contract.md) | Giao kèo API giữa frontend và backend |
| [23-platform-security.md](./23-platform-security.md) | Bảo mật: auth, secret, dữ liệu, dependency |
| [24-platform-naming.md](./24-platform-naming.md) | Đặt tên cấp platform (repo, URL, env var, event) |
| [25-platform-git-workflow.md](./25-platform-git-workflow.md) | Quy trình Git: branch, commit, pull request |
| [26-platform-coding-principles.md](./26-platform-coding-principles.md) | Nguyên tắc viết code không phụ thuộc stack |
| [27-platform-versioning.md](./27-platform-versioning.md) | Đánh version: SemVer, API, dependency, migration |
| [28-platform-data-model.md](./28-platform-data-model.md) | Data-model dùng chung (User, Order) |
| [29-platform-glossary.md](./29-platform-glossary.md) | Thuật ngữ dùng chung của toàn platform |

## Các bản triển khai tham chiếu

- [examples/feature-crud.md](./examples/feature-crud.md) — feature CRUD chuẩn mực
- [examples/data-hook.md](./examples/data-hook.md) — một hook query/mutation
- [examples/form-example.md](./examples/form-example.md) — một form AntD

Feature tham chiếu chạy thật là `src/features/users`. Khi phân vân, cứ sao chép nó.
