// src/views/nominas/NominaMensual.jsx
import { Th, Td } from '@shared/components';
import { ROLE_COLORS, roleLabelFromCode } from '@shared/constants/roles';
import React from 'react';

import MonthSection from '../components/MonthSection.jsx';
import {
  makeRolePrices,
  aggregateReports,
  aggregateWindowedReport,
  getCondParams,
  getOvertimeWindowForPayrollMonth,
  isoInRange,
} from '../utils/calc.js';
import {
  pad2,
  toISO,
  parseYYYYMMDD,
  addDays,
  monthKeyFromISO,
  monthLabelEs,
} from '../utils/date.js';
import { buildNominaMonthHTML, openPrintWindow } from '../utils/export.js';
import {
  usePlanWeeks,
  stripPR,
  buildRefuerzoIndex,
  weekISOdays,
  weekAllPeopleActive,
} from '../utils/plan.js';

// número robusto
function num(v) {
  if (v == null || v === '') return 0;
  const s = String(v)
    .trim()
    .replace(/\u00A0/g, '')
    .replace(/[€%]/g, '')
    .replace(/\s+/g, '');
  const t =
    s.includes(',') && s.includes('.')
      ? s.replace(/\./g, '').replace(',', '.')
      : s.replace(',', '.');
  const n = Number(t);
  return isFinite(n) ? n : 0;
}

// makeRolePrices extraído a ../utils/calc

/* fecha utils importadas desde ../utils/date */

/* helpers de cierre contable extraídos a ../utils/calc */

/* aggregateWindowedReport extraído a ../utils/calc */

/* ===== Personas / plan ===== */
const personaKey = p =>
  `${p.role || p.cargo || ''}__${p.name || p.nombre || ''}`;
const personaRole = p => p.role || p.cargo || '';
const personaName = p => p.name || p.nombre || '';

/* usePlanWeeks extraído a ../utils/plan */

/* stripPR, isMemberRefuerzo, buildRefuerzoIndex extraídos a ../utils/plan */

/* weekISOdays extraído a ../utils/plan */
function weekAllPeople(week) {
  const seen = new Set();
  const pushUnique = (role, name) => {
    if (!role && !name) return;
    const id = `${role}__${name}`;
    if (!seen.has(id)) {
      seen.add(id);
      out.push({ role, name });
    }
  };
  const out = [];
  for (const d of week.days || []) {
    // Base (sin sufijo)
    for (const m of d.team || []) pushUnique(m.role || '', m.name || '');
    // Prelight (sufijo P)
    for (const m of d.prelight || [])
      pushUnique(`${m.role || ''}P`, m.name || '');
    // Recogida (sufijo R)
    for (const m of d.pickup || [])
      pushUnique(`${m.role || ''}R`, m.name || '');
  }
  return out;
}

/* ===== Activación de prelight/recogida por semana ===== */
function isWeekPrelightActive(week) {
  return (week?.days || []).some(
    d =>
      d?.tipo !== 'Descanso' &&
      ((Array.isArray(d?.prelight) && d.prelight.length > 0) ||
        d?.prelightStart ||
        d?.prelightEnd)
  );
}

function isWeekPickupActive(week) {
  return (week?.days || []).some(
    d =>
      d?.tipo !== 'Descanso' &&
      ((Array.isArray(d?.pickup) && d.pickup.length > 0) ||
        d?.pickupStart ||
        d?.pickupEnd)
  );
}

/* Une personas de la semana:
   - Base (sin sufijo) SIEMPRE
   - Prelight (*P) SOLO si la semana tiene prelight activo
   - Recogida (*R) SOLO si la semana tiene recogida activa */

/* parse utils importadas desde ../utils/parse */

/* month helpers importadas desde ../utils/date */

/* ===== Agregados de Reportes (por mes) ===== */
// "Horas extra" = Extras + TA + Nocturnidad(SI=1) + Penalty lunch(SI=1)
// function aggregateReports(project, weeks, filterISO = null) {
//   const base = project?.id || project?.nombre || 'tmp';
//   const totals = new Map();
//
//   // Índice de personas que son Refuerzo en estas semanas
//   const refuerzoSet = buildRefuerzoIndex(weeks);
//
//   // Clave de storage compatible con ReportesSemana:
//   //  - si es refuerzo: "REF__Nombre"
//   //  - si no: "RolSinPR__Nombre"
//   const storageKeyFor = (roleCode, name) => {
//     const base = stripPR(roleCode || '');
//     const keyNoPR = `${base}__${name || ''}`;
//     if (refuerzoSet.has(keyNoPR)) return `REF__${name || ''}`; // REF unificado
//     const suffix = /[PR]$/.test(roleCode || '') ? roleCode.slice(-1) : '';
//     const roleForKey = suffix ? `${base}${suffix}` : base; // GP/GR separados
//     return `${roleForKey}__${name || ''}`;
//   };
//
//   // "Persona visible" (rol en nómina) -> usamos el mismo roleForKey
//   const visibleRoleFor = (roleCode, name) => {
//     const base = stripPR(roleCode || '');
//     const keyNoPR = `${base}__${name || ''}`;
//     if (refuerzoSet.has(keyNoPR)) return 'REF'; // unifica refuerzo
//     const suffix = /[PR]$/.test(roleCode || '') ? roleCode.slice(-1) : '';
//     return suffix ? `${base}${suffix}` : base; // muestra GP/GR
//   };
//
//   const ensure = (role, name) => {
//     const k = `${role}__${name}`;
//     if (!totals.has(k)) {
//       totals.set(k, {
//         role,
//         name,
//         extras: 0,
//         transporte: 0,
//         km: 0,
//         dietasCount: new Map(),
//         ticketTotal: 0,
//       });
//     }
//     return totals.get(k);
//   };
//
//   for (const w of weeks) {
//     const isoDaysFull = weekISOdays(w);
//     const isoDays = filterISO ? isoDaysFull.filter(filterISO) : isoDaysFull;
//     if (isoDays.length === 0) continue;
//
//     // Leemos SIEMPRE el storage con la semana completa (tal como guarda Reportes)
//     const weekKey = `reportes_${base}_${isoDaysFull.join('_')}`;
//     let data = {};
//     try {
//       const raw = localStorage.getItem(weekKey);
//       if (raw) data = JSON.parse(raw) || {};
//     } catch {}
//
//     // De la semana sacamos TODA la gente activa (base + *P + *R)
//     const rawPeople = weekAllPeopleActive(w);
//
//     // ⚠️ Muy importante: convertir a un set de claves de STORAGE únicas
//     // para NO duplicar sumas si alguien sale en base y también en pre/recogida.
//     const uniqStorageKeys = new Map(); // storageKey -> {roleVisible,name}
//     for (const p of rawPeople) {
//       const r = p.role || '';
//       const n = p.name || '';
//       const storageKey = storageKeyFor(r, n);
//       if (!uniqStorageKeys.has(storageKey)) {
//         uniqStorageKeys.set(storageKey, {
//           roleVisible: visibleRoleFor(r, n),
//           name: n,
//         });
//       }
//     }
//
//     // Columnas en storage
//     const cols = {
//       extras: 'Horas extra',
//       ta: 'Turn Around',
//       noct: 'Nocturnidad',
//       dietas: 'Dietas',
//       km: 'Kilometraje',
//       transp: 'Transporte',
//       penalty: 'Penalty lunch',
//     };
//
//     // Sumar UNA sola vez por storageKey
//     for (const [pk, info] of uniqStorageKeys) {
//       const slot = ensure(info.roleVisible, info.name);
//
//       for (const iso of isoDays) {
//         // Extras + TA
//         const he = parseNum(data?.[pk]?.[cols.extras]?.[iso]);
//         const ta = parseNum(data?.[pk]?.[cols.ta]?.[iso]);
//         slot.extras += he + ta;
//
//         // Nocturnidad (SI = +1)
//         const nVal = data?.[pk]?.[cols.noct]?.[iso];
//         if (String(nVal || '').toUpperCase() === 'SI') slot.extras += 1;
//
//         // Penalty lunch (SI = +1)
//         const pVal = data?.[pk]?.[cols.penalty]?.[iso];
//         if (String(pVal || '').toUpperCase() === 'SI') slot.extras += 1;
//
//         // Transporte (SI = +1)
//         const tVal = data?.[pk]?.[cols.transp]?.[iso];
//         if (String(tVal || '').toUpperCase() === 'SI') slot.transporte += 1;
//
//         // Km
//         slot.km += parseNum(data?.[pk]?.[cols.km]?.[iso]);
//
//         // Dietas
//         const dVal = data?.[pk]?.[cols.dietas]?.[iso] || '';
//         const { labels, ticket } = parseDietasValue(dVal);
//         slot.ticketTotal += ticket;
//         for (const lab of labels) {
//           const prev = slot.dietasCount.get(lab) || 0;
//           slot.dietasCount.set(lab, prev + 1);
//         }
//       }
//     }
//   }
//
//   const order = { G: 0, BB: 1, E: 2, TM: 3, FB: 4, AUX: 5, M: 6, REF: 7 };
//   return Array.from(totals.values()).sort(
//     (a, b) =>
//       (order[a.role] ?? 99) - (order[b.role] ?? 99) ||
//       a.name.localeCompare(b.name, 'es')
//   );
// }

/* ===== Días trabajados / Travel Day ===== */
function calcWorkedBreakdown(weeks, filterISO, person) {
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

  const nameEq = s =>
    String(s || '')
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toLowerCase() === wantedNameNorm;

  for (const w of weeks) {
    const isos = weekISOdays(w);
    (w.days || []).forEach((day, idx) => {
      const iso = isos[idx];
      if (!isWantedISO(iso)) return;
      if ((day?.tipo || '') === 'Descanso') return;

      if (wantedRole === 'REF') {
        const anyRef = arr =>
          (arr || []).some(m => nameEq(m?.name) && isMemberRefuerzo(m));
        if (
          !(anyRef(day?.team) || anyRef(day?.prelight) || anyRef(day?.pickup))
        )
          return;
        workedDays += 1;
        if ((day?.tipo || '') === 'Travel Day') travelDays += 1;
      } else {
        const list =
          wantedSuffix === 'P'
            ? day?.prelight
            : wantedSuffix === 'R'
              ? day?.pickup
              : day?.team;
        const inBlock = (list || []).some(m => {
          if (!nameEq(m?.name)) return false;
          const mBase = String(m?.role || '').replace(/[PR]$/, '');
          return !m?.role || !wantedBase || mBase === wantedBase;
        });
        if (!inBlock) return;
        workedDays += 1;
        if (wantedSuffix === 'P') workedPre += 1;
        else if (wantedSuffix === 'R') workedPick += 1;
        else workedBase += 1;
        if ((day?.tipo || '') === 'Travel Day') travelDays += 1;
      }
    });
  }
  return { workedDays, travelDays, workedBase, workedPre, workedPick };
}

/* Presentacional extraído: DietasSummary, Th, Td */

/* MonthSection extraído a components/MonthSection.jsx */

/* ===== Componente principal ===== */
export { default } from './NominaMensual.tsx';
