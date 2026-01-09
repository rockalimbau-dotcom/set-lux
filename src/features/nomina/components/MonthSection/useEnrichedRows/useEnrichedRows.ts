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
        oficina,
        travelDay,
        carga,
        descarga,
        localizar,
        rodajeFestivo,
      } = breakdown;

      // Calcular total días trabajados según el modo
      const totalDiasTrabajados = calculateTotalWorkingDays(
        projectMode,
        calculateWorkingDaysInMonthValue,
        workedDays,
        rodaje,
        oficina
      );

      // Obtener precios del rol
      const keyNoPR = `${stripPR(r.role)}__${r.name}`;
      const baseRoleCode = stripPR(r.role);
      const baseRoleLabel = roleLabelFromCode(baseRoleCode);
      const pr = refuerzoSet.has(keyNoPR)
        ? rolePrices.getForRole('REF', baseRoleLabel)
        : rolePrices.getForRole(baseRoleLabel);

      // Obtener precios efectivos (maneja caso especial de diario)
      const effectivePr = getEffectiveRolePrices(pr, projectMode, refuerzoSet, keyNoPR, rolePrices, baseRoleLabel);

      // Determinar role display
      const roleDisplay = determineRoleDisplay(r.role, baseRoleCode, workedBase, workedPre, workedPick);

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

      const totalDietas = calculateTotalDietas(dietasMap, effectivePr, ticketValue);

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
        const publicidadTotals = calculatePublicidadTotals(
          rodaje,
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
          effectivePr
        );
        totals = diarioTotals;
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
          totalDiasTrabajados,
          priceDays,
          precioMensual: (effectivePr as any).precioMensual,
        },
        effectivePr
      );

      const dietasLabel = buildDietasLabel(dietasMap, ticketValue);

      return {
        ...r,
        role: roleDisplay,
        extras: extrasValue,
        horasExtra: horasExtraValue,
        turnAround: turnAroundValue,
        nocturnidad: nocturnidadValue,
        penaltyLunch: penaltyLunchValue,
        transporte: transporteValue,
        km: kmValue,
        dietasCount: dietasMap,
        ticketTotal: ticketValue,
        _worked: totalDiasTrabajados,
        _travel: travelDays,
        _holidays: holidayDays,
        _workedBase: workedBase,
        _workedPre: workedPre,
        _workedPick: workedPick,
        _rodaje: rodaje,
        _oficina: oficina,
        _travelDay: travelDay,
        _carga: carga,
        _descarga: descarga,
        _localizar: localizar,
        _rodajeFestivo: rodajeFestivo,
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

