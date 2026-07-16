/**
 * Central, typed access to environment config.
 * Only `VITE_*` variables are exposed to the client by Vite.
 * Never read `import.meta.env` directly elsewhere — import from here.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  appName: import.meta.env.VITE_APP_NAME ?? 'Admin Dashboard',
  enableDevtools: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
