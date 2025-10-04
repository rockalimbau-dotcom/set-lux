import { Th } from '@shared/components';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import FieldRow from '../components/FieldRow';
import ListRow from '../components/ListRow';
import { exportToPDF, exportAllToPDF } from '../utils/export';
import { storage } from '@shared/services/localStorage.service';

type AnyRecord = Record<string, any>;

const DAYS = [
  { idx: 0, key: 'mon', name: 'Lunes' },
  { idx: 1, key: 'tue', name: 'Martes' },
  { idx: 2, key: 'wed', name: 'Miércoles' },
  { idx: 3, key: 'thu', name: 'Jueves' },
  { idx: 4, key: 'fri', name: 'Viernes' },
  { idx: 5, key: 'sat', name: 'Sábado' },
  { idx: 6, key: 'sun', name: 'Domingo' },
];

const pad2 = (n: number) => String(n).padStart(2, '0');
const parseYYYYMMDD = (s: string) => {
  const [y, m, d] = (s || '').split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
};
const addDays = (date: Date, days: number) => {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
};
const formatDDMM = (date: Date) => `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;

type NecesidadesTabProps = {
  project?: AnyRecord;
};

export default function NecesidadesTab({ project }: NecesidadesTabProps) {
  const planKey = useMemo(() => {
    const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'demo';
    return `plan_${base}`;
  }, [(project as AnyRecord)?.id, (project as AnyRecord)?.nombre]);

  const storageKey = useMemo(() => {
    const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'demo';
    return `needs_${base}`;
  }, [(project as AnyRecord)?.id, (project as AnyRecord)?.nombre]);

  const [needs, setNeeds] = useLocalStorage(storageKey, {} as AnyRecord);
  const [isLoaded, setIsLoaded] = useState(false);

  const syncFromPlanRaw = React.useCallback((rawPlan: string | null) => {
    let plan: AnyRecord | null = null;
    try {
      plan = rawPlan ? JSON.parse(rawPlan) : null;
    } catch {}

    const pre = Array.isArray(plan?.pre) ? plan!.pre : [];
    const pro = Array.isArray(plan?.pro) ? plan!.pro : [];
    const all = [...pre, ...pro];
    if (!all.length) return;

    setNeeds((prev: AnyRecord) => {
      const next: AnyRecord = { ...prev };

      const byMondayPrev = new Map<string, { wid: string; wk: AnyRecord }>();
      for (const [wid, wk] of Object.entries(prev)) {
        const week = wk as AnyRecord;
        if (week?.startDate) byMondayPrev.set(week.startDate as string, { wid, wk: week });
      }

      for (const w of all as AnyRecord[]) {
        const monday = w.startDate as string;

        if (!next[w.id as string]) {
          const prevByMon = byMondayPrev.get(monday);
          if (prevByMon && !next[w.id as string]) {
            const cloned = { ...(prevByMon.wk as AnyRecord) };
            delete next[prevByMon.wid];
            next[w.id as string] = { ...cloned, label: w.label, startDate: w.startDate };
          } else {
            next[w.id as string] = {
              label: w.label,
              startDate: w.startDate,
              open: true,
              days: {},
            };
          }
        } else {
          next[w.id as string] = {
            ...(next[w.id as string] as AnyRecord),
            label: w.label,
            startDate: w.startDate,
            days: (next[w.id as string] as AnyRecord).days || {},
          } as AnyRecord;
        }

        for (let i = 0; i < 7; i++) {
          const day: AnyRecord = (next[w.id as string].days?.[i] as AnyRecord) || {};
          const planDay: AnyRecord = (w.days && (w.days as AnyRecord[])[i]) || {};

          if (!Array.isArray(day.crewList) || day.crewList.length === 0) {
            day.crewList = Array.isArray(planDay.team)
              ? (planDay.team as AnyRecord[])
                  .map(m => ({
                    role: (m?.role || '').toUpperCase(),
                    name: (m?.name || '').trim(),
                  }))
                  .filter(m => m.name)
              : [];
          }
          if (!Array.isArray(day.preList) || day.preList.length === 0) {
            day.preList = Array.isArray(planDay.prelight)
              ? (planDay.prelight as AnyRecord[])
                  .map(m => ({
                    role: (m?.role || '').toUpperCase(),
                    name: (m?.name || '').trim(),
                  }))
                  .filter(m => m.name)
              : [];
          }
          if (!Array.isArray(day.pickList) || day.pickList.length === 0) {
            day.pickList = Array.isArray(planDay.pickup)
              ? (planDay.pickup as AnyRecord[])
                  .map(m => ({
                    role: (m?.role || '').toUpperCase(),
                    name: (m?.name || '').trim(),
                  }))
                  .filter(m => m.name)
              : [];
          }

          day.loc = day.loc || '';
          day.seq = day.seq || '';
          day.needLoc = day.needLoc || '';
          day.needProd = day.needProd || '';
          day.needLight = day.needLight || '';
          day.extraMat = day.extraMat || '';
          day.precall = day.precall || '';
          day.obs = day.obs || '';
          day.crewTxt = day.crewTxt || '';
          day.preTxt = day.preTxt || '';
          day.pickTxt = day.pickTxt || '';

          (next[w.id as string].days as AnyRecord)[i] = day;
        }

        if (typeof (next[w.id as string] as AnyRecord).open === 'undefined') {
          try {
            let rawOpen: string | null = null;
            (next[w.id as string] as AnyRecord).open = rawOpen != null ? JSON.parse(rawOpen) === true : true;
          } catch {
            (next[w.id as string] as AnyRecord).open = true;
          }
        }
      }

      const validIds = new Set((all as AnyRecord[]).map(w => w.id as string));
      for (const wid of Object.keys(next)) {
        if (!validIds.has(wid)) delete next[wid];
      }
      return next;
    });
  }, [setNeeds]);

  useEffect(() => {
    try {
      const raw = JSON.stringify(needs);
      if (raw) {
        const parsed: AnyRecord = JSON.parse(raw) || {};
        for (const wk of Object.values(parsed)) {
          const week = wk as AnyRecord;
          if (!week?.days) continue;
          for (let i = 0; i < 7; i++) {
            const d = (week.days as AnyRecord[])[i];
            if (!d) continue;
            const migrateList = (arr: unknown, keyFromV1: string) => {
              const v: unknown = (d as AnyRecord)[keyFromV1];
              if (Array.isArray(v) && v.length && typeof v[0] === 'string') {
                return (v as string[]).map(name => ({ role: '', name }));
              }
              if (Array.isArray(v) && v.length && typeof v[0] === 'object') {
                return v as AnyRecord[];
              }
              return Array.isArray(v) ? (v as AnyRecord[]) : [];
            };
            (d as AnyRecord).crewList = migrateList((d as AnyRecord).crewNames, 'crewNames') || (d as AnyRecord).crewList || [];
            (d as AnyRecord).preList = migrateList((d as AnyRecord).preNames, 'preNames') || (d as AnyRecord).preList || [];
            (d as AnyRecord).pickList = migrateList((d as AnyRecord).pickNames, 'pickNames') || (d as AnyRecord).pickList || [];
            delete (d as AnyRecord).crewNames;
            delete (d as AnyRecord).preNames;
            delete (d as AnyRecord).pickNames;
          }
        }
        setNeeds(parsed);
      }
    } catch {}
    setIsLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    try {
      const obj = storage.getJSON<any>(planKey);
      syncFromPlanRaw(obj ? JSON.stringify(obj) : null);
    } catch {}
  }, [planKey, syncFromPlanRaw]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === planKey) {
        try {
          const obj = storage.getJSON<any>(planKey);
          syncFromPlanRaw(obj ? JSON.stringify(obj) : null);
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [planKey, syncFromPlanRaw]);

  const lastPlanRawRef = useRef<string | null>(null);
  useEffect(() => {
    const tick = () => {
      try {
        const obj = storage.getJSON<any>(planKey);
        const raw = obj ? JSON.stringify(obj) : '';
        if (lastPlanRawRef.current !== raw) {
          lastPlanRawRef.current = raw;
          syncFromPlanRaw(raw);
        }
      } catch {}
    };
    tick();
    const id = setInterval(tick, 800);
    return () => clearInterval(id);
  }, [planKey, syncFromPlanRaw]);

  const setCell = (weekId: string, dayIdx: number, fieldKey: string, value: unknown) => {
    setNeeds((prev: AnyRecord) => {
      const w: AnyRecord = prev[weekId] || { days: {} };
      const day: AnyRecord = (w.days && w.days[dayIdx]) || {};
      const next: AnyRecord = {
        ...prev,
        [weekId]: {
          ...w,
          days: { ...w.days, [dayIdx]: { ...day, [fieldKey]: value } },
        },
      };
      return next;
    });
  };

  const removeFromList = (weekId: string, dayIdx: number, listKey: string, idx: number) => {
    setNeeds((prev: AnyRecord) => {
      const w: AnyRecord = prev[weekId];
      if (!w) return prev;
      const day: AnyRecord = { ...(w.days?.[dayIdx] || {}) };
      const list = Array.isArray(day[listKey]) ? [...(day[listKey] as AnyRecord[])] : [];
      list.splice(idx, 1);
      day[listKey] = list;
      const next: AnyRecord = {
        ...prev,
        [weekId]: {
          ...w,
          days: { ...w.days, [dayIdx]: day },
        },
      };
      return next;
    });
  };


  const exportWeekPDF = async (weekId: string) => {
    const w: AnyRecord = needs[weekId];
    if (!w) return;
    const valuesByDay = Array.from({ length: 7 }).map((_, i) => (w.days as AnyRecord)?.[i] || {});
    console.log('🔍 Project object (PDF):', project);
    console.log('🔍 Project nombre (PDF):', project?.nombre);
    console.log('🔍 Project produccion (PDF):', project?.produccion);
    try {
      await exportToPDF(
        project,
        w.label || 'Semana',
        w.startDate || '',
        valuesByDay
      );
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
  };

  const setWeekOpen = (weekId: string, isOpen: boolean) => {
    setNeeds((prev: AnyRecord) => {
      const w: AnyRecord = prev[weekId] || {};
      const next: AnyRecord = {
        ...prev,
        [weekId]: { ...w, open: isOpen },
      };
      return next;
    });
  };

  const weekEntries = useMemo(() => {
    return Object.entries(needs as AnyRecord).sort(([, a], [, b]) => {
      return parseYYYYMMDD((a as AnyRecord).startDate) as any - (parseYYYYMMDD((b as AnyRecord).startDate) as any);
    });
  }, [needs]);

  const btnExportCls = 'px-3 py-2 rounded-lg text-sm font-semibold';
  const btnExportStyle = {
    background: '#1D4ED8',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  } as React.CSSProperties;


  const exportAllNeedsPDF = async () => {
    try {
      await exportAllToPDF(
        project,
        weekEntries,
        needs
      );
    } catch (error) {
      console.error('Error exporting all needs PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <div className='space-y-4'>
      {weekEntries.length > 0 && (
        <div className='flex items-center justify-end gap-2'>
          <button
            className={btnExportCls}
            style={{...btnExportStyle, background: '#f97316'}}
            onClick={exportAllNeedsPDF}
            title='Exportar todas las semanas (PDF)'
          >
            PDF Entero
          </button>
        </div>
      )}

      {weekEntries.length === 0 ? (
        <div className='text-sm text-zinc-400 border border-dashed border-neutral-border rounded-xl p-4 bg-neutral-surface'>
          No hay semanas en Planificación. Crea semanas allí para que aparezcan
          aquí.
        </div>
      ) : (
        weekEntries.map(([wid, wk]) => {
          const monday = parseYYYYMMDD((wk as AnyRecord).startDate);
          const datesRow = useMemo(() => DAYS.map((_, i) => formatDDMM(addDays(monday, i))), [monday]);
          return (
            <section
              key={wid}
              className='rounded-2xl border border-neutral-border bg-neutral-panel/90'
            >
              <div className='flex items-center justify-between gap-3 px-5 py-4'>
                <div className='flex items-center gap-3'>
                  <button
                    onClick={() => setWeekOpen(wid, !(wk as AnyRecord).open)}
                    className='w-8 h-8 rounded-lg border border-neutral-border hover:border-[#F59E0B]'
                    title={(wk as AnyRecord).open ? 'Cerrar' : 'Abrir'}
                  >
                    {(wk as AnyRecord).open ? '−' : '+'}
                  </button>
                  <div className='text-brand font-semibold'>
                    {(wk as AnyRecord).label || 'Semana'}
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    className={btnExportCls}
                    style={{...btnExportStyle, background: '#f97316'}}
                    onClick={() => exportWeekPDF(wid)}
                    title='Exportar semana PDF'
                  >
                    PDF
                  </button>
                </div>
              </div>

              {(wk as AnyRecord).open && (
                <div className='overflow-x-auto px-5 pb-5'>
                  <table className='min-w-[1360px] w-full border-collapse text-sm'>
                    <thead>
                      <tr>
                        <Th>Campo / Día</Th>
                        {DAYS.map((d, i) => (
                          <Th key={d.key}>
                            <div>{d.name}</div>
                            <div className='text-[11px] text-zinc-400'>
                              {datesRow[i]}
                            </div>
                          </Th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <FieldRow
                        weekId={wid}
                        weekObj={wk}
                        fieldKey='loc'
                        label='Localización'
                        setCell={setCell}
                      />
                      <FieldRow
                        weekId={wid}
                        weekObj={wk}
                        fieldKey='seq'
                        label='Secuencias'
                        setCell={setCell}
                      />
                      <ListRow
                        label='Equipo técnico'
                        listKey='crewList'
                        notesKey='crewTxt'
                        weekId={wid}
                        weekObj={wk}
                        removeFromList={removeFromList}
                        setCell={setCell}
                      />
                      <FieldRow
                        weekId={wid}
                        weekObj={wk}
                        fieldKey='needLoc'
                        label='Necesidades localizaciones'
                        setCell={setCell}
                      />
                      <FieldRow
                        weekId={wid}
                        weekObj={wk}
                        fieldKey='needProd'
                        label='Necesidades producción'
                        setCell={setCell}
                      />
                      <FieldRow
                        weekId={wid}
                        weekObj={wk}
                        fieldKey='needLight'
                        label='Necesidades luz'
                        setCell={setCell}
                      />
                      <FieldRow
                        weekId={wid}
                        weekObj={wk}
                        fieldKey='extraMat'
                        label='Material extra'
                        setCell={setCell}
                      />
                      <FieldRow
                        weekId={wid}
                        weekObj={wk}
                        fieldKey='precall'
                        label='Precall'
                        setCell={setCell}
                      />
                      <ListRow
                        label='Equipo Prelight'
                        listKey='preList'
                        notesKey='preTxt'
                        weekId={wid}
                        weekObj={wk}
                        context='prelight'
                        removeFromList={removeFromList}
                        setCell={setCell}
                      />
                      <ListRow
                        label='Equipo Recogida'
                        listKey='pickList'
                        notesKey='pickTxt'
                        weekId={wid}
                        weekObj={wk}
                        context='pickup'
                        removeFromList={removeFromList}
                        setCell={setCell}
                      />
                      <FieldRow
                        weekId={wid}
                        weekObj={wk}
                        fieldKey='obs'
                        label='Observaciones'
                        setCell={setCell}
                      />
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}


