/**
 * Shared CSS styles for condiciones HTML PDF
 */
export const baseStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif;
    background: white;
    color: #1e293b;
    line-height: 1.3;
    font-size: 12px;
  }
  .container { 
    max-width: 100%; 
    margin: 0 auto; 
    background: white; 
    min-height: 100vh; 
    display: flex; 
    flex-direction: column; 
    padding-bottom: 0; 
    position: relative; 
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
    margin: 10px 0 12px 0; 
    padding: 10px 14px; 
    border-radius: 8px; 
    border: 1px solid #e2e8f0; 
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 18px;
  }
  .info-column {
    display: grid;
    gap: 6px;
    min-width: 0;
  }
  .info-column-right {
    justify-items: end;
  }
  .info-row {
    display: flex;
    gap: 6px;
    align-items: baseline;
    flex-wrap: nowrap;
    font-size: 10px;
    color: #334155;
    min-width: 0;
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
    word-break: break-word;
  }
  .table-container { 
    background: white; 
    border-radius: 6px; 
    overflow: hidden; 
    box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
    margin-bottom: 15px;
  }
  .table-container h3 {
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 700;
    color: #1e3a8a;
    padding: 8px 12px 4px 12px;
  }
  .table-container table {
    margin-bottom: 20px;
  }
  .table-container table:last-child {
    margin-bottom: 0;
  }
  table { 
    width: 100%; 
    border-collapse: collapse; 
    font-size: 10px; 
    border: 2px solid #7dbfe8; 
  }
  th { 
    background: #bfe4f8; 
    color: #0f172a; 
    padding: 6px 6px; 
    text-align: center; 
    vertical-align: middle;
    font-weight: 700; 
    font-size: 9px; 
    text-transform: uppercase; 
    border: 1px solid #7dbfe8; 
  }
  th .th-label {
    display: block;
    line-height: 1.2;
    text-align: center;
    transform: translateY(-5px);
  }
  td { 
    padding: 0; 
    border: 1px solid #e2e8f0; 
    background: white; 
    vertical-align: middle; 
    color: #1e293b; 
  }
  td .td-label {
    display: flex;
    align-items: center;
    min-height: 36px;
    padding: 6px 10px;
    line-height: 1.2;
    transform: translateY(-3px);
  }
  td:not(:first-child) .td-label {
    justify-content: center;
    text-align: center;
  }
  td .td-label-role {
    font-weight: 600;
    transform: translateY(-4px);
  }
  section {
    background: white;
    border-radius: 6px;
    padding: 12px;
    margin: 10px 0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  section h4 {
    color: #1e3a8a;
    font-weight: 700;
    margin-bottom: 8px;
    font-size: 12px;
  }
  section pre {
    white-space: pre-wrap;
    font-family: inherit;
    line-height: 1.4;
    font-size: 10px;
    color: #1e293b;
  }
  section .legend-content {
    white-space: pre-wrap;
    font-family: inherit;
    line-height: 1.4;
    font-size: 10px;
    color: #1e293b;
  }
  section .legend-content strong {
    font-weight: 700 !important;
    font-weight: bold !important;
    display: inline !important;
  }
  section .legend-content br {
    display: block;
    content: "";
    margin-top: 0.5em;
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
    margin-bottom: 8px;
  }
  .setlux-logo { font-weight: 700; }
  .setlux-logo .set { color: #f97316; }
  .setlux-logo .lux { color: #3b82f6; }
  .footer-dot { font-weight: 700; }
  .footer-domain { color: #1e293b; font-weight: 600; }
  
  /* Ensure footer visibility in PDF */
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
