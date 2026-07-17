import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vitest's `test` block. Vite 8 (rolldown) and Vitest 3 bundle different copies
 * of Vite's types, so Vitest's `UserConfig` augmentation never reaches Vite 8's
 * type — we declare `test` locally instead. Runtime behaviour is unchanged.
 */
type ViteConfigWithTest = UserConfig & {
  test: {
    globals?: boolean;
    environment?: string;
    setupFiles?: string[];
    css?: boolean;
    exclude?: string[];
  };
};

// https://vite.dev/config/
const config: ViteConfigWithTest = {
  // GitHub Pages serves this repo from /ai-template-project/, not the domain root.
  base: process.env.GITHUB_PAGES ? '/ai-template-project/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Proxy /api to your backend during development. Adjust target as needed.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // `.claude/worktrees/*` are git worktrees an agent may leave behind, each a
    // full copy of `src` pinned to an older commit. Vitest's default exclude does
    // not know about them, so a plain `npm run test` was running every suite two
    // or three times over — against stale code, which can only ever fail for
    // reasons that no longer exist.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  },
};

export default defineConfig(config);
