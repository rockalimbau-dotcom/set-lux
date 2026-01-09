import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnyRecord } from '@shared/types/common';
import { exportToPDF, exportAllToPDF } from '../utils/export';
import { NecesidadesTabProps, DayInfo } from './NecesidadesTab/NecesidadesTabTypes';
import { useNeedsSync } from './NecesidadesTab/useNeedsSync';
import { useNeedsData } from './NecesidadesTab/useNeedsData';
import { useNeedsActions } from './NecesidadesTab/useNeedsActions';
import { NecesidadesTabContent } from './NecesidadesTab/NecesidadesTabContent';

export default function NecesidadesTab({ project, readOnly = false }: NecesidadesTabProps) {
  const { t } = useTranslation();
  
  // Create DAYS array with translations
  const DAYS = useMemo(() => [
    { idx: 0, key: 'mon', name: t('reports.dayNames.monday') },
    { idx: 1, key: 'tue', name: t('reports.dayNames.tuesday') },
    { idx: 2, key: 'wed', name: t('reports.dayNames.wednesday') },
    { idx: 3, key: 'thu', name: t('reports.dayNames.thursday') },
    { idx: 4, key: 'fri', name: t('reports.dayNames.friday') },
    { idx: 5, key: 'sat', name: t('reports.dayNames.saturday') },
    { idx: 6, key: 'sun', name: t('reports.dayNames.sunday') },
  ], [t]);
  
  // Error boundary state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const planKey = useMemo(() => {
    try {
      const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'demo';
      return `plan_${base}`;
    } catch (error) {
      console.error('Error creating planKey:', error);
      return 'plan_demo';
    }
  }, [(project as AnyRecord)?.id, (project as AnyRecord)?.nombre]);

  const storageKey = useMemo(() => {
    try {
      const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'demo';
      return `needs_${base}`;
    } catch (error) {
      console.error('Error creating storageKey:', error);
      return 'needs_demo';
    }
  }, [(project as AnyRecord)?.id, (project as AnyRecord)?.nombre]);

  const [needs, setNeeds] = useLocalStorage(storageKey, {} as AnyRecord);

  // Sync from planificación
  useNeedsSync({
    planKey,
    setNeeds,
    setHasError,
    setErrorMessage,
  });

  // Manage needs data
  const { weekEntries } = useNeedsData({
    needs,
    storageKey,
    setNeeds,
    setHasError,
    setErrorMessage,
  });

  // Actions
  const { setCell, removeFromList, setWeekOpen } = useNeedsActions({
    planKey,
    readOnly,
    setNeeds,
  });

  // Export functions
  const exportWeekPDF = async (weekId: string) => {
    try {
      const w: AnyRecord = needs[weekId];
      if (!w) {
        console.error('Week not found:', weekId);
        alert(t('needs.weekNotFound'));
        return;
      }
      const valuesByDay = Array.from({ length: 7 }).map((_, i) => (w.days as AnyRecord)?.[i] || {});
      await exportToPDF(
        project,
        w.label || t('needs.week'),
        w.startDate || '',
        valuesByDay
      );
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert(t('needs.errorGeneratingPDF'));
    }
  };

  const exportAllNeedsPDF = async () => {
    try {
      await exportAllToPDF(
        project,
        weekEntries,
        needs
      );
    } catch (error) {
      console.error('Error exporting all needs PDF:', error);
      alert(t('needs.errorGeneratingPDF'));
    }
  };

  // Error boundary UI
  if (hasError) {
    return (
      <div className='space-y-4'>
        <div className='text-sm text-red-400 border border-red-800 rounded-xl p-4 bg-red-950/30'>
          <h3 className='font-semibold mb-2'>{t('needs.errorLoadingNeeds')}</h3>
          <p className='mb-3'>{errorMessage}</p>
          <button
            onClick={() => {
              setHasError(false);
              setErrorMessage('');
              window.location.reload();
            }}
            className='px-3 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-sm'
          >
            {t('needs.reloadPage')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-2 sm:space-y-3 md:space-y-4'>
      <NecesidadesTabContent
        weekEntries={weekEntries}
        DAYS={DAYS}
        project={project}
        readOnly={readOnly}
        setCell={setCell}
        removeFromList={removeFromList}
        setWeekOpen={setWeekOpen}
        exportWeekPDF={exportWeekPDF}
        exportAllNeedsPDF={exportAllNeedsPDF}
      />
    </div>
  );
}
