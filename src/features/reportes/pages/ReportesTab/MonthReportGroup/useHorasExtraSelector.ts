import { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { storage } from '@shared/services/localStorage.service';

interface UseHorasExtraSelectorParams {
  project?: { id?: string; nombre?: string };
  mode: 'semanal' | 'mensual' | 'diario';
  monthKey: string;
  readOnly?: boolean;
  allMonthKeys?: string[]; // Claves de todos los meses para sincronizar con el siguiente
}

/**
 * Hook para gestionar el selector de "Horas Extra"
 */
export function useHorasExtraSelector({
  project,
  mode,
  monthKey,
  readOnly = false,
  allMonthKeys = [],
}: UseHorasExtraSelectorParams) {
  const { t } = useTranslation();

  const horasExtraKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    return `reportes_horasExtra_${base}_${mode}_${monthKey}`;
  }, [project?.id, project?.nombre, mode, monthKey]);

  const horasExtraOpciones = [
    t('reports.extraHoursNormal'),
    t('reports.extraHoursMinutageFromCut'),
    t('reports.extraHoursMinutageCourtesy'),
  ] as const;

  const [horasExtraTipo, setHorasExtraTipoInternal] = useLocalStorage<string>(
    horasExtraKey,
    horasExtraOpciones[0]
  );

  // Función para sincronizar con todos los meses
  const setHorasExtraTipo = (newValue: string) => {
    // Actualizar el valor actual
    setHorasExtraTipoInternal(newValue);
    
    const base = project?.id || project?.nombre || 'tmp';
    const targetMonthKeys = allMonthKeys.filter(key => key !== monthKey);
    if (targetMonthKeys.length === 0) return;

    if (typeof window !== 'undefined') {
      for (const targetKey of targetMonthKeys) {
        const storageKey = `reportes_horasExtra_${base}_${mode}_${targetKey}`;
        try {
          storage.setString(storageKey, JSON.stringify(newValue));
          // Disparar un evento storage simulado para que useLocalStorage lo detecte
          // Nota: storage events solo se disparan entre pestañas, así que usamos un evento personalizado
          window.dispatchEvent(
            new CustomEvent('horasExtraSync', {
              detail: {
                key: storageKey,
                value: newValue,
              },
            })
          );
        } catch (error) {
          console.error('Error sincronizando hora extra entre meses:', error);
        }
      }
    }
  };

  // Escuchar cambios de horas extra desde el mes anterior para sincronizar
  useEffect(() => {
    const base = project?.id || project?.nombre || 'tmp';
    const currentKeyStorage = `reportes_horasExtra_${base}_${mode}_${monthKey}`;
    
    const handleHorasExtraSync = (event: CustomEvent) => {
      // Si el cambio es para este mes (viene del mes anterior), actualizar
      if (event.detail.key === currentKeyStorage) {
        setHorasExtraTipoInternal(event.detail.value);
      }
    };

    window.addEventListener('horasExtraSync', handleHorasExtraSync as EventListener);

    return () => {
      window.removeEventListener('horasExtraSync', handleHorasExtraSync as EventListener);
    };
  }, [project?.id, project?.nombre, mode, monthKey, setHorasExtraTipoInternal]);

  // Helper para traducir el valor guardado si está en español
  const translateStoredExtraHoursType = (stored: string): string => {
    const translations: Record<string, Record<string, string>> = {
      'Hora Extra - Normal': {
        es: 'Hora Extra - Normal',
        en: t('reports.extraHoursNormal'),
        ca: t('reports.extraHoursNormal'),
      },
      'Hora Extra - Minutaje desde corte': {
        es: 'Hora Extra - Minutaje desde corte',
        en: t('reports.extraHoursMinutageFromCut'),
        ca: t('reports.extraHoursMinutageFromCut'),
      },
      'Hora Extra - Minutaje + Cortesía': {
        es: 'Hora Extra - Minutaje + Cortesía',
        en: t('reports.extraHoursMinutageCourtesy'),
        ca: t('reports.extraHoursMinutageCourtesy'),
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

  return {
    horasExtraOpciones,
    displayedHorasExtraTipo,
    setHorasExtraTipo,
    theme,
    focusColor,
    isDropdownOpen,
    setIsDropdownOpen,
    hoveredOption,
    setHoveredOption,
    isButtonHovered,
    setIsButtonHovered,
    dropdownRef,
  };
}

