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
  horarioPrelight: (iso: string) => string;
  horarioPickup: (iso: string) => string;
  horarioExtraByBlock: (blockKey: string, iso: string) => string;
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
  horarioPrelight,
  horarioPickup,
  horarioExtraByBlock,
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
      horarioPrelight,
      horarioPickup,
      horarioExtraByBlock,
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
      horarioPrelight,
      horarioPickup,
      horarioExtraByBlock,
      groupedPersonKeys,
      data,
      onExportWeekPDF,
      () => defaultExportWeek(
        project,
        title,
        safeSemana,
        dayNameFromISOFn,
        horarioTexto,
        horarioPrelight,
        horarioPickup,
        horarioExtraByBlock,
        groupedPersonKeys,
        data
      )
    );
  };

  return { handleExportHTML, handleExportPDFAsync };
}
