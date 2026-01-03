import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '@shared/services/localStorage.service';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

import ReportesSemana from './ReportesSemana.tsx';
import { exportReportRangeToPDF } from '../utils/export';

type AnyRecord = Record<string, any>;

type Project = { id?: string; nombre?: string };

type ReportesTabProps = { 
  project?: Project; 
  mode?: 'semanal' | 'mensual' | 'publicidad';
  readOnly?: boolean;
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}
function parseYYYYMMDD(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function toISO(d: Date) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${y}-${m}-${dd}`;
}
function addDays(date: Date, days: number) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

/** Carga semanas guardadas por Planificación: { pre: Week[], pro: Week[] } */
function usePlanWeeks(project?: Project) {
  const storageKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'demo';
    return `plan_${base}`;
  }, [project?.id, project?.nombre]);

  const [planData] = useLocalStorage<{ pre: AnyRecord[]; pro: AnyRecord[] }>(storageKey, { pre: [], pro: [] });

  return useMemo(() => {
    return {
      pre: Array.isArray(planData.pre) ? planData.pre : [],
      pro: Array.isArray(planData.pro) ? planData.pro : [],
    };
  }, [planData]);
}

/** Convierte una semana de planificación a array de 7 días ISO */
function weekToSemanasISO(week: AnyRecord) {
  const start = parseYYYYMMDD(week.startDate as string);
  return Array.from({ length: 7 }, (_, i) => toISO(addDays(start, i)));
}

/** Unión de personas de los 7 días (usa el mismo shape que ReportesSemana entiende) */
function weekToPersonas(week: AnyRecord) {
  const seen = new Set<string>();
  const out: AnyRecord[] = [];
  const SOURCES = [
    { key: 'team', suffix: '' },
    { key: 'prelight', suffix: 'P' },
    { key: 'pickup', suffix: 'R' },
  ];
  for (const day of (week.days || []) as AnyRecord[]) {
    for (const { key, suffix } of SOURCES) {
      for (const m of (day[key] as AnyRecord[]) || []) {
        const baseRole = m.role || '';
        const role = baseRole ? `${baseRole}${suffix}` : '';
        // Generar nombre por defecto si no hay nombre
        const name = m.name || `Persona_${baseRole || 'UNKNOWN'}`;
        const id = `${role}__${name}`;
        if (!seen.has(id) && (role || name)) {
          seen.add(id);
          out.push({ id, cargo: role, nombre: name });
        }
      }
    }
  }
  return out;
}

export default function ReportesTab({ project, mode = 'semanal', readOnly = false }: ReportesTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Helper function to translate week label (same as in WeekCard)
  const translateWeekLabel = (label: string): string => {
    if (!label) return '';
    // Match patterns like "Semana 1", "Semana -1", "Week 1", "Setmana 1", etc.
    const match = label.match(/^(Semana|Week|Setmana)\s*(-?\d+)$/i);
    if (match) {
      const number = match[2];
      if (number.startsWith('-')) {
        return t('planning.weekFormatNegative', { number: number.substring(1) });
      } else {
        return t('planning.weekFormat', { number });
      }
    }
    // If it doesn't match the pattern, return as is (might be custom label)
    return label;
  };
  
  // Al entrar en Reportes, asegurar que la página está arriba del todo
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        window.scrollTo(0, 0);
      }
    } catch {}
  }, []);

  const { pre, pro } = usePlanWeeks(project);
  const allWeeks = [...pre, ...pro];
  const baseId = project?.id || project?.nombre || 'tmp';
  const condKeys = [
    `cond_${baseId}_semanal`,
    `cond_${baseId}_mensual`,
    `cond_${baseId}_publicidad`,
  ];

  // Usar useLocalStorage para cada clave de condiciones y crear un stamp
  const [condSemanal] = useLocalStorage<any>(condKeys[0] || '', {});
  const [condMensual] = useLocalStorage<any>(condKeys[1] || '', {});
  const [condPublicidad] = useLocalStorage<any>(condKeys[2] || '', {});

  const condStamp = useMemo(() => {
    return [condSemanal, condMensual, condPublicidad]
      .map(data => JSON.stringify(data))
      .join('|');
  }, [condSemanal, condMensual, condPublicidad]);

  // Verificar si hay equipo guardado usando useLocalStorage para detectar cambios automáticamente
  const teamKey = `team_${baseId}`;
  const [teamData] = useLocalStorage<any>(teamKey, null);
  
  const hasTeam = useMemo(() => {
    try {
      if (teamData) {
        const base = Array.isArray(teamData.base) ? teamData.base : [];
        const reinforcements = Array.isArray(teamData.reinforcements) ? teamData.reinforcements : [];
        const prelight = Array.isArray(teamData.prelight) ? teamData.prelight : [];
        const pickup = Array.isArray(teamData.pickup) ? teamData.pickup : [];
        return base.length > 0 || reinforcements.length > 0 || prelight.length > 0 || pickup.length > 0;
      }
      return false;
    } catch {
      return false;
    }
  }, [teamData]);

  const hasWeeks = allWeeks.length > 0;
  const projectId = project?.id || project?.nombre;
  const planificacionPath = projectId ? `/project/${projectId}/planificacion` : '/projects';
  const equipoPath = projectId ? `/project/${projectId}/equipo` : '/projects';

  // Caso 1: Faltan ambas cosas (semanas Y equipo)
  if (!hasWeeks && !hasTeam) {
    return (
      <div className='flex flex-col items-center justify-center py-16 px-8 text-center'>
        <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
          {t('reports.configureProject')}
        </h2>
        <p className='text-xl max-w-2xl mb-4' style={{color: 'var(--text)', opacity: 0.8}}>
          {t('reports.addWeeksIn')}{' '}
          <button
            onClick={() => !readOnly && navigate(planificacionPath)}
            disabled={readOnly}
            className={`underline font-semibold hover:opacity-80 transition-opacity ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{color: 'var(--brand)'}}
            title={readOnly ? t('conditions.projectClosed') : t('reports.goToPlanning')}
          >
            {t('navigation.planning')}
          </button>
          {' '}{t('reports.andTeamIn')}{' '}
          <button
            onClick={() => !readOnly && navigate(equipoPath)}
            disabled={readOnly}
            className={`underline font-semibold hover:opacity-80 transition-opacity ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{color: 'var(--brand)'}}
            title={readOnly ? t('conditions.projectClosed') : t('reports.goToTeam')}
          >
            {t('navigation.team')}
          </button>
          {' '}{t('reports.toGenerateReports')}
        </p>
      </div>
    );
  }

  // Caso 2: Solo faltan semanas (pero SÍ hay equipo)
  if (!hasWeeks) {
    return (
      <div className='flex flex-col items-center justify-center py-16 px-8 text-center'>
        <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
          {t('reports.noWeeksInPlanning')}
        </h2>
        <p className='text-xl max-w-2xl mb-4' style={{color: 'var(--text)', opacity: 0.8}}>
          {t('reports.addWeeksToAppear')}{' '}
          <button
            onClick={() => !readOnly && navigate(planificacionPath)}
            disabled={readOnly}
            className={`underline font-semibold hover:opacity-80 transition-opacity ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{color: 'var(--brand)'}}
            title={readOnly ? t('conditions.projectClosed') : t('reports.goToPlanning')}
          >
            {t('navigation.planning')}
          </button>
          {' '}{t('reports.toAppearHere')}
        </p>
      </div>
    );
  }

  const weeksWithPeople = allWeeks.filter(w => weekToPersonas(w).length > 0);

  // Caso 3: Solo falta equipo (pero SÍ hay semanas)
  if (weeksWithPeople.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 px-8 text-center'>
        <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
          {t('reports.missingTeam')}
        </h2>
        <p className='text-xl max-w-2xl mb-4' style={{color: 'var(--text)', opacity: 0.8}}>
          {t('reports.fillTeamIn')}{' '}
          <button
            onClick={() => !readOnly && navigate(equipoPath)}
            disabled={readOnly}
            className={`underline font-semibold hover:opacity-80 transition-opacity ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{color: 'var(--brand)'}}
            title={readOnly ? t('conditions.projectClosed') : t('reports.goToTeam')}
          >
            {t('navigation.team')}
          </button>
          {' '}{t('reports.toGenerateReports')}
        </p>
      </div>
    );
  }

  // Agrupar semanas por mes (solo para semanal y mensual)
  const weeksByMonth = useMemo(() => {
    if (mode === 'publicidad') return null;
    
    const grouped = new Map<string, AnyRecord[]>();
    weeksWithPeople.forEach(week => {
      const startDate = parseYYYYMMDD(week.startDate as string);
      const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, []);
      }
      grouped.get(monthKey)!.push(week);
    });
    return grouped;
  }, [weeksWithPeople, mode]);

  // Obtener todas las claves de meses ordenadas (para encontrar el mes siguiente)
  const allMonthKeys = useMemo(() => {
    if (!weeksByMonth) return [];
    return Array.from(weeksByMonth.keys()).sort();
  }, [weeksByMonth]);

  return (
    <div className='space-y-6'>
      {mode !== 'publicidad' && weeksByMonth ? (
        // Mostrar agrupado por mes con botón PDF y campos de fecha
        Array.from(weeksByMonth.entries()).map(([monthKey, weeks]) => {
          const [year, month] = monthKey.split('-').map(Number);
          // Obtener el locale según el idioma actual
          const localeMap: Record<string, string> = {
            'es': 'es-ES',
            'en': 'en-US',
            'ca': 'ca-ES',
          };
          const locale = localeMap[i18n.language] || 'es-ES';
          const monthNameFull = new Date(year, month - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
          // Solo el mes con primera letra mayúscula
          const monthName = new Date(year, month - 1, 1).toLocaleDateString(locale, { month: 'long' });
          const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
          return (
            <MonthReportGroup
              key={monthKey}
              monthKey={monthKey}
              monthName={monthNameCapitalized}
              monthNameFull={monthNameFull}
              weeks={weeks}
              allWeeksAvailable={weeksWithPeople}
              project={project}
              mode={mode}
              weekToSemanasISO={weekToSemanasISO}
              weekToPersonas={weekToPersonas}
              allMonthKeys={allMonthKeys}
              readOnly={readOnly}
            />
          );
        })
      ) : (
        // Modo publicidad: mostrar semanas sin agrupación
        (() => {
          // Para modo publicidad, usar una clave general
          const publicidadHorasExtraKey = useMemo(() => {
            const base = project?.id || project?.nombre || 'tmp';
            return `reportes_horasExtra_${base}_${mode}_publicidad`;
          }, [project?.id, project?.nombre, mode]);
          
          const horasExtraOpcionesPublicidad = [
            t('reports.extraHoursNormal'),
            t('reports.extraHoursMinutageFromCut'),
            t('reports.extraHoursMinutageCourtesy'),
          ] as const;
          
          const [horasExtraTipoPublicidad] = useLocalStorage<string>(
            publicidadHorasExtraKey,
            horasExtraOpcionesPublicidad[0]
          );
          
          // Helper para traducir el valor guardado si está en español (modo publicidad)
          const translateStoredExtraHoursTypePublicidad = (stored: string): string => {
            const translations: Record<string, Record<string, string>> = {
              'Hora Extra - Normal': {
                'es': 'Hora Extra - Normal',
                'en': t('reports.extraHoursNormal'),
                'ca': t('reports.extraHoursNormal'),
              },
              'Hora Extra - Minutaje desde corte': {
                'es': 'Hora Extra - Minutaje desde corte',
                'en': t('reports.extraHoursMinutageFromCut'),
                'ca': t('reports.extraHoursMinutageFromCut'),
              },
              'Hora Extra - Minutaje + Cortesía': {
                'es': 'Hora Extra - Minutaje + Cortesía',
                'en': t('reports.extraHoursMinutageCourtesy'),
                'ca': t('reports.extraHoursMinutageCourtesy'),
              },
            };
            if (translations[stored] && translations[stored][i18n.language]) {
              return translations[stored][i18n.language];
            }
            // Si ya está traducido, devolverlo tal cual
            if (horasExtraOpcionesPublicidad.includes(stored as any)) {
              return stored;
            }
            return stored;
          };
          
          const displayedHorasExtraTipoPublicidad = translateStoredExtraHoursTypePublicidad(horasExtraTipoPublicidad);
          
          return weeksWithPeople.map(week => (
            <ReportesSemana
              key={week.id as string}
              project={project as AnyRecord}
              title={translateWeekLabel(week.label as string)}
              semana={weekToSemanasISO(week)}
              personas={weekToPersonas(week)}
              mode={mode}
              horasExtraTipo={displayedHorasExtraTipoPublicidad}
              readOnly={readOnly}
              planTimesByDate={(iso: string) => {
                const idx = weekToSemanasISO(week).indexOf(iso);
                if (idx >= 0) {
                  const d = (week.days as AnyRecord[])[idx];
                  return { inicio: d.start || '', fin: d.end || '' };
                }
                return null;
              }}
            />
          ));
        })()
      )}
    </div>
  );
}

// Componente para agrupar semanas por mes con botón PDF y campos de fecha
function MonthReportGroup({
  monthKey,
  monthName,
  monthNameFull,
  weeks,
  allWeeksAvailable,
  project,
  mode,
  weekToSemanasISO,
  weekToPersonas,
  allMonthKeys,
  readOnly = false,
}: {
  monthKey: string;
  monthName: string;
  monthNameFull: string;
  weeks: AnyRecord[];
  allWeeksAvailable: AnyRecord[];
  project?: Project;
  mode: 'semanal' | 'mensual' | 'publicidad';
  weekToSemanasISO: (week: AnyRecord) => string[];
  weekToPersonas: (week: AnyRecord) => AnyRecord[];
  allMonthKeys: string[];
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  
  // Helper function to translate week label (same as in ReportesTab)
  const translateWeekLabel = (label: string): string => {
    if (!label) return '';
    // Match patterns like "Semana 1", "Semana -1", "Week 1", "Setmana 1", etc.
    const match = label.match(/^(Semana|Week|Setmana)\s*(-?\d+)$/i);
    if (match) {
      const number = match[2];
      if (number.startsWith('-')) {
        return t('planning.weekFormatNegative', { number: number.substring(1) });
      } else {
        return t('planning.weekFormat', { number });
      }
    }
    // If it doesn't match the pattern, return as is (might be custom label)
    return label;
  };
  
  // Calcular rango de fechas por defecto (primera y última fecha del mes)
  const defaultDateRange = useMemo(() => {
    if (weeks.length === 0) return { from: '', to: '' };
    const allDates: string[] = [];
    weeks.forEach(week => {
      allDates.push(...weekToSemanasISO(week));
    });
    allDates.sort();
    return { from: allDates[0] || '', to: allDates[allDates.length - 1] || '' };
  }, [weeks, weekToSemanasISO]);

  // Clave única para persistir las fechas de cada mes
  const dateRangeKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    return `reportes_dateRange_${base}_${mode}_${monthKey}`;
  }, [project?.id, project?.nombre, mode, monthKey]);

  // Usar useLocalStorage para persistir las fechas, inicializando con valores por defecto si no existen
  const defaultFrom = defaultDateRange.from || '';
  const defaultTo = defaultDateRange.to || '';
  const [dateFrom, setDateFrom] = useLocalStorage<string>(`${dateRangeKey}_from`, defaultFrom);
  const [dateTo, setDateTo] = useLocalStorage<string>(`${dateRangeKey}_to`, defaultTo);

  // Actualizar fechas si los valores por defecto cambian y las fechas actuales están vacías
  // También verificar si están en localStorage, porque useLocalStorage puede inicializar el estado sin guardar
  useEffect(() => {
    const keyFrom = `${dateRangeKey}_from`;
    const keyTo = `${dateRangeKey}_to`;
    const storedFrom = storage.getString(keyFrom);
    const storedTo = storage.getString(keyTo);
    
    // Si hay valores por defecto y no están en localStorage, guardarlos
    if (defaultFrom && !storedFrom) {
      setDateFrom(defaultFrom);
    }
    if (defaultTo && !storedTo) {
      setDateTo(defaultTo);
    }
  }, [defaultFrom, defaultTo, dateFrom, dateTo, setDateFrom, setDateTo, dateRangeKey]);

  // Escuchar cambios en localStorage desde otros componentes (mes anterior)
  useEffect(() => {
    const handleStorageChange = (e: CustomEvent) => {
      const changedKey = e.detail?.key;
      const currentFromKey = `${dateRangeKey}_from`;
      
      if (changedKey === currentFromKey) {
        // Forzar actualización leyendo directamente del localStorage
        const newValue = storage.getString(currentFromKey);
        if (newValue) {
          try {
            const parsed = JSON.parse(newValue);
            if (parsed !== dateFrom) {
              setDateFrom(parsed);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    };
    
    window.addEventListener('localStorageChange', handleStorageChange as EventListener);
    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange as EventListener);
    };
  }, [dateRangeKey, dateFrom, setDateFrom, monthKey]);

  // Cuando cambia "Hasta", actualizar automáticamente "Desde" del mes siguiente
  useEffect(() => {
    if (!dateTo) return;

    // Calcular el día siguiente
    const currentDate = parseYYYYMMDD(dateTo);
    const nextDate = addDays(currentDate, 1);
    const nextDateISO = toISO(nextDate);

    // Encontrar el mes siguiente
    const currentIndex = allMonthKeys.indexOf(monthKey);
    if (currentIndex === -1 || currentIndex === allMonthKeys.length - 1) {
      return; // No hay mes siguiente
    }

    const nextMonthKey = allMonthKeys[currentIndex + 1];
    
    // Actualizar "Desde" del mes siguiente con el día siguiente (sin verificar el mes)
    const base = project?.id || project?.nombre || 'tmp';
    const nextDateRangeKey = `reportes_dateRange_${base}_${mode}_${nextMonthKey}_from`;
    
    // Guardar en localStorage usando el servicio
    storage.setString(nextDateRangeKey, JSON.stringify(nextDateISO));
    
    // Disparar un evento personalizado para notificar a otros componentes
    window.dispatchEvent(
      new CustomEvent('localStorageChange', {
        detail: { key: nextDateRangeKey, value: nextDateISO },
      })
    );
  }, [dateTo, monthKey, allMonthKeys, project?.id, project?.nombre, mode]);

  const handleExportPDF = async () => {
    if (!dateFrom || !dateTo) {
      alert(t('reports.pleaseSelectDates'));
      return;
    }

    // Buscar TODAS las semanas que tengan días en el rango, no solo las del mes agrupado
    // Usar todas las semanas disponibles para encontrar cualquier semana que tenga días en el rango
    const weeksInRange: AnyRecord[] = [];
    allWeeksAvailable.forEach(week => {
      const weekDays = weekToSemanasISO(week);
      const hasDaysInRange = weekDays.some(day => day >= dateFrom && day <= dateTo);
      if (hasDaysInRange) {
        weeksInRange.push(week);
      }
    });

    if (weeksInRange.length === 0) {
      alert(t('reports.noWeeksInRange'));
      return;
    }

    // Recopilar todos los días del rango de todas las semanas encontradas
    const allDaysInRange: string[] = [];
    weeksInRange.forEach(week => {
      const weekDays = weekToSemanasISO(week);
      weekDays.forEach(day => {
        if (day >= dateFrom && day <= dateTo) {
          if (!allDaysInRange.includes(day)) {
            allDaysInRange.push(day);
          }
        }
      });
    });
    allDaysInRange.sort();

    if (allDaysInRange.length === 0) {
      alert(t('reports.noDaysInRange'));
      return;
    }

    // Recopilar todas las personas de todas las semanas encontradas
    const allPersonas = new Map<string, AnyRecord>();
    weeksInRange.forEach(week => {
      weekToPersonas(week).forEach(persona => {
        const key = `${persona.cargo}__${persona.nombre}`;
        if (!allPersonas.has(key)) {
          allPersonas.set(key, persona);
        }
      });
    });

    // Formatear fechas para el título (DD/MM/YYYY)
    const formatDateForTitle = (iso: string) => {
      const [y, m, d] = iso.split('-').map(Number);
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    };

    // Exportar PDF con el rango de fechas usando todas las semanas encontradas
    await exportReportRangeToPDF({
      project,
      title: t('reports.fromDateToDate', { from: formatDateForTitle(dateFrom), to: formatDateForTitle(dateTo) }),
      safeSemana: allDaysInRange,
      personas: Array.from(allPersonas.values()),
      mode,
      weekToSemanasISO,
      weekToPersonas,
      weeks: weeksInRange,
    });
  };

  // Estado para el selector de "Horas Extra"
  const horasExtraKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    return `reportes_horasExtra_${base}_${mode}_${monthKey}`;
  }, [project?.id, project?.nombre, mode, monthKey]);

  const horasExtraOpciones = [
    t('reports.extraHoursNormal'),
    t('reports.extraHoursMinutageFromCut'),
    t('reports.extraHoursMinutageCourtesy'),
  ] as const;

  const [horasExtraTipo, setHorasExtraTipo] = useLocalStorage<string>(
    horasExtraKey,
    horasExtraOpciones[0]
  );
  
  // Helper para traducir el valor guardado si está en español
  const translateStoredExtraHoursType = (stored: string): string => {
    const translations: Record<string, Record<string, string>> = {
      'Hora Extra - Normal': {
        'es': 'Hora Extra - Normal',
        'en': t('reports.extraHoursNormal'),
        'ca': t('reports.extraHoursNormal'),
      },
      'Hora Extra - Minutaje desde corte': {
        'es': 'Hora Extra - Minutaje desde corte',
        'en': t('reports.extraHoursMinutageFromCut'),
        'ca': t('reports.extraHoursMinutageFromCut'),
      },
      'Hora Extra - Minutaje + Cortesía': {
        'es': 'Hora Extra - Minutaje + Cortesía',
        'en': t('reports.extraHoursMinutageCourtesy'),
        'ca': t('reports.extraHoursMinutageCourtesy'),
      },
    };
    if (translations[stored] && translations[stored][i18n.language]) {
      return translations[stored][i18n.language];
    }
    // Si ya está traducido, devolverlo tal cual
    if (horasExtraOpciones.includes(stored as any)) {
      return stored;
    }
    return stored;
  };
  
  const displayedHorasExtraTipo = translateStoredExtraHoursType(horasExtraTipo);

  // Detectar el tema actual para el color del selector
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        const currentTheme = (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
        setTheme(currentTheme);
      }
    };

    // Observar cambios en el atributo data-theme
    const observer = new MutationObserver(updateTheme);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }

    window.addEventListener('themechange', updateTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('themechange', updateTheme);
    };
  }, []);

  const focusColor = theme === 'light' ? '#0476D9' : '#F27405';
  
  // Estado para el dropdown personalizado
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className='space-y-4'>
      {/* Bloque de controles del mes */}
      <div className='flex items-center gap-4 p-4 bg-neutral-panel/50 rounded-lg border border-neutral-border'>
        <span className='text-lg font-semibold text-brand'>{monthName}</span>
        <div className='ml-auto flex items-center gap-4'>
          <div className='flex items-center gap-2 mr-6 relative' ref={dropdownRef}>
            <button
              type='button'
              onClick={() => !readOnly && setIsDropdownOpen(!isDropdownOpen)}
              disabled={readOnly}
              onMouseEnter={() => !readOnly && setIsButtonHovered(true)}
              onMouseLeave={() => setIsButtonHovered(false)}
              onBlur={() => setIsButtonHovered(false)}
              className={`px-3 py-2 rounded-lg border focus:outline-none text-sm w-full min-w-[280px] text-left transition-colors ${
                theme === 'light' 
                  ? 'bg-white text-gray-900' 
                  : 'bg-black/40 text-zinc-300'
              } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={readOnly ? t('conditions.projectClosed') : t('reports.selectExtraHoursType')}
              style={{
                borderWidth: isButtonHovered ? '1.5px' : '1px',
                borderStyle: 'solid',
                borderColor: isButtonHovered && theme === 'light' 
                  ? '#0476D9' 
                  : (isButtonHovered && theme === 'dark'
                    ? '#fff'
                    : 'var(--border)'),
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                paddingRight: '2.5rem',
              }}
            >
              {displayedHorasExtraTipo}
            </button>
            {isDropdownOpen && !readOnly && (
              <div className={`absolute top-full left-0 mt-1 w-full min-w-[280px] border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
                theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
              }`}>
                {horasExtraOpciones.map(opcion => (
                  <button
                    key={opcion}
                    type='button'
                    onClick={() => {
                      if (readOnly) return;
                      setHorasExtraTipo(opcion);
                      setIsDropdownOpen(false);
                      setHoveredOption(null);
                    }}
                    disabled={readOnly}
                    onMouseEnter={() => setHoveredOption(opcion)}
                    onMouseLeave={() => setHoveredOption(null)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      theme === 'light' 
                        ? 'text-gray-900' 
                        : 'text-zinc-300'
                    }`}
                    style={{
                      backgroundColor: hoveredOption === opcion 
                        ? (theme === 'light' ? '#A0D3F2' : focusColor)
                        : 'transparent',
                      color: hoveredOption === opcion 
                        ? (theme === 'light' ? '#111827' : 'white')
                        : 'inherit',
                    }}
                  >
                    {opcion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <label className='text-sm text-zinc-300 whitespace-nowrap'>{t('reports.from')}</label>
            <input
              type='date'
              value={dateFrom}
              onChange={e => !readOnly && setDateFrom(e.target.value)}
              disabled={readOnly}
              readOnly={readOnly}
              className={`px-3 py-2 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={readOnly ? t('conditions.projectClosed') : t('reports.from')}
            />
          </div>
          <div className='flex items-center gap-2'>
            <label className='text-sm text-zinc-300 whitespace-nowrap'>{t('reports.to')}</label>
            <input
              type='date'
              value={dateTo}
              onChange={e => !readOnly && setDateTo(e.target.value)}
              disabled={readOnly}
              readOnly={readOnly}
              className={`px-3 py-2 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={readOnly ? t('conditions.projectClosed') : t('reports.to')}
            />
          </div>
          <button
            onClick={handleExportPDF}
            className='px-3 py-2 rounded-lg text-sm font-semibold btn-pdf'
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            title={t('reports.exportMonthPDF')}
          >
            PDF
          </button>
        </div>
      </div>

      {/* Semanas del mes */}
      {weeks.map(week => (
        <ReportesSemana
          key={week.id as string}
          project={project as AnyRecord}
          title={translateWeekLabel(week.label as string)}
          semana={weekToSemanasISO(week)}
          personas={weekToPersonas(week)}
          mode={mode}
          horasExtraTipo={displayedHorasExtraTipo}
          readOnly={readOnly}
          planTimesByDate={(iso: string) => {
            const idx = weekToSemanasISO(week).indexOf(iso);
            if (idx >= 0) {
              const d = (week.days as AnyRecord[])[idx];
              return { inicio: d.start || '', fin: d.end || '' };
            }
            return null;
          }}
        />
      ))}
    </div>
  );
}
