import CondicionesTab from '@features/condiciones/pages/CondicionesTab.jsx';
import EquipoTab from '@features/equipo/pages/EquipoTab.jsx';
import NecesidadesTab from '@features/necesidades/pages/NecesidadesTab.jsx';
import NominaTab from '@features/nomina/pages/NominaTab.jsx';
import PlanificacionTab from '@features/planificacion/pages/PlanificacionTab.jsx';
import ReportesTab from '@features/reportes/pages/ReportesTab.jsx';
import LogoIcon from '@shared/components/LogoIcon';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { syncAllWeeks } from '@features/planificacion/utils/sync';
import { storage } from '@shared/services/localStorage.service';
import { useTranslation } from 'react-i18next';

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

/** Modal de confirmación para cambiar estado del proyecto */
interface StatusConfirmModalProps {
  projectName: string;
  isClosing: boolean; // true si se está cerrando, false si se está activando
  onClose: () => void;
  onConfirm: () => void;
}

function StatusConfirmModal({ projectName, isClosing, onClose, onConfirm }: StatusConfirmModalProps) {
  const { t } = useTranslation();
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

  const isLight = theme === 'light';

  return (
    <div className='fixed inset-0 bg-black/60 grid place-items-center p-4 z-50'>
      <div className='w-full max-w-md rounded-2xl border border-neutral-border bg-neutral-panel p-6'>
        <h3 className='text-lg font-semibold mb-4' style={{color: isLight ? '#0476D9' : '#F27405'}}>
          {isClosing ? t('projectDetail.confirmClose') : t('projectDetail.confirmActivation')}
        </h3>
        
        <p 
          className='text-sm mb-6' 
          style={{color: isLight ? '#111827' : '#d1d5db'}}
          dangerouslySetInnerHTML={{
            __html: isClosing 
              ? t('projectDetail.confirmCloseMessage', { projectName })
              : t('projectDetail.confirmActivationMessage', { projectName })
          }}
        />

        <div className='flex justify-center gap-3'>
          <button
            onClick={onClose}
            className='px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]'
            style={{
              borderColor: 'var(--border)',
              backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)',
              color: isLight ? '#111827' : '#d1d5db'
            }}
            type='button'
          >
            {t('common.no')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className='px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]'
            style={{
              borderColor: isLight ? '#F27405' : '#F27405',
              color: isLight ? '#F27405' : '#F27405',
              backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)'
            }}
            type='button'
          >
            {t('common.yes')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Modal de validación de nombres de roles */
interface NameValidationModalProps {
  role: string;
  group: string;
  onClose: () => void;
}

function NameValidationModal({ role, group, onClose }: NameValidationModalProps) {
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

  const isLight = theme === 'light';
  
  // Traducir el nombre del grupo
  const { t } = useTranslation();
  const groupName = group === 'base' ? t('team.base')
    : group === 'refuerzos' ? 'Refuerzos' // TODO: agregar traducción para refuerzos
    : group === 'prelight' ? t('team.prelight')
    : group === 'recogida' ? t('team.pickup')
    : group;

  return (
    <div className='fixed inset-0 bg-black/60 grid place-items-center p-4 z-50'>
      <div className='w-full max-w-md rounded-2xl border border-neutral-border bg-neutral-panel p-6'>
        <h3 className='text-lg font-semibold mb-4' style={{color: isLight ? '#0476D9' : '#F27405'}}>
          {t('team.nameRequired')}
        </h3>
        
        <p 
          className='text-sm mb-6' 
          style={{color: isLight ? '#111827' : '#d1d5db'}}
          dangerouslySetInnerHTML={{ __html: t('team.mustAddName', { role, group: groupName }) }}
        />

        <div className='flex justify-center gap-3'>
          <button
            onClick={onClose}
            className='px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]'
            style={{
              borderColor: isLight ? '#F27405' : '#F27405',
              color: isLight ? '#F27405' : '#F27405',
              backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)'
            }}
            type='button'
          >
            {t('team.understood')}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const { t } = useTranslation();
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

  // Validar que todos los roles tengan nombre
  const validateTeamNames = (team: ProjectTeam | undefined): { role: string; group: string } | null => {
    if (!team) return null;
    
    const groups = [
      { name: 'base', members: team.base || [] },
      { name: 'refuerzos', members: team.reinforcements || [] },
      { name: 'prelight', members: team.prelight || [] },
      { name: 'recogida', members: team.pickup || [] },
    ];

    for (const group of groups) {
      for (const member of group.members) {
        if (!member.name || member.name.trim() === '') {
          return { role: member.role || 'Sin rol', group: group.name };
        }
      }
    }
    
    return null;
  };

  // Wrapper para setActiveTab que valida nombres antes de cambiar
  const handleTabChange = (newTab: ProjectTab | null) => {
    // Si estamos en la pestaña de equipo o saliendo de ella, validar nombres
    if (activeTab === 'equipo' || newTab === 'equipo') {
      const invalidRole = validateTeamNames(proj?.team);
      if (invalidRole) {
        setShowNameValidationModal({ targetTab: newTab, roleWithoutName: invalidRole });
        return;
      }
    }
    setActiveTab(newTab);
  };

  // Wrapper para navegar fuera del proyecto que valida nombres
  const handleNavigateAway = () => {
    // Si estamos en la pestaña de equipo, validar nombres antes de salir
    if (activeTab === 'equipo') {
      const invalidRole = validateTeamNames(proj?.team);
      if (invalidRole) {
        setShowNameValidationModal({ targetTab: null, roleWithoutName: invalidRole });
        return;
      }
    }
    navigate('/projects');
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

  // Sincronizar automáticamente las semanas de planificación cuando se guarda el equipo
  // Esto permite que las semanas se autocompleten sin necesidad de entrar en planificación
  useEffect(() => {
    if (!loaded) return;
    if (!proj?.team || isEmptyTeam(proj.team)) return;

    const planKey = `plan_${proj?.id || proj?.nombre || 'tmp'}`;
    try {
      const planData = storage.getJSON<{ pre?: any[]; pro?: any[] }>(planKey);
      if (!planData || (!planData.pre?.length && !planData.pro?.length)) {
        // No hay semanas, no hay nada que sincronizar
        return;
      }

      const baseTeam = proj.team.base || [];
      const prelightTeam = proj.team.prelight || [];
      const pickupTeam = proj.team.pickup || [];
      const reinforcements = proj.team.reinforcements || [];

      // Sincronizar semanas pre y pro
      const syncedPre = syncAllWeeks(
        planData.pre || [],
        baseTeam,
        prelightTeam,
        pickupTeam,
        reinforcements
      );
      const syncedPro = syncAllWeeks(
        planData.pro || [],
        baseTeam,
        prelightTeam,
        pickupTeam,
        reinforcements
      );

      // Guardar las semanas sincronizadas
      storage.setJSON(planKey, {
        pre: syncedPre,
        pro: syncedPro,
      });
    } catch (error) {
      // Silenciar errores de sincronización
    }
  }, [proj?.team, proj?.id, proj?.nombre, loaded]);

  const [activeTab, setActiveTab] = useState<ProjectTab | null>(initialTab as ProjectTab ?? null);
  const [showStatusModal, setShowStatusModal] = useState<{ isClosing: boolean } | null>(null);
  const [showNameValidationModal, setShowNameValidationModal] = useState<{ targetTab: ProjectTab | null; roleWithoutName: { role: string; group: string } } | null>(null);

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

  const estadoText = isActive ? t('common.active') : t('common.closed');
  const themeGlobal = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'light';
  const estadoBg = isActive ? (themeGlobal === 'light' ? '#0468BF' : '#F27405') : '#64748b';

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
    if (v === 'mensual') return 'mensuales';
    if (v === 'publicidad') return 'publicidad';
    return 'semanales'; // por defecto
  };

  // Lee el modo (nuevo: conditions.tipo). Mantén compat con "mode" si existiera.
  const condModeRaw =
    proj?.conditions?.tipo || proj?.conditionsMode || proj?.conditions?.mode;
  const condModeLabel = formatMode(condModeRaw);

  // Texto de fase activo para el título
  const activePhaseLabel = useMemo(() => {
    if (!activeTab) return '';
    if (activeTab === 'condiciones') {
      if (condModeLabel === 'semanales') return t('conditions.weekly');
      if (condModeLabel === 'mensuales') return t('conditions.monthly');
      if (condModeLabel === 'publicidad') return t('conditions.advertising');
      return `Condiciones ${condModeLabel}`;
    }
    if (activeTab === 'nomina') return t('navigation.payroll');
    if (activeTab === 'planificacion') return t('navigation.planning');
    if (activeTab === 'necesidades') return t('needs.title');
    if (activeTab === 'equipo') return t('navigation.team');
    if (activeTab === 'reportes') return t('navigation.reports');
    return activeTab;
  }, [activeTab, condModeLabel, t]);

  return (
    <div>
      {/* Header con los mismos tamaños que ProjectsScreen y flecha debajo del título */}
      <div className='px-6 pt-8 pb-12' style={{backgroundColor: 'var(--bg)'}}>
        <div className='max-w-6xl mx-auto'>
          <div className='flex items-center justify-between mb-8'>
            <div className='flex items-center gap-6'>
              <LogoIcon size={80} onClick={handleNavigateAway} />
              <h1 className='text-3xl font-bold' style={{color: 'var(--text)'}}>
                <button 
                  onClick={handleNavigateAway}
                  className='hover:underline transition-all'
                  style={{color: 'var(--text)'}}
                >
                  {t('common.projects')}
                </button>
                <span className='mx-2' style={{color: 'var(--text)'}}>›</span>
                {activePhaseLabel ? (
                  <button 
                    onClick={() => {
                      // Validar nombres antes de volver al menú del proyecto
                      if (activeTab === 'equipo') {
                        const invalidRole = validateTeamNames(proj?.team);
                        if (invalidRole) {
                          setShowNameValidationModal({ targetTab: null, roleWithoutName: invalidRole });
                          return;
                        }
                      }
                      navigate(`/project/${proj?.id}`);
                    }}
                    className='hover:underline transition-all'
                    style={{color: 'var(--text)'}}
                  >
                    {proj?.nombre}
                  </button>
                ) : (
                  <span style={{color: 'var(--text)'}}>
                    {proj?.nombre}
                  </span>
                )}
                {activePhaseLabel && (
                  <>
                    <span className='mx-2' style={{color: 'var(--text)'}}>›</span>
                    <span style={{color: 'var(--text)'}}>{activePhaseLabel}</span>
                  </>
                )}
              </h1>
            </div>

            <span
              onClick={() => {
                // Mostrar modal de confirmación
                setShowStatusModal({ isClosing: isActive });
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium border cursor-pointer`}
              style={{backgroundColor: estadoBg, borderColor: estadoBg, color: '#ffffff'}}
              title={t('projectDetail.changeStatus', { status: estadoText })}
            >
              {estadoText}
            </span>
          </div>
        </div>
      </div>

      <div className='px-6 pb-6'>
        <div className='max-w-6xl mx-auto'>
      {/* Parrilla de fases (tarjetas) */}
      {activeTab === null && (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <PhaseCard
            title={condModeLabel === 'semanales' ? t('conditions.weekly') : condModeLabel === 'mensuales' ? t('conditions.monthly') : t('conditions.advertising')}
            icon={<PhaseIcon name='condiciones' color='#60a5fa' />}
            desc={t('conditions.description')}
            onClick={() => handleTabChange('condiciones')}
          />
          <PhaseCard
            title={t('navigation.team')}
            icon={<PhaseIcon name='equipo' color='#60a5fa' />}
            desc={condTipo === 'publicidad' ? t('team.descriptionAdvertising') : t('team.description')}
            onClick={() => handleTabChange('equipo')}
          />

          <PhaseCard
            title={t('navigation.planning')}
            icon={<PhaseIcon name='planificacion' color='#60a5fa' />}
            desc={t('planning.description')}
            onClick={() => handleTabChange('planificacion')}
          />
          <PhaseCard
            title={t('navigation.reports')}
            icon={<PhaseIcon name='reportes' color='#60a5fa' />}
            desc={t('reports.description')}
            onClick={() => handleTabChange('reportes')}
          />

          <PhaseCard
            title={t('navigation.payroll')}
            icon={<PhaseIcon name='nomina' color='#60a5fa' />}
            desc={t('payroll.description')}
            onClick={() => handleTabChange('nomina')}
          />

          <PhaseCard
            title={t('needs.title')}
            icon={<PhaseIcon name='necesidades' color='#60a5fa' />}
            desc={t('needs.description')}
            onClick={() => handleTabChange('necesidades')}
          />
        </div>
      )}

      {/* Contenido de la fase seleccionada */}
        {activeTab !== null && (
         <div
           className='phase-content -mt-1 rounded-2xl border border-neutral-border bg-neutral-panel/90 p-5'
           data-readonly={!isActive ? 'true' : 'false'}
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
              readOnly={!isActive}
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
                // Si el proyecto está cerrado, no permitir cambios
                if (!isActive) return;
                // Actualiza proyecto + persiste (en ambas claves)
                setProj(p => {
                  const next = { ...p, team: model };
                  return next;
                });
              }}
              allowEditOverride={isActive}
              readOnly={!isActive}
              storageKey={`team_${proj?.id || proj?.nombre}`} // persistencia por proyecto dentro de EquipoTab
              projectMode={condTipo}
            />
          )}

          {activeTab === 'reportes' && <ReportesTab project={proj} mode={condTipo} readOnly={!isActive} />}

          {activeTab === 'nomina' && (
            <NominaTab project={proj} mode={condTipo} readOnly={!isActive} />
          )}

          {activeTab === 'necesidades' && <NecesidadesTab project={proj} readOnly={!isActive} />}

          {activeTab === 'condiciones' && (
            <CondicionesTab
              project={proj}
              mode={condTipo}
              onChange={(patch: any) => {
                // Si el proyecto está cerrado, no permitir cambios
                if (!isActive) return;
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
              readOnly={!isActive}
            />
          )}
        </div>
      )}
        </div>
      </div>

      {/* Modal confirmar cambio de estado */}
      {showStatusModal && (
        <StatusConfirmModal
          projectName={proj?.nombre || 'este proyecto'}
          isClosing={showStatusModal.isClosing}
          onClose={() => setShowStatusModal(null)}
          onConfirm={() => {
            const nextEstado: ProjectStatus = showStatusModal.isClosing ? 'Cerrado' : 'Activo';
            setProj(p => {
              const updated = { ...p, estado: nextEstado };
              try {
                onUpdateProject?.(updated);
              } catch {}
              return updated;
            });
          }}
        />
      )}

      {/* Modal validación de nombres de roles */}
      {showNameValidationModal && (
        <NameValidationModal
          role={showNameValidationModal.roleWithoutName.role}
          group={showNameValidationModal.roleWithoutName.group}
          onClose={() => setShowNameValidationModal(null)}
        />
      )}
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
        <div className='text-xl font-semibold' style={{color: (typeof document!=='undefined' && document.documentElement.getAttribute('data-theme')==='light') ? '#0468BF' : '#F27405'}}>{title}</div>
      </div>
      <div className='text-sm' style={{color: (typeof document!=='undefined' && document.documentElement.getAttribute('data-theme')==='light') ? '#111827' : '#d1d5db'}}>{desc}</div>
    </button>
  );
}

// Monochrome project icons (orange/blue friendly). Using currentColor so parent can control color
function PhaseIcon({ name, color = '#60a5fa', stroke = '#ffffff' }: { name: 'condiciones' | 'equipo' | 'planificacion' | 'reportes' | 'nomina' | 'necesidades'; color?: string; stroke?: string }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24' } as const;
  const themeNow = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'light';
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
