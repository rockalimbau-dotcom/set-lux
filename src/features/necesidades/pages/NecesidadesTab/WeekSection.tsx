import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Th, Td } from '@shared/components';
import { AnyRecord } from '@shared/types/common';
import { btnExport } from '@shared/utils/tailwindClasses';
import FieldRow from '../../components/FieldRow';
import ListRow from '../../components/ListRow';
import TextAreaAuto from '../../components/TextAreaAuto';
import { DayInfo } from './NecesidadesTabTypes';
import { parseYYYYMMDD, addDays, formatDDMM, translateWeekLabel } from './NecesidadesTabUtils';
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
  setCell: (weekId: string, dayIdx: number, fieldKey: string, value: unknown) => void;
  removeFromList: (weekId: string, dayIdx: number, listKey: string, idx: number) => void;
  setWeekOpen: (weekId: string, isOpen: boolean) => void;
  exportWeekPDF: (
    weekId: string,
    selectedRowKeys?: string[],
    selectedDayIdxs?: number[],
    includeEmptyRows?: boolean
  ) => void;
  readOnly: boolean;
  swapDays: (weekId1: string, dayIdx1: number, weekId2: string, dayIdx2: number) => void;
  selectedDayForSwap: SelectedDayForSwap | null;
  selectDayForSwap: (weekId: string, dayIdx: number) => void;
  clearSelection: () => void;
  isDaySelected: (weekId: string, dayIdx: number) => boolean;
  weekEntries: [string, any][]; // Para obtener etiquetas de semanas
  addCustomRow: (weekId: string) => string | null;
  updateCustomRowLabel: (weekId: string, rowId: string, label: string) => void;
  removeCustomRow: (weekId: string, rowId: string) => void;
  tutorialId?: string;
}

export function WeekSection({
  wid,
  wk,
  DAYS,
  setCell,
  removeFromList,
  setWeekOpen,
  exportWeekPDF,
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
  const datesRow = useMemo(() => DAYS.map((_, i) => formatDDMM(addDays(monday, i))), [monday, DAYS]);
  const isDark = theme === 'dark';
  
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

  // Definir todas las claves de filas para esta semana
  const customRows = useMemo(
    () => (Array.isArray(wk?.customRows) ? wk.customRows : []),
    [wk?.customRows]
  );
  const rowKeys = useMemo(() => {
    const base = [
      `${wid}_loc`, // Location
      `${wid}_seq`, // Sequences
      `${wid}_crewList`, // Technical Team
      `${wid}_needLoc`, // Location Needs
      `${wid}_needProd`, // Production Needs
      `${wid}_needTransport`, // Transport Needs
      `${wid}_needGroups`, // Groups Needs
      `${wid}_needLight`, // Light Needs
      `${wid}_extraMat`, // Extra Material
      `${wid}_precall`, // Precall
      `${wid}_preList`, // Prelight Team
      `${wid}_pickList`, // Pickup Team
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

  return (
    <section
      key={wid}
      className='rounded sm:rounded-lg md:rounded-xl lg:rounded-2xl border border-neutral-border bg-neutral-panel/90'
      data-tutorial={tutorialId}
    >
      <div
        className='flex items-center justify-between gap-1.5 sm:gap-2 md:gap-3 px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-5 lg:py-4'
        data-tutorial={tutorialId ? 'needs-week-header' : undefined}
      >
        <div className='flex items-center gap-1.5 sm:gap-2 md:gap-3'>
          <button
            onClick={() => !readOnly && setWeekOpen(wid, !wk.open)}
            disabled={readOnly}
            className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded sm:rounded-md md:rounded-lg border border-neutral-border hover:border-[#F59E0B] ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={readOnly ? t('conditions.projectClosed') : (wk.open ? t('needs.close') : t('needs.open'))}
          >
            {wk.open ? '−' : '+'}
          </button>
          <div className='text-brand font-semibold text-xs sm:text-sm md:text-base'>
            {translateWeekLabel(wk.label || t('needs.week'), t)}
          </div>
        </div>
        <div className='flex items-center gap-1 sm:gap-1.5 md:gap-2'>
          <button
            className='px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded sm:rounded-md md:rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold btn-pdf'
            style={btnExportStyle}
            onClick={() => {
              // Obtener las filas seleccionadas
              const selectedRowKeys = rowKeys.filter(key => isRowSelected(key));
              const selectedDayIdxs = columnKeys.filter(idx => selectedColumns.has(idx));
              const useSelectedDays =
                selectedDayIdxs.length > 0 && selectedDayIdxs.length < columnKeys.length
                  ? selectedDayIdxs
                  : undefined;
              const includeEmptyRows = allRowsSelected && (allColumnsSelected || !!useSelectedDays);
              exportWeekPDF(
                wid,
                selectedRowKeys.length > 0 ? selectedRowKeys : undefined,
                useSelectedDays,
                includeEmptyRows
              );
            }}
            title={t('needs.exportWeekPDF')}
          >
            {t('needs.pdf')}
          </button>
        </div>
      </div>

      {wk.open && (
        <div className='overflow-x-auto px-3 pb-3 sm:px-4 sm:pb-4 md:px-5 md:pb-5'>
          <table className='min-w-[800px] sm:min-w-[1000px] md:min-w-[1200px] lg:min-w-[1360px] w-full border-collapse text-[9px] sm:text-[10px] md:text-xs lg:text-sm'>
            <thead>
              <tr>
                <Th align='center'>
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
                      className='accent-blue-500 dark:accent-[#f59e0b] cursor-pointer'
                    />
                  </div>
                </Th>
                <Th>
                  <div className='flex flex-col items-center gap-1'>
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
                      className={`accent-blue-500 dark:accent-[#f59e0b] ${readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    />
                    <span>{t('needs.fieldDay')}</span>
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
                      className={`text-center relative ${isSelected ? 'bg-blue-500/20 dark:bg-blue-500/30 border-2 border-blue-500' : ''} ${isOtherSelected ? 'hover:bg-zinc-100/10 dark:hover:bg-zinc-800/20' : ''}`}
                    >
                      <div className='flex justify-center mb-0.5'>
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
                          className={`accent-blue-500 dark:accent-[#f59e0b] ${readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        />
                      </div>
                      <div className='text-[9px] sm:text-[10px] md:text-xs'>
                        {d.name} {datesRow[i]}
                      </div>
                      <div className='flex justify-center gap-1 mt-1'>
                        {!hasSelection ? (
                          <button
                            onClick={() => !readOnly && selectDayForSwap(wid, i)}
                            disabled={readOnly}
                            className={`px-1 py-0.5 text-[8px] sm:text-[9px] rounded border transition ${
                              readOnly
                                ? 'opacity-50 cursor-not-allowed'
                                : 'cursor-pointer hover:bg-blue-500/20 dark:hover:bg-[#f59e0b]/40'
                            } ${isSelected ? 'bg-blue-500/30 border-blue-500 dark:bg-[#f59e0b]/45 dark:border-[#f59e0b]' : 'border-neutral-border'}`}
                            title={readOnly ? t('conditions.projectClosed') : t('needs.selectForSwap')}
                          >
                            {t('needs.swap')}
                          </button>
                        ) : isSelected ? (
                          <button
                            onClick={() => !readOnly && clearSelection()}
                            disabled={readOnly}
                            className='px-1 py-0.5 text-[8px] sm:text-[9px] rounded border border-red-500 bg-red-500/20 text-red-500 hover:bg-red-500/30 transition cursor-pointer'
                            title={t('needs.cancelSelection')}
                          >
                            {t('needs.cancel')}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (readOnly || !selectedDayForSwap) return;
                              const day1 = DAYS.find((_, idx) => idx === selectedDayForSwap.dayIdx);
                              const day2 = DAYS[i];
                              // Obtener etiquetas de semana
                              const week1Entry = weekEntries.find(([wId]) => wId === selectedDayForSwap.weekId);
                              const week2Entry = weekEntries.find(([wId]) => wId === wid);
                              const week1Label = week1Entry ? translateWeekLabel(week1Entry[1]?.label || t('needs.week'), t) : selectedDayForSwap.weekId;
                              const week2Label = week2Entry ? translateWeekLabel(week2Entry[1]?.label || t('needs.week'), t) : translateWeekLabel(wk.label || t('needs.week'), t);
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
                            className='px-1 py-0.5 text-[8px] sm:text-[9px] rounded border border-green-500 bg-green-500/20 text-green-500 hover:bg-green-500/30 transition cursor-pointer'
                            title={t('needs.swapWithSelected')}
                          >
                            {t('needs.swap')}
                          </button>
                        )}
                      </div>
                    </Th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <FieldRow
                weekId={wid}
                weekObj={wk}
                fieldKey='loc'
                label={t('needs.location')}
                setCell={setCell}
                readOnly={readOnly}
                rowKey={`${wid}_loc`}
                isSelected={isRowSelected(`${wid}_loc`)}
                toggleRowSelection={toggleRowSelection}
              />
              <FieldRow
                weekId={wid}
                weekObj={wk}
                fieldKey='seq'
                label={t('needs.sequences')}
                setCell={setCell}
                readOnly={readOnly}
                rowKey={`${wid}_seq`}
                isSelected={isRowSelected(`${wid}_seq`)}
                toggleRowSelection={toggleRowSelection}
              />
              <ListRow
                label={t('needs.technicalTeam')}
                listKey='crewList'
                notesKey='crewTxt'
                weekId={wid}
                weekObj={wk}
                removeFromList={removeFromList}
                setCell={setCell}
                readOnly={readOnly}
                rowKey={`${wid}_crewList`}
                isSelected={isRowSelected(`${wid}_crewList`)}
                toggleRowSelection={toggleRowSelection}
              />
              <FieldRow
                weekId={wid}
                weekObj={wk}
                fieldKey='needLoc'
                label={t('needs.locationNeeds')}
                setCell={setCell}
                readOnly={readOnly}
                rowKey={`${wid}_needLoc`}
                isSelected={isRowSelected(`${wid}_needLoc`)}
                toggleRowSelection={toggleRowSelection}
                showAttachment
                onAttachmentClick={() => setAttachmentInfoOpen(true)}
              />
              <FieldRow
                weekId={wid}
                weekObj={wk}
                fieldKey='needProd'
                label={t('needs.productionNeeds')}
                setCell={setCell}
                readOnly={readOnly}
                rowKey={`${wid}_needProd`}
                isSelected={isRowSelected(`${wid}_needProd`)}
                toggleRowSelection={toggleRowSelection}
                showAttachment
                onAttachmentClick={() => setAttachmentInfoOpen(true)}
              />
              <FieldRow
                weekId={wid}
                weekObj={wk}
                fieldKey='needTransport'
                label={t('needs.transportNeeds')}
                setCell={setCell}
                readOnly={readOnly}
                rowKey={`${wid}_needTransport`}
                isSelected={isRowSelected(`${wid}_needTransport`)}
                toggleRowSelection={toggleRowSelection}
              />
              <FieldRow
                weekId={wid}
                weekObj={wk}
                fieldKey='needGroups'
                label={t('needs.groupsNeeds')}
                setCell={setCell}
                readOnly={readOnly}
                rowKey={`${wid}_needGroups`}
                isSelected={isRowSelected(`${wid}_needGroups`)}
                toggleRowSelection={toggleRowSelection}
                showAttachment
                onAttachmentClick={() => setAttachmentInfoOpen(true)}
              />
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
                showAttachment
                onAttachmentClick={() => setAttachmentInfoOpen(true)}
              />
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
              />
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
              />
              <ListRow
                label={t('needs.prelightTeam')}
                listKey='preList'
                notesKey='preTxt'
                weekId={wid}
                weekObj={wk}
                context='prelight'
                removeFromList={removeFromList}
                setCell={setCell}
                readOnly={readOnly}
                rowKey={`${wid}_preList`}
                isSelected={isRowSelected(`${wid}_preList`)}
                toggleRowSelection={toggleRowSelection}
              />
              <ListRow
                label={t('needs.pickupTeam')}
                listKey='pickList'
                notesKey='pickTxt'
                weekId={wid}
                weekObj={wk}
                context='pickup'
                removeFromList={removeFromList}
                setCell={setCell}
                readOnly={readOnly}
                rowKey={`${wid}_pickList`}
                isSelected={isRowSelected(`${wid}_pickList`)}
                toggleRowSelection={toggleRowSelection}
              />
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
                showAttachment
                onAttachmentClick={() => setAttachmentInfoOpen(true)}
              />
              {customRows.map(row => {
                const rowKey = `${wid}_custom_${row.id}`;
                return (
                  <tr key={rowKey}>
                    <Td align='middle' className='text-center'>
                      <div className='flex justify-center'>
                        <input
                          type='checkbox'
                          checked={isRowSelected(rowKey)}
                          onChange={() => !readOnly && toggleRowSelection(rowKey)}
                          disabled={readOnly}
                          title={readOnly ? t('conditions.projectClosed') : (isRowSelected(rowKey) ? t('needs.deselectForExport') : t('needs.selectForExport'))}
                          className={`accent-blue-500 dark:accent-[#f59e0b] ${readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        />
                      </div>
                    </Td>
                    <Td className='border border-neutral-border px-1 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 font-semibold bg-white/5 whitespace-nowrap text-[9px] sm:text-[10px] md:text-xs lg:text-sm align-middle'>
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
                <Td colSpan={DAYS.length + 2} className='border border-neutral-border px-1 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2'>
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

