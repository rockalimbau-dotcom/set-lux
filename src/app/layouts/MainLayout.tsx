import React from 'react';
import {
  NavLink,
  Outlet,
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom';

interface Project {
  id: string;
  nombre: string;
}

interface MainLayoutProps {
  project: Project | null;
  onBack: () => void;
}

export default function MainLayout({ project, onBack }: MainLayoutProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const pid = id || project?.id;
  const location = useLocation();
  const isIndex = location.pathname === `/project/${pid}`;

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm ${
      isActive
        ? 'bg-brand/20 text-brand border border-brand/30'
        : 'border border-neutral-border hover:border-brand text-zinc-300'
    }`;

  return (
    <div className='min-h-screen grid grid-cols-[260px_1fr] bg-neutral-bg text-neutral-text'>
      <aside className='border-r border-neutral-border p-4 space-y-4'>
        <button
          onClick={onBack}
          className='w-full px-3 py-2 rounded-lg border border-neutral-border hover:border-brand text-sm'
        >
          ← Volver a proyectos
        </button>

        <div className='text-xs text-zinc-400'>Proyecto</div>
        <div className='text-sm font-semibold break-words'>
          {project?.nombre || 'Proyecto'}
        </div>

        {!isIndex && (
          <nav className='pt-2 space-y-2'>
            <NavLink
              to={`/project/${pid}/planificacion`}
              className={linkCls}
              end
            >
              Planificación
            </NavLink>
            <NavLink to={`/project/${pid}/equipo`} className={linkCls} end>
              Equipo
            </NavLink>
            <NavLink to={`/project/${pid}/necesidades`} className={linkCls} end>
              Necesidades
            </NavLink>
            <NavLink to={`/project/${pid}/reportes`} className={linkCls} end>
              Reportes
            </NavLink>
            <NavLink to={`/project/${pid}/nomina`} className={linkCls} end>
              Nómina
            </NavLink>
          </nav>
        )}
      </aside>

      <main className='p-5'>
        <Outlet />
      </main>
    </div>
  );
}
