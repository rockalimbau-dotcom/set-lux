import { Td, Row } from '@shared/components';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import TextAreaAuto from './TextAreaAuto';

type AnyRecord = Record<string, any>;

type FieldRowProps = {
  weekId: string;
  weekObj: AnyRecord;
  fieldKey: string;
  label: string;
  setCell: (weekId: string, dayIdx: number, fieldKey: string, value: unknown) => void;
  readOnly?: boolean;
};

export default function FieldRow({ weekId, weekObj, fieldKey, label, setCell, readOnly = false }: FieldRowProps) {
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
    <Row label={label}>
      {DAYS.map((d, i) => {
        const rawValue = (weekObj?.days?.[i]?.[fieldKey] as string) || '';
        // Only translate if it's the location field (fieldKey === 'loc')
        const displayValue = fieldKey === 'loc' ? translateLocationValue(rawValue) : rawValue;
        return (
          <Td key={d.key} align='middle' className='text-center'>
            <div className='flex justify-center'>
            <TextAreaAuto
              value={displayValue}
              onChange={(val: string) => !readOnly && setCell(weekId, i, fieldKey, val)}
              placeholder={t('needs.writeHere')}
              readOnly={readOnly}
            />
            </div>
          </Td>
        );
      })}
    </Row>
  );
}


