import LogoSetLux from '@shared/components/LogoSetLux';
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
  onOpenUsuario?: () => void;
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
        <h3 className='text-lg font-semibold mb-4 text-brand'>
          Nuevo proyecto
        </h3>
        <div className='grid grid-cols-2 gap-4'>
          <Field label='Proyecto'>
            <input
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
            />
          </Field>
          <Field label='DoP'>
            <input
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
              value={form.dop}
              onChange={e => setForm({ ...form, dop: e.target.value })}
            />
          </Field>
          <Field label='Almacén'>
            <input
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
              value={form.almacen}
              onChange={e => setForm({ ...form, almacen: e.target.value })}
            />
          </Field>
          <Field label='Productora'>
            <input
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
              value={form.productora}
              onChange={e => setForm({ ...form, productora: e.target.value })}
            />
          </Field>
          <Field label='Estado'>
            <select
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
              value={form.estado}
              onChange={e => setForm({ ...form, estado: e.target.value as ProjectStatus })}
            >
              <option>Activo</option>
              <option>Cerrado</option>
            </select>
          </Field>
          <Field label='Condiciones'>
            <select
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
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
            className='inline-flex items-center justify-center px-4 py-3 rounded-xl font-semibold border border-neutral-border hover:border-brand text-zinc-300 hover:text-brand transition'
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
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
            />
          </Field>

          <Field label='DoP'>
            <input
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
              value={form.dop}
              onChange={e => setForm({ ...form, dop: e.target.value })}
            />
          </Field>

          <Field label='Almacén'>
            <input
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
              value={form.almacen}
              onChange={e => setForm({ ...form, almacen: e.target.value })}
            />
          </Field>

          <Field label='Productora'>
            <input
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
              value={form.productora}
              onChange={e => setForm({ ...form, productora: e.target.value })}
            />
          </Field>

          <Field label='Estado'>
            <select
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
              value={form.estado}
              onChange={e => setForm({ ...form, estado: e.target.value as ProjectStatus })}
            >
              <option>Activo</option>
              <option>Cerrado</option>
            </select>
          </Field>

          <Field label='Tipo de condiciones'>
            <select
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
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
            className='inline-flex items-center justify-center px-4 py-3 rounded-xl font-semibold border border-neutral-border hover:border-brand text-zinc-300 hover:text-brand transition'
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

/** Menú de usuario (mínimo, sin cambiar estética) */
interface UserMenuProps {
  onPerfil?: () => void;
  onConfig?: () => void;
  onSalir?: () => void;
  onClose?: () => void;
}

function UserMenu({ onPerfil, onConfig, onSalir, onClose }: UserMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // cerrar con click fuera / ESC
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose?.();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className='absolute right-0 mt-2 w-48 rounded-2xl border border-neutral-border bg-neutral-panel/90 shadow-lg z-40'
    >
      <button
        className='w-full text-left px-4 py-3 rounded-t-2xl hover:bg-black/40 transition'
        onClick={() => {
          onPerfil?.();
          onClose?.();
        }}
      >
        Perfil
      </button>
      <button
        className='w-full text-left px-4 py-3 hover:bg-black/40 transition'
        onClick={() => {
          onConfig?.();
          onClose?.();
        }}
      >
        Configuración
      </button>
      <button
        className='w-full text-left px-4 py-3 rounded-b-2xl hover:bg-black/40 transition text-red-400 hover:text-red-300'
        onClick={() => {
          onSalir?.();
          onClose?.();
        }}
      >
        Salir
      </button>
    </div>
  );
}

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
  onOpenUsuario,
}: ProjectsScreenProps) {
  const [showNew, setShowNew] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const hasProjects = projects.length > 0;

  const handleOpen = useCallback((p: Project) => onOpen && onOpen(p), [onOpen]);
  const projectCards = useMemo(() => (
    projects.map(p => {
      const estadoVisible = p.estado;
      return (
        <div
          key={p.id}
          role='button'
          tabIndex={0}
          onClick={() => handleOpen(p)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') handleOpen(p);
          }}
          className='relative w-full text-left rounded-2xl border border-neutral-border bg-neutral-panel/90 p-5 transition hover:border-accent hover:shadow-[0_0_24px_rgba(245,158,11,0.18)] cursor-pointer'
        >
          <h3 className='text-lg font-semibold text-brand mb-1'>
            {p.nombre}
          </h3>

          <div className='text-sm text-zinc-400 space-y-0.5'>
            <p>📸 DoP: {p.dop || '—'}</p>
            <p>🏠 Almacén: {p.almacen || '—'}</p>
            <p>📽 Productora: {p.productora || '—'}</p>
            <p>
              ⚙️ Condiciones: {formatMode(p.conditions?.tipo || 'semanal')}
            </p>
            <p>📌 Estado: {estadoVisible}</p>
          </div>

          <div className='absolute bottom-3 right-3 flex gap-2'>
            <button
              type='button'
              onClick={e => {
                e.stopPropagation();
                setEditing(p);
              }}
              className='text-xs px-2 py-1 rounded-lg border border-neutral-border hover:border-accent text-zinc-300 hover:text-brand bg-black/30'
              title='Editar proyecto'
              aria-label={`Editar ${p.nombre}`}
            >
              ✏️ Editar
            </button>
            <button
              type='button'
              onClick={e => {
                e.stopPropagation();
                const ok = window.confirm(`¿Eliminar el proyecto "${p.nombre}"?`);
                if (!ok) return;
                onDeleteProject?.(p.id);
              }}
              className='text-xs px-2 py-1 rounded-lg border border-neutral-border hover:border-red-500 text-red-300 hover:text-red-200 bg-black/30'
              title='Eliminar proyecto'
              aria-label={`Eliminar ${p.nombre}`}
            >
              🗑️ Borrar
            </button>
          </div>
        </div>
      );
    })
  ), [projects, handleOpen]);

  return (
    <>
      {/* Header unificado en negro */}
      <div className='px-6 py-6 bg-[#0D0D0D]'>
        <div className='max-w-5xl mx-auto flex flex-col items-center gap-4'>
          <LogoSetLux />
          <div className='flex items-center justify-between w-full relative'>
            <h2 className='text-xl font-bold tracking-wide text-brand'>
              Proyectos
            </h2>

            {/* Bloque Bienvenida + menú */}
            <div className='text-sm text-zinc-300 relative'>
              Bienvenido,{` `}
              <button
                type='button'
                className='font-bold text-accent underline-offset-2 hover:underline'
                title='Abrir menú de usuario'
                onClick={() => setMenuOpen(v => !v)}
              >
                {userName}
              </button>{` `}
              <span role='img' aria-label='sonrisa'>🙂</span>{` `}
              <span role='img' aria-label='rayo'>⚡</span>
              {menuOpen && (
                <UserMenu
                  onPerfil={() => {
                    if (onOpenUsuario) onOpenUsuario();
                    else onPerfil?.();
                  }}
                  onConfig={onConfig}
                  onSalir={onSalir}
                  onClose={() => setMenuOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid de proyectos */}
      <div className='max-w-5xl mx-auto p-6'>
        <div
          className={`grid gap-4 ${
            hasProjects ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : ''
          }`}
        >
          {/* Tarjeta + grande si no hay proyectos */}
          {!hasProjects && (
            <div
              className='grid place-items-center rounded-2xl border-2 border-dashed border-neutral-border bg-neutral-surface cursor-pointer transition aspect-[4/3] text-5xl text-brand hover:border-accent hover:shadow-[0_0_24px_rgba(245,158,11,0.25)]'
              onClick={() => setShowNew(true)}
              title='Añadir proyecto'
            >
              +
            </div>
          )}

          {/* Si hay proyectos, mantenemos tarjeta + como primera */}
          {hasProjects && (
            <button
              onClick={() => setShowNew(true)}
              className='grid place-items-center rounded-2xl border-2 border-dashed border-neutral-border bg-neutral-surface cursor-pointer transition aspect-[4/3] text-4xl text-brand hover:border-accent hover:shadow-[0_0_24px_rgba(245,158,11,0.25)]'
              title='Añadir proyecto'
            >
              +
            </button>
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
