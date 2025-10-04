import { useState, useEffect } from 'react';
import LogoIcon from '@shared/components/LogoIcon';
import { storage } from '@shared/services/localStorage.service';
import { fetchHolidays } from '@shared/services/holidays.service';
import { REGION_NAMES } from '@shared/constants/regional-holidays';
// import { REGION_NAMES } from '@shared/constants/regional-holidays';

const COUNTRIES = [
  { code: 'ES', name: 'España' },
  { code: 'FR', name: 'Francia' },
  { code: 'IT', name: 'Italia' },
  { code: 'DE', name: 'Alemania' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CL', name: 'Chile' },
];

const REGIONS = {
  ES: [
    { code: 'AN', name: 'Andalucía' },         // ES-AN
    { code: 'AR', name: 'Aragón' },            // ES-AR
    { code: 'AS', name: 'Asturias' },          // ES-AS
    { code: 'CN', name: 'Canarias' },          // ES-CN
    { code: 'CB', name: 'Cantabria' },         // ES-CB
    { code: 'CM', name: 'Castilla-La Mancha' },// ES-CM
    { code: 'CL', name: 'Castilla y León' },   // ES-CL
    { code: 'CT', name: 'Cataluña' },          // ES-CT
    { code: 'EX', name: 'Extremadura' },       // ES-EX
    { code: 'GA', name: 'Galicia' },           // ES-GA
    { code: 'IB', name: 'Islas Baleares' },    // ES-IB
    { code: 'RI', name: 'La Rioja' },          // ES-RI
    { code: 'MD', name: 'Madrid' },            // ES-MD
    { code: 'MC', name: 'Región de Murcia' },  // ES-MC
    { code: 'NC', name: 'Navarra' },           // ES-NC (Navarra)
    { code: 'PV', name: 'País Vasco' },        // ES-PV
    { code: 'VC', name: 'Comunidad Valenciana' }, // ES-VC
    { code: 'CE', name: 'Ceuta' },             // ES-CE
    { code: 'ML', name: 'Melilla' },           // ES-ML
  ],
  FR: [
    { code: 'IDF', name: 'Île-de-France' },
    { code: 'PACA', name: 'Provence-Alpes-Côte d\'Azur' },
  ],
  US: [
    { code: 'CA', name: 'California' },
    { code: 'NY', name: 'Nueva York' },
    { code: 'TX', name: 'Texas' },
  ],
};

export default function SettingsPage() {
  const formatYMDToDMY = (ymd: string): string => {
    const [y, m, d] = (ymd || '').split('-').map(Number);
    if (!y || !m || !d) return ymd;
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  };
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [country, setCountry] = useState('ES');
  const [region, setRegion] = useState('');
  const [saved, setSaved] = useState(false);
  const [festivos, setFestivos] = useState<string[]>([]);
  const [loadingFestivos, setLoadingFestivos] = useState(false);

  useEffect(() => {
    const s = storage.getJSON<any>('settings_v1') || {};
    setTheme(s.theme || 'dark');
    setCountry(s.country || 'ES');
    setRegion(s.region || '');
  }, []);

  // Load festivos when country/region changes (used internally, not displayed)
  useEffect(() => {
    const loadFestivos = async () => {
      setLoadingFestivos(true);
      try {
        const year = new Date().getFullYear();
        const { holidays } = await fetchHolidays({ country, year, region: region || undefined });
        const festivosData = (holidays || []).map((h: { date: string }) => h.date).sort();
        setFestivos(festivosData);
      } catch {
        setFestivos([]);
      } finally {
        setLoadingFestivos(false);
      }
    };
    loadFestivos();
  }, [country, region]);

  const save = () => {
    storage.setJSON('settings_v1', { theme, country, region });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const availableRegions = REGIONS[country as keyof typeof REGIONS] || [];

  return (
    <div className='min-h-screen' style={{backgroundColor: '#1a2b40', color: '#ffffff'}}>
      {/* Header moderno y prominente */}
      <div className='px-6 py-8' style={{backgroundColor: '#1a2b40'}}>
        <div className='max-w-6xl mx-auto'>
          {/* Header limpio */}
          <div className='flex items-center justify-between mb-8'>
            <div className='flex items-center gap-6'>
              <LogoIcon size={80} />
              <h1 className='text-3xl font-bold text-white'>
                SetLux <span className='text-gray-300'>/ Configuración</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-6xl mx-auto p-6 flex justify-center'>
        <div className='max-w-2xl w-full rounded-2xl border p-8' style={{backgroundColor: '#2a4058', borderColor: '#3b5568'}}>
          <h3 className='text-orange-500 text-xl font-semibold mb-6'>Preferencias</h3>

          <div className='space-y-6'>
            <label className='block space-y-2'>
              <span className='text-sm font-medium text-zinc-300'>Tema</span>
              <select
                className='w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors'
                style={{backgroundColor: 'rgba(0,0,0,0.4)', color: '#ffffff', borderColor: '#3b5568'}}
                value={theme}
                onChange={e => setTheme(e.target.value as any)}
              >
                <option value='dark'>Oscuro</option>
                <option value='light'>Claro</option>
              </select>
            </label>

            <label className='block space-y-2'>
              <span className='text-sm font-medium text-zinc-300'>País</span>
              <select
                className='w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors'
                style={{backgroundColor: 'rgba(0,0,0,0.4)', color: '#ffffff', borderColor: '#3b5568'}}
                value={country}
                onChange={e => {
                  setCountry(e.target.value);
                  setRegion(''); // Reset region when country changes
                }}
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            {availableRegions.length > 0 && (
              <label className='block space-y-2'>
                <span className='text-sm font-medium text-zinc-300'>Región (opcional)</span>
                <select
                  className='w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors'
                  style={{backgroundColor: 'rgba(0,0,0,0.4)', color: '#ffffff', borderColor: '#3b5568'}}
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                >
                  <option value=''>Sin región específica</option>
                  {availableRegions.map(r => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {/* Festivos Debug Section (Calendarific) - oculto para producción */}
          <div className='hidden mt-6 p-4 bg-black/20 rounded-xl border border-neutral-border'>
            <h4 className='text-sm font-semibold text-brand mb-2'>Festivos Cargados</h4>
            {loadingFestivos ? (
              <div className='text-sm text-zinc-400'>Cargando festivos...</div>
            ) : festivos.length > 0 ? (
              <div>
                <div className='text-sm text-zinc-300 mb-2'>
                  {festivos.length} festivos encontrados para {country === 'ES' ? 'España' : country}
                  {region && country === 'ES' && ` - ${REGION_NAMES[region] || region}`}
                </div>
                <div className='text-xs text-zinc-400 max-h-20 overflow-y-auto'>
                  {festivos
                    .slice(0, 10)
                    .map(formatYMDToDMY)
                    .join(', ')}
                  {festivos.length > 10 && ` ... y ${festivos.length - 10} más`}
                </div>
              </div>
            ) : (
              <div className='text-sm text-zinc-400'>No se pudieron cargar los festivos</div>
            )}
          </div>

          <div className='flex justify-end gap-4 mt-8'>
            <a 
              href='/projects' 
              className='px-6 py-3 rounded-xl border hover:border-orange-500 text-zinc-300 hover:text-orange-500 transition-colors font-medium'
              style={{borderColor: '#3b5568'}}
            >
              Volver
            </a>
            <button 
              onClick={save} 
              className='px-6 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg'
              style={{backgroundColor: '#f97316'}}
            >
              Guardar
            </button>
          </div>

          {saved && (
            <div className='mt-4 text-sm text-green-400 font-medium'>Configuración guardada ✓</div>
          )}
        </div>
      </div>
    </div>
  );
}