import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom ships no matchMedia, yet AntD's responsive components and the canvas's
// prefers-reduced-motion check both call it while rendering. Answer "no match"
// so a component under test takes its plain, non-responsive path.
if (!window.matchMedia) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

// AntD's Select/Tooltip measure their trigger through rc-resize-observer, which
// jsdom has no implementation for. Nothing under test asserts on layout, so a
// no-op observer is enough to let those components mount.
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

afterEach(() => {
  cleanup();
});
