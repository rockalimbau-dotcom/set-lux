export type ProjectMode = 'semanal' | 'mensual' | 'publicidad';
export type ProjectStatus = 'Activo' | 'Cerrado';

export interface ProjectConditions {
  tipo: ProjectMode;
}

export interface Project {
  id: string;
  nombre: string;
  dop?: string;
  almacen?: string;
  productora?: string;
  estado: ProjectStatus;
  conditions?: ProjectConditions;
  country?: string;
  region?: string;
}

export interface ProjectForm {
  nombre: string;
  dop: string;
  almacen: string;
  productora: string;
  estado: ProjectStatus;
  condicionesTipo: ProjectMode;
  country: string;
  region: string;
}

export interface ProjectsScreenProps {
  userName: string;
  projects: Project[];
  onCreateProject: (project: Project) => void;
  onOpen: (project: Project) => void;
  onUpdateProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onPerfil?: () => void;
  onConfig?: () => void;
  onSalir?: () => void;
}

