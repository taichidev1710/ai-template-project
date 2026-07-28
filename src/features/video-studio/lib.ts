/** Small presentation helpers for the feature (formatting only — no business logic). */

/** Format a USD estimate for display. Tiny amounts keep 3 decimals (e.g. $0.039). */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount !== 0 && Math.abs(amount) < 1 ? 3 : 2,
  }).format(amount);
}
