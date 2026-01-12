import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Th } from '@shared/components';
import { AnyRecord } from '@shared/types/common';
import { btnExport } from '@shared/utils/tailwindClasses';
import FieldRow from '../../components/FieldRow';
import ListRow from '../../components/ListRow';
import { DayInfo } from './NecesidadesTabTypes';
import { parseYYYYMMDD, addDays, formatDDMM, translateWeekLabel } from './NecesidadesTabUtils';
import { useRowSelection } from '../../hooks/useRowSelection';
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
  exportWeekPDF: (weekId: string, selectedRowKeys?: string[]) => void;
  readOnly: boolean;
  swapDays: (weekId1: string, dayIdx1: number, weekId2: string, dayIdx2: number) => void;
  selectedDayForSwap: SelectedDayForSwap | null;
  selectDayForSwap: (weekId: string, dayIdx: number) => void;
  clearSelection: () => void;
  isDaySelected: (weekId: string, dayIdx: number) => boolean;
  weekEntries: [string, any][]; // Para obtener etiquetas de semanas
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
}: WeekSectionProps) {
  const { t } = useTranslation();
  const monday = parseYYYYMMDD(wk.startDate);
  const datesRow = useMemo(() => DAYS.map((_, i) => formatDDMM(addDays(monday, i))), [monday, DAYS]);
  
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

  // Definir todas las claves de filas para esta semana
  const rowKeys = useMemo(() => [
    `${wid}_loc`, // Location
    `${wid}_seq`, // Sequences
    `${wid}_crewList`, // Technical Team
    `${wid}_needLoc`, // Location Needs
    `${wid}_needProd`, // Production Needs
    `${wid}_needLight`, // Light Needs
    `${wid}_extraMat`, // Extra Material
    `${wid}_precall`, // Precall
    `${wid}_preList`, // Prelight Team
    `${wid}_pickList`, // Pickup Team
    `${wid}_obs`, // Observations
  ], [wid]);

  // Hook para gestionar selección de filas
  const { toggleRowSelection, isRowSelected } = useRowSelection({
    persistKey: `needs_${wid}`,
    rowKeys,
  });

  const btnExportCls = btnExport;
  const btnExportStyle = {
    background: '#f59e0b',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  } as React.CSSProperties;

  return (
    <section
      key={wid}
      className='rounded sm:rounded-lg md:rounded-xl lg:rounded-2xl border border-neutral-border bg-neutral-panel/90'
    >
      <div className='flex items-center justify-between gap-1.5 sm:gap-2 md:gap-3 px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-5 lg:py-4'>
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
              exportWeekPDF(wid, selectedRowKeys.length > 0 ? selectedRowKeys : undefined);
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
                <Th>{t('needs.fieldDay')}</Th>
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
                      <div className='text-[9px] sm:text-[10px] md:text-xs'>{d.name}</div>
                      <div className='text-[8px] sm:text-[9px] md:text-[10px] text-zinc-400'>
                        {datesRow[i]}
                      </div>
                      <div className='flex justify-center gap-1 mt-1'>
                        {!hasSelection ? (
                          <button
                            onClick={() => !readOnly && selectDayForSwap(wid, i)}
                            disabled={readOnly}
                            className={`px-1 py-0.5 text-[8px] sm:text-[9px] rounded border transition ${readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-500/20'} ${isSelected ? 'bg-blue-500/30 border-blue-500' : 'border-neutral-border'}`}
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
              />
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
    </section>
  );
}

