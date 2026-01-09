import React, { useMemo } from 'react';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { getDaysInMonth, calculateWorkingDaysInMonth } from '../utils/monthCalculations';
import { MonthSectionHeader } from './MonthSection/MonthSectionHeader';
import { MonthSectionTable } from './MonthSection/MonthSectionTable';
import { RolePrices, RowIn, WindowOverride, MonthSectionProps as MonthSectionPropsBase } from './MonthSection/MonthSectionTypes';
import { useDateRangeSync } from './MonthSection/useDateRangeSync';
import { useFilteredData } from './MonthSection/useFilteredData';
import { useEnrichedRows } from './MonthSection/useEnrichedRows';
import { useRowSelection } from './MonthSection/useRowSelection';
import { useColumnVisibility } from './MonthSection/useColumnVisibility';

interface MonthSectionProps extends Omit<MonthSectionPropsBase, 'monthKey' | 'rows' | 'weeksForMonth' | 'filterISO' | 'rolePrices' | 'persistKeyBase'> {
  monthKey: string;
  rows: RowIn[];
  weeksForMonth: any[];
  filterISO: (iso: string) => boolean;
  rolePrices: RolePrices;
  projectMode?: 'semanal' | 'mensual' | 'diario';
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
    rodaje?: number;
    oficina?: number;
    travelDay?: number;
    carga?: number;
    descarga?: number;
    localizar?: number;
    rodajeFestivo?: number;
  };
  monthLabelEs: (key: string, withYear?: boolean) => string;
  ROLE_COLORS: Record<string, { bg: string; fg: string }>;
  roleLabelFromCode: (code: string) => string;
  readOnly?: boolean;
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
  readOnly = false,
}: MonthSectionProps) {
  const openKey = `${persistKeyBase}_${monthKey}_open`;
  const [open, setOpen] = useLocalStorage<boolean>(openKey, defaultOpen);

  // Sincronizar fechas con localStorage
  const { dateRangeKey, dateFrom, setDateFrom, dateTo, setDateTo } = useDateRangeSync({
    project,
    projectMode,
    monthKey,
  });

  // Calcular días trabajados del mes usando la función extraída
  const calculateWorkingDaysInMonthValue = useMemo(() => {
    return calculateWorkingDaysInMonth(projectMode, monthKey, weeksForMonth, allWeeks);
  }, [projectMode, monthKey, weeksForMonth, allWeeks]);

  // Campo para días del mes (solo mensual) - inicializar con los días del mes (30 o 31)
  const daysInMonth = getDaysInMonth(monthKey);
  
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

  const refuerzoSet = useMemo(
    () => buildRefuerzoIndex(weeksForMonth),
    [weeksForMonth, buildRefuerzoIndex]
  );

  // Obtener datos filtrados por fecha
  const filteredData = useFilteredData({
    projectMode,
    dateFrom,
    dateTo,
    project,
    weeksForMonth,
    allWeeks,
    aggregateFilteredConcepts,
  });

  // Calcular datos enriquecidos
  const enriched = useEnrichedRows({
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
  });

  // Manejar selección de filas
  const { toggleRowSelection, isRowSelected } = useRowSelection({
    persistKey,
    enriched,
  });

  // Calcular visibilidad de columnas
  const {
    columnVisibility,
    hasLocalizacionData,
    hasCargaDescargaData,
    hasWorkedDaysData,
  } = useColumnVisibility({
    enriched,
  });

  const doExport = () => {
    const selectedEnriched = enriched.filter(r => {
      const pKey = `${r.role}__${r.name}`;
      return isRowSelected(pKey);
    });
    onExport?.(monthKey, selectedEnriched);
  };
  
  const doExportPDF = async () => {
    if (!onExportPDF) {
      console.warn('onExportPDF no está definido');
      return;
    }
    
    const selectedEnriched = enriched.filter(r => {
      const pKey = `${r.role}__${r.name}`;
      return isRowSelected(pKey);
    });
    
    // Si no hay filas seleccionadas, exportar todas
    const rowsToExport = selectedEnriched.length > 0 ? selectedEnriched : enriched;
    
    if (!rowsToExport || rowsToExport.length === 0) {
      console.warn('No hay filas para exportar', { enriched, selectedEnriched, rowsToExport });
      return;
    }
    
    try {
      await onExportPDF(monthKey, rowsToExport);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
    }
  };

  return (
    <section className='rounded sm:rounded-lg md:rounded-xl lg:rounded-2xl border border-neutral-border bg-neutral-panel/90'>
      <MonthSectionHeader
        monthLabel={monthLabelEs(monthKey)}
        open={open}
        setOpen={setOpen}
        projectMode={projectMode}
        priceDays={priceDays}
        setPriceDays={setPriceDays}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        dateRangeKey={dateRangeKey}
        onExportPDF={doExportPDF}
        readOnly={readOnly}
      />

      {open && (
        <MonthSectionTable
          enriched={enriched}
          projectMode={projectMode}
          hasWorkedDaysData={hasWorkedDaysData}
          hasLocalizacionData={hasLocalizacionData}
          hasCargaDescargaData={hasCargaDescargaData}
          columnVisibility={columnVisibility}
          isRowSelected={isRowSelected}
          toggleRowSelection={toggleRowSelection}
          received={received}
          setRcv={setRcv}
          ROLE_COLORS={ROLE_COLORS}
          roleLabelFromCode={roleLabelFromCode}
          readOnly={readOnly}
        />
      )}
    </section>
  );
}

export default React.memo(MonthSection);
