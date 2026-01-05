import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { btnExport } from '@shared/utils/tailwindClasses';
import { AnyRecord } from '@shared/types/common';

import PlanScopeSection from '../components/PlanScopeSection';
import { PlanificacionTabProps } from './PlanificacionTab/PlanificacionTabTypes';
import { useHolidays } from './PlanificacionTab/useHolidays';
import { useRoster } from './PlanificacionTab/useRoster';
import { useWeeksData } from './PlanificacionTab/useWeeksData';
import { createWeekHandlers } from './PlanificacionTab/weekActions';
import { exportScope, exportWeek, exportScopePDF, exportWeekPDF } from './PlanificacionTab/exportHelpers';

export default function PlanificacionTab({
  project,
  baseTeam = [],
  prelightTeam = [],
  pickupTeam = [],
  reinforcements = [],
  teamList = [],
  readOnly = false,
}: PlanificacionTabProps) {
  const { t } = useTranslation();
  const storageKey = useMemo(() => {
    const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'demo';
    return `plan_${base}`;
  }, [(project as AnyRecord)?.id, (project as AnyRecord)?.nombre]);

  const projectCountry = (project as AnyRecord)?.country || 'ES';
  const projectRegion = (project as AnyRecord)?.region || 'CT';
  
  const { holidayFull, holidayMD } = useHolidays(projectCountry, projectRegion);
  
  const { baseRoster, preRoster, pickRoster, refsRoster } = useRoster(
    project,
    baseTeam,
    prelightTeam,
    pickupTeam,
    reinforcements
  );

  const {
    preWeeks,
    proWeeks,
    setPreWeeks,
    setProWeeks,
    openPre,
    setOpenPre,
    openPro,
    setOpenPro,
  } = useWeeksData(
    storageKey,
    holidayFull,
    holidayMD,
    baseRoster,
    preRoster,
    pickRoster,
    refsRoster
  );

  const weekHandlers = createWeekHandlers(
    preWeeks,
    proWeeks,
    setPreWeeks,
    setProWeeks,
    baseRoster,
    preRoster,
    pickRoster,
    holidayFull,
    holidayMD,
    readOnly,
    t
  );

  const btnExportCls = btnExport;
  const btnExportStyle: React.CSSProperties = {
    background: '#f59e0b',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  return (
    <div id='print-root' className='space-y-6'>
      <div className='no-pdf flex items-center justify-end gap-2'>
        <button
          className={btnExportCls}
          style={btnExportStyle}
          onClick={() => exportScopePDF('all', preWeeks, proWeeks, project)}
          title={t('planning.exportAllPDF')}
        >
          {t('planning.pdfFull')}
        </button>
      </div>

      <PlanScopeSection
        title={t('planning.preproduction')}
        open={openPre}
        onToggle={() => setOpenPre(v => !v)}
        onAdd={weekHandlers.addPreWeek}
        onExport={() => exportScope('pre', preWeeks, proWeeks, project)}
        onExportPDF={() => exportScopePDF('pre', preWeeks, proWeeks, project)}
        btnExportCls={btnExportCls}
        btnExportStyle={btnExportStyle}
        scope='pre'
        weeks={preWeeks}
        duplicateWeek={weekHandlers.duplicateWeek as any}
        deleteWeek={weekHandlers.deleteWeek as any}
        setWeekStart={weekHandlers.setWeekStart as any}
        setDayField={(scope, weekId, dayIdx, patch) => weekHandlers.setDayField(scope, weekId, dayIdx, patch, t) as any}
        addMemberTo={weekHandlers.addMemberTo as any}
        removeMemberFrom={weekHandlers.removeMemberFrom as any}
        teamList={teamList}
        baseTeam={baseRoster}
        prelightTeam={preRoster}
        pickupTeam={pickRoster}
        reinforcements={refsRoster}
        onExportWeek={(week: AnyRecord) => exportWeek(week, project) as any}
        onExportWeekPDF={(week: AnyRecord) => exportWeekPDF(week, project) as any}
        emptyText={t('planning.noPreproductionWeeks')}
        containerId='pre-block'
        weeksOnlyId='pre-weeks-only'
        project={project}
        readOnly={readOnly}
      />

      <PlanScopeSection
        title={t('planning.production')}
        open={openPro}
        onToggle={() => setOpenPro(v => !v)}
        onAdd={weekHandlers.addProWeek}
        onExport={() => exportScope('pro', preWeeks, proWeeks, project)}
        onExportPDF={() => exportScopePDF('pro', preWeeks, proWeeks, project)}
        btnExportCls={btnExportCls}
        btnExportStyle={btnExportStyle}
        scope='pro'
        weeks={proWeeks}
        duplicateWeek={weekHandlers.duplicateWeek as any}
        deleteWeek={weekHandlers.deleteWeek as any}
        setWeekStart={weekHandlers.setWeekStart as any}
        setDayField={(scope, weekId, dayIdx, patch) => weekHandlers.setDayField(scope, weekId, dayIdx, patch, t) as any}
        addMemberTo={weekHandlers.addMemberTo as any}
        removeMemberFrom={weekHandlers.removeMemberFrom as any}
        teamList={teamList}
        baseTeam={baseRoster}
        prelightTeam={preRoster}
        pickupTeam={pickRoster}
        reinforcements={refsRoster}
        onExportWeek={(week: AnyRecord) => exportWeek(week, project) as any}
        onExportWeekPDF={(week: AnyRecord) => exportWeekPDF(week, project) as any}
        emptyText={t('planning.noProductionWeeks')}
        containerId='pro-block'
        weeksOnlyId='pro-weeks-only'
        project={project}
        readOnly={readOnly}
      />
    </div>
  );
}
