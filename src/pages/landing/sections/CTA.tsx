import { Link } from 'react-router-dom';
import { paths } from '@/app/router/paths';
import { ArrowRightIcon } from '../components/icons';
import { BRAND } from '../constants';

export function CTA() {
  return (
    <section className="py-16">
      <div className="nl-container">
        <div className="nl-cta px-6 py-16 text-center sm:px-16">
          <h2 className="nl-h2 mx-auto max-w-2xl">Sẵn sàng dựng sơ đồ không còn lỗi mô hình?</h2>
          <p className="nl-muted mx-auto mt-4 max-w-xl">
            Tạo tài khoản {BRAND} miễn phí và dựng sơ đồ hợp lệ đầu tiên trong vài phút.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to={paths.login} className="nl-btn nl-btn-primary">
              Bắt đầu miễn phí
              <ArrowRightIcon width={18} height={18} />
            </Link>
            <a href="#bang-gia" className="nl-btn nl-btn-ghost">
              Xem bảng giá
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
