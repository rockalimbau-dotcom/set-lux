import { useMemo } from 'react';
import { dayNameFromISO } from '@shared/utils/date';
import { DAY_NAMES } from '../../constants';
import { defaultExportWeek, handleExportPDF } from './exportHelpers';
import { AnyRecord } from '@shared/types/common';

interface UseReportExportProps {
  project: { id?: string; nombre?: string } | undefined;
  title: string;
  safeSemana: string[];
  horarioTexto: (iso: string) => string;
  jornadaTipoTexto: (iso: string, blockKey?: string) => string;
  jornadaTipoPersonaTexto: (pk: string, iso: string, blockKey?: string) => string;
  resolvePersonaBlockKey: (pk: string, iso: string, blockKey?: string) => string;
  horarioPrelight: (iso: string) => string;
  horarioPickup: (iso: string) => string;
  horarioExtraByBlock: (blockKey: string, iso: string) => string;
  reportLabels: {
    base: string;
    extra: string;
    pre: string;
    pick: string;
  };
  groupedPersonKeys: {
    base: string[];
    pre: string[];
    pick: string[];
    extraGroups: Array<{ blockKey: string; people: string[] }>;
  };
  data: AnyRecord;
  onExportWeekHTML?: () => void;
  onExportWeekPDF?: () => void;
}

interface UseReportExportReturn {
  handleExportHTML: () => void;
  handleExportPDFAsync: () => Promise<void>;
}

/**
 * Hook to handle report export functionality
 */
export function useReportExport({
  project,
  title,
  safeSemana,
  horarioTexto,
  jornadaTipoTexto,
  jornadaTipoPersonaTexto,
  resolvePersonaBlockKey,
  horarioPrelight,
  horarioPickup,
  horarioExtraByBlock,
  reportLabels,
  groupedPersonKeys,
  data,
  onExportWeekHTML,
  onExportWeekPDF,
}: UseReportExportProps): UseReportExportReturn {
  const dayNameFromISOFn = useMemo(
    () => (iso: string, index: number) => dayNameFromISO(iso, index, [...DAY_NAMES] as any),
    []
  );

  const handleExportHTML = () => {
    if (typeof onExportWeekHTML === 'function') return onExportWeekHTML();
    defaultExportWeek(
      project,
      title,
      safeSemana,
      dayNameFromISOFn,
      horarioTexto,
      jornadaTipoTexto,
      jornadaTipoPersonaTexto,
      resolvePersonaBlockKey,
      horarioPrelight,
      horarioPickup,
      horarioExtraByBlock,
      reportLabels,
      groupedPersonKeys,
      data
    );
  };

  const handleExportPDFAsync = async () => {
    await handleExportPDF(
      project,
      title,
      safeSemana,
      dayNameFromISOFn,
      horarioTexto,
      jornadaTipoTexto,
      jornadaTipoPersonaTexto,
      resolvePersonaBlockKey,
      horarioPrelight,
      horarioPickup,
      horarioExtraByBlock,
      reportLabels,
      groupedPersonKeys,
      data,
      onExportWeekPDF,
      () => defaultExportWeek(
        project,
        title,
        safeSemana,
        dayNameFromISOFn,
        horarioTexto,
        jornadaTipoTexto,
        jornadaTipoPersonaTexto,
        resolvePersonaBlockKey,
        horarioPrelight,
        horarioPickup,
        horarioExtraByBlock,
        reportLabels,
        groupedPersonKeys,
        data
      )
    );
  };

  return { handleExportHTML, handleExportPDFAsync };
}
