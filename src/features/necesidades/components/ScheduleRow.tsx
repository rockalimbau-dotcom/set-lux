import { Td } from '@shared/components';
import { AnyRecord } from '@shared/types/common';
import React from 'react';
import { useTranslation } from 'react-i18next';

type ScheduleRowProps = {
  label: string;
  weekId: string;
  weekObj: AnyRecord;
  startKey: string;
  endKey: string;
  setCell: (weekId: string, dayIdx: number, fieldKey: string, value: unknown) => void;
  readOnly?: boolean;
  rowKey?: string;
  isSelected?: boolean;
  toggleRowSelection?: (rowKey: string) => void;
  showSelection?: boolean;
};

export function ScheduleRow({
  label,
  weekId,
  weekObj,
  startKey,
  endKey,
  setCell,
  readOnly = false,
  rowKey,
  isSelected,
  toggleRowSelection,
  showSelection = true,
}: ScheduleRowProps) {
  const { t } = useTranslation();
  const DAYS = [
    { idx: 0, key: 'mon', name: t('reports.dayNames.monday') },
    { idx: 1, key: 'tue', name: t('reports.dayNames.tuesday') },
    { idx: 2, key: 'wed', name: t('reports.dayNames.wednesday') },
    { idx: 3, key: 'thu', name: t('reports.dayNames.thursday') },
    { idx: 4, key: 'fri', name: t('reports.dayNames.friday') },
    { idx: 5, key: 'sat', name: t('reports.dayNames.saturday') },
    { idx: 6, key: 'sun', name: t('reports.dayNames.sunday') },
  ];

  return (
    <tr>
      {rowKey && toggleRowSelection && (
        <Td align='middle' className={`text-center w-6 sm:w-7 md:w-8 px-0.5 ${showSelection ? '' : 'bg-white/5'}`}>
          <div className='flex justify-center'>
            <input
              type='checkbox'
              checked={isSelected ?? true}
              onChange={() => !readOnly && toggleRowSelection(rowKey)}
              disabled={readOnly}
              title={readOnly ? t('conditions.projectClosed') : (isSelected ? t('needs.deselectForExport') : t('needs.selectForExport'))}
              className={`accent-blue-500 dark:accent-[#f59e0b] scale-90 transition ${
                readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${showSelection ? 'opacity-70 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
            />
          </div>
        </Td>
      )}
      <Td className='border border-neutral-border px-1 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 font-semibold bg-white/5 whitespace-normal break-words text-[9px] sm:text-[10px] md:text-xs lg:text-sm align-middle'>
        {label}
      </Td>
      {DAYS.map((d, i) => {
        const day: AnyRecord = (weekObj as AnyRecord).days?.[i] || {};
        const startValue = (day as AnyRecord)[startKey] || '';
        const endValue = (day as AnyRecord)[endKey] || '';
        return (
          <Td key={d.key} align='middle' className='text-center'>
            <div className='flex items-center gap-1'>
              <input
                type='time'
                value={startValue}
                onChange={(e) => !readOnly && setCell(weekId, i, startKey, e.target.value)}
                disabled={readOnly}
                className={`w-[48%] px-1 py-0.5 rounded border text-[9px] sm:text-[10px] md:text-xs ${
                  readOnly ? 'opacity-50 cursor-not-allowed' : ''
                } ${'bg-white text-gray-900 dark:bg-black/40 dark:text-zinc-300'}`}
                style={{ borderColor: 'var(--border)' }}
              />
              <input
                type='time'
                value={endValue}
                onChange={(e) => !readOnly && setCell(weekId, i, endKey, e.target.value)}
                disabled={readOnly}
                className={`w-[48%] px-1 py-0.5 rounded border text-[9px] sm:text-[10px] md:text-xs ${
                  readOnly ? 'opacity-50 cursor-not-allowed' : ''
                } ${'bg-white text-gray-900 dark:bg-black/40 dark:text-zinc-300'}`}
                style={{ borderColor: 'var(--border)' }}
              />
            </div>
          </Td>
        );
      })}
    </tr>
  );
}
