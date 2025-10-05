import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// global seed for plan data used by the mock
// @ts-ignore
globalThis.__TEST_PLAN__ = null;

vi.mock('@shared/hooks/useLocalStorage', () => {
  return {
    useLocalStorage: (key, initial) => {
      if (String(key || '').startsWith('plan_')) {
        if (globalThis.__TEST_PLAN__)
          return [globalThis.__TEST_PLAN__, vi.fn()];
      }
      try {
        const raw = window.localStorage.getItem(key);
        if (raw != null) return [JSON.parse(raw), vi.fn()];
      } catch {
        /* ignore */
      }
      return [initial, vi.fn()];
    },
  };
});

// Mock the child page to make the test deterministic regardless of its internals
vi.mock('./ReportesSemana.tsx', () => ({
  __esModule: true,
  default: props => (
    <div>
      <h4>{props.title}</h4>
      <table role='table'></table>
    </div>
  ),
}));

import ReportesTab from './ReportesTab.jsx';

const planKeyFor = project =>
  `plan_${project?.id || project?.nombre || 'demo'}`;

describe('ReportesTab (smoke)', () => {
  afterEach(() => {
    try {
      localStorage.clear();
    } catch (e) {
      /* ignore */
    }
    // @ts-ignore
    globalThis.__TEST_PLAN__ = null;
  });

  it('renders empty hint when no weeks in Planificación', () => {
    const project = { id: 'p1', nombre: 'Proyecto 1' };
    render(<ReportesTab project={project} />);
    expect(
      screen.getByText(/No hay semanas en Planificación/i)
    ).toBeInTheDocument();
  });

  it('renders week content when Planificación has data and people', () => {
    const project = { id: 'p2', nombre: 'Proyecto 2' };
    const week = {
      id: 'w1',
      label: 'Semana 1',
      startDate: '2025-01-06',
      days: [
        {
          start: '08:00',
          end: '17:00',
          team: [{ role: 'EL', name: 'Juan' }],
          prelight: [],
          pickup: [],
        },
        {
          start: '08:00',
          end: '17:00',
          team: [{ role: 'EL', name: 'Juan' }],
          prelight: [],
          pickup: [],
        },
        {
          start: '08:00',
          end: '17:00',
          team: [{ role: 'EL', name: 'Juan' }],
          prelight: [],
          pickup: [],
        },
        {
          start: '08:00',
          end: '17:00',
          team: [{ role: 'EL', name: 'Juan' }],
          prelight: [],
          pickup: [],
        },
        {
          start: '08:00',
          end: '17:00',
          team: [{ role: 'EL', name: 'Juan' }],
          prelight: [],
          pickup: [],
        },
        {
          start: '08:00',
          end: '17:00',
          team: [{ role: 'EL', name: 'Juan' }],
          prelight: [],
          pickup: [],
        },
        {
          start: '08:00',
          end: '17:00',
          team: [{ role: 'EL', name: 'Juan' }],
          prelight: [],
          pickup: [],
        },
      ],
    };
    // @ts-ignore
    globalThis.__TEST_PLAN__ = { pre: [week], pro: [] };

    render(<ReportesTab project={project} />);

    expect(screen.getByText('Semana 1')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
