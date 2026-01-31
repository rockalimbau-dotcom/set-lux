import { useState, useEffect } from 'react';
import {
  NavLink,
  Outlet,
  useParams,
  useLocation,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Project {
  id: string;
  nombre: string;
}

interface MainLayoutProps {
  project: Project | null;
  onBack: () => void;
}

export default function MainLayout({ project, onBack }: MainLayoutProps) {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const pid = id || project?.id;
  const location = useLocation();
  const isIndex = location.pathname === `/project/${pid}`;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cerrar sidebar al cambiar de ruta en móvil
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Cerrar sidebar al hacer clic fuera en móvil
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        sidebarOpen &&
        !target.closest('aside') &&
        !target.closest('[data-menu-button]')
      ) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevenir scroll del body cuando el sidebar está abierto en móvil
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm ${
      isActive
        ? 'bg-brand/20 text-brand border border-brand/30'
        : 'border border-neutral-border hover:border-brand text-zinc-300'
    }`;

  return (
    <div className='min-h-screen bg-neutral-bg text-neutral-text pb-12'>
      {/* Botón de menú hamburguesa para móvil/tablet */}
      <button
        data-menu-button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className='lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg border border-neutral-border hover:border-brand bg-neutral-panel transition-colors'
        aria-label={sidebarOpen ? t('common.closeMenu') : t('common.openMenu')}
        aria-expanded={sidebarOpen}
      >
        <svg
          className='w-6 h-6'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'
        >
          {sidebarOpen ? (
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          ) : (
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 6h16M4 12h16M4 18h16'
            />
          )}
        </svg>
      </button>

      {/* Overlay para móvil/tablet */}
      {sidebarOpen && (
        <div
          className='lg:hidden fixed inset-0 bg-black/50 z-40'
          onClick={() => setSidebarOpen(false)}
          aria-hidden='true'
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 lg:w-[260px] bg-neutral-bg border-r border-neutral-border p-4 space-y-4 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } overflow-y-auto`}
      >
        <button
          onClick={() => {
            onBack();
            setSidebarOpen(false);
          }}
          className='w-full px-3 py-2 rounded-lg border border-neutral-border hover:border-brand text-sm'
        >
          ← {t('common.backToProjects')}
        </button>

        <div className='text-xs text-zinc-400'>{t('common.project')}</div>
        <div className='text-sm font-semibold break-words'>
          {project?.nombre || t('common.project')}
        </div>

        {!isIndex && (
          <nav className='pt-2 space-y-2'>
            <NavLink
              to={`/project/${pid}/calendario`}
              className={linkCls}
              end
              onClick={() => setSidebarOpen(false)}
            >
              {t('navigation.needs')}
            </NavLink>
            <NavLink
              to={`/project/${pid}/equipo`}
              className={linkCls}
              end
              onClick={() => setSidebarOpen(false)}
            >
              {t('navigation.team')}
            </NavLink>
            <NavLink
              to={`/project/${pid}/reportes`}
              className={linkCls}
              end
              onClick={() => setSidebarOpen(false)}
            >
              {t('navigation.reports')}
            </NavLink>
            <NavLink
              to={`/project/${pid}/nomina`}
              className={linkCls}
              end
              onClick={() => setSidebarOpen(false)}
            >
              {t('navigation.payroll')}
            </NavLink>
          </nav>
        )}
      </aside>

      {/* Contenido principal */}
      <main className='lg:ml-[260px] p-4 lg:p-5 pt-0 lg:pt-0'>
        <Outlet />
      </main>
    </div>
  );
}
