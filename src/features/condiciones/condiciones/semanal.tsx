import { useEffect, useMemo, useState, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { Th, Td } from '@shared/components';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';
import i18n from '@i18n';

import { PRICE_HEADERS, PRICE_ROLES } from './shared.constants';
import { extractFestivosDatesForPlan, renderWithParams, visibleToTemplate, loadJSON, TextAreaAuto, InfoCard, ParamInput, restoreStrongTags } from './shared';
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
    <div className='fixed inset-0 bg-black/60 grid place-items-center p-4' style={{ zIndex: 9999 }}>
      <div 
        className='w-full max-w-md rounded-2xl border border-neutral-border p-6'
        style={{
          backgroundColor: isLight ? '#ffffff' : 'var(--panel)'
        }}
      >
        <h3 
          className='text-lg font-semibold mb-4' 
          style={{
            color: isLight ? '#0476D9' : '#F27405'
          }}
        >
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

interface CondicionesSemanalProps {
  project: { id?: string; nombre?: string };
  onChange?: (patch: any) => void;
  onRegisterExport?: (fn: () => void) => void;
  readOnly?: boolean;
}

/** Función para obtener textos por defecto traducidos */
const getDefaultLegend = () => i18n.t('conditions.defaultLegendWeekly');

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

const getDefaultHorarios = () => i18n.t('conditions.defaultSchedules');

const getDefaultDietas = () => i18n.t('conditions.defaultPerDiems');

const getDefaultTransportes = () => i18n.t('conditions.defaultTransportation');

const getDefaultAlojamiento = () => i18n.t('conditions.defaultAccommodation');

const getDefaultPrepro = () => i18n.t('conditions.defaultPreProduction');

const getDefaultConvenio = () => i18n.t('conditions.defaultAgreement');

function CondicionesSemanal({ project, onChange = () => {}, onRegisterExport, readOnly = false }: CondicionesSemanalProps) {
  const { t, i18n } = useTranslation();
  
  // Función helper para traducir headers de precios
  const translateHeader = (header: string): string => {
    const headerMap: Record<string, string> = {
      'Precio mensual': t('conditions.priceMonthly'),
      'Precio semanal': t('conditions.priceWeekly'),
      'Precio diario': t('conditions.priceDaily'),
      'Precio jornada': t('conditions.priceWorkDay'),
      'Precio refuerzo': t('conditions.priceReinforcement'),
      'Precio Día extra/Festivo': t('conditions.priceExtraDayHoliday'),
      'Travel day': t('conditions.travelDay'),
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
    const base = project?.id || project?.nombre || 'tmp';
    return `cond_${base}_semanal`;
  }, [project?.id, project?.nombre]);

  // Cargar festivos dinámicos al montar el componente
  useEffect(() => {
    updateDynamicFestivos();
  }, []);

  const [showParams, setShowParams] = useState(false);
  const paramsRef = useRef<HTMLDivElement | null>(null);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  // Estado por modo (semanal) con persistencia localStorage
  const [model, setModel] = useLocalStorage<any>(storageKey, () =>
    loadOrSeed(storageKey)
  );

  // Actualizar textos por defecto cuando cambia el idioma
  useEffect(() => {
    const handleLanguageChange = async () => {
      // Actualizar festivos dinámicos con el nuevo idioma
      await updateDynamicFestivos();
      
      setModel((m: any) => {
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
        
        // Actualizar solo si están vacíos o si coinciden con algún texto por defecto conocido
        // (esto permite que se actualicen cuando cambia el idioma)
        const isEmptyOrDefault = (template: string, defaultValue: string) => {
          if (!template || template.trim() === '') return true;
          // Si el template contiene las variables típicas de los textos por defecto, probablemente es un texto por defecto
          return template.includes('{{') && template.includes('}}');
        };
        
        if (isEmptyOrDefault(m.legendTemplate, newDefaultLegend)) {
          updated.legendTemplate = newDefaultLegend;
        }
        // Actualizar festivos con el nuevo texto traducido
        if (isEmptyOrDefault(m.festivosTemplate, globalDynamicFestivosText)) {
          updated.festivosTemplate = globalDynamicFestivosText;
        }
        if (isEmptyOrDefault(m.horariosTemplate, newDefaultHorarios)) {
          updated.horariosTemplate = newDefaultHorarios;
        }
        if (isEmptyOrDefault(m.dietasTemplate, newDefaultDietas)) {
          updated.dietasTemplate = newDefaultDietas;
        }
        if (isEmptyOrDefault(m.transportesTemplate, newDefaultTransportes)) {
          updated.transportesTemplate = newDefaultTransportes;
        }
        if (isEmptyOrDefault(m.alojamientoTemplate, newDefaultAlojamiento)) {
          updated.alojamientoTemplate = newDefaultAlojamiento;
        }
        if (isEmptyOrDefault(m.preproTemplate, newDefaultPrepro)) {
          updated.preproTemplate = newDefaultPrepro;
        }
        if (isEmptyOrDefault(m.convenioTemplate, newDefaultConvenio)) {
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

  // Guarda la última versión de onChange para no depender de su identidad
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const lastEmittedRef = useRef('');

  useEffect(() => {
    const festivosRendered = renderWithParams(
      model.festivosTemplate,
      model.params
    );
    const festivosDates = extractFestivosDatesForPlan(festivosRendered);

    const payload = { semanal: { ...model, festivosDates } };
    const signature = JSON.stringify(payload);
    if (signature !== lastEmittedRef.current) {
      lastEmittedRef.current = signature;
      onChangeRef.current?.(payload);
    }
  }, [model]);

  /* ---------- Helpers edición ---------- */
  const setPrice = (role: string, header: string, value: string) =>
    setModel((m: any) => {
      const next = { ...m, prices: { ...(m.prices || {}) } };
      next.prices[role] = { ...(next.prices[role] || {}), [header]: value };
      return next;
    });

  const setText = (key: string, value: string) => setModel((m: any) => ({ ...m, [key]: value }));

  const setParam = (key: string, value: string) =>
    setModel((m: any) => ({
      ...m,
      params: { ...(m.params || {}), [key]: value },
    }));

  // Funciones para gestionar roles
  const addRole = (newRole: string) => {
    if (!newRole) return;
    
    setModel((m: any) => {
      const currentRoles = m.roles || PRICE_ROLES;
      if (currentRoles.includes(newRole)) return m;
      
      // Mantener el orden de PRICE_ROLES
      const nextRoles: string[] = [];
      const currentSet = new Set(currentRoles);
      
      // Recorrer PRICE_ROLES en orden
      for (const role of PRICE_ROLES) {
        if (role === newRole) {
          // Si es el rol que vamos a añadir, añadirlo aquí
          nextRoles.push(newRole);
        } else if (currentSet.has(role)) {
          // Si ya estaba en la lista, añadirlo
          nextRoles.push(role);
        }
      }
      
      // Si el rol no está en PRICE_ROLES, añadirlo al final
      if (!PRICE_ROLES.includes(newRole)) {
        nextRoles.push(newRole);
      }
      
      return { ...m, roles: nextRoles };
    });
    setShowRoleSelect(false);
  };
  
  const removeRole = (role: string) => {
    setModel((m: any) => {
      const roles = m.roles || PRICE_ROLES;
      const nextRoles = roles.filter((r: string) => r !== role);
      const nextPrices = { ...m.prices };
      delete nextPrices[role];
      return { ...m, roles: nextRoles, prices: nextPrices };
    });
  };
  
  // Roles dinámicos del modelo o por defecto
  const roles = model.roles || PRICE_ROLES;

  // ====== CÁLCULOS AUTOMÁTICOS DESDE "PRECIO SEMANAL" ======
  const parseNum = (x: any) => {
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

  const fmt = (n: number) => {
    if (!Number.isFinite(n)) return '';
    if (Math.abs(n % 1) < 1e-9) return String(Math.round(n));
    return n.toFixed(2).replace(/\.?0+$/, '');
  };

  const computeFromWeekly = (weeklyStr: string, params: any) => {
    const w = parseNum(weeklyStr);
    if (!Number.isFinite(w) || w === 0) {
      return {
        'Precio mensual': '',
        'Precio diario': '',
        'Precio jornada': '',
        'Precio Día extra/Festivo': '',
        'Travel day': '',
        'Horas extras': '',
      };
    }
    const semanasMes = parseNum(params?.semanasMes) || 0;
    const diasDiario = parseNum(params?.diasDiario) || 0;
    const diasJornada = parseNum(params?.diasJornada) || 0;
    const factorFestivo = parseNum(params?.factorFestivo) || 0;
    const divTravel = parseNum(params?.divTravel) || 0;
    const horasSemana = parseNum(params?.horasSemana) || 0;
    const factorHora = parseNum(params?.factorHoraExtra) || 0;

    const mensual = semanasMes > 0 ? w * semanasMes : NaN;
    const diario = diasDiario > 0 ? w / diasDiario : NaN;
    const jornada = diasJornada > 0 ? w / diasJornada : NaN;
    const festivo = Number.isFinite(jornada) && factorFestivo > 0 ? jornada * factorFestivo : NaN;
    const travel = Number.isFinite(jornada) && divTravel > 0 ? jornada / divTravel : NaN;
    const extra = horasSemana > 0 && factorHora > 0 ? (w / horasSemana) * factorHora : NaN;

    return {
      'Precio mensual': fmt(mensual),
      'Precio diario': fmt(diario),
      'Precio jornada': fmt(jornada),
      'Precio Día extra/Festivo': fmt(festivo),
      'Travel day': fmt(travel),
      'Horas extras': fmt(extra),
    };
  };

  const handlePriceChange = (role: string, header: string, value: string) => {
    if (header === 'Precio semanal') {
      setModel((m: any) => {
        const next = { ...m, prices: { ...(m.prices || {}) } };
        const row = { ...(next.prices[role] || {}) } as Record<string, string>;
        row['Precio semanal'] = value;
        if (value == null || String(value).trim() === '') {
          row['Precio mensual'] = '';
          row['Precio diario'] = '';
          row['Precio jornada'] = '';
          row['Precio Día extra/Festivo'] = '';
          row['Travel day'] = '';
          row['Horas extras'] = '';
        } else {
          const derived = computeFromWeekly(value, m.params);
          row['Precio mensual'] = derived['Precio mensual'];
          row['Precio diario'] = derived['Precio diario'];
          row['Precio jornada'] = derived['Precio jornada'];
          row['Precio Día extra/Festivo'] = derived['Precio Día extra/Festivo'];
          row['Travel day'] = derived['Travel day'];
          row['Horas extras'] = derived['Horas extras'];
        }
        next.prices[role] = row;
        return next;
      });
    } else {
      setPrice(role, header, value);
    }
  };

  const p = (model.params || {}) as any;

  // Registrar función de exportación PDF
  useEffect(() => {
    if (onRegisterExport) {
      onRegisterExport(async () => {
        try {
          await exportCondicionesToPDF(
            project,
            'semanal',
            model,
            PRICE_HEADERS,
            roles
          );
        } catch (error) {
          console.error('Error exporting condiciones semanal PDF:', error);
          alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, project, roles]);

  return (
    <div className='space-y-6'>
      {/* Parámetros (misma estética) */}
      <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90 p-4 phase-panel'>
        <div className='flex items-center gap-2 mb-3'>
          <button
            onClick={() => setShowParams(v => !v)}
            className='w-6 h-6 rounded-lg border border-neutral-border flex items-center justify-center text-sm hover:border-accent'
            title={showParams ? t('conditions.collapse') : t('conditions.expand')}
            aria-label={t('conditions.calculationParameters')}
            aria-expanded={showParams}
            aria-controls='semanal-params'
            type='button'
          >
            {showParams ? '−' : '+'}
          </button>
          <h4 className='text-brand font-semibold m-0'>
            {t('conditions.calculationParameters')}
          </h4>
        </div>

        <div className='text-xs text-zinc-400 mb-3'>
          {t('conditions.calculationParametersDescription')}
        </div>

        {showParams && (
          <div
            id='semanal-params'
            ref={paramsRef}
            tabIndex={-1}
            role='region'
            aria-label={t('conditions.parametersWeekly')}
            className='grid grid-cols-1 sm:grid-cols-3 gap-3'
          >
            <ParamInput
              label={t('conditions.workDay')}
              suffix='h'
              duo={[
                {
                  value: p.jornadaTrabajo ?? '9',
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
              label={t('conditions.workDays')}
              value={p.diasJornada ?? '5'}
              onChange={(v: string) => setParam('diasJornada', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.dailyDays')}
              value={p.diasDiario ?? '7'}
              onChange={(v: string) => setParam('diasDiario', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.weeksPerMonth')}
              value={p.semanasMes ?? '4'}
              onChange={(v: string) => setParam('semanasMes', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.weeklyHours')}
              value={p.horasSemana ?? '45'}
              onChange={(v: string) => setParam('horasSemana', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.extraDayHoliday')}
              value={p.factorFestivo ?? '1.75'}
              onChange={(v: string) => setParam('factorFestivo', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.extraHour')}
              value={p.factorHoraExtra ?? '1.5'}
              onChange={(v: string) => setParam('factorHoraExtra', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.travelDayDivisor')}
              value={p.divTravel ?? '2'}
              onChange={(v: string) => setParam('divTravel', v)}
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
              value={p.taDiario ?? '12'}
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
              label={t('conditions.nightShift')}
              duo={[
                {
                  value: p.nocturnoIni ?? '22:00',
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
              label={t('conditions.lunch')}
              value={p.dietaComida ?? '14.02'}
              onChange={(v: string) => setParam('dietaComida', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.dinner')}
              value={p.dietaCena ?? '16.36'}
              onChange={(v: string) => setParam('dietaCena', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.perDiemNoOvernight')}
              value={p.dietaSinPernocta ?? '30.38'}
              onChange={(v: string) => setParam('dietaSinPernocta', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.accommodationBreakfast')}
              value={p.dietaAlojDes ?? '51.39'}
              onChange={(v: string) => setParam('dietaAlojDes', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.pocketExpenses')}
              value={p.gastosBolsillo ?? '8.81'}
              onChange={(v: string) => setParam('gastosBolsillo', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label={t('conditions.kilometers')}
              value={p.kilometrajeKm ?? '0.26'}
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

      {/* Tabla de precios */}
      <div className='text-xs text-zinc-400 mb-4 flex items-center justify-between'>
        <span dangerouslySetInnerHTML={{ __html: t('conditions.introduceWeeklyPrice') }} />
        <div className='relative'>
          {PRICE_ROLES.filter(r => !roles.includes(r)).length === 0 ? (
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
                    // Solo cerrar si no estamos haciendo clic dentro del dropdown
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setTimeout(() => setShowRoleSelect(false), 200);
                    }
                  }}
                >
                  {PRICE_ROLES.filter(r => !roles.includes(r)).map((role: string) => (
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

      <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90 overflow-x-auto relative'>
        <table className='min-w-[920px] w-full border-collapse text-sm'>
          <thead>
            <tr>
              <Th align='left'>{t('conditions.rolePrice')}</Th>
              {PRICE_HEADERS.map(col => (
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (readOnly) return;
                        setRoleToDelete(role);
                      }}
                      disabled={readOnly}
                      className={`text-gray-400 hover:text-blue-500 hover:bg-blue-100 dark:hover:text-amber-500 dark:hover:bg-amber-900/20 font-bold text-sm w-6 h-6 flex items-center justify-center rounded transition-all hover:scale-110 ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={readOnly ? t('conditions.projectClosed') : t('conditions.deleteRole')}
                      type='button'
                    >
                      ✕
                    </button>
                    <span>{translateRoleName(role)}</span>
                  </div>
                </Td>
                {PRICE_HEADERS.map(h => {
                  const isSemanal = h === 'Precio semanal';
                  const isRefuerzo = h === 'Precio refuerzo';
                  const hasSemanalValue = model.prices?.[role]?.['Precio semanal'];
                  
                  return (
                    <Td key={h} align='center'>
                      <input
                        type='number'
                        value={model.prices?.[role]?.[h] ?? ''}
                        onChange={e => !readOnly && handlePriceChange(role, h, (e.target as HTMLInputElement).value)}
                        placeholder={isSemanal ? '€' : ''}
                        step='0.01'
                        disabled={readOnly || (!isSemanal && !isRefuerzo && !hasSemanalValue)}
                        readOnly={readOnly}
                        className={`w-full px-2 py-1 rounded-lg border border-neutral-border focus:outline-none focus:ring-1 text-center ${
                          readOnly || (!isSemanal && !isRefuerzo && !hasSemanalValue)
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-50' 
                            : 'dark:bg-transparent'
                        }`}
                      />
                    </Td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Leyenda cálculos */}
      <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90 p-4'>
        <h4 className='text-brand font-semibold mb-2'>{t('conditions.calculationLegend')}</h4>
        <TextAreaAuto
          value={restoreStrongTags(renderWithParams(model.legendTemplate, model.params))}
          onChange={v => setText('legendTemplate', visibleToTemplate(v, model.params))}
          className='min-h-[180px]'
          readOnly={readOnly}
        />
      </section>

      {/* Bloques informativos */}
      <InfoCard
        title={t('conditions.holidays')}
        value={renderWithParams(model.festivosTemplate, model.params)}
        onChange={v => setText('festivosTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
      />
      <InfoCard
        title={t('conditions.schedules')}
        value={restoreStrongTags(renderWithParams(model.horariosTemplate, model.params))}
        onChange={v => setText('horariosTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
      />
      <InfoCard
        title={t('conditions.perDiems')}
        value={restoreStrongTags(renderWithParams(model.dietasTemplate, model.params))}
        onChange={v => setText('dietasTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
      />
      <InfoCard
        title={t('conditions.transportation')}
        value={renderWithParams(model.transportesTemplate, model.params)}
        onChange={v => setText('transportesTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
      />
      <InfoCard
        title={t('conditions.accommodation')}
        value={renderWithParams(model.alojamientoTemplate, model.params)}
        onChange={v => setText('alojamientoTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
      />
      <InfoCard
        title={t('conditions.preProduction')}
        value={renderWithParams(model.preproTemplate, model.params)}
        onChange={v => setText('preproTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
      />
      <InfoCard
        title={t('conditions.agreement')}
        value={renderWithParams(model.convenioTemplate, model.params)}
        onChange={v => setText('convenioTemplate', visibleToTemplate(v, model.params))}
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

export default memo(CondicionesSemanal);

function loadOrSeed(storageKey: string) {
  const fallback = {
    roles: ['Gaffer', 'Eléctrico'],
    prices: {},
    legendTemplate: getDefaultLegend(),
    festivosTemplate: globalDynamicFestivosText,
    horariosTemplate: getDefaultHorarios(),
    dietasTemplate: getDefaultDietas(),
    transportesTemplate: getDefaultTransportes(),
    alojamientoTemplate: getDefaultAlojamiento(),
    preproTemplate: getDefaultPrepro(),
    convenioTemplate: getDefaultConvenio(),
    params: {
      jornadaTrabajo: '10',
      jornadaComida: '1',
      diasJornada: '5',
      diasDiario: '5',
      semanasMes: '4.33',
      horasSemana: '50',
      factorFestivo: '1.75',
      factorHoraExtra: '1.5',
      divTravel: '2',
      cortesiaMin: '15',
      taDiario: '12',
      taFinde: '12',
      nocturnoIni: '22:00',
      nocturnoFin: '06:00',
      dietaComida: '14.02',
      dietaCena: '16.36',
      dietaSinPernocta: '30.38',
      dietaAlojDes: '51.39',
      gastosBolsillo: '8.81',
      kilometrajeKm: '0.26',
      transporteDia: '12',
    },
  } as any;

  const parsed = loadJSON(storageKey, fallback);

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
    if (parsed.prepro && !parsed.preproTemplate) {
      parsed.preproTemplate = parsed.prepro;
      delete parsed.prepro;
    }
    if (parsed.convenio && !parsed.convenioTemplate) {
      parsed.convenioTemplate = parsed.convenio;
      delete parsed.convenio;
    }

    parsed.params = {
      jornadaTrabajo: normalizeNumeric(parsed.params?.jornadaTrabajo) || '9',
      jornadaComida: normalizeNumeric(parsed.params?.jornadaComida) || '1',
      diasJornada: normalizeNumeric(parsed.params?.diasJornada) || '5',
      diasDiario: normalizeNumeric(parsed.params?.diasDiario) || '7',
      semanasMes: normalizeNumeric(parsed.params?.semanasMes) || '4',
      horasSemana: normalizeNumeric(parsed.params?.horasSemana) || '45',
      factorFestivo: normalizeNumeric(parsed.params?.factorFestivo) || '1.75',
      factorHoraExtra: normalizeNumeric(parsed.params?.factorHoraExtra) || '1.5',
      divTravel: normalizeNumeric(parsed.params?.divTravel) || '2',
      cortesiaMin: normalizeNumeric(parsed.params?.cortesiaMin) || '15',
      taDiario: normalizeNumeric(parsed.params?.taDiario) || '12',
      taFinde: normalizeNumeric(parsed.params?.taFinde) || '48',
      nocturnoIni: parsed.params?.nocturnoIni ?? '22:00',
      nocturnoFin: parsed.params?.nocturnoFin ?? '06:00',
      dietaComida: normalizeNumeric(parsed.params?.dietaComida) || '14.02',
      dietaCena: normalizeNumeric(parsed.params?.dietaCena) || '16.36',
      dietaSinPernocta: normalizeNumeric(parsed.params?.dietaSinPernocta) || '30.38',
      dietaAlojDes: normalizeNumeric(parsed.params?.dietaAlojDes) || '51.39',
      gastosBolsillo: normalizeNumeric(parsed.params?.gastosBolsillo) || '8.81',
      kilometrajeKm: normalizeNumeric(parsed.params?.kilometrajeKm) || '0.26',
      transporteDia: normalizeNumeric(parsed.params?.transporteDia) || '12',
    };

    parsed.legendTemplate = parsed.legendTemplate ?? getDefaultLegend();
    parsed.festivosTemplate = parsed.festivosTemplate ?? globalDynamicFestivosText;
    parsed.horariosTemplate = parsed.horariosTemplate ?? getDefaultHorarios();
    parsed.dietasTemplate = parsed.dietasTemplate ?? getDefaultDietas();
    parsed.transportesTemplate = parsed.transportesTemplate ?? getDefaultTransportes();
    parsed.alojamientoTemplate = parsed.alojamientoTemplate ?? getDefaultAlojamiento();
    parsed.preproTemplate = parsed.preproTemplate ?? getDefaultPrepro();
    parsed.convenioTemplate = parsed.convenioTemplate ?? getDefaultConvenio();

    return parsed;
  }

  return fallback;
}


