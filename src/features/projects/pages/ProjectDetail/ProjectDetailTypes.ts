export type ProjectMode = 'semanal' | 'mensual' | 'diario';
export type ProjectStatus = 'Activo' | 'Cerrado';

export interface ProjectConditions {
  tipo?: ProjectMode;
  mode?: ProjectMode; // Legacy compatibility
}

export interface TeamMember {
  role: string;
  name: string;
}

export interface ProjectTeam {
  base: TeamMember[];
  reinforcements: TeamMember[];
  prelight: TeamMember[];
  pickup: TeamMember[];
  enabledGroups: {
    prelight: boolean;
    pickup: boolean;
  };
}

export interface Project {
  id: string;
  nombre: string;
  dop?: string;
  almacen?: string;
  productora?: string;
  gaffer?: string;
  jefeProduccion?: string;
  transportes?: string;
  localizaciones?: string;
  coordinadoraProduccion?: string;
  estado: ProjectStatus;
  team?: ProjectTeam;
  conditions?: ProjectConditions;
  conditionsMode?: ProjectMode; // Legacy compatibility
}

export interface User {
  nombreCompleto: string;
  roleCode: string;
}

export interface ProjectDetailProps {
  project: Project;
  user: User;
  onBack: () => void;
  onUpdateProject?: (project: Project) => void;
  initialTab?: string | null;
}

export type ProjectTab = 'equipo' | 'reportes' | 'nomina' | 'necesidades' | 'condiciones';
