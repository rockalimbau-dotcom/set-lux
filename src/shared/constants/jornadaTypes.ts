/** Canonical jornada type labels used in calendar / needs / planning. */

export const JORNADA_SEXTO_DIA = 'Sexto día' as const;
export const JORNADA_SEXTO_DIA_HALF = 'Sexto día 1/2 jornada' as const;

export const SEXTO_DIA_JORNADA_TYPES = [JORNADA_SEXTO_DIA, JORNADA_SEXTO_DIA_HALF] as const;

/** Sexto día solo aplica con condiciones semanal o mensual. */
export function supportsSextoDiaJornada(conditionsMode?: string | null): boolean {
  const mode = conditionsMode || 'semanal';
  return mode === 'semanal' || mode === 'mensual';
}

function withoutSextoDia<T extends string>(options: readonly T[]): T[] {
  return options.filter(o => !SEXTO_DIA_JORNADA_TYPES.includes(o as (typeof SEXTO_DIA_JORNADA_TYPES)[number])) as T[];
}

/** Necesidades calendar row + member jornada dropdowns */
export const NECESIDADES_JORNADA_OPTIONS = [
  'Localizar',
  'Oficina',
  'Carga',
  'Pruebas de cámara',
  '1/2 jornada',
  'Rodaje',
  'Rodaje Festivo',
  JORNADA_SEXTO_DIA,
  JORNADA_SEXTO_DIA_HALF,
  'Travel Day',
  'Prelight',
  'Recogida',
  'Descarga',
  'Descanso',
  'Fin',
] as const;

export function getNecesidadesJornadaOptions(conditionsMode?: string | null): readonly string[] {
  if (supportsSextoDiaJornada(conditionsMode)) return NECESIDADES_JORNADA_OPTIONS;
  return withoutSextoDia(NECESIDADES_JORNADA_OPTIONS);
}

/** Planificación week card — tipo de jornada */
export const PLANIFICACION_JORNADA_OPTIONS = [
  'Rodaje',
  'Oficina',
  'Carga',
  'Descarga',
  'Localizar',
  'Travel Day',
  'Rodaje Festivo',
  JORNADA_SEXTO_DIA,
  JORNADA_SEXTO_DIA_HALF,
  'Fin',
  'Descanso',
] as const;

export function getPlanificacionJornadaOptions(conditionsMode?: string | null): readonly string[] {
  if (supportsSextoDiaJornada(conditionsMode)) return PLANIFICACION_JORNADA_OPTIONS;
  return withoutSextoDia(PLANIFICACION_JORNADA_OPTIONS);
}

/** Work-day types that expect a full base team in necesidades */
export const NECESIDADES_FULL_TEAM_JORNADA_TYPES = [
  'Rodaje',
  'Pruebas de cámara',
  'Carga',
  'Descarga',
  'Travel Day',
  'Prelight',
  'Recogida',
  'Rodaje Festivo',
  JORNADA_SEXTO_DIA,
  JORNADA_SEXTO_DIA_HALF,
] as const;

export function getNecesidadesFullTeamJornadaTypes(conditionsMode?: string | null): readonly string[] {
  if (supportsSextoDiaJornada(conditionsMode)) return NECESIDADES_FULL_TEAM_JORNADA_TYPES;
  return withoutSextoDia(NECESIDADES_FULL_TEAM_JORNADA_TYPES);
}
