/**
 * CSS styles for PDF generation
 */
export const PDF_STYLES = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif;
      margin: 0;
      padding: 0;
      background: white;
      color: #1e293b;
      line-height: 1.3;
      font-size: 11px;
    }
    
    .container-pdf {
      width: 1123px;
      height: 794px;
      background: white;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      background: white;
      color: #0f172a;
      flex-shrink: 0;
    }

    .title-bar {
      background: linear-gradient(135deg, #f97316 0%, #3b82f6 100%);
      color: #ffffff;
      padding: 10px 20px;
      text-align: center;
    }

    .title-text {
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }
    
    .content {
      padding: 12px 20px;
      flex: 1;
      margin-bottom: 0;
    }
    
    .info-panel {
      background: #f1f5f9;
      margin: 10px 0 24px 0;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 18px;
    }

    .info-grid-secondary {
      margin-top: 18px;
    }

    .month-title {
      margin: 18px 0 10px 0;
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      text-align: left;
    }

    .info-row {
      display: flex;
      gap: 6px;
      align-items: baseline;
      flex-wrap: wrap;
      font-size: 10px;
      color: #334155;
    }

    .info-row-right {
      justify-content: flex-end;
      text-align: right;
    }

    .info-label {
      font-weight: 700;
      color: #1f2937;
    }

    .info-value {
      font-weight: 500;
      color: #0f172a;
    }
    
    .table-container {
      background: white;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .payroll-help {
      margin-top: 10px;
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 9px;
    }

    .payroll-help-title {
      font-weight: 700;
      color: #f97316;
      margin-bottom: 6px;
      font-size: 10px;
    }

    .payroll-help-body {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }

    .payroll-help-image {
      width: 53%;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 4px;
      background: #f8fafc;
    }

    .payroll-help-image img {
      width: 100%;
      height: auto;
      display: block;
      border-radius: 4px;
      max-height: 360px;
      object-fit: contain;
    }

    .payroll-help-legend {
      width: 47%;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .payroll-help-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .payroll-help-detail {
      font-size: 8px;
      opacity: 0.8;
    }

    .payroll-help-color {
      width: 12px;
      height: 12px;
      min-width: 12px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
      display: inline-block;
    }

    .payroll-help-pink { background: #F9A8D4; }
    .payroll-help-yellow { background: #FDE68A; }
    .payroll-help-green { background: #86EFAC; }
    .payroll-help-blue { background: #93C5FD; }
    .payroll-help-orange { background: #FDBA74; }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      border: 2px solid #1e3a8a;
    }
    
    th {
      background: #1e40af !important;
      color: white !important;
      padding: 8px 6px !important;
      text-align: center !important;
      vertical-align: middle !important;
      font-weight: 600 !important;
      font-size: 9px !important;
      text-transform: uppercase !important;
      border: 1px solid white !important;
      height: 40px !important;
      line-height: 1.2 !important;
      display: table-cell !important;
    }
    
    thead th {
      text-align: center !important;
      vertical-align: middle !important;
      height: 40px !important;
      line-height: 1.2 !important;
    }
    
    td {
      padding: 6px 6px;
      border: 1px solid #999;
      background: white;
      vertical-align: middle !important;
      text-align: center !important;
      color: #1e293b;
    }
    
    td.text-right {
      text-align: right !important;
    }
    
    td.text-left {
      text-align: left !important;
    }
    
    .person-cell {
      font-weight: 600;
      color: #1e293b;
    }
    
    .total-cell {
      font-weight: 700;
      font-size: 12px;
      color: #f97316;
    }
    
    .extras-cell, .dietas-cell {
      font-size: 9px;
    }
    
    .extras-cell br + *, .dietas-cell br + * {
      font-size: 9px !important;
    }
    
    .dietas-cell {
      font-size: 9px !important;
    }
    
    .dietas-cell br + * {
      font-size: 9px !important;
    }
    
    .footer {
      text-align: center;
      padding: 10px 0;
      color: #64748b;
      font-size: 6px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      flex-shrink: 0;
      width: 100%;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
    }

    .setlux-logo {
      font-weight: 700;
      font-size: 7px;
    }
    
    .setlux-logo .set {
      color: #f97316;
    }
    
    .setlux-logo .lux {
      color: #3b82f6;
    }

    .footer-dot {
      font-weight: 700;
    }

    .footer-domain {
      color: #1e293b;
      font-weight: 600;
    }
    
    @media print {
      .footer { 
        position: fixed !important; 
        bottom: 0 !important; 
        left: 0 !important; 
        right: 0 !important; 
        width: 100% !important; 
        background: white !important; 
        z-index: 9999 !important; 
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        color: #64748b !important;
        font-size: 6px !important;
        padding: 6px 0 !important;
        border-top: 1px solid #e2e8f0 !important;
      }
    }
`;
