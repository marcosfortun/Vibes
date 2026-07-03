import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Tests unitarios y de componentes (Vitest + Testing Library). No arrancan
// navegador ni Supabase: la lógica de red se mockea. Los E2E reales se conducen
// a mano con el dev server (ver AGENTS.md §4.2).
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolución nativa de los paths de tsconfig (@/... → src/...).
    tsconfigPaths: true,
    alias: {
      // `server-only` lanza fuera de un RSC; en tests lo apuntamos a un stub.
      'server-only': fileURLToPath(new URL('./test/server-only-stub.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // jsdom + userEvent pueden ser lentos bajo carga (suites en paralelo); un
    // margen holgado evita falsos negativos por timeout en los tests de UI.
    testTimeout: 15000,
  },
});
