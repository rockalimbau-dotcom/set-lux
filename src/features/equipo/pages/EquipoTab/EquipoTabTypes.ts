import { AnyRecord } from '@shared/types/common';

export interface EquipoTabProps {
  currentUser?: AnyRecord;
  initialTeam?: AnyRecord;
  onChange?: (payload: AnyRecord) => void;
  readOnly?: boolean;
  allowEditOverride?: boolean;
  storageKey?: string;
  projectMode?: 'semanal' | 'mensual' | 'diario';
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

