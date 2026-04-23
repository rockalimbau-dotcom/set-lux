import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnyRecord } from '@shared/types/common';
import { ReportPersonRowsProps } from './ReportPersonRowsTypes';
import { personaKeyFrom } from './ReportPersonRowsHelpers';
import { useTheme } from './useTheme';
import { useDropdownState } from './useDropdownState';
import { useOffMap } from './useOffMap';
import { PersonRowHeader } from './PersonRowHeader';
import { ConceptRow } from './ConceptRow';
import { normalizeJornadaType } from '@shared/utils/jornadaTranslations';

function ReportPersonRows({
  project,
  list,
  block,
  personStickyTop = 0,
  scheduleWindowForISO,
  resolveBlockForISO,
  getDayStyle,
  onScheduleChange,
  semana,
  collapsed,
  setCollapsed,
  data,
  setCell,
  findWeekAndDay,
  isPersonScheduledOnBlock,
  CONCEPTS,
  DIETAS_OPCIONES,
  SI_NO,
  parseDietas,
  formatDietas,
  horasExtraTipo = 'Hora Extra - Normal',
  readOnly = false,
  getMaterialPropioConfig,
  onAttachmentClick,
}: ReportPersonRowsProps) {
  const { t } = useTranslation();
  if (!Array.isArray(list)) return null;

  const theme = useTheme();
  const { getDropdownState, setDropdownState } = useDropdownState();
  const offMap = useOffMap({
    list,
    semana,
    block,
    isPersonScheduledOnBlock,
    findWeekAndDay,
  });

  const focusColor = theme === 'light' ? '#0476D9' : '#F27405';
  const dietasOptions = useMemo(() => (DIETAS_OPCIONES.filter(Boolean) as string[]), [DIETAS_OPCIONES]);
  const restDays = useMemo(() => {
    const dates = new Set<string>();
    semana.forEach(iso => {
      try {
        const { day } = findWeekAndDay(iso) || {};
        if (normalizeJornadaType(day?.tipo) === 'Descanso') {
          dates.add(iso);
        }
      } catch {
        // If planning lookup fails, leave the day unstyled rather than hiding data.
      }
    });
    return dates;
  }, [semana, findWeekAndDay]);

  return (
    <>
      {list.map(p => {
        const pKey = personaKeyFrom((p as AnyRecord)?.role || '', (p as AnyRecord)?.name || '', block, {
          roleId: (p as AnyRecord)?.roleId,
        });
        const materialPropioConfig = getMaterialPropioConfig
          ? getMaterialPropioConfig(
              (p as AnyRecord)?.role || '',
              (p as AnyRecord)?.name || '',
              block as 'base' | 'pre' | 'pick' | 'extra',
              {
                roleId: (p as AnyRecord)?.roleId,
                roleLabel: (p as AnyRecord)?.roleLabel,
              }
            )
          : null;
        const conceptsToRender = materialPropioConfig
          ? CONCEPTS
          : CONCEPTS.filter(c => c !== 'Material propio');

        return (
          <React.Fragment key={`${pKey}__${block || 'base'}`}>
            <PersonRowHeader
              project={project}
              person={p}
              block={block}
              stickyTop={personStickyTop}
              scheduleWindowForISO={scheduleWindowForISO}
              getDayStyle={getDayStyle}
              onScheduleChange={onScheduleChange}
              semana={semana}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              offMap={offMap}
              readOnly={readOnly}
              t={t}
            />

            {!collapsed[pKey] &&
              conceptsToRender.map(concepto => (
                <ConceptRow
                  key={`${pKey}_${block || 'base'}_${concepto}`}
                  person={p}
                  concepto={concepto}
                  block={block}
                  semana={semana}
                  data={data}
                  offMap={offMap}
                  restDays={restDays}
                  getDayStyle={getDayStyle}
                  resolveBlockForISO={resolveBlockForISO}
                  readOnly={readOnly}
                  horasExtraTipo={horasExtraTipo}
                  theme={theme}
                  focusColor={focusColor}
                  getDropdownState={getDropdownState}
                  setDropdownState={setDropdownState}
                  dietasOptions={dietasOptions}
                  parseDietas={parseDietas}
                  formatDietas={formatDietas}
                  setCell={setCell}
                  t={t}
                  onAttachmentClick={onAttachmentClick}
                />
              ))}
          </React.Fragment>
        );
      })}
    </>
  );
}

export default React.memo(ReportPersonRows);
