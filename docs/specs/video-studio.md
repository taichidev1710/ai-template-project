# Thiết kế: Video Studio — tạo video hàng loạt từ AI (Veo 3, Nano Banana, …)

> Trạng thái: **BẢN THIẾT KẾ / nghiên cứu — chưa code.** Đây là tài liệu để chốt
> hướng đi trước khi dựng. Mọi con số nền tảng (giá, rate limit, model id) là ảnh
> chụp thời điểm 07/2026, phải verify lại trước khi tích hợp thật.

## 0. Tóm tắt cho người bận

Bạn muốn một "xưởng" tạo video hàng loạt: dán một prompt gốc → tự cắt thành nhiều
**phân cảnh** → mỗi phân cảnh thành một (hoặc nhiều) video qua Veo 3 / Nano Banana
/ provider khác, có hàng đợi + delay chống ban, đồng bộ nhân vật qua ảnh, lưu file
về máy.

**Kiến trúc đã chốt:** **Backend Render điều phối toàn bộ** (giữ key, chạy hàng đợi
+ delay + retry, gọi provider, lưu video staging); **web SPA React là bảng điều
khiển** + tải video về folder user khi cần. Trình duyệt SPA thuần không tự làm
được ba việc — ghi file ổ đĩa, chạy job nền nhiều phút, giữ key bí mật — nên server
gánh. Server Render sẽ **nâng lên always-on** để hàng đợi không bị ngủ. Chi tiết +
các hướng thay thế: mục 3.

Về chế độ "free/relaxed" như app mẫu: bạn đã quyết **làm cả hai đường** (API chính
thức + chế độ phiên với cơ chế delay bạn đã hình dung). Ghi nhận. Tôi vẫn nêu rõ
rủi ro trong mục 4 (chế độ phiên = tự động hoá tài khoản consumer, **có thể bị khoá
tài khoản Google**) để bạn nắm; tôi hiện thực **đúng các chức năng delay/hàng đợi
bạn mô tả**, coi chế độ phiên là một provider **người dùng tự chịu trách nhiệm**,
và không thêm kỹ thuật né phát hiện nào ngoài delay đó. Delay/hàng đợi vốn cũng cần
cho đường chính thức để **tôn trọng rate limit và kiểm soát chi phí**.

---

## 1. Mục tiêu & phạm vi

### Trong phạm vi (theo mô tả của bạn)
- Tách 1 prompt gốc thành danh sách phân cảnh (ngăn cách bằng dòng trống), sửa/
  thêm/xoá/đổi vị trí từng phân cảnh.
- Cấu hình tạo video: provider + model, "speed" (fast/normal/quality), số lượng
  video mỗi phân cảnh (x1–x4), tỷ lệ khung hình (+ preset theo nền tảng).
- Khung xem lớn: mỗi phân cảnh một ô, hiển thị trạng thái, nút tạo/dừng/thử lại/
  xem video, sửa tỷ lệ riêng từng ô.
- Chế độ chạy: **toàn bộ** (kèm delay giữa các job), **lần lượt** (xong cái này
  mới chạy cái kế), **từng cái** (bấm tạo riêng một ô).
- Đồng bộ nhân vật: upload ảnh nhân vật, gán key/tên, highlight key trong prompt,
  và làm cho AI dùng đúng ảnh cho đúng nhân vật.
- Lưu video về folder người dùng chọn; mở video từ ô xem.
- Trạng thái: đang xử lý / thành công / lỗi + retry.

### Ngoài phạm vi (đề xuất để sau)
- Dựng/nối/cắt video sau khi tạo (đã có mục "Nối Video"/"Editor Video" riêng).
- Chấm điểm chất lượng tự động, lồng tiếng, phụ đề.
- Thanh toán/quản lý credit nội bộ (chỉ đọc số dư từ provider, không bán lại).

---

## 2. Bức tranh nền tảng AI (kết quả nghiên cứu)

### 2.1 Veo 3.1 (Google) — sinh video
- **Kiểu:** text-to-video **và** image-to-video. Đây là lõi tạo video.
- **Model id (07/2026):** `veo-3.1-generate-preview` (chuẩn, có audio),
  `veo-3.1-fast-generate-preview` (nhanh/rẻ), `veo-3.1-lite-generate-preview`
  (rẻ nhất). Bản `veo-3.0-*` đã deprecate (tắt 30/06/2026) → **không dùng cho
  code mới**.
- **Độ dài/tỷ lệ:** clip 4/6/8 giây, 24fps, tối đa 1080p; tỷ lệ **16:9** và
  **9:16** (một số nguồn nêu **1:1**). Đây là ràng buộc CỨNG — UI tỷ lệ phải bám
  theo provider, không bịa thêm.
- **Cơ chế gọi = BẤT ĐỒNG BỘ (rất quan trọng cho kiến trúc):** gửi yêu cầu → nhận
  một `operation` (job id) → **poll** tới khi xong → tải video về. Không có
  chuyện "gọi xong trả video ngay". Poll nên backoff (1s → tối đa 10s).
- **Không có free tier:** mọi truy cập API Veo đều cần **tài khoản billing trả
  phí**. Giá ~ **$0.15/giây** (Fast) đến **$0.40–0.50/giây** (chuẩn có audio).
  → một clip 8s có thể tốn từ ~$1.2 đến ~$4. **Chi phí là rủi ro chính** khi chạy
  hàng loạt.
- **Rate limit:** model preview ~**10 request/phút, tối đa 10 job đồng thời/
  project**; model production ~**50 request/phút**. → Đây là lý do THẬT để có
  delay + giới hạn đồng thời (mục 10).

### 2.2 "Nano Banana" = Gemini 2.5 Flash Image — sinh **ảnh** (không phải video)
- Model `gemini-2.5-flash-image`. Điểm mạnh nổi tiếng: **giữ nhất quán nhân vật**
  qua nhiều ảnh, ghép tối đa **~20 ảnh tham chiếu** (multi-image fusion). Giá
  ~**$0.039/ảnh**.
- **Vai trò trong hệ thống này:** đây là công cụ **tạo/đồng bộ ảnh nhân vật** —
  dựng ra khung hình nhân vật nhất quán để feed vào Veo (image-to-video). Nói cách
  khác: Nano Banana lo "nhân vật", Veo lo "chuyển động". Đây chính là mảnh ghép
  cho yêu cầu "đồng bộ nhân vật" của bạn.

### 2.3 Veo 3.1 "Ingredients to Video" — chìa khoá đồng bộ nhân vật trong video
- Veo 3.1 nhận **ảnh tham chiếu** trong cấu hình:
  `GenerateVideosConfig(reference_images=[...])` — tối đa ~3 ảnh, mỗi ảnh một vai
  (nhân vật/chủ thể, bối cảnh, phong cách). Cũng có **first-frame / last-frame**
  để ghim khung đầu–cuối.
- → **Cơ chế kỹ thuật cho "đồng bộ nhân vật" là đây**, không phải phép màu ẩn: ta
  đính kèm ảnh nhân vật vào request của đúng phân cảnh có nhắc tới nhân vật đó.
  Mục 9 mô tả cách map key → ảnh → `reference_images`.

### 2.4 Các provider khác (để trừu tượng hoá — đừng khoá cứng vào Veo)
| Provider | Kiểu | Ghi chú |
|---|---|---|
| Google **Veo 3.1** | t2v, i2v | Có audio; ingredients; async operation. |
| Google **Nano Banana** | ảnh | Đồng bộ nhân vật; feed vào i2v. |
| **Runway** Gen-4 | t2v, i2v | API async job tương tự. |
| **Kling** | t2v, i2v | Mạnh chuyển động; nhiều nguồn qua cổng trung gian. |
| **Luma** Dream Machine | t2v, i2v | Async job. |
| **Pika**, **Hailuo/MiniMax**, **Sora** | t2v(±i2v) | Tham số khác nhau. |

**Bài học:** mọi provider đều là **job bất đồng bộ, có rate limit, tính tiền**,
nhưng **tham số/tỷ lệ/độ dài/định dạng khác nhau**. → Bắt buộc có **tầng trừu
tượng provider** (mục 5) và UI **tự thích ứng theo năng lực provider** (không hiển
thị tỷ lệ mà provider không hỗ trợ).

### 4.1 Chế độ free — nội dung popover cảnh báo ⚠ (hiện khi bấm icon)

**Rủi ro (nói thẳng, không tô hồng):**
- **Có thể bị khoá TÀI KHOẢN GOOGLE**, không chỉ khoá app — mất luôn Gmail/Drive/
  YouTube nếu dùng tài khoản chính. Tự động hoá phiên consumer vi phạm điều khoản.
- **Không đảm bảo/không SLA:** phiên hết hạn hoặc bị chặn bất kỳ lúc nào giữa mẻ.
- **Không ổn định:** chất lượng/định dạng/độ dài phụ thuộc UI consumer, đổi bất
  ngờ; dễ hỏng khi Google cập nhật.
- **Rủi ro không thể loại bỏ** — delay chỉ giảm bớt, không xoá.

**Giảm thiểu (chấp nhận rủi ro thì làm để đỡ đau, không phải để "khỏi bị bắt"):**
- **Dùng tài khoản phụ**, tuyệt đối không dùng tài khoản chứa dữ liệu quan trọng.
- **Đặt delay đủ lớn** + **số lượng vừa phải mỗi ngày**, không dồn hàng loạt.
- **Ưu tiên API chính thức** cho việc quan trọng/khối lượng lớn — ổn định, đúng
  luật, không rủi ro tài khoản.
- Sao lưu kết quả sớm; đừng phụ thuộc phiên free cho deadline gấp.

> Ghi chú thiết kế: tôi hiện thực **cảnh báo + delay do bạn cấu hình**, KHÔNG thêm
> kỹ thuật né phát hiện. Đây là công cụ minh bạch để bạn tự quyết, không phải công
> cụ qua mặt Google.

**Nguồn:** [Veo 3.1 API](https://ai.google.dev/gemini-api/docs/veo) ·
[Veo 3/3 Fast pricing & configs](https://developers.googleblog.com/veo-3-and-veo-3-fast-new-pricing-new-configurations-and-better-resolution/) ·
[Ingredients to Video](https://developers.googleblog.com/introducing-veo-3-1-and-new-creative-capabilities-in-the-gemini-api/) ·
[Nano Banana / Gemini 2.5 Flash Image](https://developers.googleblog.com/en/introducing-gemini-2-5-flash-image/) ·
[Veo 3.1 rate limits](https://www.aifreeapi.com/en/posts/veo-3-1-api-rate-limit) ·
[Gemini rate limits per tier](https://www.aifreeapi.com/en/posts/gemini-api-rate-limits-per-tier).

---

## 3. Quyết định kiến trúc LỚN NHẤT (chốt trước tiên)

Yêu cầu "lưu video vào folder người dùng chọn" + "job nền nhiều phút + delay" +
"đăng nhập/giữ API key" khiến **web SPA thuần không đủ**. Vì sao, cụ thể:

- **Ghi file local:** trình duyệt chỉ có File System Access API (Chromium, phải xin
  quyền, không ghi tự do mọi nơi, không bền qua phiên). Không thể "tự lưu vào
  `C:\Users\...\videos`" như app mẫu.
- **Job nền:** tab đóng/ngủ là job chết. Delay 5–10 phút giữa các video mà đóng
  tab là hỏng cả mẻ.
- **Bí mật API key + CORS:** nhét API key vào SPA = lộ key cho mọi người xem
  source; và provider chặn gọi thẳng từ browser (CORS). Bắt buộc có một tiến trình
  đáng tin cầm key.

### Hướng đã chốt: **B — Server (Render) điều phối toàn bộ**

Bạn ở lại nền web và dùng server Render sẵn có; server sẽ được **nâng lên
always-on** nên không lo ngủ. → **Server cầm mọi thứ nặng**, trình duyệt chỉ là
bảng điều khiển.

| Thành phần | Vai trò |
|---|---|
| **Backend Render** (nền `be-template`) | Cầm API key; chạy **hàng đợi + delay + retry + poll** phía server; gọi Veo/Nano Banana (tránh CORS); lưu video (staging) + metadata; expose REST cho FE |
| **Web SPA (React)** | Bảng điều khiển: soạn prompt, tách cảnh, cấu hình, xem trạng thái realtime; **tải video về folder user chọn** khi cần |

**Hệ quả thiết kế:**
- **Hàng đợi sống ở server** → đóng tab / tắt máy user vẫn chạy tiếp (khi Render
  always-on). Trình duyệt chỉ *xem* tiến độ (poll REST hoặc SSE/WebSocket).
- **Delay + concurrency + backoff chạy ở server**, không phụ thuộc trình duyệt.
  (Cơ chế delay bạn đã hình dung sẵn — 15s…10p — hiện thực ở tầng server.)
- **"Lưu về folder trên máy user":** video sinh ra nằm ở server trước; khi user
  muốn có bản local, FE **tải xuống** — hoặc chọn folder qua **File System Access
  API** (`showDirectoryPicker`, Chrome/Edge) để ghi thẳng vào đó, hoặc tải thường.
  Việc này KHÔNG cần tab mở suốt lúc tạo — chỉ cần lúc muốn kéo file về.
- **Lưu trữ:** ✅ chốt **"ngồi canh" + chuyền thẳng** — server KHÔNG lưu video,
  chỉ làm ống đẩy bytes từ Veo xuống trình duyệt để ghi vào folder máy user
  (§12). → **không cần R2/persistent disk**. Đổi lại **tab phải mở suốt mẻ**.
  Muốn "đóng tab vẫn chạy" sau này thì mới cần kho đệm + always-on.

> Phần còn lại của tài liệu dùng cụm "**lõi điều phối**" = **backend Render** cho
> hướng này. Nếu sau này muốn "chạy hẳn trên máy user" (FS thật, không cần tải),
> có thể chuyển sang app desktop Tauri **tái dùng nguyên UI React** — nhưng đó là
> lựa chọn về sau, không phải bây giờ.

---

## 4. An toàn, pháp lý & điều NGUY HIỂM cần tránh

Đây là phần bạn yêu cầu "các điều nguy hiểm cần tránh" — đọc kỹ.

1. **"Free/relaxed" bằng tự động hoá tài khoản consumer = rủi ro cấm tài khoản.**
   App mẫu có "Đăng nhập VEO3", "11.8K credits", "relaxed" — đây là lái **phiên
   đăng nhập Google Flow/Gemini của người dùng** để tạo video "miễn phí/rẻ". Việc
   này **vi phạm điều khoản dịch vụ**, và "delay chống spam" thực chất là **né cơ
   chế phát hiện lạm dụng**. Hệ quả: Google có thể **khoá tài khoản Google cá
   nhân** (mất cả Gmail/Drive), không chỉ khoá app.
   → **Khuyến nghị:** xây dựng trên **API chính thức có billing**. Nếu bạn vẫn
   muốn hỗ trợ chế độ phiên, tôi sẽ **không** thiết kế cơ chế né phát hiện; tối đa
   là coi nó như một "provider" do người dùng tự chịu trách nhiệm, có cảnh báo rõ
   trong UI.
   **UI bắt buộc:** khi bật chế độ phiên, cạnh nó có **icon cảnh báo ⚠**; bấm vào
   mở popover liệt kê rủi ro + cách giảm thiểu (nội dung ở §4.1). Không giấu rủi
   ro sau một cái toggle im lặng.
2. **Chi phí thật, dễ cháy ví.** Veo tính **theo giây video**. Một mẻ 10 phân cảnh
   × 4 video × 8 giây có thể là **320 giây** × $0.15–$0.50 = **$48–$160 cho một
   lần bấm**. → BẮT BUỘC có **ước tính chi phí trước khi chạy** + **trần chi phí/
   trần số job mỗi mẻ** + xác nhận (mục 15).
3. **Rate limit thật.** 10 RPM / 10 job đồng thời (preview). Chạy ồ ạt = lỗi 429
   hàng loạt, tốn quota vô ích. → Delay + giới hạn đồng thời + backoff là **tính
   năng bắt buộc**, khung lại đúng nghĩa: **tôn trọng quota**, không phải né ban.
4. **API key là bí mật.** Không bao giờ đưa key vào bundle web/localStorage
   thường. Lưu ở lõi native (keychain/OS credential store) hoặc backend .env. UI
   chỉ thấy "đã cấu hình / chưa".
5. **Nội dung & bản quyền.** Ảnh nhân vật user upload có thể là người thật →
   deepfake/chân dung trái phép. Nên có ghi chú trách nhiệm và (tuỳ) chặn nội dung
   nhạy cảm theo policy provider. Video AI thường bị provider **gắn watermark
   (SynthID)** — nêu rõ, đừng hứa "sạch watermark".
6. **Mất dữ liệu job khi crash.** Job chạy nhiều phút; app tắt giữa chừng phải
   **khôi phục được** (hàng đợi lưu bền, mục 10).
7. **Rác file & trùng tên.** Lưu hàng trăm clip → cần quy ước đặt tên + chống ghi
   đè + dọn file mồ côi.

---

## 5. Kiến trúc phần mềm đề xuất

Ba tầng, ranh giới rõ:

```
┌─ UI (React – tái dùng)                                        ┐
│  features/video-studio/  (giống hình dạng features/diagrams)  │
│   pages / components / hooks / state (client: Zustand)        │
└──────────────────────────────────────────────────────────────┘
            │  gọi qua "cổng điều phối" (IPC nếu desktop, HTTP nếu backend)
┌─ LÕI ĐIỀU PHỐI (native core hoặc be-template)                 ┐
│  • ProviderRegistry  (Veo, NanoBanana, Runway… – adapter)     │
│  • JobQueue + Scheduler (delay, concurrency, retry, resume)   │
│  • Storage (ghi file, thumbnail, metadata json)               │
│  • SecretStore (API key / phiên)                              │
└──────────────────────────────────────────────────────────────┘
            │
┌─ DOMAIN THUẦN (không React, không I/O – unit test được)       ┐
│  src/domain/video/                                            │
│   • sceneParser  (tách prompt → scenes)                       │
│   • characterTagger (tìm/highlight key nhân vật trong text)   │
│   • runPlan (từ config → danh sách job + thứ tự + delay)      │
│   • costEstimator (giây × đơn giá theo provider/model)        │
│   • providerCapabilities (bảng năng lực để UI thích ứng)      │
└──────────────────────────────────────────────────────────────┘
```

**Nguyên tắc lấy từ module Sơ đồ đã có:** phần "suy nghĩ" (tách cảnh, lập kế hoạch
chạy, ước tính giá, năng lực provider) là **hàm thuần trong `src/domain/video/`**,
có test, không biết gì về React hay mạng. UI và lõi điều phối chỉ *dùng* chúng.
Điều này cho phép test toàn bộ logic khó mà không cần gọi API thật.

### Tầng adapter provider (mấu chốt để "bất kỳ AI nào")
Mỗi provider hiện thực chung một interface:

```
interface VideoProvider {
  id: 'veo31' | 'nanobanana' | 'runway' | ...
  capabilities(): ProviderCaps        // tỷ lệ, độ dài, có audio?, có i2v?, max refs…
  estimateCost(job): Money
  submit(job): Promise<ProviderJobRef> // trả job id của provider (async!)
  poll(ref): Promise<JobStatus>        // queued|running|done|error + tiến độ
  download(ref, destPath): Promise<FileInfo>
  cancel?(ref): Promise<void>
}
```

UI **không bao giờ** biết chi tiết Veo; nó hỏi `capabilities()` để dựng form, và
đẩy job qua registry. Thêm provider mới = thêm một adapter, UI không đổi.

---

## 6. Mô hình dữ liệu (bản nháp)

```
Project                      // một "mẻ" làm việc, lưu được, mở lại được
  id, name, createdAt, updatedAt
  outputDir                  // folder người dùng chọn (hướng A/C)
  sourcePrompt: string       // prompt gốc dán vào
  runConfig: RunConfig
  scenes: Scene[]
  characters: Character[]

Scene                        // một phân cảnh = một item trong list
  id, order
  text: string               // prompt của riêng cảnh này
  aspectOverride?: Aspect    // sửa tỷ lệ riêng từng ô (yêu cầu của bạn)
  countOverride?: 1..4
  characterKeys: string[]    // key nhân vật phát hiện trong text
  jobs: Job[]                // mỗi video sinh ra là 1 job (count → nhiều job)

Job                          // một lần tạo 1 video cụ thể
  id, sceneId, index         // index 0..count-1
  status: queued|processing|success|error|canceled
  providerRef?               // job id phía provider
  progress?: 0..100
  error?: { code, message, retriable }
  attempts: number
  outputFile?: string        // đường dẫn video đã lưu
  thumbnail?: string
  costActual?, startedAt?, finishedAt?

Character                    // ảnh nhân vật để đồng bộ
  id, key                    // "an", "@mainguy", "{{hero}}" — quy ước ở mục 9
  displayName
  images: string[]           // 1..N ảnh tham chiếu
  color                      // màu highlight trong prompt

RunConfig
  providerId, modelId
  speed: 'fast'|'normal'|'quality'   // ánh xạ sang model tier thật (mục 7)
  count: 1..4                        // số video / phân cảnh (mặc định)
  aspect: Aspect                     // mặc định, ô có thể override
  runMode: 'all'|'sequential'|'single'
  delay: 0|15|30|60|120|300|600 (giây)   // chỉ khi runMode='all'
  concurrency: number                // trần job đồng thời (mặc định theo provider)
  maxCostPerRun?, maxJobsPerRun?     // chặn cháy ví
```

Lưu Project ra **file JSON** cạnh video (hướng A/C) hoặc DB (hướng B) → mở lại,
resume, chia sẻ mẻ.

---

## 7. "Speed" (fast/normal/quality) thực chất là gì

Bạn hỏi phần này. **Không có nút bí ẩn nào** — nó là **ánh xạ sang cấp model +
tham số** của provider:

| Nhãn UI | Ý nghĩa | Với Veo 3.1 |
|---|---|---|
| **Fast** | Nhanh, rẻ, chất lượng thấp hơn | `veo-3.1-fast-generate-preview` |
| **Normal** | Cân bằng | `veo-3.1-generate-preview` (hoặc lite) |
| **Quality** | Chậm, đắt, nét nhất, có audio | `veo-3.1-generate-preview` full + 1080p |

Lưu ý: **"Normal = bản free" là hiểu lầm** — Veo API **không có free**. Cái "free/
relaxed" ở app mẫu đến từ phiên consumer (mục 4). Với API chính thức, ba mức chỉ
khác **model + độ phân giải + audio**, và **khác giá**. UI nên hiện kèm **đơn giá
ước tính** cạnh mỗi mức để user biết mình đang chọn gì. Mỗi provider tự khai báo
danh sách "speed tier" của nó qua `capabilities()` — provider không có mức nào thì
ẩn.

---

## 8. Luật tách phân cảnh (scene parsing)

Hàm thuần `domain/video/sceneParser.ts`. Quy ước đề xuất:

- **Ngăn cách chính:** một **dòng trống** (một hay nhiều `\n` liên tiếp) → ranh
  giới phân cảnh. (Đúng như bạn mô tả.)
- Trim khoảng trắng đầu/cuối mỗi cảnh; bỏ cảnh rỗng.
- **Tuỳ chọn nâng cao (bật/tắt):** nhận thêm marker rõ ràng như `---`, `###`,
  `Scene 1:`, `[Cảnh 2]` để người dùng chủ động chia; regex cấu hình được.
- Giữ **map ngược text↔cảnh** để khi user sửa list thì có thể ghép lại prompt gốc,
  và ngược lại (sửa prompt gốc → re-parse mà không mất override đã đặt — cần chiến
  lược hoà trộn: khớp theo thứ tự + cảnh báo khi số lượng đổi).
- Kết quả: `Scene[]` có `order`, `text`. Việc phát hiện key nhân vật (mục 9) chạy
  **sau** khi tách, trên `text` từng cảnh.

Edge cases phải test: prompt chỉ một cảnh; nhiều dòng trống liên tiếp; xuống dòng
trong cùng một cảnh (không phải dòng trống) phải giữ nguyên; ký tự unicode/tiếng
Việt; prompt cực dài.

---

## 9. Đồng bộ nhân vật — giải pháp chi tiết

Đây là phần bạn "chưa nắm rõ". Chia làm 4 lớp, làm được tới đâu tuỳ **năng lực
provider**.

### 9.1 Gán key cho ảnh
- User upload 1..N ảnh cho một nhân vật, đặt **key** + tên hiển thị.
- **Quy ước key** (đề xuất, chọn 1): dùng **cú pháp có ranh giới rõ** để tránh
  khớp nhầm chữ thường — ví dụ `@an`, `{{an}}`, hoặc `[an]`. Nếu cho gõ tên trần
  ("An") thì phải khớp **nguyên từ, phân biệt hoa/thường tuỳ chọn**, và cảnh báo
  khi key trùng từ thông dụng. Tôi nghiêng về **`@key`** — gõ nhanh, ít nhầm,
  highlight dễ.

### 9.2 Highlight trong prompt
- Trong ô prompt và list phân cảnh, mọi lần xuất hiện `@an` được **tô màu** theo
  `Character.color`, kèm chip nhỏ có avatar để nhận biết.
- Bảng bên cạnh liệt kê "nhân vật xuất hiện ở cảnh này" (suy ra từ `characterKeys`).
- Cảnh báo khi: key được nhắc nhưng **chưa có ảnh**; ảnh có nhưng **không cảnh nào
  dùng**.

### 9.3 Biến key thành thứ AI hiểu (mấu chốt kỹ thuật)
Có 3 mức, chọn theo provider:

- **Mức 1 — Reference images trực tiếp (tốt nhất, khi provider hỗ trợ, vd Veo 3.1
  "ingredients"):** khi build request cho một cảnh, lấy ảnh của các `@key` xuất
  hiện trong cảnh, đính vào `reference_images` (Veo tối đa ~3 ảnh/nhiều vai). Và
  **thay `@an` trong text** bằng mô tả trung tính ("the man in reference image 1")
  hoặc bỏ ký hiệu `@`, để prompt gửi đi sạch. Đây là cách "AI biết key ↔ ảnh nào".
- **Mức 2 — Sinh khung nhân vật trước bằng Nano Banana rồi image-to-video:** nếu
  cảnh cần nhân vật rất nhất quán, dùng Nano Banana tạo **first-frame** chứa đúng
  nhân vật (từ ảnh gốc), rồi đưa frame đó làm ảnh đầu vào Veo i2v. Chất lượng đồng
  bộ cao nhất, nhưng thêm một bước + chi phí ảnh.
- **Mức 3 — Chỉ văn bản (khi provider không nhận ảnh):** thay `@an` bằng **mô tả
  nhân vật cố định** mà user viết một lần ("An: nam, 30 tuổi, áo khoác da đen…").
  Đồng bộ yếu (model tự vẽ lại) nhưng luôn chạy được. Là fallback.

`providerCapabilities` khai báo `maxReferenceImages`, `supportsImageToVideo`,
`supportsFirstLastFrame` để UI biết đang ở mức nào và giải thích cho user.

### 9.4 Giới hạn cần nói thẳng
- Số ảnh tham chiếu/așcảnh **có trần** (Veo ~3). Cảnh có 5 nhân vật → phải chọn
  ưu tiên hoặc dồn vào một ảnh nhóm (Nano Banana fusion).
- Đồng bộ **không tuyệt đối** — vẫn có drift giữa các clip. Nên đặt kỳ vọng đúng
  trong UI.

---

## 10. Engine hàng đợi + delay + chế độ chạy

Lõi vận hành. Thiết kế như một **máy trạng thái job bền**.

### 10.1 Chế độ chạy (runMode)
- **`single`** — bấm "Tạo video" trên một ô → đẩy đúng job của phân cảnh đó.
- **`sequential`** — chạy **xong hẳn** job này (tới success/error) **mới** bắt đầu
  job kế. An toàn nhất, chậm nhất. Không cần delay (bản thân việc chờ-xong đã
  giãn cách).
- **`all`** — đẩy tất cả nhưng **có delay** giữa các lần *gửi* job, và **giới hạn
  đồng thời**. Đây là chế độ dễ dính rate limit nhất nên delay + concurrency là
  bắt buộc.

### 10.2 Delay (chỉ ở `all`)
- Option: **15s, 30s, 1p, 2p, 5p, 10p** (đúng yêu cầu). Delay tính **giữa hai lần
  submit**, không phải giữa hai lần hoàn thành.
- **Khung lại cho đúng:** mục đích là **ở dưới rate limit của provider** (vd 10
  RPM → tối thiểu ~6s/lần) và **giãn chi phí**. Không đóng gói như "mẹo né ban".
- Nên **tự gợi ý delay tối thiểu** từ `capabilities().rpm` (vd rpm=10 → gợi ý ≥6s)
  và cảnh báo nếu user chọn thấp hơn mức an toàn.

### 10.3 Concurrency, retry, backoff
- Trần job đồng thời mặc định = `min(user, provider.maxConcurrent)`.
- Poll trạng thái mỗi job với **backoff** (1s→10s) như Veo khuyến nghị.
- **Retry:** lỗi `retriable` (429, 5xx, timeout mạng) → tự thử lại với
  exponential backoff, tối đa N lần; lỗi nội dung/policy (4xx không-retriable) →
  dừng, báo user, có nút **Thử lại** thủ công.
- **Idempotency:** mỗi job có khoá riêng để không submit trùng khi resume.

### 10.4 Bền & khôi phục
- Trạng thái hàng đợi ghi xuống đĩa (JSON/SQLite) sau mỗi lần đổi trạng thái.
- Mở lại app: đọc lại job đang `processing` → poll tiếp bằng `providerRef` (không
  tạo mới), job `queued` → xếp lại. Đây là điểm sống-còn vì job kéo dài nhiều phút.

---

## 11. Tỷ lệ khung hình & preset nền tảng

- **Tỷ lệ gốc = cái provider hỗ trợ** (Veo: 16:9, 9:16, [1:1]). UI **chỉ hiện các
  tỷ lệ provider nhận** (từ `capabilities()`).
- **Preset nền tảng** là lớp tiện lợi map sang tỷ lệ hợp lệ:
  | Preset | Tỷ lệ | Ghi chú |
  |---|---|---|
  | YouTube ngang / Facebook | 16:9 | mặc định |
  | TikTok / Reels / Shorts | 9:16 | dọc |
  | Instagram feed | 1:1 | nếu provider hỗ trợ; nếu không → gợi ý 4:5 qua crop hậu kỳ |
  | Instagram portrait | 4:5 | thường phải **crop sau** vì Veo không sinh 4:5 |
- Preset không có tỷ lệ tương ứng ở provider → hiện "sinh 9:16 rồi crop" thay vì
  giả vờ hỗ trợ.
- **Override từng ô** (yêu cầu của bạn): mỗi Scene có `aspectOverride`; ô nào đổi
  thì badge hiển thị tỷ lệ riêng, và job của ô đó dùng tỷ lệ đó.

---

## 12. Lưu trữ file & mở video

**Mô hình đã chốt: "ngồi canh" + chuyền thẳng (stream-through) — KHÔNG lưu lâu
trên server, KHÔNG cần R2/persistent disk.**

- **Vì sao không cần kho server:** user mở tab suốt mẻ, nên mỗi video xong được
  chuyển thẳng về máy ngay, không đọng lại.
- **Luồng file:** Veo xong → server (đang giữ key) tải bytes từ Google → **đẩy
  thẳng (proxy stream)** xuống trình duyệt qua một endpoint tải-theo-job → trình
  duyệt ghi vào folder user chọn bằng **File System Access API**
  (`showDirectoryPicker` + writable stream, Chrome/Edge). Byte **không** ghi ra
  đĩa Render.
  ```
  Veo (Google)  ──key──▶  Render (ống, không lưu)  ──stream──▶  trình duyệt  ──▶  folder máy user
  ```
- **Chọn folder** một lần/Project qua `showDirectoryPicker` (xin quyền một lần);
  **bắt buộc** chọn trước khi cho chạy. Override từng cảnh bằng **thư mục con**
  trong folder này (vd `.../Cảnh 03/`).
- **Chỉ Chrome/Edge** (File System Access API). Trình duyệt khác → fallback nút
  "Tải xuống" thường (rơi vào Downloads).
- **KHÔNG xem video trong app, KHÔNG mở folder hộ** — rào bảo mật trình duyệt
  không cho (muốn thế phải là app desktop). Thay vào đó: mỗi video xong → **thông
  báo + hiện đường dẫn đã lưu** để user **tự mở** bằng file explorer + player của
  họ. (Quyết định của bạn: đơn giản, đúng khả năng web.)
- **Đường dẫn hiện được chỉ là TƯƠNG ĐỐI:** trình duyệt **giấu path tuyệt đối
  `C:\...`**, nên chỉ show **tên folder đã chọn + đường trong đó** (vd
  `videos/Cảnh 03/v1_veo_16x9.mp4`) + nút **Copy**. User tự chọn folder nên vẫn
  biết chỗ.
- **Lưới an toàn:** server giữ `providerRef` + trạng thái job **trong MongoDB**,
  KHÔNG giữ video. Rớt tab đúng lúc video vừa xong → mở lại, server **tải lại từ
  Veo** bằng `providerRef` rồi chuyền tiếp (link Veo còn hạn vài ngày). Rớt mạng
  ngắn không mất trắng.
- **Metadata + trạng thái Project → MongoDB** (§12.1), KHÔNG lưu ở máy user. Video
  là thứ **duy nhất** nằm trên máy user.

> Cảnh báo dùng: mẻ lớn có thể chạy **hàng giờ** (nhiều cảnh × nhiều video × delay).
> "Ngồi canh" nghĩa là **tab phải sống suốt** — máy ngủ / trình duyệt crash / đóng
> nhầm sẽ dừng việc chuyền file (job phía Veo vẫn xong, kéo lại được như trên,
> nhưng bất tiện). Với mẻ rất lớn, cân nhắc chia nhỏ, hoặc sau này bật kho đệm R2 +
> Render always-on để đóng tab thoải mái (đổi từ mục này sang mô hình đệm ở §3).

### 12.1 Lưu/Mở Project → MongoDB (đóng tab mở lại được)
- **Nguồn sự thật = MongoDB** qua backend Render (KHÔNG dùng IndexedDB). Mỗi
  Project gắn **user đăng nhập**, gate bằng **permission** (RBAC sẵn có). Đóng tab
  → đăng nhập lại → tải Project; mở được từ **máy khác**.
- Lưu **prompt, cấu hình, danh sách cảnh, nhân vật, trạng thái từng job, tham
  chiếu file đã lưu** — KHÔNG lưu bytes video.
- **Export/Import `.json`** để backup / chia sẻ / chuyển máy (không cần server).

### 12.2 Vì sao không mở được file/folder trong web (ghi lại cho rõ)
Trình duyệt **không** được phép: mở file theo đường dẫn tuyệt đối, bật Windows
Explorer, "reveal in folder", hay mở player ngoài. Đây là rào bảo mật cứng, **chỉ
app desktop (Tauri) mới vượt qua**. Đã cân nhắc và **chọn ở lại web** → dùng cơ chế
**thông báo + đường dẫn** ở trên. Nếu tương lai cần đúng hành vi "mở folder trên
máy", đó là lý do chính đáng để bọc UI này thành desktop Tauri (UI giữ nguyên).
- **Quy ước tên** đề xuất:
  `{projectSlug}/{sceneOrder:02d}_{sceneSlug}/v{index}_{provider}_{aspect}_{jobId8}.mp4`
  → không trùng, sort tự nhiên, truy vết được.
- Ghi kèm **metadata** `.json` cạnh mỗi video (prompt, provider, model, seed, cost,
  thời điểm) để tái lập.
- **Thumbnail:** trích 1 frame (ffmpeg ở lõi native) để ô xem có ảnh đại diện.
- Nút **"Xem video"** mở bằng player mặc định của OS (hướng A: shell open; hướng
  C: mở đường dẫn local; hướng B: stream/download từ server).
- Xử lý: đĩa đầy, không quyền ghi, tên quá dài (Windows 260 ký tự) → báo lỗi rõ.

---

## 13. Phân rã UI (khung xem lớn + cột cấu hình)

Bố cục 3 vùng (giống app mẫu, và khớp lối `features/*` hiện có):

### 13.1 Cột trái — Cấu hình (RunConfig)
- **Model/Provider** (chọn provider → chọn model).
- **Nguồn/Tài khoản**: **API chính thức** ↔ **Chế độ phiên (free)**. Khi chọn free
  → hiện **icon ⚠** ngay cạnh; bấm mở popover rủi ro + giảm thiểu (§4.1).
- **Speed**: Fast / Normal / Quality (kèm đơn giá ước tính/giây).
- **Aspect**: nút tỷ lệ + dropdown preset nền tảng.
- **Số lượng**: x1–x4 (video/phân cảnh).
- **Chế độ chạy**: Toàn bộ / Lần lượt / (Từng cái = nút trên mỗi ô).
- **Delay** (hiện khi chọn Toàn bộ): 15s…10p, kèm gợi ý mức an toàn.
- **Concurrency + trần chi phí/số job** (nâng cao, có thể thu gọn).
- Nút lớn **"Tạo N video"** hiện **N thật + tổng chi phí ước tính** trước khi chạy;
  bấm → modal xác nhận nếu vượt ngưỡng.

### 13.2 Cột giữa — Prompt & danh sách phân cảnh
- Ô **Prompt gốc** (dán vào). Nút **Tách phân cảnh**/tự tách khi dán.
- **List phân cảnh** kéo-thả đổi thứ tự, mỗi item: số thứ tự, text (sửa inline),
  chip nhân vật, badge tỷ lệ/số lượng override, nút xoá/nhân bản.
- Panel **Nhân vật**: upload ảnh, đặt `@key`, màu; đếm cảnh dùng.
- Highlight `@key` trong text.

### 13.3 Cột phải — Khung xem lớn (grid video)
Mỗi phân cảnh một ô (hoặc mỗi *job* một ô nếu count>1 — đề xuất: một ô/phân cảnh,
bên trong có tab/thumbnail cho từng biến thể video). Mỗi ô hiển thị:
- **#thứ tự**, provider/model, tỷ lệ, speed (như app mẫu).
- **Trạng thái**: Hàng đợi / Đang xử lý (progress + ETA) / Thành công / Lỗi /
  Đã huỷ — màu + icon rõ.
- **Prompt rút gọn** + nhân vật dùng.
- **Nút theo trạng thái:**
  - *queued*: "Tạo video" (chạy riêng ô này) · "Bỏ khỏi hàng đợi".
  - *processing*: "Tạm dừng/Huỷ" · progress.
  - *success*: hiện **đường dẫn đã lưu** (tương đối) + nút **Copy đường dẫn** ·
    "Tạo lại" · chọn biến thể. (Web không mở file/folder hộ — user tự mở; §12.2.)
  - *error*: thông báo lỗi ngắn · **"Thử lại"** · "Xem log".
- **Sửa tỷ lệ riêng ô** ngay trên card.
- **Chỉnh sửa & tạm dừng:** cho phép **sửa prompt của ô đang lỗi/queued rồi chạy
  lại**; job đang chạy chỉ cho **huỷ** (không sửa giữa chừng — provider không cho).

### 13.4 Thanh dưới (như app mẫu)
- "N videos · ETA · tiến độ tổng", nút **Tạm dừng cả hàng đợi** / **Huỷ tất cả**.

### 13.5 Ánh xạ component & tuân thủ rule FE (bắt buộc khi code)

Nguyên tắc (theo `docs/ai/07-component-rules.md`): **tái dùng project → AntD →
mới**. Chỉ tạo mới khi hai cái trước không có, và vẫn đúng rule (token, không
hardcode màu/spacing, `App.useApp()` cho message).

| Mảnh UI | Dùng gì (ưu tiên tái dùng) | Ghi chú |
|---|---|---|
| Khung 3 cột / page container | `PageContainer` (shared/ui) + Tailwind grid, **mirror bố cục `DiagramEditorPage`** | page sở hữu state |
| Select provider/model, preset nền tảng | **AntD `Select`** | — |
| Segmented: nguồn, speed, tỷ lệ, số lượng, chế độ, delay | **AntD `Segmented`** (hoặc `Radio.Group`) | màu qua token |
| Icon ⚠ + popover Free | **AntD `Popover`** + `WarningOutlined`; nội dung = **mới** `FreeModeWarning` | `token.colorWarning/colorError` |
| Nút "Tạo N video" + ước tính | **AntD `Button`** primary; số lấy từ domain `costEstimator` | — |
| Ô prompt gốc | **AntD `Input.TextArea`** | — |
| Highlight `@key` trong prompt | **mới** `PromptHighlighter` | như canvas diagram tự vẽ; màu = *data* |
| List phân cảnh | **AntD `List`/`Card` + `Tag` + `Input` + `Button`**; item = **mới** `SceneListItem` | reorder: xem "Dependency" |
| Panel nhân vật + upload ảnh | **AntD `Upload` + `ColorPicker` + `Avatar` + `Tag`**; **tái dùng pattern Upload của `NodeFormModal`** | ảnh → data-URL |
| Card video + trạng thái + progress | **AntD `Card` + `Tag` + `Progress` + `Button`**; card = **mới** `VideoCard` | trạng thái = `Tag` màu token |
| Modal sửa cảnh/cấu hình | **AntD `Modal`**, **mirror pattern modal diagram** (`destroyOnHidden` + lưu ý `useForm`) | xem memory form-in-modal |
| Thông báo xong / lỗi / toast | **`App.useApp()`** `message`/`notification` | KHÔNG dùng `message` tĩnh |

**Component mới cần tạo** (đều *presentational*, nhận props): `VideoStudioPage`
(container), `ConfigPanel`, `FreeModeWarning`, `PromptHighlighter`, `SceneList` +
`SceneListItem`, `CharacterPanel` + `CharacterItem`, `VideoGrid` + `VideoCard`,
(tuỳ) `SceneEditModal`.

**Ranh giới state (theo rule):**
- **Server state** (CRUD Project ↔ MongoDB, trạng thái job) → **TanStack Query**
  trong `features/video-studio/hooks/` + `api/`; component **không** gọi axios;
  query key qua **key factory** của feature.
- **Draft/UI state** (cảnh, cấu hình, chọn, tiến trình chạy) → **local page state**
  như `DiagramEditorPage`, hoặc Zustand nếu cần chia sẻ rộng.
- **Logic thuần** → `src/domain/video/` (không React/mạng, có test).
- Feature là **module ĐẶC BIỆT** (như `profile`/`diagrams`) → được phép lệch chuẩn
  CRUD nhưng phải ghi rõ lý do.

**Dependency mới — ✅ chốt thêm lib kéo-thả:** đổi thứ tự cảnh bằng **kéo-thả**
(không phải nút lên/xuống). Project chưa có lib DnD → thêm **`@dnd-kit`** (chuẩn
hiện đại, hợp React 19, có a11y bàn phím sẵn). **Bắt buộc cập nhật
`docs/ai/01-tech-stack.md`** (pin version) khi thêm — theo rule. Dùng cho
`SceneList` (và có thể cả sắp xếp ảnh nhân vật).

**i18n — ✅ chốt dùng i18n chuẩn** (KHÔNG hardcode như `features/diagrams`): mọi
chuỗi UI qua **i18n key** trong `src/locales/{vi,en}` (namespace riêng, vd
`video-studio`). → đúng rule FE, có sẵn cả EN. Lưu ý khi code: đừng để lọt chuỗi
Việt cứng trong component; label/nút/thông báo/tooltip đều qua `t('...')`.

---

## 14. Trạng thái, lỗi, retry (máy trạng thái job)

```
queued ──submit──▶ processing ──poll:done──▶ success
   ▲                   │                        
   │                   ├─poll:error(retriable)─▶ (backoff) ─▶ processing
   │                   └─poll:error(fatal)────▶ error ──retry(thủ công)──▶ queued
   └───────────────── canceled ◀── user hủy ───┘
```
- Mỗi lỗi lưu `code`, `message`, `retriable`, `attempts` để hiện đúng và quyết
  định tự-retry hay chờ user.
- Phân loại lỗi: mạng/timeout, 429 rate-limit, 5xx provider, 4xx nội dung/policy,
  hết credit/billing, lỗi tải/ghi file. Mỗi loại có thông điệp + hành động gợi ý
  riêng (vd 429 → "giảm concurrency/tăng delay").

---

## 15. Chức năng bổ sung nên có (đề xuất của tôi)

Ưu tiên cao:
- **Ước tính chi phí + trần chi phí/mẻ** (mục 4.2) — chống cháy ví. *Bắt buộc.*
- **Hiển thị credit/quota còn lại** của provider (đọc từ API nếu có).
- **Resume sau crash** (mục 10.4). *Bắt buộc cho trải nghiệm thật.*
- **Lưu/Mở Project** (JSON) — làm dở, đóng app, mở lại.
- **Nhật ký (Logs)** như app mẫu — soi request/response/lỗi khi cần.

Ưu tiên vừa:
- **Prompt templates / biến** (chèn `@nhân_vật`, `{bối_cảnh}` tái dùng).
- **Seed** cố định để tái lập; **negative prompt**; bật/tắt **audio** (Veo có).
- **Nhân bản phân cảnh**, **chạy lại chỉ các ô lỗi**, **chọn nhiều ô → chạy**.
- **Xuất bảng CSV** (cảnh, prompt, trạng thái, chi phí) để theo dõi.
- **Kiểm tra prompt** sơ bộ trước khi gửi (độ dài, ký tự lạ, key thiếu ảnh).

Ưu tiên thấp / sau:
- Tạo **first/last frame** bằng Nano Banana ngay trong app.
- Hàng đợi thông minh: tự giãn khi gặp 429 liên tục (adaptive backoff).
- Webhook/thông báo khi mẻ xong.

---

## 16. Rủi ro & điều cần tránh (tổng hợp)

| Rủi ro | Mức | Cách giảm |
|---|---|---|
| Cấm tài khoản do tự động hoá phiên consumer | Cao | Dùng API chính thức; không thiết kế né phát hiện; cảnh báo rõ nếu bật chế độ phiên |
| Cháy chi phí khi chạy hàng loạt | Cao | Ước tính giá + trần chi phí + xác nhận |
| Rate limit 429 | Trung | Delay theo rpm + concurrency + backoff |
| Lộ API key | Cao | Lưu ở lõi native/backend, không vào UI/bundle |
| Mất job khi crash | Trung | Hàng đợi bền + resume bằng providerRef |
| Kỳ vọng đồng bộ nhân vật quá cao | Trung | Nói rõ giới hạn ref-image; cung cấp mức 1/2/3 |
| Khoá cứng vào Veo | Trung | Tầng adapter provider ngay từ đầu |
| Ghi đè/rác file | Thấp | Quy ước tên + metadata + dọn mồ côi |
| Web SPA không đủ năng lực | Cao | Chốt kiến trúc A/C trước khi build |

---

## 17. Lộ trình build theo giai đoạn

- **P0 — Domain thuần (không cần API/desktop):** `sceneParser`, `characterTagger`,
  `runPlan`, `costEstimator`, `providerCapabilities` + unit test. Dựng được ngay
  trong repo hiện tại, không rủi ro. *Đây là nơi bắt đầu an toàn nhất.*
- **P1 — UI khung (mock provider):** 3 cột, list phân cảnh kéo-thả, grid trạng
  thái, cấu hình — chạy trên một **FakeProvider** (giả lập async + lỗi ngẫu nhiên)
  để hoàn thiện UX mà không tốn tiền/không cần key.
- **P2 — Chốt kiến trúc & lõi điều phối:** dựng hướng A (Tauri) hoặc C (local
  backend); JobQueue bền + Storage + SecretStore.
- **P3 — Adapter Veo 3.1 thật:** submit/poll/download; speed→model; aspect; audio.
- **P4 — Đồng bộ nhân vật:** reference images (mức 1) → Nano Banana (mức 2).
- **P5 — Hoàn thiện:** cost/quota, resume, logs, templates, đa provider thứ 2.

Mỗi phase là một lát cắt chạy được, có thể dừng lại đánh giá.

---

## 18. Quyết định đã chốt & còn mở

**Đã chốt (trao đổi 07/2026):**
1. **Kiến trúc:** ✅ Hướng **B — server Render điều phối toàn bộ** (queue/delay/
   provider ở server); FE là bảng điều khiển + tải video về máy. Render nâng
   always-on. (mục 3)
2. **Đường dùng AI:** ✅ **Cả hai** — API chính thức + chế độ phiên "free" với cơ
   chế delay đã mô tả (chế độ phiên: user tự chịu trách nhiệm, chỉ delay, không né
   phát hiện). (mục 4)
3. **Provider:** ✅ **Veo 3.1** (video) + **Nano Banana** đi kèm (tạo/đồng bộ ảnh
   nhân vật). Có nút **upload ảnh + đặt tên/key** cho Veo dùng.
4. **Lưu trữ:** ✅ **"Ngồi canh" + chuyền thẳng** — server không lưu video, đẩy
   thẳng về folder máy user (§12). Không cần R2. Đánh đổi: **tab mở suốt mẻ**.
5. **Lưu Project:** ✅ **MongoDB** qua backend (per-user + permission) + **export
   `.json`**. Bỏ IndexedDB. (§12.1)
6. **Xem video:** ✅ **Không xem/không mở folder trong app** — chỉ **thông báo +
   hiện đường dẫn** để user tự mở. **Ở lại web**, không pivot desktop. (§12.2)

7. **i18n:** ✅ **dùng i18n chuẩn** (`src/locales/{vi,en}`, namespace `video-studio`),
   không hardcode. (§13.5)
8. **Kéo-thả cảnh:** ✅ **thêm `@dnd-kit`** cho reorder; cập nhật tech-stack khi
   thêm. (§13.5)

**Còn lại (nhỏ, mặc định được — xác nhận khi tới):**
- Quy ước key nhân vật: `@key` (đề xuất) / tên trần / `{{key}}`.
- Một ô = một cảnh (nhiều biến thể) hay một ô = một video.
- Realtime: poll REST hay SSE/WebSocket.

> **Chỉ đạo thi công đã ghi nhận (§13.5):** khi code phải theo rule FE — tái dùng
> component project → AntD → mới; token bắt buộc; **i18n key**; mirror
> `features/diagrams` + `features/users`.

> Bước tiếp theo đề xuất: bắt đầu **P0 — domain thuần** (`sceneParser`,
> `characterTagger`, `runPlan`, `costEstimator`, `providerCapabilities` + test)
> trong repo FE. Phần này **không phụ thuộc** server hay provider, dựng ngay được,
> không rủi ro/không tốn tiền, và là nền cho mọi thứ sau.
