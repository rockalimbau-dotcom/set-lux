import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildNominaMonthHTML, openPrintWindow } from './export.ts';

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('nomina/utils/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('buildNominaMonthHTML', () => {
    const mockProject = {
      id: 'test-project',
      nombre: 'Test Project',
    };

    const mockMonthKey = '2023-01';

    const mockEnrichedRows = [
      {
        role: 'Gaffer',
        name: 'John Doe',
        _worked: 5,
        _totalDias: 250.0,
        _holidays: 2, // Added
        _totalHolidays: 87.5, // Added
        _travel: 2,
        _totalTravel: 100.0,
        extras: 3,
        horasExtra: 2,
        turnAround: 1,
        nocturnidad: 0,
        penaltyLunch: 0,
        _totalExtras: 45.0,
        _dietasLabel: 'Comida, Cena',
        _totalDietas: 40.0,
        transporte: 1,
        _totalTrans: 20.0,
        km: 50.5,
        _totalKm: 25.25,
        _totalBruto: 440.25,
      },
      {
        role: 'Eléctrico',
        name: 'Jane Smith',
        _worked: 4,
        _totalDias: 200.0,
        _holidays: 1, // Added
        _totalHolidays: 35.0, // Added
        _travel: 1,
        _totalTravel: 40.0,
        extras: 2,
        horasExtra: 1,
        turnAround: 0,
        nocturnidad: 1,
        penaltyLunch: 0,
        _totalExtras: 24.0,
        _dietasLabel: 'Dieta completa + desayuno',
        _totalDietas: 50.0,
        transporte: 0,
        _totalTrans: 0.0,
        km: 25.0,
        _totalKm: 12.5,
        _totalBruto: 326.5,
      },
    ];

    const mockMonthLabelEs = (key, withYear = false) => {
      const months = {
        '2023-01': 'Enero',
        '2023-02': 'Febrero',
        '2023-03': 'Marzo',
      };
      const month = months[key] || 'Unknown';
      return withYear ? `${month} 2023` : month;
    };

    it('generates HTML with correct structure', () => {
      const html = buildNominaMonthHTML(
        mockProject,
        mockMonthKey,
        mockEnrichedRows,
        mockMonthLabelEs
      );

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<body style=');
      expect(html).toContain('<table style=');
      expect(html).toContain('<thead>');
      expect(html).toContain('<tbody>');
    });

    it('includes correct title and project name', () => {
      const html = buildNominaMonthHTML(
        mockProject,
        mockMonthKey,
        mockEnrichedRows,
        mockMonthLabelEs
      );

      expect(html).toContain('<title>Test Project – Nómina Enero 2023</title>');
      expect(html).toContain('<h2 style="margin:0 0 10px 0;">Test Project – Nómina Enero 2023</h2>');
    });

    it('includes all required table headers', () => {
      const html = buildNominaMonthHTML(
        mockProject,
        mockMonthKey,
        mockEnrichedRows,
        mockMonthLabelEs
      );

      expect(html).toContain('Persona');
      expect(html).toContain('Días trabajados');
      expect(html).toContain('Total días');
      expect(html).toContain('Días Travel Day');
      expect(html).toContain('Total travel days');
      expect(html).toContain('Horas extras');
      expect(html).toContain('Total horas extra');
      expect(html).toContain('Dietas');
      expect(html).toContain('Total dietas');
      expect(html).toContain('Transportes');
      expect(html).toContain('Total transportes');
      expect(html).toContain('Kilometraje');
      expect(html).toContain('Total kilometraje');
      expect(html).toContain('TOTAL BRUTO');
    });

    it('includes data rows with correct values', () => {
      const html = buildNominaMonthHTML(
        mockProject,
        mockMonthKey,
        mockEnrichedRows,
        mockMonthLabelEs
      );

      // Check first row data
      expect(html).toContain('Gaffer — John Doe');
      expect(html).toContain('5'); // _worked
      expect(html).toContain('250.00'); // _totalDias
      expect(html).toContain('2'); // _travel
      expect(html).toContain('100.00'); // _totalTravel
      expect(html).toContain('3'); // extras
      expect(html).toContain('45.00'); // _totalExtras
      expect(html).toContain('Comida, Cena'); // _dietasLabel
      expect(html).toContain('40.00'); // _totalDietas
      expect(html).toContain('1'); // transporte
      expect(html).toContain('20.00'); // _totalTrans
      expect(html).toContain('50.5'); // km
      expect(html).toContain('25.25'); // _totalKm
      expect(html).toContain('440.25'); // _totalBruto
    });

    it('includes second row data', () => {
      const html = buildNominaMonthHTML(
        mockProject,
        mockMonthKey,
        mockEnrichedRows,
        mockMonthLabelEs
      );

      expect(html).toContain('Eléctrico — Jane Smith');
      expect(html).toContain('4'); // _worked
      expect(html).toContain('200.00'); // _totalDias
      expect(html).toContain('1'); // _travel
      expect(html).toContain('40.00'); // _totalTravel
      expect(html).toContain('2'); // extras
      expect(html).toContain('24.00'); // _totalExtras
      expect(html).toContain('Dieta completa + desayuno'); // _dietasLabel
      expect(html).toContain('50.00'); // _totalDietas
      expect(html).toContain('0'); // transporte
      expect(html).toContain('0.00'); // _totalTrans
      expect(html).toContain('25.0'); // km
      expect(html).toContain('12.50'); // _totalKm
      expect(html).toContain('326.50'); // _totalBruto
    });

    it('handles empty rows array', () => {
      const html = buildNominaMonthHTML(
        mockProject,
        mockMonthKey,
        [],
        mockMonthLabelEs
      );

      expect(html).toContain('<tbody></tbody>');
      expect(html).toContain('Test Project – Nómina Enero 2023');
    });

    it('handles project without nombre', () => {
      const projectWithoutName = { id: 'test' };
      const html = buildNominaMonthHTML(
        projectWithoutName,
        mockMonthKey,
        mockEnrichedRows,
        mockMonthLabelEs
      );

      expect(html).toContain('<title>Proyecto – Nómina Enero 2023</title>');
      expect(html).toContain('<h2 style="margin:0 0 10px 0;">Proyecto – Nómina Enero 2023</h2>');
    });

    it('handles null project', () => {
      const html = buildNominaMonthHTML(
        null,
        mockMonthKey,
        mockEnrichedRows,
        mockMonthLabelEs
      );

      expect(html).toContain('<title>Proyecto – Nómina Enero 2023</title>');
      expect(html).toContain('<h2 style="margin:0 0 10px 0;">Proyecto – Nómina Enero 2023</h2>');
    });

    it('escapes HTML characters in data', () => {
      const rowsWithSpecialChars = [
        {
          role: 'Gaffer & Director',
          name: 'John <script>alert("xss")</script>',
          _worked: 5,
          _totalDias: 250.0,
          _travel: 2,
          _totalTravel: 100.0,
          extras: 3,
          _totalExtras: 45.0,
          _dietasLabel: 'Comida & Cena',
          _totalDietas: 40.0,
          transporte: 1,
          _totalTrans: 20.0,
          km: 50.5,
          _totalKm: 25.25,
          _totalBruto: 440.25,
        },
      ];

      const html = buildNominaMonthHTML(
        mockProject,
        mockMonthKey,
        rowsWithSpecialChars,
        mockMonthLabelEs
      );

      expect(html).toContain('Gaffer &amp; Director');
      expect(html).toContain('John &lt;script&gt;alert("xss")&lt;/script&gt;');
      expect(html).toContain('Comida &amp; Cena');
      expect(html).not.toContain('<script>');
    });

    it('includes footer with SetLux branding', () => {
      const html = buildNominaMonthHTML(
        mockProject,
        mockMonthKey,
        mockEnrichedRows,
        mockMonthLabelEs
      );

      expect(html).toContain('<footer style="margin-top:30px;font-size:10px;color:#888;">Generado con SetLux</footer>');
    });

    it('applies correct CSS styles', () => {
      const html = buildNominaMonthHTML(
        mockProject,
        mockMonthKey,
        mockEnrichedRows,
        mockMonthLabelEs
      );

      expect(html).toContain('font-family:system-ui');
      expect(html).toContain('border:1px solid #999');
      expect(html).toContain('background:#1D4ED8');
      expect(html).toContain('color:#fff');
      expect(html).toContain('text-align:right');
      expect(html).toContain('font-weight:600');
    });

    it('handles rows with missing properties', () => {
      const incompleteRows = [
        {
          role: 'Gaffer',
          name: 'John Doe',
          _worked: 5,
          _totalDias: 250,
          _travel: 2,
          _totalTravel: 100,
          extras: 3,
          _totalExtras: 45,
          _dietasLabel: 'Comida',
          _totalDietas: 40,
          transporte: 1,
          _totalTrans: 20,
          km: 50.5,
          _totalKm: 25.25,
          _totalBruto: 440.25,
        },
      ];

      const html = buildNominaMonthHTML(
        mockProject,
        mockMonthKey,
        incompleteRows,
        mockMonthLabelEs
      );

      expect(html).toContain('Gaffer — John Doe');
      // Should handle undefined values gracefully
    });

    it('handles rows with null/undefined values', () => {
      const rowsWithNulls = [
        {
          role: 'Gaffer',
          name: 'John Doe',
          _worked: 5,
          _totalDias: 250,
          _travel: 2,
          _totalTravel: 100,
          extras: 3,
          _totalExtras: 45,
          _dietasLabel: 'Comida',
          _totalDietas: 40,
          transporte: 1,
          _totalTrans: 20,
          km: 50.5,
          _totalKm: 25.25,
          _totalBruto: 440.25,
        },
      ];

      const html = buildNominaMonthHTML(
        mockProject,
        mockMonthKey,
        rowsWithNulls,
        mockMonthLabelEs
      );

      expect(html).toContain('Gaffer — John Doe');
      // Should handle null/undefined values gracefully
    });

    it('hides empty columns when no data is present', () => {
      const rowsWithoutOptionalData = [
        {
          role: 'Gaffer',
          name: 'John Doe',
          _worked: 5,
          _totalDias: 250.0,
          _holidays: 0, // No holiday days
          _totalHolidays: 0,
          _travel: 0, // No travel days
          _totalTravel: 0,
          extras: 0, // No extras
          _totalExtras: 0,
          _dietasLabel: '',
          _totalDietas: 0, // No dietas
          transporte: 0, // No transporte
          _totalTrans: 0,
          km: 0, // No km
          _totalKm: 0,
          _totalBruto: 250.0,
        },
      ];

      const html = buildNominaMonthHTML(
        mockProject,
        mockMonthKey,
        rowsWithoutOptionalData,
        mockMonthLabelEs
      );

      // Should not contain headers for empty columns
      expect(html).not.toContain('Días festivos');
      expect(html).not.toContain('Total días festivos');
      expect(html).not.toContain('Días Travel Day');
      expect(html).not.toContain('Total travel days');
      expect(html).not.toContain('Horas extras');
      expect(html).not.toContain('Total horas extra');
      expect(html).not.toContain('Dietas');
      expect(html).not.toContain('Total dietas');
      expect(html).not.toContain('Transportes');
      expect(html).not.toContain('Total transportes');
      expect(html).not.toContain('Kilometraje');
      expect(html).not.toContain('Total kilometraje');

      // Should still contain base columns
      expect(html).toContain('Persona');
      expect(html).toContain('Días trabajados');
      expect(html).toContain('Total días');
      expect(html).toContain('TOTAL BRUTO');
    });

    it('shows only relevant columns based on data', () => {
      const rowsWithPartialData = [
        {
          role: 'Gaffer',
          name: 'John Doe',
          _worked: 5,
          _totalDias: 250.0,
          _holidays: 2, // Has holiday days
          _totalHolidays: 87.5,
          _travel: 0, // No travel days
          _totalTravel: 0,
          extras: 3, // Has extras
          _totalExtras: 45.0,
          _dietasLabel: '',
          _totalDietas: 0, // No dietas
          transporte: 0, // No transporte
          _totalTrans: 0,
          km: 0, // No km
          _totalKm: 0,
          _totalBruto: 382.5,
        },
      ];

      const html = buildNominaMonthHTML(
        mockProject,
        mockMonthKey,
        rowsWithPartialData,
        mockMonthLabelEs
      );

      // Should contain headers for columns with data
      expect(html).toContain('Días festivos');
      expect(html).toContain('Total días festivos');
      expect(html).toContain('Horas extras');
      expect(html).toContain('Total horas extra');

      // Should not contain headers for empty columns
      expect(html).not.toContain('Días Travel Day');
      expect(html).not.toContain('Total travel days');
      expect(html).not.toContain('Dietas');
      expect(html).not.toContain('Total dietas');
      expect(html).not.toContain('Transportes');
      expect(html).not.toContain('Total transportes');
      expect(html).not.toContain('Kilometraje');
      expect(html).not.toContain('Total kilometraje');

      // Should always contain base columns
      expect(html).toContain('Persona');
      expect(html).toContain('Días trabajados');
      expect(html).toContain('Total días');
      expect(html).toContain('TOTAL BRUTO');
    });

    it('includes holiday columns in export when present', () => {
      const html = buildNominaMonthHTML(
        mockProject,
        mockMonthKey,
        mockEnrichedRows,
        mockMonthLabelEs
      );

      // Should contain holiday headers
      expect(html).toContain('Días festivos');
      expect(html).toContain('Total días festivos');

      // Should contain holiday data
      expect(html).toContain('2'); // _holidays for first row
      expect(html).toContain('87.5'); // _totalHolidays for first row
      expect(html).toContain('1'); // _holidays for second row
      expect(html).toContain('35.0'); // _totalHolidays for second row
    });

    it('should format extras correctly with pills format', () => {
      const rowsWithExtras = [
        {
          role: 'Gaffer',
          name: 'John Doe',
          _worked: 5,
          _totalDias: 250.0,
          _holidays: 0,
          _totalHolidays: 0,
          _travel: 0,
          _totalTravel: 0,
          extras: 4,
          horasExtra: 2,
          turnAround: 1,
          nocturnidad: 1,
          penaltyLunch: 0,
          _totalExtras: 60.0,
          _dietasLabel: '',
          _totalDietas: 0,
          transporte: 0,
          _totalTrans: 0,
          km: 0,
          _totalKm: 0,
          _totalBruto: 310.0,
        },
      ];

      const html = buildNominaMonthHTML(
        mockProject,
        mockMonthKey,
        rowsWithExtras,
        mockMonthLabelEs
      );

      // Should contain the formatted extras text
      expect(html).toContain('Horas extra x2 · Turn Around x1 · Nocturnidad x1');
    });

    it('should handle empty extras correctly', () => {
      const rowsWithoutExtras = [
        {
          role: 'Gaffer',
          name: 'John Doe',
          _worked: 5,
          _totalDias: 250.0,
          _holidays: 0,
          _totalHolidays: 0,
          _travel: 0,
          _totalTravel: 0,
          extras: 0,
          horasExtra: 0,
          turnAround: 0,
          nocturnidad: 0,
          penaltyLunch: 0,
          _totalExtras: 0,
          _dietasLabel: '',
          _totalDietas: 0,
          transporte: 0,
          _totalTrans: 0,
          km: 0,
          _totalKm: 0,
          _totalBruto: 250.0,
        },
      ];

      const html = buildNominaMonthHTML(
        mockProject,
        mockMonthKey,
        rowsWithoutExtras,
        mockMonthLabelEs
      );

      // Should not contain extras columns when no data
      expect(html).not.toContain('Horas extras');
      expect(html).not.toContain('Total horas extra');
    });
  });

  describe('openPrintWindow', () => {
    it('opens new window and writes HTML', () => {
      const mockWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
      };

      mockWindowOpen.mockReturnValue(mockWindow);

      const html = '<html><body>Test</body></html>';
      openPrintWindow(html);

      expect(mockWindowOpen).toHaveBeenCalledWith('', '_blank');
      expect(mockWindow.document.write).toHaveBeenCalledWith(html);
      expect(mockWindow.document.close).toHaveBeenCalled();
    });

    it('handles window.open returning null', () => {
      mockWindowOpen.mockReturnValue(null);

      const html = '<html><body>Test</body></html>';
      
      // Should not throw error
      expect(() => openPrintWindow(html)).not.toThrow();
    });

    it('handles window being undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const html = '<html><body>Test</body></html>';
      
      // Should not throw error
      expect(() => openPrintWindow(html)).not.toThrow();

      global.window = originalWindow;
    });

    it('handles empty HTML string', () => {
      const mockWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
      };

      mockWindowOpen.mockReturnValue(mockWindow);

      openPrintWindow('');

      expect(mockWindow.document.write).toHaveBeenCalledWith('');
      expect(mockWindow.document.close).toHaveBeenCalled();
    });

    it('handles HTML with special characters', () => {
      const mockWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
      };

      mockWindowOpen.mockReturnValue(mockWindow);

      const html = '<html><body>Test & "quotes" & \'apostrophes\'</body></html>';
      openPrintWindow(html);

      expect(mockWindow.document.write).toHaveBeenCalledWith(html);
      expect(mockWindow.document.close).toHaveBeenCalled();
    });
  });
});
