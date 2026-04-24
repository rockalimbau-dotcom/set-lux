import { useMemo } from 'react';
import { RowIn, RolePrices, WindowOverride } from '../MonthSectionTypes';
import { calculateTotalDietas, buildDietasLabel, detectMissingPrices } from '../MonthSectionUtils';
import { calculateTotalWorkingDays, determineRoleDisplay } from './rowHelpers';
import { getEffectiveRolePrices } from './priceHelpers';
import { getFilteredRowData, getValueWithOverride } from './filteredDataHelpers';
import { calculateDiarioTotals, calculateStandardTotals } from './calculationHelpers';

interface UseEnrichedRowsProps {
  rows: RowIn[];
  weeksForMonth: any[];
  filterISO: (iso: string) => boolean;
  rolePrices: RolePrices;
  windowOverrideMap: WindowOverride | null;
  refuerzoSet: Set<string>;
  stripPR: (r: string) => string;
  calcWorkedBreakdown: (
    weeks: any[],
    filterISO: (iso: string) => boolean,
    person: { role: string; roleId?: string; personId?: string; name: string; source?: string }
  ) => {
    workedDays: number;
    travelDays: number;
    workedBase: number;
    workedPre: number;
    workedPick: number;
    holidayDays: number;
    halfDays?: number;
    rodaje?: number;
    pruebasCamara?: number;
    oficina?: number;
    travelDay?: number;
    carga?: number;
    descarga?: number;
    localizar?: number;
    rodajeFestivo?: number;
  };
  filteredData: Map<string, any> | null;
  dateFrom: string;
  dateTo: string;
  projectMode: 'semanal' | 'mensual' | 'diario';
  calculateWorkingDaysInMonthValue: number;
  priceDays: number;
  roleLabelFromCode: (code: string) => string;
  isFirstProjectMonth: boolean;
}

export function useEnrichedRows({
  rows,
  weeksForMonth,
  filterISO,
  rolePrices,
  windowOverrideMap,
  refuerzoSet,
  stripPR,
  calcWorkedBreakdown,
  filteredData,
  dateFrom,
  dateTo,
  projectMode,
  calculateWorkingDaysInMonthValue,
  priceDays,
  roleLabelFromCode,
  isFirstProjectMonth,
}: UseEnrichedRowsProps) {
  const enriched = useMemo(() => {
    const mergeKeyFor = (row: any) => {
      const personId = String((row as any).personId || '').trim();
      if (personId) return `person:${personId}`;
      return `${row.role}__${row.name}`;
    };

    const visibleBlocksByKey = new Map<string, Set<string>>();
    for (const row of rows) {
      const visibleKey = mergeKeyFor(row);
      const block = (row as any)._displayBlock || 'base';
      if (!visibleBlocksByKey.has(visibleKey)) {
        visibleBlocksByKey.set(visibleKey, new Set<string>());
      }
      visibleBlocksByKey.get(visibleKey)!.add(block);
    }

    const enrichedRows = rows.map(r => {
      const roleForBreakdown = (r as any)._matchRole || r.role;
      const visibleKey = mergeKeyFor(r);
      const siblingBlocks = visibleBlocksByKey.get(visibleKey) || new Set<string>();
      const rowDisplayBlock = (r as any)._displayBlock || 'base';
      const sourceForBreakdown =
        rowDisplayBlock === 'extra'
          ? 'ref'
          : rowDisplayBlock === 'base' &&
            (siblingBlocks.has('pre') || siblingBlocks.has('pick') || siblingBlocks.has('extra'))
            ? 'base-strict'
          : r.source;
      const person = {
        role: roleForBreakdown,
        roleId: (r as any).roleId,
        personId: (r as any).personId,
        name: r.name,
        source: sourceForBreakdown,
      };
      const breakdown = calcWorkedBreakdown(weeksForMonth, filterISO, person);
      const {
        workedDays,
        travelDays,
        workedBase,
        workedPre,
        workedPick,
        holidayDays,
        halfDays,
        rodaje,
        pruebasCamara,
        oficina,
        travelDay,
        carga,
        descarga,
        localizar,
        rodajeFestivo,
        prelight,
        recogida,
      } = breakdown;

      // Obtener precios del rol
      const keyNoPR = `${stripPR(roleForBreakdown)}__${r.name}`;
      const baseRoleCode = stripPR(roleForBreakdown);
      const baseRoleLabel = roleLabelFromCode(baseRoleCode);
      
      // Preservar el sufijo P/R del rol original para determinar qué tabla de precios usar
      const originalRole = roleForBreakdown || '';
      const hasP = originalRole.endsWith('P') || originalRole.endsWith('p');
      const hasR = originalRole.endsWith('R') || originalRole.endsWith('r');
      const needsPrelightPrice = !hasP && !hasR && workedPre > 0 && workedBase === 0 && workedPick === 0;
      const needsPickupPrice = !hasP && !hasR && workedPick > 0 && workedBase === 0 && workedPre === 0;
      
      // Si el rol empieza con "REF" (REFG, REFBB, etc.) o está en refuerzoSet, usar lógica de refuerzo
      const isRefuerzo = (r.role && r.role.startsWith('REF') && r.role.length > 3) || refuerzoSet.has(keyNoPR);

      // Calcular total días trabajados según el modo
      // Para refuerzos en mensual, usar solo los días específicos donde están marcados
      const totalDiasTrabajados = calculateTotalWorkingDays(
        projectMode,
        calculateWorkingDaysInMonthValue,
        workedDays,
        rodaje,
        pruebasCamara,
        oficina,
        prelight,
        recogida,
        isRefuerzo
      );
      
      // Construir el rol completo con sufijo para getForRole si es prelight o pickup
      // getForRole normaliza el rol y busca en las tablas, así que podemos pasar el nombre con sufijo
      let roleForPriceLookup = baseRoleCode;
      if (!isRefuerzo) {
        if (hasP || needsPrelightPrice) {
          // Consultar precios por código mantiene el vínculo con el roleId default.
          roleForPriceLookup = `${baseRoleCode}P`;
        } else if (hasR || needsPickupPrice) {
          roleForPriceLookup = `${baseRoleCode}R`;
        }
      }
      
      // Para refuerzos, pasar tanto el código como el label para que findPriceRow pueda buscar ambos
      // Las tablas de precios pueden estar indexadas por nombre completo (Gaffer) o código (G)
      const pr = isRefuerzo
        ? rolePrices.getForRole('REF', baseRoleCode || baseRoleLabel, {
            roleId: (r as any).roleId || null,
            roleLabel: (r as any).roleLabel || baseRoleLabel || null,
          })
        : rolePrices.getForRole(roleForPriceLookup, null, {
            roleId: (r as any).roleId || null,
            roleLabel: (r as any).roleLabel || baseRoleLabel || null,
          });

      // Obtener precios efectivos (maneja caso especial de diario)
      const effectivePr = getEffectiveRolePrices(pr, projectMode, refuerzoSet, keyNoPR, rolePrices, baseRoleLabel);

      // Preservar el rol original antes de la transformación para el badge
      const originalRoleForBadge = r.role || '';
      
      // Determinar role display
      const roleDisplay = determineRoleDisplay(r.role, baseRoleCode, workedBase, workedPre, workedPick);
      const roleForBadge = isRefuerzo ? originalRoleForBadge : roleDisplay;
      const displayBlock =
        rowDisplayBlock ||
        (hasP || needsPrelightPrice
          ? 'pre'
          : hasR || needsPickupPrice
          ? 'pick'
          : 'base');

      // Obtener override de ventana contable si existe
      const pKey = `${r.role}__${r.name}`;
      const ov =
        windowOverrideMap && 'get' in windowOverrideMap
          ? (windowOverrideMap as WindowOverride).get(pKey)
          : null;

      // Obtener datos filtrados
  const filteredRow = getFilteredRowData(r, filteredData, dateFrom, dateTo, refuerzoSet, stripPR);
      const useFilteredData = filteredRow !== null;

      // Obtener valores con override/filtrado
      // extrasValue tiene lógica especial: es la suma de horasExtra + turnAround si hay filteredRow
      const horasExtraValue = getValueWithOverride(ov, 'horasExtra', useFilteredData, filteredRow, r.horasExtra);
      const turnAroundValue = getValueWithOverride(ov, 'turnAround', useFilteredData, filteredRow, r.turnAround);
      const extrasValue =
        ov?.extras ??
        (useFilteredData && filteredRow ? filteredRow.horasExtra + filteredRow.turnAround : r.extras);
      const nocturnidadValue = getValueWithOverride(ov, 'nocturnidad', useFilteredData, filteredRow, r.nocturnidad);
      const penaltyLunchValue = getValueWithOverride(ov, 'penaltyLunch', useFilteredData, filteredRow, r.penaltyLunch);
      const transporteValue = getValueWithOverride(ov, 'transporte', useFilteredData, filteredRow, r.transporte);
      const kmValue = getValueWithOverride(ov, 'km', useFilteredData, filteredRow, r.km);
      const gasolinaValue = getValueWithOverride(ov, 'gasolina', useFilteredData, filteredRow, (r as any).gasolina || 0);
      const dietasMap = getValueWithOverride(ov, 'dietasCount', useFilteredData, filteredRow, r.dietasCount);
      const ticketValue = getValueWithOverride(ov, 'ticketTotal', useFilteredData, filteredRow, r.ticketTotal);
      const otherValue = getValueWithOverride(ov, 'otherTotal', useFilteredData, filteredRow, r.otherTotal);

      const totalDietas = calculateTotalDietas(dietasMap, effectivePr, ticketValue, otherValue);
      const rawMaterialPropioDays = getValueWithOverride(
        ov,
        'materialPropioDays',
        useFilteredData,
        filteredRow,
        (r as any).materialPropioDays || 0
      );
      const rawMaterialPropioWeeks = getValueWithOverride(
        ov,
        'materialPropioWeeks',
        useFilteredData,
        filteredRow,
        (r as any).materialPropioWeeks || 0
      );
      const materialPropioType = (effectivePr as any).materialPropioType || 'semanal';
      const materialPropioUnique =
        materialPropioType === 'unico' &&
        ((effectivePr as any).materialPropioValue || 0) > 0 &&
        isFirstProjectMonth
          ? 1
          : 0;
      const materialPropioDays = materialPropioType === 'unico' ? 0 : rawMaterialPropioDays;
      const materialPropioWeeks = materialPropioType === 'unico' ? 0 : rawMaterialPropioWeeks;

      // Calcular totales según el modo del proyecto
      let totals: {
        totalDias: number;
        totalHalfDays?: number;
        totalTravel: number;
        totalHolidays: number;
        totalExtras: number;
        totalTrans: number;
        totalKm: number;
        totalLocalizacion?: number;
        totalCargaDescarga?: number;
        totalMaterialPropio?: number;
        totalBruto: number;
      };

      if (projectMode === 'diario') {
        const publicidadTotals = calculateDiarioTotals(
          rodaje,
          pruebasCamara,
          oficina,
          localizar,
          carga,
          descarga,
          halfDays || 0,
          travelDays,
          holidayDays,
          horasExtraValue,
          turnAroundValue,
          nocturnidadValue,
          penaltyLunchValue,
          transporteValue,
          kmValue,
          gasolinaValue,
          totalDietas,
          effectivePr,
          prelight,
          recogida,
          materialPropioDays,
          materialPropioWeeks,
          materialPropioUnique
        );
        totals = publicidadTotals;
      } else {
        const standardTotals = calculateStandardTotals(
          projectMode,
          totalDiasTrabajados,
          workedDays,
          halfDays || 0,
          travelDays,
          holidayDays,
          horasExtraValue,
          turnAroundValue,
          nocturnidadValue,
          penaltyLunchValue,
          transporteValue,
          kmValue,
          gasolinaValue,
          totalDietas,
          effectivePr,
          priceDays,
          materialPropioDays,
          materialPropioWeeks,
          materialPropioUnique
        );
        totals = standardTotals;
      }

      // Detectar qué precios faltan para mostrar mensajes
      const missingPrices = detectMissingPrices(
        projectMode,
        {
          workedDays,
          halfDays,
          travelDays,
          holidayDays,
          horasExtra: horasExtraValue,
          turnAround: turnAroundValue,
          nocturnidad: nocturnidadValue,
          penaltyLunch: penaltyLunchValue,
          transporte: transporteValue,
          km: kmValue,
          gasolina: gasolinaValue,
          rodaje,
          oficina,
          localizar,
          carga,
          descarga,
          dietasMap,
          ticketValue,
          otherValue,
          totalDiasTrabajados,
          priceDays,
          precioMensual: (effectivePr as any).precioMensual,
        },
        effectivePr
      );

      const dietasLabel = buildDietasLabel(dietasMap, ticketValue, otherValue);

      const displayWorkedDays =
        projectMode === 'mensual' ? workedDays : totalDiasTrabajados;

      return {
        ...r,
        _rowKey: (r as any)._rowKey || mergeKeyFor(r),
        role: roleDisplay,
        _originalRole: roleForBadge, // Mostrar sufijo P/R cuando aplique
        _displayBlock: displayBlock,
        extras: extrasValue,
        horasExtra: horasExtraValue,
        turnAround: turnAroundValue,
        nocturnidad: nocturnidadValue,
        penaltyLunch: penaltyLunchValue,
        transporte: transporteValue,
        km: kmValue,
        gasolina: gasolinaValue,
        dietasCount: dietasMap,
        ticketTotal: ticketValue,
        otherTotal: otherValue,
        _worked: displayWorkedDays,
        _halfDays: halfDays || 0,
        _travel: travelDays,
        _holidays: holidayDays,
        _workedBase: workedBase,
        _workedPre: workedPre,
        _workedPick: workedPick,
        _rodaje: rodaje,
        _pruebasCamara: pruebasCamara,
        _oficina: oficina,
        _travelDay: travelDay,
        _carga: carga,
        _descarga: descarga,
        _localizar: localizar,
        _rodajeFestivo: rodajeFestivo,
        _prelight: prelight,
        _recogida: recogida,
        _totalDias: totals.totalDias,
        _totalHalfDays: totals.totalHalfDays || 0,
        _totalTravel: totals.totalTravel,
        _totalHolidays: totals.totalHolidays,
        _totalExtras: totals.totalExtras,
        _totalDietas: totalDietas,
        _totalTrans: totals.totalTrans,
        _totalKm: totals.totalKm,
        _totalGasolina: totals.totalGasolina || 0,
        _totalBruto: totals.totalBruto,
        _totalMaterialPropio: totals.totalMaterialPropio || 0,
        _totalLocalizacion: projectMode === 'diario' ? totals.totalLocalizacion || 0 : 0,
        _totalCargaDescarga: projectMode === 'diario' ? totals.totalCargaDescarga || 0 : 0,
        _localizarDays: projectMode === 'diario' ? (localizar || 0) : 0,
        _cargaDays: projectMode === 'diario' ? (carga || 0) : 0,
        _descargaDays: projectMode === 'diario' ? (descarga || 0) : 0,
        _materialPropioDays: materialPropioDays,
        _materialPropioWeeks: materialPropioWeeks,
        _materialPropioUnique: materialPropioUnique,
        _materialPropioType: materialPropioType,
        _dietasLabel: dietasLabel,
        _pr: effectivePr,
        _missingPrices: missingPrices,
        _roleVariants: [
          {
            role: roleDisplay,
            originalRole: roleForBadge,
            roleId: (r as any).roleId || null,
            roleLabel: (r as any).roleLabel || null,
            totalBruto: totals.totalBruto,
            totalDias: totals.totalDias,
          },
        ],
      };
    });

    const mergeDietasMaps = (a?: Map<string, number>, b?: Map<string, number>) => {
      const merged = new Map<string, number>();
      for (const [key, value] of a || []) merged.set(key, value);
      for (const [key, value] of b || []) {
        merged.set(key, (merged.get(key) || 0) + value);
      }
      return merged;
    };

    const mergeMissingPrices = (a: any, b: any) => {
      const merged = { ...(a || {}) };
      for (const [key, value] of Object.entries(b || {})) {
        merged[key] = merged[key] || value;
      }
      return merged;
    };

    const mergedByVisibleRow = new Map<string, any>();

    for (const row of enrichedRows) {
      const mergeKey = mergeKeyFor(row);
      const existing = mergedByVisibleRow.get(mergeKey);
      if (!existing) {
        mergedByVisibleRow.set(mergeKey, {
          ...row,
          _rowKey: mergeKey,
        });
        continue;
      }

      existing.extras += row.extras || 0;
      existing.horasExtra += row.horasExtra || 0;
      existing.turnAround += row.turnAround || 0;
      existing.nocturnidad += row.nocturnidad || 0;
      existing.penaltyLunch += row.penaltyLunch || 0;
      existing.transporte += row.transporte || 0;
      existing.km += row.km || 0;
      existing.gasolina += row.gasolina || 0;
      existing.ticketTotal += row.ticketTotal || 0;
      existing.otherTotal += row.otherTotal || 0;

      existing._worked += row._worked || 0;
      existing._halfDays += row._halfDays || 0;
      existing._travel += row._travel || 0;
      existing._holidays += row._holidays || 0;
      existing._workedBase += row._workedBase || 0;
      existing._workedPre += row._workedPre || 0;
      existing._workedPick += row._workedPick || 0;
      existing._rodaje += row._rodaje || 0;
      existing._pruebasCamara += row._pruebasCamara || 0;
      existing._oficina += row._oficina || 0;
      existing._travelDay += row._travelDay || 0;
      existing._carga += row._carga || 0;
      existing._descarga += row._descarga || 0;
      existing._localizar += row._localizar || 0;
      existing._rodajeFestivo += row._rodajeFestivo || 0;
      existing._prelight += row._prelight || 0;
      existing._recogida += row._recogida || 0;
      existing._totalDias += row._totalDias || 0;
      existing._totalHalfDays += row._totalHalfDays || 0;
      existing._totalTravel += row._totalTravel || 0;
      existing._totalHolidays += row._totalHolidays || 0;
      existing._totalExtras += row._totalExtras || 0;
      existing._totalDietas += row._totalDietas || 0;
      existing._totalTrans += row._totalTrans || 0;
      existing._totalKm += row._totalKm || 0;
      existing._totalGasolina += row._totalGasolina || 0;
      existing._totalBruto += row._totalBruto || 0;
      existing._totalMaterialPropio += row._totalMaterialPropio || 0;
      existing._totalLocalizacion += row._totalLocalizacion || 0;
      existing._totalCargaDescarga += row._totalCargaDescarga || 0;
      existing._localizarDays += row._localizarDays || 0;
      existing._cargaDays += row._cargaDays || 0;
      existing._descargaDays += row._descargaDays || 0;
      existing._materialPropioDays += row._materialPropioDays || 0;
      existing._materialPropioWeeks += row._materialPropioWeeks || 0;
      existing._materialPropioUnique += row._materialPropioUnique || 0;

      existing.dietasCount = mergeDietasMaps(existing.dietasCount, row.dietasCount);
      existing._dietasLabel = buildDietasLabel(existing.dietasCount, existing.ticketTotal, existing.otherTotal);
      existing._missingPrices = mergeMissingPrices(existing._missingPrices, row._missingPrices);
      existing._roleVariants = [...(existing._roleVariants || []), ...(row._roleVariants || [])];

      if (existing._displayBlock !== 'base' && row._displayBlock === 'base') {
        existing._displayBlock = 'base';
      } else if (existing._displayBlock === 'pick' && row._displayBlock === 'pre') {
        existing._displayBlock = 'pre';
      }
    }

    return Array.from(mergedByVisibleRow.values());
  }, [
    rows,
    weeksForMonth,
    filterISO,
    rolePrices,
    windowOverrideMap,
    refuerzoSet,
    stripPR,
    calcWorkedBreakdown,
    filteredData,
    dateFrom,
    dateTo,
    projectMode,
    calculateWorkingDaysInMonthValue,
    priceDays,
    roleLabelFromCode,
  ]);

  return enriched;
}
