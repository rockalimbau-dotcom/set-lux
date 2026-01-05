export interface ProjectLike {
  id?: string;
  nombre?: string;
  conditions?: {
    tipo?: string;
  };
}

export interface NominaMensualProps {
  project: ProjectLike;
  readOnly?: boolean;
}

