/**
 * Estimate content height for pagination
 */
const estimateContentHeight = (
  numPersons: number,
  conceptsPerPerson: number,
  headerHeight: number = 80,
  footerHeight: number = 25,
  tableHeaderHeight: number = 40,
  personHeaderHeight: number = 20,
  conceptRowHeight: number = 15
): number => {
  const totalPersonHeight = numPersons * (personHeaderHeight + (conceptsPerPerson * conceptRowHeight));
  return headerHeight + footerHeight + tableHeaderHeight + totalPersonHeight;
};

/**
 * Calculate optimal persons per page with smart pagination
 */
export const calculatePersonsPerPage = (
  totalPersons: number,
  CONCEPTS: string[],
  maxPageHeight: number = 794, // 210mm en píxeles a escala 3x (210 * 3.7795 ≈ 794)
  minPersonsPerPage: number = 1
): { personsPerPage: number; totalPages: number } => {
  // Estimate concepts per person (average case)
  const estimatedConceptsPerPerson = Math.min(CONCEPTS.length, 3);
  
  // Usar un margen de seguridad más conservador (reducir altura máxima disponible)
  const safetyMargin = 80; // Aumentar margen de seguridad para evitar cortes
  const effectiveMaxHeight = maxPageHeight - safetyMargin;
  
  // Start more conservative para asegurar que siempre quepa en una página
  let personsPerPage = Math.min(10, totalPersons);
  
  // Dynamic adjustment with estimated concepts
  while (
    estimateContentHeight(personsPerPage, estimatedConceptsPerPerson) > effectiveMaxHeight &&
    personsPerPage > minPersonsPerPage
  ) {
    personsPerPage--;
  }
  
  // Auto-fill logic: if we have space, try to add more persons
  // Pero ser más conservador con el espacio buffer
  let optimalPersonsPerPage = personsPerPage;
  const spaceBuffer = 40; // Aumentar buffer para evitar cortes
  
  for (let testPersons = personsPerPage + 1; testPersons <= totalPersons; testPersons++) {
    const testHeight = estimateContentHeight(testPersons, estimatedConceptsPerPerson);
    const availableSpace = effectiveMaxHeight - testHeight;
    
    if (testHeight <= effectiveMaxHeight && availableSpace >= spaceBuffer) {
      optimalPersonsPerPage = testPersons;
    } else if (testHeight <= effectiveMaxHeight && availableSpace < spaceBuffer) {
      // We can fit it but would be too tight, stop here
      break;
    } else {
      // Would exceed page height
      break;
    }
  }
  
  personsPerPage = optimalPersonsPerPage;
  
  // Additional optimization: if concepts are few, we can be more aggressive
  // Pero siempre respetar el límite máximo con margen de seguridad
  if (estimatedConceptsPerPerson <= 2) {
    const aggressiveMaxHeight = Math.min(750, effectiveMaxHeight); // Usar effectiveMaxHeight con margen
    let aggressivePersonsPerPage = personsPerPage;
    const aggressiveBuffer = 30; // Buffer más conservador
    
    for (let testPersons = personsPerPage + 1; testPersons <= totalPersons; testPersons++) {
      const testHeight = estimateContentHeight(testPersons, estimatedConceptsPerPerson);
      const availableSpace = aggressiveMaxHeight - testHeight;
      if (testHeight <= aggressiveMaxHeight && availableSpace >= aggressiveBuffer) {
        aggressivePersonsPerPage = testPersons;
      } else {
        break;
      }
    }
    
    if (aggressivePersonsPerPage > personsPerPage) {
      personsPerPage = aggressivePersonsPerPage;
    }
  }
  
  const totalPages = Math.ceil(totalPersons / personsPerPage) || 1;
  
  
  return { personsPerPage, totalPages };
};

