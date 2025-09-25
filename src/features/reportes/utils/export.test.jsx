import { describe, it, expect, vi } from 'vitest';
import { buildReportWeekHTML } from './export.ts';

describe('reportes/utils/export', () => {
  describe('buildReportWeekHTML', () => {
    const mockDayNameFromISO = vi.fn((iso, index) => `Day ${index + 1}`);
    const mockToDisplayDate = vi.fn(iso => iso);
    const mockHorarioTexto = vi.fn(iso => `Horario ${iso}`);
    const mockPersonaKey = vi.fn(p => `${p.role}__${p.name}`);
    const mockPersonaRole = vi.fn(p => p.role);
    const mockPersonaName = vi.fn(p => p.name);

    const defaultParams = {
      project: { nombre: 'Test Project' },
      title: 'Test Week',
      safeSemana: ['2023-01-01', '2023-01-02'],
      dayNameFromISO: mockDayNameFromISO,
      toDisplayDate: mockToDisplayDate,
      horarioTexto: mockHorarioTexto,
      CONCEPTS: ['Dietas', 'Transporte'],
      data: {
        'G1__John': {
          Dietas: { '2023-01-01': '10', '2023-01-02': '20' },
          Transporte: { '2023-01-01': '5', '2023-01-02': '15' },
        },
      },
      personaKey: mockPersonaKey,
      personaRole: mockPersonaRole,
      personaName: mockPersonaName,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('generates HTML with project name and title', () => {
      const result = buildReportWeekHTML(defaultParams);

      expect(result).toContain('Test Project – Test Week');
      expect(result).toContain('<title>Test Project – Test Week</title>');
    });

    it('generates HTML with default values when project and title are missing', () => {
      const params = { ...defaultParams, project: undefined, title: undefined };
      const result = buildReportWeekHTML(params);

      expect(result).toContain('Proyecto – Semana');
      expect(result).toContain('<title>Proyecto – Semana</title>');
    });

    it('generates table headers with day names and dates', () => {
      const result = buildReportWeekHTML(defaultParams);

      expect(result).toContain('<th style="border:1px solid #999;padding:6px;text-align:left;background:#1D4ED8;color:#fff;">');
      expect(mockDayNameFromISO).toHaveBeenCalledWith('2023-01-01', 0);
      expect(mockDayNameFromISO).toHaveBeenCalledWith('2023-01-02', 1);
      expect(mockToDisplayDate).toHaveBeenCalledWith('2023-01-01');
      expect(mockToDisplayDate).toHaveBeenCalledWith('2023-01-02');
    });

    it('generates horario row', () => {
      const result = buildReportWeekHTML(defaultParams);

      expect(result).toContain('<th style="border:1px solid #999;padding:6px;text-align:left;background:#1D4ED8;color:#fff;">Horario</th>');
      expect(mockHorarioTexto).toHaveBeenCalledWith('2023-01-01');
      expect(mockHorarioTexto).toHaveBeenCalledWith('2023-01-02');
    });

    it('generates person rows with role and name', () => {
      const result = buildReportWeekHTML(defaultParams);

      expect(result).toContain('G1 — John');
      expect(result).toContain('<td style="border:1px solid #999;padding:6px;font-weight:600;background:#f5f5f5;">');
    });

    it('generates concept rows for each person', () => {
      const result = buildReportWeekHTML(defaultParams);

      expect(result).toContain('Dietas');
      expect(result).toContain('Transporte');
    });

    it('displays data values in correct cells', () => {
      const result = buildReportWeekHTML(defaultParams);

      expect(result).toContain('10');
      expect(result).toContain('20');
      expect(result).toContain('5');
      expect(result).toContain('15');
    });

    it('handles empty data gracefully', () => {
      const params = { ...defaultParams, data: {} };
      const result = buildReportWeekHTML(params);

      expect(result).toContain('<tbody>');
      expect(result).toContain('</tbody>');
    });

    it('handles empty safeSemana gracefully', () => {
      const params = { ...defaultParams, safeSemana: [] };
      const result = buildReportWeekHTML(params);

      expect(result).toContain('<tbody>');
      expect(result).toContain('</tbody>');
    });

    it('handles null/undefined data gracefully', () => {
      const params = { ...defaultParams, data: null };
      const result = buildReportWeekHTML(params);

      expect(result).toContain('<tbody>');
      expect(result).toContain('</tbody>');
    });

    it('escapes HTML characters in project name', () => {
      const params = { ...defaultParams, project: { nombre: 'Test & <Project>' } };
      const result = buildReportWeekHTML(params);

      expect(result).toContain('Test &amp; &lt;Project&gt;');
    });

    it('escapes HTML characters in title', () => {
      const params = { ...defaultParams, title: 'Test & <Week>' };
      const result = buildReportWeekHTML(params);

      expect(result).toContain('Test &amp; &lt;Week&gt;');
    });

    it('escapes HTML characters in data values', () => {
      const params = {
        ...defaultParams,
        data: {
          'G1__John': {
            Dietas: { '2023-01-01': 'Test & <Value>' },
          },
        },
      };
      const result = buildReportWeekHTML(params);

      expect(result).toContain('Test &amp; &lt;Value&gt;');
    });

    it('handles multiple persons', () => {
      const params = {
        ...defaultParams,
        data: {
          'G1__John': {
            Dietas: { '2023-01-01': '10' },
          },
          'E2__Jane': {
            Dietas: { '2023-01-01': '20' },
          },
        },
      };
      const result = buildReportWeekHTML(params);

      expect(result).toContain('G1 — John');
      expect(result).toContain('E2 — Jane');
    });

    it('handles person key without role part', () => {
      const params = {
        ...defaultParams,
        data: {
          '__John': {
            Dietas: { '2023-01-01': '10' },
          },
        },
      };
      const result = buildReportWeekHTML(params);

      expect(result).toContain('John');
    });

    it('includes SetLux footer', () => {
      const result = buildReportWeekHTML(defaultParams);

      expect(result).toContain('Generado con SetLux');
      expect(result).toContain('<footer style="margin-top:30px;font-size:10px;color:#888;">');
    });

    it('generates valid HTML structure', () => {
      const result = buildReportWeekHTML(defaultParams);

      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html>');
      expect(result).toContain('<head>');
      expect(result).toContain('<body style=');
      expect(result).toContain('<table style=');
      expect(result).toContain('<thead>');
      expect(result).toContain('<tbody>');
    });
  });
});
