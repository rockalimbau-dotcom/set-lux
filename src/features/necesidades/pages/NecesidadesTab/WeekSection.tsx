import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Th } from '@shared/components';
import { AnyRecord } from '@shared/types/common';
import { btnExport } from '@shared/utils/tailwindClasses';
import FieldRow from '../../components/FieldRow';
import ListRow from '../../components/ListRow';
import { DayInfo } from './NecesidadesTabTypes';
import { parseYYYYMMDD, addDays, formatDDMM, translateWeekLabel } from './NecesidadesTabUtils';

interface WeekSectionProps {
  wid: string;
  wk: AnyRecord;
  DAYS: DayInfo[];
  setCell: (weekId: string, dayIdx: number, fieldKey: string, value: unknown) => void;
  removeFromList: (weekId: string, dayIdx: number, listKey: string, idx: number) => void;
  setWeekOpen: (weekId: string, isOpen: boolean) => void;
  exportWeekPDF: (weekId: string) => void;
  readOnly: boolean;
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
}: WeekSectionProps) {
  const { t } = useTranslation();
  const monday = parseYYYYMMDD(wk.startDate);
  const datesRow = useMemo(() => DAYS.map((_, i) => formatDDMM(addDays(monday, i))), [monday, DAYS]);

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
            onClick={() => exportWeekPDF(wid)}
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
                <Th>{t('needs.fieldDay')}</Th>
                {DAYS.map((d, i) => (
                  <Th key={d.key} align='center' className='text-center'>
                    <div className='text-[9px] sm:text-[10px] md:text-xs'>{d.name}</div>
                    <div className='text-[8px] sm:text-[9px] md:text-[10px] text-zinc-400'>
                      {datesRow[i]}
                    </div>
                  </Th>
                ))}
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
              />
              <FieldRow
                weekId={wid}
                weekObj={wk}
                fieldKey='seq'
                label={t('needs.sequences')}
                setCell={setCell}
                readOnly={readOnly}
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
              />
              <FieldRow
                weekId={wid}
                weekObj={wk}
                fieldKey='needLoc'
                label={t('needs.locationNeeds')}
                setCell={setCell}
                readOnly={readOnly}
              />
              <FieldRow
                weekId={wid}
                weekObj={wk}
                fieldKey='needProd'
                label={t('needs.productionNeeds')}
                setCell={setCell}
                readOnly={readOnly}
              />
              <FieldRow
                weekId={wid}
                weekObj={wk}
                fieldKey='needLight'
                label={t('needs.lightNeeds')}
                setCell={setCell}
                readOnly={readOnly}
              />
              <FieldRow
                weekId={wid}
                weekObj={wk}
                fieldKey='extraMat'
                label={t('needs.extraMaterial')}
                setCell={setCell}
                readOnly={readOnly}
              />
              <FieldRow
                weekId={wid}
                weekObj={wk}
                fieldKey='precall'
                label={t('needs.precall')}
                setCell={setCell}
                readOnly={readOnly}
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
              />
              <FieldRow
                weekId={wid}
                weekObj={wk}
                fieldKey='obs'
                label={t('needs.observations')}
                setCell={setCell}
                readOnly={readOnly}
              />
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

