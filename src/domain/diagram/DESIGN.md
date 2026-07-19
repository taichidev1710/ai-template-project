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

## 6. Engine luật (6 loại)

`rules.ts` — thuần, `validate(diagram, rules, relations?) → Violation[]`:

- **require / limit**: đếm bậc liên kết của node theo hướng (in/out/any), so min/max.
  `require` bỏ qua node `exempt` (khối "Chưa xác định").
- **ends / chain / same**: danh sách cho phép theo từng quan hệ (**OR**) — một cạnh
  hợp lệ nếu thoả ≥1 luật của quan hệ đó; quan hệ không có luật nào thì tự do.
- **forbid** (`ForbidRule {relation, when}`): **cấm quan hệ `relation` nếu hai khối
  ĐÃ CÓ quan hệ `when`.** Hai điểm khác hẳn 5 luật kia:
  1. Nó đọc **ĐỒ THỊ**, không đọc loại khối. Bốn luật cạnh/node nói được "Người lấy
     Người" nhưng **không bao giờ** nói được "…trừ em ruột mày", vì *là em ruột* là
     một **đường đi**, không phải một *loại*.
  2. Nó **CẤM**. ends/chain/same là allow-list **OR**, nên gộp chung thì cạnh chỉ cần
     thoả `same` là lọt → forbid chạy **riêng, như veto** (`EDGE_DENY_RULE_TYPES`).
  - **`when` TRỎ TÊN một quan hệ của cùng loại sơ đồ, không tự mô tả đường đi.** Đây
    là cả cái điểm (mục 7 — loại sơ đồ sở hữu vốn từ vựng): luật **chỉ được nói về
    quan hệ đã khai báo**. Muốn cấm anh chị em họ thì **thêm “Anh chị em họ (suy ra)”
    vào danh mục trước** — chỗ đó nó cũng thành thứ **nhìn thấy được trên canvas** —
    rồi luật mới trỏ vào. Chưa tạo quan hệ đó thì **không có luật về nó**.
  - `when` nhận cả quan hệ **nền** (cạnh có thật — “Cha mẹ – con”) lẫn **suy ra**
    (đường đi engine tính — “Anh chị em (suy ra)”, qua `derive.ts#patternConnects`).
  - Xét **cả hai chiều**: quan hệ đối xứng (vợ chồng) không lách được bằng cách vẽ ngược.
  - `when` trỏ vào quan hệ không có trong danh mục ⇒ **im lặng không chạy**, đúng như
    mọi luật viết cho vốn từ vựng của loại khác (mục 8.4).
  - `validate`/`edgeWouldViolate` nhận thêm tham số `relations` để giải nghĩa `when`.
    **Quên truyền = luật cấm im lặng biến mất** — `sample.test.ts` từng dính đúng bẫy
    này (test xanh mà chẳng kiểm gì).
  - **“Ba đời” là DỮ LIỆU.** `RS_FAMILY` viết Luật HN&GĐ 2014 đ.5.2.d thành 5 luật cấm
    cho `rel_spouse`, mỗi luật trỏ 1 quan hệ **đã có**: `rel_parent`, `der_grandparent`,
    `der_sibling`, `der_uncle`, `der_cousin`. Đời 4 **không có quan hệ nào** ⇒ không bị
    cấm, đúng luật. Nới/siết = **sửa data**, không đụng engine.
    - *Hai bản sai trước đó, ghi lại để đừng lặp:* (1) `KinRule {via, degree}` với
      `degree` đếm **“đời”** → nhét thẳng khái niệm gia đình VN vào engine. (2) `pattern`
      inline trong luật → **luật tự bịa ra vốn từ vựng** mà không ai khai báo và không
      gì vẽ được, trái mục 7. Bản `when` đúng: cùng luật đó chạy trên sơ đồ tổ chức =
      “cấm Phối hợp với người **Cùng sếp (suy ra)**” — có test.
- `edgeWouldViolate()`: chặn cạnh phạm luật *trước khi* vẽ (chế độ nghiêm của canvas).
  Với `limit`, đầu nào "nhận thêm" liên kết phụ thuộc hướng: `out` chỉ nguồn, `in`
  chỉ đích, **`any` là cả hai**. (Bản đầu chỉ xét đích → quan hệ đối xứng như vợ
  chồng vượt được max từ phía nguồn: `validate` báo lỗi nhưng canvas vẫn cho vẽ.
  Đã sửa + có test hồi quy.)

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
2. ✅ **Loại sơ đồ**: `features/diagram-types` (danh sách + editor có tab).
3. ✅ **Workspace 3 tab** trong Loại sơ đồ: **Khối** (`block-types`), **Quan hệ**
   (`relation-types` — nền chính/phụ + suy ra đa-quan-hệ với builder câu dẫn + sơ đồ
   minh hoạ), **Bộ luật** (`rule-sets` — rule-builder 6 loại, ngôn từ trung lập).
4. ✅ **Sơ đồ** (`features/diagrams`): danh sách CRUD (Bảng ⇄ Lưới + lọc theo loại),
   chọn 1 loại rồi **tick nhiều bộ luật** — nhưng chỉ trong vốn từ vựng của loại đó
   (đúng mục 7: không stack chéo bộ luật của 2 loại, vì rule tham chiếu id khối/quan
   hệ của loại kia sẽ không khớp node nào và **im lặng không chạy**). Đổi loại thì
   mặc định tick hết bộ luật của loại mới; loại bị khoá khi sơ đồ đã có khối/liên
   kết (vốn từ vựng đang được dùng).
5. ✅ **Canvas editor** (Cytoscape 3, `features/diagrams/canvas` + `DiagramCanvas`):
   vẽ khối/liên kết, áp nhiều bộ luật, validate trực tiếp (đánh dấu đỏ + panel),
   chặn cạnh phạm luật **trước khi vẽ** (`edgeWouldViolate`), overlay suy ra
   (ghostedge, `events:no` — không chọn/xoá được vì không phải dữ liệu), thu gọn
   nhánh primary, lọc/ẩn hiện. Nội dung canvas lưu qua `saveContent` (tách khỏi
   `update` của form: hai người ghi khác nhau, không được đè nhau).
   - **Nối khối (theo demo):** bật nút *Nối khối* → chạm khối NGUỒN → chạm khối
     ĐÍCH → `EdgeFormModal` mới hỏi **loại quan hệ + nhãn**. Không chọn quan hệ
     trước ở toolbar. Quan hệ nào phạm luật thì option bị khoá kèm lý do, và modal
     mặc định chọn quan hệ hợp lệ đầu tiên. Chạm nền = huỷ.
   - **Chạm liên kết** → `EdgeDetailModal`: sửa nhãn, *nét chạy*, xoá. Style còn
     lại **không** sửa ở đây — style thuộc loại quan hệ (mục 7); demo cho sửa
     từng cạnh, ta cố ý không theo.
   - **Nhãn liên kết** (như demo): nhãn riêng của cạnh → nếu trống thì hiện **tên
     loại quan hệ** → toggle *Nhãn liên kết* tắt thì ẩn hết. Fallback nằm trong
     stylesheet; đừng vá `label` bằng `cy.style().selector('edge')` sau đó — nó
     thay luôn mapper và làm mất fallback.
     - `visibility.hiddenLabels[]` **tắt nhãn theo TỪNG loại**, tách khỏi
       `hiddenRelations[]` (ẩn cả đường): bật suy ra lên là canvas ngập chữ, mà
       lúc đó **đường mới là thứ cần xem, nhãn mới là thứ gây rối**. Cả hai đều
       nướng vào `buildStylesheet` (lý do ở trên), nên `mutedKey` là dep của effect
       style — không phải mảng, vì identity đổi mỗi lần patch visibility.
     - `derivedEdgeDef` **phải** truyền `relName`: cạnh suy ra không ai vẽ nên
       không có nhãn riêng để fallback TỪ đó — thiếu `relName` là mapper ra `''`
       và **mọi quan hệ suy ra hiện lên vô danh**. Đã từng bị đúng vậy.
   - **Chi tiết khối** (`NodeFormModal`) có *Nối khối* (lưu rồi bật link mode với
     chính khối đó làm **nguồn** sẵn — đỡ một lần chạm) và *Thêm con* (tạo khối
     con nối bằng **quan hệ chính**, đúng nghĩa "con" ở mục 4). Loại khối của con
     **không đoán**: probe từng loại bằng chính `edgeWouldViolate`, loại nào luật
     nhận thì lấy → trên sơ đồ tổ chức, "Thêm con" ở Phòng ban ra **Quản lý** vì
     `chain` không cho gì khác. Không một dòng code nào biết về tổ chức.
   - **Tìm khối:** ô tìm ở toolbar (demo: `qfSearch`) → bay tới + chọn khối.
     So khớp **bỏ dấu tiếng Việt** (`canvas/search.ts#noDia`, có test — nhớ cả
     `đ/Đ` vì NFD không tách chữ này).
   - **Nét chạy (animation) — ngoại lệ duy nhất của mục 7:** `RelationStyle.animated`
     là **mặc định của loại**; `DiagramEdge.animated?` **override cho riêng 1 cạnh**
     (`undefined` = kế thừa → dùng `??`, **không** dùng `||`, để `false` tắt được
     một loại đang bật). Resolve ở `canvas/cy-elements.ts#resolveAnimated` (có
     test). Cytoscape không có dash animation sẵn → tự chạy `line-dash-offset`
     bằng `requestAnimationFrame`; bỏ qua khi `prefers-reduced-motion`, và vòng
     lặp chỉ chạy khi có ít nhất 1 cạnh animated (sơ đồ tĩnh = 0 CPU).
   - **Nguồn sự thật:** state React; cy chỉ rebuild khi *cấu trúc* đổi — không
     rebuild khi kéo khối, nếu không khối sẽ nhảy về dưới con trỏ.
   - **Responsive:** chỉ ghim chiều cao từ `lg` trở lên (canvas | panel cạnh nhau,
     mỗi cột full-height). Dưới `lg` thì xếp dọc và **trang tự cuộn** — ghim chiều
     cao ở đó sẽ ép cột canvas co còn ~74px trong khi `min-h` của canvas đẩy nó
     tràn ra đè lên panel.
   - **Style:** map ở `canvas/cy-elements.ts` (thuần, có test). Màu theme lấy từ
     design token nên canvas theo dark mode; màu khối/quan hệ là *dữ liệu*, không
     phải token. `line-dash-pattern` chỉ nhận mảng literal → resolve bằng 1
     selector cho mỗi line style, không dùng mapper.
   - **Virtualization (đã làm, theo `refreshWindow` của demo):** canvas chỉ mount
     lát cắt trong khung nhìn + vành đệm 35%, cap 300 khối gần tâm nhìn nhất;
     pan/zoom đánh giá lại cửa sổ sau debounce 150ms. Phần chọn lát cắt là hàm
     thuần `canvas/cull.ts#visibleWindow` (chỉ biết hình học, có test). Hệ quả đã
     xử lý trong `DiagramCanvas`: *Vừa khung* và focus (tìm kiếm, vi phạm) tính từ
     toạ độ **model** vì đích có thể chưa mount; marks + marching-ants áp lại theo
     `windowVersion` mỗi khi tập mount đổi. **Bẫy cho tính năng sau:** thứ gì đọc
     từ `cy` chỉ thấy phần ĐANG mount — vd xuất PNG kiểu demo
     (`cy.png({full:true})`) sẽ thiếu khối ngoài cửa sổ; phải tính trên model
     hoặc mount tạm toàn bộ rồi trả lại.
6. ✅ **Dữ liệu mẫu** (`sample.ts`): `generateSample(loại, bộLuậtĐãTick)` dựng sẵn
   khối + liên kết **thoả mọi luật** để test. Tổng quát như engine — chỉ đọc vốn từ
   vựng + luật của chính loại đó, nên **loại do user tự tạo cũng chạy**, không phải
   data tĩnh cho 7 loại dựng sẵn.
   - **Vì sao hợp luật theo cấu trúc:** mọi cạnh đi qua `edgeWouldViolate` — *đúng
     cái guard canvas dùng trước khi vẽ* — nên `limit`/`ends`/`chain`/`same` không
     thể sai. Chỉ `require` (luật về cạnh **thiếu**) cần một lượt vá riêng ở cuối.
   - **Cách dựng:** cây theo quan hệ **primary**, mỗi tầng một hàng. Gốc là loại
     khối **không bị `require` bắt có liên kết vào** (gia đình: “Chưa xác định” —
     nếu lấy “Người” làm gốc thì chính nó vi phạm “cần 2 cha mẹ”). Loại khối cây
     không với tới (Giáo viên, Phụ huynh) được gắn bằng quan hệ còn rảnh; quan hệ
     còn lại ghép **ngang trong cùng tầng** (đúng nghĩa `secondary`).
   - **Cha mẹ là một CẶP, không phải hai anh em:** tầng trên chia thành nhóm liền
     kề, con **chia vòng (round-robin)** nên hai node cạnh nhau luôn khác cha mẹ —
     mà lượt ghép ngang lại ghép đúng hai node cạnh nhau. Vậy nhóm cha mẹ *chính là*
     cặp vợ chồng. **Không luật nào phát biểu điều này**, nên chỉ test
     `sample.test.ts` giữ nó (đổi round-robin → luật vẫn xanh, test cặp đôi mới đỏ).
   - **Round-robin chỉ tách được anh em RUỘT, không tách anh em HỌ.** Vừa có luật
     `forbid`, nó soi ngay ra mẫu Gia đình đang có **4 cặp anh chị em họ lấy nhau**.
     Gốc: tầng 0 chỉ có 2 nhóm → hai node tầng 1 chung cha mẹ → con của chúng ở tầng
     2 là anh em họ. Sửa: **tầng gốc cấp cho mỗi node tầng 1 một nhóm riêng**
     (`MAX_TIER_WIDTH` nhóm ⇒ 8 khối “Chưa xác định”). Hệ quả **đúng và cố ý**: tầng
     út toàn anh em họ nên **không cưới nhau** — engine chặn, đời thật cũng vậy.
     `forbid.test.ts` giữ chỗ này.
   - Generator **không cần biết** luật cấm tồn tại: mọi cạnh đã đi qua
     `edgeWouldViolate`, nên thêm loại luật thứ 6 là nó tự tuân theo.
   - **Generator KHÔNG suy diễn ý tác giả.** Nó chỉ đọc luật; hai đầu của mỗi quan
     hệ lấy từ `ends`/`chain`/`same`, không từ đâu khác. Luật không nói thì nó lấy
     **cặp hợp lệ đầu tiên** — tuỳ tiện nhưng *hợp lệ*, đúng thứ mà loại sơ đồ cho
     phép. Nó **không** cố đoán xem tác giả *định* nói gì.
     - *Bản đầu sai:* đọc `limit(x, R, 'in')` như tác giả “ngụ ý” x là đầu nhận,
       rồi xếp hạng tầng theo độ sâu / chưa-ai-gắn. Đó là **bịa ra luật không ai
       viết** — cùng loại lỗi với `KinRule.degree` và `pattern` inline (mục 6).
       Từng định vá bằng “báo cáo phỏng đoán”; user chốt đúng: **đừng báo cáo
       phỏng đoán, đừng phỏng đoán nữa.**
     - **Cách sửa là DỮ LIỆU, không phải code:** mẫu ra sai ⇒ **luật đang lỏng** ⇒
       thêm `ends`/`same` cho loại đó. Đã làm đúng vậy cho các loại dựng sẵn:
       `rel_parent` (Người/Chưa-xác-định → Người), `rel_friend` + `rel_coord`
       (`same`), `rel_teach` (Giáo viên → Lớp), `rel_guardian` (Phụ huynh → Học
       sinh). Trước đó cả 5 cái đều do generator đoán.
     - Còn cố ý để trống: **Quy trình / Mạng lưới / Sơ đồ tư duy / Tự do** — chúng
       *là* loại không ràng buộc, nên “nối gì cũng được” chính là ý đồ, không phải
       thiếu sót.
   - **Luật mâu thuẫn** (vd `require` min 3 + `limit` max 2): dừng sau 4 vòng vá và
     **để vi phạm hiện ở panel Vi phạm** — nói thật, không giả vờ đã xong.

## 9. Điểm mở còn cần chốt về sau

- ✅ Danh sách `DerivedRelation` mặc định + **user tự dựng pattern**: đã có
  `PatternBuilder` (builder câu dẫn + sơ đồ minh hoạ) ở tab Quan hệ, và luật `forbid`
  dùng lại chính nó cho lối "đường đi tự dựng". Gia đình seed sẵn ông bà / cháu /
  anh chị em / cô-chú / **anh chị em họ** / con dâu-rể.
- ✅ Suy ra đi trên **nhiều quan hệ**: mỗi bước là `RelationStep = {relationId, dir}`
  với `dir ∈ {up, down, both}` — khai báo được cả họ hàng bên vợ/chồng (con dâu/rể,
  thông gia…). `both` dùng cho quan hệ hai chiều (vợ chồng).

## 10. Đối chiếu demo-sdqh (rà 2026-07) — còn thiếu gì so với demo

Kết quả rà toàn bộ demo sau khi port virtualization. Tên trong ngoặc là hàm/khu
tương ứng trong `demo-sdqh/index.html` để tra khi làm. Thứ tự trong mỗi nhóm ≈ độ
đáng làm (giá trị / công sức).

**Đáng làm sớm — rẻ mà bù đúng chỗ virtualization vừa mở ra:**

- **Dòng trạng thái** (`updateStatline`): "hiện x/y khối · z liên kết · ⚠n vi phạm
  · đang giới hạn". Từ khi có cap, user cần biết lúc nào canvas đang cắt bớt;
  hiện không có gì báo.
- **Đếm ⊕N trên khối thu gọn** (`hc` trong label mapper): demo ghi số con đang ẩn
  ngay trên nhãn; bản này chỉ đổi viền — không biết nhánh gọn to cỡ nào.
- **minZoom 0.02 / maxZoom 4** (demo `makeCy`): bản này 0.2 / 3. Zoom-out 0.2
  không bao quát nổi sơ đồ vài nghìn khối — mà giờ đã render nổi cỡ đó.
- **Nới `generateSample` cỡ lớn / stress** (`makeStressState`, 100–20 000 khối):
  demo có công cụ đo hiệu năng ngay trong app; bản này mẫu nhỏ nên chưa chứng
  minh được cap. (Có thể chỉ cần một tham số cỡ trong flow "Dữ liệu mẫu".)

**Chức năng demo có, bản này chưa có:**

- **Bố cục tự động** (`applyLayout` + `layoutModal`): 5 kiểu — cây dọc, cây ngang,
  tròn lan toả, vành theo cấp, lưới. Tính trên model (không đệ quy, hợp
  virtualization); cây đi theo quan hệ **primary** nên bản trung lập dùng đúng
  khái niệm sẵn có ở mục 4. Gap chức năng lớn nhất.
- **Wizard sửa từng lỗi** (`startFixWizard`/`fixShow`): thanh "Lỗi i/N · Mở & sửa
  · Tiếp ▸", bay tới từng vi phạm. Bản này mới có panel bấm-để-bay.
- **Lọc & bay tới** (`applyFilter` + class `hl`/`dim`): lọc theo từ khoá + loại
  khối → làm nổi cả TẬP kết quả, mờ phần còn lại, bay tới bbox kết quả. Bản này
  tìm kiếm chỉ bay tới từng khối một.
- **Xuất/nhập JSON, xuất PNG** (`doExport`/`doImport`/`cy.png`): chưa có. PNG dính
  bẫy virtualization đã ghi ở mục 8.5.
- **Lưu & khôi phục viewport theo sơ đồ** (`saveViewport`, `vpKey`): demo mở lại
  đúng chỗ đang xem (chỉ vài chục byte, debounce); bản này luôn fit lại từ đầu.
- **Nhóm theo cấp / nhóm tự tạo** (`groupModal`, class `lvgroup`/`lvbox`/`aggedge`):
  khung cha bao nhóm, thu gọn nhóm thành hộp, liên kết gộp về hộp. Bản trung lập
  = nhóm theo **loại khối** (hoặc nhóm user tự đặt tên). Nặng công nhất.
- **Cụm mẫu** (`insertTemplate` + "lưu nhánh thành mẫu riêng"): cụm dựng sẵn của
  demo là data gia đình (không port thẳng được — phạm trung lập); phần **user lưu
  nhánh của mình thành mẫu rồi chèn lại** thì trung lập và port được.
- **Ẩn từng liên kết riêng + hiện mờ liên kết đã ẩn** (`hidedge`/`hidsoft`,
  `showHidden`): bản này chỉ ẩn theo cả loại quan hệ.
- **Cài đặt cap render** (`settingsModal`, `CAPS`): demo cho chọn 150–300–…; bản
  này hằng cứng 300 trong `DiagramCanvas`.
- **Nền canvas chọn kiểu** (`themeModal`: chấm/lưới/kẻ/trơn): bản này nền phẳng
  theo token. Nếu làm, màu nền vẫn phải từ token — chỉ *hoạ tiết* là lựa chọn.

**Khác biệt cố ý — KHÔNG phải gap (đừng "sửa"):**

- Style từng cạnh không sửa được (thuộc loại quan hệ — mục 7; demo cho sửa, ta
  cố ý không theo). Ngoại lệ duy nhất: `animated`.
- Màu hardcode của demo → design token (mục 8.5); i18n cụm sơ đồ vẫn tiếng Việt
  cứng (ghi ở memory dự án).
- localStorage của demo → API mock + TanStack Query; "Dọn bộ nhớ" của demo vô
  nghĩa ở đây.
- Test tự chạy trong trang của demo → vitest.

**Vặt (làm khi tiện tay):** fade-in khối mới (`newborn`), fit có animation 600ms
(`flyToBox(bb, true)` — bản này nhảy thẳng), toast tổng kết sau các thao tác lớn.
