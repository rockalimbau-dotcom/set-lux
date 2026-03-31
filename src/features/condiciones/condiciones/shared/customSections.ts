export interface CustomConditionSection {
  id: string;
  title: string;
  content: string;
}

export function normalizeCustomSections(value: unknown): CustomConditionSection[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      const source = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
      const id = String(source.id ?? `custom-section-${index + 1}`);
      return {
        id,
        title: String(source.title ?? ''),
        content: String(source.content ?? ''),
      };
    })
    .filter(section => section.id.trim() !== '');
}
