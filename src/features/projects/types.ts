import type { ProjectRoleCatalog } from '@shared/utils/projectRoles';

export type ProjectMode = 'semanal' | 'mensual' | 'diario';
export type ProjectStatus = 'Activo' | 'Cerrado';

export interface ProjectConditions {
  tipo: ProjectMode;
}

export interface ProjectTeamMember {
  personId?: string;
  role?: string;
  roleId?: string;
  roleLabel?: string;
  name: string;
  source?: string;
  gender?: 'male' | 'female' | 'neutral';
}

export interface Project {
  id: string;
  nombre: string;
  dop?: string;
  almacen?: string;
  productora?: string;
  gaffer?: string;
  bestBoy?: string;
  jefeProduccion?: string;
  transportes?: string;
  localizaciones?: string;
  coordinadoraProduccion?: string;
  estado: ProjectStatus;
  conditions?: ProjectConditions;
  country?: string;
  region?: string;
  roleCatalog?: ProjectRoleCatalog;
}

export interface ProjectForm {
  nombre: string;
  dop: string;
  almacen: string;
  productora: string;
  gaffer: string;
  bestBoy: string;
  jefeProduccion: string;
  transportes: string;
  localizaciones: string;
  coordinadoraProduccion: string;
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
