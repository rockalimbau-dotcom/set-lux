import { describe, expect, it } from 'vitest';

import i18n from '../../../../i18n/config';
import { generateRowDataCells } from './tableHelpers';

const getCellContents = (html: string): string[] =>
  Array.from(html.matchAll(/<div class="td-label td-label-center">([\s\S]*?)<\/div><\/td>/g)).map(match => match[1]);

describe('generateRowDataCells', () => {
  const baseColumnVisibility = {
    halfDays: false,
    localizacion: false,
    cargaDescarga: true,
    holidays: false,
    travel: false,
    extras: false,
    materialPropio: false,
    dietas: false,
    transporte: false,
    km: false,
    gasolina: false,
    netColumns: false,
    extraHoursPercent: false,
  };

  it('keeps carga/descarga out of worked shifts in diario exports', () => {
    const row = {
      role: 'E',
      name: 'Crew Member',
      _worked: 1,
      _rodaje: 1,
      _carga: 1,
      _descarga: 1,
      _cargaDays: 1,
      _descargaDays: 1,
      _totalDias: 300,
      _totalCargaDescarga: 150,
    };

    const html = generateRowDataCells(row, baseColumnVisibility, { projectMode: 'diario' }).join('');

    expect(html).toContain(`${i18n.t('payroll.dayTypes.shooting')} x1`);
    expect(html).toContain(`${i18n.t('payroll.dayTypes.loading')} x1`);
    expect(html).toContain(`${i18n.t('payroll.dayTypes.unloading')} x1`);

    const workedCell = getCellContents(html)[0] || '';

    expect(workedCell).toContain(`${i18n.t('payroll.dayTypes.shooting')} x1`);
    expect(workedCell).not.toContain(`${i18n.t('payroll.dayTypes.loading')} x1`);
    expect(workedCell).not.toContain(`${i18n.t('payroll.dayTypes.unloading')} x1`);
  });

  it('leaves empty payroll number cells blank instead of using dashes', () => {
    const row = {
      role: 'E',
      name: 'Crew Member',
      _worked: 0,
      _totalDias: 0,
      _materialPropioType: 'diario',
      _materialPropioDays: 0,
      _totalMaterialPropio: 0,
    };

    const html = generateRowDataCells(row, { ...baseColumnVisibility, cargaDescarga: false, materialPropio: true }).join('');
    const cells = getCellContents(html);

    expect(cells).toEqual(['', '', '', '', '']);
    expect(html).not.toContain('—');
  });
});
