import { AnyRecord } from '@shared/types/common';
import { hasRoleGroupSuffix } from '@shared/constants/roles';
import { flattenExtraBlockMembers, normalizeExtraBlocks } from './extraBlocks';

type AnyDay = AnyRecord & { [key: string]: any };
type AnyWeek = AnyRecord & { days?: any };

const normalizeNeedsDays = (days: any): AnyDay[] => {
  if (Array.isArray(days)) return days as AnyDay[];
  if (days && typeof days === 'object') {
    const normalized: AnyDay[] = [];
    for (let i = 0; i < 7; i++) {
      const byNumber = (days as AnyRecord)[i];
      const byString = (days as AnyRecord)[String(i)];
      normalized[i] = (byNumber || byString || {}) as AnyDay;
    }
    return normalized;
  }
  return [];
};

const withSource = (list: any, source: 'base' | 'pre' | 'pick' | 'ref') => {
  if (!Array.isArray(list)) return [];
  return list.map(m => ({
    ...m,
    source: m?.source || source,
  }));
};

const withRoleSuffix = (list: any[], suffix: 'P' | 'R') => {
  return (list || []).map(m => {
    const rawRole = String(m?.role || '').trim().toUpperCase();
    const isRefRole = rawRole === 'REF' || (rawRole.startsWith('REF') && rawRole.length > 3);
    if (!rawRole || isRefRole || hasRoleGroupSuffix(rawRole)) return m;
    return {
      ...m,
      role: `${rawRole}${suffix}`,
    };
  });
};

export const needsDayToPlanDay = (day: AnyDay): AnyDay => {
  const crewList = withSource(day.crewList, 'base');
  const refBlocks = normalizeExtraBlocks(day);
  const refList = withSource(flattenExtraBlockMembers(refBlocks), 'ref');
  const preList = withRoleSuffix(withSource(day.preList, 'pre'), 'P');
  const pickList = withRoleSuffix(withSource(day.pickList, 'pick'), 'R');
  const firstExtraBlock = refBlocks[0];
  return {
    ...day,
    tipo: day?.crewTipo ?? day?.tipo ?? '',
    crewList,
    refList,
    preList,
    pickList,
    crewStart: day?.crewStart ?? day?.start ?? '',
    crewEnd: day?.crewEnd ?? day?.end ?? '',
    start: day?.crewStart ?? day?.start ?? '',
    end: day?.crewEnd ?? day?.end ?? '',
    refBlocks,
    refStart: firstExtraBlock?.start ?? day?.refStart ?? '',
    refEnd: firstExtraBlock?.end ?? day?.refEnd ?? '',
    refTipo: firstExtraBlock?.tipo ?? day?.refTipo ?? '',
    preStart: day?.preStart ?? day?.prelightStart ?? '',
    preEnd: day?.preEnd ?? day?.prelightEnd ?? '',
    pickStart: day?.pickStart ?? day?.pickupStart ?? '',
    pickEnd: day?.pickEnd ?? day?.pickupEnd ?? '',
    prelightStart: day?.preStart ?? day?.prelightStart ?? '',
    prelightEnd: day?.preEnd ?? day?.prelightEnd ?? '',
    pickupStart: day?.pickStart ?? day?.pickupStart ?? '',
    pickupEnd: day?.pickEnd ?? day?.pickupEnd ?? '',
    prelightTipo: day?.prelightTipo ?? day?.preTipo ?? '',
    pickupTipo: day?.pickupTipo ?? day?.pickTipo ?? '',
    team: [...crewList, ...refList],
    prelight: preList,
    pickup: pickList,
  };
};

export const needsWeekToPlanWeek = (week: AnyWeek): AnyRecord => {
  const days = normalizeNeedsDays(week.days);
  return {
    ...week,
    days: days.map(needsDayToPlanDay),
  };
};

export const needsDataToPlanData = (data: AnyRecord | null | undefined) => {
  const raw = data || {};
  return {
    pre: Array.isArray(raw.pre) ? raw.pre.map(needsWeekToPlanWeek) : [],
    pro: Array.isArray(raw.pro) ? raw.pro.map(needsWeekToPlanWeek) : [],
  };
};
