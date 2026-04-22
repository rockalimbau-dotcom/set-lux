import { AnyRecord } from '@shared/types/common';

export type TeamMember = { role: string; name: string };

export interface PlanificacionTabProps {
  project?: AnyRecord;
  conditions?: AnyRecord;
  baseTeam?: TeamMember[];
  prelightTeam?: TeamMember[];
  pickupTeam?: TeamMember[];
  reinforcements?: TeamMember[];
  teamList?: TeamMember[];
  readOnly?: boolean;
}

