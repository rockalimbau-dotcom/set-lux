import { loadCondModel } from '../cond';
import { ROLE_CODES_WITH_PR_SUFFIX, roleLabelFromCode, stripRoleSuffix } from '@shared/constants/roles';
import {
  buildProjectRoleId,
  findProjectRoleById,
  findProjectRoleByLegacyCode,
  normalizeProjectRoleCatalog,
} from '@shared/utils/projectRoles';

/**
 * Create a role prices function for a project
 */
export function makeRolePrices(project: any) {
  const model = loadCondModel(project);
  const roleCatalog = normalizeProjectRoleCatalog(project);
  const basePriceRows = model?.prices || {};
  const prelightPriceRows = model?.pricesPrelight || {};
  const pickupPriceRows = model?.pricesPickup || {};
  const p = model?.params || {};

  // Debug removed to improve performance

  const num = (v: unknown) => {
    if (v == null || v === '') return 0;
    const s = String(v)
      .trim()
      .replace(/\u00A0/g, '')
      .replace(/[€%]/g, '')
      .replace(/\s+/g, '');
    const t =
      s.includes(',') && s.includes('.')
        ? s.replace(/\./g, '').replace(',', '.')
        : s.replace(',', '.');
    const n = Number(t);
    return isFinite(n) ? n : 0;
  };

  const normalizeStr = (s: unknown): string => {
    const raw = String(s == null ? '' : s);
    const upper = raw.toUpperCase();
    const withoutSuffix = ROLE_CODES_WITH_PR_SUFFIX.has(upper) ? raw : raw.replace(/[PR]$/i, '');
    return withoutSuffix
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const normalizeLabel = (s: unknown): string =>
    String(s == null ? '' : s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  
  const KNOWN_LABELS = new Set(
    [
      'Gaffer',
      'Best boy',
      'Eléctrico',
      'Eléctrico/a',
      'Auxiliar',
      'Meritorio',
      'Técnico de mesa',
      'Finger boy',
      'Rigger',
      'Rigging Gaffer',
      'Rigging Best Boy',
      'Rigging Eléctrico',
      'Técnico de Generador',
      'Grupista eléctrico',
      'Chofer eléctrico',
      'Eléctrico de potencia',
      'Técnico de prácticos',
    ].map(normalizeLabel)
  );

  // Determinar qué tabla de precios usar según el rol
  const getPriceTable = (roleCode: string): Record<string, any> => {
    const roleStr = String(roleCode || '');
    // Detectar si el rol tiene sufijo P (prelight) o R (pickup)
    // Evitar confundir roles base como "Gaffer" (termina en r) con pickup.
    const roleNorm = normalizeLabel(roleStr);
    const upperRole = roleStr.toUpperCase();
    const hasSuffix = /[PR]$/i.test(roleStr) && !KNOWN_LABELS.has(roleNorm) && !ROLE_CODES_WITH_PR_SUFFIX.has(upperRole);
    const hasP = hasSuffix && /P$/i.test(roleStr);
    const hasR = hasSuffix && /R$/i.test(roleStr);
    
    if (hasP) {
      // Si hay tabla de prelight y el rol base existe, usar prelight; si no, usar base
      const baseRole = roleStr.slice(0, -1);
      if (prelightPriceRows[baseRole] || Object.keys(prelightPriceRows).some(k => normalizeStr(k) === normalizeStr(baseRole))) {
        return prelightPriceRows;
      }
      return basePriceRows;
    } else if (hasR) {
      // Si hay tabla de pickup y el rol base existe, usar pickup; si no, usar base
      const baseRole = roleStr.slice(0, -1);
      if (pickupPriceRows[baseRole] || Object.keys(pickupPriceRows).some(k => normalizeStr(k) === normalizeStr(baseRole))) {
        return pickupPriceRows;
      }
      return basePriceRows;
    }
    // Sin sufijo, usar tabla base
    return basePriceRows;
  };

  const hasPriceRowMatch = (priceTable: Record<string, any>, candidates: string[]): boolean => {
    const picked = findPriceRow(candidates.filter(Boolean), priceTable);
    return !!(picked.row && Object.keys(picked.row).length > 0);
  };

  const findPriceRow = (candidates: string[], priceTable: Record<string, any>) => {
    // 1) Exactos primero
    for (const cand of candidates) {
      if (cand && priceTable[cand]) return { row: priceTable[cand], key: cand };
    }
    // 2) Match insensible a acentos/mayúsculas/sufijo P/R
    const candNorms = candidates.map(c => normalizeStr(c));
    for (const key of Object.keys(priceTable)) {
      const keyNorm = normalizeStr(key);
      if (candNorms.includes(keyNorm)) return { row: priceTable[key], key };
    }
    // 3) Intento extra: si keys vienen con sufijo P/R, comparar sin sufijo
    for (const key of Object.keys(priceTable)) {
      const keyBaseNorm = normalizeStr(stripRoleSuffix(String(key)));
      if (candNorms.includes(keyBaseNorm)) return { row: priceTable[key], key };
    }
    return { row: {} as any, key: '' };
  };

  // Intenta obtener un número desde una fila probando varias variantes de nombre de columna
  const getNumField = (row: any, candidates: string[]): number => {
    if (!row || typeof row !== 'object') return 0;
    
    for (const key of candidates) {
      const direct = row[key];
      if (direct != null && direct !== '') return num(direct);
    }
    // Búsqueda case-insensitive por si cambian mayúsculas/acentos
    const lowerToValue = new Map<string, unknown>();
    for (const k of Object.keys(row)) lowerToValue.set(k.toLowerCase(), row[k]);
    for (const key of candidates) {
      const v = lowerToValue.get(key.toLowerCase());
      if (v != null && v !== '') return num(v);
    }
    return 0;
  };

  const getStringField = (row: any, candidates: string[]): string => {
    if (!row || typeof row !== 'object') return '';
    for (const key of candidates) {
      const direct = row[key];
      if (direct != null && String(direct).trim() !== '') return String(direct).trim();
    }
    const lowerToValue = new Map<string, unknown>();
    for (const k of Object.keys(row)) lowerToValue.set(k.toLowerCase(), row[k]);
    for (const key of candidates) {
      const v = lowerToValue.get(key.toLowerCase());
      if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
  };

  const findRoleDefinition = (
    roleCode: string,
    options?: { roleId?: string | null; roleLabel?: string | null }
  ) => {
    const byId = findProjectRoleById(roleCatalog, options?.roleId);
    if (byId) return byId;

    const roleLabel = String(options?.roleLabel || '').trim();
    if (roleLabel) {
      const byLabel =
        roleCatalog.roles.find(role => normalizeLabel(role.label) === normalizeLabel(roleLabel)) ||
        null;
      if (byLabel) return byLabel;
    }

    const byCode = findProjectRoleByLegacyCode(roleCatalog, roleCode);
    if (byCode) return byCode;

    return null;
  };

  const buildRoleCandidates = (
    roleCode: string,
    options?: { roleId?: string | null; roleLabel?: string | null }
  ): string[] => {
    const roleDef = findRoleDefinition(roleCode, options);
    const normalizedRoleCode = stripRoleSuffix(String(roleCode || ''));
    const candidates = [
      options?.roleId,
      roleDef?.id,
      buildProjectRoleId(normalizedRoleCode),
      options?.roleLabel,
      roleDef?.label,
      roleCode,
      normalizedRoleCode,
      roleDef?.legacyCode,
      roleDef?.baseRole,
      roleLabelFromCode(normalizedRoleCode),
    ].filter(Boolean) as string[];

    return Array.from(new Set(candidates));
  };

  const getForRole = (
    roleCode: string,
    baseRoleCode: string | null = null,
    options?: { roleId?: string | null; roleLabel?: string | null }
  ) => {
    const normalized = stripRoleSuffix(String(roleCode || ''));
    const baseNorm = stripRoleSuffix(String(baseRoleCode || '')) || normalized;
    const roleCandidates = buildRoleCandidates(roleCode, options);
    const baseCandidates = baseRoleCode
      ? buildRoleCandidates(baseRoleCode, {
          roleLabel: baseRoleCode,
        })
      : buildRoleCandidates(normalized);

    // Determinar qué tabla usar según el rol
    let priceTable = getPriceTable(roleCode);
    const strictCustomCandidates = [
      options?.roleId,
      options?.roleLabel,
    ].filter(Boolean) as string[];
    if (
      priceTable !== basePriceRows &&
      strictCustomCandidates.length > 0 &&
      !String(options?.roleId || '').trim().endsWith('_default') &&
      !hasPriceRowMatch(priceTable, strictCustomCandidates)
    ) {
      priceTable = basePriceRows;
    }
    // Para refuerzos, siempre usar basePriceRows, no prelight/pickup
    const basePriceTable = (normalized === 'REF' || (normalized.startsWith('REF') && normalized.length > 3))
      ? basePriceRows
      : (baseRoleCode ? getPriceTable(baseRoleCode) : priceTable);
    
    // Si no encontramos en la tabla específica, usar base como fallback
    const pickedRow = findPriceRow(roleCandidates, priceTable);
    let row = pickedRow.row;
    if (!row || Object.keys(row).length === 0) {
      const fallbackRow = findPriceRow(roleCandidates, basePriceRows);
      row = fallbackRow.row;
    }
    
    // Para refuerzos, siempre buscar baseRow en basePriceRows (tabla base)
    // Para otros roles, usar basePriceTable que puede ser prelight/pickup
    const tableForBaseRow = (normalized === 'REF' || (normalized.startsWith('REF') && normalized.length > 3))
      ? basePriceRows
      : basePriceTable;
    const pickedBase = findPriceRow(baseCandidates, tableForBaseRow);
    let baseRow = pickedBase.row;
    if (!baseRow || Object.keys(baseRow).length === 0) {
      const fallbackBase = findPriceRow(baseCandidates, basePriceRows);
      baseRow = fallbackBase.row;
    }
    
    // Eléctrico siempre se busca en la tabla base
    const pickedElec = findPriceRow(['Eléctrico', 'Electrico', 'E'], basePriceRows);
    const elecRow = pickedElec.row;

    const divTravel = num(p.divTravel) || 2;

    let jornada, halfJornada, travelDay, horaExtra, holidayDay, materialPropioValue;
    let materialPropioType = '';
    if (normalized === 'REF' || (normalized.startsWith('REF') && normalized.length > 3)) {
      // Si es REF o REF + rol base (REFG, REFBB, etc.), buscar "Precio refuerzo" en la fila correspondiente
      // Para refuerzos, SIEMPRE buscar directamente en basePriceRows, ignorar prelight/pickup
      let targetRow: any = {};
      
      if (normalized.startsWith('REF') && normalized.length > 3) {
        // Extraer el rol base (G, BB, E, etc.)
        const baseRole = normalized.substring(3);
        // Buscar directamente en basePriceRows (tabla base, no prelight/pickup)
        const baseRolePicked = findPriceRow(buildRoleCandidates(baseRole), basePriceRows);
        targetRow = baseRolePicked.row || {};
      } else if (normalized === 'REF' && baseNorm && baseNorm !== 'REF') {
        // Si es REF con baseRoleCode (ej: getForRole('REF', 'GAFFER')), usar la fila del rol base
        // Buscar directamente en basePriceRows (tabla base, no prelight/pickup)
        const baseRolePicked = findPriceRow(baseCandidates, basePriceRows);
        targetRow = baseRolePicked.row || {};
      }
      
      // Si targetRow está vacío, intentar con baseRow como último recurso
      if (!targetRow || Object.keys(targetRow).length === 0) {
        targetRow = baseRow || {};
      }
      
      const refFromTarget = getNumField(targetRow, ['Precio refuerzo', 'Precio Refuerzo', 'Refuerzo']);
      const jornadaBase =
        getNumField(targetRow, ['Precio jornada', 'Precio Jornada', 'Jornada', 'Precio dia', 'Precio día']) ||
        getNumField(baseRow, ['Precio jornada', 'Precio Jornada', 'Jornada', 'Precio dia', 'Precio día']) ||
        0;
      jornada = refFromTarget || jornadaBase;
      halfJornada =
        getNumField(targetRow, ['Precio 1/2 jornada', 'Precio medio día', 'Precio media jornada']) ||
        getNumField(baseRow, ['Precio 1/2 jornada', 'Precio medio día', 'Precio media jornada']) ||
        getNumField(elecRow, ['Precio 1/2 jornada', 'Precio medio día', 'Precio media jornada']) ||
        0;
      const travelBase =
        getNumField(targetRow, ['Travel day', 'Travel Day', 'Travel', 'Día de viaje', 'Dia de viaje', 'Día travel', 'Dia travel', 'TD']) ||
        getNumField(baseRow, ['Travel day', 'Travel Day', 'Travel', 'Día de viaje', 'Dia de viaje', 'Día travel', 'Dia travel', 'TD']);
      travelDay = travelBase || (jornada ? jornada / divTravel : 0);
      horaExtra =
        getNumField(elecRow, ['Horas extras', 'Horas Extras', 'Hora extra', 'Horas extra', 'HE', 'Hora Extra']) ||
        getNumField(targetRow, ['Horas extras', 'Horas Extras', 'Hora extra', 'Horas extra', 'HE', 'Hora Extra']) ||
        0;
      holidayDay = 
        getNumField(elecRow, ['Precio Día extra/Festivo', 'Precio Día extra/festivo', 'Día extra/Festivo', 'Día festivo', 'Festivo']) ||
        getNumField(targetRow, ['Precio Día extra/Festivo', 'Precio Día extra/festivo', 'Día extra/Festivo', 'Día festivo', 'Festivo']) ||
        0;
      materialPropioValue =
        getNumField(targetRow, ['Material propio', 'Material Propio']) ||
        getNumField(baseRow, ['Material propio', 'Material Propio']) ||
        0;
      materialPropioType =
        getStringField(targetRow, ['Material propio tipo', 'Material Propio tipo']) ||
        getStringField(baseRow, ['Material propio tipo', 'Material Propio tipo']) ||
        '';
    } else {
      jornada = getNumField(row, ['Precio jornada', 'Precio Jornada', 'Jornada', 'Precio dia', 'Precio día']) || 0;
      halfJornada =
        getNumField(row, ['Precio 1/2 jornada', 'Precio medio día', 'Precio media jornada']) ||
        0;
      travelDay = getNumField(row, ['Travel day', 'Travel Day', 'Travel', 'Día de viaje', 'Dia de viaje', 'Día travel', 'Dia travel', 'TD']) || (jornada ? jornada / divTravel : 0);
      horaExtra = getNumField(row, ['Horas extras', 'Horas Extras', 'Hora extra', 'Horas extra', 'HE', 'Hora Extra']) || 0;
      holidayDay = getNumField(row, ['Precio Día extra/Festivo', 'Precio Día extra/festivo', 'Día extra/Festivo', 'Día festivo', 'Festivo']) || 0;
      materialPropioValue = getNumField(row, ['Material propio', 'Material Propio']) || 0;
      materialPropioType = getStringField(row, ['Material propio tipo', 'Material Propio tipo']) || '';
    }

    const result = {
      jornada,
      halfJornada,
      travelDay,
      horaExtra,
      holidayDay,
      materialPropioValue: materialPropioValue || 0,
      materialPropioType: materialPropioType === 'unico' ? 'unico' : materialPropioType === 'diario' ? 'diario' : 'semanal',
      transporte: num(p.transporteDia),
      km: num(p.kilometrajeKm),
      dietas: {
        Comida: num(p.dietaComida),
        Cena: num(p.dietaCena),
        'Dieta sin pernoctar': num(p.dietaSinPernocta),
        'Dieta con pernocta': num(p.dietaAlojDes),
        'Gastos de bolsillo': num(p.gastosBolsillo),
      },
    };

    return result;
  };

  return { getForRole };
}
