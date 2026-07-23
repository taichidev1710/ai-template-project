import { Link } from 'react-router-dom';
import { paths } from '@/app/router/paths';
import { DiagramMock } from '../components/DiagramMock';
import { ArrowRightIcon, CheckIcon } from '../components/icons';
import { BRAND } from '../constants';

const TRUST = ['Không cần thẻ tín dụng', 'Miễn phí cho 3 sơ đồ', 'Xuất JSON & hình ảnh'];

export function Hero() {
  return (
    <section className="relative pt-10 pb-20 sm:pt-16">
      <div className="nl-grid-bg" aria-hidden />
      <div className="nl-hero-glow" aria-hidden />

      <div className="nl-container relative text-center">
        <a href="#tinh-nang" className="nl-pill">
          <span className="nl-pill-dot" />
          Mới · Kiểm tra ràng buộc theo thời gian thực
        </a>

        <h1 className="nl-h1 mx-auto mt-6 max-w-4xl">
          Dựng sơ đồ phức tạp
          <br className="hidden sm:block" /> mà <span className="nl-grad-accent">luật tự giữ đúng</span>
        </h1>

        <p className="nl-muted mx-auto mt-6 max-w-2xl text-lg">
          {BRAND} là nền tảng thiết kế sơ đồ từ các khối và quan hệ có kiểu. Bạn định
          nghĩa luật một lần, mọi sơ đồ tự động được kiểm tra — không còn mô hình sai
          lọt lưới.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to={paths.login} className="nl-btn nl-btn-primary">
            Bắt đầu miễn phí
            <ArrowRightIcon width={18} height={18} />
          </Link>
          <a href="#cach-hoat-dong" className="nl-btn nl-btn-ghost">
            Xem cách hoạt động
          </a>
        </div>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {TRUST.map((t) => (
            <li key={t} className="nl-faint flex items-center gap-2 text-sm">
              <CheckIcon width={15} height={15} className="text-[color:var(--nl-cyan)]" />
              {t}
            </li>
          ))}
        </ul>

        {/* app window with the diagram canvas mock */}
        <div className="relative mx-auto mt-14 max-w-4xl">
          <div className="nl-window">
            <div className="nl-window-bar">
              <span className="nl-dot" />
              <span className="nl-dot" />
              <span className="nl-dot" />
              <span className="nl-faint ml-2 text-xs">flowgram.io/so-do/dat-hang</span>
            </div>
            <div className="p-4 sm:p-6">
              <DiagramMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
