import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '@shared/services/localStorage.service';
import MonthSection from '../components/MonthSection.jsx';
import { ROLE_COLORS, roleLabelFromCode } from '@shared/constants/roles';
import {
  makeRolePrices as makeRolePricesMensual,
  aggregateReports as aggregateReportsMensual,
  aggregateWindowedReport as aggregateWindowedReportMensual,
  getCondParams as getCondParamsMensual,
  getOvertimeWindowForPayrollMonth as getOvertimeWindowForPayrollMonthMensual,
  isoInRange as isoInRangeMensual,
  aggregateFilteredConcepts as aggregateFilteredConceptsMensual,
} from '../utils/calcMensual';
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

interface NominaMensualProps {
  project: ProjectLike;
}

export default function NominaMensual({ project }: NominaMensualProps) {
  const navigate = useNavigate();
  
  // Asegurar que el proyecto tenga el modo correcto para mensual
  const projectWithMode = {
    ...project,
    conditions: {
      ...project?.conditions,
      tipo: 'mensual'
    }
  };
  
  const { pre, pro } = usePlanWeeks(projectWithMode as any);
  const allWeeks = [...pre, ...pro];
  const baseId = project?.id || project?.nombre || 'tmp';

  // Verificar si hay equipo guardado
  const hasTeam = useMemo(() => {
    try {
      const teamKey = `team_${baseId}`;
      const teamData = storage.getJSON<any>(teamKey);
      if (teamData) {
        const base = Array.isArray(teamData.base) ? teamData.base : [];
        const reinforcements = Array.isArray(teamData.reinforcements) ? teamData.reinforcements : [];
        const prelight = Array.isArray(teamData.prelight) ? teamData.prelight : [];
        const pickup = Array.isArray(teamData.pickup) ? teamData.pickup : [];
        return base.length > 0 || reinforcements.length > 0 || prelight.length > 0 || pickup.length > 0;
      }
      return false;
    } catch {
      return false;
    }
  }, [baseId]);

  const hasWeeks = allWeeks.length > 0;
  const projectId = project?.id || project?.nombre;
  const planificacionPath = projectId ? `/project/${projectId}/planificacion` : '/projects';
  const equipoPath = projectId ? `/project/${projectId}/equipo` : '/projects';

  // Caso 1: Faltan ambas cosas (semanas Y equipo)
  if (!hasWeeks && !hasTeam) {
    return (
      <div className='flex flex-col items-center justify-center py-16 px-8 text-center'>
        <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
          Configura el proyecto
        </h2>
        <p className='text-xl max-w-2xl mb-4' style={{color: 'var(--text)', opacity: 0.8}}>
          Añade semanas en{' '}
          <button
            onClick={() => navigate(planificacionPath)}
            className='underline font-semibold hover:opacity-80 transition-opacity'
            style={{color: 'var(--brand)'}}
          >
            Planificación
          </button>
          {' '}y equipo en{' '}
          <button
            onClick={() => navigate(equipoPath)}
            className='underline font-semibold hover:opacity-80 transition-opacity'
            style={{color: 'var(--brand)'}}
          >
            Equipo
          </button>
          {' '}para calcular la nómina.
        </p>
      </div>
    );
  }

  // Caso 2: Solo faltan semanas (pero SÍ hay equipo)
  if (!hasWeeks) {
    return (
      <div className='flex flex-col items-center justify-center py-16 px-8 text-center'>
        <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
          No hay semanas en Planificación
        </h2>
        <p className='text-xl max-w-2xl mb-4' style={{color: 'var(--text)', opacity: 0.8}}>
          Añade semanas en{' '}
          <button
            onClick={() => navigate(planificacionPath)}
            className='underline font-semibold hover:opacity-80 transition-opacity'
            style={{color: 'var(--brand)'}}
          >
            Planificación
          </button>
          {' '}para que aparezcan aquí la nómina.
        </p>
      </div>
    );
  }

  const weeksWithPeople = allWeeks.filter(
    (w: any) => weekAllPeopleActive(w).length > 0
  );

  // Caso 3: Solo falta equipo (pero SÍ hay semanas)
  if (weeksWithPeople.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 px-8 text-center'>
        <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
          Falta añadir el equipo
        </h2>
        <p className='text-xl max-w-2xl mb-4' style={{color: 'var(--text)', opacity: 0.8}}>
          Rellena el equipo en{' '}
          <button
            onClick={() => navigate(equipoPath)}
            className='underline font-semibold hover:opacity-80 transition-opacity'
            style={{color: 'var(--brand)'}}
          >
            Equipo
          </button>
          {' '}para calcular la nómina.
        </p>
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

  // === Re-render cuando cambian Condiciones mensual ===
  const condKeys = [
    `cond_${baseId}_mensual`,
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

  // Precios por rol usando funciones específicas de mensual
  const rolePrices = React.useMemo(
    () => makeRolePricesMensual(projectWithMode),
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
    // Contadores por tipo de día
    let rodaje = 0;
    let travelDay = 0;
    let carga = 0;
    let descarga = 0;
    let localizar = 0;
    let rodajeFestivo = 0;

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

        // Verificar si la persona está trabajando en este día (en team, prelight o pickup)
        let isWorking = false;
        if (wantedRole === 'REF') {
          const anyRef = (arr: any[]) =>
            (arr || []).some((m: any) => nameEq(m?.name) && /ref/i.test(String(m?.role || '')));
          isWorking = anyRef(day?.team) || anyRef(day?.prelight) || anyRef(day?.pickup);
        } else {
          const list =
            wantedSuffix === 'P'
              ? day?.prelight
              : wantedSuffix === 'R'
              ? day?.pickup
              : day?.team;
          isWorking = (list || []).some((m: any) => {
            if (!nameEq(m?.name)) return false;
            const mBase = String(m?.role || '').replace(/[PR]$/, '');
            return !m?.role || !wantedBase || mBase === wantedBase;
          });
        }
        
        if (!isWorking) continue;
        
        // Contar por tipo de día según planificación
        const dayType = day?.tipo || '';
        if (dayType === 'Rodaje') {
          rodaje += 1;
          workedDays += 1;
        } else if (dayType === 'Travel Day') {
          travelDay += 1;
          travelDays += 1;
          // No contar en workedDays porque tiene su propia columna
        } else if (dayType === 'Carga') {
          carga += 1;
          workedDays += 1;
        } else if (dayType === 'Descarga') {
          descarga += 1;
          workedDays += 1;
        } else if (dayType === 'Localizar') {
          localizar += 1;
          workedDays += 1;
        } else if (dayType === 'Rodaje Festivo') {
          rodajeFestivo += 1;
          holidayDays += 1;
        }
        
        // Mantener compatibilidad con código existente
        if (wantedSuffix === 'P') workedPre += 1;
        else if (wantedSuffix === 'R') workedPick += 1;
        else workedBase += 1;
      }
    }
    return { 
      workedDays, 
      travelDays, 
      workedBase, 
      workedPre, 
      workedPick, 
      holidayDays,
      rodaje,
      travelDay,
      carga,
      descarga,
      localizar,
      rodajeFestivo
    };
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
        const params = getCondParamsMensual(projectWithMode);
        const win = getOvertimeWindowForPayrollMonthMensual(mk, params);

        // Si hay ventana contable, agregamos variables en esa ventana:
        let windowOverrideMap: Map<string, any> | null = null;
        if (win) {
          const filterWindowISO = (iso: string) => isoInRangeMensual(iso, win.start, win.end);
          windowOverrideMap = aggregateWindowedReportMensual(
            projectWithMode,
            weeks,
            filterWindowISO
          ) as Map<string, any>;
        }

        const baseRows = aggregateReportsMensual(projectWithMode, weeks, filterISO);

        return (
          <MonthSection
            key={mk}
            monthKey={mk}
            rows={baseRows as any}
            weeksForMonth={weeks}
            filterISO={filterISO}
            rolePrices={rolePrices}
            projectMode="mensual"
            defaultOpen={i === 0}
            persistKeyBase={basePersist}
            onExport={exportMonth}
            onExportPDF={exportMonthPDF}
            windowOverrideMap={windowOverrideMap}
            project={projectWithMode}
            aggregateFilteredConcepts={aggregateFilteredConceptsMensual}
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


