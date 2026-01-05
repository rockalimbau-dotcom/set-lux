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
      className='rounded-2xl border border-neutral-border bg-neutral-panel/90'
    >
      <div className='flex items-center justify-between gap-3 px-5 py-4'>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => !readOnly && setWeekOpen(wid, !wk.open)}
            disabled={readOnly}
            className={`w-8 h-8 rounded-lg border border-neutral-border hover:border-[#F59E0B] ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={readOnly ? t('conditions.projectClosed') : (wk.open ? t('needs.close') : t('needs.open'))}
          >
            {wk.open ? '−' : '+'}
          </button>
          <div className='text-brand font-semibold'>
            {translateWeekLabel(wk.label || t('needs.week'), t)}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <button
            className={btnExportCls}
            style={btnExportStyle}
            onClick={() => exportWeekPDF(wid)}
            title={t('needs.exportWeekPDF')}
          >
            {t('needs.pdf')}
          </button>
        </div>
      </div>

      {wk.open && (
        <div className='overflow-x-auto px-5 pb-5'>
          <table className='min-w-[1360px] w-full border-collapse text-sm'>
            <thead>
              <tr>
                <Th>{t('needs.fieldDay')}</Th>
                {DAYS.map((d, i) => (
                  <Th key={d.key} align='center' className='text-center'>
                    <div>{d.name}</div>
                    <div className='text-[11px] text-zinc-400'>
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

