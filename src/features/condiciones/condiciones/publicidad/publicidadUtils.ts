import { AnyRecord } from '@shared/types/common';

const parseNum = (x: unknown): number => {
  if (x == null) return NaN;
  let s = String(x)
    .trim()
    .replace(/[^\d.,-]/g, '');
  if (!s) return NaN;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    const decSep = lastComma > lastDot ? ',' : '.';
    const thouSep = decSep === ',' ? '.' : ',';
    s = s.replace(new RegExp(`\\${thouSep}`, 'g'), '');
    if (decSep === ',') s = s.replace(/,/g, '.');
  } else if (hasComma && !hasDot) {
    s = s.replace(/,/g, '.');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
};

const fmt = (n: number): string => {
  if (!Number.isFinite(n)) return '';
  if (Math.abs(n % 1) < 1e-9) return String(Math.round(n));
  return n.toFixed(2).replace(/\.?0+$/, '');
};

export const computeFromDaily = (dailyStr: string, params: AnyRecord) => {
  const d = parseNum(dailyStr);
  if (!Number.isFinite(d) || d === 0) {
    return {
      'Precio Día extra/Festivo': '',
      'Travel day': '',
      'Horas extras': '',
    } as AnyRecord;
  }
  const factorFestivo = parseNum(params?.factorFestivo) || 0;
  const jTrab = parseNum(params?.jornadaTrabajo) || 0;
  const jCom = parseNum(params?.jornadaComida) || 0;
  const facHora = parseNum(params?.factorHoraExtra) || 0;

  const festivo = factorFestivo > 0 ? d * factorFestivo : NaN;
  const travel = d; // Travel day es igual al precio jornada
  const horasTotales = jTrab + jCom;
  const extra =
    horasTotales > 0 && facHora > 0 ? (d / horasTotales) * facHora : NaN;
  const cargaDescarga = extra * 3; // Equivalente a 3 horas extras

  return {
    'Precio Día extra/Festivo': fmt(festivo),
    'Travel day': fmt(travel),
    'Horas extras': fmt(extra),
    'Carga/descarga': fmt(cargaDescarga),
  } as AnyRecord;
};

