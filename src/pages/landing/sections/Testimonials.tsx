import { StarIcon } from '../components/icons';

interface Quote {
  name: string;
  role: string;
  color: string;
  text: string;
}

// Illustrative testimonials (placeholder) — swap for real quotes when available.
const QUOTES: Quote[] = [
  {
    name: 'Trần Minh Quân',
    role: 'Kiến trúc sư hệ thống · Northwind',
    color: '#22d3ee',
    text: 'Từ khi dùng Flowgram, các sơ đồ nghiệp vụ của team không còn "trôi" khỏi thiết kế gốc. Luật bắt lỗi trước cả khi review.',
  },
  {
    name: 'Lê Thu Hà',
    role: 'Product Manager · Lumen',
    color: '#818cf8',
    text: 'Mình không biết code nhưng vẫn tự dựng được sơ đồ luồng đúng chuẩn nhờ bộ khối và luật có sẵn. Cực kỳ dễ tiếp cận.',
  },
  {
    name: 'Phạm Đức Anh',
    role: 'Tech Lead · Vertex',
    color: '#a855f7',
    text: 'Xuất JSON rồi cắm thẳng vào pipeline của tụi mình. Coi như một nguồn sự thật duy nhất cho mô hình dữ liệu.',
  },
  {
    name: 'Nguyễn Bảo Ngọc',
    role: 'Trưởng nhóm phân tích · Quanta',
    color: '#3b82f6',
    text: 'Kiểm tra thời gian thực tiết kiệm cho tụi mình hàng giờ soát lỗi thủ công mỗi tuần. Vi phạm hiện ngay tại chỗ.',
  },
  {
    name: 'Vũ Hoàng Long',
    role: 'CTO · Hyperflow',
    color: '#22d3ee',
    text: 'Chuẩn hoá "loại sơ đồ" cho toàn công ty giúp người mới bắt nhịp nhanh hơn hẳn. Ai cũng nói chung một ngôn ngữ.',
  },
  {
    name: 'Đặng Khánh Vy',
    role: 'Nhà thiết kế quy trình · Orbital',
    color: '#818cf8',
    text: 'Giao diện tối, gọn, tập trung. Kéo thả mượt và luôn biết chỗ nào đang sai. Đúng thứ tụi mình cần.',
  },
];

export function Testimonials() {
  return (
    <section id="danh-gia" className="py-20">
      <div className="nl-container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="nl-eyebrow">Đánh giá</span>
          <h2 className="nl-h2 mt-3">Được các đội ngũ mô hình hoá tin dùng</h2>
          <p className="nl-muted mt-4">Những gì người dùng nói sau khi chuyển sang Flowgram.</p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {QUOTES.map((q) => (
            <figure key={q.name} className="nl-quote flex flex-col">
              <div className="mb-3 flex gap-0.5 text-[color:var(--nl-cyan)]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} width={15} height={15} />
                ))}
              </div>
              <blockquote className="flex-1 text-[15px] leading-relaxed text-[color:var(--nl-text)]">“{q.text}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="nl-avatar" style={{ background: q.color }}>
                  {q.name.split(' ').at(-1)?.[0]}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[color:var(--nl-text)]">{q.name}</span>
                  <span className="nl-faint block text-xs">{q.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
