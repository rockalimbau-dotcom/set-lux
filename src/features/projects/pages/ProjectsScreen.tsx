import LogoIcon from '@shared/components/LogoIcon';
import { useEffect, useRef, useState, useMemo, memo, useCallback } from 'react';

export type ProjectMode = 'semanal' | 'mensual' | 'publicidad';
export type ProjectStatus = 'Activo' | 'Cerrado';

const COUNTRIES = [
  { code: 'ES', name: 'España' },
  { code: 'FR', name: 'Francia' },
  { code: 'IT', name: 'Italia' },
  { code: 'DE', name: 'Alemania' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CL', name: 'Chile' },
];

const REGIONS = {
  ES: [
    { code: 'AN', name: 'Andalucía' },
    { code: 'AR', name: 'Aragón' },
    { code: 'AS', name: 'Asturias' },
    { code: 'CN', name: 'Canarias' },
    { code: 'CB', name: 'Cantabria' },
    { code: 'CM', name: 'Castilla-La Mancha' },
    { code: 'CL', name: 'Castilla y León' },
    { code: 'CT', name: 'Cataluña' },
    { code: 'EX', name: 'Extremadura' },
    { code: 'GA', name: 'Galicia' },
    { code: 'IB', name: 'Islas Baleares' },
    { code: 'RI', name: 'La Rioja' },
    { code: 'MD', name: 'Madrid' },
    { code: 'MC', name: 'Región de Murcia' },
    { code: 'NC', name: 'Navarra' },
    { code: 'PV', name: 'País Vasco' },
    { code: 'VC', name: 'Comunidad Valenciana' },
    { code: 'CE', name: 'Ceuta' },
    { code: 'ML', name: 'Melilla' },
  ],
  FR: [
    { code: 'IDF', name: 'Île-de-France' },
    { code: 'PACA', name: 'Provence-Alpes-Côte d\'Azur' },
  ],
  US: [
    { code: 'CA', name: 'California' },
    { code: 'NY', name: 'Nueva York' },
    { code: 'TX', name: 'Texas' },
  ],
};

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
  country?: string;
  region?: string;
}

export interface ProjectForm {
  nombre: string;
  dop: string;
  almacen: string;
  productora: string;
  estado: ProjectStatus;
  condicionesTipo: ProjectMode;
  country: string;
  region: string;
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
    country: 'ES',
    region: 'CT',
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
          <Field label='País'>
            <select
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={form.country}
              onChange={e => {
                setForm({ ...form, country: e.target.value, region: '' });
              }}
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          {REGIONS[form.country as keyof typeof REGIONS] && (
            <Field label='Región (opcional)'>
              <select
                className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-blue-500'
                value={form.region}
                onChange={e => setForm({ ...form, region: e.target.value })}
              >
                <option value=''>Sin región específica</option>
                {REGIONS[form.country as keyof typeof REGIONS].map(r => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
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
                country: form.country || 'ES',
                region: form.region || 'CT',
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
    country: project?.country || 'ES',
    region: project?.region || 'CT',
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
      country: form.country || 'ES',
      region: form.region || 'CT',
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
          <Field label='País'>
            <select
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={form.country}
              onChange={e => {
                setForm({ ...form, country: e.target.value, region: '' });
              }}
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          {REGIONS[form.country as keyof typeof REGIONS] && (
            <Field label='Región (opcional)'>
              <select
                className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-blue-500'
                value={form.region}
                onChange={e => setForm({ ...form, region: e.target.value })}
              >
                <option value=''>Sin región específica</option>
                {REGIONS[form.country as keyof typeof REGIONS].map(r => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'Todos'>('Todos');
  const [filterType, setFilterType] = useState<ProjectMode | 'Todos'>('Todos');
  const [sortBy, setSortBy] = useState<'nombre' | 'estado' | 'tipo'>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const hasProjects = projects.length > 0;
  const menuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setFilterMenuOpen(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    };

    if (menuOpen || filterMenuOpen || sortMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen, filterMenuOpen, sortMenuOpen]);

  const handleOpen = useCallback((p: Project) => onOpen && onOpen(p), [onOpen]);
  
  // Filtrar y ordenar proyectos
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Aplicar búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.nombre.toLowerCase().includes(query) ||
        (p.dop && p.dop.toLowerCase().includes(query)) ||
        (p.almacen && p.almacen.toLowerCase().includes(query)) ||
        (p.productora && p.productora.toLowerCase().includes(query))
      );
    }

    // Aplicar filtros
    if (filterStatus !== 'Todos') {
      filtered = filtered.filter(p => p.estado === filterStatus);
    }
    if (filterType !== 'Todos') {
      filtered = filtered.filter(p => p.conditions?.tipo === filterType);
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'nombre') {
        comparison = a.nombre.localeCompare(b.nombre);
      } else if (sortBy === 'estado') {
        comparison = a.estado.localeCompare(b.estado);
      } else if (sortBy === 'tipo') {
        const tipoA = a.conditions?.tipo || 'semanal';
        const tipoB = b.conditions?.tipo || 'semanal';
        comparison = tipoA.localeCompare(tipoB);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [projects, searchQuery, filterStatus, filterType, sortBy, sortOrder]);

  const projectCards = useMemo(() => (
    filteredAndSortedProjects.map(p => {
      const theme = document.documentElement.getAttribute('data-theme') || 'light';
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
        const theme = document.documentElement.getAttribute('data-theme') || 'light';
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
  ), [filteredAndSortedProjects, handleOpen]);

  const theme = document.documentElement.getAttribute('data-theme') || 'light';
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
                placeholder='Buscar por nombre, DoP, almacén, productora...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-border focus:outline-none focus:ring-1 focus:ring-orange-500 hover:border-[var(--hover-border)]'
                style={{
                  backgroundColor: 'var(--panel)',
                  color: 'var(--text)',
                  borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'
                }}
              />
            </div>
            <div className='relative' ref={filterMenuRef}>
              <button
                onClick={() => {
                  setFilterMenuOpen(!filterMenuOpen);
                  setSortMenuOpen(false);
                }}
                className='px-4 py-3 rounded-xl border border-neutral-border hover:border-[var(--hover-border)] transition'
                style={{
                  backgroundColor: 'var(--panel)',
                  color: 'var(--text)',
                  borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'
                }}
              >
                <span className='flex items-center gap-2'>
                  🔽 Filtro
                  {(filterStatus !== 'Todos' || filterType !== 'Todos') && (
                    <span className='w-2 h-2 rounded-full bg-orange-500'></span>
                  )}
                </span>
              </button>
              
              {filterMenuOpen && (
                <div 
                  className='absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg border border-neutral-border py-2 z-50'
                  style={{
                    backgroundColor: 'var(--panel)',
                    borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'
                  }}
                >
                  <div className='px-4 py-2 border-b border-neutral-border' style={{borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'}}>
                    <span className='text-sm font-semibold' style={{color: 'var(--text)'}}>Estado</span>
                  </div>
                  <button
                    onClick={() => {
                      setFilterStatus('Todos');
                      setFilterMenuOpen(false);
                    }}
                    className='w-full text-left px-4 py-2 text-sm hover:bg-black/20 transition-colors'
                    style={{color: 'var(--text)'}}
                  >
                    {filterStatus === 'Todos' ? '✓ ' : '  '}Todos
                  </button>
                  <button
                    onClick={() => {
                      setFilterStatus('Activo');
                      setFilterMenuOpen(false);
                    }}
                    className='w-full text-left px-4 py-2 text-sm hover:bg-black/20 transition-colors'
                    style={{color: 'var(--text)'}}
                  >
                    {filterStatus === 'Activo' ? '✓ ' : '  '}Activo
                  </button>
                  <button
                    onClick={() => {
                      setFilterStatus('Cerrado');
                      setFilterMenuOpen(false);
                    }}
                    className='w-full text-left px-4 py-2 text-sm hover:bg-black/20 transition-colors'
                    style={{color: 'var(--text)'}}
                  >
                    {filterStatus === 'Cerrado' ? '✓ ' : '  '}Cerrado
                  </button>
                  
                  <div className='px-4 py-2 border-t border-neutral-border mt-2' style={{borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'}}>
                    <span className='text-sm font-semibold' style={{color: 'var(--text)'}}>Tipo</span>
                  </div>
                  <button
                    onClick={() => {
                      setFilterType('Todos');
                      setFilterMenuOpen(false);
                    }}
                    className='w-full text-left px-4 py-2 text-sm hover:bg-black/20 transition-colors'
                    style={{color: 'var(--text)'}}
                  >
                    {filterType === 'Todos' ? '✓ ' : '  '}Todos
                  </button>
                  <button
                    onClick={() => {
                      setFilterType('semanal');
                      setFilterMenuOpen(false);
                    }}
                    className='w-full text-left px-4 py-2 text-sm hover:bg-black/20 transition-colors'
                    style={{color: 'var(--text)'}}
                  >
                    {filterType === 'semanal' ? '✓ ' : '  '}Semanal
                  </button>
                  <button
                    onClick={() => {
                      setFilterType('mensual');
                      setFilterMenuOpen(false);
                    }}
                    className='w-full text-left px-4 py-2 text-sm hover:bg-black/20 transition-colors'
                    style={{color: 'var(--text)'}}
                  >
                    {filterType === 'mensual' ? '✓ ' : '  '}Mensual
                  </button>
                  <button
                    onClick={() => {
                      setFilterType('publicidad');
                      setFilterMenuOpen(false);
                    }}
                    className='w-full text-left px-4 py-2 text-sm hover:bg-black/20 transition-colors'
                    style={{color: 'var(--text)'}}
                  >
                    {filterType === 'publicidad' ? '✓ ' : '  '}Publicidad
                  </button>
                </div>
              )}
            </div>
            
            <div className='relative' ref={sortMenuRef}>
              <button
                onClick={() => {
                  setSortMenuOpen(!sortMenuOpen);
                  setFilterMenuOpen(false);
                }}
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
              
              {sortMenuOpen && (
                <div 
                  className='absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg border border-neutral-border py-2 z-50'
                  style={{
                    backgroundColor: 'var(--panel)',
                    borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'
                  }}
                >
                  <div className='px-4 py-2 border-b border-neutral-border' style={{borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'}}>
                    <span className='text-sm font-semibold' style={{color: 'var(--text)'}}>Ordenar por</span>
                  </div>
                  <button
                    onClick={() => {
                      setSortBy('nombre');
                      setSortMenuOpen(false);
                    }}
                    className='w-full text-left px-4 py-2 text-sm hover:bg-black/20 transition-colors'
                    style={{color: 'var(--text)'}}
                  >
                    {sortBy === 'nombre' ? '✓ ' : '  '}Nombre
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('estado');
                      setSortMenuOpen(false);
                    }}
                    className='w-full text-left px-4 py-2 text-sm hover:bg-black/20 transition-colors'
                    style={{color: 'var(--text)'}}
                  >
                    {sortBy === 'estado' ? '✓ ' : '  '}Estado
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('tipo');
                      setSortMenuOpen(false);
                    }}
                    className='w-full text-left px-4 py-2 text-sm hover:bg-black/20 transition-colors'
                    style={{color: 'var(--text)'}}
                  >
                    {sortBy === 'tipo' ? '✓ ' : '  '}Tipo
                  </button>
                  
                  <div className='px-4 py-2 border-t border-neutral-border mt-2' style={{borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'}}>
                    <span className='text-sm font-semibold' style={{color: 'var(--text)'}}>Orden</span>
                  </div>
                  <button
                    onClick={() => {
                      setSortOrder('asc');
                      setSortMenuOpen(false);
                    }}
                    className='w-full text-left px-4 py-2 text-sm hover:bg-black/20 transition-colors'
                    style={{color: 'var(--text)'}}
                  >
                    {sortOrder === 'asc' ? '✓ ' : '  '}Ascendente
                  </button>
                  <button
                    onClick={() => {
                      setSortOrder('desc');
                      setSortMenuOpen(false);
                    }}
                    className='w-full text-left px-4 py-2 text-sm hover:bg-black/20 transition-colors'
                    style={{color: 'var(--text)'}}
                  >
                    {sortOrder === 'desc' ? '✓ ' : '  '}Descendente
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Grid de proyectos */}
      <div className='px-6 pb-6'>
        <div className='max-w-6xl mx-auto'>
          <div
            className={`grid gap-6 ${
              hasProjects ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : ''
            }`}
          >
          {/* Mensaje de bienvenida si no hay proyectos o no hay resultados de búsqueda */}
          {filteredAndSortedProjects.length === 0 && (
            <div className='col-span-full flex flex-col items-center justify-center py-16 px-8 text-center'>
              {!hasProjects ? (
                <>
                  <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
                    ¡Hola, {userName}! 👋
                  </h2>
                  <p className='text-xl max-w-2xl' style={{color: 'var(--text)', opacity: 0.8}}>
                    Para empezar a usar SetLux, <strong>crea tu primer proyecto</strong>.
                  </p>
                </>
              ) : (
                <>
                  <h2 className='text-2xl font-bold mb-4' style={{color: 'var(--text)'}}>
                    No se encontraron proyectos
                  </h2>
                  <p className='text-lg max-w-2xl' style={{color: 'var(--text)', opacity: 0.8}}>
                    Intenta ajustar los filtros o la búsqueda para ver más resultados.
                  </p>
                </>
              )}
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
