// Re-export all functions and components from the refactored modules
export {
  extractFestivosDatesForPlan,
  renderWithParams,
  visibleToTemplate,
  restoreStrongTags,
} from './utils';

export { renderExportHTML } from './exportUtils';

export { loadJSON, saveJSON } from './storageUtils';

export { TextAreaAuto } from './components/TextAreaAuto';
export { InfoCard } from './components/InfoCard';
export { ParamInput } from './components/ParamInput';

export type {
  TextAreaAutoProps,
  InfoCardProps,
  DuoField,
  ParamInputProps,
} from './types';

