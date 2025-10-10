import CondicionesTab from '@features/condiciones/pages/CondicionesTab.jsx';
import EquipoTab from '@features/equipo/pages/EquipoTab.jsx';
import NecesidadesTab from '@features/necesidades/pages/NecesidadesTab.jsx';
import NominaTab from '@features/nomina/pages/NominaTab.jsx';
import PlanificacionTab from '@features/planificacion/pages/PlanificacionTab.jsx';
import ReportesTab from '@features/reportes/pages/ReportesTab.jsx';
import LogoIcon from '@shared/components/LogoIcon';
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
  const themeGlobal = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'dark';
  const estadoBg = isActive ? (themeGlobal === 'light' ? '#0476D9' : '#f97316') : '#64748b';

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

  // Texto de fase activo para el título
  const activePhaseLabel = useMemo(() => {
    if (!activeTab) return '';
    if (activeTab === 'condiciones') return `Condiciones ${condModeLabel}`;
    if (activeTab === 'nomina') return 'Nómina';
    if (activeTab === 'planificacion') return 'Planificación';
    if (activeTab === 'necesidades') return 'Necesidades';
    if (activeTab === 'equipo') return 'Equipo';
    if (activeTab === 'reportes') return 'Reportes';
    return activeTab;
  }, [activeTab, condModeLabel]);

  return (
    <div>
      {/* Header con los mismos tamaños que ProjectsScreen y flecha debajo del título */}
      <div className='px-6 pt-8 pb-12' style={{backgroundColor: 'var(--bg)'}}>
        <div className='max-w-6xl mx-auto'>
          <div className='flex items-center justify-between mb-8'>
            <div className='flex items-center gap-6'>
              <LogoIcon size={80} />
              <h1 className='text-3xl font-bold' style={{color: 'var(--text)'}}>
                <button 
                  onClick={() => navigate('/projects')}
                  className='hover:underline transition-all'
                  style={{color: 'var(--text)'}}
                >
                  Proyectos
                </button> <span className='text-gray-300 mx-2' style={{color: (document.documentElement.getAttribute('data-theme')||'dark')==='light' ? '#374151' : '#d1d5db'}}>›</span> {activePhaseLabel ? (
                  <button 
                    onClick={() => navigate(`/project/${proj?.id}`)}
                    className='hover:underline transition-all text-gray-300'
                    style={{color: (document.documentElement.getAttribute('data-theme')||'dark')==='light' ? '#374151' : '#d1d5db'}}
                  >
                    {proj?.nombre}
                  </button>
                ) : (
                  <span className='text-gray-300' style={{color: (document.documentElement.getAttribute('data-theme')||'dark')==='light' ? '#374151' : '#d1d5db'}}>
                    {proj?.nombre}
                  </span>
                )}{activePhaseLabel ? ` › ${activePhaseLabel}` : ''}
              </h1>
            </div>

            <span
              onClick={() => {
                const nextEstado: ProjectStatus = isActive ? 'Cerrado' : 'Activo';
                setProj(p => {
                  const updated = { ...p, estado: nextEstado };
                  try {
                    onUpdateProject?.(updated);
                  } catch {}
                  return updated;
                });
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium border cursor-pointer`}
              style={{backgroundColor: estadoBg, borderColor: estadoBg, color: '#ffffff'}}
              title={`Cambiar estado (actual: ${estadoText})`}
            >
              {estadoText}
            </span>
          </div>
        </div>
      </div>

      <div className='max-w-6xl mx-auto p-6'>
      {/* Parrilla de fases (tarjetas) */}
      {activeTab === null && (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <PhaseCard
            title={`Condiciones ${condModeLabel}`}
            icon={<PhaseIcon name='condiciones' color='#60a5fa' />}
            desc='Precios, Jornadas, márgenes y políticas'
            onClick={() => setActiveTab('condiciones')}
          />
          <PhaseCard
            title='Equipo'
            icon={<PhaseIcon name='equipo' color='#60a5fa' />}
            desc='Base, refuerzos, prelight y recogida'
            onClick={() => setActiveTab('equipo')}
          />

          <PhaseCard
            title='Planificación'
            icon={<PhaseIcon name='planificacion' color='#60a5fa' />}
            desc='Semanas, horarios y equipo por día'
            onClick={() => setActiveTab('planificacion')}
          />
          <PhaseCard
            title='Reportes'
            icon={<PhaseIcon name='reportes' color='#60a5fa' />}
            desc='Horas extra, dietas, kilometraje, transportes'
            onClick={() => setActiveTab('reportes')}
          />

          <PhaseCard
            title='Nomina'
            icon={<PhaseIcon name='nomina' color='#60a5fa' />}
            desc='Jornadas + Reportes, aquí sabes lo que va a cobrar el equipo'
            onClick={() => setActiveTab('nomina')}
          />

          <PhaseCard
            title='Necesidades de Rodaje'
            icon={<PhaseIcon name='necesidades' color='#60a5fa' />}
            desc='Listado de lo que se necesita de forma ordenada por el orden de rodaje'
            onClick={() => setActiveTab('necesidades')}
          />
        </div>
      )}

      {/* Contenido de la fase seleccionada */}
        {activeTab !== null && (
         <div
           className='phase-content -mt-1 rounded-2xl border border-neutral-border bg-neutral-panel/90 p-5'
           style={{
             borderColor: (document.documentElement.getAttribute('data-theme')||'dark')==='light' ? 'rgba(229,231,235,0.6)' : 'var(--border)'
           }}
         >

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
              onChange={(patch: any) => {
                // Solo actualizar si hay cambios reales
                if (!patch) return;
                
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
                });
              }}
            />
          )}
        </div>
      )}
      </div>
    </div>
  );
}

/* --- Tarjeta de fase --- */
interface PhaseCardProps {
  title: string;
  icon: React.ReactNode;
  desc: string;
  onClick: () => void;
}

function PhaseCard({ title, icon, desc, onClick }: PhaseCardProps) {
  return (
    <button
      onClick={onClick}
      className='group text-left rounded-2xl border border-neutral-border p-6 transition hover:border-[var(--hover-border)]'
      style={{
        backgroundColor: 'var(--panel)',
        borderColor: (typeof document!=='undefined' && document.documentElement.getAttribute('data-theme')==='light') ? 'rgba(229,231,235,0.6)' : 'var(--border)'
      }}
    >
      <div className='flex items-center gap-4 mb-2'>
        <div
          className='w-12 h-12 rounded-xl border border-neutral-border flex items-center justify-center text-2xl'
          style={{
            backgroundColor: (typeof document!=='undefined' && document.documentElement.getAttribute('data-theme')==='light') ? '#ffffff' : 'rgba(0,0,0,0.2)'
          }}
        >
          {icon}
        </div>
        <div className='text-xl font-semibold' style={{color: (typeof document!=='undefined' && document.documentElement.getAttribute('data-theme')==='light') ? '#0476D9' : '#f97316'}}>{title}</div>
      </div>
      <div className='text-sm' style={{color: (typeof document!=='undefined' && document.documentElement.getAttribute('data-theme')==='light') ? '#111827' : '#d1d5db'}}>{desc}</div>
    </button>
  );
}

// Monochrome project icons (orange/blue friendly). Using currentColor so parent can control color
function PhaseIcon({ name, color = '#60a5fa', stroke = '#ffffff' }: { name: 'condiciones' | 'equipo' | 'planificacion' | 'reportes' | 'nomina' | 'necesidades'; color?: string; stroke?: string }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24' } as const;
  const themeNow = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'dark';
  const fill = themeNow === 'light' ? '#f97316' : color;
  const strokeColor = themeNow === 'light' ? '#111827' : stroke;
  switch (name) {
    case 'condiciones':
      return (
        <svg {...common} fill={fill} xmlns='http://www.w3.org/2000/svg'>
          <path d='M6 2h9a2 2 0 0 1 1.414.586l3 3A2 2 0 0 1 20 7v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2v16h12V7.828L14.172 4H6zm3 6h6v2H9v-2zm0 4h6v2H9v-2z' stroke={strokeColor} strokeWidth='1'/>
        </svg>
      );
    case 'equipo':
      return (
        <svg {...common} fill={fill} xmlns='http://www.w3.org/2000/svg'>
          <path d='M8 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm8 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM2 20a6 6 0 0 1 12 0v2H2v-2zm12 2v-2a6 6 0 0 1 10 0v2H14z' stroke={strokeColor} strokeWidth='1'/>
        </svg>
      );
    case 'planificacion':
      return (
        <svg {...common} fill={fill} xmlns='http://www.w3.org/2000/svg'>
          <path d='M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v3H3V6a2 2 0 0 1 2-2h2V2zm15 8v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8h20zM7 14h4v4H7v-4z' stroke={strokeColor} strokeWidth='1'/>
        </svg>
      );
    case 'reportes':
      return (
        <svg {...common} fill={fill} xmlns='http://www.w3.org/2000/svg'>
          <path d='M4 3h16v2H4V3zm2 6h3v12H6V9zm5 4h3v8h-3v-8zm5-6h3v14h-3V7z' stroke={strokeColor} strokeWidth='1'/>
        </svg>
      );
    case 'nomina':
      return (
        <svg {...common} fill={fill} xmlns='http://www.w3.org/2000/svg'>
          <path d='M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6zm2 2v6h14V8H5zm7 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6z' stroke={strokeColor} strokeWidth='1'/>
        </svg>
      );
    case 'necesidades':
      return (
        <svg {...common} fill={fill} xmlns='http://www.w3.org/2000/svg'>
          <path d='M21 7l-4-4-3 3 4 4 3-3zM2 20l7-2-5-5-2 7zm11.586-9.414l-7.172 7.172 2.828 2.828 7.172-7.172-2.828-2.828z' stroke={strokeColor} strokeWidth='1'/>
        </svg>
      );
  }
}
