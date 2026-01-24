import React, { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { parseYYYYMMDD } from '@shared/utils/date';
import ReportesSemana from '../ReportesSemana.tsx';
import { AnyRecord } from '@shared/types/common';
import { ReportesTabProps, Project } from './ReportesTabTypes';
import { usePlanWeeks } from './usePlanWeeks';
import { useTeamData } from './useTeamData';
import { weekToSemanasISO, weekToPersonas, translateWeekLabel } from './ReportesTabHelpers';
import EmptyStateMessages from './EmptyStateMessages';
import MonthReportGroup from './MonthReportGroup';

export default function ReportesTab({ project, mode = 'semanal', readOnly = false }: ReportesTabProps) {
  const { t } = useTranslation();
  
  // Al entrar en Reportes, asegurar que la página está arriba del todo
  useEffect(() => {
    // Usar múltiples intentos para asegurar que el scroll se ejecute después del renderizado completo
    // y después de cualquier focus automático que pueda ocurrir
    const scrollToTop = () => {
      try {
        if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          // También hacer scroll en el contenedor principal si existe
          const mainContent = document.querySelector('main') || document.documentElement;
          if (mainContent && 'scrollTo' in mainContent) {
            (mainContent as HTMLElement).scrollTo({ top: 0, left: 0, behavior: 'instant' });
          }
          // También hacer scroll en el body si es necesario
          if (document.body) {
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
          }
        }
      } catch {}
    };
    
    // Ejecutar inmediatamente
    scrollToTop();
    
    // Ejecutar después del siguiente frame
    requestAnimationFrame(() => {
      scrollToTop();
      // Ejecutar después de un delay más largo para asegurar que se ejecute después de cualquier focus
      setTimeout(scrollToTop, 100);
      // Una vez más después de un delay aún mayor para contenido que se renderiza más tarde
      setTimeout(scrollToTop, 300);
    });
  }, []);

  const { pre, pro } = usePlanWeeks(project);
  const allWeeks = [...pre, ...pro];
  const baseId = project?.id || project?.nombre || 'tmp';
  const condKeys = [
    `cond_${baseId}_semanal`,
    `cond_${baseId}_mensual`,
    `cond_${baseId}_diario`,
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

  const { hasTeam } = useTeamData(baseId);
  const hasWeeks = allWeeks.length > 0;
  const weeksWithPeople = allWeeks.filter(w => weekToPersonas(w).length > 0);
  const projectId = project?.id || project?.nombre;

  // Agrupar semanas por mes (solo para semanal y mensual)
  const weeksByMonth = useMemo(() => {
    if (mode === 'diario') return null;
    
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

  // Verificar si hay un estado vacío (no hay semanas o no hay equipo)
  const shouldShowEmptyState = !hasWeeks || !hasTeam || weeksWithPeople.length === 0;

  // Mostrar mensajes de estado vacío si es necesario
  if (shouldShowEmptyState) {
    return (
      <EmptyStateMessages
        projectId={projectId}
        readOnly={readOnly}
        hasWeeks={hasWeeks}
        hasTeam={hasTeam}
      />
    );
  }

  return (
    <div className='space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6'>
      {mode !== 'diario' && weeksByMonth ? (
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
        // Modo diario: mostrar semanas sin agrupación
        (() => {
          // Para modo diario, usar una clave general
          const diarioHorasExtraKey = useMemo(() => {
            const base = project?.id || project?.nombre || 'tmp';
            return `reportes_horasExtra_${base}_${mode}_diario`;
          }, [project?.id, project?.nombre, mode]);
          
          const horasExtraOpcionesDiario = [
            t('reports.extraHoursNormal'),
            t('reports.extraHoursMinutageFromCut'),
            t('reports.extraHoursMinutageCourtesy'),
          ] as const;
          
          const [horasExtraTipoDiario] = useLocalStorage<string>(
            diarioHorasExtraKey,
            horasExtraOpcionesDiario[0]
          );
          
          // Helper para traducir el valor guardado si está en español (modo diario)
          const translateStoredExtraHoursTypeDiario = (stored: string): string => {
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
            if (horasExtraOpcionesDiario.includes(stored as any)) {
              return stored;
            }
            return stored;
          };
          
          const displayedHorasExtraTipoDiario = translateStoredExtraHoursTypeDiario(horasExtraTipoDiario);
          
          return weeksWithPeople.map((week, index) => (
            <ReportesSemana
              key={week.id as string}
              project={project as AnyRecord}
              title={translateWeekLabel(week.label as string, t)}
              semana={weekToSemanasISO(week)}
              personas={weekToPersonas(week)}
              mode={mode}
              horasExtraTipo={displayedHorasExtraTipoDiario}
              readOnly={readOnly}
              tutorialId={index === 0 ? 'reports-week' : undefined}
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

