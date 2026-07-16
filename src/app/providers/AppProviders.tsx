import type { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from '@/shared/theme';

/**
 * Composition root for all context providers.
 * Order matters: QueryProvider (data) → ThemeProvider (AntD + theme) → app.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryProvider>
  );
}
