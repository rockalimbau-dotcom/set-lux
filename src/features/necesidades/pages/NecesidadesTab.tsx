import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnyRecord } from '@shared/types/common';
import { exportToPDF, exportAllToPDF } from '../utils/export';
import { parsePlanPdf, applyImportToNeeds } from '../importPlan';
import type { ImportConflict, ImportResult, WeekDecision } from '../importPlan';
import { NecesidadesTabProps, DayInfo, NeedsState, NeedsWeek } from './NecesidadesTab/NecesidadesTabTypes';
import { useNeedsData } from './NecesidadesTab/useNeedsData';
import { useNeedsActions } from './NecesidadesTab/useNeedsActions';
import { useRoster } from '@shared/hooks/useRoster';
import { useHolidays } from '@shared/hooks/useHolidays';
import { syncDayListWithRosterBlankOnly } from '@shared/utils/rosterSync';
import { NecesidadesTabContent } from './NecesidadesTab/NecesidadesTabContent';

export default function NecesidadesTab({ project, readOnly = false }: NecesidadesTabProps) {
  const { t } = useTranslation();
  
  // Create DAYS array with translations
  const DAYS = useMemo(() => [
    { idx: 0, key: 'mon', name: t('reports.dayNames.monday') },
    { idx: 1, key: 'tue', name: t('reports.dayNames.tuesday') },
    { idx: 2, key: 'wed', name: t('reports.dayNames.wednesday') },
    { idx: 3, key: 'thu', name: t('reports.dayNames.thursday') },
    { idx: 4, key: 'fri', name: t('reports.dayNames.friday') },
    { idx: 5, key: 'sat', name: t('reports.dayNames.saturday') },
    { idx: 6, key: 'sun', name: t('reports.dayNames.sunday') },
  ], [t]);
  
  // Error boundary state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const planFileKey = useMemo(() => {
    try {
      const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'demo';
      return `needs_plan_file_${base}`;
    } catch {
      return 'needs_plan_file_demo';
    }
  }, [(project as AnyRecord)?.id, (project as AnyRecord)?.nombre]);

  const [planFileName, setPlanFileName] = useLocalStorage<string>(planFileKey, '');
  const [importError, setImportError] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importConflicts, setImportConflicts] = useState<ImportConflict[]>([]);
  const [importDecisions, setImportDecisions] = useState<Record<string, WeekDecision>>({});

  const storageKey = useMemo(() => {
    try {
      const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'demo';
      return `needs_${base}`;
    } catch (error) {
      console.error('Error creating storageKey:', error);
      return 'needs_demo';
    }
  }, [(project as AnyRecord)?.id, (project as AnyRecord)?.nombre]);

  const [needs, setNeeds] = useLocalStorage<NeedsState>(storageKey, { pre: [], pro: [] });
  const [openPre, setOpenPre] = useLocalStorage<boolean>(`needs_open_pre_${storageKey}`, true);
  const [openPro, setOpenPro] = useLocalStorage<boolean>(`needs_open_pro_${storageKey}`, true);

  const projectCountry = (project as AnyRecord)?.country || 'ES';
  const projectRegion = (project as AnyRecord)?.region || 'CT';
  const { holidayFull, holidayMD } = useHolidays(projectCountry, projectRegion);

  // Manage needs data
  const { isLoaded, preEntries, proEntries } = useNeedsData({
    needs,
    storageKey,
    setNeeds,
    setHasError,
    setErrorMessage,
    holidayFull,
    holidayMD,
  });

  const shootingDayOffsets = useMemo(() => {
    let count = 0;
    const map: Record<string, number> = {};
    const allWeeks: NeedsWeek[] = [...preEntries, ...proEntries].sort((a, b) => {
      const dateA = new Date((a as AnyRecord).startDate || 0).getTime();
      const dateB = new Date((b as AnyRecord).startDate || 0).getTime();
      return dateA - dateB;
    });
    for (const wk of allWeeks) {
      map[wk.id] = count;
      const days = (wk as AnyRecord)?.days || [];
      for (let i = 0; i < 7; i++) {
        const day: AnyRecord = (days as AnyRecord[])[i] || {};
        const jornadaRaw = day?.crewTipo ?? day?.tipo ?? '';
        const jornada = String(jornadaRaw).trim().toLowerCase();
        if (jornada === 'rodaje' || jornada === 'rodaje festivo') {
          count += 1;
        }
      }
    }
    return map;
  }, [preEntries, proEntries]);

  const { baseRoster, preRoster, pickRoster, refsRoster } = useRoster(
    project as AnyRecord | undefined,
    [],
    [],
    [],
    []
  );

  const rosterKey = useMemo(
    () => JSON.stringify({ baseRoster, preRoster, pickRoster, refsRoster }),
    [baseRoster, preRoster, pickRoster, refsRoster]
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (
      (!Array.isArray(baseRoster) || baseRoster.length === 0) &&
      (!Array.isArray(preRoster) || preRoster.length === 0) &&
      (!Array.isArray(pickRoster) || pickRoster.length === 0) &&
      (!Array.isArray(refsRoster) || refsRoster.length === 0)
    ) return;

    setNeeds(prev => {
      let changed = false;
      const syncWeeks = (weeks: AnyRecord[] = []) =>
        weeks.map(w => {
          const days = Array.isArray(w.days) ? w.days : [];
          const nextDays = days.map((d: AnyRecord) => {
            const tipo = String(d?.crewTipo || '').trim();
            if (tipo === 'Descanso' || tipo === 'Fin') {
              if (Array.isArray(d?.crewList) && d.crewList.length > 0) changed = true;
              if (Array.isArray(d?.preList) && d.preList.length > 0) changed = true;
              if (Array.isArray(d?.pickList) && d.pickList.length > 0) changed = true;
              if (Array.isArray(d?.refList) && d.refList.length > 0) changed = true;
              return { ...d, crewList: [], preList: [], pickList: [], refList: [] };
            }
            const current = Array.isArray(d?.crewList) ? d.crewList : [];
            const synced = current.length === 0
              ? (baseRoster || []).map((m: AnyRecord) => ({
                  role: m?.role,
                  name: m?.name || '',
                  gender: m?.gender,
                  source: 'base',
                }))
              : syncDayListWithRosterBlankOnly(current, baseRoster, 'base');
            const sameLength = current.length === synced.length;
            const sameMembers = sameLength && current.every((m: AnyRecord, idx: number) => {
              const s = synced[idx];
              return (m?.role || '') === (s?.role || '') &&
                (m?.name || '') === (s?.name || '') &&
                (m?.gender || '') === (s?.gender || '');
            });
            if (!sameMembers) changed = true;
            const currentPre = Array.isArray(d?.preList) ? d.preList : [];
            const syncedPre =
              currentPre.length === 0
                ? currentPre
                : syncDayListWithRosterBlankOnly(currentPre, preRoster || [], 'pre');
            const samePre = currentPre.length === syncedPre.length &&
              currentPre.every((m: AnyRecord, idx: number) => {
                const s = syncedPre[idx];
                return (m?.role || '') === (s?.role || '') &&
                  (m?.name || '') === (s?.name || '') &&
                  (m?.gender || '') === (s?.gender || '');
              });
            if (!samePre) changed = true;

            const currentPick = Array.isArray(d?.pickList) ? d.pickList : [];
            const syncedPick =
              currentPick.length === 0
                ? currentPick
                : syncDayListWithRosterBlankOnly(currentPick, pickRoster || [], 'pick');
            const samePick = currentPick.length === syncedPick.length &&
              currentPick.every((m: AnyRecord, idx: number) => {
                const s = syncedPick[idx];
                return (m?.role || '') === (s?.role || '') &&
                  (m?.name || '') === (s?.name || '') &&
                  (m?.gender || '') === (s?.gender || '');
              });
            if (!samePick) changed = true;

            const currentRef = Array.isArray(d?.refList) ? d.refList : [];
            const syncedRef =
              currentRef.length === 0
                ? currentRef
                : syncDayListWithRosterBlankOnly(currentRef, refsRoster || [], 'ref');
            const sameRef = currentRef.length === syncedRef.length &&
              currentRef.every((m: AnyRecord, idx: number) => {
                const s = syncedRef[idx];
                return (m?.role || '') === (s?.role || '') &&
                  (m?.name || '') === (s?.name || '') &&
                  (m?.gender || '') === (s?.gender || '');
              });
            if (!sameRef) changed = true;

            return { ...d, crewList: synced, preList: syncedPre, pickList: syncedPick, refList: syncedRef };
          });
          return { ...w, days: nextDays };
        });

      if (!changed) return prev;
      return {
        ...prev,
        pre: syncWeeks(prev.pre || []),
        pro: syncWeeks(prev.pro || []),
      };
    });
  }, [isLoaded, rosterKey, baseRoster, setNeeds]);

  // Actions
  const { setCell, setWeekStart, removeFromList, setWeekOpen, swapDays, addCustomRow, updateCustomRowLabel, removeCustomRow, addWeek, duplicateWeek, deleteWeek } = useNeedsActions({
    storageKey,
    readOnly,
    setNeeds,
    baseRoster,
    holidayFull,
    holidayMD,
  });

  // Export functions
  const exportWeekPDF = async (
    weekId: string,
    selectedRowKeys?: string[],
    selectedDayIdxs?: number[],
    includeEmptyRows?: boolean
  ) => {
    try {
      const w: AnyRecord | undefined =
        preEntries.find(wk => wk.id === weekId) ||
        proEntries.find(wk => wk.id === weekId);
      if (!w) {
        console.error('Week not found:', weekId);
        alert(t('needs.weekNotFound'));
        return;
      }
      const shootingDayOffset = shootingDayOffsets[weekId] || 0;
      
      // Mapeo de claves de fila a fieldKey/listKey
      const rowKeyToFieldKey: Record<string, string> = {
        [`${weekId}_loc`]: 'loc',
        [`${weekId}_seq`]: 'seq',
        [`${weekId}_shootDay`]: 'shootDay',
        [`${weekId}_crewList`]: 'crewList',
        [`${weekId}_refList`]: 'refList',
        [`${weekId}_needTransport`]: 'needTransport',
        [`${weekId}_transportExtra`]: 'transportExtra',
        [`${weekId}_needGroups`]: 'needGroups',
        [`${weekId}_needCranes`]: 'needCranes',
        [`${weekId}_extraMat`]: 'extraMat',
        [`${weekId}_precall`]: 'precall',
        [`${weekId}_preList`]: 'preList',
        [`${weekId}_pickList`]: 'pickList',
        [`${weekId}_needLight`]: 'needLight',
        [`${weekId}_obs`]: 'obs',
      };
      const customRows = Array.isArray(w?.customRows) ? w.customRows : [];
      customRows.forEach((row: AnyRecord) => {
        if (row?.id && row?.fieldKey) {
          rowKeyToFieldKey[`${weekId}_custom_${row.id}`] = row.fieldKey;
        }
      });
      
      // Si hay filas seleccionadas, filtrar los datos
      let valuesByDay = Array.from({ length: 7 }).map((_, i) => (w.days as AnyRecord)?.[i] || {});
      
      if (selectedRowKeys && selectedRowKeys.length > 0) {
        // Obtener los fieldKeys/listKeys seleccionados
        const selectedFields = selectedRowKeys
          .map(key => rowKeyToFieldKey[key])
          .filter(Boolean);
        const needsTipo = selectedFields.includes('shootDay');
        
        // Filtrar los datos para incluir solo las filas seleccionadas
        valuesByDay = valuesByDay.map(day => {
          const filteredDay: AnyRecord = {};
          
          // Incluir solo los campos seleccionados
        selectedFields.forEach(fieldKey => {
          if (fieldKey === 'crewList') {
            filteredDay.crewList = day.crewList;
            filteredDay.crewTxt = day.crewTxt;
            filteredDay.crewTipo = day.crewTipo ?? day.tipo;
            filteredDay.crewStart = day.crewStart ?? day.start;
            filteredDay.crewEnd = day.crewEnd ?? day.end;
          } else if (fieldKey === 'preList') {
            filteredDay.preList = day.preList;
            filteredDay.preNote = day.preNote ?? day.preTxt;
            filteredDay.prelightTipo = day.prelightTipo ?? day.preTipo;
            filteredDay.preStart = day.preStart ?? day.prelightStart;
            filteredDay.preEnd = day.preEnd ?? day.prelightEnd;
          } else if (fieldKey === 'pickList') {
            filteredDay.pickList = day.pickList;
            filteredDay.pickNote = day.pickNote ?? day.pickTxt;
            filteredDay.pickupTipo = day.pickupTipo ?? day.pickTipo;
            filteredDay.pickStart = day.pickStart ?? day.pickupStart;
            filteredDay.pickEnd = day.pickEnd ?? day.pickupEnd;
          } else if (fieldKey === 'refList') {
            filteredDay.refList = day.refList;
            filteredDay.refTxt = day.refTxt;
            filteredDay.refTipo = day.refTipo;
            filteredDay.refStart = day.refStart;
            filteredDay.refEnd = day.refEnd;
          } else {
            filteredDay[fieldKey] = day[fieldKey];
          }
        });
        if (needsTipo || selectedFields.includes('crewList')) {
          filteredDay.crewTipo = day.crewTipo ?? day.tipo;
        }
          
          return filteredDay;
        });
      }
      
      await exportToPDF(
        project,
        w.label || t('needs.week'),
        w.startDate || '',
        valuesByDay,
        selectedRowKeys, // Pasar las filas seleccionadas para que el HTML solo muestre esas filas
        selectedDayIdxs, // Pasar columnas seleccionadas (días)
        includeEmptyRows, // Incluir filas vacías cuando todo está activo
        customRows,
        shootingDayOffset,
        planFileName
      );
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert(t('needs.errorGeneratingPDF'));
    }
  };

  const handleImportFile = async (file: File) => {
    if (readOnly) return;
      setPlanFileName(file.name);
      setImportError('');
      setImportLoading(true);
    try {
      const result = await parsePlanPdf(file);
      if (!result.weeks.length) {
        setImportError(t('planning.importPlanNoData'));
        setImportResult(null);
        setImportPreviewOpen(false);
        return;
      }

      const existingByStart = new Map<string, { scope: 'pre' | 'pro'; id: string }>();
      preEntries.forEach(w => w.startDate && existingByStart.set(`pre_${w.startDate}`, { scope: 'pre', id: w.id }));
      proEntries.forEach(w => w.startDate && existingByStart.set(`pro_${w.startDate}`, { scope: 'pro', id: w.id }));

      const conflicts: ImportConflict[] = [];
      const decisions: Record<string, WeekDecision> = {};
      result.weeks.forEach(week => {
        const key = `${week.scope}_${week.startDate}`;
        const existing = existingByStart.get(key);
        if (existing) {
          conflicts.push({
            key,
            scope: week.scope,
            startDate: week.startDate,
            label: week.label,
            existingWeekId: existing.id,
          });
          decisions[key] = 'omit';
        } else {
          decisions[key] = 'import';
        }
      });

      setImportResult(result);
      setImportConflicts(conflicts);
      setImportDecisions(decisions);
      setImportPreviewOpen(true);
    } catch (error) {
      console.error('Error importing PDF:', error);
      setImportError(t('planning.importPlanUnreadable'));
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!importResult) return;
    setNeeds(prev => applyImportToNeeds(prev, importResult, importDecisions, baseRoster));
    setImportPreviewOpen(false);
  };

  const handleCloseImportPreview = () => {
    setImportPreviewOpen(false);
    setImportResult(null);
    setImportConflicts([]);
    setImportDecisions({});
    setImportFileName('');
    setImportError('');
  };

  const exportAllNeedsPDF = async () => {
    try {
      const allEntries = [...preEntries, ...proEntries];
      await exportAllToPDF(project, allEntries, planFileName);
    } catch (error) {
      console.error('Error exporting all needs PDF:', error);
      alert(t('needs.errorGeneratingPDF'));
    }
  };

  const exportScopePDF = async (scope: 'pre' | 'pro') => {
    try {
      const entries = scope === 'pre' ? preEntries : proEntries;
      const sortedEntries = [...entries].sort((a, b) => {
        const dateA = new Date((a as AnyRecord).startDate || 0).getTime();
        const dateB = new Date((b as AnyRecord).startDate || 0).getTime();
        return dateA - dateB;
      });
      await exportAllToPDF(project, sortedEntries, planFileName);
    } catch (error) {
      console.error('Error exporting scope PDF:', error);
      alert(t('needs.errorGeneratingPDF'));
    }
  };

  // Error boundary UI
  if (hasError) {
    return (
      <div className='space-y-4'>
        <div className='text-sm text-red-400 border border-red-800 rounded-xl p-4 bg-red-950/30'>
          <h3 className='font-semibold mb-2'>{t('needs.errorLoadingNeeds')}</h3>
          <p className='mb-3'>{errorMessage}</p>
          <button
            onClick={() => {
              setHasError(false);
              setErrorMessage('');
              window.location.reload();
            }}
            className='px-3 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-sm'
          >
            {t('needs.reloadPage')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id='print-root' className='space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6'>
      <NecesidadesTabContent
        preEntries={preEntries}
        proEntries={proEntries}
        DAYS={DAYS}
        readOnly={readOnly}
        openPre={openPre}
        openPro={openPro}
        setOpenPre={setOpenPre}
        setOpenPro={setOpenPro}
        baseRoster={baseRoster}
        preRoster={preRoster}
        pickRoster={pickRoster}
        refsRoster={refsRoster}
        shootingDayOffsets={shootingDayOffsets}
        setCell={setCell}
        setWeekStart={setWeekStart}
        removeFromList={removeFromList}
        setWeekOpen={setWeekOpen}
        exportWeekPDF={exportWeekPDF}
        addWeek={addWeek}
        duplicateWeek={duplicateWeek}
        deleteWeek={deleteWeek}
        exportAllNeedsPDF={exportAllNeedsPDF}
        exportScopePDF={exportScopePDF}
        swapDays={swapDays}
        addCustomRow={addCustomRow}
        updateCustomRowLabel={updateCustomRowLabel}
        removeCustomRow={removeCustomRow}
        onImportPlanFile={handleImportFile}
        importFileName={planFileName}
        importError={importError}
        importLoading={importLoading}
        importPreviewOpen={importPreviewOpen}
        importResult={importResult}
        importConflicts={importConflicts}
        importDecisions={importDecisions}
        setImportDecisions={setImportDecisions}
        onCloseImportPreview={handleCloseImportPreview}
        onConfirmImport={handleConfirmImport}
      />
    </div>
  );
}
