import { useLocalStorage } from '@shared/hooks/useLocalStorage';
// import { elementOnScreenToPDF } from '@shared/lib/pdf/exporter';
import { parseYYYYMMDD, addDays } from '@shared/utils/date';
import React, { useEffect, useMemo, useState } from 'react';

import PlanScopeSection from '../components/PlanScopeSection';
import { relabelWeekByCalendar } from '../utils/calendar';
import { DAYS } from '../constants';
import { renderExportHTML } from '../utils/export';
import { extractHolidaySets } from '../utils/holidays';
import { sortByHierarchy, syncAllWeeks } from '../utils/sync';
import {
  addPreWeekAction,
  addProWeekAction,
  duplicateWeekAction,
  rebaseWeeksAround,
} from '../utils/weekActions';
import { storage } from '@shared/services/localStorage.service';

// Minimal types
type AnyRecord = Record<string, any>;

type TeamMember = { role: string; name: string };

type PlanificacionTabProps = {
  project?: AnyRecord;
  conditions?: AnyRecord;
  baseTeam?: TeamMember[];
  prelightTeam?: TeamMember[];
  pickupTeam?: TeamMember[];
  reinforcements?: TeamMember[];
  teamList?: TeamMember[];
};

export default function PlanificacionTab({
  project,
  conditions,
  baseTeam = [],
  prelightTeam = [],
  pickupTeam = [],
  reinforcements = [],
  teamList = [],
}: PlanificacionTabProps) {
  const openHtmlInNewTab = (title: string, innerHtml: string) => {
    const w = typeof window !== 'undefined' ? window.open('', '_blank') : null;
    if (!w) return;
    try {
      w.document.open();
      w.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>${title}</title></head><body>${innerHtml}</body></html>`);
      w.document.close();
    } catch {}
  };
  const storageKey = useMemo(() => {
    const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'demo';
    return `plan_${base}`;
  }, [(project as AnyRecord)?.id, (project as AnyRecord)?.nombre]);

  const { full: holidayFull, md: holidayMD } = useMemo(
    () => extractHolidaySets((conditions as AnyRecord) || {}),
    [JSON.stringify((conditions as AnyRecord) || {})]
  );

  const [isLoaded, setIsLoaded] = useState(false);

  // Persistencia de semanas usando useLocalStorage
  const [weeksData, setWeeksData] = useLocalStorage<{ pre: AnyRecord[]; pro: AnyRecord[] }>(storageKey, {
    pre: [],
    pro: [],
  });
  const [preWeeks, setPreWeeks] = useState<AnyRecord[]>(weeksData.pre || []);
  const [proWeeks, setProWeeks] = useState<AnyRecord[]>(weeksData.pro || []);
  // Estados de apertura usando useLocalStorage
  const [openPre, setOpenPre] = useLocalStorage<boolean>(
    `plan_open_pre_${storageKey}`,
    true
  );
  const [openPro, setOpenPro] = useLocalStorage<boolean>(
    `plan_open_pro_${storageKey}`,
    true
  );

  // Sincronizar semanas desde datos persistidos
  useEffect(() => {
    setPreWeeks(weeksData.pre || []);
    setProWeeks(weeksData.pro || []);
    setIsLoaded(true);
  }, [weeksData]);

  // Sincronizar cambios de semanas de vuelta a weeksData
  useEffect(() => {
    if (!isLoaded) return;
    setWeeksData({ pre: preWeeks, pro: proWeeks });
  }, [preWeeks, proWeeks, isLoaded, setWeeksData]);

  useEffect(() => {
    if (!isLoaded) return;

    const relabel = (weeks: AnyRecord[]) =>
      (weeks || []).map(w =>
        relabelWeekByCalendar(w, w.startDate, holidayFull, holidayMD)
      );

    setPreWeeks(prev => {
      const next = relabel(prev);
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
    });

    setProWeeks(prev => {
      const next = relabel(prev);
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
    });
  }, [isLoaded, holidayFull, holidayMD]);

  const { baseRoster, preRoster, pickRoster, refsRoster } = useMemo(() => {
    const fromProps = {
      base: Array.isArray(baseTeam) ? baseTeam : [],
      prelight: Array.isArray(prelightTeam) ? prelightTeam : [],
      pickup: Array.isArray(pickupTeam) ? pickupTeam : [],
      reinforcements: Array.isArray(reinforcements) ? reinforcements : [],
    };
    const hasProps =
      fromProps.base.length ||
      fromProps.prelight.length ||
      fromProps.pickup.length ||
      fromProps.reinforcements.length;

    if (hasProps) {
      return {
        baseRoster: fromProps.base,
        preRoster: fromProps.prelight,
        pickRoster: fromProps.pickup,
        refsRoster: fromProps.reinforcements,
      };
    }

    const keys: string[] = [];
    if ((project as AnyRecord)?.id || (project as AnyRecord)?.nombre) {
      const pid = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre;
      keys.push(`team_${pid}`);
      keys.push(`setlux_equipo_${pid}`);
    }
    keys.push('setlux_equipo_global_v2');

    let saved: AnyRecord | null = null;
    for (const k of keys) {
      try {
        const obj = storage.getJSON<AnyRecord>(k);
        if (obj) {
          saved = obj;
          break;
        }
      } catch {}
    }

    const src: AnyRecord = saved || {};
    return {
      baseRoster: Array.isArray(src.base) ? src.base : [],
      preRoster: Array.isArray(src.prelight) ? src.prelight : [],
      pickRoster: Array.isArray(src.pickup) ? src.pickup : [],
      refsRoster: Array.isArray(src.reinforcements) ? src.reinforcements : [],
    };
  }, [
    (project as AnyRecord)?.id,
    (project as AnyRecord)?.nombre,
    baseTeam,
    prelightTeam,
    pickupTeam,
    reinforcements,
  ]);

  const addPreWeek = () => {
    const next = addPreWeekAction(
      preWeeks as any,
      baseRoster,
      preRoster,
      pickRoster,
      holidayFull,
      holidayMD
    );
    // Asegura festivos aplicados inmediatamente
    setPreWeeks((next as AnyRecord[]).map(w => relabelWeekByCalendar(w, w.startDate, holidayFull, holidayMD)) as any);
  };

  const addProWeek = () => {
    const next = addProWeekAction(
      preWeeks as any,
      proWeeks as any,
      baseRoster,
      preRoster,
      pickRoster,
      holidayFull,
      holidayMD
    );
    // Asegura festivos aplicados inmediatamente
    setProWeeks((next as AnyRecord[]).map(w => relabelWeekByCalendar(w, w.startDate, holidayFull, holidayMD)) as any);
  };

  const duplicateWeek = (scope: 'pre' | 'pro', weekId: string) => {
    if (scope === 'pre') {
      const next = duplicateWeekAction(
        preWeeks as any,
        weekId,
        -1,
        (n: number) => `Semana -${n}`
      ).sort((a: AnyRecord, b: AnyRecord) => parseYYYYMMDD(a.startDate).getTime() - parseYYYYMMDD(b.startDate).getTime());
      setPreWeeks(next as any);
    } else {
      const next = duplicateWeekAction(proWeeks as any, weekId, 1, (n: number) => `Semana ${n}`);
      setProWeeks(next as any);
    }
  };

  const deleteWeek = (scope: 'pre' | 'pro', weekId: string) => {
    if (scope === 'pre') {
      setPreWeeks(prev => prev.filter((w: AnyRecord) => w.id !== weekId));
    } else {
      setProWeeks(prev => prev.filter((w: AnyRecord) => w.id !== weekId));
    }
  };

  const setWeekStart = (_scope: 'pre' | 'pro', weekId: string, newDateStr: string) => {
    const raw = parseYYYYMMDD(newDateStr);
    const toMon = (date: Date) => {
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      d.setDate(d.getDate() + diff);
      return d;
    };
    const monday = toMon(raw);

    const { pre, pro } = rebaseWeeksAround(
      preWeeks as any,
      proWeeks as any,
      weekId,
      monday,
      holidayFull,
      holidayMD
    );
    setPreWeeks(pre as any);
    setProWeeks(pro as any);
  };

  const setDayField = (
    scope: 'pre' | 'pro',
    weekId: string,
    dayIdx: number,
    patch: AnyRecord
  ) => {
    const apply = (list: AnyRecord[]) =>
      list.map(w => {
        if (w.id !== weekId) return w;
        const days = w.days.map((d: AnyRecord, i: number) => {
          if (i !== dayIdx) return d;
          const next: AnyRecord = { ...d, ...patch };
          const isShooting =
            patch.tipo &&
            [
              'Rodaje',
              'Travel Day',
              'Rodaje Festivo',
              'Carga',
              'Descarga',
              'Localizar',
            ].includes(patch.tipo);
          if (isShooting && (!d.team || d.team.length === 0)) {
            next.team = (baseRoster || []).map((m: AnyRecord) => ({
              role: m.role,
              name: m.name,
            }));
          }

          if (patch.tipo === 'Descanso') {
            next.team = [];
            next.prelight = [];
            next.pickup = [];
            next.start = '';
            next.end = '';
            next.cut = '';
            next.loc = 'DESCANSO';
            next.prelightStart = '';
            next.prelightEnd = '';
            next.pickupStart = '';
            next.pickupEnd = '';
          }
          return next;
        });
        return { ...w, days };
      });

    if (scope === 'pre') setPreWeeks(ws => apply(ws));
    else setProWeeks(ws => apply(ws));
  };


  const addMemberTo = (
    scope: 'pre' | 'pro',
    weekId: string,
    dayIdx: number,
    listKey: 'team' | 'prelight' | 'pickup',
    member: AnyRecord
  ) => {
    const apply = (list: AnyRecord[]) =>
      list.map(w => {
        if (w.id !== weekId) return w;
        const days = w.days.map((d: AnyRecord, i: number) => {
          if (i !== dayIdx) return d;
          const cur = Array.isArray(d[listKey]) ? d[listKey] : [];

          if (
            member.name &&
            cur.some((t: AnyRecord) => t.role === member.role && t.name === member.name)
          ) {
            return d;
          }

          let nextList = [
            ...cur,
            {
              role: member.role,
              name: member.name,
              source:
                member.source ||
                (listKey === 'prelight'
                  ? 'pre'
                  : listKey === 'pickup'
                    ? 'pick'
                    : 'base'),
            },
          ];

          if (listKey === 'prelight' || listKey === 'pickup') {
            nextList = sortByHierarchy(nextList);
          }

          return { ...d, [listKey]: nextList } as AnyRecord;
        });
        return { ...w, days };
      });
    if (scope === 'pre') setPreWeeks(ws => apply(ws));
    else setProWeeks(ws => apply(ws));
  };

  const removeMemberFrom = (
    scope: 'pre' | 'pro',
    weekId: string,
    dayIdx: number,
    listKey: 'team' | 'prelight' | 'pickup',
    idxInList: number
  ) => {
    const apply = (list: AnyRecord[]) =>
      list.map(w => {
        if (w.id !== weekId) return w;
        const days = w.days.map((d: AnyRecord, i: number) => {
          if (i !== dayIdx) return d;
          const cur = Array.isArray(d[listKey]) ? [...(d[listKey] as AnyRecord[])] : [];
          cur.splice(idxInList, 1);
          return { ...d, [listKey]: cur } as AnyRecord;
        });
        return { ...w, days };
      });
    if (scope === 'pre') setPreWeeks(ws => apply(ws));
    else setProWeeks(ws => apply(ws));
  };

  const rosterKey = useMemo(
    () => JSON.stringify({ baseRoster, preRoster, pickRoster, refsRoster }),
    [baseRoster, preRoster, pickRoster, refsRoster]
  );

  useEffect(() => {
    setPreWeeks(prev =>
      syncAllWeeks(prev, baseRoster, preRoster, pickRoster, refsRoster)
    );
    setProWeeks(prev =>
      syncAllWeeks(prev, baseRoster, preRoster, pickRoster, refsRoster)
    );
  }, [rosterKey]);

  const btnExportCls = 'px-3 py-2 rounded-lg text-sm font-semibold';
  const btnExportStyle: React.CSSProperties = {
    background: '#1D4ED8',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  const exportScope = async (scope: 'pre' | 'pro' | 'all') => {
    const weeks =
      scope === 'pre'
        ? preWeeks
        : scope === 'pro'
          ? proWeeks
          : [...preWeeks, ...proWeeks];
    const css = `.export-doc{font:14px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;} .export-doc h2{margin:12px 0 8px;font-size:18px} .export-doc .wk{break-after:page;page-break-after:always;} .export-doc .wk:last-child{break-after:auto;page-break-after:auto;} .export-doc table{width:100%;border-collapse:collapse} .export-doc th,.export-doc td{border:1px solid #222;padding:6px;vertical-align:top} .export-doc thead th{background:#eee}`;
    const body = `<style>${css}</style>` + renderExportHTML(
      ((project as AnyRecord)?.nombre || 'Proyecto') as string,
      weeks as any,
      [...DAYS] as any,
      parseYYYYMMDD,
      addDays
    );
    openHtmlInNewTab(`${((project as AnyRecord)?.nombre || 'Proyecto') as string} – Planificación`, body);
  };

  const exportWeek = async (week: AnyRecord) => {
    const css = `.export-doc{font:14px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;} .export-doc h2{margin:12px 0 8px;font-size:18px} .export-doc .wk{break-after:page;page-break-after:always;} .export-doc .wk:last-child{break-after:auto;page-break-after:auto;} .export-doc table{width:100%;border-collapse:collapse} .export-doc th,.export-doc td{border:1px solid #222;padding:6px;vertical-align:top} .export-doc thead th{background:#eee}`;
    const body = `<style>${css}</style>` + renderExportHTML(
      ((project as AnyRecord)?.nombre || 'Proyecto') as string,
      [week] as any,
      [...DAYS] as any,
      parseYYYYMMDD,
      addDays
    );
    openHtmlInNewTab(`${((project as AnyRecord)?.nombre || 'Proyecto') as string} – ${week.label}`, body);
  };

  return (
    <div id='print-root' className='space-y-6'>
      <div className='no-pdf flex items-center justify-end gap-2'>
        <button
          className={btnExportCls}
          style={btnExportStyle}
          onClick={() => exportScope('all')}
        >
          Exportar TODO
        </button>
      </div>

      <PlanScopeSection
        title='Preproducción'
        open={openPre}
        onToggle={() => setOpenPre(v => !v)}
        onAdd={addPreWeek}
        onExport={() => exportScope('pre')}
        btnExportCls={btnExportCls}
        btnExportStyle={btnExportStyle}
        scope='pre'
        weeks={preWeeks}
        duplicateWeek={duplicateWeek as any}
        deleteWeek={deleteWeek as any}
        setWeekStart={setWeekStart as any}
        setDayField={setDayField as any}
        addMemberTo={addMemberTo as any}
        removeMemberFrom={removeMemberFrom as any}
        teamList={teamList}
        baseTeam={baseRoster}
        prelightTeam={preRoster}
        pickupTeam={pickRoster}
        reinforcements={refsRoster}
        onExportWeek={exportWeek as any}
        emptyText='No hay semanas de preproducción. Pulsa “+ Semana” para añadir la Semana -1.'
        containerId='pre-block'
        weeksOnlyId='pre-weeks-only'
      />

      <PlanScopeSection
        title='Producción'
        open={openPro}
        onToggle={() => setOpenPro(v => !v)}
        onAdd={addProWeek}
        onExport={() => exportScope('pro')}
        btnExportCls={btnExportCls}
        btnExportStyle={btnExportStyle}
        scope='pro'
        weeks={proWeeks}
        duplicateWeek={duplicateWeek as any}
        deleteWeek={deleteWeek as any}
        setWeekStart={setWeekStart as any}
        setDayField={setDayField as any}
        addMemberTo={addMemberTo as any}
        removeMemberFrom={removeMemberFrom as any}
        teamList={teamList}
        baseTeam={baseRoster}
        prelightTeam={preRoster}
        pickupTeam={pickRoster}
        reinforcements={refsRoster}
        onExportWeek={exportWeek as any}
        emptyText='No hay semanas de producción. Pulsa “+ Semana” para añadir la Semana 1.'
        containerId='pro-block'
        weeksOnlyId='pro-weeks-only'
      />
    </div>
  );
}
