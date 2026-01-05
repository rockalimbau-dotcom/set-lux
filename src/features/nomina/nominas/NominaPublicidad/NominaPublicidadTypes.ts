export interface ProjectLike {
  id?: string;
  nombre?: string;
  conditions?: {
    tipo?: string;
  };
}

export interface NominaPublicidadProps {
  project: ProjectLike;
  readOnly?: boolean;
}

