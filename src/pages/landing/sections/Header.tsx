import { useState } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/router/paths';
import { NAV_LINKS } from '../constants';
import { Logo } from '../components/Logo';
import { ArrowRightIcon, MenuIcon } from '../components/icons';

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nl-header">
      <div className="nl-container">
        <div className="nl-header-inner">
          <Link to={paths.root} aria-label="Trang chủ">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="nl-navlink">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to={paths.login} className="nl-btn nl-btn-ghost nl-btn-sm nl-signin">
              Đăng nhập
            </Link>
            <Link to={paths.login} className="nl-btn nl-btn-primary nl-btn-sm">
              Dùng thử
              <ArrowRightIcon width={16} height={16} />
            </Link>
            <button
              type="button"
              className="nl-social nl-burger"
              aria-label="Mở menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <MenuIcon width={18} height={18} />
            </button>
          </div>
        </div>

        {open && (
          <nav className="nl-card mt-2 flex flex-col gap-1 p-2 md:hidden">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="nl-navlink rounded-lg px-3 py-2"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
