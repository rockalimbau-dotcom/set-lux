import CondicionesTab from '@features/condiciones/pages/CondicionesTab.jsx';
import EquipoTab from '@features/equipo/pages/EquipoTab.jsx';
import NecesidadesTab from '@features/necesidades/pages/NecesidadesTab.jsx';
import NominaTab from '@features/nomina/pages/NominaTab.jsx';
import PlanificacionTab from '@features/planificacion/pages/PlanificacionTab.jsx';
import ReportesTab from '@features/reportes/pages/ReportesTab.jsx';
import LogoSetLux from '@shared/components/LogoSetLux';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

export type ProjectMode = 'semanal' | 'mensual' | 'publicidad';
export type ProjectStatus = 'Activo' | 'Cerrado';

export interface ProjectConditions {
  tipo?: ProjectMode;
  mode?: ProjectMode; // Legacy compatibility
}

export interface TeamMember {
  role: string;
  name: string;
}

export interface ProjectTeam {
  base: TeamMember[];
  reinforcements: TeamMember[];
  prelight: TeamMember[];
  pickup: TeamMember[];
  enabledGroups: {
    prelight: boolean;
    pickup: boolean;
  };
}

export interface Project {
  id: string;
  nombre: string;
  estado: ProjectStatus;
  team?: ProjectTeam;
  conditions?: ProjectConditions;
  conditionsMode?: ProjectMode; // Legacy compatibility
}

export interface User {
  nombreCompleto: string;
  roleCode: string;
}

export interface ProjectDetailProps {
  project: Project;
  user: User;
  onBack: () => void;
  onUpdateProject?: (project: Project) => void;
  initialTab?: string | null;
}

export type ProjectTab = 'equipo' | 'planificacion' | 'reportes' | 'nomina' | 'necesidades' | 'condiciones';

/**
 * ProjectDetail
 * - Vista de detalle de proyecto
 * - Solo muestra tarjetas de fases (2 por fila).
 * - El contenido de una fase se abre al hacer clic en su tarjeta.
 * - PERSISTE por proyecto en localStorage (sin tocar la UI).
 */
export default function ProjectDetail({
  project,
  user,
  onBack,
  onUpdateProject,
  initialTab = null,
}: ProjectDetailProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const pid = params.id || project?.id || project?.nombre || 'tmp';
  
  // --- modo de condiciones/nómina (mensual | semanal | publicidad)
  const condTipo = useMemo(
    () => (project?.conditions?.tipo || 'semanal').toLowerCase() as ProjectMode,
    [project?.conditions?.tipo]
  );
  
  // ---- helper interno ----
  const isEmptyTeam = (t: ProjectTeam | undefined): boolean => {
    if (!t) return true;
    const lens = [
      t.base?.length ?? 0,
      t.reinforcements?.length ?? 0,
      t.prelight?.length ?? 0,
      t.pickup?.length ?? 0,
    ];
    return lens.every(n => n === 0);
  };

  // Claves de almacenamiento por proyecto
  const storageKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    return `project_${base}`;
  }, [project?.id, project?.nombre]);

  const teamKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    return `team_${base}`;
  }, [project?.id, project?.nombre]);

  // Estado inicial del proyecto
  const initialProject: Project = {
    ...project,
    team: project?.team || {
      base: [],
      reinforcements: [],
      prelight: [],
      pickup: [],
      enabledGroups: { prelight: false, pickup: false },
    },
  };

  // Persistencia del proyecto principal
  const [proj, setProj] = useLocalStorage<Project>(storageKey, initialProject);

  // Persistencia del equipo (separada para compatibilidad)
  const [, setTeam] = useLocalStorage<ProjectTeam>(teamKey, initialProject.team || {
    base: [],
    reinforcements: [],
    prelight: [],
    pickup: [],
    enabledGroups: { prelight: false, pickup: false },
  });

  const [loaded, setLoaded] = useState(false);

  // Marcar como cargado
  useEffect(() => {
    setLoaded(true);
  }, []);

  // Sincronizar cambios de equipo hacia el localStorage separado
  useEffect(() => {
    if (!loaded) return;
    if (proj?.team && !isEmptyTeam(proj.team)) {
      setTeam(proj.team);
    }
  }, [proj?.team, loaded, setTeam]);

  const [activeTab, setActiveTab] = useState<ProjectTab | null>(initialTab as ProjectTab ?? null);

  // Ruta -> pestaña (al entrar directamente por URL o al refrescar)
  useEffect(() => {
    try {
      const path = String(location.pathname || '');
      const m = path.match(/\/project\/[^/]+\/?([^/?#]+)?/);
      const seg = (m && m[1]) || '';
      const valid = new Set<ProjectTab>([
        'equipo',
        'planificacion',
        'reportes',
        'nomina',
        'necesidades',
        'condiciones',
      ]);
      if (seg && valid.has(seg as ProjectTab)) {
        if (activeTab !== seg) setActiveTab(seg as ProjectTab);
      } else if (!seg && activeTab !== null) {
        setActiveTab(null);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Pestaña -> ruta (sin cambiar UI)
  useEffect(() => {
    const base = `/project/${pid}`;
    const want = activeTab ? `${base}/${activeTab}` : base;
    if (location.pathname !== want) navigate(want, { replace: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pid]);

  // Estado (activo/cerrado) — case-insensitive
  const isActive = useMemo(() => {
    const val = (proj?.estado ?? '').toString().trim().toLowerCase();
    return val === 'activo';
  }, [proj?.estado]);

  const estadoText = isActive ? 'Activo' : 'Cerrado';
  const estadoClasses = isActive
    ? 'bg-green-600 text-white border-green-500'
    : 'bg-red-600 text-white border-red-500';

  // Lista de equipo simplificada para Planificación
  const teamList = useMemo(() => {
    const t = proj?.team || {
      base: [],
      reinforcements: [],
      prelight: [],
      pickup: [],
      enabledGroups: { prelight: false, pickup: false },
    };
    const all = [
      ...(t.base || []),
      ...(t.reinforcements || []),
      ...(t.prelight || []),
      ...(t.pickup || []),
    ].filter(m => m && m.name);

    const seen = new Set<string>();
    const unique: TeamMember[] = [];
    for (const m of all) {
      const k = `${m.role}|${m.name}`;
      if (!seen.has(k)) {
        seen.add(k);
        unique.push({ role: m.role, name: m.name });
      }
    }
    const order: Record<string, number> = { G: 0, BB: 1, E: 2, TM: 3, FB: 4, AUX: 5, M: 6, REF: 7 };
    unique.sort(
      (a, b) =>
        (order[a.role] ?? 99) - (order[b.role] ?? 99) ||
        a.name.localeCompare(b.name, 'es')
    );
    return unique;
  }, [proj?.team]);

  // Helper para mostrar el modo de condiciones
  const formatMode = (m: string | undefined): string => {
    const v = String(m || '').toLowerCase();
    if (v === 'mensual') return 'Mensual';
    if (v === 'publicidad') return 'Publicidad';
    return 'Semanal'; // por defecto
  };

  // Lee el modo (nuevo: conditions.tipo). Mantén compat con "mode" si existiera.
  const condModeRaw =
    proj?.conditions?.tipo || proj?.conditionsMode || proj?.conditions?.mode;
  const condModeLabel = formatMode(condModeRaw);

  return (
    <div className='max-w-6xl mx-auto px-4 py-6'>
      {/* Header (back + logo centrado) */}
      <div className='flex items-center justify-center relative mb-6'>
        {/* Botón volver a la izquierda, usando absolute */}
        <button
          onClick={onBack}
          className='absolute left-0 w-10 h-10 rounded-xl border border-neutral-border hover:border-[#F59E0B] flex items-center justify-center'
          title='Volver'
        >
          ←
        </button>

        {/* Logo centrado */}
        <LogoSetLux />
      </div>

      {/* Título del proyecto + estado (misma línea, fuera del header) */}
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-xl font-semibold text-brand m-0'>{proj?.nombre}</h2>

        <span
          onClick={() => {
            const nextEstado: ProjectStatus = isActive ? 'Cerrado' : 'Activo';
            setProj(p => {
              const updated = { ...p, estado: nextEstado };
              // Notifica al padre para que refresque su lista (si lo pasó)
              try {
                onUpdateProject?.(updated);
              } catch {}
              return updated;
            });
          }}
          className={`px-3 py-2 rounded-lg text-sm font-medium border cursor-pointer ${estadoClasses}`}
          title={`Cambiar estado (actual: ${estadoText})`}
        >
          {estadoText}
        </span>
      </div>

      {/* Parrilla de fases (tarjetas) */}
      {activeTab === null && (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <PhaseCard
            title={`Condiciones ${condModeLabel}`}
            emoji='📝'
            desc='Precios, Jornadas, márgenes y políticas'
            onClick={() => setActiveTab('condiciones')}
          />
          <PhaseCard
            title='Equipo'
            emoji='👥'
            desc='Base, refuerzos, prelight y recogida'
            onClick={() => setActiveTab('equipo')}
          />

          <PhaseCard
            title='Planificación'
            emoji='🗓️'
            desc='Semanas, horarios y equipo por día'
            onClick={() => setActiveTab('planificacion')}
          />
          <PhaseCard
            title='Reportes'
            emoji='📊'
            desc='Horas extra, dietas, kilometraje, transportes'
            onClick={() => setActiveTab('reportes')}
          />

          <PhaseCard
            title='Nomina'
            emoji='💶'
            desc='Jornadas + Reportes, aquí sabes lo que va a cobrar el equipo'
            onClick={() => setActiveTab('nomina')}
          />

          <PhaseCard
            title='Necesidades de Rodaje'
            emoji='🧩'
            desc='Listado de lo que se necesita de forma ordenada por el orden de rodaje'
            onClick={() => setActiveTab('necesidades')}
          />
        </div>
      )}

      {/* Contenido de la fase seleccionada */}
      {activeTab !== null && (
        <div className='mt-6 rounded-2xl border border-neutral-border bg-neutral-panel/90 p-5'>
          <div className='flex items-center justify-between mb-4'>
            <div className='text-brand font-semibold capitalize'>
              {activeTab === 'condiciones'
                ? `Condiciones ${condModeLabel}`
                : activeTab}
            </div>

            <button
              onClick={() => setActiveTab(null)}
              className='px-3 py-2 rounded-lg border text-sm border-neutral-border hover:border-[#F59E0B]'
              title='Volver a fases'
            >
              ← Volver a fases
            </button>
          </div>

          {activeTab === 'planificacion' && (
            <PlanificacionTab
              project={proj}
              conditions={proj?.conditions}
              baseTeam={proj?.team?.base || []}
              prelightTeam={proj?.team?.prelight || []}
              pickupTeam={proj?.team?.pickup || []}
              reinforcements={proj?.team?.reinforcements || []}
              teamList={teamList}
            />
          )}

          {activeTab === 'equipo' && (
            <EquipoTab
              currentUser={{
                name: user?.nombreCompleto || '',
                role: user?.roleCode || '',
              }}
              initialTeam={proj?.team}
              onChange={(model: ProjectTeam) => {
                // Actualiza proyecto + persiste (en ambas claves)
                setProj(p => {
                  const next = { ...p, team: model };
                  return next;
                });
              }}
              allowEditOverride={true}
              storageKey={`team_${proj?.id || proj?.nombre}`} // persistencia por proyecto dentro de EquipoTab
            />
          )}

          {activeTab === 'reportes' && <ReportesTab project={proj} />}

          {activeTab === 'nomina' && (
            <NominaTab project={proj} mode={condTipo} />
          )}

          {activeTab === 'necesidades' && <NecesidadesTab project={proj} />}

          {activeTab === 'condiciones' && (
            <CondicionesTab
              project={proj}
              mode={condTipo}
              onChange={(patch: any) =>
                setProj(p => {
                  // Si desde Condiciones cambian el tipo, respétalo; si no, conserva el actual
                  const prevTipo = p?.conditions?.tipo || 'semanal';
                  const nextTipo = (patch?.tipo || prevTipo).toLowerCase() as ProjectMode;
                  const next = {
                    ...p,
                    conditions: {
                      ...(p.conditions || {}),
                      ...patch,
                      tipo: nextTipo,
                    },
                  };
                  return next;
                })
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

/* --- Tarjeta de fase --- */
interface PhaseCardProps {
  title: string;
  emoji: string;
  desc: string;
  onClick: () => void;
}

function PhaseCard({ title, emoji, desc, onClick }: PhaseCardProps) {
  return (
    <button
      onClick={onClick}
      className='group text-left rounded-2xl border border-neutral-border bg-neutral-panel/90 p-5 hover:border-[#F59E0B] transition'
    >
      <div className='flex items-center gap-3 mb-2'>
        <div className='text-2xl'>{emoji}</div>
        <div className='text-brand font-semibold'>{title}</div>
      </div>
      <div className='text-sm text-zinc-400'>{desc}</div>
    </button>
  );
}
