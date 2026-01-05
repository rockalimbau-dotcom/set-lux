// Re-export all functions and components from the refactored module
export {
  extractFestivosDatesForPlan,
  renderWithParams,
  visibleToTemplate,
  restoreStrongTags,
  renderExportHTML,
  loadJSON,
  saveJSON,
  TextAreaAuto,
  InfoCard,
  ParamInput,
} from './shared/index';

export type {
  TextAreaAutoProps,
  InfoCardProps,
  DuoField,
  ParamInputProps,
} from './shared/index';
