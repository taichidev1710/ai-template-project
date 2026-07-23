import { useRef, type ReactNode } from 'react';

/**
 * Cursor-follow "spotlight" grid — the signature Cruip/Neon effect.
 * On mouse move it writes --mouse-x/--mouse-y (relative to each card) so the
 * card's ::before border-glow tracks the pointer. Pure CSS does the reveal.
 */
export function SpotlightGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const cards = ref.current?.querySelectorAll<HTMLElement>('[data-spot-card]');
    if (!cards) return;
    for (const card of cards) {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - r.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
    }
  };

  return (
    <div ref={ref} onMouseMove={handleMove} className={`nl-spotlight ${className}`}>
      {children}
    </div>
  );
}

/** A single spotlight card: 1px animated border wrapper + inner surface. */
export function SpotlightCard({ children }: { children: ReactNode }) {
  return (
    <div data-spot-card className="nl-spot-card">
      <div className="nl-spot-inner">{children}</div>
    </div>
  );
}
