// condiciones/publicidad.tsx
import { Th, Td } from '@shared/components';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useCallback, useEffect, useMemo, useState, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@i18n';

import { renderWithParams, visibleToTemplate, loadJSON, TextAreaAuto, InfoCard, ParamInput, restoreStrongTags } from './shared';
import { storage } from '@shared/services/localStorage.service';
import { DEFAULT_FESTIVOS_TEXT, generateDynamicFestivosText } from '@shared/constants/festivos';
import { exportCondicionesToPDF } from '../utils/exportPDF';

interface DeleteRoleConfirmModalProps {
  roleName: string;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteRoleConfirmModal({ roleName, onClose, onConfirm }: DeleteRoleConfirmModalProps) {
  const { t } = useTranslation();
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

    const observer = new MutationObserver(updateTheme);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const isLight = theme === 'light';

  return (
    <div className='fixed inset-0 bg-black/60 grid place-items-center p-4 z-50'>
      <div 
        className='w-full max-w-md rounded-2xl border border-neutral-border p-6'
        style={{
          backgroundColor: isLight ? '#ffffff' : 'var(--panel)'
        }}
      >
        <h3 className='text-lg font-semibold mb-4' style={{color: isLight ? '#0476D9' : '#F27405'}}>
          {t('conditions.confirmDeleteRole')}
        </h3>
        
        <p 
          className='text-sm mb-6' 
          style={{color: isLight ? '#111827' : '#d1d5db'}}
          dangerouslySetInnerHTML={{
            __html: t('conditions.confirmDeleteRoleMessage', { roleName })
          }}
        />

        <div className='flex justify-center gap-3'>
          <button
            onClick={onClose}
            className='px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]'
            style={{
              borderColor: 'var(--border)',
              backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)',
              color: isLight ? '#111827' : '#d1d5db'
            }}
            type='button'
          >
            {t('common.no')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className='px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]'
            style={{
              borderColor: isLight ? '#F27405' : '#F27405',
              color: isLight ? '#F27405' : '#F27405',
              backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)'
            }}
            type='button'
          >
            {t('common.yes')}
          </button>
        </div>
      </div>
    </div>
  );
}

type AnyRecord = Record<string, any>;

const getDefaultLegendPubli = () => i18n.t('conditions.defaultLegendAdvertising');

// Variable global para festivos dinámicos
let globalDynamicFestivosText = DEFAULT_FESTIVOS_TEXT;

// Función para actualizar festivos dinámicos
const updateDynamicFestivos = async () => {
  try {
    globalDynamicFestivosText = await generateDynamicFestivosText();
  } catch {
    globalDynamicFestivosText = DEFAULT_FESTIVOS_TEXT;
  }
};
const getDefaultHorarios = () => i18n.t('conditions.defaultSchedulesAdvertising');
const getDefaultDietas = () => i18n.t('conditions.defaultPerDiemsAdvertising');
const getDefaultTransportes = () => i18n.t('conditions.defaultTransportation');
const getDefaultAlojamiento = () => i18n.t('conditions.defaultAccommodation');
const getDefaultConvenio = () => i18n.t('conditions.defaultAgreement');

const PRICE_HEADERS_PUBLI = [
  'Precio jornada',
  'Precio Día extra/Festivo',
  'Localización técnica',
  'Carga/descarga',
  'Travel day',
  'Horas extras',
];

const PRICE_ROLES_PUBLI = [
  'Gaffer',
  'Best boy',
  'Eléctrico',
  'Auxiliar',
  'Técnico de mesa',
  'Finger boy',
];

function CondicionesPublicidad({
  project,
  onChange = () => {},
  onRegisterExport,
  readOnly = false,
}: { 
  project: AnyRecord | null | undefined; 
  onChange?: (p: AnyRecord) => void;
  onRegisterExport?: (fn: () => void) => void;
  readOnly?: boolean;
}) {
  const { t, i18n } = useTranslation();
  
  // Función helper para traducir headers de precios
  const translateHeader = (header: string): string => {
    const headerMap: Record<string, string> = {
      'Precio jornada': t('conditions.priceWorkDay'),
      'Precio Día extra/Festivo': t('conditions.priceExtraDayHoliday'),
      'Travel day': t('conditions.travelDay'),
      'Localización técnica': t('conditions.technicalLocation'),
      'Carga/descarga': t('conditions.loadingUnloading'),
      'Horas extras': t('conditions.extraHours'),
    };
    return headerMap[header] || header;
  };

  // Función helper para traducir nombres de roles
  const translateRoleName = (roleName: string): string => {
    // Mapeo de nombres de roles en español a códigos
    const roleNameToCode: Record<string, string> = {
      'Gaffer': 'G',
      'Best boy': 'BB',
      'Eléctrico': 'E',
      'Auxiliar': 'AUX',
      'Meritorio': 'M',
      'Técnico de mesa': 'TM',
      'Finger boy': 'FB',
      'Refuerzo': 'REF',
    };
    
    const roleCode = roleNameToCode[roleName];
    if (roleCode) {
      const translationKey = `team.roles.${roleCode}`;
      const translated = t(translationKey);
      // Si la traducción existe (no es la clave misma), devolverla; si no, devolver el nombre original
      return translated !== translationKey ? translated : roleName;
    }
    return roleName;
  };
  
  const storageKey = useMemo(() => {
    const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'tmp';
    return `cond_${base}_publicidad`;
  }, [project?.id, project?.nombre]);

  // Cargar festivos dinámicos al montar el componente
  useEffect(() => {
    updateDynamicFestivos();
  }, []);

  const [showParams, setShowParams] = useState(false);
  const paramsRef = useRef<HTMLDivElement | null>(null);
  const [model, setModel] = useLocalStorage<AnyRecord>(storageKey, () =>
    loadOrSeedPublicidad(storageKey)
  );

  // Actualizar textos por defecto cuando cambia el idioma
  useEffect(() => {
    const handleLanguageChange = async () => {
      // Actualizar festivos dinámicos con el nuevo idioma
      await updateDynamicFestivos();
      
      setModel((m: AnyRecord) => {
        if (!m) return m;
        const updated = { ...m };
        
        // Obtener los textos por defecto actuales en el nuevo idioma
        const newDefaultLegend = getDefaultLegendPubli();
        const newDefaultHorarios = getDefaultHorarios();
        const newDefaultDietas = getDefaultDietas();
        const newDefaultTransportes = getDefaultTransportes();
        const newDefaultAlojamiento = getDefaultAlojamiento();
        const newDefaultConvenio = getDefaultConvenio();
        
        // Actualizar solo si están vacíos o si contienen variables (textos por defecto)
        const isEmptyOrDefault = (template: any) => {
          const str = String(template || '');
          if (!str || str.trim() === '') return true;
          // Si el template contiene las variables típicas de los textos por defecto, probablemente es un texto por defecto
          return str.includes('{{') && str.includes('}}');
        };
        
        if (isEmptyOrDefault(m.legendTemplate)) {
          updated.legendTemplate = newDefaultLegend;
        }
        // Actualizar festivos con el nuevo texto traducido
        if (isEmptyOrDefault(m.festivosTemplate)) {
          updated.festivosTemplate = globalDynamicFestivosText;
        }
        if (isEmptyOrDefault(m.horariosTemplate)) {
          updated.horariosTemplate = newDefaultHorarios;
        }
        if (isEmptyOrDefault(m.dietasTemplate)) {
          updated.dietasTemplate = newDefaultDietas;
        }
        if (isEmptyOrDefault(m.transportesTemplate)) {
          updated.transportesTemplate = newDefaultTransportes;
        }
        if (isEmptyOrDefault(m.alojamientoTemplate)) {
          updated.alojamientoTemplate = newDefaultAlojamiento;
        }
        if (isEmptyOrDefault(m.convenioTemplate)) {
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
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  // Persistir inmediatamente el modelo inicial si no existe en localStorage,
  // para que Nómina lo reconozca sin necesidad de editar campos.
  const wroteInitialRef = useRef(false);
  useEffect(() => {
    if (wroteInitialRef.current) return;
    try {
      const existing = storage.getJSON<any>(storageKey);
      if (!existing) {
        storage.setJSON(storageKey, model);
      }
    } catch {}
    wroteInitialRef.current = true;
  }, [storageKey, model]);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const lastEmittedRef = useRef('');

  useEffect(() => {
    const payload = { publicidad: model };
    const signature = JSON.stringify(payload);
    if (signature !== lastEmittedRef.current) {
      lastEmittedRef.current = signature;
      onChangeRef.current?.(payload);
    }
  }, [model]);

  const setPrice = (role: string, header: string, value: string) =>
    setModel((m: AnyRecord) => {
      const next: AnyRecord = { ...m, prices: { ...(m.prices || {}) } };
      next.prices[role] = { ...(next.prices[role] || {}), [header]: value };
      return next;
    });

  const setText = (key: string, value: string) => setModel((m: AnyRecord) => ({ ...m, [key]: value }));

  const setParam = (key: string, value: string) =>
    setModel((m: AnyRecord) => ({
      ...m,
      params: { ...(m.params || {}), [key]: value },
    }));
  
  // Funciones para gestionar roles
  const addRole = (newRole: string) => {
    if (!newRole) return;
    
    setModel((m: AnyRecord) => {
      const currentRoles = m.roles || PRICE_ROLES_PUBLI;
      if (currentRoles.includes(newRole)) return m;
      
      // Mantener el orden de PRICE_ROLES_PUBLI
      const nextRoles: string[] = [];
      const currentSet = new Set(currentRoles);
      
      for (const role of PRICE_ROLES_PUBLI) {
        if (role === newRole) {
          nextRoles.push(newRole);
        } else if (currentSet.has(role)) {
          nextRoles.push(role);
        }
      }
      
      if (!PRICE_ROLES_PUBLI.includes(newRole)) {
        nextRoles.push(newRole);
      }
      // Autocompletar precios preestablecidos para el rol añadido si no existen
      const nextPrices = { ...(m.prices || {}) };
      if (!nextPrices[newRole]) {
        // Cargar la semilla por defecto para obtener los precios iniciales
        const seed = loadOrSeedPublicidad('__seed__');
        if (seed?.prices?.[newRole]) {
          nextPrices[newRole] = { ...seed.prices[newRole] };
        }
      }

      return { ...m, roles: nextRoles, prices: nextPrices };
    });
    setShowRoleSelect(false);
  };
  
  const removeRole = (role: string) => {
    setModel((m: AnyRecord) => {
      const roles = m.roles || PRICE_ROLES_PUBLI;
      const nextRoles = roles.filter((r: string) => r !== role);
      const nextPrices = { ...m.prices };
      delete nextPrices[role];
      return { ...m, roles: nextRoles, prices: nextPrices };
    });
  };
  
  const roles = model.roles || PRICE_ROLES_PUBLI;

  const parseNum = (x: unknown): number => {
    if (x == null) return NaN;
    let s = String(x)
      .trim()
      .replace(/[^\d.,-]/g, '');
    if (!s) return NaN;
    const hasComma = s.includes(',');
    const hasDot = s.includes('.');
    if (hasComma && hasDot) {
      const lastComma = s.lastIndexOf(',');
      const lastDot = s.lastIndexOf('.');
      const decSep = lastComma > lastDot ? ',' : '.';
      const thouSep = decSep === ',' ? '.' : ',';
      s = s.replace(new RegExp(`\\${thouSep}`, 'g'), '');
      if (decSep === ',') s = s.replace(/,/g, '.');
    } else if (hasComma && !hasDot) {
      s = s.replace(/,/g, '.');
    }
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
  };

  const fmt = (n: number): string => {
    if (!Number.isFinite(n)) return '';
    if (Math.abs(n % 1) < 1e-9) return String(Math.round(n));
    return n.toFixed(2).replace(/\.?0+$/, '');
  };

  const computeFromDaily = (dailyStr: string, params: AnyRecord) => {
    const d = parseNum(dailyStr);
    if (!Number.isFinite(d) || d === 0) {
      return {
        'Precio Día extra/Festivo': '',
        'Travel day': '',
        'Horas extras': '',
      } as AnyRecord;
    }
    const factorFestivo = parseNum(params?.factorFestivo) || 0;
    const jTrab = parseNum(params?.jornadaTrabajo) || 0;
    const jCom = parseNum(params?.jornadaComida) || 0;
    const facHora = parseNum(params?.factorHoraExtra) || 0;

    const festivo = factorFestivo > 0 ? d * factorFestivo : NaN;
    const travel = d; // Travel day es igual al precio jornada
    const horasTotales = jTrab + jCom;
    const extra =
      horasTotales > 0 && facHora > 0 ? (d / horasTotales) * facHora : NaN;
    const cargaDescarga = extra * 3; // Equivalente a 3 horas extras

    return {
      'Precio Día extra/Festivo': fmt(festivo),
      'Travel day': fmt(travel),
      'Horas extras': fmt(extra),
      'Carga/descarga': fmt(cargaDescarga),
    } as AnyRecord;
  };

  const handlePriceChange = (role: string, header: string, value: string) => {
    if (header === 'Precio jornada') {
      setModel((m: AnyRecord) => {
        const next: AnyRecord = { ...m, prices: { ...(m.prices || {}) } };
        const row: AnyRecord = { ...(next.prices[role] || {}) };
        row['Precio jornada'] = value;

        if (value == null || String(value).trim() === '') {
          row['Precio Día extra/Festivo'] = '';
          row['Travel day'] = '';
        } else {
          const derived = computeFromDaily(value, m.params);
          row['Precio Día extra/Festivo'] = derived['Precio Día extra/Festivo'];
          row['Travel day'] = derived['Travel day'];
        }
        next.prices[role] = row;
        return next;
      });
    } else {
      setPrice(role, header, value);
    }
  };

  const p: AnyRecord = model.params || {};

  // Registrar función de exportación PDF
  const exportFunction = useCallback(async () => {
    try {
      await exportCondicionesToPDF(
        project,
        'publicidad',
        model,
        PRICE_HEADERS_PUBLI,
        roles
      );
    } catch (error) {
      console.error('Error exporting condiciones publicidad PDF:', error);
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
      <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90 p-4'>
        <div className='flex items-center gap-2 mb-3'>
          <button
            onClick={() => setShowParams(v => !v)}
            className='w-6 h-6 rounded-lg border border-neutral-border flex items-center justify-center text-sm hover:border-accent'
            title={showParams ? t('conditions.collapse') : t('conditions.expand')}
            aria-label={t('conditions.calculationParameters')}
            aria-expanded={showParams}
            aria-controls='publicidad-params'
            type='button'
          >
            {showParams ? '−' : '+'}
          </button>
          <h4 className='text-brand font-semibold m-0'>
            {t('conditions.calculationParameters')}
          </h4>
        </div>

        <div className='text-xs text-zinc-400 mb-3' dangerouslySetInnerHTML={{ __html: t('conditions.amountsCalculatedFrom') }} />

        {showParams && (
          <div
            id='publicidad-params'
            ref={paramsRef}
            tabIndex={-1}
            role='region'
            aria-label={t('conditions.parametersAdvertising')}
            className='grid grid-cols-1 sm:grid-cols-3 gap-3'
          >
            <ParamInput
              label={t('conditions.workDay')}
              suffix='h'
              duo={[
                {
                  value: p.jornadaTrabajo ?? '10',
                  onChange: (v: string) => setParam('jornadaTrabajo', v),
                },
                {
                  value: p.jornadaComida ?? '1',
                  onChange: (v: string) => setParam('jornadaComida', v),
                },
              ]}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.extraDayHoliday')}
              value={p.factorFestivo ?? '1.75'}
              onChange={(v: string) => setParam('factorFestivo', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.extraHourHolidayNight')}
              value={p.factorHoraExtraFestiva ?? '1.5'}
              onChange={(v: string) => setParam('factorHoraExtraFestiva', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.courtesyMinutes')}
              value={p.cortesiaMin ?? '15'}
              onChange={(v: string) => setParam('cortesiaMin', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.turnAroundDaily')}
              value={p.taDiario ?? '10'}
              onChange={(v: string) => setParam('taDiario', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.turnAroundWeekend')}
              value={p.taFinde ?? '48'}
              onChange={(v: string) => setParam('taFinde', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.nightShiftComplement')}
              value={p.nocturnidadComplemento ?? '50'}
              onChange={(v: string) => setParam('nocturnidadComplemento', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.nightShift')}
              duo={[
                {
                  value: p.nocturnoIni ?? '02:00',
                  onChange: (v: string) => setParam('nocturnoIni', v),
                },
                {
                  value: p.nocturnoFin ?? '06:00',
                  onChange: (v: string) => setParam('nocturnoFin', v),
                },
              ]}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.breakfast')}
              value={p.dietaDesayuno ?? '10'}
              onChange={(v: string) => setParam('dietaDesayuno', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.lunch')}
              readOnly={readOnly}
              value={p.dietaComida ?? '20'}
              onChange={(v: string) => setParam('dietaComida', v)}
            />
            <ParamInput
              label={t('conditions.dinner')}
              value={p.dietaCena ?? '30'}
              onChange={(v: string) => setParam('dietaCena', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.perDiemNoOvernight')}
              value={p.dietaSinPernocta ?? '50'}
              onChange={(v: string) => setParam('dietaSinPernocta', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.accommodationBreakfast')}
              value={p.dietaAlojDes ?? '70'}
              onChange={(v: string) => setParam('dietaAlojDes', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.pocketExpenses')}
              value={p.gastosBolsillo ?? '10'}
              onChange={(v: string) => setParam('gastosBolsillo', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.kilometers')}
              value={p.kilometrajeKm ?? '0.40'}
              onChange={(v: string) => setParam('kilometrajeKm', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.transportPerDay')}
              value={p.transporteDia ?? '12'}
              onChange={(v: string) => setParam('transporteDia', v)}
              readOnly={readOnly}
            />
          </div>
        )}
      </section>

      <div className='text-xs text-zinc-400 mb-4 flex items-center justify-between'>
        <span dangerouslySetInnerHTML={{ __html: t('conditions.pricesBaseDescription') }} />
        <div className='relative'>
          {PRICE_ROLES_PUBLI.filter(r => !roles.includes(r)).length === 0 ? (
            <button
              disabled
              className='px-3 py-1 text-sm bg-gray-500 text-white rounded-lg cursor-not-allowed'
            >
              {t('conditions.allRoles')}
            </button>
          ) : (
            <>
              <button
                onClick={() => !readOnly && setShowRoleSelect(!showRoleSelect)}
                disabled={readOnly}
                className={`px-3 py-1 text-sm bg-brand text-white rounded-lg hover:bg-brand/80 btn-add-role ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={readOnly ? t('conditions.projectClosed') : t('conditions.addRole')}
              >
                {t('conditions.addRole')}
              </button>
              {showRoleSelect && (
                <div 
                  className='absolute right-0 top-full mt-1 bg-blue-200 border border-blue-300 dark:bg-amber-800 dark:border-amber-600 rounded-lg shadow-lg z-10 min-w-[150px] max-h-60 overflow-y-auto'
                  tabIndex={-1}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setTimeout(() => setShowRoleSelect(false), 200);
                    }
                  }}
                >
                  {PRICE_ROLES_PUBLI.filter(r => !roles.includes(r)).map((role: string) => (
                    <button
                      key={role}
                      onClick={() => addRole(role)}
                      className='w-full text-left px-3 py-2 text-sm text-white hover:bg-blue-300 dark:hover:bg-amber-600/40 transition-colors'
                    >
                      {translateRoleName(role)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90 overflow-x-auto'>
        <table className='min-w-[920px] w-full border-collapse text-sm'>
          <thead>
            <tr>
              <Th align='left'>{t('conditions.rolePrice')}</Th>
              {PRICE_HEADERS_PUBLI.map(col => (
                <Th key={col} align='center'>{translateHeader(col)}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role: string) => (
              <tr key={role} className='relative'>
                <Td className='font-semibold whitespace-nowrap' align='middle'>
                  <div className='flex items-center gap-1'>
                    <button
                      onClick={() => {
                        if (readOnly) return;
                        setRoleToDelete(role);
                      }}
                      disabled={readOnly}
                      className={`text-gray-400 hover:text-blue-500 hover:bg-blue-100 dark:hover:text-amber-500 dark:hover:bg-amber-900/20 font-bold text-sm w-6 h-6 flex items-center justify-center rounded transition-all hover:scale-110 ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={readOnly ? t('conditions.projectClosed') : t('conditions.deleteRole')}
                    >
                      ✕
                    </button>
                    <span>{translateRoleName(role)}</span>
                  </div>
                </Td>
                {PRICE_HEADERS_PUBLI.map(h => (
                  <Td key={h} align='center'>
                    <input
                      type='number'
                      value={model.prices?.[role]?.[h] ?? ''}
                      onChange={e => !readOnly && handlePriceChange(role, h, e.target.value)}
                      placeholder='€'
                      step='0.01'
                      disabled={readOnly}
                      readOnly={readOnly}
                      className={`w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-center ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90 p-4'>
        <h4 className='text-brand font-semibold mb-2'>{t('conditions.calculationLegend')}</h4>
        <TextAreaAuto
          value={restoreStrongTags(renderWithParams(model.legendTemplate, model.params))}
          onChange={v =>
            setText('legendTemplate', visibleToTemplate(v, model.params))
          }
          className='min-h-[160px]'
        />
      </section>

      <InfoCard
        title={t('conditions.holidays')}
        value={renderWithParams(model.festivosTemplate, model.params)}
        onChange={v =>
          setText('festivosTemplate', visibleToTemplate(v, model.params))
        }
        readOnly={readOnly}
      />
      <InfoCard
        title={t('conditions.schedules')}
        value={restoreStrongTags(renderWithParams(model.horariosTemplate, model.params))}
        onChange={v =>
          setText('horariosTemplate', visibleToTemplate(v, model.params))
        }
        readOnly={readOnly}
      />
      <InfoCard
        title={t('conditions.perDiems')}
        value={restoreStrongTags(renderWithParams(model.dietasTemplate, model.params))}
        onChange={v =>
          setText('dietasTemplate', visibleToTemplate(v, model.params))
        }
        readOnly={readOnly}
      />
      <InfoCard
        title={t('conditions.transportation')}
        value={renderWithParams(model.transportesTemplate, model.params)}
        onChange={v =>
          setText('transportesTemplate', visibleToTemplate(v, model.params))
        }
        readOnly={readOnly}
      />
      <InfoCard
        title={t('conditions.accommodation')}
        value={renderWithParams(model.alojamientoTemplate, model.params)}
        onChange={v =>
          setText('alojamientoTemplate', visibleToTemplate(v, model.params))
        }
        readOnly={readOnly}
      />
      <InfoCard
        title={t('conditions.agreement')}
        value={renderWithParams(model.convenioTemplate, model.params)}
        onChange={v =>
          setText('convenioTemplate', visibleToTemplate(v, model.params))
        }
        readOnly={readOnly}
        rightAddon={
          readOnly ? (
            <span className='text-brand text-sm opacity-50 cursor-not-allowed' title='El proyecto está cerrado'>
              BOE
            </span>
          ) : (
          <a
            href='https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-6846'
            target='_blank'
            rel='noreferrer'
            className='text-brand hover:underline text-sm'
              title={t('conditions.openBOE')}
          >
            BOE
          </a>
          )
        }
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

export default memo(CondicionesPublicidad);

function loadOrSeedPublicidad(storageKey: string): AnyRecord {
  const fallback: AnyRecord = {
    roles: ['Gaffer', 'Eléctrico'],
    prices: {
      'Gaffer': {
        'Precio jornada': '510',
        'Precio Día extra/Festivo': '892.5',
        'Travel day': '510',
        'Horas extras': '75',
        'Carga/descarga': '225',
        'Localización técnica': '420',
      },
      'Best boy': {
        'Precio jornada': '410',
        'Precio Día extra/Festivo': '717.5',
        'Travel day': '410',
        'Horas extras': '60',
        'Carga/descarga': '180',
        'Localización técnica': '320',
      },
      'Eléctrico': {
        'Precio jornada': '310',
        'Precio Día extra/Festivo': '542.5',
        'Travel day': '310',
        'Horas extras': '45',
        'Carga/descarga': '135',
      },
      'Auxiliar': {
        'Precio jornada': '250',
        'Precio Día extra/Festivo': '437.5',
        'Travel day': '250',
        'Horas extras': '35',
        'Carga/descarga': '105',
      },
      'Técnico de mesa': {
        'Precio jornada': '350',
        'Precio Día extra/Festivo': '612.5',
        'Travel day': '350',
        'Horas extras': '50',
        'Carga/descarga': '150',
      },
      'Finger boy': {
        'Precio jornada': '350',
        'Precio Día extra/Festivo': '612.5',
        'Travel day': '350',
        'Horas extras': '50',
        'Carga/descarga': '150',
      },
    },
    legendTemplate: getDefaultLegendPubli(),
    festivosTemplate: globalDynamicFestivosText,
    horariosTemplate: getDefaultHorarios(),
    dietasTemplate: getDefaultDietas(),
    transportesTemplate: getDefaultTransportes(),
    alojamientoTemplate: getDefaultAlojamiento(),
    convenioTemplate: getDefaultConvenio(),
    params: {
      jornadaTrabajo: '10',
      jornadaComida: '1',
      factorFestivo: '1.75',
      factorHoraExtraFestiva: '1.5',
      cortesiaMin: '15',
      taDiario: '10',
      taFinde: '12',
      nocturnidadComplemento: '50',
      nocturnoIni: '02:00',
      nocturnoFin: '06:00',
      dietaDesayuno: '10',
      dietaComida: '20',
      dietaCena: '30',
      dietaSinPernocta: '50',
      dietaAlojDes: '60',
      gastosBolsillo: '10',
      kilometrajeKm: '0.40',
      transporteDia: '15',
    },
  };

  try {
    // Si no existe clave aún, persistimos el fallback para que sea "real" desde el inicio
    try {
      const exists = storage.getString(storageKey);
      if (exists == null) {
        storage.setJSON(storageKey, fallback);
      }
    } catch {}

    const parsed: AnyRecord = loadJSON(storageKey, fallback);

    // Función helper para normalizar valores numéricos (convertir comas a puntos)
    const normalizeNumeric = (val: any): string => {
      if (val == null) return '';
      const str = String(val);
      // Si contiene coma y no es una hora (no contiene :), convertir coma a punto
      if (str.includes(',') && !str.includes(':')) {
        return str.replace(',', '.');
      }
      return str;
    };

    if (parsed) {
    if (parsed.legend && !parsed.legendTemplate) {
      parsed.legendTemplate = parsed.legend;
      delete parsed.legend;
    }
    if (parsed.festivos && !parsed.festivosTemplate) {
      parsed.festivosTemplate = parsed.festivos;
      delete parsed.festivos;
    }
    if (parsed.horarios && !parsed.horariosTemplate) {
      parsed.horariosTemplate = parsed.horarios;
      delete parsed.horarios;
    }
    if (parsed.dietas && !parsed.dietasTemplate) {
      parsed.dietasTemplate = parsed.dietas;
      delete parsed.dietas;
    }
    if (parsed.transportes && !parsed.transportesTemplate) {
      parsed.transportesTemplate = parsed.transportes;
      delete parsed.transportes;
    }
    if (parsed.alojamiento && !parsed.alojamientoTemplate) {
      parsed.alojamientoTemplate = parsed.alojamiento;
      delete parsed.alojamiento;
    }
    
    if (parsed.convenio && !parsed.convenioTemplate) {
      parsed.convenioTemplate = parsed.convenio;
      delete parsed.convenio;
    }

    parsed.params = {
      jornadaTrabajo: normalizeNumeric(parsed.params?.jornadaTrabajo) || '10',
      jornadaComida: normalizeNumeric(parsed.params?.jornadaComida) || '1',
      factorFestivo: normalizeNumeric(parsed.params?.factorFestivo) || '1.75',
      factorHoraExtraFestiva: normalizeNumeric(parsed.params?.factorHoraExtraFestiva) || '1.5',
      cortesiaMin: normalizeNumeric(parsed.params?.cortesiaMin) || '15',
      taDiario: normalizeNumeric(parsed.params?.taDiario) || '10',
      taFinde: normalizeNumeric(parsed.params?.taFinde) || '48',
      nocturnidadComplemento: normalizeNumeric(parsed.params?.nocturnidadComplemento) || '50',
      nocturnoIni: parsed.params?.nocturnoIni ?? '02:00',
      nocturnoFin: parsed.params?.nocturnoFin ?? '06:00',
      dietaDesayuno: normalizeNumeric(parsed.params?.dietaDesayuno) || '10',
      dietaComida: normalizeNumeric(parsed.params?.dietaComida) || '20',
      dietaCena: normalizeNumeric(parsed.params?.dietaCena) || '30',
      dietaSinPernocta: normalizeNumeric(parsed.params?.dietaSinPernocta) || '50',
      dietaAlojDes: normalizeNumeric(parsed.params?.dietaAlojDes) || '60',
      gastosBolsillo: normalizeNumeric(parsed.params?.gastosBolsillo) || '10',
      kilometrajeKm: normalizeNumeric(parsed.params?.kilometrajeKm) || '0.40',
      transporteDia: normalizeNumeric(parsed.params?.transporteDia) || '15',
    };

    parsed.legendTemplate = parsed.legendTemplate ?? getDefaultLegendPubli();
    parsed.festivosTemplate = parsed.festivosTemplate ?? globalDynamicFestivosText;
    parsed.horariosTemplate = parsed.horariosTemplate ?? getDefaultHorarios();
    parsed.dietasTemplate = parsed.dietasTemplate ?? getDefaultDietas();
    parsed.transportesTemplate = parsed.transportesTemplate ?? getDefaultTransportes();
    parsed.alojamientoTemplate = parsed.alojamientoTemplate ?? getDefaultAlojamiento();
    parsed.convenioTemplate = parsed.convenioTemplate ?? getDefaultConvenio();

    return parsed;
    }

    return fallback;
  } catch (error) {
    console.error('Error loading publicidad conditions:', error);
    return fallback;
  }
}


