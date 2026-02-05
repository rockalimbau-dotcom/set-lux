export interface BuildNominaMonthHTMLParams {
  project: any;
  monthKey: string;
  enrichedRows: any[];
  monthLabelEs: (key: string, withYear?: boolean) => string;
  showHelp?: boolean;
  monthTitle?: string;
  hideSecondaryInfo?: boolean;
}

export interface ExportToPDFParams extends BuildNominaMonthHTMLParams {
  // No additional params needed for now
}
