import { useCallback, useEffect } from 'react';
import { exportCondicionesToPDF } from '../../utils/exportPDF';
import { PRICE_HEADERS } from '../shared.constants';
import { AnyRecord } from '@shared/types/common';

interface UseExportRegistrationProps {
  project: AnyRecord | null | undefined;
  model: AnyRecord;
  roles: string[];
  onRegisterExport?: (fn: () => void) => void;
}

/**
 * Hook to register PDF export function (semanal mode)
 */
export function useExportRegistration({
  project,
  model,
  roles,
  onRegisterExport,
}: UseExportRegistrationProps) {
  const exportFunction = useCallback(async () => {
    try {
      await exportCondicionesToPDF(
        project,
        'semanal',
        model,
        PRICE_HEADERS,
        roles
      );
    } catch (error) {
      console.error('Error exporting condiciones semanal PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
  }, [project, model, roles]);

  useEffect(() => {
    if (onRegisterExport) {
      onRegisterExport(exportFunction);
    }
  }, [onRegisterExport, exportFunction]);
}

