export interface MonthReportGroupHeaderProps {
  monthName: string;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  readOnly: boolean;
  handleExportPDF: () => void;
  horasExtraOpciones: readonly string[];
  displayedHorasExtraTipo: string;
  setHorasExtraTipo: (value: string) => void;
  theme: 'dark' | 'light';
  focusColor: string;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (value: boolean) => void;
  hoveredOption: string | null;
  setHoveredOption: (value: string | null) => void;
  isButtonHovered: boolean;
  setIsButtonHovered: (value: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
}

