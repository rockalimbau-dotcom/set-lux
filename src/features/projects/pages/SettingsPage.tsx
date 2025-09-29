import { useState, useEffect } from 'react';
import LogoSetLux from '@shared/components/LogoSetLux';
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
    <div className='min-h-screen bg-neutral-bg text-neutral-text'>
      <div className='px-6 py-6 bg-[#0D0D0D]'>
        <div className='max-w-5xl mx-auto flex flex-col items-center gap-4'>
          <LogoSetLux />
          <div className='flex items-center justify-between w-full relative'>
            <h2 className='text-xl font-bold tracking-wide text-brand'>Configuración</h2>
            <div />
          </div>
        </div>
      </div>

      <div className='max-w-5xl mx-auto p-6'>
        <div className='max-w-xl rounded-2xl border border-neutral-border bg-neutral-panel/90 p-6'>
          <h3 className='text-brand text-lg font-semibold mb-4'>Preferencias</h3>

          <div className='space-y-4'>
            <label className='block space-y-1'>
              <span className='text-sm text-zinc-300'>Tema</span>
              <select
                className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
                value={theme}
                onChange={e => setTheme(e.target.value as any)}
              >
                <option value='dark'>Oscuro</option>
                <option value='light'>Claro</option>
              </select>
            </label>

            <label className='block space-y-1'>
              <span className='text-sm text-zinc-300'>País</span>
              <select
                className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
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
              <label className='block space-y-1'>
                <span className='text-sm text-zinc-300'>Región (opcional)</span>
                <select
                  className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
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

          <div className='flex justify-end gap-3 mt-6'>
            <a href='/projects' className='px-4 py-3 rounded-xl border border-neutral-border hover:border-accent text-zinc-300'>Volver</a>
            <button onClick={save} className='px-4 py-3 rounded-xl font-semibold bg-brand hover:bg-brand-dark'>Guardar</button>
          </div>

          {saved && (
            <div className='mt-3 text-sm text-green-400'>Configuración guardada ✓</div>
          )}
        </div>
      </div>
    </div>
  );
}