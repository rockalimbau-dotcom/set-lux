import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MonthSectionPersonRow } from './MonthSectionPersonRow';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'ca' },
  }),
}));

describe('MonthSectionPersonRow', () => {
  it('renders a role breakdown when one person has multiple tariffs merged into one row', () => {
    const row = {
      role: 'E',
      name: 'Pol Peitx',
      _totalBruto: 650,
      _worked: 2,
      _halfDays: 0,
      _travel: 0,
      _holidays: 0,
      _localizarDays: 0,
      _cargaDays: 0,
      _descargaDays: 0,
      horasExtra: 0,
      turnAround: 0,
      nocturnidad: 0,
      penaltyLunch: 0,
      transporte: 0,
      km: 0,
      gasolina: 0,
      _totalDias: 650,
      _totalHalfDays: 0,
      _totalTravel: 0,
      _totalHolidays: 0,
      _totalExtras: 0,
      _totalDietas: 0,
      _totalTrans: 0,
      _totalKm: 0,
      _totalGasolina: 0,
      _totalMaterialPropio: 0,
      _totalLocalizacion: 0,
      _totalCargaDescarga: 0,
      _materialPropioDays: 0,
      _materialPropioWeeks: 0,
      _materialPropioUnique: 0,
      _materialPropioType: 'semanal',
      _missingPrices: {},
      dietasCount: new Map(),
      ticketTotal: 0,
      otherTotal: 0,
      _roleVariants: [
        { role: 'E', roleLabel: 'Eléctrico/a', totalBruto: 350 },
        { role: 'E', roleLabel: 'Eléctrico factura', totalBruto: 300 },
      ],
    };

    const { getByText, getAllByText } = render(
      <table>
        <tbody>
          <MonthSectionPersonRow
            row={row}
            personKey='person:person_pol'
            roleForColor='E'
            col={{ bg: '#60A5FA', fg: '#fff' }}
            roleLabelFromCode={(code: string) => code}
            received={{}}
            isSelected={false}
            toggleRowSelection={vi.fn()}
            setRcv={vi.fn()}
            projectMode='diario'
            hasWorkedDaysData
            hasHalfDaysData={false}
            hasLocalizacionData={false}
            hasCargaDescargaData={false}
            columnVisibility={{
              holidays: false,
              travel: false,
              extras: false,
              transporte: false,
              km: false,
              gasolina: false,
              dietas: false,
              materialPropio: false,
            }}
            showRowSelection={false}
          />
        </tbody>
      </table>
    );

    expect(getByText('Pol Peitx')).toBeInTheDocument();
    expect(getByText('Eléctrico/a: 350€')).toBeInTheDocument();
    expect(getByText('Eléctrico factura: 300€')).toBeInTheDocument();
    expect(getAllByText('650€').length).toBeGreaterThan(0);
  });

  it('shows localizacion in worked days summary for non-diario payroll rows', () => {
    const row = {
      role: 'G',
      name: 'Jordi',
      _totalBruto: 1440,
      _worked: 4,
      _halfDays: 0,
      _travel: 0,
      _holidays: 0,
      _localizar: 1,
      _localizarDays: 0,
      _carga: 0,
      _cargaDays: 0,
      _descarga: 0,
      _descargaDays: 0,
      _rodaje: 3,
      _pruebasCamara: 0,
      _oficina: 0,
      _prelight: 0,
      _recogida: 0,
      horasExtra: 0,
      turnAround: 0,
      nocturnidad: 0,
      penaltyLunch: 0,
      transporte: 0,
      km: 0,
      gasolina: 0,
      _totalDias: 1440,
      _totalHalfDays: 0,
      _totalTravel: 0,
      _totalHolidays: 0,
      _totalExtras: 0,
      _totalDietas: 0,
      _totalTrans: 0,
      _totalKm: 0,
      _totalGasolina: 0,
      _totalMaterialPropio: 0,
      _totalLocalizacion: 0,
      _totalCargaDescarga: 0,
      _materialPropioDays: 0,
      _materialPropioWeeks: 0,
      _materialPropioUnique: 0,
      _materialPropioType: 'semanal',
      _missingPrices: {},
      dietasCount: new Map(),
      ticketTotal: 0,
      otherTotal: 0,
      _roleVariants: [],
    };

    const { getByText } = render(
      <table>
        <tbody>
          <MonthSectionPersonRow
            row={row}
            personKey='person:jordi'
            roleForColor='G'
            col={{ bg: '#60A5FA', fg: '#fff' }}
            roleLabelFromCode={(code: string) => code}
            received={{}}
            isSelected={false}
            toggleRowSelection={vi.fn()}
            setRcv={vi.fn()}
            projectMode='mensual'
            hasWorkedDaysData
            hasHalfDaysData={false}
            hasLocalizacionData={false}
            hasCargaDescargaData={false}
            columnVisibility={{
              holidays: false,
              travel: false,
              extras: false,
              transporte: false,
              km: false,
              gasolina: false,
              dietas: false,
              materialPropio: false,
            }}
            showRowSelection={false}
          />
        </tbody>
      </table>
    );

    expect(getByText('payroll.dayTypes.shooting x3')).toBeInTheDocument();
    expect(getByText('payroll.dayTypes.localizar x1')).toBeInTheDocument();
    expect(getByText('4')).toBeInTheDocument();
  });
});
