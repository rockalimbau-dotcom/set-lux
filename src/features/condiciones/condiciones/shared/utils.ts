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
 * Asegura que cualquier HTML se convierta a Markdown antes de guardar
 */
export function visibleToTemplate(visible: string, params: Record<string, any> = {}): string {
  if (!visible) return '';
  // Convertir cualquier HTML <strong> a Markdown antes de procesar
  let tpl = visible;
  if (tpl.includes('<strong>')) {
    tpl = htmlStrongToMarkdown(tpl);
  }
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
 * Convierte HTML <strong> a Markdown **texto**
 */
function htmlStrongToMarkdown(text: string): string {
  if (!text) return text;
  // Convertir <strong>texto</strong> a **texto**
  return text.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
}

/**
 * Convierte Markdown **texto** a HTML <strong>texto</strong>
 */
export function markdownToHtml(text: string): string {
  if (!text) return text;
  // Convertir **texto** a <strong>texto</strong>
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Restaura formato en negrita usando Markdown según patrones comunes
 */
export function restoreStrongTags(text: string): string {
  if (!text) return text;

  // Si ya tiene HTML <strong>, convertir a Markdown primero
  if (text.includes('<strong>')) {
    text = htmlStrongToMarkdown(text);
  }

  // Normalizar mayúsculas/minúsculas
  let normalized = text;
  normalized = normalized.replace(/TURN AROUND:/gi, 'Turn around:');
  normalized = normalized.replace(/NOCTURNIDADES:/gi, 'Nocturnidad:');

  // Si ya tiene Markdown **texto**, normalizar
  if (normalized.includes('**')) {
    normalized = normalized.replace(/\*\*(TURN AROUND:)\*\*/gi, '**Turn around:**');
    normalized = normalized.replace(/\*\*(NOCTURNIDADES:)\*\*/gi, '**Nocturnidad:**');
    return normalized;
  }

  // Patrones comunes que deberían estar en negrita (usando Markdown)
  const patterns: Array<[RegExp, string]> = [
    [/^(Tarifa mensual:)/m, '**$1**'],
    [/^(Tarifa semanal:)/m, '**$1**'],
    [/^(Precio diario:)/m, '**$1**'],
    [/^(Precio jornada:)/m, '**$1**'],
    [/^(Precio refuerzo:)/m, '**$1**'],
    [/^(Precio Día extra \/ Festivo:)/m, '**$1**'],
    [/^(Precio Travel Day:)/m, '**$1**'],
    [/^(Horas extras:)/m, '**$1**'],
    [/^(Turn around:)/m, '**$1**'],
    [/^(Nocturnidad:)/m, '**$1**'],
    [/^(Comida:)/m, '**$1**'],
    [/^(Cena:)/m, '**$1**'],
    [/^(Dieta completa sin pernocta:)/m, '**$1**'],
    [/^(Dieta completa y desayuno:)/m, '**$1**'],
    [/^(Gastos de bolsillo:)/m, '**$1**'],
    [/^(Gastos de Bolsillo:)/m, '**Gastos de bolsillo:**'],
  ];

  let result = normalized;
  for (const [pattern, replacement] of patterns) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

