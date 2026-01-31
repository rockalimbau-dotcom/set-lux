import { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Th, Td } from '@shared/components';
import ToggleIconButton from '@shared/components/ToggleIconButton';
import { AnyRecord } from '@shared/types/common';
import { btnExport } from '@shared/utils/tailwindClasses';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import FieldRow from '../../components/FieldRow';
import { JornadaRow } from '../../components/JornadaRow';
import { ScheduleRow } from '../../components/ScheduleRow';
import { MembersRow } from '../../components/MembersRow';
import TextAreaAuto from '../../components/TextAreaAuto';
import { DayInfo } from './NecesidadesTabTypes';
import { parseYYYYMMDD, addDays, formatDDMMYYYY, translateWeekLabel } from './NecesidadesTabUtils';
import { useRowSelection } from '../../hooks/useRowSelection';
import { useColumnSelection } from '../../hooks/useColumnSelection';
import { ConfirmModal } from '../../components/ConfirmModal';

interface SelectedDayForSwap {
  weekId: string;
  dayIdx: number;
}

interface WeekSectionProps {
  wid: string;
  wk: AnyRecord;
  DAYS: DayInfo[];
  scope: 'pre' | 'pro';
  baseRoster?: AnyRecord[];
  preRoster?: AnyRecord[];
  pickRoster?: AnyRecord[];
  refsRoster?: AnyRecord[];
  shootingDayOffset?: number;
  setCell: (weekId: string, dayIdx: number, fieldKey: string, value: unknown) => void;
  setWeekStart: (weekId: string, date: string) => void;
  removeFromList: (weekId: string, dayIdx: number, listKey: string, idx: number) => void;
  setWeekOpen: (weekId: string, isOpen: boolean) => void;
  exportWeekPDF: (
    weekId: string,
    selectedRowKeys?: string[],
    selectedDayIdxs?: number[],
    includeEmptyRows?: boolean
  ) => void;
  duplicateWeek: (scope: 'pre' | 'pro', weekId: string) => void;
  deleteWeek: (scope: 'pre' | 'pro', weekId: string) => void;
  readOnly: boolean;
  swapDays: (weekId1: string, dayIdx1: number, weekId2: string, dayIdx2: number) => void;
  selectedDayForSwap: SelectedDayForSwap | null;
  selectDayForSwap: (weekId: string, dayIdx: number) => void;
  clearSelection: () => void;
  isDaySelected: (weekId: string, dayIdx: number) => boolean;
  weekEntries: AnyRecord[]; // Para obtener etiquetas de semanas
  addCustomRow: (weekId: string) => string | null;
  updateCustomRowLabel: (weekId: string, rowId: string, label: string) => void;
  removeCustomRow: (weekId: string, rowId: string) => void;
  tutorialId?: string;
}

export function WeekSection({
  wid,
  wk,
  DAYS,
  scope,
  baseRoster = [],
  preRoster = [],
  pickRoster = [],
  refsRoster = [],
  shootingDayOffset = 0,
  setCell,
  setWeekStart,
  removeFromList,
  setWeekOpen,
  exportWeekPDF,
  duplicateWeek,
  deleteWeek,
  readOnly,
  swapDays,
  selectedDayForSwap,
  selectDayForSwap,
  clearSelection,
  isDaySelected,
  weekEntries,
  addCustomRow,
  updateCustomRowLabel,
  removeCustomRow,
  tutorialId,
}: WeekSectionProps) {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
    }
    return 'light';
  });
  const monday = parseYYYYMMDD(wk.startDate);
  const datesRow = useMemo(() => DAYS.map((_, i) => formatDDMMYYYY(addDays(monday, i))), [monday, DAYS]);
  const reinforcementOptions = useMemo(
    () => [
      ...refsRoster.map(m => ({ ...m, source: m?.source || 'ref' })),
      ...preRoster.map(m => ({ ...m, source: m?.source || 'pre' })),
      ...pickRoster.map(m => ({ ...m, source: m?.source || 'pick' })),
    ],
    [refsRoster, preRoster, pickRoster]
  );
  const allTeamOptions = useMemo(
    () => [
      ...baseRoster.map(m => ({ ...m, source: m?.source || 'base' })),
      ...refsRoster.map(m => ({ ...m, source: m?.source || 'ref' })),
      ...preRoster.map(m => ({ ...m, source: m?.source || 'pre' })),
      ...pickRoster.map(m => ({ ...m, source: m?.source || 'pick' })),
    ],
    [baseRoster, refsRoster, preRoster, pickRoster]
  );
  const prelightOptions = useMemo(
    () => [
      ...preRoster.map(m => ({ ...m, source: m?.source || 'pre' })),
      ...baseRoster.map(m => ({ ...m, source: m?.source || 'base' })),
      ...refsRoster.map(m => ({ ...m, source: m?.source || 'ref' })),
    ],
    [baseRoster, refsRoster, preRoster]
  );
  const pickupOptions = useMemo(
    () => [
      ...pickRoster.map(m => ({ ...m, source: m?.source || 'pick' })),
      ...baseRoster.map(m => ({ ...m, source: m?.source || 'base' })),
      ...refsRoster.map(m => ({ ...m, source: m?.source || 'ref' })),
    ],
    [baseRoster, refsRoster, pickRoster]
  );
  const shootingDayLabels = useMemo(() => {
    let count = shootingDayOffset;
    return DAYS.map((_, i) => {
      const day: AnyRecord = (wk as AnyRecord).days?.[i] || {};
      const jornadaRaw = day?.crewTipo ?? day?.tipo ?? '';
      const jornada = String(jornadaRaw).trim().toLowerCase();
      if (jornada === 'rodaje' || jornada === 'rodaje festivo') {
        count += 1;
        return `DÍA ${count}`;
      }
      return '';
    });
  }, [DAYS, wk, shootingDayOffset]);
  const isDark = theme === 'dark';
  const focusColor = theme === 'light' ? '#0476D9' : '#F27405';
  
  // Estado para el modal de confirmación de intercambio
  const [swapConfirmation, setSwapConfirmation] = useState<{
    weekId1: string;
    dayIdx1: number;
    weekId2: string;
    dayIdx2: number;
    dayName1: string;
    dayName2: string;
    weekLabel1: string;
    weekLabel2: string;
  } | null>(null);
  const [customRowToRemove, setCustomRowToRemove] = useState<{
    weekId: string;
    rowId: string;
    label: string;
  } | null>(null);
  const [attachmentInfoOpen, setAttachmentInfoOpen] = useState(false);
  const [weekDeleteOpen, setWeekDeleteOpen] = useState(false);
  const [showExportControls, setShowExportControls] = useState(false);
  const totalColumns = DAYS.length + (showExportControls ? 2 : 1);
  const [swapMode, setSwapMode] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const [actionsButtonHovered, setActionsButtonHovered] = useState(false);
  const [actionsHoveredOption, setActionsHoveredOption] = useState<string | null>(null);
  const [hideEmptyRows, setHideEmptyRows] = useState(false);
  const [collapsedBlocks, setCollapsedBlocks] = useLocalStorage<Record<string, boolean>>(
    `needs_collapsed_${wid}`,
    {
      team: false,
      logistics: false,
      extraCrew: false,
      notes: false,
    }
  );

  // Definir todas las claves de filas para esta semana
  const customRows = useMemo(
    () => (Array.isArray(wk?.customRows) ? wk.customRows : []),
    [wk?.customRows]
  );
  const rowKeys = useMemo(() => {
    const base = [
      `${wid}_loc`, // Location + Sequences (merged)
      `${wid}_shootDay`, // Shooting Day
      `${wid}_crewList`, // Base Team
      `${wid}_refList`, // Reinforcements
      `${wid}_needTransport`, // Transport
      `${wid}_transportExtra`, // Transport Extra
      `${wid}_needGroups`, // Groups
      `${wid}_needCranes`, // Cranes
      `${wid}_extraMat`, // Extra Material
      `${wid}_precall`, // Precall
      `${wid}_preList`, // Prelight
      `${wid}_pickList`, // Pickup
      `${wid}_needLight`, // Light Needs
      `${wid}_obs`, // Observations
    ];
    const custom = customRows.map(row => `${wid}_custom_${row.id}`);
    return [...base, ...custom];
  }, [wid, customRows]);

  // Hook para gestionar selección de filas
  const { toggleRowSelection, isRowSelected, selectRow } = useRowSelection({
    persistKey: `needs_${wid}`,
    rowKeys,
  });

  // Hook para selección de columnas (días)
  const {
    selectedColumns,
    toggleColumnSelection,
    setAllColumns,
    isColumnSelected,
    columnKeys,
  } = useColumnSelection({
    persistKey: `needs_${wid}`,
    columnCount: DAYS.length,
  });
  const allColumnsSelected = columnKeys.length > 0 && columnKeys.every(idx => isColumnSelected(idx));
  const allRowsSelected = rowKeys.length > 0 && rowKeys.every(key => isRowSelected(key));

  const btnExportCls = btnExport;
  const btnExportStyle = {
    background: '#f59e0b',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  } as React.CSSProperties;
  const actionBtnSize = 'h-[28px] sm:h-[32px] md:h-[36px] inline-flex items-center justify-center';

  const rawDays = (wk as AnyRecord).days;
  const days = (Array.isArray(rawDays) ? rawDays : []) as AnyRecord[];
  const hasAnyValue = (keys: string[]) =>
    days.some(day => keys.some(key => String(day?.[key] ?? '').trim() !== ''));
  const hasAnyList = (key: string) =>
    days.some(day => Array.isArray(day?.[key]) && (day[key] as AnyRecord[]).length > 0);
  const isBlockCollapsed = (key: string) => !!collapsedBlocks[key];
  const toggleBlock = (key: string) =>
    setCollapsedBlocks(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        const currentTheme = (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
        setTheme(currentTheme);
      }
    };

    const observer = new MutationObserver(updateTheme);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (readOnly) return;
    const currentDays = (wk as AnyRecord).days;
    if (!Array.isArray(currentDays)) return;
    currentDays.forEach((day: AnyRecord, idx: number) => {
      if (!day?.crewTipo) {
        const fallbackTipo = day?.tipo;
        setCell(wid, idx, 'crewTipo', fallbackTipo || (idx >= 5 ? 'Descanso' : 'Rodaje'));
      }
    });
  }, [wk, readOnly, setCell, wid]);

  useEffect(() => {
    if (readOnly) return;
    const currentDays = (wk as AnyRecord).days;
    if (!Array.isArray(currentDays)) return;
    currentDays.forEach((day: AnyRecord, idx: number) => {
      const crewTipo = String(day?.crewTipo || '').toLowerCase();
      if (crewTipo === 'descanso' && day?.loc !== 'Descanso') {
        setCell(wid, idx, 'loc', 'Descanso');
        setCell(wid, idx, 'seq', '');
      }
      if (crewTipo === 'fin' && day?.loc !== 'Fin') {
        setCell(wid, idx, 'loc', 'Fin');
        setCell(wid, idx, 'seq', '');
      }
    });
  }, [wk, readOnly, setCell, wid]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!actionsRef.current) return;
      if (!actionsRef.current.contains(event.target as Node)) {
        setActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  return (
    <section
      key={wid}
      className='rounded sm:rounded-lg md:rounded-xl lg:rounded-2xl border border-neutral-border bg-neutral-panel/90'
      data-tutorial={tutorialId}
    >
      <div
        className='flex flex-col gap-1.5 sm:gap-2 md:gap-3 px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-5 lg:py-4'
        data-tutorial={tutorialId ? 'needs-week-header' : undefined}
      >
        <div className='flex items-center justify-between gap-1.5 sm:gap-2 md:gap-3'>
          <div className='flex items-center gap-1.5 sm:gap-2 md:gap-3'>
            <ToggleIconButton
              isOpen={wk.open}
              onClick={() => !readOnly && setWeekOpen(wid, !wk.open)}
              className='w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8'
            />
            <div className='text-brand font-semibold text-xs sm:text-sm md:text-base'>
              {translateWeekLabel(wk.label || t('needs.week'), t)}
            </div>
          </div>
          <div className='flex items-center gap-1 sm:gap-1.5 md:gap-2'>
            <div className='relative' ref={actionsRef}>
              <button
                className={`no-pdf ${actionBtnSize} px-2 sm:px-2.5 md:px-3 rounded sm:rounded-md md:rounded-lg border text-[10px] sm:text-xs md:text-sm font-semibold whitespace-nowrap text-left transition-colors bg-neutral-panel/95 text-gray-900 dark:text-zinc-300`}
                onClick={() => setActionsOpen(v => !v)}
                onMouseEnter={() => setActionsButtonHovered(true)}
                onMouseLeave={() => setActionsButtonHovered(false)}
                onBlur={() => setActionsButtonHovered(false)}
                title={t('needs.selectForExport')}
                type='button'
                style={{
                  borderWidth: actionsButtonHovered ? '1.5px' : '1px',
                  borderStyle: 'solid',
                  borderColor: actionsButtonHovered && theme === 'light'
                    ? '#0476D9'
                    : (actionsButtonHovered && theme === 'dark'
                      ? '#fff'
                      : 'var(--border)'),
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M5 7.5L1.25 3.75h7.5z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.6rem center',
                  paddingRight: '1.6rem',
                }}
              >
                ☑ ↔
              </button>
              {actionsOpen && (
                <div className='no-pdf absolute left-0 mt-0.5 sm:mt-1 min-w-[160px] w-full border border-neutral-border rounded sm:rounded-md md:rounded-lg shadow-lg z-10 bg-white dark:bg-neutral-panel/95'>
                  <button
                    className={`w-full text-left px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[9px] sm:text-[10px] md:text-xs transition-colors ${
                      theme === 'light' ? 'text-gray-900' : 'text-zinc-300'
                    }`}
                    onClick={() => {
                      setActionsOpen(false);
                      setShowExportControls(v => !v);
                    }}
                    onMouseEnter={() => setActionsHoveredOption('select')}
                    onMouseLeave={() => setActionsHoveredOption(null)}
                    type='button'
                    style={{
                      backgroundColor: actionsHoveredOption === 'select'
                        ? (theme === 'light' ? '#A0D3F2' : focusColor)
                        : 'transparent',
                      color: actionsHoveredOption === 'select'
                        ? (theme === 'light' ? '#111827' : 'white')
                        : 'inherit',
                    }}
                  >
                    ☑ {t('needs.select')}
                  </button>
                  <button
                    className={`w-full text-left px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[9px] sm:text-[10px] md:text-xs transition-colors ${
                      theme === 'light' ? 'text-gray-900' : 'text-zinc-300'
                    }`}
                    onClick={() => {
                      setActionsOpen(false);
                      setSwapMode(v => {
                        const next = !v;
                        if (!next) clearSelection();
                        return next;
                      });
                    }}
                    onMouseEnter={() => setActionsHoveredOption('swap')}
                    onMouseLeave={() => setActionsHoveredOption(null)}
                    type='button'
                    style={{
                      backgroundColor: actionsHoveredOption === 'swap'
                        ? (theme === 'light' ? '#A0D3F2' : focusColor)
                        : 'transparent',
                      color: actionsHoveredOption === 'swap'
                        ? (theme === 'light' ? '#111827' : 'white')
                        : 'inherit',
                    }}
                  >
                    ↔ {t('needs.swap')}
                  </button>
                </div>
              )}
            </div>
            <button
              className={`no-pdf ${actionBtnSize} px-2 sm:px-2.5 md:px-3 rounded text-[10px] sm:text-xs md:text-sm font-semibold whitespace-nowrap`}
              style={{...btnExportStyle, background: '#f59e0b'}}
              onClick={() => {
                const selectedRowKeys = rowKeys.filter(key => isRowSelected(key));
                const selectedDayIdxs = columnKeys.filter(idx => selectedColumns.has(idx));
                const useSelectedDays =
                  selectedDayIdxs.length > 0 && selectedDayIdxs.length < columnKeys.length
                    ? selectedDayIdxs
                    : undefined;
                const includeEmptyRows = false;
                exportWeekPDF(
                  wid,
                  selectedRowKeys.length > 0 ? selectedRowKeys : undefined,
                  useSelectedDays,
                  includeEmptyRows
                );
              }}
              title={t('planning.exportWeekPDF')}
              type='button'
            >
              PDF
            </button>
            <button
              onClick={() => !readOnly && duplicateWeek(scope, wid)}
              disabled={readOnly}
              className={`no-pdf ${actionBtnSize} px-2 sm:px-2.5 md:px-3 rounded sm:rounded-md md:rounded-lg border text-[10px] sm:text-xs md:text-sm border-neutral-border hover:border-[#F59E0B] whitespace-nowrap transition ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={readOnly ? t('conditions.projectClosed') : t('planning.duplicateWeek')}
              type='button'
            >
              {t('planning.duplicate')}
            </button>
            <button
              onClick={() => !readOnly && setWeekDeleteOpen(true)}
              disabled={readOnly}
              className={`no-pdf btn-danger ${actionBtnSize} px-2 sm:px-2.5 md:px-3 rounded sm:rounded-md md:rounded-lg border text-white text-[10px] sm:text-xs md:text-sm font-semibold ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={readOnly ? t('conditions.projectClosed') : t('planning.deleteWeek')}
              type='button'
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      {wk.open && (
        <div className='overflow-x-auto px-3 pb-3 sm:px-4 sm:pb-4 md:px-5 md:pb-5'>
          <table className='min-w-[600px] sm:min-w-[680px] md:min-w-[760px] w-full table-fixed border-collapse text-[9px] sm:text-[10px] md:text-xs lg:text-sm'>
            <colgroup>
              {showExportControls && <col className='w-6 sm:w-7 md:w-8' />}
              <col className='w-[95px] sm:w-[110px] md:w-[125px] lg:w-[140px]' />
              <col span={DAYS.length} className='w-[110px] sm:w-[130px] md:w-[150px] lg:w-[170px]' />
            </colgroup>
            <thead>
              <tr>
                {showExportControls && (
                  <Th align='center' className='w-6 sm:w-7 md:w-8 px-0.5'>
                    <div className='flex justify-center'>
                      <input
                        type='checkbox'
                        checked={rowKeys.length > 0 && rowKeys.every(key => isRowSelected(key))}
                        onChange={e => {
                          if (readOnly) return;
                          if (e.target.checked) {
                            // Seleccionar todas
                            rowKeys.forEach(key => {
                              if (!isRowSelected(key)) {
                                toggleRowSelection(key);
                              }
                            });
                          } else {
                            // Deseleccionar todas
                            rowKeys.forEach(key => {
                              if (isRowSelected(key)) {
                                toggleRowSelection(key);
                              }
                            });
                          }
                        }}
                        disabled={readOnly}
                        onClick={e => {
                          e.stopPropagation();
                        }}
                        title={rowKeys.length > 0 && rowKeys.every(key => isRowSelected(key)) ? t('needs.deselectForExport') : t('needs.selectForExport')}
                        className='accent-blue-500 dark:accent-[#f59e0b] cursor-pointer scale-90 transition opacity-70 hover:opacity-100'
                      />
                    </div>
                  </Th>
                )}
                <Th className='px-1'>
                  <div className='flex items-center justify-between gap-1'>
                    <span>{t('needs.fieldDay')}</span>
                    <input
                      type='checkbox'
                      checked={allColumnsSelected}
                      onChange={e => {
                        if (readOnly) return;
                        setAllColumns(e.target.checked);
                      }}
                      disabled={readOnly}
                      onClick={e => e.stopPropagation()}
                      title={t('needs.selectForExport')}
                      className={`accent-blue-500 dark:accent-[#f59e0b] scale-90 transition ${
                        readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      } ${showExportControls ? 'opacity-70 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
                    />
                  </div>
                </Th>
                {DAYS.map((d, i) => {
                  const isSelected = isDaySelected(wid, i);
                  const hasSelection = selectedDayForSwap !== null;
                  const isOtherSelected = hasSelection && !isSelected;
                  
                  return (
                    <Th
                      key={d.key} 
                      align='center' 
                      className={`text-center relative group ${isSelected ? 'bg-blue-500/20 dark:bg-blue-500/30 border-2 border-blue-500' : ''} ${isOtherSelected ? 'hover:bg-zinc-100/10 dark:hover:bg-zinc-800/20' : ''}`}
                    >
                      <div className='flex items-center justify-between gap-1 min-h-[20px] sm:min-h-[24px] md:min-h-[28px]'>
                        <div className='w-4 flex justify-start'>
                          {swapMode && (
                            !hasSelection ? (
                              <button
                                onClick={() => !readOnly && selectDayForSwap(wid, i)}
                                disabled={readOnly}
                                className={`px-1 py-0.5 h-[20px] sm:h-[24px] md:h-[28px] text-[10px] rounded border transition ${
                                  readOnly
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'cursor-pointer hover:bg-blue-500/20 dark:hover:bg-[#f59e0b]/40'
                                } ${isSelected ? 'bg-blue-500/30 border-blue-500 dark:bg-[#f59e0b]/45 dark:border-[#f59e0b]' : 'border-neutral-border'} ${swapMode ? 'opacity-100 bg-blue-500/10 dark:bg-[#f59e0b]/15 border-blue-500/40 dark:border-[#f59e0b]/40' : ''}`}
                                title={readOnly ? t('conditions.projectClosed') : t('needs.selectForSwap')}
                              >
                                ↔
                              </button>
                            ) : isSelected ? (
                              <button
                                onClick={() => !readOnly && clearSelection()}
                                disabled={readOnly}
                                className='px-1 py-0.5 h-[20px] sm:h-[24px] md:h-[28px] text-[10px] rounded border border-red-500 bg-red-500/30 text-red-500 hover:bg-red-500/40 transition opacity-100 cursor-pointer'
                                title={t('needs.cancelSelection')}
                              >
                                ✕
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (readOnly || !selectedDayForSwap) return;
                                  const day1 = DAYS.find((_, idx) => idx === selectedDayForSwap.dayIdx);
                                  const day2 = DAYS[i];
                                  const week1Entry = weekEntries.find((entry: AnyRecord) => entry?.id === selectedDayForSwap.weekId);
                                  const week2Entry = weekEntries.find((entry: AnyRecord) => entry?.id === wid);
                                  const week1Label = week1Entry ? translateWeekLabel(week1Entry?.label || t('needs.week'), t) : selectedDayForSwap.weekId;
                                  const week2Label = week2Entry ? translateWeekLabel(week2Entry?.label || t('needs.week'), t) : translateWeekLabel(wk.label || t('needs.week'), t);
                                  setSwapConfirmation({
                                    weekId1: selectedDayForSwap.weekId,
                                    dayIdx1: selectedDayForSwap.dayIdx,
                                    weekId2: wid,
                                    dayIdx2: i,
                                    dayName1: day1?.name || `${selectedDayForSwap.dayIdx + 1}`,
                                    dayName2: day2.name,
                                    weekLabel1: week1Label,
                                    weekLabel2: week2Label,
                                  });
                                }}
                                disabled={readOnly}
                                className='px-1 py-0.5 h-[20px] sm:h-[24px] md:h-[28px] text-[10px] rounded border border-green-500 bg-green-500/30 text-green-500 hover:bg-green-500/40 transition opacity-100 cursor-pointer'
                                title={t('needs.swapWithSelected')}
                              >
                                ↔
                              </button>
                            )
                          )}
                        </div>
                        <div className='text-[9px] sm:text-[10px] md:text-xs lg:text-sm'>
                          {d.name}
                        </div>
                        <div className='w-4 flex justify-end'>
                          <input
                            type='checkbox'
                            checked={isColumnSelected(i)}
                            onChange={() => {
                              if (readOnly) return;
                              toggleColumnSelection(i);
                            }}
                            disabled={readOnly}
                            onClick={e => e.stopPropagation()}
                            title={t('needs.selectForExport')}
                            className={`accent-blue-500 dark:accent-[#f59e0b] scale-90 transition h-[20px] sm:h-[24px] md:h-[28px] ${
                              readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            } ${showExportControls ? 'opacity-70 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
                          />
                        </div>
                      </div>
                    </Th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr>
                {showExportControls && (
                  <Td align='middle' className='text-center w-6 sm:w-7 md:w-8 px-0.5'>
                    <div className='flex justify-center'>
                      <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400'>—</span>
                    </div>
                  </Td>
                )}
                <Td className='border border-neutral-border px-1 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 font-semibold bg-white/5 whitespace-normal break-words text-[9px] sm:text-[10px] md:text-xs lg:text-sm align-middle'>
                  {t('needs.date')}
                </Td>
                {DAYS.map((d, i) => (
                  <Td key={d.key} align='middle' className='text-center'>
                    <div className='flex items-center justify-center min-h-[20px] sm:min-h-[24px] md:min-h-[28px]'>
                      {i === 0 ? (
                        <input
                          type='date'
                          value={(wk.startDate as string) || ''}
                          onChange={(e) => !readOnly && setWeekStart(wid, e.target.value)}
                          disabled={readOnly}
                          className={`w-full px-1 py-0.5 rounded border text-[9px] sm:text-[10px] md:text-xs ${
                            readOnly ? 'opacity-50 cursor-not-allowed' : ''
                          } ${'bg-white text-gray-900 dark:bg-black/40 dark:text-zinc-300'}`}
                          style={{ borderColor: 'var(--border)' }}
                        />
                      ) : (
                        <span className='text-[9px] sm:text-[10px] md:text-xs'>{datesRow[i]}</span>
                      )}
                    </div>
                  </Td>
                ))}
              </tr>
              {(!hideEmptyRows || hasAnyValue(['loc', 'seq'])) && (
                <tr>
                  {showExportControls && (
                    <Td align='middle' className='text-center w-6 sm:w-7 md:w-8 px-0.5'>
                      <div className='flex justify-center'>
                        <input
                          type='checkbox'
                          checked={isRowSelected(`${wid}_loc`)}
                          onChange={() => !readOnly && toggleRowSelection(`${wid}_loc`)}
                          disabled={readOnly}
                          title={readOnly ? t('conditions.projectClosed') : (isRowSelected(`${wid}_loc`) ? t('needs.deselectForExport') : t('needs.selectForExport'))}
                          className={`accent-blue-500 dark:accent-[#f59e0b] scale-90 transition ${
                            readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          } opacity-70 hover:opacity-100`}
                        />
                      </div>
                    </Td>
                  )}
                  <Td className='border border-neutral-border px-1 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 font-semibold bg-white/5 whitespace-normal break-words text-[9px] sm:text-[10px] md:text-xs lg:text-sm align-middle'>
                    {t('needs.locationSequences')}
                  </Td>
                  {DAYS.map((d, i) => {
                    const locValue = (wk?.days?.[i]?.loc as string) || '';
                    const seqValue = (wk?.days?.[i]?.seq as string) || '';
                    const translatedLoc =
                      locValue === 'Descanso'
                        ? t('planning.rest')
                        : locValue === 'Fin'
                          ? t('planning.end')
                          : locValue;
                    const combinedValue = seqValue ? [translatedLoc, seqValue].filter(Boolean).join('\n') : translatedLoc;
                    return (
                      <Td key={d.key} align='middle' className='text-center'>
                        <div className='flex flex-col items-center justify-center gap-1'>
                          <TextAreaAuto
                            value={combinedValue}
                            onChange={(val: string) => {
                              if (readOnly) return;
                              setCell(wid, i, 'loc', val);
                              setCell(wid, i, 'seq', '');
                            }}
                            placeholder={t('needs.locationSequencesExample')}
                            readOnly={readOnly}
                            minHeightClass='min-h-[40px] sm:min-h-[48px] md:min-h-[56px]'
                          />
                        </div>
                      </Td>
                    );
                  })}
                </tr>
              )}
              {(!hideEmptyRows || hasAnyValue(['crewTipo'])) && (
                <tr>
                  {showExportControls && (
                    <Td align='middle' className='text-center w-6 sm:w-7 md:w-8 px-0.5'>
                      <div className='flex justify-center'>
                        <input
                          type='checkbox'
                          checked={isRowSelected(`${wid}_shootDay`)}
                          onChange={() => !readOnly && toggleRowSelection(`${wid}_shootDay`)}
                          disabled={readOnly}
                          title={readOnly ? t('conditions.projectClosed') : (isRowSelected(`${wid}_shootDay`) ? t('needs.deselectForExport') : t('needs.selectForExport'))}
                          className={`accent-blue-500 dark:accent-[#f59e0b] scale-90 transition ${
                            readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          } opacity-70 hover:opacity-100`}
                        />
                      </div>
                    </Td>
                  )}
                  <Td className='border border-neutral-border px-1 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 font-semibold bg-white/5 whitespace-normal break-words text-[9px] sm:text-[10px] md:text-xs lg:text-sm align-middle'>
                    {t('needs.shootingDay')}
                  </Td>
                  {DAYS.map((d, i) => (
                    <Td key={d.key} align='middle' className='text-center'>
                      <div className='flex items-center justify-center min-h-[20px] sm:min-h-[24px] md:min-h-[28px]'>
                        <span className='text-[9px] sm:text-[10px] md:text-xs'>{shootingDayLabels[i] || ''}</span>
                      </div>
                    </Td>
                  ))}
                </tr>
              )}
              <tr>
                <Td
                  colSpan={totalColumns}
                  align='middle'
                  className='phase-block border border-neutral-border/70 px-1 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 bg-white/5 text-[9px] sm:text-[10px] md:text-xs lg:text-sm'
                >
                  <button
                    type='button'
                    onClick={() => toggleBlock('team')}
                    className='w-full flex items-center gap-2 font-medium'
                    style={{ color: 'var(--text)' }}
                  >
                    <span className={`transition-transform opacity-80 text-[8px] sm:text-[9px] md:text-[10px] ${isBlockCollapsed('team') ? '-rotate-90' : ''}`}>⌄</span>
                    <span>Equipo</span>
                  </button>
                </Td>
              </tr>
              {!isBlockCollapsed('team') && (!hideEmptyRows || hasAnyList('crewList')) && (
                <MembersRow
                  label={t('needs.technicalTeam')}
                  listKey='crewList'
                  weekId={wid}
                  weekObj={wk}
                  options={baseRoster}
                  removeFromList={removeFromList}
                  setCell={setCell}
                  readOnly={readOnly}
                  rowKey={`${wid}_crewList`}
                  isSelected={isRowSelected(`${wid}_crewList`)}
                  toggleRowSelection={toggleRowSelection}
                  showSelection={showExportControls}
                  showSchedule
                  jornadaKey='crewTipo'
                  startKey='crewStart'
                  endKey='crewEnd'
                />
              )}
              {!isBlockCollapsed('team') && (!hideEmptyRows || hasAnyList('refList') || hasAnyValue(['refStart', 'refEnd', 'refTipo'])) && (
                <MembersRow
                  label={t('needs.reinforcements')}
                  listKey='refList'
                  weekId={wid}
                  weekObj={wk}
                  options={reinforcementOptions}
                  removeFromList={removeFromList}
                  setCell={setCell}
                  readOnly={readOnly}
                  rowKey={`${wid}_refList`}
                  isSelected={isRowSelected(`${wid}_refList`)}
                  toggleRowSelection={toggleRowSelection}
                  showSelection={showExportControls}
                  showSchedule
                  jornadaKey='refTipo'
                  startKey='refStart'
                  endKey='refEnd'
                  collapsible
                  defaultCollapsed
                />
              )}
              <tr>
                <Td
                  colSpan={totalColumns}
                  align='middle'
                  className='phase-block border border-neutral-border/70 px-1 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 bg-white/5 text-[9px] sm:text-[10px] md:text-xs lg:text-sm'
                >
                  <button
                    type='button'
                    onClick={() => toggleBlock('logistics')}
                    className='w-full flex items-center gap-2 font-medium'
                    style={{ color: 'var(--text)' }}
                  >
                    <span className={`transition-transform opacity-80 text-[8px] sm:text-[9px] md:text-[10px] ${isBlockCollapsed('logistics') ? '-rotate-90' : ''}`}>⌄</span>
                    <span>Logística</span>
                  </button>
                </Td>
              </tr>
              {!isBlockCollapsed('logistics') && (!hideEmptyRows || hasAnyValue(['needTransport'])) && (
                <FieldRow
                  weekId={wid}
                  weekObj={wk}
                  fieldKey='needTransport'
                  label={t('needs.transport')}
                  setCell={setCell}
                  readOnly={readOnly}
                  rowKey={`${wid}_needTransport`}
                  isSelected={isRowSelected(`${wid}_needTransport`)}
                  toggleRowSelection={toggleRowSelection}
                  showSelection={showExportControls}
                  showAttachment
                  onAttachmentClick={() => setAttachmentInfoOpen(true)}
                />
              )}
              {!isBlockCollapsed('logistics') && (!hideEmptyRows || hasAnyValue(['transportExtra'])) && (
                <FieldRow
                  weekId={wid}
                  weekObj={wk}
                  fieldKey='transportExtra'
                  label={t('needs.transportExtra')}
                  setCell={setCell}
                  readOnly={readOnly}
                  rowKey={`${wid}_transportExtra`}
                  isSelected={isRowSelected(`${wid}_transportExtra`)}
                  toggleRowSelection={toggleRowSelection}
                  showSelection={showExportControls}
                  showAttachment
                  onAttachmentClick={() => setAttachmentInfoOpen(true)}
                />
              )}
              {!isBlockCollapsed('logistics') && (!hideEmptyRows || hasAnyValue(['needGroups'])) && (
                <FieldRow
                  weekId={wid}
                  weekObj={wk}
                  fieldKey='needGroups'
                  label={t('needs.groups')}
                  setCell={setCell}
                  readOnly={readOnly}
                  rowKey={`${wid}_needGroups`}
                  isSelected={isRowSelected(`${wid}_needGroups`)}
                  toggleRowSelection={toggleRowSelection}
                  showSelection={showExportControls}
                  showAttachment
                  onAttachmentClick={() => setAttachmentInfoOpen(true)}
                />
              )}
              {!isBlockCollapsed('logistics') && (!hideEmptyRows || hasAnyValue(['needCranes'])) && (
                <FieldRow
                  weekId={wid}
                  weekObj={wk}
                  fieldKey='needCranes'
                  label={t('needs.cranes')}
                  setCell={setCell}
                  readOnly={readOnly}
                  rowKey={`${wid}_needCranes`}
                  isSelected={isRowSelected(`${wid}_needCranes`)}
                  toggleRowSelection={toggleRowSelection}
                  showSelection={showExportControls}
                  showAttachment
                  onAttachmentClick={() => setAttachmentInfoOpen(true)}
                />
              )}
              {!isBlockCollapsed('logistics') && (!hideEmptyRows || hasAnyValue(['extraMat'])) && (
                <FieldRow
                  weekId={wid}
                  weekObj={wk}
                  fieldKey='extraMat'
                  label={t('needs.extraMaterial')}
                  setCell={setCell}
                  readOnly={readOnly}
                  rowKey={`${wid}_extraMat`}
                  isSelected={isRowSelected(`${wid}_extraMat`)}
                  toggleRowSelection={toggleRowSelection}
                  showSelection={showExportControls}
                  showAttachment
                  onAttachmentClick={() => setAttachmentInfoOpen(true)}
                />
              )}
              <tr>
                <Td
                  colSpan={totalColumns}
                  align='middle'
                  className='phase-block border border-neutral-border/70 px-1 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 bg-white/5 text-[9px] sm:text-[10px] md:text-xs lg:text-sm'
                >
                  <button
                    type='button'
                    onClick={() => toggleBlock('extraCrew')}
                    className='w-full flex items-center gap-2 font-medium'
                    style={{ color: 'var(--text)' }}
                  >
                    <span className={`transition-transform opacity-80 text-[8px] sm:text-[9px] md:text-[10px] ${isBlockCollapsed('extraCrew') ? '-rotate-90' : ''}`}>⌄</span>
                    <span>{t('needs.advance')}</span>
                  </button>
                </Td>
              </tr>
              {!isBlockCollapsed('extraCrew') && (!hideEmptyRows || hasAnyValue(['precall'])) && (
                <FieldRow
                  weekId={wid}
                  weekObj={wk}
                  fieldKey='precall'
                  label={t('needs.precall')}
                  setCell={setCell}
                  readOnly={readOnly}
                  rowKey={`${wid}_precall`}
                  isSelected={isRowSelected(`${wid}_precall`)}
                  toggleRowSelection={toggleRowSelection}
                  showSelection={showExportControls}
                />
              )}
              {!isBlockCollapsed('extraCrew') && (!hideEmptyRows || hasAnyList('preList') || hasAnyValue(['preStart', 'preEnd', 'prelightTipo'])) && (
                <MembersRow
                  label={t('needs.prelight')}
                  listKey='preList'
                  weekId={wid}
                  weekObj={wk}
                  options={prelightOptions}
                  removeFromList={removeFromList}
                  setCell={setCell}
                  readOnly={readOnly}
                  rowKey={`${wid}_preList`}
                  isSelected={isRowSelected(`${wid}_preList`)}
                  toggleRowSelection={toggleRowSelection}
                  showSelection={showExportControls}
                  showSchedule
                  jornadaKey='prelightTipo'
                  startKey='preStart'
                  endKey='preEnd'
                  collapsible
                  defaultCollapsed
                />
              )}
              {!isBlockCollapsed('extraCrew') && (!hideEmptyRows || hasAnyList('pickList') || hasAnyValue(['pickStart', 'pickEnd', 'pickupTipo'])) && (
                <MembersRow
                  label={t('needs.pickup')}
                  listKey='pickList'
                  weekId={wid}
                  weekObj={wk}
                  options={pickupOptions}
                  removeFromList={removeFromList}
                  setCell={setCell}
                  readOnly={readOnly}
                  rowKey={`${wid}_pickList`}
                  isSelected={isRowSelected(`${wid}_pickList`)}
                  toggleRowSelection={toggleRowSelection}
                  showSelection={showExportControls}
                  showSchedule
                  jornadaKey='pickupTipo'
                  startKey='pickStart'
                  endKey='pickEnd'
                  collapsible
                  defaultCollapsed
                />
              )}
              <tr>
                <Td
                  colSpan={totalColumns}
                  align='middle'
                  className='phase-block border border-neutral-border/70 px-1 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 bg-white/5 text-[9px] sm:text-[10px] md:text-xs lg:text-sm'
                >
                  <button
                    type='button'
                    onClick={() => toggleBlock('notes')}
                    className='w-full flex items-center gap-2 font-medium'
                    style={{ color: 'var(--text)' }}
                  >
                    <span className={`transition-transform opacity-80 text-[8px] sm:text-[9px] md:text-[10px] ${isBlockCollapsed('notes') ? '-rotate-90' : ''}`}>⌄</span>
                    <span>{t('needs.observations')}</span>
                  </button>
                </Td>
              </tr>
              {!isBlockCollapsed('notes') && (!hideEmptyRows || hasAnyValue(['needLight'])) && (
                <FieldRow
                  weekId={wid}
                  weekObj={wk}
                  fieldKey='needLight'
                  label={t('needs.lightNeeds')}
                  setCell={setCell}
                  readOnly={readOnly}
                  rowKey={`${wid}_needLight`}
                  isSelected={isRowSelected(`${wid}_needLight`)}
                  toggleRowSelection={toggleRowSelection}
                  showSelection={showExportControls}
                  showAttachment
                  onAttachmentClick={() => setAttachmentInfoOpen(true)}
                />
              )}
              {!isBlockCollapsed('notes') && (!hideEmptyRows || hasAnyValue(['obs'])) && (
                <FieldRow
                  weekId={wid}
                  weekObj={wk}
                  fieldKey='obs'
                  label={t('needs.observations')}
                  setCell={setCell}
                  readOnly={readOnly}
                  rowKey={`${wid}_obs`}
                  isSelected={isRowSelected(`${wid}_obs`)}
                  toggleRowSelection={toggleRowSelection}
                  showSelection={showExportControls}
                  showAttachment
                  onAttachmentClick={() => setAttachmentInfoOpen(true)}
                />
              )}
              {customRows.map(row => {
                const rowKey = `${wid}_custom_${row.id}`;
                return (
                  <tr key={rowKey}>
                    {showExportControls && (
                      <Td align='middle' className='text-center w-6 sm:w-7 md:w-8 px-0.5'>
                        <div className='flex justify-center'>
                          <input
                            type='checkbox'
                            checked={isRowSelected(rowKey)}
                            onChange={() => !readOnly && toggleRowSelection(rowKey)}
                            disabled={readOnly}
                            title={readOnly ? t('conditions.projectClosed') : (isRowSelected(rowKey) ? t('needs.deselectForExport') : t('needs.selectForExport'))}
                            className={`accent-blue-500 dark:accent-[#f59e0b] scale-90 transition ${
                              readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            } opacity-70 hover:opacity-100`}
                          />
                        </div>
                      </Td>
                    )}
                    <Td className='border border-neutral-border px-1 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 font-semibold bg-white/5 whitespace-normal break-words text-[9px] sm:text-[10px] md:text-xs lg:text-sm align-middle'>
                      <div className='flex items-center gap-1'>
                        <input
                          type='text'
                          value={row.label || ''}
                          onChange={e => !readOnly && updateCustomRowLabel(wid, row.id, e.target.value)}
                          placeholder={t('needs.customRowPlaceholder')}
                          disabled={readOnly}
                          className={`flex-1 bg-transparent focus:outline-none ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <button
                          type='button'
                          onClick={() => {
                            if (readOnly) return;
                            setCustomRowToRemove({
                              weekId: wid,
                              rowId: row.id,
                              label: row.label || t('needs.customRowLabel'),
                            });
                          }}
                          disabled={readOnly}
                          title={t('needs.remove')}
                          className={`text-[9px] sm:text-[10px] md:text-xs text-red-500 dark:text-white ${readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-400 dark:hover:text-white/80'}`}
                        >
                          ✕
                        </button>
                      </div>
                    </Td>
                    {DAYS.map((d, i) => {
                      const value = (wk?.days?.[i]?.[row.fieldKey] as string) || '';
                      return (
                        <Td key={`${rowKey}_${d.key}`} align='middle' className='text-center'>
                          <div className='flex flex-col items-center justify-center gap-2'>
                            <TextAreaAuto
                              value={value}
                              onChange={(val: string) => !readOnly && setCell(wid, i, row.fieldKey, val)}
                              placeholder={t('needs.writeHere')}
                              readOnly={readOnly}
                            />
                            <button
                              type='button'
                              onClick={() => !readOnly && setAttachmentInfoOpen(true)}
                              disabled={readOnly}
                              title={t('needs.attachImage')}
                              className={`px-1 py-0.5 rounded border border-neutral-border text-[8px] sm:text-[9px] md:text-[10px] ${
                                readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                              }`}
                              style={{ color: 'var(--text)' }}
                            >
                              📎 {t('needs.imageLabel')}
                            </button>
                          </div>
                        </Td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr>
                <Td colSpan={totalColumns} className='border border-neutral-border px-1 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2'>
                  <button
                    type='button'
                    onClick={() => {
                      if (readOnly) return;
                      const newId = addCustomRow(wid);
                      if (newId) {
                        selectRow(`${wid}_custom_${newId}`);
                      }
                    }}
                    disabled={readOnly}
                    className={`text-[9px] sm:text-[10px] md:text-xs font-semibold ${readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                    style={{ color: isDark ? '#ffffff' : '#111827' }}
                  >
                    {t('needs.addRow')}
                  </button>
                </Td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal de confirmación de intercambio */}
      {swapConfirmation && (
        <ConfirmModal
          title={t('needs.confirmSwap')}
          message={t('needs.confirmSwapMessage', {
            week1: swapConfirmation.weekLabel1,
            day1: swapConfirmation.dayName1,
            week2: swapConfirmation.weekLabel2,
            day2: swapConfirmation.dayName2,
          })}
          onClose={() => {
            setSwapConfirmation(null);
            clearSelection();
          }}
          onConfirm={() => {
            swapDays(
              swapConfirmation.weekId1,
              swapConfirmation.dayIdx1,
              swapConfirmation.weekId2,
              swapConfirmation.dayIdx2
            );
            setSwapConfirmation(null);
            clearSelection();
          }}
        />
      )}
      {customRowToRemove && (
        <ConfirmModal
          title={t('needs.confirmDeletion')}
          message={t('needs.confirmDeleteCustomRow', {
            name: customRowToRemove.label,
          })}
          onClose={() => setCustomRowToRemove(null)}
          onConfirm={() => {
            removeCustomRow(customRowToRemove.weekId, customRowToRemove.rowId);
            setCustomRowToRemove(null);
          }}
        />
      )}
      {weekDeleteOpen && (
        <ConfirmModal
          title={t('planning.confirmDelete')}
          message={t('planning.confirmDeleteWeek', { weekLabel: translateWeekLabel(wk.label || t('needs.week'), t) || t('planning.thisWeek') })}
          onClose={() => setWeekDeleteOpen(false)}
          onConfirm={() => {
            deleteWeek(scope, wid);
            setWeekDeleteOpen(false);
          }}
        />
      )}
      {attachmentInfoOpen && (
        <div className='fixed inset-0 bg-black/60 grid place-items-center p-6 z-50'>
          <div
            className='w-full max-w-[240px] sm:max-w-[280px] md:max-w-xs rounded sm:rounded-md md:rounded-lg border border-neutral-border p-3 sm:p-4'
            style={{ backgroundColor: isDark ? 'var(--panel)' : '#ffffff' }}
          >
            <h3
              className='text-[10px] sm:text-xs md:text-sm font-semibold mb-2'
              style={{ color: isDark ? '#F27405' : '#111827' }}
            >
              {t('needs.attachmentBetaTitle')}
            </h3>
            <p
              className='text-[9px] sm:text-[10px] md:text-xs mb-3'
              style={{ color: isDark ? '#ffffff' : '#111827' }}
            >
              {t('needs.attachmentBetaMessage')}
            </p>
            <div className='flex justify-center'>
              <button
                type='button'
                onClick={() => setAttachmentInfoOpen(false)}
                className='px-2 py-1 rounded-md border border-neutral-border text-[9px] sm:text-[10px] md:text-xs'
                style={{ color: isDark ? '#ffffff' : '#111827' }}
              >
                {t('needs.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

