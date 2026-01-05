export const parseNum = (x: any): number => {
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

export const fmt = (n: number): string => {
  if (!Number.isFinite(n)) return '';
  if (Math.abs(n % 1) < 1e-9) return String(Math.round(n));
  return n.toFixed(2).replace(/\.?0+$/, '');
};

export const computeFromWeekly = (weeklyStr: string, params: any) => {
  const w = parseNum(weeklyStr);
  if (!Number.isFinite(w) || w === 0) {
    return {
      'Precio mensual': '',
      'Precio diario': '',
      'Precio jornada': '',
      'Precio Día extra/Festivo': '',
      'Travel day': '',
      'Horas extras': '',
    };
  }
  const semanasMes = parseNum(params?.semanasMes) || 0;
  const diasDiario = parseNum(params?.diasDiario) || 0;
  const diasJornada = parseNum(params?.diasJornada) || 0;
  const factorFestivo = parseNum(params?.factorFestivo) || 0;
  const divTravel = parseNum(params?.divTravel) || 0;
  const horasSemana = parseNum(params?.horasSemana) || 0;
  const factorHora = parseNum(params?.factorHoraExtra) || 0;

  const mensual = semanasMes > 0 ? w * semanasMes : NaN;
  const diario = diasDiario > 0 ? w / diasDiario : NaN;
  const jornada = diasJornada > 0 ? w / diasJornada : NaN;
  const festivo = Number.isFinite(jornada) && factorFestivo > 0 ? jornada * factorFestivo : NaN;
  const travel = Number.isFinite(jornada) && divTravel > 0 ? jornada / divTravel : NaN;
  const extra = horasSemana > 0 && factorHora > 0 ? (w / horasSemana) * factorHora : NaN;

  return {
    'Precio mensual': fmt(mensual),
    'Precio diario': fmt(diario),
    'Precio jornada': fmt(jornada),
    'Precio Día extra/Festivo': fmt(festivo),
    'Travel day': fmt(travel),
    'Horas extras': fmt(extra),
  };
};

