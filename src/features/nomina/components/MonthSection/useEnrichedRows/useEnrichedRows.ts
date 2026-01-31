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
    person: { role: string; name: string }
  ) => {
    workedDays: number;
    travelDays: number;
    workedBase: number;
    workedPre: number;
    workedPick: number;
    holidayDays: number;
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
}: UseEnrichedRowsProps) {
  const enriched = useMemo(() => {
    return rows.map(r => {
      const person = { role: r.role, name: r.name };
      const breakdown = calcWorkedBreakdown(weeksForMonth, filterISO, person);
      const {
        workedDays,
        travelDays,
        workedBase,
        workedPre,
        workedPick,
        holidayDays,
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
      const keyNoPR = `${stripPR(r.role)}__${r.name}`;
      const baseRoleCode = stripPR(r.role);
      const baseRoleLabel = roleLabelFromCode(baseRoleCode);
      
      // Preservar el sufijo P/R del rol original para determinar qué tabla de precios usar
      const originalRole = r.role || '';
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
      let roleForPriceLookup = baseRoleLabel;
      if (!isRefuerzo) {
        if (hasP || needsPrelightPrice) {
          // Añadir sufijo P al nombre del rol (ej: "GafferP")
          roleForPriceLookup = `${baseRoleLabel}P`;
        } else if (hasR || needsPickupPrice) {
          // Añadir sufijo R al nombre del rol (ej: "GafferR")
          roleForPriceLookup = `${baseRoleLabel}R`;
        }
      }
      
      // Para refuerzos, pasar tanto el código como el label para que findPriceRow pueda buscar ambos
      // Las tablas de precios pueden estar indexadas por nombre completo (Gaffer) o código (G)
      const pr = isRefuerzo
        ? rolePrices.getForRole('REF', baseRoleLabel || baseRoleCode)
        : rolePrices.getForRole(roleForPriceLookup);

      // Obtener precios efectivos (maneja caso especial de diario)
      const effectivePr = getEffectiveRolePrices(pr, projectMode, refuerzoSet, keyNoPR, rolePrices, baseRoleLabel);

      // Preservar el rol original antes de la transformación para el badge
      const originalRoleForBadge = r.role || '';
      
      // Determinar role display
      const roleDisplay = determineRoleDisplay(r.role, baseRoleCode, workedBase, workedPre, workedPick);
      const roleForBadge = isRefuerzo ? originalRoleForBadge : roleDisplay;

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
      const dietasMap = getValueWithOverride(ov, 'dietasCount', useFilteredData, filteredRow, r.dietasCount);
      const ticketValue = getValueWithOverride(ov, 'ticketTotal', useFilteredData, filteredRow, r.ticketTotal);
      const otherValue = getValueWithOverride(ov, 'otherTotal', useFilteredData, filteredRow, r.otherTotal);

      const totalDietas = calculateTotalDietas(dietasMap, effectivePr, ticketValue, otherValue);

      // Calcular totales según el modo del proyecto
      let totals: {
        totalDias: number;
        totalTravel: number;
        totalHolidays: number;
        totalExtras: number;
        totalTrans: number;
        totalKm: number;
        totalLocalizacion?: number;
        totalCargaDescarga?: number;
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
          travelDays,
          holidayDays,
          horasExtraValue,
          turnAroundValue,
          nocturnidadValue,
          penaltyLunchValue,
          transporteValue,
          kmValue,
          totalDietas,
          effectivePr,
          prelight,
          recogida
        );
        totals = publicidadTotals;
      } else {
        const standardTotals = calculateStandardTotals(
          projectMode,
          totalDiasTrabajados,
          workedDays,
          travelDays,
          holidayDays,
          horasExtraValue,
          turnAroundValue,
          nocturnidadValue,
          penaltyLunchValue,
          transporteValue,
          kmValue,
          totalDietas,
          effectivePr,
          priceDays
        );
        totals = standardTotals;
      }

      // Detectar qué precios faltan para mostrar mensajes
      const missingPrices = detectMissingPrices(
        projectMode,
        {
          workedDays,
          travelDays,
          holidayDays,
          horasExtra: horasExtraValue,
          turnAround: turnAroundValue,
          nocturnidad: nocturnidadValue,
          penaltyLunch: penaltyLunchValue,
          transporte: transporteValue,
          km: kmValue,
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
        role: roleDisplay,
        _originalRole: roleForBadge, // Mostrar sufijo P/R cuando aplique
        extras: extrasValue,
        horasExtra: horasExtraValue,
        turnAround: turnAroundValue,
        nocturnidad: nocturnidadValue,
        penaltyLunch: penaltyLunchValue,
        transporte: transporteValue,
        km: kmValue,
        dietasCount: dietasMap,
        ticketTotal: ticketValue,
        otherTotal: otherValue,
        _worked: displayWorkedDays,
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
        _totalTravel: totals.totalTravel,
        _totalHolidays: totals.totalHolidays,
        _totalExtras: totals.totalExtras,
        _totalDietas: totalDietas,
        _totalTrans: totals.totalTrans,
        _totalKm: totals.totalKm,
        _totalBruto: totals.totalBruto,
        _totalLocalizacion: projectMode === 'diario' ? totals.totalLocalizacion || 0 : 0,
        _totalCargaDescarga: projectMode === 'diario' ? totals.totalCargaDescarga || 0 : 0,
        _localizarDays: projectMode === 'diario' ? (localizar || 0) : 0,
        _cargaDays: projectMode === 'diario' ? (carga || 0) : 0,
        _descargaDays: projectMode === 'diario' ? (descarga || 0) : 0,
        _dietasLabel: dietasLabel,
        _pr: effectivePr,
        _missingPrices: missingPrices,
      };
    });
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

