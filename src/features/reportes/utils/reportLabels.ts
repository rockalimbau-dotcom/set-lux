export type ReportScheduleLabels = {
  base: string;
  extra: string;
  pre: string;
  pick: string;
};

export function buildReportScheduleLabel(prefix: string, label: string): string {
  const safePrefix = String(prefix || '').trim();
  const safeLabel = String(label || '').trim();
  if (!safePrefix) return safeLabel;
  if (!safeLabel) return safePrefix;
  return `${safePrefix} ${safeLabel}`.trim();
}
