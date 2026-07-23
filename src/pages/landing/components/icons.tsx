/**
 * Minimal inline stroke icons for the landing page.
 * Kept self-contained (instead of AntD icons) so the neon marketing surface
 * fully controls sizing/stroke without inheriting the admin icon theme.
 */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  };
}

export const BlocksIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const LinkIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 12a3 3 0 0 1 3-3h3a3 3 0 1 1 0 6h-1.5" />
    <path d="M15 12a3 3 0 0 1-3 3H9a3 3 0 1 1 0-6h1.5" />
  </svg>
);

export const ShieldCheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3 4.5 6v5.5c0 4.5 3.2 7.5 7.5 9 4.3-1.5 7.5-4.5 7.5-9V6L12 3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const ZapIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </svg>
);

export const UsersIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M16 19a4 4 0 0 0-8 0" />
    <circle cx="12" cy="9" r="3" />
    <path d="M20 18a3.5 3.5 0 0 0-4-3.2" />
    <path d="M4 18a3.5 3.5 0 0 1 4-3.2" />
  </svg>
);

export const CodeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m8 8-4 4 4 4" />
    <path d="m16 8 4 4-4 4" />
    <path d="m13 5-2 14" />
  </svg>
);

export const LayersIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 12 9 5 9-5" />
    <path d="m3 16 9 5 9-5" />
  </svg>
);

export const SparklesIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4Z" />
    <path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7L19 15Z" />
  </svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base({ strokeWidth: 2.4, ...p })}>
    <path d="m5 12 4 4 10-10" />
  </svg>
);

export const StarIcon = (p: IconProps) => (
  <svg {...base({ fill: 'currentColor', stroke: 'none', ...p })}>
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
  </svg>
);

export const MenuIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </svg>
);

export const GithubIcon = (p: IconProps) => (
  <svg {...base({ strokeWidth: 0, fill: 'currentColor', ...p })}>
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.26-.45-1.28.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
  </svg>
);

export const XIcon = (p: IconProps) => (
  <svg {...base({ strokeWidth: 0, fill: 'currentColor', ...p })}>
    <path d="M17.5 3h3l-6.6 7.5L21.7 21h-5.9l-4.2-5.5L6.7 21H3.6l7-8L2.7 3h6l3.8 5 4.9-5Zm-1 16h1.7L7.6 4.8H5.8L16.5 19Z" />
  </svg>
);

export const LinkedinIcon = (p: IconProps) => (
  <svg {...base({ strokeWidth: 0, fill: 'currentColor', ...p })}>
    <path d="M6.9 5A1.9 1.9 0 1 1 3 5a1.9 1.9 0 0 1 3.9 0ZM3.3 8.5h3.4V21H3.3V8.5Zm5.6 0h3.3v1.7h.05c.46-.83 1.6-1.7 3.3-1.7 3.5 0 4.15 2.2 4.15 5.05V21h-3.4v-5.5c0-1.3 0-3-1.85-3s-2.1 1.43-2.1 2.9V21H8.9V8.5Z" />
  </svg>
);
