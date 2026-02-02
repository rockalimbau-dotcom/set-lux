export const isSequenceLine = (line: string) => {
  if (/^DÍA\s+/i.test(line)) return false;
  if (/^DIA\s+/i.test(line)) return false;
  if (/\bDay\b/i.test(line)) return false;
  if (/^\s*\d{1,2}[:.]\d{2}\b/.test(line)) return false;
  if (/pgs/i.test(line)) return false;
  return /^\s*\d{1,3}(?:\.\d{1,2}[A-Z]?)?(?:\s+|:)\s*.+/.test(line);
};

export const sanitizeSequenceTitle = (title: string) => {
  let clean = title;
  clean =
    clean.split(/Guion|Pags|DF|Personajes|Figuraci[oó]n|Figuracion|Veh|Luz|Hora Azul|MAKING|FOTO|PREV|PRU|OFF/i)[0] ||
    '';
  clean = clean.replace(/\b\d{1,2}[:.]\d{2}\s*[-–]\s*\d{1,2}[:.]\d{2}\b/g, '');
  clean = clean.replace(/\b\d+\s*\/\s*\d+\b/g, '');
  clean = clean.replace(/-{2,}/g, ' ');
  clean = clean.replace(/\s{2,}/g, ' ').trim();
  return clean;
};
