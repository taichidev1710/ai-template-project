/**
 * DESIGN TOKENS — single source of truth.
 *
 * These values feed BOTH:
 *   1. Ant Design  → via `buildAntdTheme()` (see antd-theme.ts)
 *   2. Tailwind CSS → via CSS variables injected at runtime (see ThemeProvider),
 *      which `src/styles/index.css` references inside its `@theme` block.
 *
 * RULE: never hardcode a hex/spacing value anywhere else in the app.
 * Add a token here, expose it, then use `token.*` (AntD) or a utility class
 * (Tailwind) that maps to it. This keeps light/dark and future themes in sync.
 */

export type ThemeMode = 'light' | 'dark';

/** Values that do NOT change between light and dark. */
export const baseTokens = {
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontFamilyCode: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",

  // Border radius scale
  radiusSm: 4,
  radius: 8,
  radiusLg: 12,

  // Spacing scale (px) — 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64.
  // Tailwind's default spacing already matches this (0.25rem base), so
  // `p-4` = 16px, `gap-6` = 24px, etc. Documented in 05-ui-design-system.md.
} as const;

/** Semantic colors that DO change with the mode. */
export const colorTokens: Record<ThemeMode, Record<string, string>> = {
  light: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',

    colorText: 'rgba(0, 0, 0, 0.88)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.45)',

    colorBgBase: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorBgContainer: '#ffffff',
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',
  },
  dark: {
    colorPrimary: '#1668dc',
    colorSuccess: '#49aa19',
    colorWarning: '#d89614',
    colorError: '#dc4446',
    colorInfo: '#1668dc',

    colorText: 'rgba(255, 255, 255, 0.88)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.45)',

    colorBgBase: '#141414',
    colorBgLayout: '#000000',
    colorBgContainer: '#1f1f1f',
    colorBorder: '#424242',
    colorBorderSecondary: '#303030',
  },
};

/**
 * Convert tokens for a given mode into CSS custom properties.
 * Keys become `--app-<kebab-case>` so Tailwind can reference them.
 */
export function tokensToCssVars(mode: ThemeMode): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [key, value] of Object.entries(colorTokens[mode])) {
    vars[`--app-${camelToKebab(key)}`] = value;
  }
  vars['--app-radius'] = `${baseTokens.radius}px`;
  vars['--app-radius-sm'] = `${baseTokens.radiusSm}px`;
  vars['--app-radius-lg'] = `${baseTokens.radiusLg}px`;
  vars['--app-font-family'] = baseTokens.fontFamily;

  return vars;
}

function camelToKebab(input: string): string {
  return input.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
