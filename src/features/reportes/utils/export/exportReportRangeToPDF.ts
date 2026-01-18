import { ExportReportRangeParams } from './types';
import { buildReportWeekHTMLForPDF } from './buildReportWeekHTMLForPDF';
import { calculatePersonsPerPage } from './paginationHelpers';
import { generateRangeFilename } from './filenameHelpers';
import { sortPersonKeysByRole } from './dataHelpers';
import { groupAndSortPersonsByBlock } from './buildReportWeekHTMLForPDF/sortingHelpers';
import { isWeekend } from './dateHelpers';
import { filterWeekDaysForExport, translateWeekLabel } from './weekProcessingHelpers';
import { prepareWeekData } from './weekDataHelpers';
import { initializeExportHelpers } from './exportInitializationHelpers';
import { storage } from '@shared/services/localStorage.service';
import { personaKey, normalizePersonaKey } from '../model';
import { norm } from '../text';
import html2canvas from 'html2canvas';

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
    const { toDisplayDate, dayNameFromISO, mondayOf, toYYYYMMDD } = await import('@shared/utils/date');
    const { findWeekAndDayFactory } = await import('../plan');
    const { DAY_NAMES, CONCEPTS } = await import('../../constants');
    const { 
      buildSafePersonas,
      buildPeopleBase,
      buildPeoplePre,
      buildPeoplePick,
      collectWeekTeamWithSuffixFactory,
      collectRefNamesForBlock,
      collectRefRolesForBlock,
    } = await import('../derive');

    // Initialize helper functions
    const getPlanAllWeeks = () => {
      const { storage } = require('@shared/services/localStorage.service');
      const planKey = `plan_${project?.id || project?.nombre || 'demo'}`;
      try {
        const obj = storage.getJSON<any>(planKey);
        if (!obj) return { pre: [], pro: [] };
        return obj || { pre: [], pro: [] };
      } catch {
        return { pre: [], pro: [] };
      }
    };

    const findWeekAndDay = findWeekAndDayFactory(getPlanAllWeeks, mondayOf, toYYYYMMDD);

    const {
      horarioTexto,
      horarioPrelightFn,
      horarioPickupFn,
    } = await initializeExportHelpers({
      project,
      findWeekAndDay,
      horarioPrelight,
      horarioPickup,
    });

    // Sort weeks by start date
    const sortedWeeks = [...weeks].sort((a, b) => {
      const weekA = weekToSemanasISO(a);
      const weekB = weekToSemanasISO(b);
      return weekA[0].localeCompare(weekB[0]);
    });

    // Create PDF for all weeks
    const jsPDF = (await import('jspdf')).default;
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const baseId = project?.id || project?.nombre || 'tmp';

    // Export each week separately
    for (let weekIndex = 0; weekIndex < sortedWeeks.length; weekIndex++) {
      const week = sortedWeeks[weekIndex];
      const weekDays = weekToSemanasISO(week);
      
      const filteredWeekDays = filterWeekDaysForExport({
        weekDays,
        safeSemana,
        horarioTexto,
        horarioPrelightFn,
        horarioPickupFn,
        isWeekend,
      });

      if (filteredWeekDays.length === 0) continue;

      // Build personas for this week
      // Usar todas las personas del rango de fechas, no solo las de esta semana
      // porque pueden tener datos en días que están en el rango pero en diferentes semanas
      const weekPersonas = weekToPersonas(week);
      // Combinar personas de la semana con todas las personas del rango para asegurar que no se pierdan datos
      const allPersonasMap = new Map<string, any>();
      // Primero agregar todas las personas del rango (ya vienen con cargo y nombre)
      personas.forEach(p => {
        const key = `${p.cargo || ''}__${p.nombre || ''}`;
        if (key !== '__') { // Solo agregar si tiene cargo o nombre
          allPersonasMap.set(key, p);
        }
      });
      // Luego agregar personas específicas de esta semana (por si hay alguna que no esté en el rango general)
      weekPersonas.forEach(p => {
        const key = `${p.cargo || ''}__${p.nombre || ''}`;
        if (key !== '__' && !allPersonasMap.has(key)) {
          allPersonasMap.set(key, p);
        }
      });
      const providedPersonas = Array.from(allPersonasMap.values());
      const genderMap: Record<string, string> = {};
      providedPersonas.forEach(p => {
        const key = normalizePersonaKey(personaKey(p));
        const gender = (p as any)?.gender;
        if (key && gender) {
          genderMap[key] = gender;
        }
      });
      
      // Detect prelight and pickup active in this week
      // Primero verificar en el plan
      const weekPrelightActiveFromPlan = filteredWeekDays.some(iso => {
        const { day } = findWeekAndDay(iso);
        return !!(
          day &&
          day.tipo !== 'Descanso' &&
          ((day.prelight || []).length > 0 ||
            day.prelightStart ||
            day.prelightEnd)
        );
      });
      
      // También verificar si hay personas con sufijo P en providedPersonas
      const hasPrelightPeople = providedPersonas.some(p => {
        const role = (p.cargo || p.role || '').toUpperCase();
        return role.endsWith('P');
      });
      
      const weekPrelightActive = weekPrelightActiveFromPlan || hasPrelightPeople;

      const weekPickupActiveFromPlan = filteredWeekDays.some(iso => {
        const { day } = findWeekAndDay(iso);
        return !!(
          day &&
          day.tipo !== 'Descanso' &&
          ((day.pickup || []).length > 0 || day.pickupStart || day.pickupEnd)
        );
      });
      
      // También verificar si hay personas con sufijo R en providedPersonas
      const hasPickupPeople = providedPersonas.some(p => {
        const role = (p.cargo || p.role || '').toUpperCase();
        return role.endsWith('R');
      });
      
      const weekPickupActive = weekPickupActiveFromPlan || hasPickupPeople;

      const collectWeekTeamWithSuffix = collectWeekTeamWithSuffixFactory(
        findWeekAndDay,
        [...filteredWeekDays]
      );

      const prelightPeople = weekPrelightActive ? collectWeekTeamWithSuffix('prelight', 'P') : [];
      const pickupPeople = weekPickupActive ? collectWeekTeamWithSuffix('pickup', 'R') : [];
      
      // IMPORTANTE: Obtener también el equipo base directamente del plan para tener los roles completos
      // Esto es similar a prelight y pickup, pero sin sufijo (solo para refuerzos)
      const basePeople = collectWeekTeamWithSuffix('team', ''); // Sin sufijo para base

      const refNamesBase = collectRefNamesForBlock(filteredWeekDays, findWeekAndDay, 'team');
      const refNamesPre = collectRefNamesForBlock(filteredWeekDays, findWeekAndDay, 'prelight');
      const refNamesPick = collectRefNamesForBlock(filteredWeekDays, findWeekAndDay, 'pickup');
      
      // IMPORTANTE: Siempre crear fallback de providedPersonas para asegurar que tenemos todas las personas
      // Incluir refuerzos (REF, REFE, etc.) que pueden estar en base
      // Crear un Set de nombres de personas que ya están en basePeople para verificar después
      const basePeopleNames = new Set<string>();
      const basePeopleRoles = new Map<string, string>(); // nombre normalizado -> rol
      basePeople.forEach(p => {
        if (p.name) {
          const normalizedName = norm(p.name);
          basePeopleNames.add(normalizedName);
          basePeopleRoles.set(normalizedName, (p.role || '').toUpperCase());
        }
      });
      
      const fallbackBasePeople = providedPersonas.length > 0
        ? providedPersonas
            .filter(p => {
              // Filtrar solo personas base (sin sufijo P o R al final)
              // PERO incluir refuerzos (REF, REFE, etc.) que pueden estar en base
              // IMPORTANTE: Los refuerzos pueden tener cualquier formato, así que incluirlos todos
              const role = (p.cargo || p.role || '').toUpperCase();
              const isRef = role.startsWith('REF');
              const name = p.nombre || p.name || '';
              const normalizedName = norm(name);
              
              // Incluir si:
              // 1. No tiene sufijo P/R O es un refuerzo
              const shouldInclude = (!role.endsWith('P') && !role.endsWith('R')) || isRef;
              
              if (!shouldInclude) return false;
              
              // Si es un refuerzo, siempre incluirlo (puede que esté en basePeople pero con rol diferente)
              if (isRef) {
                const existingRole = basePeopleRoles.get(normalizedName);
                // Incluir si no existe en basePeople O si el rol en basePeople no es un refuerzo completo (REFE, REFG, etc.)
                return !existingRole || existingRole === 'REF' || (existingRole.startsWith('REF') && existingRole.length === 3);
              }
              
              // Para roles normales, solo incluir si no están en basePeople
              return !basePeopleNames.has(normalizedName);
            })
            .map(p => ({
              role: p.cargo || p.role || '',
              name: p.nombre || p.name || '',
            }))
        : [];
      
      // Fallback para prelight - buscar personas con sufijo P o refuerzos que puedan estar en prelight
      const fallbackPrelightPeople = (weekPrelightActive || prelightPeople.length > 0) && prelightPeople.length === 0 && providedPersonas.length > 0
        ? providedPersonas
            .filter(p => {
              const role = (p.cargo || p.role || '').toUpperCase();
              // Incluir roles con sufijo P o refuerzos (que pueden estar en cualquier bloque)
              return role.endsWith('P') || role.startsWith('REF');
            })
            .map(p => ({
              role: p.cargo || p.role || '',
              name: p.nombre || p.name || '',
            }))
        : [];
      
      // Fallback para pickup - buscar personas con sufijo R o refuerzos que puedan estar en pickup
      const fallbackPickupPeople = (weekPickupActive || pickupPeople.length > 0) && pickupPeople.length === 0 && providedPersonas.length > 0
        ? providedPersonas
            .filter(p => {
              const role = (p.cargo || p.role || '').toUpperCase();
              // Incluir roles con sufijo R o refuerzos (que pueden estar en cualquier bloque)
              return role.endsWith('R') || role.startsWith('REF');
            })
            .map(p => ({
              role: p.cargo || p.role || '',
              name: p.nombre || p.name || '',
            }))
        : [];
      
      // Combinar personas del plan con fallback
      // IMPORTANTE: Siempre combinar para asegurar que no se pierdan refuerzos
      // Crear un Map para evitar duplicados al combinar, usando nombre normalizado como clave
      const basePeopleMap = new Map<string, { role: string; name: string }>();
      
      // Primero añadir personas del plan
      basePeople.forEach(p => {
        // Usar nombre normalizado como clave para detectar duplicados
        const normalizedName = norm(p.name || '');
        const key = normalizedName;
        // Si ya existe, preferir el del plan (tiene más información)
        if (!basePeopleMap.has(key)) {
          basePeopleMap.set(key, p);
        }
      });
      
      // Luego añadir fallback, priorizando refuerzos con códigos completos (REFE, REFG, etc.)
      // Esto asegura que REFE de providedPersonas se añada si no está en basePeople
      fallbackBasePeople.forEach(p => {
        const normalizedName = norm(p.name || '');
        const key = normalizedName;
        const existing = basePeopleMap.get(key);
        const newRole = (p.role || '').toUpperCase();
        const isNewRef = newRole.startsWith('REF');
        
        if (!existing) {
          // No existe, añadir
          basePeopleMap.set(key, p);
        } else {
          // Existe, verificar si debemos reemplazar
          const existingRole = (existing.role || '').toUpperCase();
          const isExistingRef = existingRole.startsWith('REF');
          
          // Reemplazar si:
          // 1. El nuevo es un refuerzo con código completo (REFE, REFG, etc.) y el existente es genérico (REF)
          // 2. O si el nuevo es un refuerzo con código completo y el existente también pero diferente
          // 3. O si el nuevo es un refuerzo y el existente no lo es
          if (isNewRef && newRole.length > 3) {
            if (existingRole === 'REF' || !isExistingRef) {
              // Reemplazar REF genérico o no-refuerzo con código completo
              basePeopleMap.set(key, p);
            } else if (isExistingRef && existingRole.length === 3) {
              // Reemplazar REF genérico (3 letras) con código completo
              basePeopleMap.set(key, p);
            }
            // Si ambos son refuerzos con códigos completos diferentes, mantener el del plan
          } else if (isNewRef && !isExistingRef) {
            // Reemplazar no-refuerzo con refuerzo
            basePeopleMap.set(key, p);
          }
        }
      });
      const combinedBasePeople = Array.from(basePeopleMap.values());
      
      const prelightPeopleMap = new Map<string, { role: string; name: string }>();
      prelightPeople.forEach(p => {
        const key = `${p.role}__${p.name}`;
        prelightPeopleMap.set(key, p);
      });
      fallbackPrelightPeople.forEach(p => {
        const key = `${p.role}__${p.name}`;
        if (!prelightPeopleMap.has(key)) {
          prelightPeopleMap.set(key, p);
        }
      });
      const combinedPrelightPeople = Array.from(prelightPeopleMap.values());
      
      const pickupPeopleMap = new Map<string, { role: string; name: string }>();
      pickupPeople.forEach(p => {
        const key = `${p.role}__${p.name}`;
        pickupPeopleMap.set(key, p);
      });
      fallbackPickupPeople.forEach(p => {
        const key = `${p.role}__${p.name}`;
        if (!pickupPeopleMap.has(key)) {
          pickupPeopleMap.set(key, p);
        }
      });
      const combinedPickupPeople = Array.from(pickupPeopleMap.values());
      
      // IMPORTANTE: Procesar los datos con la misma lógica que en useWeekData
      // para limpiar sufijos de refuerzos y eliminar duplicados
      // Usar combinedBasePeople (del plan o fallback) directamente, igual que prelight y pickup
      // IMPORTANTE: NO usar refNamesBase porque collectWeekTeamWithSuffix ya procesa
      // TODOS los miembros del equipo base, incluyendo refuerzos. Usar refNamesBase causaría duplicados.
      const peopleBase = buildPeopleBase(combinedBasePeople, new Set<string>());
      const peoplePre = buildPeoplePre(weekPrelightActive || combinedPrelightPeople.length > 0, combinedPrelightPeople, new Set<string>());
      const peoplePick = buildPeoplePick(weekPickupActive || combinedPickupPeople.length > 0, combinedPickupPeople, new Set<string>());
      
      // Convertir PersonaWithBlock[] a Persona[] para buildSafePersonas
      const prelightPeopleProcessed = peoplePre.map(p => ({ role: p.role, name: p.name }));
      const pickupPeopleProcessed = peoplePick.map(p => ({ role: p.role, name: p.name }));

      const safePersonas = buildSafePersonas(
        peopleBase, // Usar peopleBase procesado (del plan o fallback) en lugar de providedPersonas
        weekPrelightActive,
        prelightPeopleProcessed,
        weekPickupActive,
        pickupPeopleProcessed
      );

      // Preparar datos de la semana usando los 7 días completos (no filtrados)
      // porque la clave de almacenamiento se crea con los 7 días completos
      const weekData = prepareWeekData({
        project,
        weekDays: weekDays, // Usar los 7 días completos, no filteredWeekDays
        safePersonas,
      });
      
      // Filtrar los datos para incluir solo los días que están en filteredWeekDays
      // pero mantener la estructura completa para todas las personas
      const filteredWeekData: any = {};
      safePersonas.forEach(p => {
        const key = personaKey(p);
        const normalizedKey = normalizePersonaKey(key);
        
        // Try to find data with normalized key first, then try original key
        const dataKey = weekData[normalizedKey] ? normalizedKey : 
                       (weekData[key] ? key : null);
        
        if (dataKey) {
          filteredWeekData[normalizedKey] = {};
          CONCEPTS.forEach(concepto => {
            if (weekData[dataKey][concepto]) {
              filteredWeekData[normalizedKey][concepto] = {};
              // Solo incluir días que están en filteredWeekDays (días de esta semana en el rango)
              filteredWeekDays.forEach(day => {
                // Usar el valor del weekData si existe, o cadena vacía
                filteredWeekData[normalizedKey][concepto][day] = weekData[dataKey][concepto][day] !== undefined 
                  ? weekData[dataKey][concepto][day] 
                  : '';
              });
            } else {
              // Si no hay datos para este concepto, crear estructura vacía
              filteredWeekData[normalizedKey][concepto] = {};
              filteredWeekDays.forEach(day => {
                filteredWeekData[key][concepto][day] = '';
              });
            }
          });
        } else {
          // Si no hay datos para esta persona, crear estructura completa
          filteredWeekData[key] = {};
          CONCEPTS.forEach(concepto => {
            filteredWeekData[key][concepto] = {};
            filteredWeekDays.forEach(day => {
              filteredWeekData[key][concepto][day] = '';
            });
          });
        }
      });
      
      // Usar los datos filtrados para esta semana
      const finalWeekData = filteredWeekData;

      const weekLabel = week.label as string || `Semana ${weekIndex + 1}`;
      const weekTitle = translateWeekLabel(weekLabel);

      // IMPORTANTE: Usar la misma lógica que exportReportWeekToPDF - paginación simple por personas
      // Agrupar personas por bloques solo para ordenar, pero paginar como en semana
      const { finalPersonKeys } = groupAndSortPersonsByBlock(finalWeekData, false);
      
      // Calcular paginación igual que en exportReportWeekToPDF
      const totalPersons = finalPersonKeys.length;
      const { personsPerPage, totalPages } = calculatePersonsPerPage(totalPersons, CONCEPTS);

      // Generate pages for this week - igual que exportReportWeekToPDF
      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        // If not the first page of the first week, add new page
        if (weekIndex > 0 || pageIndex > 0) {
          pdf.addPage();
        }

        // Crear datos solo para las personas de esta página (igual que exportReportWeekToPDF)
        const startPerson = pageIndex * personsPerPage;
        const endPerson = Math.min(startPerson + personsPerPage, totalPersons);
        const pagePersonKeys = finalPersonKeys.slice(startPerson, endPerson);
        
        const pageData: any = {};
        pagePersonKeys.forEach(pk => {
          pageData[pk] = finalWeekData[pk] || {};
        });
        pageData.__genderMap = genderMap;

        // Generate HTML for this page
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

        // Crear contenedor temporal igual que exportReportWeekToPDF
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = html;
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '297mm';
        tempContainer.style.height = '210mm';
        tempContainer.style.backgroundColor = 'white';
        tempContainer.style.overflow = 'hidden';
        
        // Add to DOM temporarily
        document.body.appendChild(tempContainer);
        
        // Wait for fonts and images to load
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Convert to canvas - permitir altura completa para detectar si excede
        tempContainer.style.height = 'auto';
        tempContainer.style.overflow = 'visible';
        
        const canvas = await html2canvas(tempContainer, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 1123,
          // No limitar height, dejar que html2canvas calcule la altura real
          scrollX: 0,
          scrollY: 0,
          windowWidth: 1123,
          // No limitar windowHeight, dejar que se calcule automáticamente
          ignoreElements: () => false,
          onclone: (clonedDoc) => {
            const footer = clonedDoc.querySelector('.footer') as HTMLElement;
            if (footer) {
              footer.style.position = 'relative';
              footer.style.display = 'flex';
              footer.style.visibility = 'visible';
              footer.style.opacity = '1';
            }
          }
        });
        
        // Remove temporary container
        document.body.removeChild(tempContainer);
        
        // Calcular altura real en mm
        const imgData = canvas.toDataURL('image/png');
        const imgHeightMM = (canvas.height / canvas.width) * 297;
        const maxPageHeightMM = 210;
        
        // Si el contenido excede la altura máxima, dividirlo en múltiples páginas
        if (imgHeightMM > maxPageHeightMM) {
          let currentY = 0;
          const totalHeight = imgHeightMM;
          
          while (currentY < totalHeight) {
            if (currentY > 0) {
              pdf.addPage();
            }
            
            const pageHeight = Math.min(maxPageHeightMM, totalHeight - currentY);
            pdf.saveGraphicsState();
            pdf.rect(0, 0, 297, pageHeight);
            pdf.clip();
            pdf.addImage(imgData, 'PNG', 0, -currentY, 297, totalHeight);
            pdf.restoreGraphicsState();
            
            currentY += pageHeight;
          }
        } else {
          // Contenido cabe en una página
          pdf.addImage(imgData, 'PNG', 0, 0, 297, imgHeightMM);
        }
      }
    }

    // Save final PDF
    const fname = generateRangeFilename(project, title, safeSemana);
    pdf.save(fname);

    return true;
  } catch (error) {
    console.error('Error generating Report Range PDF:', error);
    return false;
  }
}

