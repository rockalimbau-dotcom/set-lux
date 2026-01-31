import { parseYYYYMMDD, monthKeyFromISO } from '@shared/utils/date';
import { weekISOdays } from './plan';

/**
 * Calcular días del mes (30 o 31) para nómina mensual
 */
export const getDaysInMonth = (monthKey: string): number => {
  const [year, month] = monthKey.split('-').map(Number);
  const days = new Date(year, month, 0).getDate();
  if ((import.meta as any).env.DEV) {
  }
  return days;
};

/**
 * Calcular días trabajados del mes: desde el primer día trabajado hasta el final del mes
 * IMPORTANTE: Este cálculo debe funcionar correctamente incluso cuando las semanas cruzan meses
 * Si se encuentra "Fin" en planificación, el conteo se detiene hasta ese día (sin contarlo)
 */
export const calculateWorkingDaysInMonth = (
  projectMode: 'semanal' | 'mensual' | 'diario',
  monthKey: string,
  weeksForMonth: any[],
  allWeeks?: any[]
): number => {
  if (projectMode !== 'mensual') {
    return getDaysInMonth(monthKey);
  }
  
  // Buscar el primer día con "Fin" en todas las semanas del proyecto (ordenadas cronológicamente)
  // Usar allWeeks si está disponible, sino usar weeksForMonth
  let finDayISO: string | null = null;
  const weeksToSearch = (allWeeks && allWeeks.length > 0) ? allWeeks : weeksForMonth;
  const allWeeksSorted = [...weeksToSearch].sort((a, b) => {
    const aDate = parseYYYYMMDD(a.startDate);
    const bDate = parseYYYYMMDD(b.startDate);
    return aDate.getTime() - bDate.getTime();
  });
  
  for (const week of allWeeksSorted) {
    const weekDays = weekISOdays(week);
    for (let idx = 0; idx < (week.days || []).length; idx++) {
      const day = (week.days || [])[idx];
      if ((day?.tipo || '') === 'Fin') {
        const iso = weekDays[idx];
        // Guardar el primer "Fin" encontrado (el más temprano)
        if (!finDayISO || iso < finDayISO) {
          finDayISO = iso;
        }
      }
    }
  }
  
  // Verificar si "Fin" está en el mes actual o antes (solo entonces afecta el cálculo)
  const finDayMonthKey = finDayISO ? monthKeyFromISO(finDayISO) : null;
  const finAffectsThisMonth = finDayISO && finDayMonthKey && finDayMonthKey <= monthKey;
  
  // Obtener todos los días ISO de las semanas del mes que pertenecen AL MES ACTUAL
  // Solo contar días con tipo real (no Descanso/Fin) para evitar sumar descansos
  const allDays: string[] = [];
  for (const week of weeksForMonth) {
    const weekDays = weekISOdays(week);
    for (let idx = 0; idx < (week.days || []).length; idx++) {
      const iso = weekDays[idx];
      const day = (week.days || [])[idx] || {};
      const dayMonthKey = monthKeyFromISO(iso);
      // Solo añadir días que pertenecen al mes actual
      if (dayMonthKey === monthKey) {
        // Si encontramos "Fin" antes o en este día, no añadir este día ni los siguientes
        if (finAffectsThisMonth && finDayISO && iso >= finDayISO) {
          break;
        }
        const tipo = String(day?.tipo || '').trim();
        if (!tipo || tipo === 'Descanso' || tipo === 'Fin') {
          continue;
        }
        allDays.push(iso);
      }
    }
  }
  
  // Si no hay días trabajados en este mes, devolver 0
  if (allDays.length === 0) {
    return 0;
  }
  
  // Ordenar días y obtener el primero y el último (el primer y último día trabajado del mes)
  allDays.sort();
  const firstDayWorked = parseYYYYMMDD(allDays[0]);
  
  // Si hay "Fin" que afecta este mes, usar el día anterior a "Fin" como último día trabajado
  // Si no hay "Fin" o está en un mes posterior, usar el último día trabajado o el final del mes
  let lastDayWorked: Date;
  if (finAffectsThisMonth && finDayISO) {
    const finDate = parseYYYYMMDD(finDayISO);
    const dayBeforeFin = new Date(finDate);
    dayBeforeFin.setDate(dayBeforeFin.getDate() - 1);
    // Asegurar que dayBeforeFin no sea anterior al primer día trabajado del mes
    lastDayWorked = dayBeforeFin < firstDayWorked ? firstDayWorked : dayBeforeFin;
  } else {
    lastDayWorked = parseYYYYMMDD(allDays[allDays.length - 1]);
  }
  
  if (!firstDayWorked || !lastDayWorked) {
    return 0;
  }
  
  // Obtener el último día del mes calendario
  const [year, month] = monthKey.split('-').map(Number);
  const lastDayOfMonth = new Date(year, month, 0); // día 0 del mes siguiente = último día del mes actual
  
  // Calcular días desde el primer día trabajado hasta el último día trabajado O hasta el final del mes
  // Usar el menor de los dos: último día trabajado o último día del mes
  const endDate = lastDayWorked > lastDayOfMonth ? lastDayOfMonth : lastDayWorked;
  
  // Calcular días desde el primer día trabajado hasta el día final (incluyendo ambos)
  // Esto incluye rodaje + descansos desde el primer día trabajado hasta el último día trabajado (o final del mes)
  const diffTime = endDate.getTime() - firstDayWorked.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  // Asegurar que no sea negativo
  return Math.max(0, diffDays);
};

