/**
 * Tiny className joiner. For advanced Tailwind conflict resolution you can
 * swap this for `clsx` + `tailwind-merge` (add the deps, keep the signature).
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(value: string | number | Date, locale = 'vi-VN'): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
}
