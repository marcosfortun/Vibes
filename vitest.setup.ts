import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// (server-only se neutraliza vía alias en vitest.config.ts.)

// Limpia el DOM entre tests.
afterEach(() => {
  cleanup();
});

// next-intl: en los tests de componentes traducimos con una función identidad
// que devuelve la última parte de la clave (p. ej. 'Card.moreInfo' → 'moreInfo').
// Así los tests no dependen de los textos concretos de cada locale.
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string, values?: Record<string, unknown>) => {
      const base = key.split('.').pop() ?? key;
      if (!values) return base;
      return `${base} ${JSON.stringify(values)}`;
    };
    return t;
  },
}));
