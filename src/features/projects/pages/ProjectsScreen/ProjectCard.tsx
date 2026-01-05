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
      className='relative w-full text-left rounded-2xl border border-neutral-border p-6 transition-all cursor-pointer group hover:border-[var(--hover-border)]'
      style={{
        backgroundColor: 'var(--panel)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Avatar y nombre del proyecto */}
      <div className='flex items-start gap-4 mb-4'>
        <div 
          className='w-12 h-12 rounded-full flex items-center justify-center font-bold text-base px-2 border border-transparent pointer-events-none'
          style={{backgroundColor: getAvatarColor(project.nombre), color: '#ffffff'}}
        >
          {project.nombre}
        </div>
      </div>

      {/* Detalles del proyecto */}
      <div className='space-y-2 mb-4'>
        <div className='flex items-center gap-2 text-sm' style={{color: isLight ? '#111827' : '#d1d5db'}}>
          <span>📸</span>
          <span>{t('common.dopLabel')} {project.dop || '—'}</span>
        </div>
        <div className='flex items-center gap-2 text-sm' style={{color: isLight ? '#111827' : '#d1d5db'}}>
          <span>🏠</span>
          <span>{t('common.warehouseLabel')} {project.almacen || '—'}</span>
        </div>
        <div className='flex items-center gap-2 text-sm' style={{color: isLight ? '#111827' : '#d1d5db'}}>
          <span>📽</span>
          <span>{t('common.productionLabel')} {project.productora || '—'}</span>
        </div>
      </div>

      {/* Tags */}
      <div className='flex flex-wrap gap-2 mb-4 pointer-events-none'>
        <span 
          className='px-3 py-1 rounded-full text-xs font-medium'
          style={{
            backgroundColor: getConditionColor(project.conditions?.tipo || 'semanal', isLight),
            color: getConditionTextColor(project.conditions?.tipo || 'semanal', isLight)
          }}
        >
          {formatMode(project.conditions?.tipo || 'semanal', t)}
        </span>
        <span 
          className='px-3 py-1 rounded-full text-xs font-medium text-white'
          style={{backgroundColor: getStatusColor(project.estado)}}
        >
          {estadoVisible}
        </span>
      </div>

      {/* Botones de acción */}
      <div className='flex gap-2'>
        <button
          type='button'
          onClick={handleEdit}
          className='flex-1 px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]'
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
          className='flex-1 px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]'
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

