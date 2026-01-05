import { AnyRecord } from '@shared/types/common';
import { Row } from '@shared/components';
import { JornadaDropdown } from '../../JornadaDropdown';
import { BaseRowProps } from './TableRowComponentsTypes';

export function DayTypeRow({
  week,
  scope,
  setDayField,
  getDropdownState,
  setDropdownState,
  theme,
  focusColor,
  readOnly = false,
  t,
}: BaseRowProps) {
  return (
    <Row label={t('planning.dayType')}>
      {week.days.map((day: AnyRecord, i: number) => {
        const dropdownKey = `jornada_${week.id}_${i}`;
        const dropdownState = getDropdownState(dropdownKey);

        return (
          <JornadaDropdown
            key={i}
            scope={scope}
            weekId={week.id as string}
            dayIndex={i}
            day={day}
            dropdownKey={dropdownKey}
            dropdownState={dropdownState}
            setDropdownState={setDropdownState}
            setDayField={setDayField}
            theme={theme}
            focusColor={focusColor}
            readOnly={readOnly}
          />
        );
      })}
    </Row>
  );
}

