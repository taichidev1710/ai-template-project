import { Link } from 'react-router-dom';
import { paths } from '@/app/router/paths';
import { CheckIcon } from '../components/icons';

interface Plan {
  name: string;
  price: string;
  period?: string;
  blurb: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Miễn phí',
    price: '0đ',
    blurb: 'Cho cá nhân bắt đầu mô hình hoá.',
    features: ['3 sơ đồ', '1 loại sơ đồ', 'Luật cơ bản', 'Xuất hình ảnh'],
    cta: 'Dùng miễn phí',
  },
  {
    name: 'Pro',
    price: '199k',
    period: '/tháng',
    blurb: 'Cho nhóm cần chuẩn hoá và kiểm soát.',
    features: [
      'Sơ đồ không giới hạn',
      'Loại sơ đồ & rule-set tuỳ biến',
      'Kiểm tra thời gian thực',
      'Xuất JSON & hình ảnh',
      'Cộng tác theo vai trò',
    ],
    cta: 'Bắt đầu dùng Pro',
    featured: true,
  },
  {
    name: 'Doanh nghiệp',
    price: 'Liên hệ',
    blurb: 'Cho tổ chức cần bảo mật và tích hợp sâu.',
    features: ['Đăng nhập SSO', 'Phân quyền nâng cao', 'Truy cập API', 'Hỗ trợ riêng & SLA'],
    cta: 'Liên hệ tư vấn',
  },
];

export function Pricing() {
  return (
    <section id="bang-gia" className="py-20">
      <div className="nl-container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="nl-eyebrow">Bảng giá</span>
          <h2 className="nl-h2 mt-3">Chọn gói phù hợp với đội của bạn</h2>
          <p className="nl-muted mt-4">Bắt đầu miễn phí, nâng cấp khi cần thêm sức mạnh. Không ràng buộc dài hạn.</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`nl-card relative flex flex-col p-7 ${p.featured ? 'ring-1 ring-[color:var(--nl-accent)]' : ''}`}
              style={p.featured ? { boxShadow: '0 20px 60px -20px rgba(129,140,248,0.5)' } : undefined}
            >
              {p.featured && (
                <span className="nl-pill absolute -top-3 left-1/2 -translate-x-1/2 !py-1 text-xs">
                  <span className="nl-pill-dot" /> Phổ biến nhất
                </span>
              )}
              <h3 className="text-lg font-semibold text-[color:var(--nl-text)]">{p.name}</h3>
              <p className="nl-faint mt-1 text-sm">{p.blurb}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-[color:var(--nl-text)]">{p.price}</span>
                {p.period && <span className="nl-faint mb-1 text-sm">{p.period}</span>}
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-3 text-sm">
                    <span className="nl-check !mt-0">
                      <CheckIcon width={12} height={12} />
                    </span>
                    <span className="text-[color:var(--nl-text)]">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={paths.login}
                className={`nl-btn mt-7 w-full ${p.featured ? 'nl-btn-primary' : 'nl-btn-ghost'}`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
