import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlanWeeks } from '../utils/plan';
import { weekAllPeopleActive } from '../utils/plan';
import { NominaSemanalProps, ProjectLike } from './NominaSemanal/NominaSemanalTypes';
import { useHasTeam } from './NominaPublicidad/useHasTeam';
import { EmptyState } from './NominaPublicidad/EmptyState';
import { useCondSync } from './NominaSemanal/useCondSync';
import { makeRolePrices as makeRolePricesSemanal } from '../utils/calcSemanal';
import { NominaSemanalContent } from './NominaSemanal/NominaSemanalContent';

export default function NominaSemanal({ project, readOnly = false }: NominaSemanalProps) {
  const { t } = useTranslation();

  // Asegurar que el proyecto tenga el modo correcto para semanal
  const projectWithMode = useMemo(
    () => ({
      ...project,
      conditions: {
        ...project?.conditions,
        tipo: 'semanal',
      },
    }),
    [project]
  );

  const { pre, pro } = usePlanWeeks(projectWithMode as any);
  const allWeeks = [...pre, ...pro];
  const baseId = project?.id || project?.nombre || 'tmp';

  const hasTeam = useHasTeam(project, baseId);
  const hasWeeks = allWeeks.length > 0;
  const projectId = project?.id || project?.nombre;
  const planificacionPath = projectId ? `/project/${projectId}/planificacion` : '/projects';
  const equipoPath = projectId ? `/project/${projectId}/equipo` : '/projects';

  // Caso 1: Faltan ambas cosas (semanas Y equipo)
  if (!hasWeeks && !hasTeam) {
    return (
      <EmptyState
        title={t('payroll.configureProject')}
        message={t('payroll.addWeeksInPlanningAndTeam')}
        planificacionPath={planificacionPath}
        equipoPath={equipoPath}
        planningLabel={t('payroll.planning')}
        teamLabel={t('navigation.team')}
        andLabel={t('payroll.andTeamIn')}
        toLabel={t('payroll.toCalculatePayroll')}
      />
    );
  }

  // Caso 2: Solo faltan semanas (pero SÍ hay equipo)
  if (!hasWeeks) {
    return (
      <EmptyState
        title={t('payroll.noWeeksInPlanning')}
        message={t('payroll.addWeeksInPlanningForPayroll')}
        planificacionPath={planificacionPath}
        planningLabel={t('payroll.planning')}
        toLabel={t('payroll.toAppearHerePayroll')}
      />
    );
  }

  const weeksWithPeople = allWeeks.filter((w: any) => weekAllPeopleActive(w).length > 0);

  // Caso 3: Solo falta equipo (pero SÍ hay semanas)
  if (hasWeeks && !hasTeam) {
    return (
      <EmptyState
        title={t('payroll.missingTeam')}
        message={t('payroll.fillTeamIn')}
        equipoPath={equipoPath}
        teamLabel={t('navigation.team')}
        toLabel={t('payroll.toCalculatePayrollTeam')}
      />
    );
  }

  // Caso 4: Hay semanas y equipo, pero las semanas no tienen personas asignadas
  if (hasWeeks && hasTeam && weeksWithPeople.length === 0) {
    return (
      <EmptyState
        title={t('payroll.assignPeopleToWeeks')}
        message={t('payroll.weeksWithoutTeam', {
          count: allWeeks.length,
          plural: allWeeks.length !== 1 ? 's' : '',
        })}
        planificacionPath={planificacionPath}
        planningLabel={t('payroll.planning')}
        toLabel={t('payroll.butNoPeopleAssigned')}
      />
    );
  }

  // === Re-render cuando cambian Condiciones semanal ===
  const condStamp = useCondSync(baseId);

  // Precios por rol listos - usando funciones específicas de semanal
  const rolePrices = useMemo(
    () => makeRolePricesSemanal(projectWithMode),
    [projectWithMode, condStamp]
  );

  const basePersist = `nomina_${project?.id || project?.nombre || 'tmp'}`;

  return (
    <NominaSemanalContent
      project={project}
      projectWithMode={projectWithMode}
      allWeeks={allWeeks}
      rolePrices={rolePrices}
      basePersist={basePersist}
      readOnly={readOnly}
    />
  );
}
