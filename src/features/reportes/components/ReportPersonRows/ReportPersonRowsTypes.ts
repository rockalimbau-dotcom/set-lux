import { AnyRecord } from '@shared/types/common';

export interface DietasCellProps {
  pKey: string;
  concepto: string;
  fecha: string;
  val: string;
  cellClasses: string;
  theme: 'dark' | 'light';
  focusColor: string;
  readOnly: boolean;
  dropdownKey: string;
  dropdownState: { isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean };
  setDropdownState: (key: string, updates: Partial<{ isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean }>) => void;
  parseDietas: (raw: string) => { items: Set<string>; ticket: number | null; other: number | null };
  formatDietas: (items: Set<string>, ticket: number | null, other: number | null) => string;
  dietasOptions: string[];
  setCell: (pKey: string, concepto: string, fecha: string, value: any) => void;
}

export interface SiNoCellProps {
  pKey: string;
  concepto: string;
  fecha: string;
  val: string;
  cellClasses: string;
  readOnly: boolean;
  off: boolean;
  setCell: (pKey: string, concepto: string, fecha: string, value: any) => void;
}

export interface ReportPersonRowsProps {
  list: AnyRecord[];
  block: 'base' | 'pre' | 'pick' | string;
  semana: readonly string[];
  collapsed: Record<string, boolean>;
  setCollapsed: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  data: AnyRecord;
  setCell: (pKey: string, concepto: string, fecha: string, value: any) => void;
  findWeekAndDay: (iso: string) => AnyRecord;
  isPersonScheduledOnBlock: (
    fecha: string,
    visualRole: string,
    name: string,
    findWeekAndDay: (iso: string) => AnyRecord,
    block?: 'base' | 'pre' | 'pick' | string
  ) => boolean;
  CONCEPTS: readonly string[];
  DIETAS_OPCIONES: readonly (string | null)[];
  SI_NO: readonly string[];
  parseDietas: (raw: string) => { items: Set<string>; ticket: number | null; other: number | null };
  formatDietas: (items: Set<string>, ticket: number | null, other: number | null) => string;
  horasExtraTipo?: string;
  readOnly?: boolean;
  getMaterialPropioConfig?: (
    role: string,
    name: string,
    block: 'base' | 'pre' | 'pick' | 'extra'
  ) => { value: number; type: 'semanal' | 'diario' } | null;
}

