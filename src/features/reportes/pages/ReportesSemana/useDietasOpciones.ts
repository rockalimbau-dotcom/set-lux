import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DIETAS_OPCIONES, DIETAS_OPCIONES_PUBLICIDAD } from '../../constants';

export function useDietasOpciones(mode: 'semanal' | 'mensual' | 'publicidad') {
  const { t } = useTranslation();
  
  return useMemo(() => {
    const baseOptions = mode === 'publicidad' ? DIETAS_OPCIONES_PUBLICIDAD : DIETAS_OPCIONES;
    const translations = mode === 'publicidad' ? t('reports.dietOptionsAdvertising', { returnObjects: true }) : t('reports.dietOptions', { returnObjects: true });
    return baseOptions.map((opt, idx) => {
      if (idx === 0) return opt; // Empty string
      const key = Object.keys(translations as Record<string, string>)[idx];
      return (translations as Record<string, string>)[key] || opt;
    });
  }, [mode, t]);
}

