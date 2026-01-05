import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnyRecord } from '@shared/types/common';
import { renderWithParams, visibleToTemplate } from '../shared';
import { normalizeText, getDefaultsMensual } from '../../utils/translationHelpers';
import { updateDynamicFestivos, globalDynamicFestivosText } from './mensualData';

interface UseMensualLanguageSyncProps {
  model: AnyRecord;
  setModel: React.Dispatch<React.SetStateAction<AnyRecord>>;
  getDefaultLegend: () => string;
  getDefaultHorarios: () => string;
  getDefaultDietas: () => string;
  getDefaultTransportes: () => string;
  getDefaultAlojamiento: () => string;
  getDefaultPrepro: () => string;
  getDefaultConvenio: () => string;
}

/**
 * Hook to sync mensual conditions templates when language changes
 */
export function useMensualLanguageSync({
  model,
  setModel,
  getDefaultLegend,
  getDefaultHorarios,
  getDefaultDietas,
  getDefaultTransportes,
  getDefaultAlojamiento,
  getDefaultPrepro,
  getDefaultConvenio,
}: UseMensualLanguageSyncProps) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const handleLanguageChange = async () => {
      await updateDynamicFestivos();
      
      setModel((m: AnyRecord) => {
        if (!m) return m;
        const updated = { ...m };
        
        const newDefaultLegend = getDefaultLegend();
        const newDefaultHorarios = getDefaultHorarios();
        const newDefaultDietas = getDefaultDietas();
        const newDefaultTransportes = getDefaultTransportes();
        const newDefaultAlojamiento = getDefaultAlojamiento();
        const newDefaultPrepro = getDefaultPrepro();
        const newDefaultConvenio = getDefaultConvenio();
        
        const params = m.params || {};
        const currentLegendRendered = renderWithParams(m.legendTemplate || '', params);
        const currentHorariosRendered = renderWithParams(m.horariosTemplate || '', params);
        const currentDietasRendered = renderWithParams(m.dietasTemplate || '', params);
        const currentTransportesRendered = renderWithParams(m.transportesTemplate || '', params);
        const currentAlojamientoRendered = renderWithParams(m.alojamientoTemplate || '', params);
        const currentPreproRendered = renderWithParams(m.preproTemplate || '', params);
        const currentConvenioRendered = renderWithParams(m.convenioTemplate || '', params);
        
        const languages = ['es', 'en', 'ca'];
        const isRenderedDefault = (currentRendered: string, currentTemplate: string, key: string): boolean => {
          if (!currentRendered || currentRendered.trim() === '') return true;
          if (!currentTemplate || currentTemplate.trim() === '') return true;
          
          const hasDefaultVariables = currentTemplate.includes('{{') && currentTemplate.includes('}}');
          const normalizedCurrent = normalizeText(currentRendered);
          
          const matchesAnyDefault = languages.some(lang => {
            try {
              const defaultText = i18n.t(key, { lng: lang });
              const defaultRendered = renderWithParams(defaultText, params);
              const normalizedDefault = normalizeText(defaultRendered);
              
              if (normalizedCurrent === normalizedDefault) return true;
              
              if (hasDefaultVariables) {
                const normalizedTemplate = normalizeText(currentTemplate);
                const normalizedDefaultTemplate = normalizeText(defaultText);
                const templateStructure = normalizedTemplate.replace(/\{\{[^}]+\}\}/g, '{{VAR}}');
                const defaultStructure = normalizedDefaultTemplate.replace(/\{\{[^}]+\}\}/g, '{{VAR}}');
                if (templateStructure === defaultStructure) return true;
              }
              
              return false;
            } catch {
              return false;
            }
          });
          
          return matchesAnyDefault;
        };
        
        if (isRenderedDefault(currentLegendRendered, m.legendTemplate || '', 'conditions.defaultLegendMonthly')) {
          updated.legendTemplate = newDefaultLegend;
        }
        if (!m.festivosTemplate || m.festivosTemplate.trim() === '' || m.festivosTemplate.includes('{{')) {
          updated.festivosTemplate = globalDynamicFestivosText;
        }
        if (isRenderedDefault(currentHorariosRendered, m.horariosTemplate || '', 'conditions.defaultSchedules')) {
          updated.horariosTemplate = newDefaultHorarios;
        }
        if (isRenderedDefault(currentDietasRendered, m.dietasTemplate || '', 'conditions.defaultPerDiems')) {
          updated.dietasTemplate = newDefaultDietas;
        }
        if (isRenderedDefault(currentTransportesRendered, m.transportesTemplate || '', 'conditions.defaultTransportation')) {
          updated.transportesTemplate = newDefaultTransportes;
        }
        if (isRenderedDefault(currentAlojamientoRendered, m.alojamientoTemplate || '', 'conditions.defaultAccommodation')) {
          updated.alojamientoTemplate = newDefaultAlojamiento;
        }
        if (isRenderedDefault(currentPreproRendered, m.preproTemplate || '', 'conditions.defaultPreProduction')) {
          updated.preproTemplate = newDefaultPrepro;
        }
        if (isRenderedDefault(currentConvenioRendered, m.convenioTemplate || '', 'conditions.defaultAgreement')) {
          updated.convenioTemplate = newDefaultConvenio;
        }
        
        return updated;
      });
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, setModel, getDefaultLegend, getDefaultHorarios, getDefaultDietas, getDefaultTransportes, getDefaultAlojamiento, getDefaultPrepro, getDefaultConvenio]);
}

