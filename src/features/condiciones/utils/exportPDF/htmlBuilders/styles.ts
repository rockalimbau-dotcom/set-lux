/**
 * Shared CSS styles for condiciones HTML PDF
 */
export const baseStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif;
    background: #f8fafc;
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
    margin-bottom: 15px;
  }
  table { 
    width: 100%; 
    border-collapse: collapse; 
    font-size: 10px; 
    border: 2px solid #1e3a8a; 
  }
  th { 
    background: #1e3a8a; 
    color: white; 
    padding: 6px 6px; 
    text-align: left; 
    font-weight: 600; 
    font-size: 9px; 
    text-transform: uppercase; 
    border: 1px solid white; 
  }
  td { 
    padding: 6px 6px; 
    border: 1px solid #e2e8f0; 
    background: white; 
    vertical-align: top; 
    color: #1e293b; 
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

