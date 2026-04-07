/**
 * Shared CSS styles for report week HTML PDF
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
  .container { max-width: 100%; margin: 0 auto; background: white; min-height: 100vh; display: flex; flex-direction: column; padding-bottom: 0; position: relative; }
  .container-pdf {
    width: 1123px;
    height: 794px;
    background: white;
    display: flex;
    flex-direction: column;
  }
  .header { background: white; color: #0f172a; flex-shrink: 0; }
  .header h1 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.5px; }
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
  .content { padding: 12px 20px; flex: 1; margin-bottom: 0; }
  .info-panel {
    background: #f1f5f9;
    margin: 10px 0 6px 0;
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
  .info-column {
    display: grid;
    gap: 4px;
  }
  .info-column-right {
    text-align: right;
    align-items: flex-end;
    justify-self: end;
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
  .week-title { font-size: 14px; font-weight: 600; color: #1e293b; margin: 12px 0 8px 0; padding: 4px 0; border-bottom: 1px solid #e2e8f0; }
  .table-container { background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  table { width: 100%; border-collapse: collapse; font-size: 10px; border: 2px solid #7dbfe8; }
  th { background: #bfe4f8; color: #0f172a; padding: 6px 6px; text-align: center; font-weight: 700; font-size: 9px; text-transform: uppercase; border: 1px solid #7dbfe8; vertical-align: middle; }
  td { padding: 6px 6px; border: 1px solid #e2e8f0; background: white; vertical-align: middle; color: #1e293b; }
  .th-label {
    display: flex;
    min-height: 24px;
    align-items: center;
    justify-content: center;
    text-align: center;
    transform: translateY(-2px);
  }
  .td-label {
    display: block;
    width: 100%;
    min-height: 20px;
  }
  .td-label-center {
    text-align: center;
  }
  .person-chip-wrap {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  .member-chip-line {
    display: inline-table;
    border-collapse: separate;
    border-spacing: 0;
    height: 18px;
    padding: 0 6px 0 2px;
    margin: 2px 0;
    border-radius: 999px;
    border: 1px solid #e6dccb;
    background: #fff9f0;
    max-width: 100%;
    vertical-align: middle;
  }
  .member-chip-badge {
    display: table-cell;
    min-width: 14px;
    height: 14px;
    padding: 0 4px;
    border-radius: 999px;
    background: linear-gradient(135deg, #60a5fa, #0369a1);
    color: #ffffff;
    font-size: 7px;
    font-weight: 700;
    line-height: 14px;
    text-align: center;
    vertical-align: middle;
  }
  .member-chip-name {
    display: table-cell;
    color: #1f2937;
    font-weight: 500;
    font-size: 7px;
    line-height: 14px;
    letter-spacing: 0.1px;
    vertical-align: middle;
    padding-left: 5px;
  }
  .member-chip-badge-text {
    position: relative;
    top: -5px;
    display: inline-block;
  }
  .member-chip-name-text {
    position: relative;
    top: -5px;
    display: inline-block;
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
  .setlux-logo { font-weight: 700; }
  .setlux-logo .set { color: #f97316; }
  .setlux-logo .lux { color: #3b82f6; }
  .footer-dot { font-weight: 700; }
  .footer-domain { color: #1e293b; font-weight: 600; }
  .footer-dot { font-weight: 700; }
  .footer-domain { color: #1e293b; font-weight: 600; }
  
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
