import '@testing-library/jest-dom';
import { vi } from 'vitest';
import es from '../locales/es.json';

// Helper function para obtener traducciones anidadas
const getTranslation = (key: string, options?: any): string => {
  const keys = key.split('.');
  let value: any = es;
  for (const k of keys) {
    value = value?.[k];
  }
  // Si no se encuentra, devolver la clave
  if (typeof value !== 'string') {
    return key;
  }
  // Reemplazar interpolaciones
  if (options) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, k) => {
      return options[k] || match;
    });
  }
  return value || key;
};

// Mock i18n para tests
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: getTranslation,
    i18n: {
      language: 'es',
      changeLanguage: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock i18n directo
vi.mock('../i18n/config', () => ({
  default: {
    t: getTranslation,
    language: 'es',
    changeLanguage: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
  changeLanguage: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress console warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
