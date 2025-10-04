import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Allow tests to pre-seed values via globals
// @ts-ignore
window.__TEST_STORE__ = window.__TEST_STORE__ || {};

// Mock useLocalStorage to persist to real localStorage (scoped per key) with optional preseed
vi.mock('@shared/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn((key, initialValue) => {
    let initial;
    try {
      // Prefer explicit preseed when provided
      // @ts-ignore
      const pre = window.__TEST_STORE__ && window.__TEST_STORE__[key];
      if (pre !== undefined) {
        initial = pre;
      } else {
        const stored = window.localStorage.getItem(key);
        initial = stored ? JSON.parse(stored) : (initialValue instanceof Function ? initialValue() : initialValue);
      }
    } catch {
      initial = initialValue instanceof Function ? initialValue() : initialValue;
    }
    const [value, setValue] = React.useState(initial);
    React.useEffect(() => {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }, [key, value]);
    return [value, setValue];
  }),
}));

// Mock shared Th
vi.mock('@shared/components', () => ({
  Th: vi.fn(({ children }) => <th>{children}</th>),
}));

// Mock FieldRow and ListRow to avoid complex internals
vi.mock('../components/FieldRow', () => ({
  __esModule: true,
  default: ({ label }) => <tr><td>{label}</td></tr>,
}));

vi.mock('../components/ListRow', () => ({
  __esModule: true,
  default: ({ label }) => <tr><td>{label}</td></tr>,
}));

// Mock export utils to intercept HTML generation and window.open
vi.mock('../utils/export', () => ({
  renderExportHTML: vi.fn(() => '<html></html>'),
  renderExportAllHTML: vi.fn(() => '<html></html>'),
}));

import NecesidadesTab from './NecesidadesTab.tsx';

describe('NecesidadesTab (smoke)', () => {
  const project = { id: 'p1', nombre: 'Proyecto Test' };

  it('muestra mensaje cuando no hay semanas', () => {
    render(<NecesidadesTab project={project} />);
    expect(
      screen.getByText(/No hay semanas en Planificación/i)
    ).toBeInTheDocument();
  });

  it('renderiza una semana abierta y permite Exportar TODO y Exportar semana', async () => {
    // Preseed store for deterministic initial state
    // @ts-ignore
    window.__TEST_STORE__['needs_p1'] = {
      w1: { label: 'Semana 1', startDate: '2024-01-01', open: true, days: {} },
    };
    // @ts-ignore
    window.__TEST_STORE__['plan_p1'] = { pre: [{ id: 'w1', label: 'Semana 1', startDate: '2024-01-01', days: [] }], pro: [] };

    render(<NecesidadesTab project={project} />);

    const exportAllBtn = await screen.findByRole('button', { name: /PDF Entero/i });
    expect(exportAllBtn).toBeInTheDocument();
    fireEvent.click(exportAllBtn);
    // PDF generation is now handled by jsPDF directly, no window.open needed

    const exportWeekBtn = await screen.findByTitle('Exportar semana PDF');
    fireEvent.click(exportWeekBtn);
    // PDF generation is now handled by jsPDF directly, no window.open needed
  });
});


