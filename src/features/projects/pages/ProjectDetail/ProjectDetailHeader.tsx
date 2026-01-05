import LogoIcon from '@shared/components/LogoIcon';
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
    <div 
      className='px-6 pt-16 pb-8 lg:pt-8 lg:pb-8' 
      style={{
        backgroundColor: 'var(--bg)', 
        minHeight: '120px', 
        position: 'relative', 
        contain: 'layout style', 
        marginTop: 0
      }}
    >
      <div className='max-w-6xl mx-auto' style={{position: 'relative', contain: 'layout'}}>
        <div className='flex items-center justify-between mb-8' style={{minHeight: '80px', position: 'relative', contain: 'layout'}}>
          <div className='flex items-center gap-6' style={{position: 'relative', willChange: 'auto', transform: 'translateZ(0)'}}>
            <div style={{width: '80px', height: '80px', position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: 'translateZ(0)'}}>
              <LogoIcon size={80} onClick={onNavigateAway} />
            </div>
            <h1 className='text-3xl font-bold' style={{color: 'var(--text)'}}>
              <button 
                onClick={onNavigateAway}
                className='hover:underline transition-all'
                style={{color: 'var(--text)'}}
              >
                {t('common.projects')}
              </button>
              <span className='mx-2' style={{color: 'var(--text)'}}>›</span>
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
                  <span className='mx-2' style={{color: 'var(--text)'}}>›</span>
                  <span style={{color: 'var(--text)'}}>{activePhaseLabel}</span>
                </>
              )}
            </h1>
          </div>

          {/* Contenedor derecho con altura fija para evitar movimiento del logo */}
          <div className='flex flex-col items-end gap-2' style={{minHeight: '60px', justifyContent: 'flex-start'}}>
            <span
              onClick={onStatusClick}
              className={`px-3 py-2 rounded-lg text-xs font-medium border cursor-pointer`}
              style={{backgroundColor: estadoBg, borderColor: estadoBg, color: '#ffffff'}}
              title={t('projectDetail.changeStatus', { status: estadoText })}
            >
              {estadoText}
            </span>
            {/* Espaciador invisible para mantener la altura */}
            <div style={{height: '20px', visibility: 'hidden'}} aria-hidden="true">
              &nbsp;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

