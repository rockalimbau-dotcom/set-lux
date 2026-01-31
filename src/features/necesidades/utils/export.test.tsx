import { describe, it, expect } from 'vitest';

import { renderExportHTML, renderExportAllHTML } from './export.ts';

// Mock date utilities
const mockParseYYYYMMDD = dateStr => new Date(dateStr + 'T00:00:00');
const mockAddDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const mockFormatDDMM = date => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

// Mock data
const mockProjectName = 'Test Project';
const mockWeekLabel = 'Semana 1';
const mockWeekStart = '2024-01-15';
const mockValuesByDay = [
  {
    loc: 'Estudio A',
    seq: 'Secuencia 1',
    needLoc: 'Calendario loc',
    needProd: 'Calendario prod',
    needLight: 'Calendario light',
    extraMat: 'Material extra',
    precall: 'Precall info',
    obs: 'Observaciones',
    crewList: [
      { role: 'DIRECTOR', name: 'Juan' },
      { role: 'PRODUCTOR', name: 'María' },
    ],
    crewTxt: 'Notas del equipo',
    preList: [{ role: 'TÉCNICO', name: 'Carlos' }],
    preTxt: 'Notas prelight',
    pickList: [{ role: 'TÉCNICO', name: 'Ana' }],
    pickTxt: 'Notas pickup',
  },
  // More days...
  {},
  {},
  {},
  {},
  {},
  {}, // Empty days for simplicity
];

const mockWeekEntries = [
  { id: '2024-01-15', label: 'Semana 1', startDate: '2024-01-15', days: mockValuesByDay },
  { id: '2024-01-22', label: 'Semana 2', startDate: '2024-01-22', days: mockValuesByDay },
];

const mockNeeds = {
  pre: [],
  pro: [],
};

describe('necesidades/utils/export', () => {
  describe('renderExportHTML', () => {
    it('should render valid HTML structure', () => {
      const html = renderExportHTML(
        mockProjectName,
        mockWeekLabel,
        mockWeekStart,
        mockValuesByDay
      );
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>'); // body has inline styles
      expect(html).toContain('</html>');
    });

    it('should include project name and week label in title', () => {
      const html = renderExportHTML(
        mockProjectName,
        mockWeekLabel,
        mockWeekStart,
        mockValuesByDay
      );
      expect(html).toContain(
        `<title>${mockProjectName} – Calendario (${mockWeekLabel})</title>`
      );
      expect(html).toContain('<h1>Calendario - Producción</h1>');
    });

    it('should render table with correct structure', () => {
      const html = renderExportHTML(
        mockProjectName,
        mockWeekLabel,
        mockWeekStart,
        mockValuesByDay
      );
      expect(html).toContain('<table>');
      expect(html).toContain('<thead>');
      expect(html).toContain('<tbody>');
      expect(html).toContain('<th>Campo / Día</th>');
    });

    it('should render day headers', () => {
      const html = renderExportHTML(
        mockProjectName,
        mockWeekLabel,
        mockWeekStart,
        mockValuesByDay
      );
      expect(html).toContain('Lunes');
      expect(html).toContain('Martes');
      expect(html).toContain('Miércoles');
      expect(html).toContain('Jueves');
      expect(html).toContain('Viernes');
      expect(html).toContain('Sábado');
      expect(html).toContain('Domingo');
    });

    it('should render standard rows', () => {
      const html = renderExportHTML(
        mockProjectName,
        mockWeekLabel,
        mockWeekStart,
        mockValuesByDay
      );
      expect(html).toContain(
        '<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">Localización y secuencias</td>'
      );
      expect(html).toContain(
        '<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">Transporte</td>'
      );
    });

    it('should render team lists', () => {
      const html = renderExportHTML(
        mockProjectName,
        mockWeekLabel,
        mockWeekStart,
        mockValuesByDay
      );
      expect(html).toContain(
        '<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">Equipo base</td>'
      );
      expect(html).toContain(
        '<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">Equipo extra</td>'
      );
      expect(html).toContain(
        '<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">Prelight</td>'
      );
      expect(html).toContain(
        '<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">Recogida</td>'
      );
    });

    it('should escape HTML characters in content', () => {
      const valuesWithHtml = [
        {
          loc: 'Estudio <script>alert("xss")</script>',
          seq: 'Secuencia & "especial"',
        },
      ];
      const html = renderExportHTML(
        mockProjectName,
        mockWeekLabel,
        mockWeekStart,
        valuesWithHtml
      );
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&amp;');
      expect(html).not.toContain('<script>');
    });

    it('should handle empty values gracefully', () => {
      const emptyValues = [{}];
      const html = renderExportHTML(
        mockProjectName,
        mockWeekLabel,
        mockWeekStart,
        emptyValues
      );
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<body>'); // body has inline styles
    });
  });

  describe('renderExportAllHTML', () => {
    it('should render valid HTML structure', () => {
      const html = renderExportAllHTML(
        mockProjectName,
        mockWeekEntries,
        mockNeeds
      );
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>'); // body has inline styles
      expect(html).toContain('</html>');
    });

    it('should include project name in title', () => {
      const html = renderExportAllHTML(
        mockProjectName,
        mockWeekEntries,
        mockNeeds
      );
      expect(html).toContain('Test Project');
      expect(html).toContain('Calendario');
    });

    it('should render multiple weeks', () => {
      const html = renderExportAllHTML(
        mockProjectName,
        mockWeekEntries,
        mockNeeds
      );
      expect(html).toContain('Semana 1');
      expect(html).toContain('Semana 2');
    });

    it('should handle empty week entries', () => {
      const html = renderExportAllHTML(mockProjectName, [], {});
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<body style='); // body has inline styles
    });

    it('should include footer', () => {
      const html = renderExportAllHTML(
        mockProjectName,
        mockWeekEntries,
        mockNeeds
      );
      expect(html).toContain('<div class="footer">');
    });

    it('should escape HTML characters in project name', () => {
      const html = renderExportAllHTML(
        'Test <script>alert("xss")</script> Project',
        mockWeekEntries,
        mockNeeds
      );
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>');
    });
  });
});
