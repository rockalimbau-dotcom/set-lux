import { ROLE_COLORS, ROLES, roleRank } from '@shared/constants/roles';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import React, { useEffect, useMemo, useRef, useState } from 'react';

type AnyRecord = Record<string, any>;

const sortTeam = (arr: AnyRecord[]) =>
  [...arr].sort((a, b) => {
    const ra = roleRank(a.role), rb = roleRank(b.role);
    if (ra !== rb) return ra - rb;
    const sa = a.seq ?? 0, sb = b.seq ?? 0;
    return sa - sb;
  });

function EquipoTab({
  currentUser = { name: '', role: '' },
  initialTeam,
  onChange = () => {},
  readOnly: readOnlyProp,
  allowEditOverride = false,
  storageKey = 'setlux_equipo_global_v2',
  projectMode = 'semanal',
}: {
  currentUser?: AnyRecord;
  initialTeam?: AnyRecord;
  onChange?: (payload: AnyRecord) => void;
  readOnly?: boolean;
  allowEditOverride?: boolean;
  storageKey?: string;
  projectMode?: 'semanal' | 'mensual' | 'publicidad';
}) {
  const canEdit = useMemo(() => {
    if (allowEditOverride) return true;
    if (readOnlyProp === true) return false;
    return currentUser?.role === 'G' || currentUser?.role === 'BB';
  }, [currentUser, readOnlyProp, allowEditOverride]);

  // Filtrar roles según el modo del proyecto
  const allowedRoles = useMemo(() => {
    if (projectMode === 'publicidad') {
      // En publicidad, excluir Meritorio (M) y Refuerzo (REF)
      return ROLES.filter(r => r.code !== 'M' && r.code !== 'REF');
    }
    return ROLES;
  }, [projectMode]);

  // Determinar si mostrar la sección de refuerzos
  const showReinforcements = useMemo(() => {
    return projectMode !== 'publicidad';
  }, [projectMode]);

  const [, setSeqCounter] = useState(0);
  const nextSeq = () => {
    let next: number;
    setSeqCounter(s => {
      next = s + 1;
      return next;
    });
    return next!;
  };

  const initialTeamData = {
    base: initialTeam?.base || [],
    reinforcements: initialTeam?.reinforcements || [],
    prelight: initialTeam?.prelight || [],
    pickup: initialTeam?.pickup || [],
    enabledGroups: {
      prelight: initialTeam?.enabledGroups?.prelight ?? false,
      pickup: initialTeam?.enabledGroups?.pickup ?? false,
    },
  };

  const [teamData, setTeamData] = useLocalStorage(storageKey, initialTeamData);

  const [team, setTeam] = useState(() => {
    const normalized = normalizeInitial(teamData as AnyRecord, currentUser);
    return {
      base: sortTeam(normalized.base),
      reinforcements: sortTeam(normalized.reinforcements),
      prelight: sortTeam(normalized.prelight),
      pickup: sortTeam(normalized.pickup),
    };
  });

  const [groupsEnabled, setGroupsEnabled] = useState((teamData as AnyRecord).enabledGroups);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const payloadMemo = useMemo(
    () => ({
      base: team.base,
      reinforcements: team.reinforcements,
      prelight: team.prelight,
      pickup: team.pickup,
      enabledGroups: { ...groupsEnabled },
    }),
    [team, groupsEnabled]
  );

  const lastSavedRef = useRef('');
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = false;
  }, [storageKey]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      if (storageKey) {
        const raw = teamData ? JSON.stringify(teamData) : null;
        if (raw) {
          const saved = JSON.parse(raw);
          const merged = {
            base: saved.base ?? [],
            reinforcements: saved.reinforcements ?? [],
            prelight: saved.prelight ?? [],
            pickup: saved.pickup ?? [],
            enabledGroups: {
              prelight: saved.enabledGroups?.prelight ?? false,
              pickup: saved.enabledGroups?.pickup ?? false,
            },
          };
          setTeam({
            base: sortTeam(merged.base),
            reinforcements: sortTeam(merged.reinforcements),
            prelight: sortTeam(merged.prelight),
            pickup: sortTeam(merged.pickup),
          });
          setGroupsEnabled({ ...merged.enabledGroups });
          onChange({
            base: sortTeam(merged.base),
            reinforcements: sortTeam(merged.reinforcements),
            prelight: sortTeam(merged.prelight),
            pickup: sortTeam(merged.pickup),
            enabledGroups: { ...merged.enabledGroups },
          });
        } else {
          const payload = {
            base: sortTeam(initialTeam?.base || []),
            reinforcements: sortTeam(initialTeam?.reinforcements || []),
            prelight: sortTeam(initialTeam?.prelight || []),
            pickup: sortTeam(initialTeam?.pickup || []),
            enabledGroups: {
              prelight: initialTeam?.enabledGroups?.prelight ?? false,
              pickup: initialTeam?.enabledGroups?.pickup ?? false,
            },
          };
          setTeamData(payload);
        }
      }
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    const maxSeq = Math.max(
      -1,
      ...(['base', 'reinforcements', 'prelight', 'pickup'] as const).flatMap(k =>
        (team[k] || []).map(r => r.seq ?? 0)
      )
    );
    setSeqCounter(maxSeq + 1);
  }, [storageKey]);

  useEffect(() => {
    const json = JSON.stringify(payloadMemo);
    if (json === lastSavedRef.current) return;
    lastSavedRef.current = json;
    try {
      setTeamData(JSON.parse(json));
    } catch {}
    onChangeRef.current?.(payloadMemo);
  }, [payloadMemo, storageKey]);

  const enableGroup = (key: string) => setGroupsEnabled((g: AnyRecord) => ({ ...g, [key]: true }));
  const disableGroup = (key: string) => {
    setGroupsEnabled((g: AnyRecord) => ({ ...g, [key]: false }));
    setTeam(t => ({ ...t, [key]: [] }));
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div />
        <div className='flex items-center gap-2'>
          {!groupsEnabled.prelight && (
            <button
              onClick={() => enableGroup('prelight')}
              className='px-3 py-2 rounded-lg border text-xs border-neutral-border hover:border-accent'
              title='Añadir Equipo Prelight'
              aria-label='+ Prelight'
              type='button'
            >
              + Prelight
            </button>
          )}
          {!groupsEnabled.pickup && (
            <button
              onClick={() => enableGroup('pickup')}
              className='px-3 py-2 rounded-lg border text-xs border-neutral-border hover:border-accent'
              title='Añadir Equipo Recogida'
              aria-label='+ Recogida'
              type='button'
            >
              + Recogida
            </button>
          )}
        </div>
      </div>

      <TeamGroup
        title='Equipo base'
        rows={team.base}
        setRows={(rows: AnyRecord[]) => setTeam(t => ({ ...t, base: sortTeam(rows) }))}
        canEdit={canEdit}
        nextSeq={nextSeq}
        allowedRoles={allowedRoles}
        groupKey='base'
      />
      {showReinforcements && (
        <TeamGroup
          title='Refuerzos'
          rows={team.reinforcements}
          setRows={(rows: AnyRecord[]) => setTeam(t => ({ ...t, reinforcements: sortTeam(rows) }))}
          canEdit={canEdit}
          nextSeq={nextSeq}
          allowedRoles={ROLES.filter(r => r.code === 'REF')}
          groupKey='reinforcements'
        />
      )}
      {groupsEnabled.prelight && (
        <TeamGroup
          title='Equipo Prelight'
          rows={team.prelight}
          setRows={(rows: AnyRecord[]) => setTeam(t => ({ ...t, prelight: sortTeam(rows) }))}
          canEdit={canEdit}
          nextSeq={nextSeq}
          removable
          onRemoveGroup={() => disableGroup('prelight')}
          allowedRoles={allowedRoles as any}
          groupKey='prelight'
        />
      )}
      {groupsEnabled.pickup && (
        <TeamGroup
          title='Equipo Recogida'
          rows={team.pickup}
          setRows={(rows: AnyRecord[]) => setTeam(t => ({ ...t, pickup: sortTeam(rows) }))}
          canEdit={canEdit}
          nextSeq={nextSeq}
          removable
          onRemoveGroup={() => disableGroup('pickup')}
          allowedRoles={allowedRoles as any}
          groupKey='pickup'
        />
      )}

      <p className='text-[11px] text-zinc-500'>
        <span className='text-brand font-semibold'>Tip:</span> El{' '}
        <em>Equipo base</em> se añade por defecto al crear semana o marcar
        “Rodaje” en Planificación.
      </p>
    </div>
  );
}

export default React.memo(EquipoTab);

function roleSuffixForGroup(groupKey: string) {
  if (groupKey === 'prelight') return 'P';
  if (groupKey === 'pickup') return 'R';
  return '';
}
function roleTitleSuffix(groupKey: string) {
  if (groupKey === 'prelight') return ' Prelight';
  if (groupKey === 'pickup') return ' Recogida';
  return '';
}
function displayBadge(roleCode: string, groupKey: string) {
  const suf = roleSuffixForGroup(groupKey);
  return suf ? `${roleCode}${suf}` : roleCode;
}
function displayRolesForGroup(roles: AnyRecord[], groupKey: string) {
  const sufTitle = roleTitleSuffix(groupKey);
  if (!sufTitle) return roles;
  return roles.map(r => ({ ...r, label: `${r.label}${sufTitle}` }));
}

function TeamGroup({
  title,
  rows,
  setRows,
  canEdit,
  removable,
  onRemoveGroup,
  allowedRoles,
  nextSeq,
  groupKey = 'base',
}: AnyRecord) {
  const addRow = () => {
    const seq = nextSeq();
    setRows([
      ...rows,
      { id: safeId(), role: allowedRoles[0]?.code || 'E', name: '', seq },
    ]);
  };
  const updateRow = (id: string, patch: AnyRecord) =>
    setRows(rows.map((r: AnyRecord) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: string) => setRows(rows.filter((r: AnyRecord) => r.id !== id));

  const shownRoles = displayRolesForGroup(allowedRoles, groupKey);

  const headingId = `${groupKey}-heading`;
  const sectionId = `${groupKey}-section`;
  return (
    <section
      id={sectionId}
      className='rounded-2xl border border-neutral-border bg-neutral-panel/90'
      role='region'
      aria-labelledby={headingId}
    >
      <div className='flex items-center justify-between px-5 py-4 gap-3'>
        <h4 id={headingId} className='text-brand font-semibold'>
          {title}
        </h4>
        <div className='flex items-center gap-2'>
          {removable && (
            <button
              onClick={onRemoveGroup}
              className='px-3 py-2 rounded-lg border text-xs border-neutral-border hover:border-red-500'
              aria-label={'Quitar grupo'}
              type='button'
            >
              Quitar grupo
            </button>
          )}
          <button
            onClick={addRow}
            className='px-3 py-2 rounded-lg border text-xs border-neutral-border hover:border-accent'
            aria-label={`Añadir miembro a ${title}`}
            type='button'
          >
            + Añadir
          </button>
        </div>
      </div>

      <div className='px-5 pb-5'>
        {rows.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 px-8 text-center'>
            <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
              No hay equipo
            </h2>
            <p className='text-xl max-w-2xl' style={{color: 'var(--text)', opacity: 0.8}}>
              Pulsa el botón "+ Añadir" para añadir miembros al equipo.
            </p>
          </div>
        ) : (
          <div className='grid gap-2'>
            {rows.map((row: AnyRecord) => (
              <TeamRow
                key={row.id}
                row={row}
                onChange={updateRow}
                onRemove={removeRow}
                canEdit={canEdit}
                allowedRoles={shownRoles}
                groupKey={groupKey}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TeamRow({ row, onChange, onRemove, canEdit, allowedRoles, groupKey = 'base' }: AnyRecord) {
  const col = (ROLE_COLORS as any)[row.role] || (ROLE_COLORS as any).E;
  
  // Detectar el tema actual
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        const currentTheme = (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
        setTheme(currentTheme);
      }
    };

    const observer = new MutationObserver(updateTheme);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Estado para el dropdown personalizado
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Obtener el label del rol seleccionado
  const selectedRole = allowedRoles.find((r: AnyRecord) => r.code === row.role);
  const selectedLabel = selectedRole ? selectedRole.label : '';

  const focusColor = theme === 'light' ? '#0476D9' : '#F27405';

  return (
    <div className='rounded-xl border border-neutral-border bg-neutral-surface p-3'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-2'>
        <div className='sm:w-12 flex sm:justify-start'>
          <span
            className='inline-flex items-center justify-center h-8 min-w-10 px-3 rounded-lg font-bold'
            style={{ background: col.bg, color: col.fg }}
            title={row.role}
          >
            {displayBadge(row.role || '—', groupKey)}
          </span>
        </div>
        <div className='sm:w-[220px] w-full relative' ref={dropdownRef}>
          <label htmlFor={`role-${row.id}`} className='sr-only'>Cargo</label>
          <button
            type='button'
            disabled={!canEdit}
            onClick={() => canEdit && setIsOpen(!isOpen)}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
            onBlur={() => setIsButtonHovered(false)}
            title='Cargo'
            aria-label='Cargo'
            id={`role-${row.id}`}
            className={`w-full min-w-0 px-3 py-2 rounded-lg border focus:outline-none text-sm text-left transition-colors ${
              theme === 'light' 
                ? 'bg-white text-gray-900' 
                : 'bg-black/40 text-zinc-300'
            } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              borderWidth: isButtonHovered ? '1.5px' : '1px',
              borderStyle: 'solid',
              borderColor: isButtonHovered && theme === 'light' 
                ? '#0476D9' 
                : (isButtonHovered && theme === 'dark'
                  ? '#fff'
                  : 'var(--border)'),
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              paddingRight: '2.5rem',
            }}
          >
            {selectedLabel}
          </button>
          {isOpen && canEdit && (
            <div className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
              theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
            }`}>
            {allowedRoles.map((r: AnyRecord) => (
                <button
                  key={r.code}
                  type='button'
                  onClick={() => {
                    onChange(row.id, { role: r.code });
                    setIsOpen(false);
                    setHoveredOption(null);
                  }}
                  onMouseEnter={() => setHoveredOption(r.code)}
                  onMouseLeave={() => setHoveredOption(null)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    theme === 'light' 
                      ? 'text-gray-900' 
                      : 'text-zinc-300'
                  }`}
                  style={{
                    backgroundColor: hoveredOption === r.code 
                      ? (theme === 'light' ? '#A0D3F2' : focusColor)
                      : 'transparent',
                    color: hoveredOption === r.code 
                      ? (theme === 'light' ? '#111827' : 'white')
                      : 'inherit',
                  }}
                >
                {r.label}
                </button>
            ))}
            </div>
          )}
        </div>
        <div className='flex-1 min-w-[220px]'>
          <label htmlFor={`name-${row.id}`} className='sr-only'>Nombre y apellidos</label>
          <input
            disabled={!canEdit}
            type='text'
            value={row.name}
            onChange={e => onChange(row.id, { name: e.target.value })}
            placeholder='Nombre y apellidos'
            className='w-full min-w-0 px-3 py-2 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm'
            aria-label='Nombre y apellidos'
            id={`name-${row.id}`}
          />
        </div>
        <div className='sm:w-10 flex sm:justify-end'>
          <button
            onClick={() => onRemove(row.id)}
            className='px-2 py-1 rounded-lg border text-xs border-neutral-border hover:border-red-500'
            title='Eliminar fila'
            aria-label={`Eliminar fila ${row.name || ''}`}
            type='button'
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

function safeId() {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
    return (crypto as any).randomUUID();
  return Math.random().toString(36).slice(2);
}
function normalizeInitial(initialTeam: AnyRecord, currentUser: AnyRecord) {
  const blank = { base: [], reinforcements: [], prelight: [], pickup: [] } as AnyRecord;
  let model = { ...blank, ...(initialTeam || {}) } as AnyRecord;
  let seq = 0;
  ;['base', 'reinforcements', 'prelight', 'pickup'].forEach((k: string) => {
    model[k] = (model[k] || []).map((r: AnyRecord) => ({ ...r, seq: r.seq ?? seq++ }));
  });
  const isBoss = currentUser?.role === 'G' || currentUser?.role === 'BB';
  if ((!model.base || model.base.length === 0) && isBoss && currentUser?.name) {
    model.base = [
      { id: safeId(), role: currentUser.role, name: currentUser.name, seq: seq++ },
    ];
  }
  model.base = sortTeam(model.base || []);
  model.reinforcements = sortTeam(model.reinforcements || []);
  model.prelight = sortTeam(model.prelight || []);
  model.pickup = sortTeam(model.pickup || []);
  return model;
}


