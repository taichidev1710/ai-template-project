import { BRAND } from '../constants';

/** Brand lockup (mark + wordmark), reused in header and footer. */
export function Logo() {
  return (
    <span className="nl-brand">
      <span className="nl-brand-mark" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="2.4" />
          <circle cx="18" cy="6" r="2.4" />
          <circle cx="12" cy="18" r="2.4" />
          <path d="M7.6 7.6 12 15.6M16.4 7.6 12 15.6" />
        </svg>
      </span>
      {BRAND}
    </span>
  );
}
