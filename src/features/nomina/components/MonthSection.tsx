import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { Th, Td } from '@shared/components';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { storage } from '@shared/services/localStorage.service';
import { parseYYYYMMDD, monthKeyFromISO, toISO } from '../utils/date';
import { weekISOdays } from '../utils/plan';
import DietasSummary from './DietasSummary.jsx';
import ExtrasSummary from './ExtrasSummary.jsx';
import WorkedDaysSummary from './WorkedDaysSummary.tsx';

type RolePrices = {
  getForRole: (roleCode: string, baseRoleCode?: string | null) => {
    jornada: number;
    travelDay: number;
    horaExtra: number;
    holidayDay: number; // Added holidayDay property
    transporte: number;
    km: number;
    dietas: Record<string, number>;
    // Campos específicos de publicidad
    cargaDescarga?: number;
    localizacionTecnica?: number;
    factorHoraExtraFestiva?: number;
  };
};

type RowIn = {
  role: string;
  name: string;
  extras: number;
  horasExtra: number;
  turnAround: number;
  nocturnidad: number;
  penaltyLunch: number;
  transporte: number;
  km: number;
  dietasCount: Map<string, number>;
  ticketTotal: number;
};

type WindowOverride = Map<string, {
  extras?: number;
  horasExtra?: number;
  turnAround?: number;
  nocturnidad?: number;
  penaltyLunch?: number;
  transporte?: number;
  km?: number;
  dietasCount?: Map<string, number>;
  ticketTotal?: number;
}>;

interface MonthSectionProps {
  monthKey: string;
  rows: RowIn[];
  weeksForMonth: any[];
  filterISO: (iso: string) => boolean;
  rolePrices: RolePrices;
  projectMode?: 'semanal' | 'mensual' | 'publicidad';
  defaultOpen?: boolean;
  persistKeyBase: string;
  onExport?: (monthKey: string, enrichedRows: any[]) => void;
  onExportPDF?: (monthKey: string, enrichedRows: any[]) => void;
  windowOverrideMap?: WindowOverride | null;
  project?: any; // Para poder llamar a aggregateFilteredConcepts
  aggregateFilteredConcepts?: (project: any, weeks: any[], filterISO: ((iso: string) => boolean) | null, dateFrom: string | null, dateTo: string | null) => Map<string, any> | null;
  allWeeks?: any[]; // Todas las semanas del proyecto para poder filtrar por fechas que cruzan meses
  // utils
  buildRefuerzoIndex: (weeks: any[]) => Set<string>;
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
    rodaje: number;
    travelDay: number;
    carga: number;
    descarga: number;
    localizar: number;
    rodajeFestivo: number;
  };
  monthLabelEs: (key: string, withYear?: boolean) => string;
  ROLE_COLORS: Record<string, { bg: string; fg: string }>;
  roleLabelFromCode: (code: string) => string;
}

function MonthSection({
  monthKey,
  rows,
  weeksForMonth,
  filterISO,
  rolePrices,
  projectMode = 'semanal',
  defaultOpen = false,
  persistKeyBase,
  onExport,
  onExportPDF,
  windowOverrideMap = null,
  project,
  aggregateFilteredConcepts,
  allWeeks = [],
  // utils
  buildRefuerzoIndex,
  stripPR,
  calcWorkedBreakdown,
  monthLabelEs,
  ROLE_COLORS,
  roleLabelFromCode,
}: MonthSectionProps) {
  // Helper function to display empty string for zero values
  const displayValue = (value: number | undefined | null, decimals: number = 0): string => {
    if (value === null || value === undefined || value === 0) return '';
    return decimals > 0 ? value.toFixed(decimals) : String(value);
  };

  const openKey = `${persistKeyBase}_${monthKey}_open`;
  const [open, setOpen] = useLocalStorage<boolean>(openKey, defaultOpen);

  // Fechas para filtrar conceptos específicos (solo semanal y mensual)
  // Usar las mismas claves que reportes para sincronización
  const dateRangeKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    return `reportes_dateRange_${base}_${projectMode}_${monthKey}`;
  }, [project?.id, project?.nombre, projectMode, monthKey]);
  
  // Función simple para leer valores de localStorage (useLocalStorage guarda como JSON string)
  const readStorageValue = useCallback((key: string): string => {
    const stored = storage.getString(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return stored;
      }
    }
    return '';
  }, []);
  
  // Leer fechas directamente de localStorage (las mismas claves que usa Reportes)
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const stored = storage.getString(`${dateRangeKey}_from`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return stored;
      }
    }
    return '';
  });
  
  const [dateTo, setDateTo] = useState<string>(() => {
    const stored = storage.getString(`${dateRangeKey}_to`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return stored;
      }
    }
    return '';
  });
  
  // Sincronizar con localStorage cuando cambia la clave
  useEffect(() => {
    const keyFrom = `${dateRangeKey}_from`;
    const keyTo = `${dateRangeKey}_to`;
    const storedFrom = readStorageValue(keyFrom);
    const storedTo = readStorageValue(keyTo);
    
    if (storedFrom) {
      setDateFrom(storedFrom);
    }
    if (storedTo) {
      setDateTo(storedTo);
    }
  }, [dateRangeKey, readStorageValue]);
  
  // Verificar periódicamente por si Reportes guarda las fechas después
  useEffect(() => {
    const interval = setInterval(() => {
      const keyFrom = `${dateRangeKey}_from`;
      const keyTo = `${dateRangeKey}_to`;
      const storedFrom = readStorageValue(keyFrom);
      const storedTo = readStorageValue(keyTo);
      
      if (storedFrom && storedFrom !== dateFrom) {
        setDateFrom(storedFrom);
      }
      if (storedTo && storedTo !== dateTo) {
        setDateTo(storedTo);
      }
    }, 300);
    
    return () => clearInterval(interval);
  }, [dateRangeKey, readStorageValue, dateFrom, dateTo]);
  
  // Guardar en localStorage cuando cambian (para persistencia si el usuario las modifica)
  useEffect(() => {
    if (dateFrom) {
      storage.setString(`${dateRangeKey}_from`, JSON.stringify(dateFrom));
    }
  }, [dateRangeKey, dateFrom]);
  
  useEffect(() => {
    if (dateTo) {
      storage.setString(`${dateRangeKey}_to`, JSON.stringify(dateTo));
    }
  }, [dateRangeKey, dateTo]);

  // Calcular días del mes (30 o 31) para nómina mensual
  const getDaysInMonth = (monthKey: string): number => {
    const [year, month] = monthKey.split('-').map(Number);
    const days = new Date(year, month, 0).getDate();
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA.MONTH] getDaysInMonth:', monthKey, '->', days, 'days');
    }
    return days;
  };

  // Calcular días trabajados del mes: desde el primer día trabajado hasta el final del mes
  // IMPORTANTE: Este cálculo debe funcionar correctamente incluso cuando las semanas cruzan meses
  // Si se encuentra "Fin" en planificación, el conteo se detiene hasta ese día (sin contarlo)
  const calculateWorkingDaysInMonth = React.useMemo(() => {
    if (projectMode !== 'mensual') {
      return getDaysInMonth(monthKey);
    }
    
    // Buscar el primer día con "Fin" en todas las semanas del proyecto (ordenadas cronológicamente)
    // Usar allWeeks si está disponible, sino usar weeksForMonth
    let finDayISO: string | null = null;
    const weeksToSearch = (allWeeks && allWeeks.length > 0) ? allWeeks : weeksForMonth;
    const allWeeksSorted = [...weeksToSearch].sort((a, b) => {
      const aDate = parseYYYYMMDD(a.startDate);
      const bDate = parseYYYYMMDD(b.startDate);
      return aDate.getTime() - bDate.getTime();
    });
    
    for (const week of allWeeksSorted) {
      const weekDays = weekISOdays(week);
      for (let idx = 0; idx < (week.days || []).length; idx++) {
        const day = (week.days || [])[idx];
        if ((day?.tipo || '') === 'Fin') {
          const iso = weekDays[idx];
          // Guardar el primer "Fin" encontrado (el más temprano)
          if (!finDayISO || iso < finDayISO) {
            finDayISO = iso;
          }
        }
      }
    }
    
    // Verificar si "Fin" está en el mes actual o antes (solo entonces afecta el cálculo)
    const finDayMonthKey = finDayISO ? monthKeyFromISO(finDayISO) : null;
    const finAffectsThisMonth = finDayISO && finDayMonthKey && finDayMonthKey <= monthKey;
    
    // Obtener todos los días ISO de las semanas del mes que pertenecen AL MES ACTUAL
    // Esto es crítico: aunque una semana cruce meses, solo contamos los días del mes actual
    const allDays: string[] = [];
    for (const week of weeksForMonth) {
      const weekDays = weekISOdays(week);
      for (let idx = 0; idx < (week.days || []).length; idx++) {
        const iso = weekDays[idx];
        const dayMonthKey = monthKeyFromISO(iso);
        // Solo añadir días que pertenecen al mes actual
        if (dayMonthKey === monthKey) {
          // Si encontramos "Fin" antes o en este día, no añadir este día ni los siguientes
          if (finAffectsThisMonth && finDayISO && iso >= finDayISO) {
            break;
          }
          allDays.push(iso);
        }
      }
    }
    
    // Si no hay días trabajados en este mes, devolver 0
    if (allDays.length === 0) {
      return 0;
    }
    
    // Ordenar días y obtener el primero y el último (el primer y último día trabajado del mes)
    allDays.sort();
    const firstDayWorked = parseYYYYMMDD(allDays[0]);
    
    // Si hay "Fin" que afecta este mes, usar el día anterior a "Fin" como último día trabajado
    // Si no hay "Fin" o está en un mes posterior, usar el último día trabajado o el final del mes
    let lastDayWorked: Date;
    if (finAffectsThisMonth && finDayISO) {
      const finDate = parseYYYYMMDD(finDayISO);
      const dayBeforeFin = new Date(finDate);
      dayBeforeFin.setDate(dayBeforeFin.getDate() - 1);
      // Asegurar que dayBeforeFin no sea anterior al primer día trabajado del mes
      lastDayWorked = dayBeforeFin < firstDayWorked ? firstDayWorked : dayBeforeFin;
    } else {
      lastDayWorked = parseYYYYMMDD(allDays[allDays.length - 1]);
    }
    
    if (!firstDayWorked || !lastDayWorked) {
      return 0;
    }
    
    // Obtener el último día del mes calendario
    const [year, month] = monthKey.split('-').map(Number);
    const lastDayOfMonth = new Date(year, month, 0); // día 0 del mes siguiente = último día del mes actual
    
    // Calcular días desde el primer día trabajado hasta el último día trabajado O hasta el final del mes
    // Usar el menor de los dos: último día trabajado o último día del mes
    const endDate = lastDayWorked > lastDayOfMonth ? lastDayOfMonth : lastDayWorked;
    
    // Calcular días desde el primer día trabajado hasta el día final (incluyendo ambos)
    // Esto incluye rodaje + descansos desde el primer día trabajado hasta el último día trabajado (o final del mes)
    const diffTime = endDate.getTime() - firstDayWorked.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Asegurar que no sea negativo
    return Math.max(0, diffDays);
  }, [projectMode, weeksForMonth, monthKey]);

  // Campo para días del mes (solo mensual) - inicializar con los días del mes (30 o 31)
  const daysInMonth = getDaysInMonth(monthKey);
  
  // Debug para verificar daysInMonth
  if ((import.meta as any).env.DEV && projectMode === 'mensual') {
    console.debug('[NOMINA.MONTH] daysInMonth calculated:', daysInMonth, 'calculateWorkingDaysInMonth:', calculateWorkingDaysInMonth, 'for monthKey:', monthKey, 'projectMode:', projectMode);
  }
  const daysInMonthKey = `${persistKeyBase}_${monthKey}_priceDays`;
  const [priceDays, setPriceDays] = useLocalStorage<number>(daysInMonthKey, daysInMonth);

  const persistKey = `${persistKeyBase}_${monthKey}_rcvd`;
  const [received, setReceived] = useLocalStorage<Record<string, { ok?: boolean; note?: string }>>(
    persistKey,
    {}
  );
  const setRcv = (personKey: string, patch: { ok?: boolean; note?: string }) => {
    setReceived(prev => {
      const next = {
        ...prev,
        [personKey]: { ...(prev[personKey] || {}), ...patch },
      };
      return next;
    });
  };

  const btnExportCls = 'px-3 py-2 rounded-lg text-sm font-semibold';
  const btnExportStyle: React.CSSProperties = {
    background: '#f59e0b',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  const refuerzoSet = useMemo(
    () => buildRefuerzoIndex(weeksForMonth),
    [weeksForMonth, buildRefuerzoIndex]
  );

  // Obtener datos filtrados por fecha si hay fechas seleccionadas (solo para semanal y mensual)
  // Cuando hay fechas seleccionadas, necesitamos incluir semanas de otros meses si las fechas lo requieren
  const filteredData = React.useMemo(() => {
    if ((projectMode !== 'semanal' && projectMode !== 'mensual') || !dateFrom || !dateTo || !project || !aggregateFilteredConcepts) {
      return null;
    }
    
    // Si hay fechas seleccionadas, buscar todas las semanas que contengan días dentro del rango
    // Esto incluye semanas de otros meses si las fechas lo requieren
    let weeksToUse = weeksForMonth;
    if (allWeeks && allWeeks.length > 0) {
      const fromDate = parseYYYYMMDD(dateFrom);
      const toDate = parseYYYYMMDD(dateTo);
      
      if (fromDate && toDate) {
        // Filtrar semanas que tengan al menos un día dentro del rango de fechas
        weeksToUse = allWeeks.filter((w: any) => {
          const weekDays = weekISOdays(w);
          return weekDays.some((iso: string) => {
            const dayDate = parseYYYYMMDD(iso);
            return dayDate && dayDate >= fromDate && dayDate <= toDate;
          });
        });
      }
    }
    
    // Cuando hay fechas seleccionadas, pasar null como filterISO para incluir todos los días del rango
    // independientemente del mes
    return aggregateFilteredConcepts(project, weeksToUse, null, dateFrom, dateTo);
  }, [projectMode, dateFrom, dateTo, project, weeksForMonth, allWeeks, aggregateFilteredConcepts]);

  const enriched = useMemo(() => {
    return rows.map(r => {
      const person = { role: r.role, name: r.name };
      const { workedDays, travelDays, workedBase, workedPre, workedPick, holidayDays, rodaje, travelDay, carga, descarga, localizar, rodajeFestivo } =
        calcWorkedBreakdown(weeksForMonth, filterISO, person);
      
      // Para mensual, "Total días trabajados" debe ser desde el primer día trabajado hasta el último día trabajado
      // (incluyendo rodaje + descansos en ese rango)
      const totalDiasTrabajados = projectMode === 'mensual' ? calculateWorkingDaysInMonth : workedDays;

      const keyNoPR = `${stripPR(r.role)}__${r.name}`;
      const baseRoleCode = stripPR(r.role);
      const baseRoleLabel = roleLabelFromCode(baseRoleCode);
      const pr = refuerzoSet.has(keyNoPR)
        ? rolePrices.getForRole('REF', baseRoleLabel)
        : rolePrices.getForRole(baseRoleLabel);

      // Debug: log the role prices
      if ((import.meta as any).env.DEV) {
        console.debug('[NOMINA.MONTH] Role prices for', baseRoleLabel, ':', pr);
      }

      let roleDisplay = r.role;
      if (r.role !== 'REF') {
        if (workedPre > 0 && workedBase === 0 && workedPick === 0)
          roleDisplay = `${baseRoleCode}P`;
        else if (workedPick > 0 && workedBase === 0 && workedPre === 0)
          roleDisplay = `${baseRoleCode}R`;
        else roleDisplay = baseRoleCode;
      }

      const pKey = `${r.role}__${r.name}`;
      const ov = (windowOverrideMap && 'get' in windowOverrideMap)
        ? (windowOverrideMap as WindowOverride).get(pKey)
        : null;

      // Obtener datos filtrados para esta persona si existen
      // La clave en filteredData usa visibleRoleFor (que es el role visible, no el role display)
      // Necesitamos usar la misma lógica que en aggregateFilteredConcepts
      // En aggregateFilteredConcepts, usa info.roleVisible que viene de visibleRoleFor
      const keyNoPRForFilter = `${stripPR(r.role)}__${r.name}`;
      let visibleRoleForFilter: string;
      if (refuerzoSet.has(keyNoPRForFilter)) {
        visibleRoleForFilter = 'REF';
      } else {
        // visibleRoleFor devuelve el role base con sufijo P/R si existe
        const baseRole = stripPR(r.role);
        const suffix = /[PR]$/.test(r.role || '') ? r.role.slice(-1) : '';
        visibleRoleForFilter = suffix ? `${baseRole}${suffix}` : baseRole;
      }
      const filteredKey = `${visibleRoleForFilter}__${r.name}`;
      const filteredRow = filteredData?.get(filteredKey);
      
      // Debug para verificar las claves
      if ((import.meta as any).env.DEV && filteredData && dateFrom && dateTo) {
        console.debug('[NOMINA.FILTER] r.role:', r.role, 'r.name:', r.name, 'pKey:', pKey, 'filteredKey:', filteredKey, 'filteredRow:', filteredRow, 'filteredData keys:', Array.from(filteredData.keys()));
      }
      
      // Usar datos filtrados para conceptos específicos si hay fechas seleccionadas y filteredRow existe
      // Si filteredRow no existe o está vacío, usar datos completos de r
      // Solo usar filteredRow si hay fechas seleccionadas Y filteredRow tiene datos
      // Verificar que las fechas no estén vacías (string vacío no cuenta como fecha válida)
      const hasDateFilter = dateFrom && dateTo && dateFrom.trim() !== '' && dateTo.trim() !== '' && filteredData;
      const useFilteredData = hasDateFilter && filteredRow;
      
      const extrasValue = ov?.extras ?? (useFilteredData ? filteredRow.horasExtra + filteredRow.turnAround : r.extras);
      const horasExtraValue = ov?.horasExtra ?? (useFilteredData ? filteredRow.horasExtra : r.horasExtra);
      const turnAroundValue = ov?.turnAround ?? (useFilteredData ? filteredRow.turnAround : r.turnAround);
      const nocturnidadValue = ov?.nocturnidad ?? (useFilteredData ? filteredRow.nocturnidad : r.nocturnidad);
      const penaltyLunchValue = ov?.penaltyLunch ?? (useFilteredData ? filteredRow.penaltyLunch : r.penaltyLunch);
      const transporteValue = ov?.transporte ?? (useFilteredData ? filteredRow.transporte : r.transporte);
      const kmValue = ov?.km ?? (useFilteredData ? filteredRow.km : r.km);
      const dietasMap = ov?.dietasCount ?? (useFilteredData ? filteredRow.dietasCount : r.dietasCount);
      const ticketValue = ov?.ticketTotal ?? (useFilteredData ? filteredRow.ticketTotal : r.ticketTotal);

      const cnt = (label: string) => dietasMap.get(label) || 0;
      const totalDietas =
        cnt('Desayuno') * (pr.dietas['Desayuno'] || 0) +
        cnt('Comida') * (pr.dietas['Comida'] || 0) +
        cnt('Cena') * (pr.dietas['Cena'] || 0) +
        cnt('Dieta sin pernoctar') * (pr.dietas['Dieta sin pernoctar'] || 0) +
        cnt('Dieta completa + desayuno') *
          (pr.dietas['Dieta completa + desayuno'] || 0) +
        cnt('Gastos de bolsillo') * (pr.dietas['Gastos de bolsillo'] || 0) +
        (ticketValue || 0);

      // Cálculo de días según el modo del proyecto
      let totalDias: number;
      let totalTravel: number;
      let totalHolidays: number;
      let _totalExtras: number;
      let _totalTrans: number;
      let _totalKm: number;
      let _totalBruto: number;

      if (projectMode === 'publicidad') {
        // Cálculo específico para publicidad
        // Total días = (carga/descarga × precio) + (localización × precio) + (rodaje × precio jornada)
        const cargaDescargaDays = workedPre + workedPick;
        const localizacionDays = 0; // TODO: Necesitamos datos de localización técnica
        const rodajeDays = workedBase;
        
        totalDias = 
          (cargaDescargaDays * (pr.cargaDescarga || 0)) +
          (localizacionDays * (pr.localizacionTecnica || 0)) +
          (rodajeDays * (pr.jornada || 0));
        
        totalTravel = travelDays * (pr.travelDay || 0);
        totalHolidays = holidayDays * (pr.holidayDay || 0);
        
        // Total horas extras = horas extras + turn around + nocturnidad + penalty lunch + horas extras festivas
        const horasExtrasFestivas = 0; // TODO: Necesitamos datos de horas extras festivas
        _totalExtras = 
          (horasExtraValue * (pr.horaExtra || 0)) +
          (turnAroundValue * (pr.horaExtra || 0)) +
          (nocturnidadValue * (pr.horaExtra || 0) * (pr.factorHoraExtraFestiva || 1)) +
          (penaltyLunchValue * (pr.horaExtra || 0)) +
          (horasExtrasFestivas * (pr.horaExtra || 0) * (pr.factorHoraExtraFestiva || 1));
        
        _totalTrans = transporteValue * (pr.transporte || 0);
        _totalKm = (kmValue || 0) * (pr.km || 0);
        
        _totalBruto =
          totalDias +
          totalTravel +
          totalHolidays +
          _totalExtras +
          totalDietas +
          _totalTrans +
          _totalKm;
      } else {
        // Cálculo estándar para semanal/mensual
        if (projectMode === 'mensual') {
          // Para mensual: usar precio diario calculado desde precio mensual
          // Total días = totalDiasTrabajados (todos los días del mes) * precio diario
          const precioMensual = (pr as any).precioMensual || 0;
          const precioDiario = precioMensual > 0 && priceDays > 0 ? precioMensual / priceDays : (pr.jornada || 0);
          totalDias = totalDiasTrabajados * precioDiario;
        } else {
          // Para semanal: usar precio jornada como antes
          totalDias = workedDays * (pr.jornada || 0);
        }
        totalTravel = travelDays * (pr.travelDay || 0);
        totalHolidays = holidayDays * (pr.holidayDay || 0);
        _totalExtras = (horasExtraValue + turnAroundValue + nocturnidadValue + penaltyLunchValue) * (pr.horaExtra || 0);
        _totalTrans = transporteValue * (pr.transporte || 0);
        _totalKm = (kmValue || 0) * (pr.km || 0);
        _totalBruto =
          totalDias +
          totalTravel +
          totalHolidays +
          _totalExtras +
          totalDietas +
          _totalTrans +
          _totalKm;
      }

      const dietasLabelParts: string[] = [];
      if (cnt('Desayuno')) dietasLabelParts.push(`Desayuno x${cnt('Desayuno')}`);
      if (cnt('Comida')) dietasLabelParts.push(`Comida x${cnt('Comida')}`);
      if (cnt('Cena')) dietasLabelParts.push(`Cena x${cnt('Cena')}`);
      if (cnt('Dieta sin pernoctar'))
        dietasLabelParts.push(
          `Dieta sin pernoctar x${cnt('Dieta sin pernoctar')}`
        );
      if (cnt('Dieta completa + desayuno'))
        dietasLabelParts.push(
          `Dieta completa + desayuno x${cnt('Dieta completa + desayuno')}`
        );
      if (cnt('Gastos de bolsillo'))
        dietasLabelParts.push(
          `Gastos de bolsillo x${cnt('Gastos de bolsillo')}`
        );
      if (ticketValue > 0)
        dietasLabelParts.push(`Ticket €${(ticketValue || 0).toFixed(2)}`);

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
        _worked: totalDiasTrabajados, // Para mensual es desde el primer día trabajado hasta el final del mes, para otros es workedDays
        _travel: travelDays,
        _holidays: holidayDays,
        _workedBase: workedBase, // Días de rodaje (compatibilidad)
        _workedPre: workedPre, // Días de prelight (compatibilidad)
        _workedPick: workedPick, // Días de pickup (compatibilidad)
        _rodaje: rodaje, // Días de tipo "Rodaje"
        _travelDay: travelDay, // Días de tipo "Travel Day"
        _carga: carga, // Días de tipo "Carga"
        _descarga: descarga, // Días de tipo "Descarga"
        _localizar: localizar, // Días de tipo "Localizar"
        _rodajeFestivo: rodajeFestivo, // Días de tipo "Rodaje Festivo"
        _totalDias: totalDias,
        _totalTravel: totalTravel,
        _totalHolidays: totalHolidays,
        _totalExtras,
        _totalDietas: totalDietas,
        _totalTrans,
        _totalKm,
        _totalBruto,
        _dietasLabel: dietasLabelParts.join(' · ') || '—',
        _pr: pr,
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
    projectMode,
    daysInMonth,
    calculateWorkingDaysInMonth,
    priceDays,
  ]);

  // Estado para filas seleccionadas para exportación (por defecto todas seleccionadas)
  const selectedRowsKey = `${persistKey}_selectedRows`;
  const [selectedRowsArray, setSelectedRowsArray] = useLocalStorage<string[]>(
    selectedRowsKey,
    []
  );

  // Convertir array a Set para uso interno
  const selectedRows = React.useMemo(() => new Set(selectedRowsArray), [selectedRowsArray]);

  // Inicializar todas las filas como seleccionadas solo si no hay selección guardada y hay filas
  // Usamos una referencia para saber si ya se inicializó una vez
  const hasInitializedRef = React.useRef(false);
  React.useEffect(() => {
    if (!hasInitializedRef.current && selectedRowsArray.length === 0 && enriched.length > 0) {
      const allKeys = enriched.map(r => `${r.role}__${r.name}`);
      setSelectedRowsArray(allKeys);
      hasInitializedRef.current = true;
    } else if (enriched.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
    }
  }, [enriched.length, selectedRowsArray.length, setSelectedRowsArray]);

  const toggleRowSelection = (personKey: string) => {
    setSelectedRowsArray(prev => {
      const prevSet = new Set(prev);
      if (prevSet.has(personKey)) {
        prevSet.delete(personKey);
      } else {
        prevSet.add(personKey);
      }
      return Array.from(prevSet);
    });
  };

  const isRowSelected = (personKey: string) => {
    return selectedRows.has(personKey);
  };

  // Detect which columns have data to show/hide empty columns
  const columnVisibility = useMemo(() => {
    const hasHolidays = enriched.some(r => r._holidays > 0);
    const hasTravel = enriched.some(r => r._travel > 0);
    const hasExtras = enriched.some(r => r.extras > 0);
    const hasTransporte = enriched.some(r => r.transporte > 0);
    const hasKm = enriched.some(r => r.km > 0);
    const hasDietas = enriched.some(r => r._totalDietas > 0);

    return {
      holidays: hasHolidays,
      travel: hasTravel,
      extras: hasExtras,
      transporte: hasTransporte,
      km: hasKm,
      dietas: hasDietas,
    };
  }, [enriched]);

  const doExport = () => {
    const selectedEnriched = enriched.filter(r => {
      const pKey = `${r.role}__${r.name}`;
      return isRowSelected(pKey);
    });
    onExport?.(monthKey, selectedEnriched);
  };
  
  const doExportPDF = () => {
    const selectedEnriched = enriched.filter(r => {
      const pKey = `${r.role}__${r.name}`;
      return isRowSelected(pKey);
    });
    onExportPDF?.(monthKey, selectedEnriched);
  };

  return (
    <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90'>
      <div className='flex items-center gap-2 px-5 py-4'>
        <button
          onClick={() => setOpen(v => !v)}
          className='w-6 h-6 rounded-lg border border-neutral-border flex items-center justify-center text-sm hover:border-[#F59E0B]'
          title={open ? 'Contraer' : 'Desplegar'}
          type='button'
        >
          {open ? '−' : '+'}
        </button>
        <span className='text-lg font-semibold text-brand'>
          Nómina {monthLabelEs(monthKey)}
        </span>
        {(projectMode === 'semanal' || projectMode === 'mensual') && (
          <div className='ml-auto flex items-center gap-3'>
            {projectMode === 'mensual' && (
              <div className='flex items-center gap-2'>
                <label className='text-xs text-zinc-400 whitespace-nowrap'>Precio a</label>
                <input
                  type='number'
                  min='28'
                  max='31'
                  value={priceDays}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10);
                    if (val >= 28 && val <= 31) {
                      setPriceDays(val);
                    }
                  }}
                  className='w-12 px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-xs text-center'
                />
                <label className='text-xs text-zinc-400 whitespace-nowrap'>días</label>
              </div>
            )}
            <div className='flex items-center gap-2'>
              <label className='text-sm text-zinc-300 whitespace-nowrap'>Desde:</label>
              <input
                type='date'
                value={dateFrom}
                onChange={e => {
                  const newValue = e.target.value;
                  setDateFrom(newValue);
                  // Sincronizar con reportes: actualizar la clave de reportes y disparar evento
                  storage.setString(`${dateRangeKey}_from`, newValue);
                  window.dispatchEvent(
                    new CustomEvent('localStorageChange', {
                      detail: { key: `${dateRangeKey}_from`, value: newValue },
                    })
                  );
                }}
                className='px-3 py-2 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm text-center'
              />
            </div>
            <div className='flex items-center gap-2'>
              <label className='text-sm text-zinc-300 whitespace-nowrap'>Hasta:</label>
              <input
                type='date'
                value={dateTo}
                onChange={e => {
                  const newValue = e.target.value;
                  setDateTo(newValue);
                  // Sincronizar con reportes: actualizar la clave de reportes y disparar evento
                  storage.setString(`${dateRangeKey}_to`, newValue);
                  window.dispatchEvent(
                    new CustomEvent('localStorageChange', {
                      detail: { key: `${dateRangeKey}_to`, value: newValue },
                    })
                  );
                }}
                className='px-3 py-2 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm text-center'
              />
            </div>
          </div>
        )}
        <div className='ml-auto flex gap-2'>
          <button
            className={btnExportCls}
            style={btnExportStyle}
            onClick={doExportPDF}
            title='Exportar nómina del mes (PDF)'
            type='button'
          >
            PDF
          </button>
        </div>
      </div>

      {open && (
        <div className='px-5 pb-5 overflow-x-auto'>
          <table className='min-w-[1200px] w-full border-collapse text-sm'>
            <thead>
              <tr>
                <Th align='center'>
                  <div className='flex justify-center'>
                    <input
                      type='checkbox'
                      checked={enriched.length > 0 && enriched.every(r => {
                        const pKey = `${r.role}__${r.name}`;
                        return isRowSelected(pKey);
                      })}
                      onChange={e => {
                        if (e.target.checked) {
                          // Seleccionar todas
                          const allKeys = enriched.map(r => `${r.role}__${r.name}`);
                          setSelectedRowsArray(allKeys);
                        } else {
                          // Deseleccionar todas
                          setSelectedRowsArray([]);
                        }
                      }}
                      onClick={e => {
                        // Prevenir el comportamiento por defecto y manejar manualmente
                        e.stopPropagation();
                      }}
                      title={enriched.length > 0 && enriched.every(r => {
                        const pKey = `${r.role}__${r.name}`;
                        return isRowSelected(pKey);
                      }) ? 'Deseleccionar todas' : 'Seleccionar todas'}
                      className='accent-blue-500 dark:accent-[#f59e0b] cursor-pointer'
                    />
                  </div>
                </Th>
                <Th align='center'>Persona</Th>
                <Th align='center'>Días trabajados</Th>
                <Th align='center'>Total días</Th>
                {columnVisibility.holidays && <Th align='center'>Días festivos</Th>}
                {columnVisibility.holidays && <Th align='center'>Total días festivos</Th>}
                {columnVisibility.travel && <Th align='center'>Días Travel Day</Th>}
                {columnVisibility.travel && <Th align='center'>Total travel days</Th>}
                {columnVisibility.extras && <Th align='center'>Horas extras</Th>}
                {columnVisibility.extras && <Th align='center'>Total horas extra</Th>}
                {columnVisibility.dietas && <Th align='center'>Dietas</Th>}
                {columnVisibility.dietas && <Th align='center'>Total dietas</Th>}
                {columnVisibility.transporte && <Th align='center'>Transportes</Th>}
                {columnVisibility.transporte && <Th align='center'>Total transportes</Th>}
                {columnVisibility.km && <Th align='center'>Kilometraje</Th>}
                {columnVisibility.km && <Th align='center'>Total kilometraje</Th>}
                <Th align='center'>TOTAL BRUTO</Th>
                <Th align='center'>Nómina recibida</Th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((r, idx) => {
                const pKey = `${r.role}__${r.name}`;
                const roleForColor = String(r.role || '').replace(/[PR]$/, '');
                const col =
                  ROLE_COLORS[roleForColor] ||
                  ROLE_COLORS[roleLabelFromCode(roleForColor)] ||
                  (roleForColor === 'REF'
                    ? { bg: '#F59E0B', fg: '#111' }
                    : { bg: '#444', fg: '#fff' });

                const rc = (received as any)[pKey] || { ok: false, note: '' };
                const isSelected = isRowSelected(pKey);

                return (
                  <tr key={idx}>
                    <Td align='middle'>
                      <div className='flex justify-center'>
                        <input
                          type='checkbox'
                          checked={isSelected}
                          onChange={() => toggleRowSelection(pKey)}
                          title={isSelected ? 'Deseleccionar para exportación' : 'Seleccionar para exportación'}
                          className='accent-blue-500 dark:accent-[#f59e0b] cursor-pointer'
                        />
                      </div>
                    </Td>
                    <Td align='center' className='text-center'>
                      <div className='flex justify-center'>
                        <span
                          className='inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-neutral-border bg-black/40'
                          title={`${r.role} - ${r.name}`}
                        >
                          <span
                            className='inline-flex items-center justify-center w-6 h-5 rounded-md font-bold text-[10px]'
                            style={{ background: col.bg, color: col.fg }}
                          >
                            {r.role || '—'}
                          </span>
                          <span className='text-xs text-zinc-200'>{r.name}</span>
                        </span>
                      </div>
                    </Td>

                    <Td align='center' className='text-center'>
                      <div className='flex flex-col items-center'>
                        {r._worked > 0 && (
                          <div className='text-right font-medium text-zinc-100 mb-1'>{r._worked}</div>
                        )}
                        <WorkedDaysSummary
                          carga={r._carga || 0}
                          descarga={r._descarga || 0}
                          localizar={r._localizar || 0}
                          rodaje={r._rodaje || 0}
                        />
                      </div>
                    </Td>
                    <Td align='center' className='text-center'>{displayValue(r._totalDias, 2)}</Td>

                    {columnVisibility.holidays && <Td align='center' className='text-center'>{displayValue(r._holidays)}</Td>}
                    {columnVisibility.holidays && <Td align='center' className='text-center'>{displayValue(r._totalHolidays, 2)}</Td>}

                    {columnVisibility.travel && <Td align='center' className='text-center'>{displayValue(r._travel)}</Td>}
                    {columnVisibility.travel && <Td align='center' className='text-center'>{displayValue(r._totalTravel, 2)}</Td>}

                    {columnVisibility.extras && (
                      <Td align='center' className='text-center'>
                        <div className='flex justify-center'>
                          <ExtrasSummary
                            horasExtra={r.horasExtra}
                            turnAround={r.turnAround}
                            nocturnidad={r.nocturnidad}
                            penaltyLunch={r.penaltyLunch}
                          />
                        </div>
                      </Td>
                    )}
                    {columnVisibility.extras && <Td align='center' className='text-center'>{displayValue(r._totalExtras, 2)}</Td>}

                    {columnVisibility.dietas && (
                      <Td align='center' className='text-center'>
                        <div className='flex justify-center'>
                          <DietasSummary
                            dietasCount={r.dietasCount}
                            ticketTotal={r.ticketTotal}
                          />
                        </div>
                      </Td>
                    )}
                    {columnVisibility.dietas && <Td align='center' className='text-center'>{displayValue(r._totalDietas, 2)}</Td>}

                    {columnVisibility.transporte && <Td align='center' className='text-center'>{displayValue(r.transporte)}</Td>}
                    {columnVisibility.transporte && <Td align='center' className='text-center'>{displayValue(r._totalTrans, 2)}</Td>}

                    {columnVisibility.km && <Td align='center' className='text-center'>{displayValue(r.km, 1)}</Td>}
                    {columnVisibility.km && <Td align='center' className='text-center'>{displayValue(r._totalKm, 2)}</Td>}

                    <Td align='center' className='text-center font-semibold'>
                      {displayValue(r._totalBruto, 2)}
                    </Td>

                    <Td align='center' className='text-center'>
                      <div className='flex items-center justify-center gap-2'>
                        <input
                          type='checkbox'
                          checked={!!rc.ok}
                          onChange={e => setRcv(pKey, { ok: e.target.checked })}
                        />
                        <input
                          type='text'
                          placeholder='Anota mes o incidencia…'
                          value={rc.note || ''}
                          onChange={e => setRcv(pKey, { note: e.target.value })}
                          className='px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-xs'
                        />
                      </div>
                    </Td>
                  </tr>
                );
              })}

              {enriched.length === 0 && (
                <tr>
                  <Td colSpan={
                    6 + // Base columns: Checkbox, Persona, Días trabajados, Total días, TOTAL BRUTO, Nómina recibida
                    (columnVisibility.holidays ? 2 : 0) + // Días festivos + Total días festivos
                    (columnVisibility.travel ? 2 : 0) + // Travel Day + Total travel days
                    (columnVisibility.extras ? 2 : 0) + // Horas extra + Total horas extra
                    (columnVisibility.dietas ? 2 : 0) + // Dietas + Total dietas
                    (columnVisibility.transporte ? 2 : 0) + // Transportes + Total transportes
                    (columnVisibility.km ? 2 : 0) // Kilometraje + Total kilometraje
                  } align='center' className='text-center'>
                    <div className='text-sm text-zinc-400'>
                      No hay datos en este mes.
                    </div>
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default React.memo(MonthSection);


