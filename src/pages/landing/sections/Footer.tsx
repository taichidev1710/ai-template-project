import { Link } from 'react-router-dom';
import { paths } from '@/app/router/paths';
import { Logo } from '../components/Logo';
import { GithubIcon, XIcon, LinkedinIcon } from '../components/icons';
import { BRAND, CONTACT_EMAIL } from '../constants';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Sản phẩm',
    links: [
      { label: 'Tính năng', href: '#tinh-nang' },
      { label: 'Cách hoạt động', href: '#cach-hoat-dong' },
      { label: 'Bảng giá', href: '#bang-gia' },
      { label: 'Đánh giá', href: '#danh-gia' },
    ],
  },
  {
    title: 'Tài nguyên',
    links: [
      { label: 'Tài liệu', href: '#' },
      { label: 'Hướng dẫn', href: '#' },
      { label: 'Cập nhật', href: '#' },
      { label: 'Trạng thái', href: '#' },
    ],
  },
  {
    title: 'Công ty',
    links: [
      { label: 'Giới thiệu', href: '#' },
      { label: 'Tuyển dụng', href: '#' },
      { label: 'Liên hệ', href: `mailto:${CONTACT_EMAIL}` },
      { label: 'Điều khoản', href: '#' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="nl-footer py-14">
      <div className="nl-container">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link to={paths.root} aria-label="Trang chủ">
              <Logo />
            </Link>
            <p className="nl-muted mt-4 max-w-xs text-sm">
              Nền tảng thiết kế sơ đồ có luật — giữ mọi mô hình luôn đúng cấu trúc.
            </p>
            <div className="mt-5 flex gap-2">
              <a href="#" className="nl-social" aria-label="GitHub">
                <GithubIcon width={18} height={18} />
              </a>
              <a href="#" className="nl-social" aria-label="X">
                <XIcon width={16} height={16} />
              </a>
              <a href="#" className="nl-social" aria-label="LinkedIn">
                <LinkedinIcon width={18} height={18} />
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-[color:var(--nl-text)]">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="nl-footlink">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="nl-faint mt-12 flex flex-col items-center justify-between gap-3 border-t border-[color:var(--nl-border)] pt-6 text-sm sm:flex-row">
          <span>
            © {new Date().getFullYear()} {BRAND}. Bảo lưu mọi quyền.
          </span>
          <span>Thiết kế theo phong cách Neon.</span>
        </div>
      </div>
    </footer>
  );
}
