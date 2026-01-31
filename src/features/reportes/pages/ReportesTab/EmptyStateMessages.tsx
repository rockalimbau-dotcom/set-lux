import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface EmptyStateMessagesProps {
  projectId?: string;
  readOnly?: boolean;
  hasWeeks: boolean;
  hasTeam: boolean;
}

function EmptyStateMessages({ projectId, readOnly = false, hasWeeks, hasTeam }: EmptyStateMessagesProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const planificacionPath = projectId ? `/project/${projectId}/calendario` : '/projects';
  const equipoPath = projectId ? `/project/${projectId}/equipo` : '/projects';

  // Caso 1: Faltan ambas cosas (semanas Y equipo)
  if (!hasWeeks && !hasTeam) {
    return (
      <div className='flex flex-col items-center justify-center py-16 px-8 text-center'>
        <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
          {t('reports.configureProject')}
        </h2>
        <p className='text-xl max-w-2xl mb-4' style={{color: 'var(--text)', opacity: 0.8}}>
          {t('reports.addWeeksIn')}{' '}
          <button
            onClick={() => !readOnly && navigate(planificacionPath)}
            disabled={readOnly}
            className={`underline font-semibold hover:opacity-80 transition-opacity ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{color: 'var(--brand)'}}
            title={readOnly ? t('conditions.projectClosed') : t('reports.goToPlanning')}
          >
            {t('navigation.needs')}
          </button>
          {' '}{t('reports.andTeamIn')}{' '}
          <button
            onClick={() => !readOnly && navigate(equipoPath)}
            disabled={readOnly}
            className={`underline font-semibold hover:opacity-80 transition-opacity ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{color: 'var(--brand)'}}
            title={readOnly ? t('conditions.projectClosed') : t('reports.goToTeam')}
          >
            {t('navigation.team')}
          </button>
          {' '}{t('reports.toGenerateReports')}
        </p>
      </div>
    );
  }

  // Caso 2: Solo faltan semanas (pero SÍ hay equipo)
  if (!hasWeeks) {
    return (
      <div className='flex flex-col items-center justify-center py-16 px-8 text-center'>
        <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
          {t('reports.noWeeksInPlanning')}
        </h2>
        <p className='text-xl max-w-2xl mb-4' style={{color: 'var(--text)', opacity: 0.8}}>
          {t('reports.addWeeksToAppear')}{' '}
          <button
            onClick={() => !readOnly && navigate(planificacionPath)}
            disabled={readOnly}
            className={`underline font-semibold hover:opacity-80 transition-opacity ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{color: 'var(--brand)'}}
            title={readOnly ? t('conditions.projectClosed') : t('reports.goToPlanning')}
          >
            {t('navigation.needs')}
          </button>
          {' '}{t('reports.toAppearHere')}
        </p>
      </div>
    );
  }

  // Caso 3: Solo falta equipo (pero SÍ hay semanas)
  if (!hasTeam) {
    return (
      <div className='flex flex-col items-center justify-center py-16 px-8 text-center'>
        <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
          {t('reports.missingTeam')}
        </h2>
        <p className='text-xl max-w-2xl mb-4' style={{color: 'var(--text)', opacity: 0.8}}>
          {t('reports.fillTeamIn')}{' '}
          <button
            onClick={() => !readOnly && navigate(equipoPath)}
            disabled={readOnly}
            className={`underline font-semibold hover:opacity-80 transition-opacity ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{color: 'var(--brand)'}}
            title={readOnly ? t('conditions.projectClosed') : t('reports.goToTeam')}
          >
            {t('navigation.team')}
          </button>
          {' '}{t('reports.toGenerateReports')}
        </p>
      </div>
    );
  }

  return null;
}

export default EmptyStateMessages;

