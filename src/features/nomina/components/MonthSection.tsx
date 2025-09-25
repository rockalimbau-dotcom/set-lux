import React, { useMemo } from 'react';
import { Th, Td } from '@shared/components';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import DietasSummary from './DietasSummary.jsx';

type RolePrices = {
  getForRole: (roleCode: string, baseRoleCode?: string | null) => {
    jornada: number;
    travelDay: number;
    horaExtra: number;
    transporte: number;
    km: number;
    dietas: Record<string, number>;
  };
};

type RowIn = {
  role: string;
  name: string;
  extras: number;
  transporte: number;
  km: number;
  dietasCount: Map<string, number>;
  ticketTotal: number;
};

type WindowOverride = Map<string, {
  extras?: number;
  transporte?: number;
  km?: number;
  dietasCount?: Map<string, number>;
  ticketTotal?: number;
}>;

interface MonthSectionProps {
  monthKey: string;
  rows: RowIn[];
  weeksForMonth: any[];
  filterISO: (iso: string) => boolean;
  rolePrices: RolePrices;
  defaultOpen?: boolean;
  persistKeyBase: string;
  onExport?: (monthKey: string, enrichedRows: any[]) => void;
  windowOverrideMap?: WindowOverride | null;
  // utils
  buildRefuerzoIndex: (weeks: any[]) => Set<string>;
  stripPR: (r: string) => string;
  calcWorkedBreakdown: (
    weeks: any[],
    filterISO: (iso: string) => boolean,
    person: { role: string; name: string }
  ) => { workedDays: number; travelDays: number; workedBase: number; workedPre: number; workedPick: number };
  monthLabelEs: (key: string, withYear?: boolean) => string;
  ROLE_COLORS: Record<string, { bg: string; fg: string }>;
  roleLabelFromCode: (code: string) => string;
}

function MonthSection({
  monthKey,
  rows,
  weeksForMonth,
  filterISO,
  rolePrices,
  defaultOpen = false,
  persistKeyBase,
  onExport,
  windowOverrideMap = null,
  // utils
  buildRefuerzoIndex,
  stripPR,
  calcWorkedBreakdown,
  monthLabelEs,
  ROLE_COLORS,
  roleLabelFromCode,
}: MonthSectionProps) {
  const openKey = `${persistKeyBase}_${monthKey}_open`;
  const [open, setOpen] = useLocalStorage<boolean>(openKey, defaultOpen);

  const persistKey = `${persistKeyBase}_${monthKey}_rcvd`;
  const [received, setReceived] = useLocalStorage<Record<string, { ok?: boolean; note?: string }>>(
    persistKey,
    {}
  );
  const setRcv = (personKey: string, patch: { ok?: boolean; note?: string }) => {
    setReceived(prev => {
      const next = {
        ...prev,
        [personKey]: { ...(prev[personKey] || {}), ...patch },
      };
      return next;
    });
  };

  const btnExportCls = 'px-3 py-2 rounded-lg text-sm font-semibold';
  const btnExportStyle: React.CSSProperties = {
    background: '#1D4ED8',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  const refuerzoSet = useMemo(
    () => buildRefuerzoIndex(weeksForMonth),
    [weeksForMonth, buildRefuerzoIndex]
  );

  const enriched = useMemo(() => {
    return rows.map(r => {
      const person = { role: r.role, name: r.name };
      const { workedDays, travelDays, workedBase, workedPre, workedPick } =
        calcWorkedBreakdown(weeksForMonth, filterISO, person);

      const keyNoPR = `${stripPR(r.role)}__${r.name}`;
      const baseRoleCode = stripPR(r.role);
      const pr = refuerzoSet.has(keyNoPR)
        ? rolePrices.getForRole('REF', baseRoleCode)
        : rolePrices.getForRole(r.role);

      let roleDisplay = r.role;
      if (r.role !== 'REF') {
        if (workedPre > 0 && workedBase === 0 && workedPick === 0)
          roleDisplay = `${baseRoleCode}P`;
        else if (workedPick > 0 && workedBase === 0 && workedPre === 0)
          roleDisplay = `${baseRoleCode}R`;
        else roleDisplay = baseRoleCode;
      }

      const pKey = `${r.role}__${r.name}`;
      const ov = (windowOverrideMap && 'get' in windowOverrideMap)
        ? (windowOverrideMap as WindowOverride).get(pKey)
        : null;

      const extrasValue = ov?.extras ?? r.extras;
      const transporteValue = ov?.transporte ?? r.transporte;
      const kmValue = ov?.km ?? r.km;
      const dietasMap = ov?.dietasCount ?? r.dietasCount;
      const ticketValue = ov?.ticketTotal ?? r.ticketTotal;

      const cnt = (label: string) => dietasMap.get(label) || 0;
      const totalDietas =
        cnt('Comida') * (pr.dietas['Comida'] || 0) +
        cnt('Cena') * (pr.dietas['Cena'] || 0) +
        cnt('Dieta sin pernoctar') * (pr.dietas['Dieta sin pernoctar'] || 0) +
        cnt('Dieta completa + desayuno') *
          (pr.dietas['Dieta completa + desayuno'] || 0) +
        cnt('Gastos de bolsillo') * (pr.dietas['Gastos de bolsillo'] || 0) +
        (ticketValue || 0);

      const totalDias = workedDays * (pr.jornada || 0);
      const totalTravel = travelDays * (pr.travelDay || 0);
      const _totalExtras = extrasValue * (pr.horaExtra || 0);
      const _totalTrans = transporteValue * (pr.transporte || 0);
      const _totalKm = (kmValue || 0) * (pr.km || 0);
      const _totalBruto =
        totalDias +
        totalTravel +
        _totalExtras +
        totalDietas +
        _totalTrans +
        _totalKm;

      const dietasLabelParts: string[] = [];
      if (cnt('Comida')) dietasLabelParts.push(`Comida x${cnt('Comida')}`);
      if (cnt('Cena')) dietasLabelParts.push(`Cena x${cnt('Cena')}`);
      if (cnt('Dieta sin pernoctar'))
        dietasLabelParts.push(
          `Dieta sin pernoctar x${cnt('Dieta sin pernoctar')}`
        );
      if (cnt('Dieta completa + desayuno'))
        dietasLabelParts.push(
          `Dieta completa + desayuno x${cnt('Dieta completa + desayuno')}`
        );
      if (cnt('Gastos de bolsillo'))
        dietasLabelParts.push(
          `Gastos de bolsillo x${cnt('Gastos de bolsillo')}`
        );
      if (ticketValue > 0)
        dietasLabelParts.push(`Ticket €${(ticketValue || 0).toFixed(2)}`);

      return {
        ...r,
        role: roleDisplay,
        extras: extrasValue,
        transporte: transporteValue,
        km: kmValue,
        dietasCount: dietasMap,
        ticketTotal: ticketValue,
        _worked: workedDays,
        _travel: travelDays,
        _totalDias: totalDias,
        _totalTravel: totalTravel,
        _totalExtras,
        _totalDietas: totalDietas,
        _totalTrans,
        _totalKm,
        _totalBruto,
        _dietasLabel: dietasLabelParts.join(' · ') || '—',
        _pr: pr,
      };
    });
  }, [
    rows,
    weeksForMonth,
    filterISO,
    rolePrices,
    windowOverrideMap,
    refuerzoSet,
    stripPR,
    calcWorkedBreakdown,
  ]);

  const doExport = () => onExport?.(monthKey, enriched);

  return (
    <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90'>
      <div className='flex items-center gap-2 px-5 py-4'>
        <button
          onClick={() => setOpen(v => !v)}
          className='w-6 h-6 rounded-lg border border-neutral-border flex items-center justify-center text-sm hover:border-[#F59E0B]'
          title={open ? 'Contraer' : 'Desplegar'}
          type='button'
        >
          {open ? '−' : '+'}
        </button>
        <h4 className='text-brand font-semibold m-0'>
          Nómina {monthLabelEs(monthKey)}
        </h4>
        <div className='ml-auto'>
          <button
            className={btnExportCls}
            style={btnExportStyle}
            onClick={doExport}
            title='Exportar nómina del mes'
            type='button'
          >
            Exportar
          </button>
        </div>
      </div>

      {open && (
        <div className='px-5 pb-5 overflow-x-auto'>
          <table className='min-w-[1200px] w-full border-collapse text-sm'>
            <thead>
              <tr>
                <Th>Persona</Th>
                <Th>Días trabajados</Th>
                <Th>Total días</Th>
                <Th>Días Travel Day</Th>
                <Th>Total travel days</Th>
                <Th>Horas extra</Th>
                <Th>Total horas extra</Th>
                <Th>Dietas</Th>
                <Th>Total dietas</Th>
                <Th>Transportes</Th>
                <Th>Total transportes</Th>
                <Th>Kilometraje</Th>
                <Th>Total kilometraje</Th>
                <Th>TOTAL BRUTO</Th>
                <Th>Nómina recibida</Th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((r, idx) => {
                const roleForColor = String(r.role || '').replace(/[PR]$/, '');
                const col =
                  ROLE_COLORS[roleForColor] ||
                  ROLE_COLORS[roleLabelFromCode(roleForColor)] ||
                  (roleForColor === 'REF'
                    ? { bg: '#F59E0B', fg: '#111' }
                    : { bg: '#444', fg: '#fff' });

                const pKey = `${r.role}__${r.name}`;
                const rc = (received as any)[pKey] || { ok: false, note: '' };

                return (
                  <tr key={idx}>
                    <Td>
                      <span
                        className='inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-neutral-border bg-black/40'
                        title={`${r.role} - ${r.name}`}
                      >
                        <span
                          className='inline-flex items-center justify-center w-6 h-5 rounded-md font-bold text-[10px]'
                          style={{ background: col.bg, color: col.fg }}
                        >
                          {r.role || '—'}
                        </span>
                        <span className='text-xs text-zinc-200'>{r.name}</span>
                      </span>
                    </Td>

                    <Td className='text-right'>{r._worked}</Td>
                    <Td className='text-right'>{r._totalDias.toFixed(2)}</Td>

                    <Td className='text-right'>{r._travel}</Td>
                    <Td className='text-right'>{r._totalTravel.toFixed(2)}</Td>

                    <Td className='text-right'>{r.extras}</Td>
                    <Td className='text-right'>{r._totalExtras.toFixed(2)}</Td>

                    <Td>
                      <DietasSummary
                        dietasCount={r.dietasCount}
                        ticketTotal={r.ticketTotal}
                      />
                    </Td>
                    <Td className='text-right'>{r._totalDietas.toFixed(2)}</Td>

                    <Td className='text-right'>{r.transporte}</Td>
                    <Td className='text-right'>{r._totalTrans.toFixed(2)}</Td>

                    <Td className='text-right'>{(r.km || 0).toFixed(1)}</Td>
                    <Td className='text-right'>{r._totalKm.toFixed(2)}</Td>

                    <Td className='text-right font-semibold'>
                      {r._totalBruto.toFixed(2)}
                    </Td>

                    <Td>
                      <div className='flex items-center gap-2'>
                        <input
                          type='checkbox'
                          checked={!!rc.ok}
                          onChange={e => setRcv(pKey, { ok: e.target.checked })}
                        />
                        <input
                          type='text'
                          placeholder='Anota mes o incidencia…'
                          value={rc.note || ''}
                          onChange={e => setRcv(pKey, { note: e.target.value })}
                          className='px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-xs'
                        />
                      </div>
                    </Td>
                  </tr>
                );
              })}

              {enriched.length === 0 && (
                <tr>
                  <Td colSpan={15}>
                    <div className='text-sm text-zinc-400'>
                      No hay datos en este mes.
                    </div>
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default React.memo(MonthSection);


