import { Project, ProjectForm, ProjectMode, ProjectStatus } from '../../types';

export interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onSave: (project: Project) => void;
}

export interface DropdownState {
  isOpen: boolean;
  isButtonHovered: boolean;
  hoveredOption: string | null;
}

export interface InputHoverState {
  proyecto: boolean;
  dop: boolean;
  gaffer: boolean;
  almacen: boolean;
  productora: boolean;
  jefeProduccion: boolean;
  transportes: boolean;
  localizaciones: boolean;
  coordinadoraProduccion: boolean;
}

export interface EditProjectModalFormProps {
  form: ProjectForm;
  setForm: React.Dispatch<React.SetStateAction<ProjectForm>>;
  theme: 'light' | 'dark';
  estadoDropdown: DropdownState;
  setEstadoDropdown: React.Dispatch<React.SetStateAction<DropdownState>>;
  condicionesDropdown: DropdownState;
  setCondicionesDropdown: React.Dispatch<React.SetStateAction<DropdownState>>;
  paisDropdown: DropdownState;
  setPaisDropdown: React.Dispatch<React.SetStateAction<DropdownState>>;
  regionDropdown: DropdownState;
  setRegionDropdown: React.Dispatch<React.SetStateAction<DropdownState>>;
  inputHovered: InputHoverState;
  setInputHovered: React.Dispatch<React.SetStateAction<InputHoverState>>;
  estadoRef: React.RefObject<HTMLDivElement>;
  condicionesRef: React.RefObject<HTMLDivElement>;
  paisRef: React.RefObject<HTMLDivElement>;
  regionRef: React.RefObject<HTMLDivElement>;
}
