import { AnyRecord } from '@shared/types/common';

export interface TeamRoleOption {
  code: string;
  label: string;
  roleId?: string;
  legacyCode?: string;
  color?: {
    bg: string;
    fg: string;
  } | null;
}

export interface EquipoTabProps {
  currentUser?: AnyRecord;
  initialTeam?: AnyRecord;
  onChange?: (payload: AnyRecord) => void;
  onRoleCatalogChange?: (roleCatalog: AnyRecord) => void;
  readOnly?: boolean;
  allowEditOverride?: boolean;
  storageKey?: string;
  projectMode?: 'semanal' | 'mensual' | 'diario';
  project?: AnyRecord;
}

export interface TeamData {
  base: AnyRecord[];
  reinforcements: AnyRecord[];
  prelight: AnyRecord[];
  pickup: AnyRecord[];
  enabledGroups: {
    prelight: boolean;
    pickup: boolean;
  };
}
