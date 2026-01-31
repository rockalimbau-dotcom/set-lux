import { Td } from '@shared/components';
import { AnyRecord } from '@shared/types/common';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import TextAreaAuto from './TextAreaAuto';

type FieldRowProps = {
  weekId: string;
  weekObj: AnyRecord;
  fieldKey: string;
  label: string;
  setCell: (weekId: string, dayIdx: number, fieldKey: string, value: unknown) => void;
  readOnly?: boolean;
  rowKey?: string; // Clave única para identificar esta fila
  isSelected?: boolean; // Si la fila está seleccionada
  toggleRowSelection?: (rowKey: string) => void; // Función para alternar selección
  showSelection?: boolean;
  showAttachment?: boolean;
  onAttachmentClick?: (dayIdx: number) => void;
};

export default function FieldRow({
  weekId,
  weekObj,
  fieldKey,
  label,
  setCell,
  readOnly = false,
  rowKey,
  isSelected,
  toggleRowSelection,
  showSelection = true,
  showAttachment = false,
  onAttachmentClick,
}: FieldRowProps) {
  const { t } = useTranslation();
  
  // Helper function to translate location values from planning
  const translateLocationValue = (value: string): string => {
    if (!value) return '';
    const normalized = value.trim();
    // Translate common location values from planning
    if (normalized === 'Descanso' || normalized === 'DESCANSO' || normalized.toLowerCase() === 'descanso') {
      return t('planning.rest');
    }
    if (normalized === 'Fin' || normalized === 'FIN' || normalized.toLowerCase() === 'fin') {
      return t('planning.end');
    }
    return value;
  };
  
  const DAYS = useMemo(() => [
    { idx: 0, key: 'mon', name: t('reports.dayNames.monday') },
    { idx: 1, key: 'tue', name: t('reports.dayNames.tuesday') },
    { idx: 2, key: 'wed', name: t('reports.dayNames.wednesday') },
    { idx: 3, key: 'thu', name: t('reports.dayNames.thursday') },
    { idx: 4, key: 'fri', name: t('reports.dayNames.friday') },
    { idx: 5, key: 'sat', name: t('reports.dayNames.saturday') },
    { idx: 6, key: 'sun', name: t('reports.dayNames.sunday') },
  ], [t]);
  
  return (
    <tr>
      {/* Checkbox para selección de fila - primera columna */}
      {showSelection && rowKey && toggleRowSelection && (
        <Td align='middle' className='text-center w-6 sm:w-7 md:w-8 px-0.5'>
          <div className='flex justify-center'>
            <input
              type='checkbox'
              checked={isSelected ?? true}
              onChange={() => !readOnly && toggleRowSelection(rowKey)}
              disabled={readOnly}
              title={readOnly ? t('conditions.projectClosed') : (isSelected ? t('needs.deselectForExport') : t('needs.selectForExport'))}
              className={`accent-blue-500 dark:accent-[#f59e0b] scale-90 transition ${
                readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } opacity-70 hover:opacity-100`}
            />
          </div>
        </Td>
      )}
      {/* Etiqueta de la fila */}
      <Td className='border border-neutral-border px-1 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 font-semibold bg-white/5 whitespace-normal break-words text-[9px] sm:text-[10px] md:text-xs lg:text-sm align-middle'>
        {label}
      </Td>
      {DAYS.map((d, i) => {
        const rawValue = (weekObj?.days?.[i]?.[fieldKey] as string) || '';
        // Only translate if it's the location field (fieldKey === 'loc')
        const displayValue = fieldKey === 'loc' ? translateLocationValue(rawValue) : rawValue;
        const isExtraMaterial = fieldKey === 'extraMat';
        const extraMatTime = (weekObj?.days?.[i]?.extraMatTime as string) || '';
        return (
          <Td key={d.key} align='middle' className='text-center'>
            <div className='flex flex-col items-center justify-center gap-1'>
              {isExtraMaterial && (
                <input
                  type='time'
                  value={extraMatTime}
                  onChange={(e) => !readOnly && setCell(weekId, i, 'extraMatTime', e.target.value)}
                  disabled={readOnly}
                  className={`w-full px-1 py-0.5 rounded border text-[9px] sm:text-[10px] md:text-xs ${
                    readOnly ? 'opacity-50 cursor-not-allowed' : ''
                  } ${'bg-white text-gray-900 dark:bg-black/40 dark:text-zinc-300'}`}
                  style={{ borderColor: 'var(--border)' }}
                />
              )}
              <TextAreaAuto
                value={displayValue}
                onChange={(val: string) => !readOnly && setCell(weekId, i, fieldKey, val)}
                placeholder={t('needs.writeHere')}
                readOnly={readOnly}
              />
              {showAttachment && (
                <button
                  type='button'
                  onClick={() => !readOnly && onAttachmentClick?.(i)}
                  disabled={readOnly}
                  title={isExtraMaterial ? t('needs.attachFile') : t('needs.attachImage')}
                  className={`px-1 py-0.5 rounded border border-neutral-border text-[8px] sm:text-[9px] md:text-[10px] ${
                    readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                  }`}
                  style={{ color: 'var(--text)' }}
                >
                  📎 {isExtraMaterial ? t('needs.attachFile') : t('needs.imageLabel')}
                </button>
              )}
            </div>
          </Td>
        );
      })}
    </tr>
  );
}


