import type { ReactNode } from 'react';
import { CheckIcon } from '../components/icons';

const BLOCK_PALETTE = [
  { label: 'Người dùng', type: 'Thực thể', color: '#22d3ee' },
  { label: 'Đơn hàng', type: 'Thực thể', color: '#818cf8' },
  { label: 'Thanh toán', type: 'Tiến trình', color: '#a855f7' },
  { label: 'Kho hàng', type: 'Thực thể', color: '#3b82f6' },
  { label: 'Vận chuyển', type: 'Tiến trình', color: '#22d3ee' },
];

const RULES = [
  { text: 'Đơn hàng phải thuộc đúng 1 Người dùng', ok: true },
  { text: 'Thanh toán yêu cầu một Đơn hàng', ok: true },
  { text: 'Vận chuyển chỉ sau khi Thanh toán xong', ok: true },
  { text: 'Không cho phép Kho nối trực tiếp Vận chuyển', ok: true },
];

function Block({
  eyebrow,
  title,
  desc,
  points,
  visual,
  reverse,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  points: string[];
  visual: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div className={reverse ? 'lg:order-2' : ''}>
        <span className="nl-eyebrow">{eyebrow}</span>
        <h3 className="nl-h2 mt-3">{title}</h3>
        <p className="nl-muted mt-4">{desc}</p>
        <ul className="mt-6 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex gap-3">
              <span className="nl-check">
                <CheckIcon width={12} height={12} />
              </span>
              <span className="text-[color:var(--nl-text)]">{p}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={reverse ? 'lg:order-1' : ''}>{visual}</div>
    </div>
  );
}

export function Highlights() {
  return (
    <section id="cach-hoat-dong" className="space-y-24 py-20">
      <div className="nl-container">
        <Block
          eyebrow="Bước 1 · Vốn từ vựng"
          title="Định nghĩa khối và quan hệ của riêng bạn"
          desc="Bắt đầu bằng việc khai báo các loại khối và loại quan hệ mà lĩnh vực của bạn cần. Đây là vốn từ vựng mà mọi sơ đồ sẽ dùng chung."
          points={['Loại khối có màu, thuộc tính riêng', 'Loại quan hệ với hướng và nhãn', 'Tái sử dụng trên toàn tổ chức']}
          visual={
            <div className="nl-window p-5">
              <p className="nl-faint mb-3 text-xs uppercase tracking-wide">Bảng khối</p>
              <div className="grid grid-cols-2 gap-2">
                {BLOCK_PALETTE.map((b) => (
                  <div key={b.label} className="nl-card flex items-center gap-3 px-3 py-2.5">
                    <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-[color:var(--nl-text)]">{b.label}</span>
                      <span className="nl-faint block text-xs">{b.type}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          }
        />
      </div>

      <div className="nl-container">
        <Block
          reverse
          eyebrow="Bước 2 · Rule-set"
          title="Ràng buộc bằng luật, kiểm tra tự động"
          desc="Gom các ràng buộc thành một bộ luật gắn với loại sơ đồ. Flowgram đối chiếu mọi thay đổi với bộ luật đó và báo lỗi ngay lập tức."
          points={['Ràng buộc số lượng, hướng, thứ tự', 'Chạy lại tức thì khi sơ đồ đổi', 'Báo cáo rõ vi phạm ở đâu']}
          visual={
            <div className="nl-window p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="nl-faint text-xs uppercase tracking-wide">Bộ luật · Đặt hàng</p>
                <span className="nl-pill nl-btn-sm !py-1 !text-xs">
                  <span className="nl-pill-dot" /> Hợp lệ
                </span>
              </div>
              <div className="space-y-2">
                {RULES.map((r) => (
                  <div key={r.text} className="nl-card flex items-center gap-3 px-3 py-2.5">
                    <span className="nl-check !mt-0">
                      <CheckIcon width={12} height={12} />
                    </span>
                    <span className="text-sm text-[color:var(--nl-text)]">{r.text}</span>
                  </div>
                ))}
              </div>
            </div>
          }
        />
      </div>
    </section>
  );
}
