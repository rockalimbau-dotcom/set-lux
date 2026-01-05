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
    <div className='px-6 pb-6'>
      <div className='max-w-6xl mx-auto'>
        <div
          className={`grid gap-6 ${
            hasProjects ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : ''
          }`}
        >
          {/* Mensaje de bienvenida si no hay proyectos o no hay resultados de búsqueda */}
          {projects.length === 0 && (
            <div className='col-span-full flex flex-col items-center justify-center py-16 px-8 text-center'>
              {!hasProjects ? (
                <>
                  <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
                    {t('common.hello', { name: userName })}
                  </h2>
                  <p className='text-xl max-w-2xl' style={{color: 'var(--text)', opacity: 0.8}}>
                    <span dangerouslySetInnerHTML={{ __html: t('common.getStartedStrong') }} />
                  </p>
                </>
              ) : (
                <>
                  <h2 className='text-2xl font-bold mb-4' style={{color: 'var(--text)'}}>
                    {t('common.noResults')}
                  </h2>
                  <p className='text-lg max-w-2xl' style={{color: 'var(--text)', opacity: 0.8}}>
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

