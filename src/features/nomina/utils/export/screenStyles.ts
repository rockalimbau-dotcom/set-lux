/**
 * CSS styles for screen display (print preview)
 */
export const SCREEN_STYLES = `
    @page { size: A4 landscape; margin: 12mm; }
    @media print { body { margin: 0; } }
    
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif;
      margin: 0;
      padding: 0;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.5;
    }
    
    .container {
      max-width: 100%;
      margin: 0 auto;
      background: white;
      min-height: 100vh;
    }
    
    .header {
      background: linear-gradient(135deg, #f97316 0%, #3b82f6 100%);
      color: white;
      padding: 12px 20px;
      text-align: center;
      flex-shrink: 0;
    }
    
    .header h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .content {
      padding: 12px 20px;
      flex: 1;
      margin-bottom: 0;
    }
    
    .info-panel {
      background: #f1f5f9;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
      display: flex;
      gap: 24px;
      align-items: center;
      justify-content: flex-start;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    
    .info-label {
      font-size: 9px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-value {
      font-size: 11px;
      color: #1e293b;
      font-weight: 500;
    }
    
    .table-container {
      background: white;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
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
    
    tr:hover td {
      background: #f8fafc;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    .person-cell {
      font-weight: 600;
      color: #1e293b;
    }
    
    .total-cell {
      font-weight: 700;
      font-size: 14px;
      color: #f97316;
    }
    
    .extras-cell, .dietas-cell {
      font-size: 10px;
    }
    
    .extras-cell br + *, .dietas-cell br + * {
      font-size: 10px !important;
    }
    
    .dietas-cell {
      font-size: 10px !important;
    }
    
    .dietas-cell br + * {
      font-size: 10px !important;
    }
    
    .footer {
      text-align: center;
      padding: 6px 0;
      color: #64748b;
      font-size: 6px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      flex-shrink: 0;
      width: 100%;
      margin-bottom: 8px;
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
`;

