import { describe, it, expect } from 'vitest';
import { renderExportHTML, renderExportAllHTML } from './export.ts';

// Mock date utilities
const mockParseYYYYMMDD = (dateStr) => new Date(dateStr + 'T00:00:00');
const mockAddDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const mockFormatDDMM = (date) => {
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
    needLoc: 'Necesidades loc',
    needProd: 'Necesidades prod',
    needLight: 'Necesidades light',
    extraMat: 'Material extra',
    precall: 'Precall info',
    obs: 'Observaciones',
    crewList: [
      { role: 'DIRECTOR', name: 'Juan' },
      { role: 'PRODUCTOR', name: 'María' },
    ],
    crewTxt: 'Notas del equipo',
    preList: [
      { role: 'TÉCNICO', name: 'Carlos' },
    ],
    preTxt: 'Notas prelight',
    pickList: [
      { role: 'TÉCNICO', name: 'Ana' },
    ],
    pickTxt: 'Notas pickup',
  },
  // More days...
  {}, {}, {}, {}, {}, {}, // Empty days for simplicity
];

const mockWeekEntries = [
  ['2024-01-15', { label: 'Semana 1', start: '2024-01-15' }],
  ['2024-01-22', { label: 'Semana 2', start: '2024-01-22' }],
];

const mockNeeds = {
  '2024-01-15': mockValuesByDay[0],
  '2024-01-22': mockValuesByDay[0],
};

describe('necesidades/utils/export', () => {
  describe('renderExportHTML', () => {
    it('should render valid HTML structure', () => {
      const html = renderExportHTML(mockProjectName, mockWeekLabel, mockWeekStart, mockValuesByDay);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>'); // body has inline styles
      expect(html).toContain('</html>');
    });

    it('should include project name and week label in title', () => {
      const html = renderExportHTML(mockProjectName, mockWeekLabel, mockWeekStart, mockValuesByDay);
      expect(html).toContain(`<title>${mockProjectName} – Necesidades de Rodaje (${mockWeekLabel})</title>`);
      expect(html).toContain('<h1>Necesidades - Producción</h1>');
    });

    it('should render table with correct structure', () => {
      const html = renderExportHTML(mockProjectName, mockWeekLabel, mockWeekStart, mockValuesByDay);
      expect(html).toContain('<table>');
      expect(html).toContain('<thead>');
      expect(html).toContain('<tbody>');
      expect(html).toContain('<th>Campo / Día</th>');
    });

    it('should render day headers', () => {
      const html = renderExportHTML(mockProjectName, mockWeekLabel, mockWeekStart, mockValuesByDay);
      expect(html).toContain('Lunes');
      expect(html).toContain('Martes');
      expect(html).toContain('Miércoles');
      expect(html).toContain('Jueves');
      expect(html).toContain('Viernes');
      expect(html).toContain('Sábado');
      expect(html).toContain('Domingo');
    });

    it('should render standard rows', () => {
      const html = renderExportHTML(mockProjectName, mockWeekLabel, mockWeekStart, mockValuesByDay);
      expect(html).toContain('<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">Localización</td>');
      expect(html).toContain('<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">Secuencias</td>');
      expect(html).toContain('<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">Necesidades localizaciones</td>');
    });

    it('should render team lists', () => {
      const html = renderExportHTML(mockProjectName, mockWeekLabel, mockWeekStart, mockValuesByDay);
      expect(html).toContain('<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">Equipo técnico</td>');
      expect(html).toContain('<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">Equipo Prelight</td>');
      expect(html).toContain('<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">Equipo Recogida</td>');
    });

    it('should escape HTML characters in content', () => {
      const valuesWithHtml = [
        {
          loc: 'Estudio <script>alert("xss")</script>',
          seq: 'Secuencia & "especial"',
        },
      ];
      const html = renderExportHTML(mockProjectName, mockWeekLabel, mockWeekStart, valuesWithHtml);
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&amp;');
      expect(html).not.toContain('<script>');
    });

    it('should handle empty values gracefully', () => {
      const emptyValues = [{}];
      const html = renderExportHTML(mockProjectName, mockWeekLabel, mockWeekStart, emptyValues);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<body>'); // body has inline styles
    });
  });

  describe('renderExportAllHTML', () => {
    it('should render valid HTML structure', () => {
      const html = renderExportAllHTML(mockProjectName, mockWeekEntries, mockNeeds);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>'); // body has inline styles
      expect(html).toContain('</html>');
    });

    it('should include project name in title', () => {
      const html = renderExportAllHTML(mockProjectName, mockWeekEntries, mockNeeds);
      expect(html).toContain('Test Project');
      expect(html).toContain('Necesidades');
    });

    it('should render multiple weeks', () => {
      const html = renderExportAllHTML(mockProjectName, mockWeekEntries, mockNeeds);
      expect(html).toContain('Semana 1');
      expect(html).toContain('Semana 2');
    });

    it('should handle empty week entries', () => {
      const html = renderExportAllHTML(mockProjectName, [], {});
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<body style='); // body has inline styles
    });

    it('should include footer', () => {
      const html = renderExportAllHTML(mockProjectName, mockWeekEntries, mockNeeds);
      expect(html).toContain('<div class="footer">');
    });

    it('should escape HTML characters in project name', () => {
      const html = renderExportAllHTML('Test <script>alert("xss")</script> Project', mockWeekEntries, mockNeeds);
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>');
    });
  });
});
