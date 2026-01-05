/**
 * Extrae fechas tipo 1/01, 01-04, 1/01/2025, etc.
 */
export function extractFestivosDatesForPlan(text: unknown): string[] {
  const src = String(text || '')
    .replace(/\u00A0/g, ' ')
    .replace(/[–—−]/g, '-');

  const out: string[] = [];
  const re = /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const d = String(m[1]).padStart(2, '0');
    const mo = String(m[2]).padStart(2, '0');
    const yRaw = m[3];
    if (yRaw) {
      const y = String(yRaw).length === 2 ? `20${yRaw}` : String(yRaw);
      out.push(`${d}/${mo}/${y}`); // DD/MM/YYYY
    } else {
      out.push(`${d}/${mo}`); // DD/MM
    }
  }
  return Array.from(new Set(out));
}

/**
 * Renderiza un template reemplazando marcadores con valores de parámetros
 */
export function renderWithParams(tpl: string, params: Record<string, any> = {}): string {
  if (!tpl) return '';
  const map: Array<[string, any]> = [
    ['{{SEMANAS_MES}}', params.semanasMes],
    ['{{DIAS_DIARIO}}', params.diasDiario],
    ['{{DIAS_JORNADA}}', params.diasJornada],
    ['{{JORNADA_TRABAJO}}', params.jornadaTrabajo],
    ['{{JORNADA_COMIDA}}', params.jornadaComida],
    ['{{HORAS_SEMANA}}', params.horasSemana],
    ['{{FACTOR_FESTIVO}}', params.factorFestivo],
    ['{{FACTOR_HORA_EXTRA}}', params.factorHoraExtra],
    ['{{FACTOR_HORA_EXTRA_FESTIVA}}', params.factorHoraExtraFestiva],
    ['{{DIV_TRAVEL}}', params.divTravel],
    ['{{CORTESIA_MIN}}', params.cortesiaMin],
    ['{{TA_DIARIO}}', params.taDiario],
    ['{{TA_FINDE}}', params.taFinde],
    ['{{NOCTURNO_INI}}', params.nocturnoIni],
    ['{{NOCTURNO_FIN}}', params.nocturnoFin],
    ['{{NOCTURNIDAD_COMPLEMENTO}}', params.nocturnidadComplemento],
    ['{{DIETA_DESAYUNO}}', params.dietaDesayuno],
    ['{{DIETA_COMIDA}}', params.dietaComida],
    ['{{DIETA_CENA}}', params.dietaCena],
    ['{{DIETA_SIN_PERNOCTA}}', params.dietaSinPernocta],
    ['{{DIETA_ALOJ_DES}}', params.dietaAlojDes],
    ['{{GASTOS_BOLSILLO}}', params.gastosBolsillo],
    ['{{KM_EURO}}', params.kilometrajeKm],
    ['{{TRANSPORTE_DIA}}', params.transporteDia],
  ];
  for (const [marker, val] of map) tpl = tpl.split(marker).join(String(val ?? ''));
  return tpl;
}

/**
 * Convierte valores visibles a templates reemplazando valores con marcadores
 */
export function visibleToTemplate(visible: string, params: Record<string, any> = {}): string {
  if (!visible) return '';
  let tpl = visible;
  const pairs: Array<[any, string]> = [
    [params.semanasMes, '{{SEMANAS_MES}}'],
    [params.diasDiario, '{{DIAS_DIARIO}}'],
    [params.diasJornada, '{{DIAS_JORNADA}}'],
    [params.jornadaTrabajo, '{{JORNADA_TRABAJO}}'],
    [params.jornadaComida, '{{JORNADA_COMIDA}}'],
    [params.horasSemana, '{{HORAS_SEMANA}}'],
    [params.factorFestivo, '{{FACTOR_FESTIVO}}'],
    [params.factorHoraExtra, '{{FACTOR_HORA_EXTRA}}'],
    [params.factorHoraExtraFestiva, '{{FACTOR_HORA_EXTRA_FESTIVA}}'],
    [params.divTravel, '{{DIV_TRAVEL}}'],
    [params.cortesiaMin, '{{CORTESIA_MIN}}'],
    [params.taDiario, '{{TA_DIARIO}}'],
    [params.taFinde, '{{TA_FINDE}}'],
    [params.nocturnoIni, '{{NOCTURNO_INI}}'],
    [params.nocturnoFin, '{{NOCTURNO_FIN}}'],
    [params.nocturnidadComplemento, '{{NOCTURNIDAD_COMPLEMENTO}}'],
    [params.dietaDesayuno, '{{DIETA_DESAYUNO}}'],
    [params.dietaComida, '{{DIETA_COMIDA}}'],
    [params.dietaCena, '{{DIETA_CENA}}'],
    [params.dietaSinPernocta, '{{DIETA_SIN_PERNOCTA}}'],
    [params.dietaAlojDes, '{{DIETA_ALOJ_DES}}'],
    [params.gastosBolsillo, '{{GASTOS_BOLSILLO}}'],
    [params.kilometrajeKm, '{{KM_EURO}}'],
    [params.transporteDia, '{{TRANSPORTE_DIA}}'],
  ];
  for (const [val, marker] of pairs) {
    if (val == null || val === '') continue;
    const escaped = String(val).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    tpl = tpl.replace(new RegExp(`\\b${escaped}\\b`, 'g'), marker);
  }
  return tpl;
}

/**
 * Restaura tags <strong> en textos según patrones comunes
 */
export function restoreStrongTags(text: string): string {
  if (!text) return text;

  // Si ya tiene tags, normalizar "Turn around" y "Nocturnidades" a minúsculas
  if (text.includes('<strong>')) {
    let result = text;
    result = result.replace(/<strong>(TURN AROUND:)/gi, '<strong>Turn around:');
    result = result.replace(/<strong>(NOCTURNIDADES:)/gi, '<strong>Nocturnidad:');
    result = result.replace(/(TURN AROUND:)/gi, 'Turn around:');
    result = result.replace(/(NOCTURNIDADES:)/gi, 'Nocturnidad:');
    return result;
  }

  // Primero normalizar mayúsculas/minúsculas
  let normalized = text;
  normalized = normalized.replace(/TURN AROUND:/gi, 'Turn around:');
  normalized = normalized.replace(/NOCTURNIDADES:/gi, 'Nocturnidad:');

  // Patrones comunes que deberían estar en negrita
  const patterns: Array<[RegExp, string]> = [
    [/^(Tarifa mensual:)/m, '<strong>$1</strong>'],
    [/^(Tarifa semanal:)/m, '<strong>$1</strong>'],
    [/^(Precio diario:)/m, '<strong>$1</strong>'],
    [/^(Precio jornada:)/m, '<strong>$1</strong>'],
    [/^(Precio refuerzo:)/m, '<strong>$1</strong>'],
    [/^(Precio Día extra \/ Festivo:)/m, '<strong>$1</strong>'],
    [/^(Precio Travel Day:)/m, '<strong>$1</strong>'],
    [/^(Horas extras:)/m, '<strong>$1</strong>'],
    [/^(Turn around:)/m, '<strong>$1</strong>'],
    [/^(Nocturnidad:)/m, '<strong>$1</strong>'],
    [/^(Comida:)/m, '<strong>$1</strong>'],
    [/^(Cena:)/m, '<strong>$1</strong>'],
    [/^(Dieta completa sin pernocta:)/m, '<strong>$1</strong>'],
    [/^(Dieta completa y desayuno:)/m, '<strong>$1</strong>'],
    [/^(Gastos de bolsillo:)/m, '<strong>$1</strong>'],
    [/^(Gastos de Bolsillo:)/m, '<strong>Gastos de bolsillo:</strong>'],
  ];

  let result = normalized;
  for (const [pattern, replacement] of patterns) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

