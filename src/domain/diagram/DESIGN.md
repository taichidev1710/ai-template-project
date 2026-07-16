# Thiết kế module Sơ đồ quan hệ (tổng quát hoá từ demo-sdqh)

Tài liệu này ghi lại mô hình dữ liệu và các quyết định thiết kế. Code trong thư
mục này (`src/domain/diagram/`) là **tầng nghiệp vụ thuần** — không React, không
AntD — dùng chung cho mọi module UI của tính năng.

## 1. Bốn khái niệm vuông góc (điểm mấu chốt)

Demo gộp mọi thứ vào một trường `level`, khiến nó dính "gia đình VN". Ta tách thành
4 khái niệm độc lập:

| Khái niệm | Là gì | Có lưu? | File |
|---|---|---|---|
| **Loại khối** (`BlockType`) | node *là cái gì* (Người, Phòng ban) — không thứ tự | ✅ | types.ts |
| **Quan hệ nền** (`BaseRelation`) | cạnh **vẽ tay & lưu** | ✅ | types.ts |
| **Quan hệ suy ra** (`DerivedRelation`) | tính bằng ghép đường đi | ❌ | derive.ts |
| **Cấp/độ sâu** (rank) | vị trí trong phân cấp | ❌ (tính) | derive.ts `computeRanks` |

## 2. Giải bài toán "kị → ông"

Chuỗi **Kị →(cha) Cụ →(cha) Ông**. Chỉ lưu 2 cạnh nền `kị→cụ`, `cụ→ông`.

"Kị là ông bà của Ông" = đi **2 bậc** trên quan hệ cha–con → là **quan hệ suy ra**,
định nghĩa bằng `pattern` — mỗi bước = `{ quan hệ, hướng ↑/↓/↔ }` (`RelationStep`):

```
Ông bà     = [↑cha-con, ↑cha-con]           Cháu     = [↓cha-con, ↓cha-con]
Anh chị em = [↑cha-con, ↓cha-con]  (self)   Cô/dì/chú= [↑cha-con, ↑cha-con, ↓cha-con] (self, parents)
```

Vì mỗi bước tự mang quan hệ, pattern **trộn được nhiều quan hệ** → khai báo được cả
họ hàng bên vợ/chồng (`↔` = quan hệ hai chiều như vợ chồng):

```
Con dâu/rể       = [↓cha-con, ↔vợ-chồng]  (self)
Bố/mẹ vợ/chồng   = [↔vợ-chồng, ↑cha-con]
Thông gia        = [↓cha-con, ↔vợ-chồng, ↑cha-con]
```

→ **"kị→ông", "con dâu/rể" KHÔNG phải loại liên kết và KHÔNG bao giờ lưu.** Không
cần tạo loại kị/cụ/ông–cháu/con dâu. Engine tự tính mọi cặp khớp pattern.

## 3. Quan hệ suy ra vẫn *vẽ và hiển thị* được

`DerivedRelation` **vẫn là một loại quan hệ trong danh mục** — có tên, `style`
riêng, bật/tắt được (`visibleByDefault`) — chỉ khác ở chỗ bạn **không vẽ tay từng
cạnh**; `computeDerivedPairs()` sinh mọi cặp khớp `pattern` rồi canvas vẽ bằng style
đó (mặc định nét mờ). Vậy vừa là "một loại quan hệ", vừa có "đường style suy ra".

## 4. Nhánh chính / phụ (chính/phụ) — hạng nhất

Thay cờ `hier` boolean của demo bằng `BaseRelation.role`:

- **`primary`** = xương sống: dựng cây, thu gọn nhánh, và là quan hệ mà suy ra chạy
  trên đó (cha–con, trực thuộc).
- **`secondary`** = quan hệ ngang: vẫn lưu & vẽ nhưng không thuộc cây (vợ chồng, bạn
  bè, phối hợp).

Ẩn/hiện là state hạng nhất (`DiagramVisibility`): ẩn theo loại khối, theo loại quan
hệ, bật/tắt suy ra, bật/tắt secondary, thu gọn nhánh (`collapsed`), nhãn cạnh.

## 5. Cấp độ: emergent (mặc định) vs khai báo tầng

- **Emergent** (gia đình): một loại khối "Người", cấp = `computeRanks` (độ sâu theo
  quan hệ primary). Không khai báo kị/cụ/ông. Vẫn tô màu theo cấp được.
- **Khai báo tầng** (tổ chức): loại khối có thứ tự + luật `chain`/`ends` ràng buộc
  tầng nào nối tầng nào. Dùng khi tầng là từ vựng cố định, có style riêng.

Cùng một engine phục vụ cả hai — khác nhau chỉ ở dữ liệu danh mục + luật.

## 6. Engine luật (5 loại)

`rules.ts` — thuần, `validate(diagram, rules) → Violation[]`:

- **require / limit**: đếm bậc liên kết của node theo hướng (in/out/any), so min/max.
  `require` bỏ qua node `exempt` (khối "Chưa xác định").
- **ends / chain / same**: danh sách cho phép theo từng quan hệ (**OR**) — một cạnh
  hợp lệ nếu thoả ≥1 luật của quan hệ đó; quan hệ không có luật nào thì tự do.
- `edgeWouldViolate()`: chặn cạnh phạm luật *trước khi* vẽ (chế độ nghiêm của canvas).

## 7. Phạm vi danh mục: LOẠI SƠ ĐỒ sở hữu vốn từ vựng

`DiagramTemplate` ("Loại sơ đồ") là **bundle tự chứa**: nó sở hữu `blockTypes` +
`relations` + `ruleSets` của chính nó. Rule trong các bộ luật đó tham chiếu loại
khối/quan hệ **trong cùng bundle** → luôn đồng bộ, và khi viết luật chỉ chọn được
vốn từ vựng của loại đó.

- **Vì sao loại sơ đồ sở hữu, không phải từng bộ luật:** một sơ đồ áp **nhiều** bộ
  luật; nếu mỗi bộ tự mang khối/quan hệ riêng thì stack nhiều bộ sẽ đụng/trùng. Cho
  loại sơ đồ sở hữu vốn từ vựng, còn bộ luật chỉ là gói ràng buộc → stack sạch.
- **Sơ đồ** (`Diagram`) chọn 1 loại + tick `ruleSetIds` (một tập con các bộ luật của
  loại) + có `localRules` riêng. `effectiveRules()` = gộp luật các bộ đã tick + riêng.
- **UI:** màn *Loại sơ đồ* là workspace một-chỗ với tab **Khối | Quan hệ | Bộ luật**;
  mỗi tab là CRUD phạm vi loại đó. `features/block-types/BlockTypesPanel` là tab Khối.

## 8. Lộ trình build

1. ✅ **Nền**: types + engine (validate + suy ra) + test — thư mục này.
2. ✅ **Loại sơ đồ**: `features/diagram-types` (danh sách + editor có tab) và tab
   **Khối** (`features/block-types/BlockTypesPanel`, phạm vi theo loại).
3. ⏳ **Tab Quan hệ** (nền + suy ra) và **tab Bộ luật** (rule-builder 5 loại + tạo
   catalog inline) trong màn Loại sơ đồ.
4. ⏳ **Sơ đồ** (`features/diagrams`): chọn loại, tick nhiều bộ luật, danh sách CRUD.
5. ⏳ **Canvas editor** (Cytoscape.js): vẽ, áp nhiều bộ luật, validate trực tiếp,
   overlay suy ra, thu gọn nhánh primary, lọc/ẩn hiện.

## 9. Điểm mở còn cần chốt về sau

- Danh sách `DerivedRelation` mặc định: hiện seed sẵn ông bà / cháu / anh chị em /
  cô-chú cho gia đình. Có nên cho user **tự dựng pattern** qua UI hay chỉ chọn từ
  thư viện dựng sẵn? (đề xuất: thư viện trước, builder sau).
- ✅ Suy ra đi trên **nhiều quan hệ**: mỗi bước là `RelationStep = {relationId, dir}`
  với `dir ∈ {up, down, both}` — khai báo được cả họ hàng bên vợ/chồng (con dâu/rể,
  thông gia…). `both` dùng cho quan hệ hai chiều (vợ chồng).
