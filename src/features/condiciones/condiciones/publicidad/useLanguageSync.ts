import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { renderWithParams } from '../shared';
import { normalizeText, getDefaultsPublicidad } from '../../utils/translationHelpers';
import { globalDynamicFestivosText, updateDynamicFestivos } from './publicidadData';
import { AnyRecord } from '@shared/types/common';

interface UseLanguageSyncProps {
  model: AnyRecord;
  setModel: (updater: (m: AnyRecord) => AnyRecord) => void;
}

/**
 * Hook to sync model templates when language changes
 */
export function useLanguageSync({ model, setModel }: UseLanguageSyncProps) {
  const { i18n } = useTranslation();

  // Load dynamic holidays on mount
  useEffect(() => {
    updateDynamicFestivos();
  }, []);

  // Update templates when language changes
  useEffect(() => {
    const handleLanguageChange = async () => {
      // Update dynamic holidays with new language
      await updateDynamicFestivos();
      
      setModel((m: AnyRecord) => {
        if (!m) return m;
        const updated = { ...m };
        
        // Get current default texts in the new language
        const getDefaultLegendPubli = () => getDefaultsPublicidad().legend;
        const getDefaultHorarios = () => getDefaultsPublicidad().horarios;
        const getDefaultDietas = () => getDefaultsPublicidad().dietas;
        const getDefaultTransportes = () => getDefaultsPublicidad().transportes;
        const getDefaultAlojamiento = () => getDefaultsPublicidad().alojamiento;
        const getDefaultConvenio = () => getDefaultsPublicidad().convenio;
        
        const newDefaultLegend = getDefaultLegendPubli();
        const newDefaultHorarios = getDefaultHorarios();
        const newDefaultDietas = getDefaultDietas();
        const newDefaultTransportes = getDefaultTransportes();
        const newDefaultAlojamiento = getDefaultAlojamiento();
        const newDefaultConvenio = getDefaultConvenio();
        
        // Render current template and defaults with same parameters for comparison
        const params = m.params || {};
        const currentLegendRendered = renderWithParams(m.legendTemplate || '', params);
        const currentHorariosRendered = renderWithParams(m.horariosTemplate || '', params);
        const currentDietasRendered = renderWithParams(m.dietasTemplate || '', params);
        const currentTransportesRendered = renderWithParams(m.transportesTemplate || '', params);
        const currentAlojamientoRendered = renderWithParams(m.alojamientoTemplate || '', params);
        const currentConvenioRendered = renderWithParams(m.convenioTemplate || '', params);
        
        // Compare rendered text with defaults rendered from all languages
        // Also compare original template (with variables) for better accuracy
        const languages = ['es', 'en', 'ca'];
        const isRenderedDefault = (currentRendered: string, currentTemplate: string, key: string): boolean => {
          if (!currentRendered || currentRendered.trim() === '') return true;
          if (!currentTemplate || currentTemplate.trim() === '') return true;
          
          // First check if template contains typical default variables
          const hasDefaultVariables = currentTemplate.includes('{{') && currentTemplate.includes('}}');
          
          // Normalize texts for comparison
          const normalizedCurrent = normalizeText(currentRendered);
          
          // Compare with defaults from all languages
          const matchesAnyDefault = languages.some(lang => {
            try {
              const defaultText = i18n.t(key, { lng: lang });
              const defaultRendered = renderWithParams(defaultText, params);
              const normalizedDefault = normalizeText(defaultRendered);
              
              // Exact normalized comparison
              if (normalizedCurrent === normalizedDefault) return true;
              
              // Also compare original template if it has variables
              if (hasDefaultVariables) {
                const normalizedTemplate = normalizeText(currentTemplate);
                const normalizedDefaultTemplate = normalizeText(defaultText);
                // Compare without considering variable values, only structure
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
        
        // Update if they match any rendered default
        if (isRenderedDefault(currentLegendRendered, m.legendTemplate || '', 'conditions.defaultLegendAdvertising')) {
          updated.legendTemplate = newDefaultLegend;
        }
        // Update holidays with new translated text
        if (!m.festivosTemplate || m.festivosTemplate.trim() === '' || m.festivosTemplate.includes('{{')) {
          updated.festivosTemplate = globalDynamicFestivosText;
        }
        if (isRenderedDefault(currentHorariosRendered, m.horariosTemplate || '', 'conditions.defaultSchedulesAdvertising')) {
          updated.horariosTemplate = newDefaultHorarios;
        }
        if (isRenderedDefault(currentDietasRendered, m.dietasTemplate || '', 'conditions.defaultPerDiemsAdvertising')) {
          updated.dietasTemplate = newDefaultDietas;
        }
        if (isRenderedDefault(currentTransportesRendered, m.transportesTemplate || '', 'conditions.defaultTransportation')) {
          updated.transportesTemplate = newDefaultTransportes;
        }
        if (isRenderedDefault(currentAlojamientoRendered, m.alojamientoTemplate || '', 'conditions.defaultAccommodation')) {
          updated.alojamientoTemplate = newDefaultAlojamiento;
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
  }, [i18n, setModel]);
}

