import { loadCondModel } from './cond';
import { storage } from '@shared/services/localStorage.service';
import { parseYYYYMMDD } from './date';
import { parseNum, parseDietasValue } from './parse';
import { stripPR, buildRefuerzoIndex, weekISOdays, weekAllPeopleActive } from './plan';

export function makeRolePrices(project: any) {
  const model = loadCondModel(project);
  const priceRows = model?.prices || {};
  const p = model?.params || {};

  const num = (v: unknown) => {
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
  };

  const getForRole = (roleCode: string, baseRoleCode: string | null = null) => {
    const normalized = String(roleCode || '').replace(/[PR]$/, '');
    const baseNorm =
      String(baseRoleCode || '').replace(/[PR]$/, '') || normalized;

    const pickRow = (cands: string[]) => {
      for (const k of cands) if (k && priceRows[k]) return priceRows[k];
      return {} as any;
    };

    const row = pickRow([normalized]);
    const baseRow = pickRow([baseNorm]);
    const elecRow = pickRow(['Eléctrico', 'E']);

    const divTravel = num(p.divTravel) || 2;

    let jornada, travelDay, horaExtra;
    if (normalized === 'REF') {
      const refFromBase = num(baseRow['Precio refuerzo']);
      const baseJornada = num(baseRow['Precio jornada']);
      const elecRef = num(elecRow['Precio refuerzo']);
      const elecJor = num(elecRow['Precio jornada']);
      jornada = refFromBase || baseJornada || elecRef || elecJor || 0;
      const travelBase = num(baseRow['Travel day']);
      travelDay = travelBase || (jornada ? jornada / divTravel : 0);
      horaExtra =
        num(elecRow['Horas extras']) || num(baseRow['Horas extras']) || 0;
    } else {
      jornada = num(row['Precio jornada']) || 0;
      travelDay = num(row['Travel day']) || (jornada ? jornada / divTravel : 0);
      horaExtra = num(row['Horas extras']) || 0;
    }

    return {
      jornada,
      travelDay,
      horaExtra,
      transporte: num(p.transporteDia),
      km: num(p.kilometrajeKm),
      dietas: {
        Comida: num(p.dietaComida),
        Cena: num(p.dietaCena),
        'Dieta sin pernoctar': num(p.dietaSinPernocta),
        'Dieta completa + desayuno': num(p.dietaAlojDes),
        'Gastos de bolsillo': num(p.gastosBolsillo),
      },
    };
  };

  return { getForRole };
}

export function aggregateReports(project: any, weeks: any[], filterISO: ((iso: string) => boolean) | null = null) {
  const base = project?.id || project?.nombre || 'tmp';
  const totals = new Map<string, any>();
  const refuerzoSet = buildRefuerzoIndex(weeks);

  const storageKeyFor = (roleCode: string, name: string) => {
    const base = stripPR(roleCode || '');
    const keyNoPR = `${base}__${name || ''}`;
    if (refuerzoSet.has(keyNoPR)) return `REF__${name || ''}`;
    const suffix = /[PR]$/.test(roleCode || '') ? roleCode.slice(-1) : '';
    const roleForKey = suffix ? `${base}${suffix}` : base;
    return `${roleForKey}__${name || ''}`;
  };

  const visibleRoleFor = (roleCode: string, name: string) => {
    const base = stripPR(roleCode || '');
    const keyNoPR = `${base}__${name || ''}`;
    if (refuerzoSet.has(keyNoPR)) return 'REF';
    const suffix = /[PR]$/.test(roleCode || '') ? roleCode.slice(-1) : '';
    return suffix ? `${base}${suffix}` : base;
  };

  const ensure = (role: string, name: string) => {
    const k = `${role}__${name}`;
    if (!totals.has(k)) {
      totals.set(k, {
        role,
        name,
        extras: 0,
        transporte: 0,
        km: 0,
        dietasCount: new Map<string, number>(),
        ticketTotal: 0,
      });
    }
    return totals.get(k);
  };

  for (const w of weeks) {
    const isoDays = weekISOdays(w);
    const days = filterISO ? isoDays.filter(filterISO) : isoDays;
    if (days.length === 0) continue;

    const weekKey = `reportes_${base}_${isoDays.join('_')}`;
    let data: any = {};
    try {
      const obj = storage.getJSON<any>(weekKey);
      if (obj) data = obj;
    } catch {}

    const rawPeople = weekAllPeopleActive(w);

    const uniqStorageKeys = new Map<string, { roleVisible: string; name: string }>();
    for (const p of rawPeople) {
      const r = p.role || '';
      const n = p.name || '';
      const storageKey = storageKeyFor(r, n);
      if (!uniqStorageKeys.has(storageKey)) {
        uniqStorageKeys.set(storageKey, {
          roleVisible: visibleRoleFor(r, n),
          name: n,
        });
      }
    }

    const cols = {
      extras: 'Horas extra',
      ta: 'Turn Around',
      noct: 'Nocturnidad',
      dietas: 'Dietas',
      km: 'Kilometraje',
      transp: 'Transporte',
      penalty: 'Penalty lunch',
    } as const;

    for (const [pk, info] of uniqStorageKeys) {
      const slot = ensure(info.roleVisible, info.name);
      for (const iso of days) {
        const he = parseNum(data?.[pk]?.[cols.extras]?.[iso]);
        const ta = parseNum(data?.[pk]?.[cols.ta]?.[iso]);
        slot.extras += he + ta;
        const nVal = data?.[pk]?.[cols.noct]?.[iso];
        if (String(nVal || '').toUpperCase() === 'SI') slot.extras += 1;
        const pVal = data?.[pk]?.[cols.penalty]?.[iso];
        if (String(pVal || '').toUpperCase() === 'SI') slot.extras += 1;
        const tVal = data?.[pk]?.[cols.transp]?.[iso];
        if (String(tVal || '').toUpperCase() === 'SI') slot.transporte += 1;
        slot.km += parseNum(data?.[pk]?.[cols.km]?.[iso]);
        const dVal = data?.[pk]?.[cols.dietas]?.[iso] || '';
        const { labels, ticket } = parseDietasValue(dVal);
        slot.ticketTotal += ticket;
        for (const lab of labels) {
          const prev = slot.dietasCount.get(lab) || 0;
          slot.dietasCount.set(lab, prev + 1);
        }
      }
    }
  }

  const order: Record<string, number> = { G: 0, BB: 1, E: 2, TM: 3, FB: 4, AUX: 5, M: 6, REF: 7 };
  return Array.from(totals.values()).sort(
    (a, b) =>
      (order[a.role] ?? 99) - (order[b.role] ?? 99) ||
      a.name.localeCompare(b.name, 'es')
  );
}

export function getCondParams(project: any) {
  const m = loadCondModel(project);
  return m?.params || {};
}

export function getOvertimeWindowForPayrollMonth(monthKey: string, params: any) {
  const [Y, M] = monthKey.split('-').map(Number);
  const ini = parseInt(params?.heCierreIni, 10);
  const fin = parseInt(params?.heCierreFin, 10);
  if (
    !Number.isInteger(ini) ||
    !Number.isInteger(fin) ||
    ini < 1 ||
    ini > 31 ||
    fin < 1 ||
    fin > 31
  )
    return null;
  const start = new Date(Y, M - 1 - 1, ini, 0, 0, 0, 0);
  const end = new Date(Y, M - 1, fin, 23, 59, 59, 999);
  return { start, end };
}

export function isoInRange(iso: string, start: Date, end: Date) {
  const d = parseYYYYMMDD(iso);
  return d >= start && d <= end;
}

export function aggregateWindowedReport(project: any, weeks: any[], filterISO: (iso: string) => boolean) {
  const base = project?.id || project?.nombre || 'tmp';
  const totals = new Map<string, any>();
  const refuerzoSet = buildRefuerzoIndex(weeks);

  const storageKeyFor = (roleCode: string, name: string) => {
    const base = stripPR(roleCode || '');
    const keyNoPR = `${base}__${name || ''}`;
    if (refuerzoSet.has(keyNoPR)) return `REF__${name || ''}`;
    const suffix = /[PR]$/.test(roleCode || '') ? roleCode.slice(-1) : '';
    const roleForKey = suffix ? `${base}${suffix}` : base;
    return `${roleForKey}__${name || ''}`;
  };

  const visibleRoleFor = (roleCode: string, name: string) => {
    const base = stripPR(roleCode || '');
    const keyNoPR = `${base}__${name || ''}`;
    if (refuerzoSet.has(keyNoPR)) return 'REF';
    const suffix = /[PR]$/.test(roleCode || '') ? roleCode.slice(-1) : '';
    return suffix ? `${base}${suffix}` : base;
  };

  const ensure = (visibleKey: string) => {
    if (!totals.has(visibleKey)) {
      totals.set(visibleKey, {
        extras: 0,
        transporte: 0,
        km: 0,
        dietasCount: new Map<string, number>(),
        ticketTotal: 0,
      });
    }
    return totals.get(visibleKey);
  };

  for (const w of weeks) {
    const isoDaysFull = weekISOdays(w);
    const isoDays = filterISO ? isoDaysFull.filter(filterISO) : isoDaysFull;
    if (isoDays.length === 0) continue;

    const weekKey = `reportes_${base}_${isoDaysFull.join('_')}`;
    let data: any = {};
    try {
      const obj = storage.getJSON<any>(weekKey);
      if (obj) data = obj;
    } catch {}

    const rawPeople = weekAllPeopleActive(w);
    const uniqStorage = new Map<string, string>();
    for (const p of rawPeople) {
      const r = p.role || '';
      const n = p.name || '';
      const sk = storageKeyFor(r, n);
      const vk = visibleRoleFor(r, n);
      if (!uniqStorage.has(sk)) uniqStorage.set(sk, vk);
    }

    const cols = {
      extras: 'Horas extra',
      ta: 'Turn Around',
      noct: 'Nocturnidad',
      dietas: 'Dietas',
      km: 'Kilometraje',
      transp: 'Transporte',
      penalty: 'Penalty lunch',
    } as const;
    for (const [storageKey, visibleKey] of uniqStorage) {
      const slot = ensure(visibleKey);
      for (const iso of isoDays) {
        slot.extras += parseNum(data?.[storageKey]?.[cols.extras]?.[iso]);
        slot.extras += parseNum(data?.[storageKey]?.[cols.ta]?.[iso]);
        const nVal = data?.[storageKey]?.[cols.noct]?.[iso];
        if (String(nVal || '').toUpperCase() === 'SI') slot.extras += 1;
        const pVal = data?.[storageKey]?.[cols.penalty]?.[iso];
        if (String(pVal || '').toUpperCase() === 'SI') slot.extras += 1;
        const tVal = data?.[storageKey]?.[cols.transp]?.[iso];
        if (String(tVal || '').toUpperCase() === 'SI') slot.transporte += 1;
        slot.km += parseNum(data?.[storageKey]?.[cols.km]?.[iso]);
        const dVal = data?.[storageKey]?.[cols.dietas]?.[iso] || '';
        const { labels, ticket } = parseDietasValue(dVal);
        slot.ticketTotal += ticket;
        for (const lab of labels) {
          const prev = slot.dietasCount.get(lab) || 0;
          slot.dietasCount.set(lab, prev + 1);
        }
      }
    }
  }

  return totals;
}


