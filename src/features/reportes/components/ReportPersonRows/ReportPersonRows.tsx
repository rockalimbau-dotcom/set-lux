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

function ReportPersonRows({
  list,
  block,
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

  return (
    <>
      {list.map(p => {
        const pKey = personaKeyFrom((p as AnyRecord)?.role || '', (p as AnyRecord)?.name || '', block);
        const materialPropioConfig = getMaterialPropioConfig
          ? getMaterialPropioConfig(
              (p as AnyRecord)?.role || '',
              (p as AnyRecord)?.name || '',
              block as 'base' | 'pre' | 'pick' | 'extra'
            )
          : null;
        const conceptsToRender = materialPropioConfig
          ? CONCEPTS
          : CONCEPTS.filter(c => c !== 'Material propio');

        return (
          <React.Fragment key={`${pKey}__${block || 'base'}`}>
            <PersonRowHeader
              person={p}
              block={block}
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
