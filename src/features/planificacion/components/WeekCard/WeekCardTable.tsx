import { useTranslation } from 'react-i18next';
import { Th } from '@shared/components';
import { AnyRecord } from '@shared/types/common';
import { getDayName, DAYS } from './WeekCardHelpers';
import { WeekCardTableProps } from './WeekCardTable/WeekCardTableTypes';
import {
  DateRow,
  DayTypeRow,
  ScheduleRow,
  CutRow,
  ObservationsRow,
  LocationRow,
  TeamRow,
  IssuesRow,
} from './WeekCardTable/TableRowComponents/index';
import { PrelightRow } from './WeekCardTable/PrelightRow';
import { PickupRow } from './WeekCardTable/PickupRow';

export function WeekCardTable({
  week,
  scope,
  weekStart: _weekStart,
  datesRow,
  onChangeMonday,
  setDayField,
  getDropdownState,
  setDropdownState,
  addMemberTo,
  setMemberToRemove,
  baseTeam,
  prelightTeam,
  pickupTeam,
  reinforcements,
  missingByPair,
  uniqueByPair,
  poolRefs,
  preOpen,
  setPreOpen,
  pickOpen,
  setPickOpen,
  theme,
  focusColor,
  readOnly = false,
}: WeekCardTableProps) {
  const { t } = useTranslation();

  return (
    <div className='overflow-x-auto'>
      <table className='plan min-w-[600px] sm:min-w-[680px] md:min-w-[760px] w-full border-collapse text-[9px] sm:text-[10px] md:text-xs lg:text-sm'>
        <thead>
          <tr>
            <Th align='left'>{t('planning.row')}</Th>
            {week.days.map((d: AnyRecord, i: number) => (
              <Th key={i} align='center'>
                {getDayName(d.key || DAYS[i]?.key || '', t)}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          <DateRow
            week={week}
            datesRow={datesRow}
            onChangeMonday={onChangeMonday}
            scope={scope}
            setDayField={setDayField}
            getDropdownState={getDropdownState}
            setDropdownState={setDropdownState}
            theme={theme}
            focusColor={focusColor}
            readOnly={readOnly}
            t={t}
          />

          <DayTypeRow
            week={week}
            scope={scope}
            setDayField={setDayField}
            getDropdownState={getDropdownState}
            setDropdownState={setDropdownState}
            theme={theme}
            focusColor={focusColor}
            readOnly={readOnly}
            t={t}
          />

          <ScheduleRow
            week={week}
            scope={scope}
            setDayField={setDayField}
            getDropdownState={getDropdownState}
            setDropdownState={setDropdownState}
            theme={theme}
            focusColor={focusColor}
            readOnly={readOnly}
            t={t}
          />

          <CutRow
            week={week}
            scope={scope}
            setDayField={setDayField}
            getDropdownState={getDropdownState}
            setDropdownState={setDropdownState}
            theme={theme}
            focusColor={focusColor}
            readOnly={readOnly}
            t={t}
          />

          <ObservationsRow
            week={week}
            scope={scope}
            setDayField={setDayField}
            getDropdownState={getDropdownState}
            setDropdownState={setDropdownState}
            theme={theme}
            focusColor={focusColor}
            readOnly={readOnly}
            t={t}
          />

          <LocationRow
            week={week}
            scope={scope}
            setDayField={setDayField}
            getDropdownState={getDropdownState}
            setDropdownState={setDropdownState}
            theme={theme}
            focusColor={focusColor}
            readOnly={readOnly}
            t={t}
          />

          <TeamRow
            week={week}
            scope={scope}
            addMemberTo={addMemberTo}
            setMemberToRemove={setMemberToRemove}
            baseTeam={baseTeam}
            reinforcements={reinforcements}
            missingByPair={missingByPair}
            uniqueByPair={uniqueByPair}
            poolRefs={poolRefs}
            getDropdownState={getDropdownState}
            setDropdownState={setDropdownState}
            setDayField={setDayField}
            theme={theme}
            focusColor={focusColor}
            readOnly={readOnly}
            t={t}
          />

          <PrelightRow
            week={week}
            scope={scope}
            setDayField={setDayField}
            addMemberTo={addMemberTo}
            setMemberToRemove={setMemberToRemove}
            prelightTeam={prelightTeam}
            baseTeam={baseTeam}
            reinforcements={reinforcements}
            missingByPair={missingByPair}
            uniqueByPair={uniqueByPair}
            poolRefs={poolRefs}
            getDropdownState={getDropdownState}
            setDropdownState={setDropdownState}
            preOpen={preOpen}
            setPreOpen={setPreOpen}
            theme={theme}
            focusColor={focusColor}
            readOnly={readOnly}
            t={t}
          />

          <PickupRow
            week={week}
            scope={scope}
            setDayField={setDayField}
            addMemberTo={addMemberTo}
            setMemberToRemove={setMemberToRemove}
            pickupTeam={pickupTeam}
            baseTeam={baseTeam}
            reinforcements={reinforcements}
            missingByPair={missingByPair}
            uniqueByPair={uniqueByPair}
            poolRefs={poolRefs}
            getDropdownState={getDropdownState}
            setDropdownState={setDropdownState}
            pickOpen={pickOpen}
            setPickOpen={setPickOpen}
            theme={theme}
            focusColor={focusColor}
            readOnly={readOnly}
            t={t}
          />

          <IssuesRow
            week={week}
            scope={scope}
            setDayField={setDayField}
            getDropdownState={getDropdownState}
            setDropdownState={setDropdownState}
            theme={theme}
            focusColor={focusColor}
            readOnly={readOnly}
            t={t}
          />
        </tbody>
      </table>
    </div>
  );
}
