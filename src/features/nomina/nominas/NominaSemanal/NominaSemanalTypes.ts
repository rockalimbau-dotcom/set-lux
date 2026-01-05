export interface ProjectLike {
  id?: string;
  nombre?: string;
  conditions?: {
    tipo?: string;
  };
}

export interface NominaSemanalProps {
  project: ProjectLike;
  readOnly?: boolean;
}

