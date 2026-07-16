import { theme as antdTheme, type ThemeConfig } from 'antd';
import { baseTokens, colorTokens, type ThemeMode } from './tokens';

/**
 * Build an Ant Design ThemeConfig from our design tokens.
 *
 * `cssVar: {}` makes AntD emit CSS variables (enabled with defaults), which keeps
 * runtime theme switching cheap. We drive light/dark with AntD's algorithm
 * AND our token overrides so both stay derived from `tokens.ts`.
 */
export function buildAntdTheme(mode: ThemeMode): ThemeConfig {
  const colors = colorTokens[mode];

  return {
    cssVar: {},
    hashed: true,
    algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: colors.colorPrimary,
      colorSuccess: colors.colorSuccess,
      colorWarning: colors.colorWarning,
      colorError: colors.colorError,
      colorInfo: colors.colorInfo,

      colorBgLayout: colors.colorBgLayout,
      colorBgContainer: colors.colorBgContainer,

      borderRadius: baseTokens.radius,
      fontFamily: baseTokens.fontFamily,
    },
    components: {
      Layout: {
        headerBg: colors.colorBgContainer,
        siderBg: colors.colorBgContainer,
        bodyBg: colors.colorBgLayout,
      },
    },
  };
}
