/**
 * Shared CSS styles for necesidades HTML
 */
export const baseStyles = `
  * {
    box-sizing: border-box;
  }

  body {
    font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif;
    color: #1e293b;
    line-height: 1.35;
    font-size: 12px;
    margin: 0;
    padding: 0;
    background: white;
  }
  
  .header {
    background: #ffffff;
    color: #0f172a;
    flex-shrink: 0;
  }

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

  .title-subtext {
    margin-top: 2px;
    font-size: 10px;
    font-weight: 500;
    opacity: 0.9;
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
  
  .content {
    padding: 8px 20px;
    flex: 1;
    margin-bottom: 0;
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
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
    border: 2px solid #7dbfe8;
  }
  
  th:first-child,
  td:first-child {
    width: 1%;
    white-space: nowrap;
  }
  
  th {
    background: #bfe4f8;
    color: #0f172a;
    padding: 5px 6px;
    text-align: center;
    font-weight: 700;
    font-size: 9px;
    text-transform: uppercase;
    border: 1px solid #7dbfe8;
    vertical-align: middle;
  }
  
  td {
    padding: 4px 5px;
    border: 1px solid #e2e8f0;
    background: white;
    vertical-align: middle;
    color: #1e293b;
  }

  .th-label {
    display: block;
    min-height: 0;
    text-align: center;
    line-height: 1.15;
  }

  .td-label {
    display: block;
    min-height: 24px;
    width: 100%;
  }

  .td-label-role {
    display: flex;
    min-height: 24px;
    align-items: center;
    font-weight: 600;
    width: 100%;
    font-size: 9px;
    line-height: 1.2;
  }

  td:not(:first-child) .td-label {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    text-align: center;
  }

  td:not(:first-child) {
    padding-top: 6px;
    padding-bottom: 3px;
  }

  .member-line {
    display: block;
    margin: 1px 0;
    color: #1f2937;
    font-weight: 500;
    font-size: 8px;
    line-height: 1.1;
    letter-spacing: 0.1px;
  }
  
  .footer {
    text-align: center;
    padding: 8px 0;
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

  .footer-dot {
    font-weight: 700;
  }

  .footer-domain {
    color: #1e293b;
    font-weight: 600;
  }
  
  .setlux-logo { 
    font-weight: 700; 
  }
  .setlux-logo .set { 
    color: #f97316; 
  }
  .setlux-logo .lux { 
    color: #3b82f6; 
  }
`;

/**
 * Container styles for normal HTML view
 */
export const containerStyles = `
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
`;

/**
 * Container styles for PDF
 */
export const containerPDFStyles = `
  .container-pdf {
    width: 1123px;
    height: 794px;
    background: white;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
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
    }
  }
`;
