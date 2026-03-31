import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { renderExportHTML, openPrintWindow } from './export.ts';

// Mock window.open
const mockWindow = {
  open: vi.fn(),
  document: {
    open: vi.fn(),
    write: vi.fn(),
    close: vi.fn(),
  },
};

Object.defineProperty(global, 'window', {
  value: {
    ...global.window,
    open: mockWindow.open,
  },
  writable: true,
});

// Mock setTimeout
vi.useFakeTimers();

describe('planificacion/utils/export', () => {
  const mockParseYYYYMMDD = vi.fn();
  const mockAddDays = vi.fn();

  const mockDAYS = [
    { idx: 0, key: 'mon', name: 'Lunes' },
    { idx: 1, key: 'tue', name: 'Martes' },
    { idx: 2, key: 'wed', name: 'Miércoles' },
    { idx: 3, key: 'thu', name: 'Jueves' },
    { idx: 4, key: 'fri', name: 'Viernes' },
    { idx: 5, key: 'sat', name: 'Sábado' },
    { idx: 6, key: 'sun', name: 'Domingo' },
  ];

  const mockWeek = {
    label: 'Semana 1',
    startDate: '2024-01-15',
    days: [
      {
        tipo: 'Rodaje',
        start: '09:00',
        end: '18:00',
        cut: '17:30',
        loc: 'Estudio A',
        team: [
          { role: 'DIRECTOR', name: 'Juan', source: 'base' },
          { role: 'PRODUCTOR', name: 'María', source: 'base' },
        ],
        prelight: [{ role: 'TÉCNICO', name: 'Carlos', source: 'pre' }],
        pickup: [{ role: 'TÉCNICO', name: 'Ana', source: 'pick' }],
        prelightStart: '08:00',
        prelightEnd: '09:00',
        pickupStart: '18:00',
        pickupEnd: '19:00',
        issue: 'Sin incidencias',
      },
      // More days...
      {},
      {},
      {},
      {},
      {},
      {}, // Empty days for simplicity
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockParseYYYYMMDD.mockReturnValue(new Date('2024-01-15T00:00:00'));
    mockAddDays.mockImplementation((date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('renderExportHTML', () => {
    it('should render basic HTML structure', () => {
      const html = renderExportHTML(
        'Test Project',
        [mockWeek],
        mockDAYS,
        mockParseYYYYMMDD,
        mockAddDays
      );

      expect(html).toContain('<div class="export-doc"');
      expect(html).toContain('<h1>Test Project – Planificación</h1>');
      expect(html).toContain('<section class="wk">');
      expect(html).toContain('<table class="plan">');
    });

    it('should escape HTML characters in project name', () => {
      const html = renderExportHTML(
        'Test <script>alert("xss")</script> Project',
        [mockWeek],
        mockDAYS,
        mockParseYYYYMMDD,
        mockAddDays
      );

      expect(html).toContain(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(html).not.toContain('<script>');
    });

    it('should render week header correctly', () => {
      const html = renderExportHTML(
        'Test Project',
        [mockWeek],
        mockDAYS,
        mockParseYYYYMMDD,
        mockAddDays
      );

      expect(html).toContain('<h2>Semana 1</h2>');
      expect(html).toContain('<th>Lunes</th>');
      expect(html).toContain('<th>Martes</th>');
    });

    it('should render date row correctly', () => {
      const html = renderExportHTML(
        'Test Project',
        [mockWeek],
        mockDAYS,
        mockParseYYYYMMDD,
        mockAddDays
      );

      expect(html).toContain('<th>Fecha</th>');
      expect(html).toContain('<td>15/01/2024</td>');
    });

    it('should render day information rows', () => {
      const html = renderExportHTML(
        'Test Project',
        [mockWeek],
        mockDAYS,
        mockParseYYYYMMDD,
        mockAddDays
      );

      expect(html).toContain('<th>Jornada</th>');
      expect(html).toContain('<th>Inicio</th>');
      expect(html).toContain('<th>Fin</th>');
      expect(html).toContain('<th>Corte cámara</th>');
      expect(html).toContain('<th>Localización</th>');
      expect(html).toContain('<th>Equipo</th>');
      expect(html).toContain('<th>Prelight</th>');
      expect(html).toContain('<th>Recogida</th>');
      expect(html).toContain('<th>Incidencias</th>');
    });

    it('should render team members with correct formatting', () => {
      const html = renderExportHTML(
        'Test Project',
        [mockWeek],
        mockDAYS,
        mockParseYYYYMMDD,
        mockAddDays
      );

      expect(html).toContain('DIRECTOR Juan');
      expect(html).toContain('PRODUCTOR María');
    });

    it('should render prelight team with source suffix', () => {
      const html = renderExportHTML(
        'Test Project',
        [mockWeek],
        mockDAYS,
        mockParseYYYYMMDD,
        mockAddDays
      );

      expect(html).toContain('TÉCNICOP Carlos');
    });

    it('should render pickup team with source suffix', () => {
      const html = renderExportHTML(
        'Test Project',
        [mockWeek],
        mockDAYS,
        mockParseYYYYMMDD,
        mockAddDays
      );

      expect(html).toContain('TÉCNICOR Ana');
    });

    it('should render prelight and pickup time ranges', () => {
      const html = renderExportHTML(
        'Test Project',
        [mockWeek],
        mockDAYS,
        mockParseYYYYMMDD,
        mockAddDays
      );

      expect(html).toContain('<div>08:00–09:00</div>');
      expect(html).toContain('<div>18:00–19:00</div>');
    });

    it('should handle empty weeks array', () => {
      const html = renderExportHTML(
        'Test Project',
        [],
        mockDAYS,
        mockParseYYYYMMDD,
        mockAddDays
      );

      expect(html).toContain('<h1>Test Project – Planificación</h1>');
      expect(html).not.toContain('<section class="wk">');
    });

    it('should handle weeks with missing days', () => {
      const weekWithoutDays = {
        label: 'Semana 2',
        startDate: '2024-01-22',
        // No days property
      };

      const html = renderExportHTML(
        'Test Project',
        [weekWithoutDays],
        mockDAYS,
        mockParseYYYYMMDD,
        mockAddDays
      );

      expect(html).toContain('<h2>Semana 2</h2>');
      expect(html).toContain('<td></td>'); // Empty cells for missing days
    });

    it('should escape special characters in team member names', () => {
      const weekWithSpecialChars = {
        ...mockWeek,
        days: [
          {
            ...mockWeek.days[0],
            team: [
              {
                role: 'DIRECTOR',
                name: 'Juan <script>alert("xss")</script>',
                source: 'base',
              },
            ],
          },
          ...mockWeek.days.slice(1),
        ],
      };

      const html = renderExportHTML(
        'Test Project',
        [weekWithSpecialChars],
        mockDAYS,
        mockParseYYYYMMDD,
        mockAddDays
      );

      expect(html).toContain(
        'DIRECTOR Juan &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(html).not.toContain('<script>');
    });

    it('should handle multiple weeks', () => {
      const week2 = {
        ...mockWeek,
        label: 'Semana 2',
        startDate: '2024-01-22',
      };

      const html = renderExportHTML(
        'Test Project',
        [mockWeek, week2],
        mockDAYS,
        mockParseYYYYMMDD,
        mockAddDays
      );

      expect(html).toContain('<h2>Semana 1</h2>');
      expect(html).toContain('<h2>Semana 2</h2>');
      expect((html.match(/<section class="wk">/g) || []).length).toBe(2);
    });
  });

  describe('openPrintWindow', () => {
    it('should open new window and write HTML', () => {
      const mockWin = { ...mockWindow };
      mockWindow.open.mockReturnValue(mockWin);

      openPrintWindow('<div>Test HTML</div>', 'Test Title');

      expect(mockWindow.open).toHaveBeenCalledWith(
        '',
        '_blank',
        'noopener,noreferrer,width=1024,height=768'
      );
      expect(mockWin.document.open).toHaveBeenCalled();
      expect(mockWin.document.write).toHaveBeenCalledWith(
        expect.stringContaining('<!doctype html>')
      );
      expect(mockWin.document.write).toHaveBeenCalledWith(
        expect.stringContaining('<title>Test Title</title>')
      );
      expect(mockWin.document.write).toHaveBeenCalledWith(
        expect.stringContaining('<div>Test HTML</div>')
      );
      expect(mockWin.document.close).toHaveBeenCalled();
    });

    it('should handle window.open failure gracefully', () => {
      mockWindow.open.mockReturnValue(null);

      expect(() => {
        openPrintWindow('<div>Test HTML</div>', 'Test Title');
      }).not.toThrow();

      expect(mockWindow.open).toHaveBeenCalled();
    });

    it('should use default title when not provided', () => {
      const mockWin = { ...mockWindow };
      mockWindow.open.mockReturnValue(mockWin);

      openPrintWindow('<div>Test HTML</div>');

      expect(mockWin.document.write).toHaveBeenCalledWith(
        expect.stringContaining('<title>Documento</title>')
      );
    });

    it('should call print after timeout', () => {
      vi.useFakeTimers();

      const mockWin = {
        ...mockWindow,
        focus: vi.fn(),
        print: vi.fn(),
      };
      mockWindow.open.mockReturnValue(mockWin);

      openPrintWindow('<div>Test HTML</div>', 'Test Title');

      // Fast-forward timers
      vi.advanceTimersByTime(150);

      expect(mockWin.focus).toHaveBeenCalled();
      expect(mockWin.print).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should handle print errors gracefully', () => {
      vi.useFakeTimers();

      const mockWin = {
        ...mockWindow,
        focus: vi.fn(),
        print: vi.fn().mockImplementation(() => {
          throw new Error('Print failed');
        }),
      };
      mockWindow.open.mockReturnValue(mockWin);

      expect(() => {
        openPrintWindow('<div>Test HTML</div>', 'Test Title');
        vi.advanceTimersByTime(150);
      }).not.toThrow();

      vi.useRealTimers();
    });

    it('should escape HTML in title', () => {
      const mockWin = { ...mockWindow };
      mockWindow.open.mockReturnValue(mockWin);

      openPrintWindow(
        '<div>Test HTML</div>',
        'Test <script>alert("xss")</script> Title'
      );

      expect(mockWin.document.write).toHaveBeenCalledWith(
        expect.stringContaining(
          '<title>Test <script>alert("xss")</script> Title</title>'
        )
      );
    });
  });
});
