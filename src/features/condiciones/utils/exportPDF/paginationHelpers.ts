/**
 * Estimate content height for pagination
 */
function estimateContentHeight(numBlocks: number): number {
  const headerHeight = 120; // Header + info panel + tabla (más conservador)
  const footerHeight = 30; // Footer (más espacio)
  const sectionHeight = 80; // Altura promedio por sección de texto (más conservador)
  
  return headerHeight + footerHeight + (numBlocks * sectionHeight);
}

/**
 * Calculate optimal blocks per page with dynamic adjustment
 */
export function calculateBlocksPerPage(totalBlocks: number): number {
  // Smart pagination: empezar conservador y ajustar dinámicamente
  let blocksPerPage = Math.min(4, totalBlocks); // Máximo 4 secciones por página (más conservador)
  const maxPageHeight = 600; // Altura disponible para contenido (más conservador)
  const minBlocksPerPage = 1; // Mínimo para prevenir bucles infinitos
  
  // Ajuste dinámico
  while (estimateContentHeight(blocksPerPage) > maxPageHeight && blocksPerPage > minBlocksPerPage) {
    blocksPerPage--;
  }
  
  // Lógica de auto-llenado: si tenemos espacio, intentar agregar más bloques
  let optimalBlocksPerPage = blocksPerPage;
  const spaceBuffer = 50; // Buffer para mantener márgenes bonitos (más conservador)
  
  for (let testBlocks = blocksPerPage + 1; testBlocks <= totalBlocks; testBlocks++) {
    const testHeight = estimateContentHeight(testBlocks);
    const availableSpace = maxPageHeight - testHeight;
    
    if (availableSpace >= spaceBuffer) {
      optimalBlocksPerPage = testBlocks;
    } else {
      break;
    }
  }
  
  return optimalBlocksPerPage;
}

