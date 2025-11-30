import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { parseDietas } from './text';

interface Project {
  nombre?: string;
  [key: string]: any;
}

interface BuildReportWeekHTMLParams {
  project?: Project;
  title?: string;
  safeSemana: string[];
  dayNameFromISO: (iso: string, index: number, dayNames?: string[]) => string;
  toDisplayDate: (iso: string) => string;
  horarioTexto: (iso: string) => string;
  CONCEPTS: string[];
  data: {
    [personaKey: string]: {
      [concepto: string]: {
        [fecha: string]: string;
      };
    };
  };
  personaKey: (persona: any) => string;
  personaRole: (persona: any) => string;
  personaName: (persona: any) => string;
}

export function buildReportWeekHTML({
  project,
  title,
  safeSemana,
  dayNameFromISO,
  toDisplayDate,
  horarioTexto,
  CONCEPTS,
  data,
}: BuildReportWeekHTMLParams): string {
  const esc = (s: any): string =>
    String(s ?? '').replace(
      /[&<>]/g,
      (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] || c
    );

  // Helper function to calculate total for a concept
  const calculateTotalForExport = (
    data: any,
    pKey: string,
    concepto: string,
    semana: string[]
  ): number | string => {
    if (concepto === 'Dietas') {
      // Para dietas, contar el número de días con dietas
      let count = 0;
      semana.forEach(fecha => {
        const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
        if (val && val.toString().trim() !== '') {
          count++;
        }
      });
      return count > 0 ? count : '';
    }

    if (concepto === 'Transporte' || concepto === 'Nocturnidad' || concepto === 'Penalty lunch') {
      // Para conceptos SI/NO, contar cuántos "Sí" hay
      let count = 0;
      semana.forEach(fecha => {
        const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
        if (val && (val.toString().trim().toLowerCase() === 'sí' || val.toString().trim().toLowerCase() === 'si')) {
          count++;
        }
      });
      return count > 0 ? count : '';
    }

    // Para conceptos numéricos, sumar todos los valores
    let total = 0;
    semana.forEach(fecha => {
      const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
      if (val && val.toString().trim() !== '') {
        const num = Number(val);
        if (!isNaN(num)) {
          total += num;
        }
      }
    });
    return total > 0 ? total : '';
  };

  // Genera por personas según data
  const personKeys = Object.keys(data || {});
  
  // Debug: log persona keys to see what roles are being detected in HTML
  console.log('=== HTML EXPORT DEBUG ===');
  console.log('Persona keys in HTML export:', personKeys);
  console.log('Full data object keys:', Object.keys(data || {}));
  console.log('Data object sample:', Object.keys(data || {}).slice(0, 3).map(k => ({ key: k, data: data[k] })));
  console.log('Keys containing "G" (HTML):', Object.keys(data || {}).filter(k => k.includes('G')));
  console.log('All keys with their parsed roles:', Object.keys(data || {}).map(k => {
    const [rolePart, ...nameParts] = String(k).split('__');
    return { key: k, role: rolePart, name: nameParts.join('__') };
  }));
  
  // Deep analysis of problematic keys
  const problematicKeys = Object.keys(data || {}).filter(k => {
    const [rolePart, ...nameParts] = String(k).split('__');
    const role = rolePart || '';
    const name = nameParts.join('__') || '';
    return !role && !name; // Empty role and name
  });
  
  if (problematicKeys.length > 0) {
    console.log('🚨 PROBLEMATIC KEYS (empty role/name):', problematicKeys);
    problematicKeys.forEach(k => {
      console.log(`  Key: "${k}", Raw data:`, data[k]);
    });
  }
  
  // Check for keys that might be causing "G-" display
  const suspiciousKeys = Object.keys(data || {}).filter(k => {
    const [rolePart, ...nameParts] = String(k).split('__');
    const role = rolePart || '';
    const name = nameParts.join('__') || '';
    return role === '' || name === '' || k.includes('__') || k === '';
  });
  
  if (suspiciousKeys.length > 0) {
    console.log('🔍 SUSPICIOUS KEYS (might cause G-):', suspiciousKeys);
    suspiciousKeys.forEach(k => {
      const [rolePart, ...nameParts] = String(k).split('__');
      console.log(`  Key: "${k}" -> role: "${rolePart}", name: "${nameParts.join('__')}"`);
    });
  }
  
  // Check for duplicate roles/names and deduplicate
  const roleNameMap = new Map();
  const duplicates: any[] = [];
  const deduplicatedData: any = {};
  
  Object.keys(data || {}).forEach(k => {
    const [rolePart, ...nameParts] = String(k).split('__');
    const role = rolePart || '';
    const name = nameParts.join('__') || '';
    const key = `${role}__${name}`;
    
    // Skip completely empty keys (role fantasma)
    if (!role && !name) {
      console.log(`🚫 Skipping empty key: "${k}"`);
      return;
    }
    
    if (roleNameMap.has(key)) {
      duplicates.push({ original: roleNameMap.get(key), duplicate: k });
      console.log(`🔄 Merging duplicate: "${k}" into "${roleNameMap.get(key)}"`);
      
      // Merge data from duplicate into original
      const originalKey = roleNameMap.get(key);
      if (data[k] && data[originalKey]) {
        // Merge concept data
        Object.keys(data[k]).forEach(concept => {
          if (!data[originalKey][concept]) {
            data[originalKey][concept] = {};
          }
          Object.keys(data[k][concept]).forEach(date => {
            if (data[k][concept][date] && !data[originalKey][concept][date]) {
              data[originalKey][concept][date] = data[k][concept][date];
            }
          });
        });
      }
    } else {
      roleNameMap.set(key, k);
      deduplicatedData[k] = data[k];
    }
  });
  
  if (duplicates.length > 0) {
    console.log('🚨 DUPLICATE ROLES DETECTED:', duplicates);
  }
  
  // Use deduplicated data
  const finalData = Object.keys(deduplicatedData).length > 0 ? deduplicatedData : data;
  
  // Role hierarchy for sorting (same as in derive.ts)
  const rolePriorityForReports = (role: string = ''): number => {
    const r = String(role).toUpperCase().trim();
    
    // EQUIPO BASE
    if (r === 'G') return 0;
    if (r === 'BB') return 1;
    if (r === 'E') return 2;
    if (r === 'TM') return 3;
    if (r === 'FB') return 4;
    if (r === 'AUX') return 5;
    if (r === 'M') return 6;
    
    // REFUERZOS
    if (r === 'REF') return 7;
    
    // EQUIPO PRELIGHT
    if (r === 'GP') return 8;
    if (r === 'BBP') return 9;
    if (r === 'EP') return 10;
    if (r === 'TMP') return 11;
    if (r === 'FBP') return 12;
    if (r === 'AUXP') return 13;
    if (r === 'MP') return 14;
    
    // EQUIPO RECOGIDA
    if (r === 'GR') return 15;
    if (r === 'BBR') return 16;
    if (r === 'ER') return 17;
    if (r === 'TMR') return 18;
    if (r === 'FBR') return 19;
    if (r === 'AUXR') return 20;
    if (r === 'MR') return 21;
    
    // Roles desconocidos al final
    return 1000;
  };
  
  // Sort person keys by role hierarchy
  const finalPersonKeys = Object.keys(finalData || {}).sort((a, b) => {
    const [roleA] = String(a).split('__');
    const [roleB] = String(b).split('__');
    const priorityA = rolePriorityForReports(roleA);
    const priorityB = rolePriorityForReports(roleB);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same priority, sort by name
    const [, ...namePartsA] = String(a).split('__');
    const [, ...namePartsB] = String(b).split('__');
    const nameA = namePartsA.join('__');
    const nameB = namePartsB.join('__');
    return nameA.localeCompare(nameB);
  });
  
  console.log('📋 Sorted person keys by role hierarchy:', finalPersonKeys.map(k => {
    const [role] = String(k).split('__');
    return `${role} (priority: ${rolePriorityForReports(role)})`;
  }));
  
  // Filtrar días que no sean DESCANSO o que tengan datos
  const safeSemanaWithData = safeSemana.filter(iso => {
    const dayLabel = horarioTexto(iso);
    // Si es DESCANSO, verificar si tiene datos
    if (dayLabel === 'DESCANSO') {
      return finalPersonKeys.some(pk => {
        return CONCEPTS.some(concepto => {
          const value = finalData?.[pk]?.[concepto]?.[iso];
          return value && value.toString().trim() !== '';
        });
      });
    }
    return true; // No es DESCANSO, incluirlo
  });

  const headDays = `
      <tr>
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">&nbsp;</th>
        ${safeSemanaWithData
          .map(
            (iso, i) => `
          <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">
            ${esc(dayNameFromISO(iso, i))}<br/>${esc(toDisplayDate(iso))}
          </th>`
          )
          .join('')}
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;font-weight:bold;">Total</th>
      </tr>`;

  const headHorario = `
      <tr>
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">Horario</th>
        ${safeSemanaWithData
          .map(
            iso =>
              `<th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">${esc(
                horarioTexto(iso)
              )}</th>`
          )
          .join('')}
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">Semana</th>
      </tr>`;


  // Filtrar conceptos que tengan datos significativos (no 0, vacíos, o solo espacios)
  const conceptosConDatos = CONCEPTS.filter(concepto => {
    return finalPersonKeys.some(pk => {
      return safeSemanaWithData.some(iso => {
        const value = finalData?.[pk]?.[concepto]?.[iso];
        if (!value) return false;
        
        const trimmedValue = value.toString().trim();
        if (trimmedValue === '') return false;
        if (trimmedValue === '0') return false;
        if (trimmedValue === '0.0') return false;
        if (trimmedValue === '0,0') return false;
        
        return true;
      });
    });
  });
  
  console.log('📊 Filtered concepts with data (HTML):', conceptosConDatos);
  console.log('📊 All concepts:', CONCEPTS);
  console.log('📊 Removed concepts (HTML):', CONCEPTS.filter(c => !conceptosConDatos.includes(c)));

  const body =
    (Array.isArray(safeSemana) ? safeSemana : []) &&
    (Array.isArray(CONCEPTS) ? true : true) &&
    (function () {
      return finalPersonKeys
        .filter(pk => {
          // Pre-filter: check if person has any meaningful data (not 0, empty, or just spaces)
          const hasMeaningfulData = safeSemanaWithData.some(iso => {
            return conceptosConDatos.some(concepto => {
              const value = finalData?.[pk]?.[concepto]?.[iso];
              if (!value) return false;
              
              const trimmedValue = value.toString().trim();
              if (trimmedValue === '') return false;
              if (trimmedValue === '0') return false;
              if (trimmedValue === '0.0') return false;
              if (trimmedValue === '0,0') return false;
              
              return true;
            });
          });
          
          if (!hasMeaningfulData) {
            console.log(`🚫 Filtering out person with no meaningful data (HTML): ${pk}`);
            return false;
          }
          
          return true;
        })
        .map(pk => {
          // pk es personaKey(p)
          // reconstruimos role/name desde una persona simulada
          // Intentamos obtener role/name desde las claves superiores externas si hiciera falta
          const [rolePart, ...nameParts] = String(pk).split('__');
          const role = rolePart || '';
          const name = nameParts.join('__');
          
          // Debug: log parsed role and name
          console.log(`HTML Parsed from "${pk}": role="${role}", name="${name}"`);

          // Skip entries with empty or invalid roles/names
          if (!role && !name) {
            console.log(`Skipping invalid entry: "${pk}"`);
            return '';
          }

          const displayName = role && name ? `${role} — ${name}` : (role || name);

          const head = `
        <tr>
          <td style="border:1px solid #999;padding:6px;font-weight:600;background:#f5f5f5;">
            ${esc(displayName)}
          </td>
          ${safeSemanaWithData
            .map(
              () => `<td style="border:1px solid #999;padding:6px;">&nbsp;</td>`
            )
            .join('')}
          <td style="border:1px solid #999;padding:6px;">&nbsp;</td>
        </tr>`;

          const rows = conceptosConDatos
            .filter(c => {
              // Solo mostrar conceptos que tengan datos significativos para esta persona
              return safeSemanaWithData.some(iso => {
                const value = finalData?.[pk]?.[c]?.[iso];
                if (!value) return false;
                
                const trimmedValue = value.toString().trim();
                if (trimmedValue === '') return false;
                if (trimmedValue === '0') return false;
                if (trimmedValue === '0.0') return false;
                if (trimmedValue === '0,0') return false;
                
                return true;
              });
            })
            .map(
              c => {
                const total = calculateTotalForExport(finalData, pk, c, safeSemanaWithData);
                let totalDisplay = '';
                if (total === '') {
                  totalDisplay = '';
                } else if (c === 'Dietas' && typeof total === 'object' && total !== null && 'breakdown' in total) {
                  const breakdown = (total as { breakdown: Map<string, number> }).breakdown;
                  if (breakdown.size > 0) {
                    totalDisplay = Array.from(breakdown.entries())
                      .map(([item, count]) => `x${count} ${item}`)
                      .join(', ');
                  }
                } else if (typeof total === 'number') {
                  totalDisplay = total % 1 === 0 ? total.toString() : total.toFixed(2);
                } else {
                  totalDisplay = total.toString();
                }
                return `
        <tr>
          <td style="border:1px solid #999;padding:6px;">${esc(c)}</td>
          ${safeSemanaWithData
            .map(
              iso =>
                `<td style="border:1px solid #999;padding:6px;">${esc(
                  finalData?.[pk]?.[c]?.[iso] ?? ''
                )}</td>`
            )
            .join('')}
          <td style="border:1px solid #999;padding:6px;text-align:left;font-weight:bold;">${esc(totalDisplay)}</td>
        </tr>`;
              }
            ).join('');

          return head + rows;
        })
        .join('');
    })();

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(project?.nombre || 'Proyecto')} – ${esc(title || 'Semana')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.3;
      font-size: 12px;
    }
    .container { max-width: 100%; margin: 0 auto; background: white; min-height: 100vh; display: flex; flex-direction: column; padding-bottom: 0; position: relative; }
    .header { background: linear-gradient(135deg, #f97316 0%, #3b82f6 100%); color: white; padding: 12px 20px; text-align: center; flex-shrink: 0; }
    .header h1 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 12px 20px; flex: 1; margin-bottom: 0; }
    .info-panel { background: #f1f5f9; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; display: flex; gap: 24px; align-items: center; }
    .info-item { display: flex; flex-direction: column; align-items: flex-start; }
    .info-label { font-size: 9px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 11px; color: #1e293b; font-weight: 500; }
    .week-title { font-size: 14px; font-weight: 600; color: #1e293b; margin: 12px 0 8px 0; padding: 4px 0; border-bottom: 1px solid #e2e8f0; }
    .table-container { background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; font-size: 10px; border: 2px solid #1e3a8a; }
    th { background: #1e3a8a; color: white; padding: 6px 6px; text-align: left; font-weight: 600; font-size: 9px; text-transform: uppercase; border: 1px solid white; }
    td { padding: 6px 6px; border: 1px solid #e2e8f0; background: white; vertical-align: top; color: #1e293b; }
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
      margin-bottom: 8px; /* separate from bottom edge */
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reportes - ${title?.includes('-') ? 'Preproducción' : title?.match(/\d+/) ? 'Producción' : 'Semana'}</h1>
    </div>
    <div class="content">
      <div class="info-panel">
        <div class="info-item">
          <div class="info-label">Producción</div>
          <div class="info-value">${esc(project?.produccion || '—')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Proyecto</div>
          <div class="info-value">${esc(project?.nombre || 'Proyecto')}</div>
        </div>
      </div>
      <div class="week-title">${esc(title || 'Semana')}</div>
      <div class="table-container">
        <table>
          <thead>
            ${headDays}
            ${headHorario}
          </thead>
          <tbody>
            ${body}
          </tbody>
        </table>
      </div>
    </div>
    <div class="footer">
      <span>Generado automáticamente por</span>
      <span class="setlux-logo">
        <span class="set">Set</span><span class="lux">Lux</span>
      </span>
    </div>
  </div>
</body>
</html>`;

  return html;
}

// PDF-optimized HTML generation with pagination
export function buildReportWeekHTMLForPDF({
  project,
  title,
  safeSemana,
  dayNameFromISO,
  toDisplayDate,
  horarioTexto,
  CONCEPTS,
  data,
}: Omit<BuildReportWeekHTMLParams, 'personaKey' | 'personaRole' | 'personaName'>): string {
  const esc = (s: any): string =>
    String(s ?? '').replace(
      /[&<>]/g,
      (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] || c
    );

  // Helper function to calculate total for a concept
  const calculateTotalForExport = (
    data: any,
    pKey: string,
    concepto: string,
    semana: string[]
  ): number | string | { breakdown: Map<string, number> } => {
    if (concepto === 'Dietas') {
      // Para dietas, contar cada tipo de dieta por separado
      const breakdown = new Map<string, number>();
      semana.forEach(fecha => {
        const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
        if (val && val.toString().trim() !== '') {
          const parsed = parseDietas(val);
          parsed.items.forEach(item => {
            if (item !== 'Ticket') {
              breakdown.set(item, (breakdown.get(item) || 0) + 1);
            }
          });
          if (parsed.ticket !== null) {
            breakdown.set('Ticket', (breakdown.get('Ticket') || 0) + 1);
          }
        }
      });
      return breakdown.size > 0 ? { breakdown } : '';
    }

    if (concepto === 'Transporte' || concepto === 'Nocturnidad' || concepto === 'Penalty lunch') {
      // Para conceptos SI/NO, contar cuántos "Sí" hay
      let count = 0;
      semana.forEach(fecha => {
        const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
        if (val && (val.toString().trim().toLowerCase() === 'sí' || val.toString().trim().toLowerCase() === 'si')) {
          count++;
        }
      });
      return count > 0 ? count : '';
    }

    // Para conceptos numéricos, sumar todos los valores
    let total = 0;
    semana.forEach(fecha => {
      const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
      if (val && val.toString().trim() !== '') {
        const num = Number(val);
        if (!isNaN(num)) {
          total += num;
        }
      }
    });
    return total > 0 ? total : '';
  };

  // Generate body for current page only - data already contains only the persons for this page
  const personKeys = Object.keys(data || {});
  
  // Debug: log persona keys to see what roles are being detected
  console.log('=== PDF EXPORT DEBUG ===');
  console.log('Persona keys in PDF export:', personKeys);
  console.log('Full data object keys (PDF):', Object.keys(data || {}));
  console.log('Data object sample (PDF):', Object.keys(data || {}).slice(0, 3).map(k => ({ key: k, data: data[k] })));
  console.log('Keys containing "G":', Object.keys(data || {}).filter(k => k.includes('G')));
  console.log('All keys with their parsed roles (PDF):', Object.keys(data || {}).map(k => {
    const [rolePart, ...nameParts] = String(k).split('__');
    return { key: k, role: rolePart, name: nameParts.join('__') };
  }));
  
  // Check for duplicate roles/names in PDF and deduplicate
  const roleNameMapPDF = new Map();
  const duplicatesPDF: any[] = [];
  const deduplicatedDataPDF: any = {};
  
  Object.keys(data || {}).forEach(k => {
    const [rolePart, ...nameParts] = String(k).split('__');
    const role = rolePart || '';
    const name = nameParts.join('__') || '';
    const key = `${role}__${name}`;
    
    // Skip completely empty keys (role fantasma)
    if (!role && !name) {
      console.log(`🚫 Skipping empty key (PDF): "${k}"`);
      return;
    }
    
    if (roleNameMapPDF.has(key)) {
      duplicatesPDF.push({ original: roleNameMapPDF.get(key), duplicate: k });
      console.log(`🔄 Merging duplicate (PDF): "${k}" into "${roleNameMapPDF.get(key)}"`);
      
      // Merge data from duplicate into original
      const originalKey = roleNameMapPDF.get(key);
      if (data[k] && data[originalKey]) {
        // Merge concept data
        Object.keys(data[k]).forEach(concept => {
          if (!data[originalKey][concept]) {
            data[originalKey][concept] = {};
          }
          Object.keys(data[k][concept]).forEach(date => {
            if (data[k][concept][date] && !data[originalKey][concept][date]) {
              data[originalKey][concept][date] = data[k][concept][date];
            }
          });
        });
      }
    } else {
      roleNameMapPDF.set(key, k);
      deduplicatedDataPDF[k] = data[k];
    }
  });
  
  if (duplicatesPDF.length > 0) {
    console.log('🚨 DUPLICATE ROLES DETECTED (PDF):', duplicatesPDF);
  }
  
  // Use deduplicated data
  const finalData = Object.keys(deduplicatedDataPDF).length > 0 ? deduplicatedDataPDF : data;
  
  // Role hierarchy for sorting (same as in derive.ts)
  const rolePriorityForReportsPDF = (role: string = ''): number => {
    const r = String(role).toUpperCase().trim();
    
    // EQUIPO BASE
    if (r === 'G') return 0;
    if (r === 'BB') return 1;
    if (r === 'E') return 2;
    if (r === 'TM') return 3;
    if (r === 'FB') return 4;
    if (r === 'AUX') return 5;
    if (r === 'M') return 6;
    
    // REFUERZOS
    if (r === 'REF') return 7;
    
    // EQUIPO PRELIGHT
    if (r === 'GP') return 8;
    if (r === 'BBP') return 9;
    if (r === 'EP') return 10;
    if (r === 'TMP') return 11;
    if (r === 'FBP') return 12;
    if (r === 'AUXP') return 13;
    if (r === 'MP') return 14;
    
    // EQUIPO RECOGIDA
    if (r === 'GR') return 15;
    if (r === 'BBR') return 16;
    if (r === 'ER') return 17;
    if (r === 'TMR') return 18;
    if (r === 'FBR') return 19;
    if (r === 'AUXR') return 20;
    if (r === 'MR') return 21;
    
    // Roles desconocidos al final
    return 1000;
  };
  
  // Agrupar personas por bloque (base, pre, pick) y ordenar dentro de cada bloque
  const getBlockFromKey = (key: string): 'base' | 'pre' | 'pick' => {
    if (/\.pre__/.test(key) || /REF\.pre__/.test(key)) return 'pre';
    if (/\.pick__/.test(key) || /REF\.pick__/.test(key)) return 'pick';
    return 'base';
  };

  const personsByBlock = {
    base: [] as string[],
    pre: [] as string[],
    pick: [] as string[],
  };

  Object.keys(finalData || {}).forEach(key => {
    const block = getBlockFromKey(key);
    personsByBlock[block].push(key);
  });

  // Función para obtener el rol base (sin sufijo P o R)
  const getBaseRole = (role: string): string => {
    const r = String(role).toUpperCase().trim();
    if (r === 'REF') return 'REF';
    // Remover sufijos P y R
    return r.replace(/[PR]$/, '');
  };

  // Función para obtener prioridad del rol base
  const getBaseRolePriority = (role: string): number => {
    const baseRole = getBaseRole(role);
    const r = baseRole.toUpperCase().trim();
    
    // EQUIPO BASE
    if (r === 'G') return 0;
    if (r === 'BB') return 1;
    if (r === 'E') return 2;
    if (r === 'TM') return 3;
    if (r === 'FB') return 4;
    if (r === 'AUX') return 5;
    if (r === 'M') return 6;
    if (r === 'REF') return 7; // REF al final
    
    return 1000;
  };

  // Ordenar cada bloque por jerarquía de roles
  const sortByRoleHierarchy = (keys: string[], block: 'base' | 'pre' | 'pick') => {
    return keys.sort((a, b) => {
      const [roleA] = String(a).split('__');
      const [roleB] = String(b).split('__');
      
      // Para bloques pre y pick, separar REF del resto
      if (block === 'pre' || block === 'pick') {
        const isRefA = roleA === 'REF' || roleA.startsWith('REF');
        const isRefB = roleB === 'REF' || roleB.startsWith('REF');
        
        // REF siempre al final dentro de su bloque
        if (isRefA && !isRefB) return 1;
        if (!isRefA && isRefB) return -1;
        
        // Si ambos son REF o ambos no son REF, ordenar por nombre
        if (isRefA && isRefB) {
          const [, ...namePartsA] = String(a).split('__');
          const [, ...namePartsB] = String(b).split('__');
          const nameA = namePartsA.join('__');
          const nameB = namePartsB.join('__');
          return nameA.localeCompare(nameB);
        }
        
        // Ambos no son REF: ordenar por jerarquía del rol base
        const priorityA = getBaseRolePriority(roleA);
        const priorityB = getBaseRolePriority(roleB);
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
      } else {
        // Para bloque base, usar la prioridad normal
        const priorityA = rolePriorityForReportsPDF(roleA);
        const priorityB = rolePriorityForReportsPDF(roleB);
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
      }
      
      // If same priority, sort by name
      const [, ...namePartsA] = String(a).split('__');
      const [, ...namePartsB] = String(b).split('__');
      const nameA = namePartsA.join('__');
      const nameB = namePartsB.join('__');
      return nameA.localeCompare(nameB);
    });
  };

  personsByBlock.base = sortByRoleHierarchy(personsByBlock.base, 'base');
  personsByBlock.pre = sortByRoleHierarchy(personsByBlock.pre, 'pre');
  personsByBlock.pick = sortByRoleHierarchy(personsByBlock.pick, 'pick');

  // Mantener orden: base, pre, pick
  const finalPersonKeys = [
    ...personsByBlock.base,
    ...personsByBlock.pre,
    ...personsByBlock.pick,
  ];
  
  console.log('📋 Sorted person keys by role hierarchy (PDF):', finalPersonKeys.map(k => {
    const [role] = String(k).split('__');
    return `${role} (priority: ${rolePriorityForReportsPDF(role)})`;
  }));
  
  // Filtrar días que no sean DESCANSO o que tengan datos
  const safeSemanaWithData = safeSemana.filter(iso => {
    const dayLabel = horarioTexto(iso);
    // Si es DESCANSO, verificar si tiene datos
    if (dayLabel === 'DESCANSO') {
      return finalPersonKeys.some(pk => {
        return CONCEPTS.some(concepto => {
          const value = finalData?.[pk]?.[concepto]?.[iso];
          return value && value.toString().trim() !== '';
        });
      });
    }
    return true; // No es DESCANSO, incluirlo
  });

  const headDays = `
      <tr>
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">&nbsp;</th>
        ${safeSemanaWithData
          .map(
            (iso, i) => `
          <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">
            ${esc(dayNameFromISO(iso, i))}<br/>${esc(toDisplayDate(iso))}
          </th>`
          )
          .join('')}
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;font-weight:bold;">Total</th>
      </tr>`;

  const headHorario = `
      <tr>
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">Horario</th>
        ${safeSemanaWithData
          .map(
            iso =>
              `<th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">${esc(
                horarioTexto(iso)
              )}</th>`
          )
          .join('')}
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">Semana</th>
      </tr>`;

  // Filtrar conceptos que tengan datos significativos (no 0, vacíos, o solo espacios)
  const conceptosConDatos = CONCEPTS.filter(concepto => {
    return finalPersonKeys.some(pk => {
      return safeSemanaWithData.some(iso => {
        const value = finalData?.[pk]?.[concepto]?.[iso];
        if (!value) return false;
        
        const trimmedValue = value.toString().trim();
        if (trimmedValue === '') return false;
        if (trimmedValue === '0') return false;
        if (trimmedValue === '0.0') return false;
        if (trimmedValue === '0,0') return false;
        
        return true;
      });
    });
  });
  
  console.log('📊 Filtered concepts with data (PDF):', conceptosConDatos);
  console.log('📊 All concepts:', CONCEPTS);
  console.log('📊 Removed concepts (PDF):', CONCEPTS.filter(c => !conceptosConDatos.includes(c)));
  
  // Función para generar el HTML de una persona
  const generatePersonHTML = (pk: string) => {
      const [rolePart, ...nameParts] = String(pk).split('__');
      const role = rolePart || '';
      const name = nameParts.join('__');
      
      // Debug: log parsed role and name
      console.log(`Parsed from "${pk}": role="${role}", name="${name}"`);

      // Skip entries with empty or invalid roles/names
      if (!role && !name) {
        console.log(`Skipping invalid entry (PDF): "${pk}"`);
        return '';
      }

      const displayName = role && name ? `${role} — ${name}` : (role || name);

      const head = `
        <tr>
          <td style="border:1px solid #999;padding:6px;font-weight:600;background:#f5f5f5;">
            ${esc(displayName)}
          </td>
          ${safeSemanaWithData
            .map(
              () => `<td style="border:1px solid #999;padding:6px;">&nbsp;</td>`
            )
            .join('')}
          <td style="border:1px solid #999;padding:6px;">&nbsp;</td>
        </tr>`;

      const rows = conceptosConDatos
        .filter(c => {
          // Solo mostrar conceptos que tengan datos significativos para esta persona
          return safeSemanaWithData.some(iso => {
            const value = finalData?.[pk]?.[c]?.[iso];
            if (!value) return false;
            
            const trimmedValue = value.toString().trim();
            if (trimmedValue === '') return false;
            if (trimmedValue === '0') return false;
            if (trimmedValue === '0.0') return false;
            if (trimmedValue === '0,0') return false;
            
            return true;
          });
        })
        .map(
          c => {
            const total = calculateTotalForExport(finalData, pk, c, safeSemanaWithData);
            let totalDisplay = '';
            if (total === '') {
              totalDisplay = '';
            } else if (c === 'Dietas' && typeof total === 'object' && total !== null && 'breakdown' in total) {
              const breakdown = (total as { breakdown: Map<string, number> }).breakdown;
              if (breakdown.size > 0) {
                totalDisplay = Array.from(breakdown.entries())
                  .map(([item, count]) => `x${count} ${item}`)
                  .join(', ');
              }
            } else if (typeof total === 'number') {
              totalDisplay = total % 1 === 0 ? total.toString() : total.toFixed(2);
            } else {
              totalDisplay = total.toString();
            }
            return `
        <tr>
          <td style="border:1px solid #999;padding:6px;">${esc(c)}</td>
          ${safeSemanaWithData
            .map(
              iso =>
                `<td style="border:1px solid #999;padding:6px;">${esc(
                  finalData?.[pk]?.[c]?.[iso] ?? ''
                )}</td>`
            )
            .join('')}
          <td style="border:1px solid #999;padding:6px;text-align:left;font-weight:bold;">${esc(totalDisplay)}</td>
        </tr>`;
          }
        ).join('');

      return head + rows;
  };

  // Generar body agrupado por bloques con títulos
  const bodyParts: string[] = [];

  // Equipo base
  const basePersons = personsByBlock.base.filter(pk => {
    const hasMeaningfulData = safeSemanaWithData.some(iso => {
      return conceptosConDatos.some(concepto => {
        const value = finalData?.[pk]?.[concepto]?.[iso];
        if (!value) return false;
        const trimmedValue = value.toString().trim();
        return trimmedValue !== '' && trimmedValue !== '0' && trimmedValue !== '0.0' && trimmedValue !== '0,0';
      });
    });
    return hasMeaningfulData;
  });

  if (basePersons.length > 0) {
    // Título para Equipo base
    const baseTitle = `
      <tr>
        <td colspan="${safeSemanaWithData.length + 2}" style="border:1px solid #999;padding:8px;font-weight:700;background:#fff3e0;color:#e65100;text-align:center;">
          EQUIPO BASE
        </td>
      </tr>`;
    bodyParts.push(baseTitle);
    bodyParts.push(...basePersons.map(generatePersonHTML));
  }

  // Equipo Prelight
  const prePersons = personsByBlock.pre.filter(pk => {
    const hasMeaningfulData = safeSemanaWithData.some(iso => {
      return conceptosConDatos.some(concepto => {
        const value = finalData?.[pk]?.[concepto]?.[iso];
        if (!value) return false;
        const trimmedValue = value.toString().trim();
        return trimmedValue !== '' && trimmedValue !== '0' && trimmedValue !== '0.0' && trimmedValue !== '0,0';
      });
    });
    return hasMeaningfulData;
  });

  if (prePersons.length > 0) {
    // Título para Equipo Prelight
    const preTitle = `
      <tr>
        <td colspan="${safeSemanaWithData.length + 2}" style="border:1px solid #999;padding:8px;font-weight:700;background:#e3f2fd;color:#1565c0;text-align:center;">
          EQUIPO PRELIGHT
        </td>
      </tr>`;
    bodyParts.push(preTitle);
    bodyParts.push(...prePersons.map(generatePersonHTML));
  }

  // Equipo Recogida
  const pickPersons = personsByBlock.pick.filter(pk => {
    const hasMeaningfulData = safeSemanaWithData.some(iso => {
      return conceptosConDatos.some(concepto => {
        const value = finalData?.[pk]?.[concepto]?.[iso];
        if (!value) return false;
        const trimmedValue = value.toString().trim();
        return trimmedValue !== '' && trimmedValue !== '0' && trimmedValue !== '0.0' && trimmedValue !== '0,0';
      });
    });
    return hasMeaningfulData;
  });

  if (pickPersons.length > 0) {
    // Título para Equipo Recogida
    const pickTitle = `
      <tr>
        <td colspan="${safeSemanaWithData.length + 2}" style="border:1px solid #999;padding:8px;font-weight:700;background:#e3f2fd;color:#1565c0;text-align:center;">
          EQUIPO RECOGIDA
        </td>
      </tr>`;
    bodyParts.push(pickTitle);
    bodyParts.push(...pickPersons.map(generatePersonHTML));
  }

  const body = bodyParts.join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(project?.nombre || 'Proyecto')} – ${esc(title || 'Semana')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.3;
      font-size: 12px;
    }
    .container { max-width: 100%; margin: 0 auto; background: white; min-height: 100vh; display: flex; flex-direction: column; padding-bottom: 0; position: relative; }
    .container-pdf {
      /* Fixed size to match html2canvas capture (A4 landscape @96dpi) */
      width: 1123px;
      height: 794px;
      background: white;
      display: flex;
      flex-direction: column;
    }
    .header { background: linear-gradient(135deg, #f97316 0%, #3b82f6 100%); color: white; padding: 12px 20px; text-align: center; flex-shrink: 0; }
    .header h1 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 12px 20px; flex: 1; margin-bottom: 0; }
    .info-panel { background: #f1f5f9; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; display: flex; gap: 24px; align-items: center; }
    .info-item { display: flex; flex-direction: column; align-items: flex-start; }
    .info-label { font-size: 9px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 11px; color: #1e293b; font-weight: 500; }
    .week-title { font-size: 14px; font-weight: 600; color: #1e293b; margin: 12px 0 8px 0; padding: 4px 0; border-bottom: 1px solid #e2e8f0; }
    .table-container { background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; font-size: 10px; border: 2px solid #1e3a8a; }
    th { background: #1e3a8a; color: white; padding: 6px 6px; text-align: left; font-weight: 600; font-size: 9px; text-transform: uppercase; border: 1px solid white; }
    td { padding: 6px 6px; border: 1px solid #e2e8f0; background: white; vertical-align: top; color: #1e293b; }
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
  </style>
</head>
<body>
  <div class="container-pdf">
    <div class="header">
      <h1>Reportes - ${title?.includes('-') ? 'Preproducción' : title?.match(/\d+/) ? 'Producción' : 'Semana'}</h1>
    </div>
    <div class="content">
      <div class="info-panel">
        <div class="info-item">
          <div class="info-label">Producción</div>
          <div class="info-value">${esc(project?.produccion || '—')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Proyecto</div>
          <div class="info-value">${esc(project?.nombre || 'Proyecto')}</div>
        </div>
      </div>
      <div class="week-title">${esc(title || 'Semana')}</div>
      <div class="table-container">
        <table>
          <thead>
            ${headDays}
            ${headHorario}
          </thead>
          <tbody>
            ${body}
          </tbody>
        </table>
      </div>
    </div>
    <div class="footer">
      <span>Generado automáticamente por</span>
      <span class="setlux-logo">
        <span class="set">Set</span><span class="lux">Lux</span>
      </span>
    </div>
  </div>
</body>
</html>`;

  return html;
}

type BuildPdfParams = BuildReportWeekHTMLParams & {
  orientation?: 'landscape' | 'portrait';
  filename?: string;
};

export async function exportReportWeekToPDF(params: BuildPdfParams) {
  const {
    project,
    title,
    safeSemana,
    dayNameFromISO,
    toDisplayDate,
    horarioTexto,
    CONCEPTS,
    data,
    filename,
  } = params;

  try {
    // Calculate pagination with dynamic adjustment
    const personKeys = Object.keys(data || {});
    const totalPersons = personKeys.length;
    
    // Smart pagination with auto-fill logic
    const estimateContentHeight = (numPersons: number, conceptsPerPerson: number = CONCEPTS.length) => {
      const headerHeight = 80; // Header + info panel
      const footerHeight = 25; // Footer (reduced to allow more content)
      const tableHeaderHeight = 40; // Table headers (2 rows)
      const personHeaderHeight = 20; // Height per person header
      const conceptRowHeight = 15; // Height per concept row
      
      const totalPersonHeight = numPersons * (personHeaderHeight + (conceptsPerPerson * conceptRowHeight));
      return headerHeight + footerHeight + tableHeaderHeight + totalPersonHeight;
    };
    
    // Smart pagination: start aggressive and adjust dynamically
    let personsPerPage = Math.min(15, totalPersons); // Start more aggressive
    const maxPageHeight = 720; // Available height for content (more space for content)
    const minPersonsPerPage = 1; // Minimum to prevent infinite loops
    
    // Estimate concepts per person (average case)
    const estimatedConceptsPerPerson = Math.min(CONCEPTS.length, 3); // Assume max 3 concepts per person after filtering
    
    // Dynamic adjustment with estimated concepts
    while (estimateContentHeight(personsPerPage, estimatedConceptsPerPerson) > maxPageHeight && personsPerPage > minPersonsPerPage) {
      personsPerPage--;
    }
    
    // Auto-fill logic: if we have space, try to add more persons
    let optimalPersonsPerPage = personsPerPage;
    const spaceBuffer = 20; // Buffer to maintain nice margins
    
    for (let testPersons = personsPerPage + 1; testPersons <= totalPersons; testPersons++) {
      const testHeight = estimateContentHeight(testPersons, estimatedConceptsPerPerson);
      const availableSpace = maxPageHeight - testHeight;
      
      if (testHeight <= maxPageHeight && availableSpace >= spaceBuffer) {
        optimalPersonsPerPage = testPersons;
        console.log(`🎯 Auto-fill: Can fit ${testPersons} persons (height: ${testHeight}px, space left: ${availableSpace}px)`);
      } else if (testHeight <= maxPageHeight && availableSpace < spaceBuffer) {
        // We can fit it but would be too tight, stop here
        console.log(`⚠️ Auto-fill: ${testPersons} persons would fit but too tight (space left: ${availableSpace}px < ${spaceBuffer}px buffer)`);
        break;
      } else {
        // Would exceed page height
        console.log(`❌ Auto-fill: ${testPersons} persons would exceed page height (${testHeight}px > ${maxPageHeight}px)`);
        break;
      }
    }
    
    personsPerPage = optimalPersonsPerPage;
    let totalPages = Math.ceil(totalPersons / personsPerPage) || 1;
    
    // Additional optimization: if concepts are few, we can be more aggressive
    if (estimatedConceptsPerPerson <= 2) {
      const aggressiveMaxHeight = 750; // More space when concepts are few
      let aggressivePersonsPerPage = personsPerPage;
      
      for (let testPersons = personsPerPage + 1; testPersons <= totalPersons; testPersons++) {
        const testHeight = estimateContentHeight(testPersons, estimatedConceptsPerPerson);
        if (testHeight <= aggressiveMaxHeight) {
          aggressivePersonsPerPage = testPersons;
          console.log(`🚀 Aggressive mode: Can fit ${testPersons} persons with few concepts (height: ${testHeight}px)`);
        } else {
          break;
        }
      }
      
      if (aggressivePersonsPerPage > personsPerPage) {
        personsPerPage = aggressivePersonsPerPage;
        totalPages = Math.ceil(totalPersons / personsPerPage) || 1;
        console.log(`🚀 Applied aggressive optimization: ${personsPerPage} persons per page`);
      }
    }
    
    console.log(`📄 Smart Pagination: ${totalPersons} persons, ${personsPerPage} per page, ${totalPages} pages`);
    console.log(`📏 Final height for ${personsPerPage} persons: ${estimateContentHeight(personsPerPage, estimatedConceptsPerPerson)}px`);
    console.log(`🎯 Auto-fill optimization: ${optimalPersonsPerPage !== personsPerPage ? 'Applied' : 'Not needed'}`);
    console.log(`📊 Estimated concepts per person: ${estimatedConceptsPerPerson} (affects pagination)`);
    
    

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Generate pages
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startPerson = pageIndex * personsPerPage;
      const endPerson = Math.min(startPerson + personsPerPage, totalPersons);
      const pagePersonKeys = personKeys.slice(startPerson, endPerson);
      
      
      // Create data subset for this page
      const pageData: any = {};
      pagePersonKeys.forEach(pk => {
        pageData[pk] = data[pk];
      });
      
      // Generate HTML for this page
      const html = buildReportWeekHTMLForPDF({
        project,
        title,
        safeSemana,
        dayNameFromISO,
        toDisplayDate,
        horarioTexto,
        CONCEPTS,
        data: pageData,
      });
      
      // Create a temporary container for this page
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = html;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1123px'; // A4 landscape width
      tempContainer.style.height = 'auto'; // Let it size naturally
      tempContainer.style.minHeight = '794px'; // Minimum A4 landscape height
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.overflow = 'visible'; // Allow footer to be visible
      
      // Add to DOM temporarily
      document.body.appendChild(tempContainer);
      
      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Debug: Check if footer exists and is visible
      const footer = tempContainer.querySelector('.footer') as HTMLElement;
      if (footer) {
        console.log(`📄 Page ${pageIndex + 1}: Footer found, height: ${footer.offsetHeight}px, visible: ${footer.offsetHeight > 0}`);
        console.log(`📄 Page ${pageIndex + 1}: Footer content:`, footer.textContent);
        console.log(`🔧 Page ${pageIndex + 1}: Footer styles applied`);
      } else {
        console.log(`❌ Page ${pageIndex + 1}: Footer NOT found!`);
      }
      
      
      // Convert to canvas with dynamic height to include footer
      const canvas = await html2canvas(tempContainer, {
        scale: 3, // Higher quality for readability
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1123, // 297mm at 96 DPI
        height: tempContainer.scrollHeight + 100, // Dynamic height to include footer + extra space
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1123,
        windowHeight: tempContainer.scrollHeight + 100, // Add extra space for footer
        ignoreElements: () => {
          // Don't ignore footer elements
          return false;
        },
        onclone: (clonedDoc) => {
          // Ensure footer is visible in cloned document
          const footer = clonedDoc.querySelector('.footer') as HTMLElement;
          if (footer) {
            footer.style.position = 'relative';
            footer.style.display = 'flex';
            footer.style.visibility = 'visible';
            footer.style.opacity = '1';
            console.log('🔧 Footer styles applied in cloned document');
          } else {
            console.log('❌ Footer not found in cloned document');
          }
        }
      });
      
      // Remove temporary container
      document.body.removeChild(tempContainer);
      
      // Add new page if not the first page
      if (pageIndex > 0) {
        pdf.addPage();
      }
      
      // Add image to PDF with dynamic height
      const imgData = canvas.toDataURL('image/png');
      const imgHeight = (canvas.height / canvas.width) * 297; // Calculate proportional height
      console.log(`📄 Page ${pageIndex + 1}: Canvas dimensions: ${canvas.width}x${canvas.height}, PDF height: ${imgHeight}mm`);
      pdf.addImage(imgData, 'PNG', 0, 0, 297, imgHeight);
    }
    
    // Generate filename
    const projectName = project?.nombre || 'Proyecto';
    const weekName = title || 'Semana';
    const fname = filename || `Reporte_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${weekName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    // Save PDF
    pdf.save(fname);
    
    return true;
  } catch (error) {
    console.error('Error generating Report PDF:', error);
    return false;
  }
}

type ExportReportRangeParams = {
  project?: Project;
  title: string;
  safeSemana: string[];
  personas: any[];
  mode: 'semanal' | 'mensual' | 'publicidad';
  weekToSemanasISO: (week: any) => string[];
  weekToPersonas: (week: any) => any[];
  weeks: any[];
  horarioPrelight?: (iso: string) => string;
  horarioPickup?: (iso: string) => string;
};

export async function exportReportRangeToPDF(params: ExportReportRangeParams) {
  const {
    project,
    title,
    safeSemana,
    personas,
    mode,
    weekToSemanasISO,
    weekToPersonas,
    weeks,
    horarioPrelight,
    horarioPickup,
  } = params;

  try {
    const { storage } = await import('@shared/services/localStorage.service');
    const { toDisplayDate, dayNameFromISO, mondayOf, toISO } = await import('./date');
    const { findWeekAndDayFactory } = await import('./plan');
    const { personaKey, personaRole, personaName } = await import('./model');
    const { DAY_NAMES, CONCEPTS } = await import('../constants');
    const { 
      horarioPrelightFactory, 
      horarioPickupFactory,
      buildSafePersonas,
      collectWeekTeamWithSuffixFactory,
      collectRefNamesForBlock,
    } = await import('./derive');

    const planKey = `plan_${project?.id || project?.nombre || 'demo'}`;
    const getPlanAllWeeks = () => {
      try {
        const obj = storage.getJSON<any>(planKey);
        if (!obj) return { pre: [], pro: [] };
        return obj || { pre: [], pro: [] };
      } catch {
        return { pre: [], pro: [] };
      }
    };

    const findWeekAndDay = findWeekAndDayFactory(getPlanAllWeeks, mondayOf, toISO);

    // Helper function to check if a date is Saturday (6) or Sunday (0)
    const isWeekend = (iso: string): boolean => {
      try {
        const [y, m, d] = iso.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const dayOfWeek = dt.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
      } catch {
        return false;
      }
    };

    const horarioTexto = (iso: string) => {
      const { day } = findWeekAndDay(iso);
      if (!day) return 'Añadelo en Planificación';
      if ((day.tipo || '') === 'Descanso') return 'DESCANSO';
      const etiqueta = day.tipo && day.tipo !== 'Rodaje' && day.tipo !== 'Rodaje Festivo' ? `${day.tipo}: ` : '';
      if (!day.start || !day.end) return `${etiqueta}Añadelo en Planificación`;
      return `${etiqueta}${day.start}–${day.end}`;
    };

    const horarioPrelightFn = horarioPrelight || horarioPrelightFactory(findWeekAndDay);
    const horarioPickupFn = horarioPickup || horarioPickupFactory(findWeekAndDay);

    // Ordenar semanas por fecha de inicio
    const sortedWeeks = [...weeks].sort((a, b) => {
      const weekA = weekToSemanasISO(a);
      const weekB = weekToSemanasISO(b);
      return weekA[0].localeCompare(weekB[0]);
    });

    // Crear PDF único para todas las semanas
    const jsPDF = (await import('jspdf')).default;
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const baseId = project?.id || project?.nombre || 'tmp';

    // Exportar cada semana por separado
    for (let weekIndex = 0; weekIndex < sortedWeeks.length; weekIndex++) {
      const week = sortedWeeks[weekIndex];
      const weekDays = weekToSemanasISO(week);
      
      // Filtrar solo los días de esta semana que estén en el rango
      const weekDaysInRange = weekDays.filter(day => safeSemana.includes(day));
      
      if (weekDaysInRange.length === 0) continue;

      // Filtrar días que no sean DESCANSO o que tengan datos (igual que en la vista)
      const filteredWeekDays = weekDaysInRange.filter(iso => {
        const dayLabel = horarioTexto(iso);
        // Si es DESCANSO y es sábado o domingo
        if (dayLabel === 'DESCANSO' && isWeekend(iso)) {
          // Verificar si tiene prelight o recogidas
          const hasPrelight = horarioPrelightFn(iso) !== '—';
          const hasPickup = horarioPickupFn(iso) !== '—';
          // Si no tiene prelight ni recogidas, excluirlo
          if (!hasPrelight && !hasPickup) {
            return false;
          }
        }
        return true; // Incluir todos los demás días
      });

      if (filteredWeekDays.length === 0) continue;

      // Construir personas para esta semana
      const weekPersonas = weekToPersonas(week);
      const providedPersonas = weekPersonas || [];
      
      // Detectar prelight y pickup activos en esta semana
      const weekPrelightActive = filteredWeekDays.some(iso => {
        const { day } = findWeekAndDay(iso);
        return !!(
          day &&
          day.tipo !== 'Descanso' &&
          ((day.prelight || []).length > 0 ||
            day.prelightStart ||
            day.prelightEnd)
        );
      });

      const weekPickupActive = filteredWeekDays.some(iso => {
        const { day } = findWeekAndDay(iso);
        return !!(
          day &&
          day.tipo !== 'Descanso' &&
          ((day.pickup || []).length > 0 || day.pickupStart || day.pickupEnd)
        );
      });

      const collectWeekTeamWithSuffix = collectWeekTeamWithSuffixFactory(
        findWeekAndDay,
        [...filteredWeekDays]
      );

      const prelightPeople = weekPrelightActive ? collectWeekTeamWithSuffix('prelight', 'P') : [];
      const pickupPeople = weekPickupActive ? collectWeekTeamWithSuffix('pickup', 'R') : [];

      const refNamesBase = collectRefNamesForBlock(filteredWeekDays, findWeekAndDay, 'team');
      const refNamesPre = collectRefNamesForBlock(filteredWeekDays, findWeekAndDay, 'prelight');
      const refNamesPick = collectRefNamesForBlock(filteredWeekDays, findWeekAndDay, 'pickup');

      const safePersonas = buildSafePersonas(
        providedPersonas,
        weekPrelightActive,
        prelightPeople,
        weekPickupActive,
        pickupPeople
      );

      // Obtener datos de esta semana
      const weekKey = `reportes_${baseId}_${weekDays.join('_')}`;
      let weekData: any = {};
      try {
        weekData = storage.getJSON<any>(weekKey) || {};
      } catch (e) {
        console.error('Error loading week data:', e);
      }

      // Asegurar que todas las personas tengan estructura de datos
      safePersonas.forEach(p => {
        const key = personaKey(p);
        if (!weekData[key]) {
          weekData[key] = {};
        }
        CONCEPTS.forEach(concepto => {
          if (!weekData[key][concepto]) {
            weekData[key][concepto] = {};
          }
          filteredWeekDays.forEach(day => {
            if (weekData[key][concepto][day] === undefined) {
              weekData[key][concepto][day] = '';
            }
          });
        });
      });

      // Título para esta semana
      const weekTitle = week.label as string || `Semana ${weekIndex + 1}`;

      // Ordenar claves de personas por jerarquía de roles (igual que en buildReportWeekHTMLForPDF)
      const rolePriorityForReportsPDF = (role: string = ''): number => {
        const r = String(role).toUpperCase().trim();
        
        // EQUIPO BASE
        if (r === 'G') return 0;
        if (r === 'BB') return 1;
        if (r === 'E') return 2;
        if (r === 'TM') return 3;
        if (r === 'FB') return 4;
        if (r === 'AUX') return 5;
        if (r === 'M') return 6;
        
        // REFUERZOS
        if (r === 'REF') return 7;
        
        // EQUIPO PRELIGHT
        if (r === 'GP') return 8;
        if (r === 'BBP') return 9;
        if (r === 'EP') return 10;
        if (r === 'TMP') return 11;
        if (r === 'FBP') return 12;
        if (r === 'AUXP') return 13;
        if (r === 'MP') return 14;
        
        // EQUIPO RECOGIDA
        if (r === 'GR') return 15;
        if (r === 'BBR') return 16;
        if (r === 'ER') return 17;
        if (r === 'TMR') return 18;
        if (r === 'FBR') return 19;
        if (r === 'AUXR') return 20;
        if (r === 'MR') return 21;
        
        // Roles desconocidos al final
        return 1000;
      };

      // Ordenar claves de personas por jerarquía
      const personKeys = Object.keys(weekData || {}).sort((a, b) => {
        const [roleA] = String(a).split('__');
        const [roleB] = String(b).split('__');
        const priorityA = rolePriorityForReportsPDF(roleA);
        const priorityB = rolePriorityForReportsPDF(roleB);
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // Si misma prioridad, ordenar por nombre
        const [, ...namePartsA] = String(a).split('__');
        const [, ...namePartsB] = String(b).split('__');
        const nameA = namePartsA.join('__');
        const nameB = namePartsB.join('__');
        return nameA.localeCompare(nameB);
      });

      // Calcular paginación por persona (igual que exportReportWeekToPDF)
      const totalPersons = personKeys.length;
      
      const estimateContentHeight = (numPersons: number, conceptsPerPerson: number = CONCEPTS.length) => {
        const headerHeight = 80;
        const footerHeight = 25;
        const tableHeaderHeight = 40;
        const personHeaderHeight = 20;
        const conceptRowHeight = 15;
        const totalPersonHeight = numPersons * (personHeaderHeight + (conceptsPerPerson * conceptRowHeight));
        return headerHeight + footerHeight + tableHeaderHeight + totalPersonHeight;
      };
      
      let personsPerPage = Math.min(15, totalPersons);
      const maxPageHeight = 720;
      const minPersonsPerPage = 1;
      const estimatedConceptsPerPerson = Math.min(CONCEPTS.length, 3);
      
      while (estimateContentHeight(personsPerPage, estimatedConceptsPerPerson) > maxPageHeight && personsPerPage > minPersonsPerPage) {
        personsPerPage--;
      }
      
      let optimalPersonsPerPage = personsPerPage;
      const spaceBuffer = 20;
      
      for (let testPersons = personsPerPage + 1; testPersons <= totalPersons; testPersons++) {
        const testHeight = estimateContentHeight(testPersons, estimatedConceptsPerPerson);
        const availableSpace = maxPageHeight - testHeight;
        
        if (testHeight <= maxPageHeight && availableSpace >= spaceBuffer) {
          optimalPersonsPerPage = testPersons;
        } else if (testHeight <= maxPageHeight && availableSpace < spaceBuffer) {
          break;
        } else {
          break;
        }
      }
      
      personsPerPage = optimalPersonsPerPage;
      let totalPagesForWeek = Math.ceil(totalPersons / personsPerPage) || 1;

      // Generar páginas para esta semana
      for (let pageIndex = 0; pageIndex < totalPagesForWeek; pageIndex++) {
        // Si no es la primera página de la primera semana, añadir nueva página
        if (weekIndex > 0 || pageIndex > 0) {
          pdf.addPage();
        }

        const startPerson = pageIndex * personsPerPage;
        const endPerson = Math.min(startPerson + personsPerPage, totalPersons);
        const pagePersonKeys = personKeys.slice(startPerson, endPerson);
        
        const pageData: any = {};
        pagePersonKeys.forEach(pk => {
          pageData[pk] = weekData[pk];
        });

        // Generar HTML para esta página
        const html = buildReportWeekHTMLForPDF({
          project,
          title: weekTitle,
          safeSemana: filteredWeekDays,
          dayNameFromISO: (iso: string, index: number) => dayNameFromISO(iso, index, [...DAY_NAMES] as any),
          toDisplayDate,
          horarioTexto,
          CONCEPTS: [...CONCEPTS],
          data: pageData,
        });

        // Convertir HTML a imagen y añadir al PDF
        const html2canvas = (await import('html2canvas')).default;
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = html;
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '1123px';
        tempContainer.style.height = 'auto';
        tempContainer.style.minHeight = '794px';
        tempContainer.style.backgroundColor = 'white';
        tempContainer.style.overflow = 'visible';

        document.body.appendChild(tempContainer);
        await new Promise(resolve => setTimeout(resolve, 200));

        // Debug: Check if footer exists and is visible
        const footer = tempContainer.querySelector('.footer') as HTMLElement;
        if (footer) {
          console.log(`📄 Week ${weekIndex + 1}, Page ${pageIndex + 1}: Footer found, height: ${footer.offsetHeight}px, visible: ${footer.offsetHeight > 0}`);
        } else {
          console.log(`❌ Week ${weekIndex + 1}, Page ${pageIndex + 1}: Footer NOT found!`);
        }

        const canvas = await html2canvas(tempContainer, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 1123,
          height: tempContainer.scrollHeight + 100,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 1123,
          windowHeight: tempContainer.scrollHeight + 100,
          ignoreElements: () => {
            // Don't ignore footer elements
            return false;
          },
          onclone: (clonedDoc) => {
            // Ensure footer is visible in cloned document
            const footer = clonedDoc.querySelector('.footer') as HTMLElement;
            if (footer) {
              footer.style.position = 'relative';
              footer.style.display = 'flex';
              footer.style.visibility = 'visible';
              footer.style.opacity = '1';
              console.log(`🔧 Week ${weekIndex + 1}, Page ${pageIndex + 1}: Footer styles applied in cloned document`);
            } else {
              console.log(`❌ Week ${weekIndex + 1}, Page ${pageIndex + 1}: Footer not found in cloned document`);
            }
          }
        });

        document.body.removeChild(tempContainer);

        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height / canvas.width) * 297;
        pdf.addImage(imgData, 'PNG', 0, 0, 297, imgHeight);
      }
    }

    // Guardar PDF final
    const projectName = project?.nombre || 'Proyecto';
    const fname = `Reporte_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    pdf.save(fname);

    return true;
  } catch (error) {
    console.error('Error generating Report Range PDF:', error);
    return false;
  }
}
