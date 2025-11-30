import React from 'react';
import { storage } from '@shared/services/localStorage.service';
import MonthSection from '../components/MonthSection.jsx';
import { ROLE_COLORS, roleLabelFromCode } from '@shared/constants/roles';
import {
  makeRolePrices as makeRolePricesSemanal,
  aggregateReports as aggregateReportsSemanal,
  aggregateWindowedReport as aggregateWindowedReportSemanal,
  getCondParams as getCondParamsSemanal,
  getOvertimeWindowForPayrollMonth as getOvertimeWindowForPayrollMonthSemanal,
  isoInRange as isoInRangeSemanal,
  aggregateFilteredConcepts as aggregateFilteredConceptsSemanal,
} from '../utils/calcSemanal';
import { monthKeyFromISO, monthLabelEs } from '../utils/date';
import { buildNominaMonthHTML, openPrintWindow, exportToPDF } from '../utils/export';
import {
  usePlanWeeks,
  stripPR,
  buildRefuerzoIndex,
  weekISOdays,
  weekAllPeopleActive,
} from '../utils/plan';

interface ProjectLike {
  id?: string;
  nombre?: string;
  conditions?: {
    tipo?: string;
  };
}

interface NominaSemanalProps {
  project: ProjectLike;
}

export default function NominaSemanal({ project }: NominaSemanalProps) {
  // Asegurar que el proyecto tenga el modo correcto para semanal
  const projectWithMode = {
    ...project,
    conditions: {
      ...project?.conditions,
      tipo: 'semanal'
    }
  };
  
  const { pre, pro } = usePlanWeeks(projectWithMode as any);
  const allWeeks = [...pre, ...pro];

  if (allWeeks.length === 0) {
    return (
      <div className='text-sm text-zinc-400 border border-dashed border-neutral-border rounded-xl p-4 bg-neutral-surface'>
        No hay semanas en Planificación. Añade semanas allí para que aparezcan
        aquí la nómina.
      </div>
    );
  }

  const weeksWithPeople = allWeeks.filter(
    (w: any) => weekAllPeopleActive(w).length > 0
  );
  if (weeksWithPeople.length === 0) {
    return (
      <div className='text-sm text-zinc-400 border border-dashed border-neutral-border rounded-xl p-4 bg-neutral-surface'>
        Falta añadir el equipo. Por favor, rellena en la pestaña <b>Equipo</b>{' '}
        el equipo base del proyecto para calcular la nómina.
      </div>
    );
  }

  // Agrupar por mes natural
  const monthMap: Map<string, { weeks: Set<any>; isos: Set<string> }> = new Map();
  for (const w of weeksWithPeople) {
    const isos = weekISOdays(w);
    for (const iso of isos) {
      const mk = monthKeyFromISO(iso);
      if (!monthMap.has(mk))
        monthMap.set(mk, { weeks: new Set(), isos: new Set() });
      const bucket = monthMap.get(mk)!;
      bucket.weeks.add(w);
      bucket.isos.add(iso);
    }
  }
  const monthKeys = Array.from(monthMap.keys()).sort();

  // === Re-render cuando cambian Condiciones semanal ===
  const baseId = project?.id || project?.nombre || 'tmp';
  const condKeys = [
    `cond_${baseId}_semanal`,
  ];

  const [condStamp, setCondStamp] = React.useState<string>(() =>
    condKeys.map(k => storage.getString(k) || '').join('|')
  );

  React.useEffect(() => {
    const tick = () => {
      const cur = condKeys.map(k => storage.getString(k) || '').join('|');
      setCondStamp(prev => (prev === cur ? prev : cur));
    };
    const onFocus = () => tick();
    const onStorage = (e: StorageEvent) => {
      if (e && e.key && condKeys.includes(e.key)) tick();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    const id = setInterval(tick, 1000);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
      clearInterval(id);
    };
  }, [baseId]);

  // Precios por rol listos - usando funciones específicas de semanal
  const rolePrices = React.useMemo(
    () => makeRolePricesSemanal(projectWithMode),
    [project, condStamp]
  );

  // Export por mes usando las filas enriquecidas que nos pasa MonthSection
  const exportMonth = (monthKey: string, enrichedRows: any[]) => {
    const html = buildNominaMonthHTML(
      project,
      monthKey,
      enrichedRows,
      monthLabelEs
    );
    openPrintWindow(html);
  };

  // Export to PDF
  const exportMonthPDF = async (monthKey: string, enrichedRows: any[]) => {
    const success = await exportToPDF(
      project,
      monthKey,
      enrichedRows,
      monthLabelEs
    );
    if (!success) {
      // Fallback to HTML if PDF fails
      exportMonth(monthKey, enrichedRows);
    }
  };

  const basePersist = `nomina_${project?.id || project?.nombre || 'tmp'}`;

  // ===== Días trabajados / Travel Day =====
  function calcWorkedBreakdown(
    weeks: any[],
    filterISO: (iso: string) => boolean,
    person: { role: string; name: string }
  ) {
    const isWantedISO = filterISO || (() => true);
    const wantedRole = String(person.role || '');
    const wantedBase = wantedRole.replace(/[PR]$/, '');
    const wantedSuffix = /P$/.test(wantedRole)
      ? 'P'
      : /R$/.test(wantedRole)
      ? 'R'
      : '';
    const wantedNameNorm = String(person.name || '')
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toLowerCase();

    let workedBase = 0;
    let workedPre = 0;
    let workedPick = 0;
    let workedDays = 0;
    let travelDays = 0;
    let holidayDays = 0;

    const nameEq = (s: string) =>
      String(s || '')
        .normalize('NFKD')
        .replace(/\p{Diacritic}/gu, '')
        .trim()
        .toLowerCase() === wantedNameNorm;

    // Flag para detener el conteo cuando se encuentre "Fin"
    let foundFin = false;

    for (const w of weeks) {
      if (foundFin) break; // Detener si ya encontramos "Fin"
      const isos = weekISOdays(w);
      for (let idx = 0; idx < (w.days || []).length; idx++) {
        if (foundFin) break; // Detener si ya encontramos "Fin"
        const day = (w.days || [])[idx];
        const iso = isos[idx];
        if (!isWantedISO(iso)) continue;
        
        // Si encontramos "Fin", detener el conteo (no contar este día ni los siguientes)
        if ((day?.tipo || '') === 'Fin') {
          foundFin = true;
          break;
        }
        
        if ((day?.tipo || '') === 'Descanso') continue;

        if (wantedRole === 'REF') {
          const anyRef = (arr: any[]) =>
            (arr || []).some((m: any) => nameEq(m?.name) && /ref/i.test(String(m?.role || '')));
          if (!(anyRef(day?.team) || anyRef(day?.prelight) || anyRef(day?.pickup)))
            continue;
          
          // Separar días festivos de días normales
          if ((day?.tipo || '') === 'Rodaje Festivo') {
            holidayDays += 1;
          } else {
            workedDays += 1;
          }
          
          if ((day?.tipo || '') === 'Travel Day') travelDays += 1;
        } else {
          const list =
            wantedSuffix === 'P'
              ? day?.prelight
              : wantedSuffix === 'R'
              ? day?.pickup
              : day?.team;
          const inBlock = (list || []).some((m: any) => {
            if (!nameEq(m?.name)) return false;
            const mBase = String(m?.role || '').replace(/[PR]$/, '');
            return !m?.role || !wantedBase || mBase === wantedBase;
          });
          if (!inBlock) continue;
          
          // Separar días festivos de días normales
          if ((day?.tipo || '') === 'Rodaje Festivo') {
            holidayDays += 1;
          } else {
            workedDays += 1;
          }
          
          if (wantedSuffix === 'P') workedPre += 1;
          else if (wantedSuffix === 'R') workedPick += 1;
          else workedBase += 1;
          if ((day?.tipo || '') === 'Travel Day') travelDays += 1;
        }
      }
    }
    return { workedDays, travelDays, workedBase, workedPre, workedPick, holidayDays };
  }

  return (
    <div className='space-y-6'>
      {monthKeys.map((mk, i) => {
        const bucket = monthMap.get(mk)!;
        const weeks = bucket ? Array.from(bucket.weeks) : [];
        const isos = bucket ? Array.from(bucket.isos) : [];
        const isoSet = new Set(isos);
        const filterISO = (iso: string) => isoSet.has(iso);

        // Ventana contable (si está configurada en Condiciones)
        const params = getCondParamsSemanal(projectWithMode);
        const win = getOvertimeWindowForPayrollMonthSemanal(mk, params);

        // Si hay ventana contable, agregamos variables en esa ventana:
        let windowOverrideMap: Map<string, any> | null = null;
        if (win) {
          const filterWindowISO = (iso: string) => isoInRangeSemanal(iso, win.start, win.end);
          windowOverrideMap = aggregateWindowedReportSemanal(
            projectWithMode,
            weeks,
            filterWindowISO
          ) as Map<string, any>;
        }

        const baseRows = aggregateReportsSemanal(projectWithMode, weeks, filterISO);

        return (
          <MonthSection
            key={mk}
            monthKey={mk}
            rows={baseRows as any}
            weeksForMonth={weeks}
            filterISO={filterISO}
            rolePrices={rolePrices}
            projectMode="semanal"
            defaultOpen={i === 0}
            persistKeyBase={basePersist}
            onExport={exportMonth}
            onExportPDF={exportMonthPDF}
            windowOverrideMap={windowOverrideMap}
            project={projectWithMode}
            aggregateFilteredConcepts={aggregateFilteredConceptsSemanal}
            allWeeks={weeksWithPeople}
            buildRefuerzoIndex={buildRefuerzoIndex}
            stripPR={stripPR}
            calcWorkedBreakdown={calcWorkedBreakdown}
            monthLabelEs={monthLabelEs}
            ROLE_COLORS={ROLE_COLORS as any}
            roleLabelFromCode={roleLabelFromCode}
          />
        );
      })}
    </div>
  );
}
