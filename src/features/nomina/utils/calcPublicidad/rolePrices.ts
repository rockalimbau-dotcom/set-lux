import { loadCondModel } from '../cond';
import { ROLE_CODES_WITH_PR_SUFFIX, roleLabelFromCode, stripRoleSuffix } from '@shared/constants/roles';
import {
  buildProjectRoleId,
  findProjectRoleById,
  findProjectRoleByLegacyCode,
  normalizeProjectRoleCatalog,
} from '@shared/utils/projectRoles';
import { DEFAULT_PRICE_ROWS, DEFAULT_PARAMS } from './rolePricesConstants';
import { num, getNumField } from './rolePricesHelpers';
import { persistDefaultPrices, persistDefaultParams } from './rolePricesPersistence';
import { calculateRolePrices } from './rolePricesCalculation';

/**
 * Make role prices function for diario mode
 */
export function makeRolePrices(project: any) {
  const roleCatalog = normalizeProjectRoleCatalog(project);
  // Forzar el modo a diario para que loadCondModel cargue las condiciones correctas
  const projectWithMode = {
    ...project,
    conditions: {
      ...project?.conditions,
      tipo: 'diario'
    }
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
  
  const model = loadCondModel(projectWithMode, 'diario');
  let basePriceRows = model?.prices || {};
  const prelightPriceRows = model?.pricesPrelight || {};
  const pickupPriceRows = model?.pricesPickup || {};
  let p = model?.params || {};

  // Fallback absoluto: si por cualquier motivo aún no hay precios en el modelo,
  // usar una tabla por defecto para que Nómina funcione desde el primer render.
  if (!basePriceRows || Object.keys(basePriceRows).length === 0) {
    basePriceRows = DEFAULT_PRICE_ROWS;
    persistDefaultPrices(projectWithMode, basePriceRows);
  }

  if (!p || Object.keys(p).length === 0) {
    p = DEFAULT_PARAMS;
    persistDefaultParams(projectWithMode, p);
  }

  // Helper para normalizar strings
  const normalizeStr = (s: string) => {
    const raw = String(s || '');
    const upper = raw.toUpperCase();
    const withoutSuffix = ROLE_CODES_WITH_PR_SUFFIX.has(upper) ? raw : raw.replace(/[PR]$/i, '');
    return withoutSuffix.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
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
    const upperRole = roleStr.toUpperCase();
    const roleNorm = normalizeLabel(roleStr);
    const hasSuffix = /[PR]$/i.test(roleStr) && !ROLE_CODES_WITH_PR_SUFFIX.has(upperRole) && !KNOWN_LABELS.has(roleNorm);
    const hasP = hasSuffix && /P$/i.test(roleStr);
    const hasR = hasSuffix && /R$/i.test(roleStr);
    
    if (hasP) {
      // Si hay tabla de prelight, intentar usarla; si no, usar base
      const baseRole = roleStr.slice(0, -1);
      if (Object.keys(prelightPriceRows).length > 0) {
        // Buscar por nombre exacto o normalizado
        if (prelightPriceRows[baseRole]) {
          return prelightPriceRows;
        }
        const baseRoleNorm = normalizeStr(baseRole);
        if (Object.keys(prelightPriceRows).some(k => normalizeStr(k) === baseRoleNorm)) {
          return prelightPriceRows;
        }
      }
      return basePriceRows;
    } else if (hasR) {
      // Si hay tabla de pickup, intentar usarla; si no, usar base
      const baseRole = roleStr.slice(0, -1);
      if (Object.keys(pickupPriceRows).length > 0) {
        // Buscar por nombre exacto o normalizado
        if (pickupPriceRows[baseRole]) {
          return pickupPriceRows;
        }
        const baseRoleNorm = normalizeStr(baseRole);
        if (Object.keys(pickupPriceRows).some(k => normalizeStr(k) === baseRoleNorm)) {
          return pickupPriceRows;
        }
      }
      return basePriceRows;
    }
    // Sin sufijo, usar tabla base
    return basePriceRows;
  };

  const hasPriceRowMatch = (priceTable: Record<string, any>, candidates: string[]): boolean => {
    const picked = findPriceRow(priceTable, candidates.filter(Boolean));
    return !!(picked.row && Object.keys(picked.row).length > 0);
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
    let priceRows = getPriceTable(roleCode);
    const strictCustomCandidates = [
      options?.roleId,
      options?.roleLabel,
    ].filter(Boolean) as string[];

    // Si el rol viene por prelight/recogida y es custom, solo usar esa tabla
    // cuando exista una fila específica del rol custom. Si no, debemos caer a
    // la tabla base del custom para no heredar el precio del rol E por error.
    if (
      priceRows !== basePriceRows &&
      strictCustomCandidates.length > 0 &&
      !String(options?.roleId || '').trim().endsWith('_default') &&
      !hasPriceRowMatch(priceRows, strictCustomCandidates)
    ) {
      priceRows = basePriceRows;
    }

    // Si no encontramos en la tabla específica, usar base como fallback
    const fallbackPriceRows = basePriceRows;

    let priceResult = calculateRolePrices({
      normalized,
      baseNorm,
      roleCandidates,
      baseCandidates,
      priceRows,
      basePriceRows: fallbackPriceRows, // Pasar tabla base para buscar roles base de refuerzos
      p,
    });
    
    // Si no encontramos precios en la tabla específica, intentar con la base como fallback
    if ((!priceResult.jornada || priceResult.jornada === 0) && priceRows !== fallbackPriceRows) {
      const fallbackResult = calculateRolePrices({
        normalized,
        baseNorm,
        roleCandidates,
        baseCandidates,
        priceRows: fallbackPriceRows,
        basePriceRows: fallbackPriceRows,
        p,
      });
      // Solo usar fallback si tiene precios válidos
      if (fallbackResult.jornada && fallbackResult.jornada > 0) {
        priceResult = fallbackResult;
      }
    }
    
    const { jornada, halfJornada, travelDay, horaExtra, holidayDay, row } = priceResult;
    const materialPropioValue = getNumField(row, ['Material propio', 'Material Propio']) || 0;
    const rawMaterialType =
      (row?.['Material propio tipo'] ?? row?.['Material Propio tipo'] ?? '').toString().trim();
    const materialPropioType =
      rawMaterialType === 'semanal' || rawMaterialType === 'diario' || rawMaterialType === 'unico' ? rawMaterialType : 'diario';

    const result = {
      jornada,
      halfJornada,
      travelDay,
      horaExtra,
      holidayDay,
      materialPropioValue,
      materialPropioType,
      transporte: num(p.transporteDia) || 0,
      km: num(p.kilometrajeKm) || 0,
      dietas: {
        Desayuno: num(p.dietaDesayuno) || 0,
        Comida: num(p.dietaComida) || 0,
        Cena: num(p.dietaCena) || 0,
        'Dieta sin pernoctar': num(p.dietaSinPernocta) || 0,
        'Dieta con pernocta': num(p.dietaAlojDes) || 0,
        'Gastos de bolsillo': num(p.gastosBolsillo) || 0,
      },
      // Campos específicos de publicidad
      cargaDescarga: getNumField(row, ['Carga/descarga', 'Carga descarga', 'Carga/Descarga', 'Carga y descarga']) || 0,
      localizacionTecnica: getNumField(row, ['Localización técnica', 'Localizacion tecnica', 'Localización', 'Localizacion']) || 0,
      factorHoraExtraFestiva: num(p.factorHoraExtraFestiva) || 1.5,
    };

    return result;
  };

  return { getForRole };
}
