import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import React, { useMemo } from 'react';

import ReportesSemana from './ReportesSemana.tsx';

type AnyRecord = Record<string, any>;

type Project = { id?: string; nombre?: string };

type ReportesTabProps = { project?: Project };

function pad2(n: number) {
  return String(n).padStart(2, '0');
}
function parseYYYYMMDD(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function toISO(d: Date) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${y}-${m}-${dd}`;
}
function addDays(date: Date, days: number) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

/** Carga semanas guardadas por Planificación: { pre: Week[], pro: Week[] } */
function usePlanWeeks(project?: Project) {
  const storageKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'demo';
    return `plan_${base}`;
  }, [project?.id, project?.nombre]);

  const [planData] = useLocalStorage<{ pre: AnyRecord[]; pro: AnyRecord[] }>(storageKey, { pre: [], pro: [] });

  return useMemo(() => {
    return {
      pre: Array.isArray(planData.pre) ? planData.pre : [],
      pro: Array.isArray(planData.pro) ? planData.pro : [],
    };
  }, [planData]);
}

/** Convierte una semana de planificación a array de 7 días ISO */
function weekToSemanasISO(week: AnyRecord) {
  const start = parseYYYYMMDD(week.startDate as string);
  return Array.from({ length: 7 }, (_, i) => toISO(addDays(start, i)));
}

/** Unión de personas de los 7 días (usa el mismo shape que ReportesSemana entiende) */
function weekToPersonas(week: AnyRecord) {
  const seen = new Set<string>();
  const out: AnyRecord[] = [];
  const SOURCES = [
    { key: 'team', suffix: '' },
    { key: 'prelight', suffix: 'P' },
    { key: 'pickup', suffix: 'R' },
  ];
  for (const day of (week.days || []) as AnyRecord[]) {
    for (const { key, suffix } of SOURCES) {
      for (const m of (day[key] as AnyRecord[]) || []) {
        const baseRole = m.role || '';
        const role = baseRole ? `${baseRole}${suffix}` : '';
        const name = m.name || '';
        const id = `${role}__${name}`;
        if (!seen.has(id) && (role || name)) {
          seen.add(id);
          out.push({ id, cargo: role, nombre: name });
        }
      }
    }
  }
  return out;
}

export default function ReportesTab({ project }: ReportesTabProps) {
  const { pre, pro } = usePlanWeeks(project);
  const allWeeks = [...pre, ...pro];
  const baseId = project?.id || project?.nombre || 'tmp';
  const condKeys = [
    `cond_${baseId}_semanal`,
    `cond_${baseId}_mensual`,
    `cond_${baseId}_publicidad`,
  ];

  // Usar useLocalStorage para cada clave de condiciones y crear un stamp
  const [condSemanal] = useLocalStorage<any>(condKeys[0] || '', {});
  const [condMensual] = useLocalStorage<any>(condKeys[1] || '', {});
  const [condPublicidad] = useLocalStorage<any>(condKeys[2] || '', {});

  const condStamp = useMemo(() => {
    return [condSemanal, condMensual, condPublicidad]
      .map(data => JSON.stringify(data))
      .join('|');
  }, [condSemanal, condMensual, condPublicidad]);

  if (allWeeks.length === 0) {
    return (
      <div className='text-sm text-zinc-400 border border-dashed border-neutral-border rounded-xl p-4 bg-neutral-surface'>
        No hay semanas en Planificación. Añade semanas allí para que aparezcan
        aquí los reportes.
      </div>
    );
  }

  const weeksWithPeople = allWeeks.filter(w => weekToPersonas(w).length > 0);

  if (weeksWithPeople.length === 0) {
    return (
      <div className='text-sm text-zinc-400 border border-dashed border-neutral-border rounded-xl p-4 bg-neutral-surface'>
        Falta añadir el equipo. Por favor, rellena en la pestaña <b>Equipo</b>{' '}
        el equipo base del proyecto para poder generar los reportes.
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {weeksWithPeople.map(week => (
        <ReportesSemana
          key={week.id as string}
          project={project as AnyRecord}
          title={week.label as string}
          semana={weekToSemanasISO(week)}
          personas={weekToPersonas(week)}
          planTimesByDate={(iso: string) => {
            const idx = weekToSemanasISO(week).indexOf(iso);
            if (idx >= 0) {
              const d = (week.days as AnyRecord[])[idx];
              return { inicio: d.start || '', fin: d.end || '' };
            }
            return null;
          }}
        />
      ))}
    </div>
  );
}
