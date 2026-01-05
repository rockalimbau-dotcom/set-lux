import { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';

interface UseHorasExtraSelectorParams {
  project?: { id?: string; nombre?: string };
  mode: 'semanal' | 'mensual' | 'publicidad';
  monthKey: string;
  readOnly?: boolean;
}

/**
 * Hook para gestionar el selector de "Horas Extra"
 */
export function useHorasExtraSelector({
  project,
  mode,
  monthKey,
  readOnly = false,
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

  const [horasExtraTipo, setHorasExtraTipo] = useLocalStorage<string>(
    horasExtraKey,
    horasExtraOpciones[0]
  );

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

