import { AnyRecord } from '@shared/types/common';
import { Td, Row } from '@shared/components';
import Button from '@shared/components/Button';
import { AddMemberDropdown } from '../../AddMemberDropdown';
import { MemberChip } from '../MemberChip';
import { TeamRowProps } from './TableRowComponentsTypes';

export function TeamRow({
  week,
  scope,
  addMemberTo,
  setMemberToRemove,
  baseTeam,
  reinforcements,
  missingByPair,
  uniqueByPair,
  poolRefs,
  getDropdownState,
  setDropdownState,
  theme,
  focusColor,
  readOnly = false,
  t,
}: TeamRowProps) {
  return (
    <Row label={t('planning.team')}>
      {week.days.map((day: AnyRecord, i: number) => {
        const basePool = (baseTeam || []).map(m => ({
          role: m.role,
          name: (m.name || '').trim(),
          gender: m.gender,
          source: 'base',
        }));
        const options = missingByPair(
          day.team,
          uniqueByPair([...basePool, ...poolRefs(reinforcements)])
        );
        return (
          <Td key={i} align='middle'>
            <div className='flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 justify-center'>
              {(day.team || []).map((m: AnyRecord, idx: number) => (
                <span key={idx} className='inline-flex items-center gap-0.5 sm:gap-1 md:gap-2'>
                  <MemberChip role={m.role} name={m.name} source={m.source} gender={m.gender} />
                  <Button
                    variant='remove'
                    size='sm'
                    className={`no-pdf px-1 py-0.5 sm:px-1.5 sm:py-1 text-[9px] sm:text-[10px] md:text-xs ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => {
                      if (readOnly) return;
                      setMemberToRemove({
                        scope,
                        weekId: week.id as string,
                        dayIndex: i,
                        listKey: 'team',
                        idx,
                        memberName: m.name || 'este miembro',
                      });
                    }}
                    disabled={readOnly}
                    title={readOnly ? t('conditions.projectClosed') : t('planning.remove')}
                  >
                    ×
                  </Button>
                </span>
              ))}
              <AddMemberDropdown
                scope={scope}
                weekId={week.id as string}
                dayIndex={i}
                day={day}
                dropdownKey={`equipo_${week.id}_${i}`}
                dropdownState={getDropdownState(`equipo_${week.id}_${i}`)}
                setDropdownState={setDropdownState}
                addMemberTo={addMemberTo}
                options={options}
                theme={theme}
                focusColor={focusColor}
                readOnly={readOnly}
              />
            </div>
          </Td>
        );
      })}
    </Row>
  );
}

