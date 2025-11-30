import React, { useMemo } from 'react';
import Accordion from './Accordion';
import EmptyHint from './EmptyHint';
import WeekCard from './WeekCard';

type AnyRecord = Record<string, any>;

type PlanScopeSectionProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onExport: () => void;
  onExportPDF: () => void;
  btnExportCls?: string;
  btnExportStyle?: React.CSSProperties;
  scope: 'pre' | 'pro';
  weeks: AnyRecord[];
  duplicateWeek: (scope: 'pre' | 'pro', weekId: string) => void;
  deleteWeek: (scope: 'pre' | 'pro', weekId: string) => void;
  setWeekStart: (scope: 'pre' | 'pro', weekId: string, date: string) => void;
  setDayField: (
    scope: 'pre' | 'pro',
    weekId: string,
    dayIdx: number,
    patch: AnyRecord
  ) => void;
  addMemberTo: (
    scope: 'pre' | 'pro',
    weekId: string,
    dayIdx: number,
    listKey: 'team' | 'prelight' | 'pickup',
    member: AnyRecord
  ) => void;
  removeMemberFrom: (
    scope: 'pre' | 'pro',
    weekId: string,
    dayIdx: number,
    listKey: 'team' | 'prelight' | 'pickup',
    idxInList: number
  ) => void;
  teamList: AnyRecord[];
  baseTeam: AnyRecord[];
  prelightTeam: AnyRecord[];
  pickupTeam: AnyRecord[];
  reinforcements: AnyRecord[];
  onExportWeek: (week: AnyRecord) => void;
  onExportWeekPDF: (week: AnyRecord) => void;
  emptyText: string;
  containerId: string;
  weeksOnlyId: string;
  project?: AnyRecord;
};

function PlanScopeSection(props: PlanScopeSectionProps) {
  const {
    title,
    open,
    onToggle,
    onAdd,
    onExport,
    onExportPDF,
    btnExportCls,
    btnExportStyle,
    scope,
    weeks,
    duplicateWeek,
    deleteWeek,
    setWeekStart,
    setDayField,
    addMemberTo,
    removeMemberFrom,
    teamList,
    baseTeam,
    prelightTeam,
    pickupTeam,
    reinforcements,
    onExportWeek,
    onExportWeekPDF,
    emptyText,
    containerId,
    weeksOnlyId,
    project,
  } = props;

  const weekCards = useMemo(() => weeks.map(w => (
    <WeekCard
      key={w.id}
      scope={scope}
      week={w}
      duplicateWeek={duplicateWeek}
      deleteWeek={deleteWeek}
      setWeekStart={setWeekStart}
      setDayField={setDayField}
      addMemberTo={addMemberTo}
      removeMemberFrom={removeMemberFrom}
      teamList={teamList}
      baseTeam={baseTeam}
      prelightTeam={prelightTeam}
      pickupTeam={pickupTeam}
      reinforcements={reinforcements}
      onExportWeek={() => onExportWeek(w)}
      onExportWeekPDF={() => onExportWeekPDF(w)}
      btnExportCls={btnExportCls}
      btnExportStyle={btnExportStyle}
      project={project}
    />
  )), [weeks, scope, duplicateWeek, deleteWeek, setWeekStart, setDayField, addMemberTo, removeMemberFrom, teamList, baseTeam, prelightTeam, pickupTeam, reinforcements, onExportWeek, onExportWeekPDF, btnExportCls, btnExportStyle, project]);

  return (
    <Accordion
      title={title}
      open={open}
      onToggle={onToggle}
      onAdd={onAdd}
      onExport={onExport}
      onExportPDF={onExportPDF}
      btnExportCls={btnExportCls}
      btnExportStyle={btnExportStyle}
    >
      {weeks.length === 0 ? (
        <EmptyHint text={emptyText} />
      ) : (
        <div id={containerId}>
          <div id={weeksOnlyId}>
            {weekCards}
          </div>
        </div>
      )}
    </Accordion>
  );
}

export default React.memo(PlanScopeSection);
