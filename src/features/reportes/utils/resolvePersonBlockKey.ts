import { stripRoleSuffix } from '@shared/constants/roles';
import { getDayBlockList, isPersonScheduledOnBlock } from './plan';
import { getExtraBlocks } from './extra';
import { parsePersonKey, resolveExportRoleMeta } from './export/dataHelpers';
import { norm } from './text';

type FindWeekAndDay = (iso: string) => { day?: any };

/**
 * Resuelve el bloque del plan (base, pre, pick, extra:N) donde está asignada la persona ese día.
 * Usa comprobación estricta por bloque (no “cualquier bloque” cuando se pasa base).
 */
export function resolvePersonBlockKey(
  pk: string,
  iso: string,
  findWeekAndDay: FindWeekAndDay,
  project?: unknown,
  blockHint?: string
): string {
  const parsed = parsePersonKey(pk);
  const { day } = findWeekAndDay(iso);
  if (!day) return String(blockHint || parsed.block || 'base');

  const preferredBlock = String(blockHint || parsed.block || 'base');
  const resolvedRole = resolveExportRoleMeta(project, parsed.role);
  const roleLabel = resolvedRole.displayRole || parsed.role;
  const roleId = parsed.role;

  const candidates = [
    preferredBlock,
    'base',
    'pre',
    'pick',
    ...getExtraBlocks(day).map((_, index) => `extra:${index}`),
    'extra',
  ].filter((candidate, index, list) => list.indexOf(candidate) === index);

  for (const candidate of candidates) {
    if (
      isPersonScheduledOnBlock(iso, roleLabel, parsed.name, findWeekAndDay as any, candidate, {
        roleId,
      })
    ) {
      return candidate;
    }
  }

  const wantedName = norm(parsed.name);
  const wantedRole = norm(stripRoleSuffix(parsed.role));
  const matchesMember = (member: { name?: string; role?: string; roleId?: string }) => {
    if (norm(member?.name) !== wantedName) return false;
    const memberRoleId = String(member?.roleId || '').trim();
    if (roleId && memberRoleId) return memberRoleId === roleId;
    const memberRole = norm(stripRoleSuffix(String(member?.role || '')));
    return !wantedRole || !memberRole || memberRole === wantedRole;
  };

  if (getDayBlockList(day, 'base').some(matchesMember)) return 'base';
  if (getDayBlockList(day, 'pre').some(matchesMember)) return 'pre';
  if (getDayBlockList(day, 'pick').some(matchesMember)) return 'pick';
  const extraIndex = getExtraBlocks(day).findIndex(block =>
    (block.list || []).some(matchesMember)
  );
  if (extraIndex >= 0) return `extra:${extraIndex}`;
  if (getDayBlockList(day, 'extra').some(matchesMember)) return 'extra';

  return preferredBlock;
}
