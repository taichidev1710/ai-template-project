import { useEffect, type ReactNode } from 'react';
import { App as AntdApp, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import enUS from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';
import { buildAntdTheme } from './antd-theme';
import { tokensToCssVars } from './tokens';
import { useThemeStore } from './theme-store';

const antdLocales = { vi: viVN, en: enUS } as const;

/**
 * Applies the current theme to:
 *   - <html data-theme> and injected CSS variables (consumed by Tailwind)
 *   - Ant Design ConfigProvider (theme + locale)
 *
 * `AntdApp` provides context for `App.useApp()` (message/modal/notification)
 * so those APIs pick up the theme instead of using static, context-less calls.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const { i18n } = useTranslation();
  const locale = antdLocales[i18n.language as keyof typeof antdLocales] ?? enUS;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    const vars = tokensToCssVars(mode);
    for (const [name, value] of Object.entries(vars)) {
      root.style.setProperty(name, value);
    }
  }, [mode]);

  return (
    <ConfigProvider theme={buildAntdTheme(mode)} locale={locale}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
