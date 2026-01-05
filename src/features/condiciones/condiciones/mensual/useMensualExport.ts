import { useCallback, useEffect } from 'react';
import { AnyRecord } from '@shared/types/common';
import { exportCondicionesToPDF } from '../../utils/exportPDF';
import { PRICE_HEADERS } from '../shared.constants';

interface UseMensualExportProps {
  project: AnyRecord | null | undefined;
  model: AnyRecord;
  roles: string[];
  onRegisterExport?: (fn: () => void) => void;
}

/**
 * Hook to handle PDF export for mensual conditions
 */
export function useMensualExport({
  project,
  model,
  roles,
  onRegisterExport,
}: UseMensualExportProps) {
  const exportFunction = useCallback(async () => {
    try {
      await exportCondicionesToPDF(
        project,
        'mensual',
        model,
        PRICE_HEADERS,
        roles
      );
    } catch (error) {
      console.error('Error exporting condiciones mensual PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
  }, [project, model, roles]);

  useEffect(() => {
    if (onRegisterExport) {
      onRegisterExport(exportFunction);
    }
  }, [onRegisterExport, exportFunction]);
}

