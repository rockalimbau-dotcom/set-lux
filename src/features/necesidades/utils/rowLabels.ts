export type NeedsRowLabels = Record<string, string>;

export function getNeedsRowLabel(
  rowLabels: NeedsRowLabels | undefined,
  key: string,
  fallbackLabel: string
): string {
  if (rowLabels && Object.prototype.hasOwnProperty.call(rowLabels, key)) {
    return String(rowLabels[key] ?? '');
  }
  return fallbackLabel;
}
