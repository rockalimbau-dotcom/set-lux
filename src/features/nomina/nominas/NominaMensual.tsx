import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlanWeeks } from '../utils/plan';
import { weekAllPeopleActive } from '../utils/plan';
import { NominaMensualProps, ProjectLike } from './NominaMensual/NominaMensualTypes';
import { useHasTeam } from './NominaPublicidad/useHasTeam';
import { EmptyState } from './NominaPublicidad/EmptyState';
import { useCondSync } from './NominaMensual/useCondSync';
import { makeRolePrices as makeRolePricesMensual } from '../utils/calcMensual';
import { NominaMensualContent } from './NominaMensual/NominaMensualContent';

export default function NominaMensual({ project, readOnly = false }: NominaMensualProps) {
  const { t } = useTranslation();

  // Asegurar que el proyecto tenga el modo correcto para mensual
  const projectWithMode = useMemo(
    () => ({
      ...project,
      conditions: {
        ...project?.conditions,
        tipo: 'mensual',
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
  const planificacionPath = projectId ? `/project/${projectId}/calendario` : '/projects';
  const equipoPath = projectId ? `/project/${projectId}/equipo` : '/projects';

  // Caso 1: Faltan ambas cosas (semanas Y equipo)
  if (!hasWeeks && !hasTeam) {
    return (
      <EmptyState
        title={t('payroll.configureProject')}
        message={t('payroll.addWeeksInPlanningAndTeam')}
        planificacionPath={planificacionPath}
        equipoPath={equipoPath}
        planningLabel={t('navigation.needs')}
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
        planningLabel={t('navigation.needs')}
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
        planningLabel={t('navigation.needs')}
        toLabel={t('payroll.butNoPeopleAssigned')}
      />
    );
  }

  // === Re-render cuando cambian Condiciones mensual ===
  const condStamp = useCondSync(baseId);

  // Precios por rol usando funciones específicas de mensual
  const rolePrices = useMemo(
    () => makeRolePricesMensual(projectWithMode),
    [projectWithMode, condStamp]
  );

  const basePersist = `nomina_${project?.id || project?.nombre || 'tmp'}`;

  return (
    <NominaMensualContent
      project={project}
      projectWithMode={projectWithMode}
      allWeeks={allWeeks}
      rolePrices={rolePrices}
      basePersist={basePersist}
      readOnly={readOnly}
    />
  );
}
