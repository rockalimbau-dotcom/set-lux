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
  isFirstProjectMonth = false,
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
  const [received, setReceived] = useLocalStorage<Record<string, { ok?: boolean; note?: string; irpf?: number; estado?: number; extraHoursPercent?: number }>>(
    persistKey,
    {}
  );
  const irpfByPersonKey = `${persistKeyBase}_irpfByPerson`;
  const [irpfByPerson, setIrpfByPerson] = useLocalStorage<Record<string, number>>(irpfByPersonKey, {});
  const setRcv = (personKey: string, patch: { ok?: boolean; note?: string; irpf?: number; estado?: number; extraHoursPercent?: number }) => {
    setReceived(prev => {
      const next = {
        ...prev,
        [personKey]: { ...(prev[personKey] || {}), ...patch },
      };
      return next;
    });
    if (Object.prototype.hasOwnProperty.call(patch, 'irpf') && patch.irpf !== undefined) {
      setIrpfByPerson(prev => ({
        ...prev,
        [personKey]: Number(patch.irpf || 0),
      }));
    }
  };

  const rowSelectionKey = `${persistKeyBase}_${monthKey}_showSelection`;
  const [showRowSelection, setShowRowSelection] = useLocalStorage<boolean>(rowSelectionKey, false);
  const netColumnsKey = `${persistKeyBase}_${monthKey}_showNetColumns`;
  const [showNetColumns, setShowNetColumns] = useLocalStorage<boolean>(netColumnsKey, true);

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
    isFirstProjectMonth,
  });

  const visibleEnriched = useMemo(() => {
    return enriched.filter((r: any) => {
      const hasActivity =
        (r._worked || 0) > 0 ||
        (r._halfDays || 0) > 0 ||
        (r._travel || 0) > 0 ||
        (r._holidays || 0) > 0 ||
        (r.horasExtra || 0) > 0 ||
        (r.turnAround || 0) > 0 ||
        (r.nocturnidad || 0) > 0 ||
        (r.penaltyLunch || 0) > 0 ||
        (r.transporte || 0) > 0 ||
        (r.km || 0) > 0 ||
        (r.gasolina || 0) > 0 ||
        (r._totalDietas || 0) > 0 ||
        (r._materialPropioDays || 0) > 0 ||
        (r._materialPropioWeeks || 0) > 0 ||
        (r._materialPropioUnique || 0) > 0 ||
        (r._totalMaterialPropio || 0) > 0 ||
        (r._localizarDays || 0) > 0 ||
        (r._cargaDays || 0) > 0 ||
        (r._descargaDays || 0) > 0;

      return hasActivity;
    });
  }, [enriched]);

  // Manejar selección de filas
  const { toggleRowSelection, isRowSelected } = useRowSelection({
    persistKey,
    enriched: visibleEnriched,
  });

  // Calcular visibilidad de columnas
  const {
    columnVisibility,
    hasLocalizacionData,
    hasCargaDescargaData,
    hasWorkedDaysData,
    hasHalfDaysData,
  } = useColumnVisibility({
    enriched: visibleEnriched,
  });

  const attachNetColumnsData = React.useCallback(
    (rowsToAnnotate: any[]) =>
      rowsToAnnotate.map(r => {
        const pKey = r._rowKey || `${r.role}__${r.name}`;
        const rc = received[pKey] || {};
        const totalBruto = Number(r._totalBruto || 0);
        const totalExtras = Number(r._totalExtras || 0);
        const irpfPercent =
          rc.irpf === undefined || rc.irpf === null || rc.irpf === ''
            ? Number(irpfByPerson[pKey] || 0)
            : Number(rc.irpf);
        const estadoPercent =
          rc.estado === undefined || rc.estado === null || rc.estado === ''
            ? 6.6
            : Number(rc.estado);
        const extraHoursPercent =
          rc.extraHoursPercent === undefined || rc.extraHoursPercent === null || rc.extraHoursPercent === ''
            ? 4.7
            : Number(rc.extraHoursPercent);
        const irpfAmount = totalBruto * irpfPercent / 100;
        const estadoAmount = totalBruto * estadoPercent / 100;
        const extraHoursAmount = totalExtras * extraHoursPercent / 100;
        const totalNeto = totalBruto - irpfAmount - estadoAmount - extraHoursAmount;

        return {
          ...r,
          _showNetColumns: showNetColumns,
          _showExtraHoursPercent: showNetColumns && (r.extras || 0) > 0,
          _irpfPercent: irpfPercent,
          _estadoPercent: estadoPercent,
          _extraHoursPercent: extraHoursPercent,
          _irpfAmount: irpfAmount,
          _estadoAmount: estadoAmount,
          _extraHoursAmount: extraHoursAmount,
          _totalNeto: totalNeto,
        };
      }),
    [irpfByPerson, received, showNetColumns]
  );

  const doExport = () => {
    const rowsToExport = showRowSelection
      ? visibleEnriched.filter(r => {
          const pKey = r._rowKey || `${r.role}__${r.name}`;
          return isRowSelected(pKey);
        })
      : visibleEnriched;
    onExport?.(monthKey, attachNetColumnsData(rowsToExport));
  };
  
  const doExportPDF = async () => {
    if (!onExportPDF) {
      console.warn('onExportPDF no está definido');
      return;
    }
    
    const selectedEnriched = showRowSelection
      ? visibleEnriched.filter(r => {
          const pKey = r._rowKey || `${r.role}__${r.name}`;
          return isRowSelected(pKey);
        })
      : visibleEnriched;
    
    // Si no hay filas seleccionadas, exportar todas
    const rowsToExport = showRowSelection && selectedEnriched.length > 0 ? selectedEnriched : visibleEnriched;
    
    if (!rowsToExport || rowsToExport.length === 0) {
      console.warn('No hay filas para exportar', { enriched: visibleEnriched, selectedEnriched, rowsToExport });
      return;
    }
    
    try {
      await onExportPDF(monthKey, attachNetColumnsData(rowsToExport));
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
        showRowSelection={showRowSelection}
        setShowRowSelection={setShowRowSelection}
        showNetColumns={showNetColumns}
        setShowNetColumns={setShowNetColumns}
        readOnly={readOnly}
      />

      {open && (
        <MonthSectionTable
          enriched={visibleEnriched}
          projectMode={projectMode}
          hasWorkedDaysData={hasWorkedDaysData}
          hasHalfDaysData={hasHalfDaysData}
          hasLocalizacionData={hasLocalizacionData}
          hasCargaDescargaData={hasCargaDescargaData}
          columnVisibility={columnVisibility}
          showRowSelection={showRowSelection}
          isRowSelected={isRowSelected}
          toggleRowSelection={toggleRowSelection}
          received={received}
          irpfByPerson={irpfByPerson}
          setRcv={setRcv}
          showNetColumns={showNetColumns}
          ROLE_COLORS={ROLE_COLORS}
          roleLabelFromCode={roleLabelFromCode}
          readOnly={readOnly}
        />
      )}
    </section>
  );
}

export default React.memo(MonthSection);
