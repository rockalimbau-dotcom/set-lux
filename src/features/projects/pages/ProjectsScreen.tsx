import LogoIcon from '@shared/components/LogoIcon';
import { useEffect, useRef, useState, useMemo, memo, useCallback } from 'react';

export type ProjectMode = 'semanal' | 'mensual' | 'publicidad';
export type ProjectStatus = 'Activo' | 'Cerrado';

export interface ProjectConditions {
  tipo: ProjectMode;
}

export interface Project {
  id: string;
  nombre: string;
  dop?: string;
  almacen?: string;
  productora?: string;
  estado: ProjectStatus;
  conditions?: ProjectConditions;
}

export interface ProjectForm {
  nombre: string;
  dop: string;
  almacen: string;
  productora: string;
  estado: ProjectStatus;
  condicionesTipo: ProjectMode;
}

export interface ProjectsScreenProps {
  userName: string;
  projects: Project[];
  onCreateProject: (project: Project) => void;
  onOpen: (project: Project) => void;
  onUpdateProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onPerfil?: () => void;
  onConfig?: () => void;
  onSalir?: () => void;
}

const formatMode = (m: string | undefined): string => {
  if (!m) return '—';
  const v = String(m).toLowerCase();
  if (v === 'semanal') return 'Semanal';
  if (v === 'mensual') return 'Mensual';
  if (v === 'publicidad') return 'Publicidad';
  return '—';
};

/** Campo con etiqueta (utilidad interna del modal) */
interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <label className='space-y-1'>
      <span className='block text-sm text-zinc-300'>{label}</span>
      {children}
    </label>
  );
}

/** Modal para crear proyecto */
interface NewProjectModalProps {
  onClose: () => void;
  onCreate: (project: Project) => void;
}

function NewProjectModal({ onClose, onCreate }: NewProjectModalProps) {
  const [form, setForm] = useState<ProjectForm>(() => ({
    nombre: '',
    dop: '',
    almacen: '',
    productora: '',
    estado: 'Activo',
    condicionesTipo: 'semanal',
  }));

  return (
    <div className='fixed inset-0 bg-black/60 grid place-items-center p-4 z-50'>
      <div className='w-full max-w-lg rounded-2xl border border-neutral-border bg-neutral-panel p-6'>
        <h3 className='text-lg font-semibold mb-4 text-orange-500'>
          Nuevo proyecto
        </h3>
        <div className='grid grid-cols-2 gap-4'>
          <Field label='Proyecto'>
            <input
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
            />
          </Field>
          <Field label='DoP'>
            <input
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={form.dop}
              onChange={e => setForm({ ...form, dop: e.target.value })}
            />
          </Field>
          <Field label='Almacén'>
            <input
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={form.almacen}
              onChange={e => setForm({ ...form, almacen: e.target.value })}
            />
          </Field>
          <Field label='Productora'>
            <input
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={form.productora}
              onChange={e => setForm({ ...form, productora: e.target.value })}
            />
          </Field>
          <Field label='Estado'>
            <select
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={form.estado}
              onChange={e => setForm({ ...form, estado: e.target.value as ProjectStatus })}
            >
              <option>Activo</option>
              <option>Cerrado</option>
            </select>
          </Field>
          <Field label='Condiciones'>
            <select
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={form.condicionesTipo}
              onChange={e =>
                setForm({ ...form, condicionesTipo: e.target.value as ProjectMode })
              }
            >
              <option value='mensual'>Mensual</option>
              <option value='semanal'>Semanal</option>
              <option value='publicidad'>Publicidad</option>
            </select>
          </Field>
        </div>

        <div className='flex justify-end gap-3 mt-6'>
          <button
            className='inline-flex items-center justify-center px-4 py-3 rounded-xl font-semibold border border-neutral-border hover:border-orange-500 text-zinc-300 hover:text-orange-500 transition'
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className='inline-flex items-center justify-center px-4 py-3 rounded-xl font-semibold bg-brand hover:bg-brand-dark transition shadow-lg'
            onClick={() => {
              if (!form.nombre.trim()) return;
              const proj: Project = {
                id: crypto.randomUUID(),
                nombre: form.nombre,
                dop: form.dop,
                almacen: form.almacen,
                productora: form.productora,
                estado: form.estado,
                conditions: {
                  tipo: form.condicionesTipo || 'mensual',
                },
              };
              onCreate(proj);
              onClose();
            }}
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  );
}

/** Modal para editar proyecto (misma estética que el de creación) */
interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onSave: (project: Project) => void;
}

function EditProjectModal({ project, onClose, onSave }: EditProjectModalProps) {
  const [form, setForm] = useState<ProjectForm>(() => ({
    nombre: project?.nombre || '',
    dop: project?.dop || '',
    almacen: project?.almacen || '',
    productora: project?.productora || '',
    estado: project?.estado || 'Activo',
    condicionesTipo: project?.conditions?.tipo || 'semanal',
  }));

  const formatMode = (m: string | undefined): ProjectMode => {
    const v = String(m || '').toLowerCase();
    if (v === 'semanal') return 'semanal';
    if (v === 'mensual') return 'mensual';
    if (v === 'publicidad') return 'publicidad';
    return 'semanal';
  };

  const handleSave = () => {
    if (!form.nombre.trim()) return;

    const updated: Project = {
      ...project,
      nombre: form.nombre.trim(),
      dop: form.dop,
      almacen: form.almacen,
      productora: form.productora,
      estado: form.estado,
      conditions: {
        ...(project?.conditions || {}),
        tipo: formatMode(form.condicionesTipo),
      },
    };

    onSave?.(updated);
    onClose?.();
  };

  return (
    <div className='fixed inset-0 bg-black/60 grid place-items-center p-4 z-50'>
      <div className='w-full max-w-lg rounded-2xl border border-neutral-border bg-neutral-panel p-6'>
        <h3 className='text-lg font-semibold mb-4 text-brand'>
          Editar proyecto
        </h3>

        <div className='grid grid-cols-2 gap-4'>
          <Field label='Proyecto'>
            <input
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
            />
          </Field>

          <Field label='DoP'>
            <input
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={form.dop}
              onChange={e => setForm({ ...form, dop: e.target.value })}
            />
          </Field>

          <Field label='Almacén'>
            <input
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={form.almacen}
              onChange={e => setForm({ ...form, almacen: e.target.value })}
            />
          </Field>

          <Field label='Productora'>
            <input
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={form.productora}
              onChange={e => setForm({ ...form, productora: e.target.value })}
            />
          </Field>

          <Field label='Estado'>
            <select
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={form.estado}
              onChange={e => setForm({ ...form, estado: e.target.value as ProjectStatus })}
            >
              <option>Activo</option>
              <option>Cerrado</option>
            </select>
          </Field>

          <Field label='Tipo de condiciones'>
            <select
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={form.condicionesTipo}
              onChange={e =>
                setForm({ ...form, condicionesTipo: e.target.value as ProjectMode })
              }
            >
              <option value='semanal'>Semanal</option>
              <option value='mensual'>Mensual</option>
              <option value='publicidad'>Publicidad</option>
            </select>
          </Field>
        </div>

        <div className='flex justify-end gap-3 mt-6'>
          <button
            className='inline-flex items-center justify-center px-4 py-3 rounded-xl font-semibold border border-neutral-border hover:border-orange-500 text-zinc-300 hover:text-orange-500 transition'
            onClick={onClose}
            type='button'
          >
            Cancelar
          </button>
          <button
            className='inline-flex items-center justify-center px-4 py-3 rounded-xl font-semibold bg-brand hover:bg-brand-dark transition shadow-lg'
            onClick={handleSave}
            type='button'
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

/** Menú inline integrado en el header (UserMenu eliminado por no usarse) */

/** Pantalla de Proyectos */
function ProjectsScreen({
  userName,
  projects,
  onCreateProject,
  onOpen,
  onUpdateProject,
  onDeleteProject,
  onPerfil,
  onConfig,
  onSalir,
}: ProjectsScreenProps) {
  const [showNew, setShowNew] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const hasProjects = projects.length > 0;
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleOpen = useCallback((p: Project) => onOpen && onOpen(p), [onOpen]);
  const projectCards = useMemo(() => (
    projects.map(p => {
      const theme = document.documentElement.getAttribute('data-theme') || 'dark';
      const isLight = theme === 'light';
      const estadoVisible = p.estado;
      // removed unused getInitials helper (avatar shows full project name)
      
      const getAvatarColor = (_name: string) => {
        // Usa el color primario del tema activo
        try {
          const css = getComputedStyle(document.documentElement);
          const v = css.getPropertyValue('--brand').trim();
          if (v) return v;
        } catch {}
        const themeFallback = document.documentElement.getAttribute('data-theme') || 'dark';
        return themeFallback === 'light' ? '#0476D9' : '#f59e0b';
      };

      const getConditionColor = (tipo: string) => {
        const v = tipo?.toLowerCase();
        if (isLight) {
          // Tonalidades de naranja en modo claro
          if (v === 'semanal') return '#ea580c';     // orange-600
          if (v === 'mensual') return '#f59e0b';     // amber-500
          if (v === 'publicidad') return '#fdba74';  // orange-300
          return '#a3a3a3';
        }
        // Paleta azul en oscuro
        if (v === 'semanal') return '#1e3a8a';
        if (v === 'mensual') return '#3b82f6';
        if (v === 'publicidad') return '#60a5fa';
        return '#64748b';
      };

      const getStatusColor = (estado: string) => {
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        const activeColor = theme === 'light' ? '#0476D9' : '#f97316';
        return estado === 'Activo' ? activeColor : '#64748b';
      };

      return (
        <div
          key={p.id}
          role='button'
          tabIndex={0}
          onClick={() => handleOpen(p)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') handleOpen(p);
          }}
          className='relative w-full text-left rounded-2xl border border-neutral-border p-6 transition-all cursor-pointer group hover:border-[var(--hover-border)]'
          style={{
            backgroundColor: 'var(--panel)',
            borderColor: 'var(--border)'
          }}
        >
          {/* Avatar y nombre del proyecto */}
          <div className='flex items-start gap-4 mb-4'>
            <div 
              className='w-12 h-12 rounded-full flex items-center justify-center font-bold text-base px-2 border border-transparent hover:border-[var(--hover-border)] transition'
              style={{backgroundColor: getAvatarColor(p.nombre), color: '#ffffff'}}
            >
              {p.nombre}
            </div>
          </div>

          {/* Detalles del proyecto */}
          <div className='space-y-2 mb-4'>
            <div className='flex items-center gap-2 text-sm' style={{color: isLight ? '#111827' : '#d1d5db'}}>
              <span>📸</span>
              <span>DoP: {p.dop || '—'}</span>
            </div>
            <div className='flex items-center gap-2 text-sm' style={{color: isLight ? '#111827' : '#d1d5db'}}>
              <span>🏠</span>
              <span>Almacén: {p.almacen || '—'}</span>
            </div>
            <div className='flex items-center gap-2 text-sm' style={{color: isLight ? '#111827' : '#d1d5db'}}>
              <span>📽</span>
              <span>Productora: {p.productora || '—'}</span>
            </div>
          </div>

          {/* Tags */}
          <div className='flex flex-wrap gap-2 mb-4'>
            <span 
              className='px-3 py-1 rounded-full text-xs font-medium text-white hover:ring-1 hover:ring-[var(--hover-border)] transition'
              style={{backgroundColor: getConditionColor(p.conditions?.tipo || 'semanal')}}
            >
              {formatMode(p.conditions?.tipo || 'semanal')}
            </span>
            <span 
              className='px-3 py-1 rounded-full text-xs font-medium text-white hover:ring-1 hover:ring-[var(--hover-border)] transition'
              style={{backgroundColor: getStatusColor(estadoVisible)}}
            >
              {estadoVisible}
            </span>
          </div>

          {/* Botones de acción */}
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={e => {
                e.stopPropagation();
                setEditing(p);
              }}
              className='flex-1 px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]'
              style={{
                borderColor: 'var(--border)',
                backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)',
                color: isLight ? '#111827' : '#d1d5db'
              }}
              title='Editar proyecto'
              aria-label={`Editar ${p.nombre}`}
            >
              <span style={{color: isLight ? '#0476D9' : undefined}}>Editar</span>
            </button>
            <button
              type='button'
              onClick={e => {
                e.stopPropagation();
                const ok = window.confirm(`¿Eliminar el proyecto "${p.nombre}"?`);
                if (!ok) return;
                onDeleteProject?.(p.id);
              }}
              className='flex-1 px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]'
              style={{
                borderColor: isLight ? '#fecaca' : '#ef4444',
                color: isLight ? '#b91c1c' : '#fca5a5',
                backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)'
              }}
              title='Eliminar proyecto'
              aria-label={`Eliminar ${p.nombre}`}
            >
              Borrar
            </button>
          </div>
        </div>
      );
    })
  ), [projects, handleOpen]);

  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const isLight = theme === 'light';
  return (
    <>
      {/* Header moderno y prominente */}
      <div className='px-6 py-8' style={{backgroundColor: 'var(--bg)'}}>
        <div className='max-w-6xl mx-auto'>
          {/* Header limpio */}
          <div className='flex items-center justify-between mb-8'>
            <div className='flex items-center gap-6'>
              <LogoIcon size={80} />
              <h1 className='text-3xl font-bold' style={{color: 'var(--text)'}}>
                SetLux <span className='text-gray-300 mx-2' style={{color: (document.documentElement.getAttribute('data-theme')||'dark')==='light' ? '#374151' : '#d1d5db'}}>›</span> <span className='text-gray-300' style={{color: (document.documentElement.getAttribute('data-theme')||'dark')==='light' ? '#374151' : '#d1d5db'}}>Proyectos</span>
              </h1>
            </div>

            {/* Botón Nuevo Proyecto */}
            <div className='flex flex-col items-end gap-2'>
              <button
                onClick={() => setShowNew(true)}
                className='px-6 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg border border-transparent hover:border-[var(--hover-border)]'
                style={{backgroundColor: 'var(--brand)'}}
              >
                Nuevo proyecto
              </button>
              {/* Saludo de bienvenida */}
              <div className='relative' ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className='text-sm text-zinc-300 hover:text-white transition-colors cursor-pointer'
                >
                  <span style={{color: (document.documentElement.getAttribute('data-theme')||'dark')==='light' ? '#111827' : undefined}}>Bienvenido, </span>
                  <span className='font-semibold' style={{color: (document.documentElement.getAttribute('data-theme')||'dark')==='light' ? '#0476D9' : '#f97316'}}>{userName}</span> ✨
                </button>
                
                {/* Menú desplegable */}
                {menuOpen && (
                  <div className='absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50'>
                    <button
                      onClick={() => {
                        onPerfil?.();
                        setMenuOpen(false);
                      }}
                      className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors'
                    >
                      👤 Perfil
                    </button>
                    <button
                      onClick={() => {
                        onConfig?.();
                        setMenuOpen(false);
                      }}
                      className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors'
                    >
                      ⚙️ Configuración
                    </button>
                    <button
                      onClick={() => {
                        onSalir?.();
                        setMenuOpen(false);
                      }}
                      className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors'
                    >
                      🚪 Salir
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Barra de búsqueda y filtros */}
          <div className='flex items-center gap-4'>
            <div className='flex-1 relative'>
              <div className='absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400'>
                🔍
              </div>
              <input
                type='text'
                placeholder='Buscar...'
                className='w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-border focus:outline-none focus:ring-1 focus:ring-orange-500 hover:border-[var(--hover-border)]'
                style={{
                  backgroundColor: 'var(--panel)',
                  color: 'var(--text)',
                  borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'
                }}
              />
            </div>
            <button
              className='px-4 py-3 rounded-xl border border-neutral-border hover:border-[var(--hover-border)] transition'
              style={{
                backgroundColor: 'var(--panel)',
                color: 'var(--text)',
                borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'
              }}
            >
              <span className='flex items-center gap-2'>
                🔽 Filtro
              </span>
            </button>
            <button
              className='px-4 py-3 rounded-xl border border-neutral-border hover:border-[var(--hover-border)] transition'
              style={{
                backgroundColor: 'var(--panel)',
                color: 'var(--text)',
                borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'
              }}
            >
              <span className='flex items-center gap-2'>
                ↕️ Ordenar
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* Grid de proyectos */}
      <div className='max-w-6xl mx-auto p-6'>
        <div
          className={`grid gap-6 ${
            hasProjects ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : ''
          }`}
        >
          {/* Mensaje de bienvenida si no hay proyectos */}
          {!hasProjects && (
            <div className='col-span-full flex flex-col items-center justify-center py-16 px-8 text-center'>
              <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
                ¡Hola, {userName}! 👋
              </h2>
              <p className='text-xl max-w-2xl' style={{color: 'var(--text)', opacity: 0.8}}>
                Para empezar a usar SetLux, <strong>crea tu primer proyecto</strong>.
              </p>
            </div>
          )}


          {/* Tarjetas existentes */}
          {projectCards}

          {editing && (
            <EditProjectModal
              project={editing}
              onClose={() => setEditing(null)}
              onSave={updated => {
                onUpdateProject?.(updated);
                setEditing(null);
              }}
            />
          )}
        </div>
      </div>

      {/* Modal crear proyecto */}
      {showNew && (
        <NewProjectModal
          onClose={() => setShowNew(false)}
          onCreate={proj => {
            onCreateProject(proj);
            setShowNew(false);
            onOpen && onOpen(proj);
          }}
        />
      )}
    </>
  );
}

export default memo(ProjectsScreen);
