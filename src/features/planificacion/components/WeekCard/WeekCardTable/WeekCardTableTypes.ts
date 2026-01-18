import { AnyRecord } from '@shared/types/common';

export interface WeekCardTableProps {
  week: AnyRecord;
  scope: 'pre' | 'pro';
  weekStart: Date;
  datesRow: string[];
  onChangeMonday: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setDayField: (scope: 'pre' | 'pro', weekId: string, dayIdx: number, patch: AnyRecord) => void;
  getDropdownState: (key: string) => {
    isOpen: boolean;
    hoveredOption: string | null;
    isButtonHovered: boolean;
  };
  setDropdownState: (
    key: string,
    updates: Partial<{
      isOpen: boolean;
      hoveredOption: string | null;
      isButtonHovered: boolean;
    }>
  ) => void;
  addMemberTo: (
    scope: 'pre' | 'pro',
    weekId: string,
    dayIdx: number,
    listKey: 'team' | 'prelight' | 'pickup',
    member: AnyRecord
  ) => void;
  setMemberToRemove: (member: {
    scope: 'pre' | 'pro';
    weekId: string;
    dayIndex: number;
    listKey: 'team' | 'prelight' | 'pickup';
    idx: number;
    memberName: string;
  } | null) => void;
  baseTeam: AnyRecord[];
  prelightTeam: AnyRecord[];
  pickupTeam: AnyRecord[];
  reinforcements: AnyRecord[];
  missingByPair: (dayList: AnyRecord[], pool: AnyRecord[]) => AnyRecord[];
  uniqueByPair: (arr: AnyRecord[]) => AnyRecord[];
  poolRefs: (reinf: AnyRecord[]) => AnyRecord[];
  preOpen: boolean;
  setPreOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  pickOpen: boolean;
  setPickOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  theme: 'dark' | 'light';
  focusColor: string;
  readOnly?: boolean;
}

export interface MemberChipProps {
  role: string;
  name: string;
  source?: string;
  gender?: 'male' | 'female' | 'neutral';
}

