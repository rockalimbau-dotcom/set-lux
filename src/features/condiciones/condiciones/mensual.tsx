import { Th, Td } from '@shared/components';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useEffect, useMemo, useState, useRef, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/config';

import { PRICE_HEADERS, PRICE_ROLES } from './shared.constants';
import { renderWithParams, visibleToTemplate } from './shared';
import { exportCondicionesToPDF } from '../utils/exportPDF';
import { AnyRecord } from '@shared/types/common';
import { normalizeText, getDefaultsMensual } from '../utils/translationHelpers';
import { computeFromMonthly } from './mensual/mensualUtils';
import { loadOrSeed, updateDynamicFestivos, globalDynamicFestivosText } from './mensual/mensualData';
import { DeleteRoleConfirmModal } from './publicidad/DeleteRoleConfirmModal';
import { ParametersSection } from './mensual/ParametersSection';
import { PricesTable } from './mensual/PricesTable';
import { InfoSections } from './mensual/InfoSections';
import { useMensualTranslations } from './mensual/mensualHelpers';

interface CondicionesMensualProps {
  project: AnyRecord | null | undefined;
  onChange?: (payload: AnyRecord) => void;
  onRegisterExport?: (fn: () => void) => void;
  readOnly?: boolean;
}

function CondicionesMensual({ project, onChange = () => {}, onRegisterExport, readOnly = false }: CondicionesMensualProps) {
  const { t, i18n } = useTranslation();
  const { translateHeader, translateRoleName } = useMensualTranslations();
  
  const storageKey = useMemo(() => {
    const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'tmp';
    return `cond_${base}_mensual`;
  }, [project?.id, project?.nombre]);

  // Cargar festivos dinámicos al montar el componente
  useEffect(() => {
    updateDynamicFestivos();
  }, []);

  const [showParams, setShowParams] = useState(false);
  const [model, setModel] = useLocalStorage<AnyRecord>(storageKey, () =>
    loadOrSeed(storageKey)
  );

  // Funciones de conveniencia para mantener compatibilidad con el código existente
  const getDefaultLegend = () => getDefaultsMensual().legend;
  const getDefaultHorarios = () => getDefaultsMensual().horarios;
  const getDefaultDietas = () => getDefaultsMensual().dietas;
  const getDefaultTransportes = () => getDefaultsMensual().transportes;
  const getDefaultAlojamiento = () => getDefaultsMensual().alojamiento;
  const getDefaultPrepro = () => getDefaultsMensual().prepro;
  const getDefaultConvenio = () => getDefaultsMensual().convenio;

  // Actualizar textos por defecto cuando cambia el idioma
  useEffect(() => {
    const handleLanguageChange = async () => {
      // Actualizar festivos dinámicos con el nuevo idioma
      await updateDynamicFestivos();
      
      setModel((m: AnyRecord) => {
        if (!m) return m;
        const updated = { ...m };
        
        // Obtener los textos por defecto actuales en el nuevo idioma
        const newDefaultLegend = getDefaultLegend();
        const newDefaultHorarios = getDefaultHorarios();
        const newDefaultDietas = getDefaultDietas();
        const newDefaultTransportes = getDefaultTransportes();
        const newDefaultAlojamiento = getDefaultAlojamiento();
        const newDefaultPrepro = getDefaultPrepro();
        const newDefaultConvenio = getDefaultConvenio();
        
        // Renderizar el template actual y los defaults con los mismos parámetros para comparar
        const params = m.params || {};
        const currentLegendRendered = renderWithParams(m.legendTemplate || '', params);
        const currentHorariosRendered = renderWithParams(m.horariosTemplate || '', params);
        const currentDietasRendered = renderWithParams(m.dietasTemplate || '', params);
        const currentTransportesRendered = renderWithParams(m.transportesTemplate || '', params);
        const currentAlojamientoRendered = renderWithParams(m.alojamientoTemplate || '', params);
        const currentPreproRendered = renderWithParams(m.preproTemplate || '', params);
        const currentConvenioRendered = renderWithParams(m.convenioTemplate || '', params);
        
        // Comparar el texto renderizado con los defaults renderizados de todos los idiomas
        // También comparar el template original (con variables) para mayor precisión
        const languages = ['es', 'en', 'ca'];
        const isRenderedDefault = (currentRendered: string, currentTemplate: string, key: string): boolean => {
          if (!currentRendered || currentRendered.trim() === '') return true;
          if (!currentTemplate || currentTemplate.trim() === '') return true;
          
          // Primero verificar si el template contiene las variables típicas de los defaults
          const hasDefaultVariables = currentTemplate.includes('{{') && currentTemplate.includes('}}');
          
          // Normalizar textos para comparación
          const normalizedCurrent = normalizeText(currentRendered);
          
          // Comparar con los defaults de todos los idiomas
          const matchesAnyDefault = languages.some(lang => {
            try {
              const defaultText = i18n.t(key, { lng: lang });
              const defaultRendered = renderWithParams(defaultText, params);
              const normalizedDefault = normalizeText(defaultRendered);
              
              // Comparación exacta normalizada
              if (normalizedCurrent === normalizedDefault) return true;
              
              // También comparar el template original si tiene variables
              if (hasDefaultVariables) {
                const normalizedTemplate = normalizeText(currentTemplate);
                const normalizedDefaultTemplate = normalizeText(defaultText);
                // Comparar sin tener en cuenta los valores de las variables, solo la estructura
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
        
        // Actualizar si coinciden con algún default renderizado
        if (isRenderedDefault(currentLegendRendered, m.legendTemplate || '', 'conditions.defaultLegendMonthly')) {
          updated.legendTemplate = newDefaultLegend;
        }
        // Actualizar festivos con el nuevo texto traducido
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
  }, [i18n, setModel]);

  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const lastEmittedRef = useRef('');

  useEffect(() => {
    const payload = { mensual: model };
    const signature = JSON.stringify(payload);
    if (signature !== lastEmittedRef.current) {
      lastEmittedRef.current = signature;
      onChangeRef.current?.(payload);
    }
  }, [model]);

  const setText = (key: string, value: string) => setModel((m: AnyRecord) => ({ ...m, [key]: value }));

  const setParam = (key: string, value: string) =>
    setModel((m: AnyRecord) => ({ ...m, params: { ...(m.params || {}), [key]: value } }));

  // Funciones para gestionar roles
  const addRole = (newRole: string) => {
    if (!newRole) return;
    
    setModel((m: AnyRecord) => {
      const currentRoles = m.roles || PRICE_ROLES;
      if (currentRoles.includes(newRole)) return m;
      
      // Mantener el orden de PRICE_ROLES
      const nextRoles: string[] = [];
      const currentSet = new Set(currentRoles);
      
      for (const role of PRICE_ROLES) {
        if (role === newRole) {
          nextRoles.push(newRole);
        } else if (currentSet.has(role)) {
          nextRoles.push(role);
        }
      }
      
      if (!PRICE_ROLES.includes(newRole)) {
        nextRoles.push(newRole);
      }
      
      return { ...m, roles: nextRoles };
    });
  };
  
  const removeRole = (role: string) => {
    setModel((m: AnyRecord) => {
      const roles = m.roles || PRICE_ROLES;
      const nextRoles = roles.filter((r: string) => r !== role);
      const nextPrices = { ...m.prices };
      delete nextPrices[role];
      return { ...m, roles: nextRoles, prices: nextPrices };
    });
  };
  
  const roles = model.roles || PRICE_ROLES;

  const handleRoleChange = (role: string, header: string, rawVal: string) => {
    const val = rawVal;
    setModel((m: AnyRecord) => {
      const next: AnyRecord = { ...m, prices: { ...(m.prices || {}) } };
      const row: AnyRecord = { ...(next.prices[role] || {}) };
      row[header] = val;

      if (header === 'Precio mensual') {
        const derived = computeFromMonthly(val, m.params);
        row['Precio semanal'] = derived['Precio semanal'];
        row['Precio diario'] = derived['Precio diario'];
        row['Precio jornada'] = derived['Precio jornada'];
        row['Precio Día extra/Festivo'] = derived['Precio Día extra/Festivo'];
        row['Travel day'] = derived['Travel day'];
        row['Horas extras'] = derived['Horas extras'];
      }

      next.prices[role] = row;
      return next;
    });
  };

  // Registrar función de exportación PDF
  const exportFunction = useCallback(async () => {
    try {
      await exportCondicionesToPDF(
        project,
        'mensual',
        model,
        PRICE_HEADERS,
        roles
      );
    } catch (error) {
      console.error('Error exporting condiciones mensual PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
  }, [project, model, roles]);

  useEffect(() => {
    if (onRegisterExport) {
      onRegisterExport(exportFunction);
    }
  }, [onRegisterExport, exportFunction]);

  return (
    <div className='space-y-6'>
      <ParametersSection
        showParams={showParams}
        setShowParams={setShowParams}
        params={model.params || {}}
        setParam={setParam}
        readOnly={readOnly}
      />

      <PricesTable
        model={model}
        roles={roles}
        handleRoleChange={handleRoleChange}
        translateHeader={translateHeader}
        translateRoleName={translateRoleName}
        setRoleToDelete={setRoleToDelete}
        addRole={addRole}
        readOnly={readOnly}
      />

      <InfoSections
        model={model}
        setText={setText}
        readOnly={readOnly}
      />

      {roleToDelete && typeof document !== 'undefined' && createPortal(
        <DeleteRoleConfirmModal
          roleName={roleToDelete}
          onClose={() => setRoleToDelete(null)}
          onConfirm={() => {
            if (roleToDelete) {
              removeRole(roleToDelete);
            }
          }}
        />,
        document.body
      )}
    </div>
  );
}

export default memo(CondicionesMensual);
