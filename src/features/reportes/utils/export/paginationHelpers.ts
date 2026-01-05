/**
 * Estimate content height for pagination
 */
export const estimateContentHeight = (
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
  maxPageHeight: number = 720,
  minPersonsPerPage: number = 1
): { personsPerPage: number; totalPages: number } => {
  // Estimate concepts per person (average case)
  const estimatedConceptsPerPerson = Math.min(CONCEPTS.length, 3);
  
  // Start aggressive
  let personsPerPage = Math.min(15, totalPersons);
  
  // Dynamic adjustment with estimated concepts
  while (
    estimateContentHeight(personsPerPage, estimatedConceptsPerPerson) > maxPageHeight &&
    personsPerPage > minPersonsPerPage
  ) {
    personsPerPage--;
  }
  
  // Auto-fill logic: if we have space, try to add more persons
  let optimalPersonsPerPage = personsPerPage;
  const spaceBuffer = 20;
  
  for (let testPersons = personsPerPage + 1; testPersons <= totalPersons; testPersons++) {
    const testHeight = estimateContentHeight(testPersons, estimatedConceptsPerPerson);
    const availableSpace = maxPageHeight - testHeight;
    
    if (testHeight <= maxPageHeight && availableSpace >= spaceBuffer) {
      optimalPersonsPerPage = testPersons;
    } else if (testHeight <= maxPageHeight && availableSpace < spaceBuffer) {
      // We can fit it but would be too tight, stop here
      break;
    } else {
      // Would exceed page height
      break;
    }
  }
  
  personsPerPage = optimalPersonsPerPage;
  
  // Additional optimization: if concepts are few, we can be more aggressive
  if (estimatedConceptsPerPerson <= 2) {
    const aggressiveMaxHeight = 750; // More space when concepts are few
    let aggressivePersonsPerPage = personsPerPage;
    
    for (let testPersons = personsPerPage + 1; testPersons <= totalPersons; testPersons++) {
      const testHeight = estimateContentHeight(testPersons, estimatedConceptsPerPerson);
      if (testHeight <= aggressiveMaxHeight) {
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

