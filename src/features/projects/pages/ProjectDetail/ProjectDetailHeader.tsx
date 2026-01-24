import LogoIcon from '@shared/components/LogoIcon';
import { ThemeToggleButton } from '@app/App/ThemeToggleButton';
import { Project, ProjectTab } from './ProjectDetailTypes';

interface ProjectDetailHeaderProps {
  project: Project;
  activeTab: ProjectTab | null;
  activePhaseLabel: string;
  isActive: boolean;
  estadoText: string;
  estadoBg: string;
  onNavigateAway: () => void;
  onNavigateToProject: () => void;
  onStatusClick: () => void;
  t: (key: string) => string;
}

export function ProjectDetailHeader({
  project,
  activeTab,
  activePhaseLabel,
  isActive,
  estadoText,
  estadoBg,
  onNavigateAway,
  onNavigateToProject,
  onStatusClick,
  t,
}: ProjectDetailHeaderProps) {
  return (
    <div className='px-5 sm:px-6 md:px-7 lg:px-8 xl:px-6' style={{backgroundColor: 'var(--bg)', minHeight: 'auto', position: 'relative', contain: 'layout style', marginTop: 0, paddingTop: '1.5rem', paddingBottom: '0.5rem', zIndex: 10}}>
      <div className='max-w-6xl mx-auto' style={{position: 'relative', contain: 'layout', zIndex: 10}}>
        <div className='flex items-center justify-between mb-2 sm:mb-3 md:mb-4 lg:mb-6 xl:mb-8' style={{minHeight: 'auto', position: 'relative', contain: 'layout', zIndex: 10}}>
          <div className='flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-6' style={{position: 'relative', willChange: 'auto', transform: 'translateZ(0)'}}>
            <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20' style={{position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: 'translateZ(0)'}}>
              <LogoIcon size={32} className='sm:!w-[40px] sm:!h-[40px] md:!w-[48px] md:!h-[48px] lg:!w-[64px] lg:!h-[64px] xl:!w-[80px] xl:!h-[80px]' onClick={onNavigateAway} />
            </div>
            <h1 className='text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold' style={{color: 'var(--text)'}}>
              <button 
                onClick={onNavigateAway}
                className='hover:underline transition-all'
                style={{color: 'var(--text)'}}
              >
                {t('common.projects')}
              </button>
              <span className='mx-0.5 sm:mx-1 md:mx-1.5 lg:mx-2' style={{color: 'var(--text)'}}>›</span>
              {activePhaseLabel ? (
                <button 
                  onClick={onNavigateToProject}
                  className='hover:underline transition-all'
                  style={{color: 'var(--text)'}}
                >
                  {project?.nombre}
                </button>
              ) : (
                <span style={{color: 'var(--text)'}}>
                  {project?.nombre}
                </span>
              )}
              {activePhaseLabel && (
                <>
                  <span className='mx-0.5 sm:mx-1 md:mx-1.5 lg:mx-2' style={{color: 'var(--text)'}}>›</span>
                  <span style={{color: 'var(--text)'}}>{activePhaseLabel}</span>
                </>
              )}
            </h1>
          </div>

          {/* Contenedor derecho con altura fija para evitar movimiento del logo */}
          <div className='flex items-center gap-2' style={{minHeight: 'auto', justifyContent: 'flex-start'}}>
            <ThemeToggleButton />
            <span
              onClick={onStatusClick}
              data-tutorial='project-status'
              className='px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 rounded sm:rounded-md md:rounded-lg text-[10px] sm:text-xs font-medium border cursor-pointer'
              style={{backgroundColor: estadoBg, borderColor: estadoBg, color: '#ffffff'}}
              title={t('projectDetail.changeStatus', { status: estadoText })}
            >
              {estadoText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

