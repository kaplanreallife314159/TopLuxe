import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['../../tests/setup.ts'],
    include: [
      '../../tests/unit/**/*.test.ts',
      '../../tests/unit/**/*.test.tsx',
      '../../tests/integration/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@/app': path.resolve(__dirname, './app'),
      '@/modules': path.resolve(__dirname, './modules'),
      '@/shared': path.resolve(__dirname, './shared'),
      '@/components': path.resolve(__dirname, './components'),
    },
  },
});
