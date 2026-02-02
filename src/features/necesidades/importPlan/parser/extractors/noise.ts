export const isNoiseLine = (line: string) => {
  const lower = line.toLowerCase();
  return (
    /^\s*\d+\s*\/\s*\d+/.test(line) ||
    /\b\d+\s*\/\s*\d+\b/.test(line) ||
    /^\s*-\s*\d+\s*\/\s*\d+/.test(line) ||
    /^\s*\d{4}\s*$/.test(line) ||
    /^\s*\d+(,\s*\d+)+\s*$/.test(line) ||
    /\d{1,2}[:.]\d{2}\s*[-–]\s*\d{1,2}[:.]\d{2}/.test(line) ||
    /^(dia|día|noc|noche|tarde|amanecer|mañana|manana)$/i.test(line.trim()) ||
    lower.startsWith('pags') ||
    lower.startsWith('guion') ||
    lower.startsWith('df') ||
    lower.startsWith('personajes') ||
    lower.startsWith('figuracion') ||
    lower.startsWith('figuración') ||
    lower.startsWith('horario') ||
    lower.startsWith('making') ||
    lower.startsWith('foto') ||
    lower.startsWith('prev') ||
    lower.startsWith('pru') ||
    lower.startsWith('off') ||
    lower.startsWith('procesos') ||
    lower.startsWith('entrevistas') ||
    lower.startsWith('asistencia') ||
    lower.includes('pags') ||
    lower.includes('guion') ||
    lower.includes('personajes') ||
    lower.includes('figuracion') ||
    lower.includes('figuración')
  );
};
