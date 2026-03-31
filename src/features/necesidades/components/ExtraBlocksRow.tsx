import { Td } from '@shared/components';
import { AnyRecord } from '@shared/types/common';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translateJornadaType as translateJornadaTypeUtil } from '@shared/utils/jornadaTranslations';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { sortTeam } from '@features/equipo/pages/EquipoTab/EquipoTabUtils';
import { ExtraBlock, applyExtraBlocksToDay, normalizeExtraBlocks } from '@shared/utils/extraBlocks';
import Chip from './Chip';
import { ConfirmModal } from './ConfirmModal';
import TextAreaAuto from './TextAreaAuto';
import { JornadaDropdownCell, MemberDropdown } from './MembersRow';

type ExtraBlocksRowProps = {
  label: string;
  weekId: string;
  weekObj: AnyRecord;
  options: AnyRecord[];
  setCell: (weekId: string, dayIdx: number, fieldKey: string, value: unknown) => void;
  readOnly?: boolean;
  rowKey?: string;
  isSelected?: boolean;
  toggleRowSelection?: (rowKey: string) => void;
  showSelection?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
};

const createBlockId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const createEmptyBlock = (id: string): ExtraBlock => ({
  id,
  tipo: '',
  start: '',
  end: '',
  list: [],
  text: '',
});

export function ExtraBlocksRow({
  label,
  weekId,
  weekObj,
  options,
  setCell,
  readOnly = false,
  rowKey,
  isSelected,
  toggleRowSelection,
  showSelection = true,
  collapsible = false,
  defaultCollapsed = false,
}: ExtraBlocksRowProps) {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
    }
    return 'light';
  });
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(
    `needs_row_${weekId}_refBlocks_collapsed`,
    defaultCollapsed
  );
  const [dropdownStates, setDropdownStates] = useState<
    Record<string, { isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean }>
  >({});
  const [memberToRemove, setMemberToRemove] = useState<{
    dayIdx: number;
    blockId: string;
    idx: number;
    memberName: string;
  } | null>(null);
  const [blockToRemove, setBlockToRemove] = useState<{ dayIdx: number; blockId: string } | null>(null);

  const DAYS = useMemo(
    () => [
      { idx: 0, key: 'mon', name: t('reports.dayNames.monday') },
      { idx: 1, key: 'tue', name: t('reports.dayNames.tuesday') },
      { idx: 2, key: 'wed', name: t('reports.dayNames.wednesday') },
      { idx: 3, key: 'thu', name: t('reports.dayNames.thursday') },
      { idx: 4, key: 'fri', name: t('reports.dayNames.friday') },
      { idx: 5, key: 'sat', name: t('reports.dayNames.saturday') },
      { idx: 6, key: 'sun', name: t('reports.dayNames.sunday') },
    ],
    [t]
  );

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

    return () => observer.disconnect();
  }, []);

  const translateJornadaType = (tipo: string): string => {
    const translateFn = (key: string, defaultValue?: string): string => {
      const translated = t(key);
      return translated === key && defaultValue ? defaultValue : translated;
    };
    return translateJornadaTypeUtil(tipo, translateFn);
  };

  const sortMemberList = (list: AnyRecord[]) =>
    sortTeam(
      (list || []).map((m: AnyRecord, idx: number) => ({
        ...m,
        seq: m?.seq ?? idx,
      }))
    );

  const getDropdownState = (key: string) =>
    dropdownStates[key] || { isOpen: false, hoveredOption: null, isButtonHovered: false };

  const setDropdownState = (
    key: string,
    updates: Partial<{ isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean }>
  ) => {
    setDropdownStates(prev => ({
      ...prev,
      [key]: { ...getDropdownState(key), ...updates },
    }));
  };

  const persistBlocks = (dayIdx: number, nextBlocks: ExtraBlock[]) => {
    const day = ((weekObj as AnyRecord).days?.[dayIdx] || {}) as AnyRecord;
    const normalizedDay = applyExtraBlocksToDay(day, nextBlocks);
    setCell(weekId, dayIdx, 'refBlocks', normalizedDay.refBlocks);
  };

  const addBlock = (dayIdx: number) => {
    const day = ((weekObj as AnyRecord).days?.[dayIdx] || {}) as AnyRecord;
    const blocks = normalizeExtraBlocks(day);
    const nextBlock: ExtraBlock = createEmptyBlock(createBlockId());
    if (blocks.length === 0) {
      persistBlocks(dayIdx, [createEmptyBlock(createBlockId()), nextBlock]);
      return;
    }
    persistBlocks(dayIdx, [...blocks, nextBlock]);
  };

  const updateBlock = (dayIdx: number, blockId: string, updater: (block: ExtraBlock) => ExtraBlock) => {
    const day = ((weekObj as AnyRecord).days?.[dayIdx] || {}) as AnyRecord;
    const blocks = normalizeExtraBlocks(day);
    const editableBlocks = blocks.length > 0 ? blocks : [createEmptyBlock(blockId)];
    const nextBlocks = editableBlocks.map(block => (block.id === blockId ? updater(block) : block));
    persistBlocks(dayIdx, nextBlocks);
  };

  return (
    <>
      <tr>
        {showSelection && rowKey && toggleRowSelection && (
          <Td align='middle' className='text-center w-6 sm:w-7 md:w-8 px-0.5'>
            <div className='flex justify-center'>
              <input
                type='checkbox'
                checked={isSelected ?? true}
                onChange={() => !readOnly && toggleRowSelection(rowKey)}
                disabled={readOnly}
                title={
                  readOnly
                    ? t('conditions.projectClosed')
                    : isSelected
                      ? t('needs.deselectForExport')
                      : t('needs.selectForExport')
                }
                className={`accent-blue-500 dark:accent-[#f59e0b] scale-90 transition ${
                  readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } opacity-70 hover:opacity-100`}
              />
            </div>
          </Td>
        )}
        <Td className='border border-neutral-border px-1 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 font-semibold bg-white/5 whitespace-nowrap text-[9px] sm:text-[10px] md:text-xs lg:text-sm align-middle'>
          <div className='flex items-center gap-2'>
            {collapsible && (
              <button
                type='button'
                onClick={() => setCollapsed(v => !v)}
                className='text-[8px] sm:text-[9px] md:text-[10px] font-semibold'
                style={{ color: 'var(--text)' }}
                title={collapsed ? t('needs.open') : t('needs.close')}
              >
                {collapsed ? '+' : '−'}
              </button>
            )}
            <span>{label}</span>
          </div>
        </Td>
        {DAYS.map((d, dayIdx) => {
          const day = ((weekObj as AnyRecord).days?.[dayIdx] || {}) as AnyRecord;
          const blocks = normalizeExtraBlocks(day);
          const renderBlocks = blocks.length > 0 ? blocks : [createEmptyBlock(`draft_${weekId}_${dayIdx}`)];
          return (
            <Td key={d.key} align='middle' className='text-center'>
              {collapsible && collapsed ? (
                <div className='flex items-center justify-center min-h-[20px] sm:min-h-[24px] md:min-h-[28px]' />
              ) : (
                <div className='space-y-2'>
                  {renderBlocks.map((block, index) => (
                    <div
                      key={block.id}
                      className={index === 0 ? '' : 'mt-2 border-t border-neutral-border/60 pt-2'}
                    >
                      {(() => {
                        const jornadaNormalized = String(block.tipo || '').trim().toLowerCase();
                        const isRestOrEnd = jornadaNormalized === 'descanso' || jornadaNormalized === 'fin';
                        return (
                          <>
                      <div className='mb-1 flex items-center gap-1'>
                        <div className='flex-1'>
                          <JornadaDropdownCell
                            value={block.tipo}
                            onChange={nextValue => {
                              if (readOnly) return;
                              const normalized = String(nextValue || '').trim().toLowerCase();
                              updateBlock(dayIdx, block.id, current => ({
                                ...current,
                                tipo: nextValue,
                                start: normalized === 'descanso' || normalized === 'fin' ? '' : current.start,
                                end: normalized === 'descanso' || normalized === 'fin' ? '' : current.end,
                                list: normalized === 'descanso' || normalized === 'fin' ? [] : current.list,
                                text: normalized === 'descanso' || normalized === 'fin' ? '' : current.text,
                              }));
                            }}
                            readOnly={readOnly}
                            dropdownKey={`${weekId}_refBlocks_${dayIdx}_${block.id}`}
                            dropdownState={getDropdownState(`${weekId}_refBlocks_${dayIdx}_${block.id}`)}
                            setDropdownState={setDropdownState}
                            theme={theme}
                            focusColor={theme === 'light' ? '#0476D9' : '#F27405'}
                            translateJornadaType={translateJornadaType}
                          />
                        </div>
                        {index > 0 && (
                          <button
                            type='button'
                            onClick={() => !readOnly && setBlockToRemove({ dayIdx, blockId: block.id })}
                            disabled={readOnly}
                            title={t('needs.removeBlock')}
                            className={`h-6 w-6 sm:h-7 sm:w-7 shrink-0 rounded border border-neutral-border text-[11px] sm:text-xs md:text-sm font-semibold ${
                              readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/5 dark:hover:bg-white/10'
                            }`}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      {!isRestOrEnd && (
                        <>
                      <div className='mb-1 flex items-center gap-1'>
                        <input
                          type='time'
                          value={block.start}
                          onChange={e =>
                            !readOnly &&
                            updateBlock(dayIdx, block.id, current => ({ ...current, start: e.target.value }))
                          }
                          disabled={readOnly}
                          className={`w-[48%] px-1 py-0.5 rounded border text-[9px] sm:text-[10px] md:text-xs ${
                            readOnly ? 'opacity-50 cursor-not-allowed' : ''
                          } bg-white text-gray-900 dark:bg-black/40 dark:text-zinc-300`}
                          style={{ borderColor: 'var(--border)' }}
                        />
                        <input
                          type='time'
                          value={block.end}
                          onChange={e =>
                            !readOnly &&
                            updateBlock(dayIdx, block.id, current => ({ ...current, end: e.target.value }))
                          }
                          disabled={readOnly}
                          className={`w-[48%] px-1 py-0.5 rounded border text-[9px] sm:text-[10px] md:text-xs ${
                            readOnly ? 'opacity-50 cursor-not-allowed' : ''
                          } bg-white text-gray-900 dark:bg-black/40 dark:text-zinc-300`}
                          style={{ borderColor: 'var(--border)' }}
                        />
                      </div>
                      <div className='flex flex-wrap gap-0.5 sm:gap-1 md:gap-1.5 mb-0.5 sm:mb-1 md:mb-1.5 justify-center'>
                        {block.list.length === 0 && (
                          <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400'>—</span>
                        )}
                        {block.list.map((member, idx) => (
                          <Chip
                            key={`${block.id}-${member.role}-${member.name}-${idx}`}
                            role={member?.role}
                            name={member?.name}
                            gender={member?.gender}
                            source={member?.source}
                            onRemove={() =>
                              !readOnly &&
                              setMemberToRemove({
                                dayIdx,
                                blockId: block.id,
                                idx,
                                memberName: member?.name || t('team.thisMember'),
                              })
                            }
                            readOnly={readOnly}
                          />
                        ))}
                      </div>
                      <MemberDropdown
                        options={options}
                        readOnly={readOnly}
                        placeholder={t('planning.addMember')}
                        theme={theme}
                        existingList={block.list}
                        context='mixed'
                        onSelect={(member: AnyRecord) => {
                          if (readOnly) return;
                          updateBlock(dayIdx, block.id, current => ({
                            ...current,
                            list: sortMemberList([
                              ...current.list,
                              {
                                ...member,
                                originalSource: member?.source || 'ref',
                                source: 'ref',
                              },
                            ]),
                          }));
                        }}
                      />
                      <div className='mt-1'>
                        <TextAreaAuto
                          value={block.text}
                          onChange={(val: string) =>
                            !readOnly && updateBlock(dayIdx, block.id, current => ({ ...current, text: val }))
                          }
                          placeholder={t('needs.writeHere')}
                          readOnly={readOnly}
                        />
                      </div>
                        </>
                      )}
                          </>
                        );
                      })()}
                    </div>
                  ))}
                  {!readOnly && (
                    <button
                      type='button'
                      onClick={() => addBlock(dayIdx)}
                      className='w-full rounded-md border border-neutral-border px-2 py-1 text-[9px] sm:text-[10px] md:text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10'
                    >
                      {t('needs.addBlock')}
                    </button>
                  )}
                  {readOnly && blocks.length === 0 && (
                    <div className='flex items-center justify-center min-h-[20px] sm:min-h-[24px] md:min-h-[28px]'>
                      <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400'>—</span>
                    </div>
                  )}
                </div>
              )}
            </Td>
          );
        })}
      </tr>
      {memberToRemove && (
        <ConfirmModal
          title={t('needs.confirmDeletion')}
          message={t('needs.confirmDeleteMember', { name: memberToRemove.memberName })}
          onClose={() => setMemberToRemove(null)}
          onConfirm={() => {
            const day = (((weekObj as AnyRecord).days?.[memberToRemove.dayIdx] || {}) as AnyRecord);
            const blocks = normalizeExtraBlocks(day).map(block => {
              if (block.id !== memberToRemove.blockId) return block;
              const nextList = [...block.list];
              nextList.splice(memberToRemove.idx, 1);
              return { ...block, list: nextList };
            });
            persistBlocks(memberToRemove.dayIdx, blocks);
            setMemberToRemove(null);
          }}
        />
      )}
      {blockToRemove && (
        <ConfirmModal
          title={t('needs.confirmDeletion')}
          message={t('needs.confirmDeleteGroup', { title: t('needs.reinforcements') })}
          onClose={() => setBlockToRemove(null)}
          onConfirm={() => {
            const day = (((weekObj as AnyRecord).days?.[blockToRemove.dayIdx] || {}) as AnyRecord);
            const blocks = normalizeExtraBlocks(day).filter(block => block.id !== blockToRemove.blockId);
            persistBlocks(blockToRemove.dayIdx, blocks);
            setBlockToRemove(null);
          }}
        />
      )}
    </>
  );
}
