function parseNum(input: unknown): number {
  if (input == null) return NaN;
  let s = String(input)
    .trim()
    .replace(/\u00A0/g, '')
    .replace(/[€%]/g, '')
    .replace(/\s+/g, '');
  if (!s) return NaN;
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return isFinite(n) ? n : NaN;
}

function getParamNumber(value: unknown, fallback: number): number {
  const parsed = parseNum(value);
  return isFinite(parsed) ? parsed : fallback;
}

function fmtMoney(n: number): string {
  if (!isFinite(n)) return '';
  const r = Math.round(n * 100) / 100;
  if (Math.abs(r % 1) < 1e-9) return String(Math.round(r));
  return r.toFixed(2).replace(/\.?0+$/, '');
}

export function computeFromMonthly(monthlyStr: string, params: any) {
  const pm = parseNum(monthlyStr);
  if (!isFinite(pm) || pm === 0) {
    return {
      'Precio semanal': '',
      'Precio diario': '',
      'Precio jornada': '',
      'Precio 1/2 jornada': '',
      'Precio Día extra/Festivo': '',
      'Travel day': '',
      'Horas extras': '',
    };
  }

  const semanasMes = getParamNumber(params?.semanasMes, 4);
  const diasJornada = getParamNumber(params?.diasJornada, 5);
  const diasDiario = getParamNumber(params?.diasDiario, 7);
  const horasSemana = getParamNumber(params?.horasSemana, 45);
  const factorFestivo = getParamNumber(params?.factorFestivo, 1.75);
  const divTravel = getParamNumber(params?.divTravel, 2);
  const factorHoraExtra = getParamNumber(params?.factorHoraExtra, 1.5);

  const mensualOk = isFinite(pm) ? pm : NaN;
  const semOk = semanasMes > 0 ? semanasMes : NaN;
  const djOk = diasJornada > 0 ? diasJornada : NaN;
  const ddOk = diasDiario > 0 ? diasDiario : NaN;
  const hsOk = horasSemana > 0 ? horasSemana : NaN;
  const divTravelOk = divTravel > 0 ? divTravel : NaN;
  const ffOk = isFinite(factorFestivo) ? factorFestivo : NaN;
  const fheOk = isFinite(factorHoraExtra) ? factorHoraExtra : NaN;

  const semanal = isFinite(mensualOk / semOk) ? mensualOk / semOk : NaN;
  const diario = isFinite(semanal / ddOk) ? semanal / ddOk : NaN;
  const jornada = isFinite(semanal / djOk) ? semanal / djOk
    : NaN;
  const mediaJornada = isFinite(jornada) ? jornada / 2 : NaN;
  const festivo = isFinite(jornada * ffOk) ? jornada * ffOk : NaN;
  const travel = isFinite(jornada / divTravelOk)
    ? jornada / divTravelOk
    : NaN;
  const baseHora = isFinite(mensualOk / (hsOk * semOk)) ? mensualOk / (hsOk * semOk) : NaN;
  const horaExtra = isFinite(baseHora * fheOk) ? baseHora * fheOk : NaN;

  return {
    'Precio semanal': isFinite(semanal) ? fmtMoney(semanal) : '',
    'Precio diario': isFinite(diario) ? fmtMoney(diario) : '',
    'Precio jornada': isFinite(jornada) ? fmtMoney(jornada) : '',
    'Precio 1/2 jornada': isFinite(mediaJornada) ? fmtMoney(mediaJornada) : '',
    'Precio Día extra/Festivo': isFinite(festivo) ? fmtMoney(festivo) : '',
    'Travel day': isFinite(travel) ? fmtMoney(travel) : '',
    'Horas extras': isFinite(horaExtra) ? fmtMoney(horaExtra) : '',
  };
}
