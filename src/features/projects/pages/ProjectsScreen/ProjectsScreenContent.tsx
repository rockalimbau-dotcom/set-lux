import { useTranslation } from 'react-i18next';
import { Project } from '../../types';
import { ProjectCard } from './ProjectCard';

interface ProjectsScreenContentProps {
  projects: Project[];
  hasProjects: boolean;
  onOpen: (p: Project) => void;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
  userName: string;
}

export function ProjectsScreenContent({
  projects,
  hasProjects,
  onOpen,
  onEdit,
  onDelete,
  userName,
}: ProjectsScreenContentProps) {
  const { t } = useTranslation();

  return (
    <div className='px-5 sm:px-6 md:px-7 lg:px-8 xl:px-6 pb-1 sm:pb-1.5 md:pb-2.5 lg:pb-4 xl:pb-6'>
      <div className='max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-6xl mx-auto'>
        <div
          className={`grid gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 xl:gap-5 ${
            hasProjects ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : ''
          }`}
        >
          {/* Mensaje de bienvenida si no hay proyectos o no hay resultados de búsqueda */}
          {projects.length === 0 && (
            <div className='col-span-full flex flex-col items-center justify-center py-3 sm:py-4 md:py-6 lg:py-8 xl:py-12 px-1.5 sm:px-2 md:px-3 lg:px-5 xl:px-8 text-center'>
              {!hasProjects ? (
                <>
                  <h2 className='text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold mb-1 sm:mb-1.5 md:mb-2 lg:mb-2.5 xl:mb-4' style={{color: 'var(--text)'}}>
                    {t('common.hello', { name: userName })}
                  </h2>
                  <p className='text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg max-w-2xl' style={{color: 'var(--text)', opacity: 0.8}}>
                    <span dangerouslySetInnerHTML={{ __html: t('common.getStartedStrong') }} />
                  </p>
                </>
              ) : (
                <>
                  <h2 className='text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold mb-1 sm:mb-1.5 md:mb-2 lg:mb-2.5 xl:mb-4' style={{color: 'var(--text)'}}>
                    {t('common.noResults')}
                  </h2>
                  <p className='text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base max-w-2xl' style={{color: 'var(--text)', opacity: 0.8}}>
                    {t('common.noResultsDescription')}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Tarjetas existentes */}
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={onOpen}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

