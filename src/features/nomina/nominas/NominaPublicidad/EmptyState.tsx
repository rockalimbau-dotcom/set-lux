import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  title: string;
  message: string;
  planificacionPath?: string;
  equipoPath?: string;
  planningLabel?: string;
  teamLabel?: string;
  andLabel?: string;
  toLabel?: string;
}

export function EmptyState({
  title,
  message,
  planificacionPath,
  equipoPath,
  planningLabel,
  teamLabel,
  andLabel,
  toLabel,
}: EmptyStateProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className='flex flex-col items-center justify-center py-16 px-8 text-center'>
      <h2 className='text-3xl font-bold mb-4' style={{ color: 'var(--text)' }}>
        {title}
      </h2>
      <p className='text-xl max-w-2xl mb-4' style={{ color: 'var(--text)', opacity: 0.8 }}>
        {message}
        {planificacionPath && planningLabel && (
          <>
            {' '}
            <button
              onClick={() => navigate(planificacionPath)}
              className='underline font-semibold hover:opacity-80 transition-opacity'
              style={{ color: 'var(--brand)' }}
            >
              {planningLabel}
            </button>
          </>
        )}
        {andLabel && ' ' + andLabel + ' '}
        {equipoPath && teamLabel && (
          <>
            <button
              onClick={() => navigate(equipoPath)}
              className='underline font-semibold hover:opacity-80 transition-opacity'
              style={{ color: 'var(--brand)' }}
            >
              {teamLabel}
            </button>
          </>
        )}
        {toLabel && ' ' + toLabel}
      </p>
    </div>
  );
}

