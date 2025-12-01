import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { storage } from '@shared/services/localStorage.service';

import ReportesSemana from './ReportesSemana.tsx';
import { exportReportRangeToPDF } from '../utils/export';

type AnyRecord = Record<string, any>;

type Project = { id?: string; nombre?: string };

type ReportesTabProps = { 
  project?: Project; 
  mode?: 'semanal' | 'mensual' | 'publicidad';
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

export default function ReportesTab({ project, mode = 'semanal' }: ReportesTabProps) {
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

  if (allWeeks.length === 0) {
    return (
      <div className='text-sm text-zinc-400 border border-dashed border-neutral-border rounded-xl p-4 bg-neutral-surface'>
        No hay semanas en Planificación. Añade semanas allí para que aparezcan
        aquí los reportes.
      </div>
    );
  }

  const weeksWithPeople = allWeeks.filter(w => weekToPersonas(w).length > 0);

  if (weeksWithPeople.length === 0) {
    return (
      <div className='text-sm text-zinc-400 border border-dashed border-neutral-border rounded-xl p-4 bg-neutral-surface'>
        Falta añadir el equipo. Por favor, rellena en la pestaña <b>Equipo</b>{' '}
        el equipo base del proyecto para poder generar los reportes.
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
          const monthNameFull = new Date(year, month - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
          // Solo el mes con primera letra mayúscula
          const monthName = new Date(year, month - 1, 1).toLocaleDateString('es-ES', { month: 'long' });
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
            'Hora Extra - Normal',
            'Hora Extra - Minutaje desde corte',
            'Hora Extra - Minutaje + Cortesía',
          ] as const;
          
          const [horasExtraTipoPublicidad] = useLocalStorage<string>(
            publicidadHorasExtraKey,
            horasExtraOpcionesPublicidad[0]
          );
          
          return weeksWithPeople.map(week => (
            <ReportesSemana
              key={week.id as string}
              project={project as AnyRecord}
              title={week.label as string}
              semana={weekToSemanasISO(week)}
              personas={weekToPersonas(week)}
              mode={mode}
              horasExtraTipo={horasExtraTipoPublicidad}
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
}) {
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
  useEffect(() => {
    if (!dateFrom && defaultFrom) {
      setDateFrom(defaultFrom);
    }
    if (!dateTo && defaultTo) {
      setDateTo(defaultTo);
    }
  }, [defaultFrom, defaultTo, dateFrom, dateTo, setDateFrom, setDateTo]);

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
      alert('Por favor, selecciona las fechas de inicio y fin');
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
      alert('No hay semanas con días en el rango seleccionado');
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
      alert('No hay días en el rango seleccionado');
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
      title: `Del ${formatDateForTitle(dateFrom)} al ${formatDateForTitle(dateTo)}`,
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
    'Hora Extra - Normal',
    'Hora Extra - Minutaje desde corte',
    'Hora Extra - Minutaje + Cortesía',
  ] as const;

  const [horasExtraTipo, setHorasExtraTipo] = useLocalStorage<string>(
    horasExtraKey,
    horasExtraOpciones[0]
  );

  // Detectar el tema actual para el color del selector
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'dark') as 'dark' | 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        const currentTheme = (document.documentElement.getAttribute('data-theme') || 'dark') as 'dark' | 'light';
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
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className='px-3 py-2 rounded-lg bg-black/40 border border-neutral-border focus:outline-none text-sm text-zinc-300 w-full min-w-[280px] text-left'
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23ffffff\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                paddingRight: '2.5rem',
              }}
            >
              {horasExtraTipo}
            </button>
            {isDropdownOpen && (
              <div className='absolute top-full left-0 mt-1 w-full min-w-[280px] bg-neutral-panel border border-neutral-border rounded-lg shadow-lg z-50 overflow-hidden'>
                {horasExtraOpciones.map(opcion => (
                  <button
                    key={opcion}
                    type='button'
                    onClick={() => {
                      setHorasExtraTipo(opcion);
                      setIsDropdownOpen(false);
                      setHoveredOption(null);
                    }}
                    onMouseEnter={() => setHoveredOption(opcion)}
                    onMouseLeave={() => setHoveredOption(null)}
                    className='w-full text-left px-3 py-2 text-sm text-zinc-300 transition-colors'
                    style={{
                      backgroundColor: hoveredOption === opcion ? focusColor : 'transparent',
                      color: hoveredOption === opcion ? 'white' : 'inherit',
                    }}
                  >
                    {opcion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <label className='text-sm text-zinc-300 whitespace-nowrap'>Desde:</label>
            <input
              type='date'
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className='px-3 py-2 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm'
            />
          </div>
          <div className='flex items-center gap-2'>
            <label className='text-sm text-zinc-300 whitespace-nowrap'>Hasta:</label>
            <input
              type='date'
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className='px-3 py-2 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm'
            />
          </div>
          <button
            onClick={handleExportPDF}
            className='px-4 py-2 rounded-lg text-sm font-semibold text-white'
            style={{
              background: '#f59e0b',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
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
          title={week.label as string}
          semana={weekToSemanasISO(week)}
          personas={weekToPersonas(week)}
          mode={mode}
          horasExtraTipo={horasExtraTipo}
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
