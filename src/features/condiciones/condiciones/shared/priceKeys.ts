import { AnyRecord } from '@shared/types/common';

/** Legacy storage key kept for backward compatibility when loading old projects. */
export const PRICE_KEY_LEGACY_FESTIVO = 'Precio Día extra/Festivo';

export const PRICE_KEY_FESTIVO = 'Precio Festivo';
export const PRICE_KEY_SEXTO_DIA = 'Sexto día';
export const PRICE_KEY_SEXTO_DIA_HALF = 'Sexto día 1/2 jornada';

export const FACTOR_SEXTO_DIA = 1.5;

export const PRICE_HEADERS: string[] = [
  'Precio mensual',
  'Precio semanal',
  'Precio diario',
  'Precio jornada',
  'Precio 1/2 jornada',
  PRICE_KEY_SEXTO_DIA_HALF,
  'Precio refuerzo',
  'Material propio',
  PRICE_KEY_FESTIVO,
  PRICE_KEY_SEXTO_DIA,
  'Travel day',
  'Horas extras',
];

/** Diario / publicidad: sin precios de sexto día (solo semanal y mensual). */
export const PRICE_HEADERS_DIARIO: string[] = [
  'Precio jornada',
  'Precio 1/2 jornada',
  'Material propio',
  PRICE_KEY_FESTIVO,
  'Localización técnica',
  'Carga/descarga',
  'Travel day',
  'Horas extras',
];

export const FESTIVO_PRICE_FIELD_ALIASES = [
  PRICE_KEY_FESTIVO,
  PRICE_KEY_LEGACY_FESTIVO,
  'Precio Día extra/festivo',
  'Día extra/Festivo',
  'Día festivo',
  'Festivo',
] as const;

export const SEXTO_DIA_PRICE_FIELD_ALIASES = [PRICE_KEY_SEXTO_DIA, 'Sexto dia', 'Sexto día'] as const;

export const SEXTO_DIA_HALF_PRICE_FIELD_ALIASES = [
  PRICE_KEY_SEXTO_DIA_HALF,
  'Sexto dia 1/2 jornada',
  'Sexto día media jornada',
] as const;

export function migratePriceRow(row: AnyRecord | undefined): AnyRecord {
  if (!row || typeof row !== 'object') return {};
  const next: AnyRecord = { ...row };
  if (
    next[PRICE_KEY_LEGACY_FESTIVO] !== undefined &&
    (next[PRICE_KEY_FESTIVO] === undefined || next[PRICE_KEY_FESTIVO] === '')
  ) {
    next[PRICE_KEY_FESTIVO] = next[PRICE_KEY_LEGACY_FESTIVO];
  }
  delete next[PRICE_KEY_LEGACY_FESTIVO];
  return next;
}

export function migratePricesMap(prices: AnyRecord | undefined): AnyRecord {
  if (!prices || typeof prices !== 'object') return {};
  const next: AnyRecord = {};
  Object.keys(prices).forEach(role => {
    next[role] = migratePriceRow(prices[role] as AnyRecord);
  });
  return next;
}

export const SEMANAL_DERIVED_PRICE_KEYS = [
  'Precio mensual',
  'Precio diario',
  'Precio jornada',
  'Precio 1/2 jornada',
  PRICE_KEY_SEXTO_DIA_HALF,
  PRICE_KEY_FESTIVO,
  PRICE_KEY_SEXTO_DIA,
  'Travel day',
  'Horas extras',
] as const;

export const MENSUAL_DERIVED_PRICE_KEYS = [
  'Precio semanal',
  'Precio diario',
  'Precio jornada',
  'Precio 1/2 jornada',
  PRICE_KEY_SEXTO_DIA_HALF,
  PRICE_KEY_FESTIVO,
  PRICE_KEY_SEXTO_DIA,
  'Travel day',
  'Horas extras',
] as const;

export const PUBLICIDAD_DERIVED_PRICE_KEYS = [
  'Precio 1/2 jornada',
  PRICE_KEY_FESTIVO,
  'Travel day',
  'Horas extras',
  'Carga/descarga',
] as const;

export function migrateConditionsPrices(model: AnyRecord): AnyRecord {
  if (!model || typeof model !== 'object') return model;
  return {
    ...model,
    prices: migratePricesMap(model.prices),
    pricesPrelight: model.pricesPrelight ? migratePricesMap(model.pricesPrelight) : model.pricesPrelight,
    pricesPickup: model.pricesPickup ? migratePricesMap(model.pricesPickup) : model.pricesPickup,
  };
}
