import { useTranslation } from 'react-i18next';
import { Project } from '../../types';
import {
  formatMode,
  getAvatarColor,
  getConditionColor,
  getConditionTextColor,
  getStatusColor,
} from './ProjectsScreenUtils';

interface ProjectCardProps {
  project: Project;
  onOpen: (p: Project) => void;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
}

export function ProjectCard({ project, onOpen, onEdit, onDelete }: ProjectCardProps) {
  const { t } = useTranslation();
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  const isLight = theme === 'light';
  const estadoVisible = project.estado === 'Activo' ? t('common.active') : t('common.closed');

  const handleOpen = () => onOpen(project);
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(project);
  };
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project);
  };

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') handleOpen();
      }}
      className='relative w-full text-left rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-5 transition-all cursor-pointer group hover:border-[var(--hover-border)]'
      style={{
        backgroundColor: 'var(--panel)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Avatar y nombre del proyecto */}
      <div className='flex items-start gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 xl:gap-4 mb-2 sm:mb-1.5 md:mb-2 lg:mb-2.5 xl:mb-4'>
        <div 
          className='w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 xl:w-12 xl:h-12 rounded-full flex items-center justify-center font-bold text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-base px-0.5 sm:px-1 md:px-1.5 lg:px-2 border border-transparent pointer-events-none'
          style={{backgroundColor: getAvatarColor(project.nombre), color: '#ffffff'}}
        >
          {project.nombre}
        </div>
      </div>

      {/* Detalles del proyecto */}
      <div className='space-y-1.5 sm:space-y-0.5 md:space-y-0.5 lg:space-y-1 xl:space-y-2 mb-2 sm:mb-1.5 md:mb-2 lg:mb-2.5 xl:mb-4'>
        <div className='flex items-center gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm' style={{color: isLight ? '#111827' : '#d1d5db'}}>
          <span className='text-[9px] sm:text-[10px] md:text-xs lg:text-sm'>📸</span>
          <span>{t('common.dopLabel')} {project.dop || '—'}</span>
        </div>
        <div className='flex items-center gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm' style={{color: isLight ? '#111827' : '#d1d5db'}}>
          <span className='text-[9px] sm:text-[10px] md:text-xs lg:text-sm'>🏠</span>
          <span>{t('common.warehouseLabel')} {project.almacen || '—'}</span>
        </div>
        <div className='flex items-center gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm' style={{color: isLight ? '#111827' : '#d1d5db'}}>
          <span className='text-[9px] sm:text-[10px] md:text-xs lg:text-sm'>📽</span>
          <span>{t('common.productionLabel')} {project.productora || '—'}</span>
        </div>
      </div>

      {/* Tags */}
      <div className='flex flex-wrap gap-0 sm:gap-0.5 md:gap-1 lg:gap-1.5 xl:gap-2 mb-2 sm:mb-1.5 md:mb-2 lg:mb-2.5 xl:mb-4 pointer-events-none'>
        <span 
          className='px-1.5 sm:px-2 md:px-2.5 lg:px-3 py-0 sm:py-0.5 md:py-1 rounded-full text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-medium'
          style={{
            backgroundColor: getConditionColor(project.conditions?.tipo || 'semanal', isLight),
            color: getConditionTextColor(project.conditions?.tipo || 'semanal', isLight)
          }}
        >
          {formatMode(project.conditions?.tipo || 'semanal', t)}
        </span>
        <span 
          className='px-1.5 sm:px-2 md:px-2.5 lg:px-3 py-0 sm:py-0.5 md:py-1 rounded-full text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-medium text-white'
          style={{backgroundColor: getStatusColor(project.estado)}}
        >
          {estadoVisible}
        </span>
      </div>

      {/* Botones de acción */}
      <div className='flex flex-row gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2'>
        <button
          type='button'
          onClick={handleEdit}
          className='flex-1 px-1.5 sm:px-2 md:px-2.5 lg:px-3 py-1.5 sm:py-1 md:py-1.5 lg:py-2 rounded sm:rounded-md md:rounded-lg border transition text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium hover:border-[var(--hover-border)]'
          style={{
            borderColor: isLight ? '#0468BF' : 'var(--border)',
            backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)',
            color: isLight ? '#0468BF' : '#d1d5db'
          }}
          title={t('common.editProject')}
          aria-label={`${t('common.edit')} ${project.nombre}`}
        >
          {t('common.edit')}
        </button>
        <button
          type='button'
          onClick={handleDelete}
          className='flex-1 px-1.5 sm:px-2 md:px-2.5 lg:px-3 py-1.5 sm:py-1 md:py-1.5 lg:py-2 rounded sm:rounded-md md:rounded-lg border transition text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium hover:border-[var(--hover-border)]'
          style={{
            borderColor: isLight ? '#F27405' : '#F27405',
            color: isLight ? '#F27405' : '#F27405',
            backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)'
          }}
          title={t('common.deleteProject')}
          aria-label={`${t('common.delete')} ${project.nombre}`}
        >
          {t('common.deleteButton')}
        </button>
      </div>
    </div>
  );
}

