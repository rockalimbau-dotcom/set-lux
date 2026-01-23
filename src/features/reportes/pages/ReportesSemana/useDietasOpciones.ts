import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DIETAS_OPCIONES, DIETAS_OPCIONES_DIARIO } from '../../constants';

// Mapeo de opciones a claves de traducción
const OPTION_TO_TRANSLATION_KEY: Record<string, string> = {
  '': 'empty',
  'Comida': 'lunch',
  'Cena': 'dinner',
  'Dieta sin pernoctar': 'dietNoOvernight',
  'Dieta con pernocta': 'dietWithOvernight',
  'Gastos de bolsillo': 'pocketExpenses',
  'Ticket': 'ticket',
  'Otros': 'other',
};

export function useDietasOpciones(mode: 'semanal' | 'mensual' | 'diario') {
  const { t } = useTranslation();
  
  return useMemo(() => {
    const baseOptions = mode === 'diario' ? DIETAS_OPCIONES_DIARIO : DIETAS_OPCIONES;
    const translations = mode === 'diario' ? t('reports.dietOptionsAdvertising', { returnObjects: true }) : t('reports.dietOptions', { returnObjects: true });
    return baseOptions.map((opt) => {
      if (opt === '') return opt; // Empty string
      const translationKey = OPTION_TO_TRANSLATION_KEY[opt];
      if (translationKey && translations && typeof translations === 'object') {
        return (translations as Record<string, string>)[translationKey] || opt;
      }
      return opt;
    });
  }, [mode, t]);
}

