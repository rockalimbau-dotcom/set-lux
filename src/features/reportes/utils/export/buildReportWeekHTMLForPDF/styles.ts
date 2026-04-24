/**
 * Shared CSS styles for report week HTML PDF
 */
export const baseStyles = `
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif;
    background: white;
    color: #1e293b;
    line-height: 1.35;
    font-size: 12px;
    margin: 0;
    padding: 0;
  }
  .container { max-width: 100%; margin: 0 auto; background: white; min-height: 100vh; display: flex; flex-direction: column; padding-bottom: 0; position: relative; }
  .container-pdf {
    width: 1123px;
    height: 794px;
    background: white;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .header { background: white; color: #0f172a; flex-shrink: 0; }
  .header h1 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.5px; }
  .title-bar {
    background: linear-gradient(135deg, #f97316 0%, #3b82f6 100%);
    color: #ffffff;
    padding: 8px 18px;
    text-align: center;
  }
  .title-text {
    font-size: 15px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.2px;
  }
  .content {
    padding: 8px 20px;
    flex: 1;
    margin-bottom: 0;
    overflow: hidden;
  }
  .info-panel {
    background: #f1f5f9;
    margin: 8px 20px 4px 20px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 18px;
  }
  .info-grid-single {
    grid-template-columns: 1fr;
  }
  .info-column {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .info-column-right {
    justify-items: end;
  }
  .info-label {
    font-weight: 700;
    color: #1f2937;
    font-size: 9px;
    line-height: 1.2;
  }
  .info-value {
    font-weight: 500;
    color: #0f172a;
    font-size: 9px;
    line-height: 1.2;
    word-break: break-word;
  }
  .info-item {
    min-width: 0;
    display: flex;
    gap: 4px;
    align-items: baseline;
    flex-wrap: nowrap;
  }
  .info-item-left {
    text-align: left;
  }
  .info-item-right {
    justify-content: flex-end;
    text-align: right;
  }
  .week-title {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    margin: 8px 0 6px 0;
    padding: 3px 0;
    border-bottom: 1px solid #e2e8f0;
  }
  .table-container {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(15,23,42,0.08);
    margin-bottom: 14px;
  }
  table { width: 100%; border-collapse: collapse; font-size: 9px; border: 2px solid #c9d8f0; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  th {
    background: linear-gradient(180deg, #d9ecfb 0%, #bfe4f8 100%);
    color: #0f172a;
    padding: 6px 6px;
    text-align: center;
    font-weight: 700;
    font-size: 8px;
    text-transform: uppercase;
    border: 1px solid #9fcbe9;
    vertical-align: middle;
    letter-spacing: 0.35px;
  }
  td { padding: 5px 6px; border: 1px solid #e2e8f0; background: white; vertical-align: middle; color: #1e293b; }
  .th-label {
    display: flex;
    min-height: 20px;
    align-items: center;
    justify-content: center;
    text-align: center;
    line-height: 1.1;
  }
  .td-label {
    display: block;
    width: 100%;
    min-height: 18px;
  }
  .td-label-center {
    text-align: center;
  }
  .person-label {
    display: flex;
    align-items: baseline;
    gap: 5px;
    line-height: 1.1;
    white-space: nowrap;
  }
  .person-role {
    font-size: 7px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.35px;
    color: #1d4ed8;
  }
  .person-name {
    font-size: 8px;
    font-weight: 600;
    color: #1f2937;
  }
  .footer {
    text-align: center;
    padding: 10px 0 8px 0;
    color: #64748b;
    font-size: 6px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    flex-shrink: 0;
    width: 100%;
    background: white;
    margin-top: auto;
    min-height: 24px;
  }
  .setlux-logo { font-weight: 700; }
  .setlux-logo .set { color: #f97316; }
  .setlux-logo .lux { color: #3b82f6; }
  .footer-dot { font-weight: 700; }
  .footer-domain { color: #1e293b; font-weight: 600; }
  .footer-dot { font-weight: 700; }
  .footer-domain { color: #1e293b; font-weight: 600; }
  
  @media print {
    .footer { 
      width: 100% !important; 
      background: white !important; 
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      color: #64748b !important;
      font-size: 6px !important;
      padding: 10px 0 8px 0 !important;
      border-top: 1px solid #e2e8f0 !important;
      margin-top: auto !important;
      min-height: 26px !important;
    }
  }
`;
