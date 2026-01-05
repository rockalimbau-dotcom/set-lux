export function parseNum(input: unknown): number {
  if (input == null) return NaN;
  let s = String(input)
    .trim()
    .replace(/\u00A0/g, '')
    .replace(/[€%]/g, '')
    .replace(/\s+/g, '');
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return isFinite(n) ? n : NaN;
}

export function fmtMoney(n: number): string {
  if (!isFinite(n)) return '';
  const r = Math.round(n * 100) / 100;
  if (Number.isInteger(r)) return String(r);
  return r.toFixed(2).replace('.', ',');
}

export function computeFromMonthly(monthlyStr: string, params: any) {
  const pm = parseNum(monthlyStr);
  if (!isFinite(pm) || pm === 0) {
    return {
      'Precio semanal': '',
      'Precio diario': '',
      'Precio jornada': '',
      'Precio Día extra/Festivo': '',
      'Travel day': '',
      'Horas extras': '',
    };
  }

  const semanasMes = parseNum(params?.semanasMes ?? '4');
  const diasJornada = parseNum(params?.diasJornada ?? '5');
  const factorFestivo = parseNum(params?.factorFestivo ?? '1.75');
  const divTravel = parseNum(params?.divTravel ?? '2');
  const horasSemana = parseNum(params?.horasSemana ?? '45');
  const factorHoraExtra = parseNum(params?.factorHoraExtra ?? '1.5');

  const mensualOk = isFinite(pm) ? pm : NaN;
  const semOk = isFinite(semanasMes) && semanasMes > 0 ? semanasMes : NaN;
  const djOk = isFinite(diasJornada) && diasJornada > 0 ? diasJornada : NaN;
  const divTravelOk = isFinite(divTravel) && divTravel > 0 ? divTravel : NaN;
  const hsOk = isFinite(horasSemana) && horasSemana > 0 ? horasSemana : NaN;
  const ffOk = isFinite(factorFestivo) ? factorFestivo : NaN;
  const fheOk = isFinite(factorHoraExtra) ? factorHoraExtra : NaN;

  const semanal = isFinite(mensualOk / semOk) ? mensualOk / semOk : NaN;
  const diario = isFinite(mensualOk / 30) ? mensualOk / 30 : NaN;
  const jornada = isFinite(mensualOk / (djOk * semOk))
    ? mensualOk / (djOk * semOk)
    : NaN;
  const festivo = isFinite(jornada * ffOk) ? jornada * ffOk : NaN;
  const travel = isFinite(jornada / divTravelOk)
    ? jornada / divTravelOk
    : NaN;
  const baseHora = isFinite(mensualOk / (hsOk * semOk))
    ? mensualOk / (hsOk * semOk)
    : NaN;
  const horaExtra = isFinite(baseHora * fheOk) ? baseHora * fheOk : NaN;

  return {
    'Precio semanal': isFinite(semanal) ? fmtMoney(semanal) : '',
    'Precio diario': isFinite(diario) ? fmtMoney(diario) : '',
    'Precio jornada': isFinite(jornada) ? fmtMoney(jornada) : '',
    'Precio Día extra/Festivo': isFinite(festivo) ? fmtMoney(festivo) : '',
    'Travel day': isFinite(travel) ? fmtMoney(travel) : '',
    'Horas extras': isFinite(horaExtra) ? fmtMoney(horaExtra) : '',
  };
}

