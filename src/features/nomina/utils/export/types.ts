export interface BuildNominaMonthHTMLParams {
  project: any;
  monthKey: string;
  enrichedRows: any[];
  monthLabelEs: (key: string, withYear?: boolean) => string;
}

export interface ExportToPDFParams extends BuildNominaMonthHTMLParams {
  // No additional params needed for now
}

