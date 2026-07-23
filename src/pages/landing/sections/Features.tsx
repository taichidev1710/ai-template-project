import type { ReactNode } from 'react';
import { SpotlightGrid, SpotlightCard } from '../components/Spotlight';
import { BlocksIcon, ShieldCheckIcon, ZapIcon, LayersIcon, UsersIcon, CodeIcon } from '../components/icons';

interface Feature {
  icon: ReactNode;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  {
    icon: <BlocksIcon width={22} height={22} />,
    title: 'Khối & quan hệ có kiểu',
    desc: 'Định nghĩa từng loại khối và loại quan hệ một lần. Kéo thả để dựng sơ đồ luôn đúng cấu trúc bạn mong muốn.',
  },
  {
    icon: <ShieldCheckIcon width={22} height={22} />,
    title: 'Rule-set giữ đúng mô hình',
    desc: 'Gom ràng buộc thành bộ luật tái sử dụng. Mỗi sơ đồ được đối chiếu với luật để không bao giờ lệch khỏi thiết kế.',
  },
  {
    icon: <ZapIcon width={22} height={22} />,
    title: 'Kiểm tra thời gian thực',
    desc: 'Vi phạm được tô sáng ngay khi bạn nối sai — không phải chờ tới lúc bàn giao mới phát hiện lỗi.',
  },
  {
    icon: <LayersIcon width={22} height={22} />,
    title: 'Loại sơ đồ dùng lại',
    desc: 'Chuẩn hoá "loại sơ đồ" cho cả tổ chức: ai cũng bắt đầu từ cùng bộ khối, quan hệ và luật.',
  },
  {
    icon: <UsersIcon width={22} height={22} />,
    title: 'Cộng tác theo vai trò',
    desc: 'Phân quyền admin / editor / viewer. Cả nhóm cùng chỉnh một sơ đồ mà không giẫm chân nhau.',
  },
  {
    icon: <CodeIcon width={22} height={22} />,
    title: 'Xuất & tích hợp API',
    desc: 'Xuất sơ đồ ra JSON hoặc hình ảnh, hoặc lấy dữ liệu qua API để cắm thẳng vào quy trình của bạn.',
  },
];

export function Features() {
  return (
    <section id="tinh-nang" className="py-20">
      <div className="nl-container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="nl-eyebrow">Tính năng</span>
          <h2 className="nl-h2 mt-3">Mọi thứ để mô hình hoá đúng ngay từ đầu</h2>
          <p className="nl-muted mt-4">
            Không chỉ là công cụ vẽ. Flowgram hiểu cấu trúc sơ đồ của bạn và chủ động
            giữ nó hợp lệ.
          </p>
        </div>

        <SpotlightGrid className="mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <SpotlightCard key={f.title}>
              <div className="nl-feature-icon">{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-[color:var(--nl-text)]">{f.title}</h3>
              <p className="nl-muted mt-2 text-sm leading-relaxed">{f.desc}</p>
            </SpotlightCard>
          ))}
        </SpotlightGrid>
      </div>
    </section>
  );
}
