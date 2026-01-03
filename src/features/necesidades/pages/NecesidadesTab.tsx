import { Th } from '@shared/components';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import FieldRow from '../components/FieldRow';
import ListRow from '../components/ListRow';
import { exportToPDF, exportAllToPDF } from '../utils/export';
import { storage } from '@shared/services/localStorage.service';

type AnyRecord = Record<string, any>;

// DAYS will be created inside the component to use translations

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
  readOnly?: boolean;
};

export default function NecesidadesTab({ project, readOnly = false }: NecesidadesTabProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Helper function to translate week label
  const translateWeekLabel = (label: string): string => {
    if (!label) return '';
    // Match patterns like "Semana 1", "Semana -1", "Week 1", "Setmana 1", etc.
    const match = label.match(/^(Semana|Week|Setmana)\s*(-?\d+)$/i);
    if (match) {
      const number = match[2];
      if (number.startsWith('-')) {
        return t('planning.weekFormatNegative', { number: number.substring(1) });
      } else {
        return t('planning.weekFormat', { number });
      }
    }
    // If it doesn't match the pattern, return as is (might be custom label)
    return label;
  };
  
  // Create DAYS array with translations
  const DAYS = useMemo(() => [
    { idx: 0, key: 'mon', name: t('reports.dayNames.monday') },
    { idx: 1, key: 'tue', name: t('reports.dayNames.tuesday') },
    { idx: 2, key: 'wed', name: t('reports.dayNames.wednesday') },
    { idx: 3, key: 'thu', name: t('reports.dayNames.thursday') },
    { idx: 4, key: 'fri', name: t('reports.dayNames.friday') },
    { idx: 5, key: 'sat', name: t('reports.dayNames.saturday') },
    { idx: 6, key: 'sun', name: t('reports.dayNames.sunday') },
  ], [t]);
  
  // Add error boundary state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const planKey = useMemo(() => {
    try {
      const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'demo';
      return `plan_${base}`;
    } catch (error) {
      console.error('Error creating planKey:', error);
      return 'plan_demo';
    }
  }, [(project as AnyRecord)?.id, (project as AnyRecord)?.nombre]);

  const storageKey = useMemo(() => {
    try {
      const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'demo';
      return `needs_${base}`;
    } catch (error) {
      console.error('Error creating storageKey:', error);
      return 'needs_demo';
    }
  }, [(project as AnyRecord)?.id, (project as AnyRecord)?.nombre]);

  const [needs, setNeeds] = useLocalStorage(storageKey, {} as AnyRecord);
  const [isLoaded, setIsLoaded] = useState(false);

  const syncFromPlanRaw = React.useCallback((rawPlan: string | null) => {
    try {
      let plan: AnyRecord | null = null;
      try {
        plan = rawPlan ? JSON.parse(rawPlan) : null;
      } catch (parseError) {
        console.error('Error parsing plan data:', parseError);
        // Si hay error al parsear, limpiar todas las semanas
        setNeeds({});
        return;
      }

      // Si plan es null o no existe, limpiar todas las semanas
      if (!plan) {
        setNeeds({});
        return;
      }

      const pre = Array.isArray(plan?.pre) ? plan.pre : [];
      const pro = Array.isArray(plan?.pro) ? plan.pro : [];
      const all = [...pre, ...pro];
      
      // Si no hay semanas en Planificación, limpiar todas las semanas de needs
      if (!all.length) {
        setNeeds((prev: AnyRecord) => {
          // Si ya está vacío, no hacer nada
          if (Object.keys(prev).length === 0) return prev;
          // Limpiar todas las semanas
          return {};
        });
        return;
      }

      setNeeds((prev: AnyRecord) => {
        try {
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

          // Sincronizar equipo técnico desde planificación (siempre, incluso si está vacío o sin nombre)
            day.crewList = Array.isArray(planDay.team)
              ? (planDay.team as AnyRecord[])
                  .map(m => ({
                    role: (m?.role || '').toUpperCase(),
                    name: (m?.name || '').trim(),
                  }))
                .filter(m => m.role || m.name) // Incluir si tiene rol O nombre
              : [];
          
          // Sincronizar equipo prelight desde planificación (siempre, incluso si está vacío o sin nombre)
            day.preList = Array.isArray(planDay.prelight)
              ? (planDay.prelight as AnyRecord[])
                  .map(m => ({
                    role: (m?.role || '').toUpperCase(),
                    name: (m?.name || '').trim(),
                  }))
                .filter(m => m.role || m.name) // Incluir si tiene rol O nombre
              : [];
          
          // Sincronizar equipo recogida desde planificación (siempre, incluso si está vacío o sin nombre)
            day.pickList = Array.isArray(planDay.pickup)
              ? (planDay.pickup as AnyRecord[])
                  .map(m => ({
                    role: (m?.role || '').toUpperCase(),
                    name: (m?.name || '').trim(),
                  }))
                .filter(m => m.role || m.name) // Incluir si tiene rol O nombre
              : [];

          // Sincronizar localización desde planificación (siempre, incluso si está vacío)
          if (planDay.loc !== undefined) {
            day.loc = planDay.loc || '';
          } else {
            day.loc = day.loc || '';
          }
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
        } catch (error) {
          console.error('Error updating needs state:', error);
          return prev;
        }
      });
    } catch (error) {
      console.error('Error in syncFromPlanRaw:', error);
      setHasError(true);
      setErrorMessage(t('needs.errorSyncingPlanning'));
    }
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
              try {
                const v: unknown = (d as AnyRecord)[keyFromV1];
                if (Array.isArray(v) && v.length && typeof v[0] === 'string') {
                  return (v as string[]).map(name => ({ role: '', name }));
                }
                if (Array.isArray(v) && v.length && typeof v[0] === 'object') {
                  return v as AnyRecord[];
                }
                return Array.isArray(v) ? (v as AnyRecord[]) : [];
              } catch (error) {
                console.error('Error migrating list:', error);
                return [];
              }
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
    } catch (error) {
      console.error('Error migrating needs data:', error);
      setHasError(true);
      setErrorMessage(t('needs.errorMigratingData'));
    }
    setIsLoaded(true);
  }, [storageKey, setNeeds]);

  useEffect(() => {
    try {
      const obj = storage.getJSON<any>(planKey);
      const raw = obj ? JSON.stringify(obj, Object.keys(obj).sort()) : '';
      lastPlanRawRef.current = raw;
      syncFromPlanRaw(raw);
    } catch (error) {
      console.error('Error loading plan data:', error);
      setHasError(true);
      setErrorMessage(t('needs.errorLoadingPlanning'));
    }
  }, [planKey, syncFromPlanRaw]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === planKey) {
        try {
          const obj = storage.getJSON<any>(planKey);
          const raw = obj ? JSON.stringify(obj, Object.keys(obj).sort()) : '';
          lastPlanRawRef.current = raw;
          syncFromPlanRaw(raw);
        } catch (error) {
          console.error('Error handling storage event:', error);
        }
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
        if (!obj) {
          const raw = '';
          if (lastPlanRawRef.current !== raw) {
            lastPlanRawRef.current = raw;
            syncFromPlanRaw(raw);
          }
          return;
        }
        // Crear una versión normalizada del objeto para comparación (incluyendo personas sin nombre)
        const normalized = {
          pre: Array.isArray(obj.pre) ? obj.pre.map((w: AnyRecord) => ({
            id: w.id,
            label: w.label,
            startDate: w.startDate,
            days: Array.isArray(w.days) ? w.days.map((d: AnyRecord) => ({
              team: Array.isArray(d.team) ? d.team.map((m: AnyRecord) => ({
                role: m?.role || '',
                name: m?.name || '',
              })) : [],
              prelight: Array.isArray(d.prelight) ? d.prelight.map((m: AnyRecord) => ({
                role: m?.role || '',
                name: m?.name || '',
              })) : [],
              pickup: Array.isArray(d.pickup) ? d.pickup.map((m: AnyRecord) => ({
                role: m?.role || '',
                name: m?.name || '',
              })) : [],
              loc: d.loc || '',
            })) : [],
          })) : [],
          pro: Array.isArray(obj.pro) ? obj.pro.map((w: AnyRecord) => ({
            id: w.id,
            label: w.label,
            startDate: w.startDate,
            days: Array.isArray(w.days) ? w.days.map((d: AnyRecord) => ({
              team: Array.isArray(d.team) ? d.team.map((m: AnyRecord) => ({
                role: m?.role || '',
                name: m?.name || '',
              })) : [],
              prelight: Array.isArray(d.prelight) ? d.prelight.map((m: AnyRecord) => ({
                role: m?.role || '',
                name: m?.name || '',
              })) : [],
              pickup: Array.isArray(d.pickup) ? d.pickup.map((m: AnyRecord) => ({
                role: m?.role || '',
                name: m?.name || '',
              })) : [],
              loc: d.loc || '',
            })) : [],
          })) : [],
        };
        const raw = JSON.stringify(normalized);
        if (lastPlanRawRef.current !== raw) {
          lastPlanRawRef.current = raw;
          // Pasar el objeto original, no el normalizado
          syncFromPlanRaw(JSON.stringify(obj));
        }
      } catch {}
    };
    tick();
    // Reducir intervalo para sincronización más rápida
    const id = setInterval(tick, 300);
    return () => clearInterval(id);
  }, [planKey, syncFromPlanRaw]);

  const setCell = (weekId: string, dayIdx: number, fieldKey: string, value: unknown) => {
    if (readOnly) return;
    // Si se está cambiando localización, sincronizar con planificación
    if (fieldKey === 'loc') {
      try {
        const planData = storage.getJSON<any>(planKey);
        if (planData) {
          const allWeeks = [...(Array.isArray(planData.pre) ? planData.pre : []), ...(Array.isArray(planData.pro) ? planData.pro : [])];
          const week = allWeeks.find((w: AnyRecord) => w.id === weekId);
          if (week && week.days && week.days[dayIdx]) {
            // Actualizar en planificación
            week.days[dayIdx].loc = value;
            // Guardar de vuelta en localStorage
            storage.setJSON(planKey, planData);
          }
        }
      } catch (error) {
        console.error('Error syncing loc to planificación:', error);
      }
    }

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
    if (readOnly) return;
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
    try {
      const w: AnyRecord = needs[weekId];
      if (!w) {
        console.error('Week not found:', weekId);
        alert(t('needs.weekNotFound'));
        return;
      }
      const valuesByDay = Array.from({ length: 7 }).map((_, i) => (w.days as AnyRecord)?.[i] || {});
      console.log('🔍 Project object (PDF):', project);
      console.log('🔍 Project nombre (PDF):', project?.nombre);
      console.log('🔍 Project produccion (PDF):', project?.produccion);
      await exportToPDF(
        project,
        w.label || t('needs.week'),
        w.startDate || '',
        valuesByDay
      );
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert(t('needs.errorGeneratingPDF'));
    }
  };

  const setWeekOpen = (weekId: string, isOpen: boolean) => {
    if (readOnly) return;
    try {
      setNeeds((prev: AnyRecord) => {
        const w: AnyRecord = prev[weekId] || {};
        const next: AnyRecord = {
          ...prev,
          [weekId]: { ...w, open: isOpen },
        };
        return next;
      });
    } catch (error) {
      console.error('Error setting week open state:', error);
    }
  };

  const weekEntries = useMemo(() => {
    try {
      return Object.entries(needs as AnyRecord).sort(([, a], [, b]) => {
        const dateA = parseYYYYMMDD((a as AnyRecord).startDate);
        const dateB = parseYYYYMMDD((b as AnyRecord).startDate);
        return dateA.getTime() - dateB.getTime();
      });
    } catch (error) {
      console.error('Error sorting week entries:', error);
      return [];
    }
  }, [needs]);

  const btnExportCls = 'px-3 py-2 rounded-lg text-sm font-semibold';
  const btnExportStyle = {
    background: '#f59e0b',
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
      alert(t('needs.errorGeneratingPDF'));
    }
  };

  // Error boundary UI
  if (hasError) {
    return (
      <div className='space-y-4'>
        <div className='text-sm text-red-400 border border-red-800 rounded-xl p-4 bg-red-950/30'>
          <h3 className='font-semibold mb-2'>{t('needs.errorLoadingNeeds')}</h3>
          <p className='mb-3'>{errorMessage}</p>
          <button
            onClick={() => {
              setHasError(false);
              setErrorMessage('');
              // Try to reload the component
              window.location.reload();
            }}
            className='px-3 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-sm'
          >
            {t('needs.reloadPage')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {weekEntries.length > 0 && (
        <div className='flex items-center justify-end gap-2'>
          <button
            className={btnExportCls}
            style={btnExportStyle}
            onClick={exportAllNeedsPDF}
            title={t('needs.exportAllWeeksPDF')}
          >
            {t('needs.exportFullPDF')}
          </button>
        </div>
      )}

      {weekEntries.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-16 px-8 text-center'>
          <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
            {t('needs.noWeeksInPlanning')}
          </h2>
          <p className='text-xl max-w-2xl mb-4' style={{color: 'var(--text)', opacity: 0.8}}>
            {t('needs.createWeeksIn')}{' '}
            <button
              onClick={() => {
                if (readOnly) return;
                const projectId = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre;
                const planificacionPath = projectId ? `/project/${projectId}/planificacion` : '/projects';
                navigate(planificacionPath);
              }}
              disabled={readOnly}
              className={`underline font-semibold hover:opacity-80 transition-opacity ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{color: 'var(--brand)'}}
              title={readOnly ? t('conditions.projectClosed') : t('reports.goToPlanning')}
            >
              {t('needs.planning')}
            </button>
            {' '}{t('needs.toAppearHere')}
          </p>
        </div>
      ) : (
        weekEntries.map(([wid, wk]) => {
          try {
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
                    onClick={() => !readOnly && setWeekOpen(wid, !(wk as AnyRecord).open)}
                    disabled={readOnly}
                    className={`w-8 h-8 rounded-lg border border-neutral-border hover:border-[#F59E0B] ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={readOnly ? t('conditions.projectClosed') : ((wk as AnyRecord).open ? t('needs.close') : t('needs.open'))}
                  >
                    {(wk as AnyRecord).open ? '−' : '+'}
                  </button>
                  <div className='text-brand font-semibold'>
                    {translateWeekLabel((wk as AnyRecord).label || t('needs.week'))}
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    className={btnExportCls}
                    style={btnExportStyle}
                    onClick={() => exportWeekPDF(wid)}
                    title={t('needs.exportWeekPDF')}
                  >
                    {t('needs.pdf')}
                  </button>
                </div>
              </div>

              {(wk as AnyRecord).open && (
                <div className='overflow-x-auto px-5 pb-5'>
                  <table className='min-w-[1360px] w-full border-collapse text-sm'>
                    <thead>
                      <tr>
                        <Th>{t('needs.fieldDay')}</Th>
                        {DAYS.map((d, i) => (
                          <Th key={d.key} align='center' className='text-center'>
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
                        label={t('needs.location')}
                        setCell={setCell}
                        readOnly={readOnly}
                      />
                      <FieldRow
                        weekId={wid}
                        weekObj={wk}
                        fieldKey='seq'
                        label={t('needs.sequences')}
                        setCell={setCell}
                        readOnly={readOnly}
                      />
                      <ListRow
                        label={t('needs.technicalTeam')}
                        listKey='crewList'
                        notesKey='crewTxt'
                        weekId={wid}
                        weekObj={wk}
                        removeFromList={removeFromList}
                        setCell={setCell}
                        readOnly={readOnly}
                      />
                      <FieldRow
                        weekId={wid}
                        weekObj={wk}
                        fieldKey='needLoc'
                        label={t('needs.locationNeeds')}
                        setCell={setCell}
                        readOnly={readOnly}
                      />
                      <FieldRow
                        weekId={wid}
                        weekObj={wk}
                        fieldKey='needProd'
                        label={t('needs.productionNeeds')}
                        setCell={setCell}
                        readOnly={readOnly}
                      />
                      <FieldRow
                        weekId={wid}
                        weekObj={wk}
                        fieldKey='needLight'
                        label={t('needs.lightNeeds')}
                        setCell={setCell}
                        readOnly={readOnly}
                      />
                      <FieldRow
                        weekId={wid}
                        weekObj={wk}
                        fieldKey='extraMat'
                        label={t('needs.extraMaterial')}
                        setCell={setCell}
                        readOnly={readOnly}
                      />
                      <FieldRow
                        weekId={wid}
                        weekObj={wk}
                        fieldKey='precall'
                        label={t('needs.precall')}
                        setCell={setCell}
                        readOnly={readOnly}
                      />
                      <ListRow
                        label={t('needs.prelightTeam')}
                        listKey='preList'
                        notesKey='preTxt'
                        weekId={wid}
                        weekObj={wk}
                        context='prelight'
                        removeFromList={removeFromList}
                        setCell={setCell}
                        readOnly={readOnly}
                      />
                      <ListRow
                        label={t('needs.pickupTeam')}
                        listKey='pickList'
                        notesKey='pickTxt'
                        weekId={wid}
                        weekObj={wk}
                        context='pickup'
                        removeFromList={removeFromList}
                        setCell={setCell}
                        readOnly={readOnly}
                      />
                      <FieldRow
                        weekId={wid}
                        weekObj={wk}
                        fieldKey='obs'
                        label={t('needs.observations')}
                        setCell={setCell}
                        readOnly={readOnly}
                      />
                    </tbody>
                  </table>
                </div>
              )}
            </section>
            );
          } catch (error) {
            console.error(`Error rendering week ${wid}:`, error);
            return (
              <section key={wid} className='rounded-2xl border border-red-800 bg-red-950/30 p-4'>
                <div className='text-red-400 text-sm'>
                  {t('needs.errorLoadingWeek', { weekId: wid })}
                </div>
              </section>
            );
          }
        })
      )}
    </div>
  );
}


