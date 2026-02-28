import { useCallback, useEffect } from 'react';
import { exportCondicionesToPDF } from '../../utils/exportPDF';
import { PRICE_HEADERS_DIARIO } from './publicidadConstants';
import { AnyRecord } from '@shared/types/common';
import type { CondicionesExportSections } from '../../utils/exportPDF';

interface UseExportRegistrationProps {
  project: AnyRecord | null | undefined;
  model: AnyRecord;
  roles: string[];
  onRegisterExport?: (fn: (sections?: Partial<CondicionesExportSections>) => void) => void;
}

/**
 * Hook to register PDF export function
 */
export function useExportRegistration({
  project,
  model,
  roles,
  onRegisterExport,
}: UseExportRegistrationProps) {
  const exportFunction = useCallback(async (sections?: Partial<CondicionesExportSections>) => {
    try {
      await exportCondicionesToPDF(
        project,
        'diario',
        model,
        PRICE_HEADERS_DIARIO,
        roles,
        sections
      );
    } catch (error) {
      console.error('Error exporting condiciones diario PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
  }, [project, model, roles]);

  useEffect(() => {
    if (onRegisterExport) {
      onRegisterExport(exportFunction);
    }
  }, [onRegisterExport, exportFunction]);
}
