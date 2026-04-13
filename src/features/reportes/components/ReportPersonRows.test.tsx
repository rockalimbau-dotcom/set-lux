import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import ReportPersonRows from './ReportPersonRows.jsx';

const CONCEPTS = ['Dietas', 'Kilometraje'];
const DIETAS_OPCIONES = ['Desayuno', 'Comida', 'Cena', 'Ticket', 'Otros'];
const SI_NO = ['—', 'Sí', 'No'];

function noop() {}

function findWeekAndDay() {
  return { day: { tipo: 'Rodaje', team: [{ name: 'Juan', role: 'EL' }] } };
}
function isPersonScheduledOnBlock() {
  return true;
}
function parseDietas(raw) {
  return { items: new Set(), ticket: null, other: null };
}
function formatDietas(items, ticket, other) {
  return '';
}
function scheduleWindowForISO() {
  return { start: '08:00', end: '17:00', isRest: false };
}

function onScheduleChange() {}

describe('ReportPersonRows (smoke)', () => {
  it('renders a person row and allows collapse toggle', () => {
    const semana = [
      '2025-01-06',
      '2025-01-07',
      '2025-01-08',
      '2025-01-09',
      '2025-01-10',
      '2025-01-11',
      '2025-01-12',
    ];
    const list = [{ role: 'EL', name: 'Juan' }];
    const collapsed = {};
    const setCollapsed = fn => fn(collapsed);

    render(
      <table>
        <tbody>
          <ReportPersonRows
            list={list}
            block='base'
            scheduleWindowForISO={scheduleWindowForISO}
            onScheduleChange={onScheduleChange}
            semana={semana}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            data={{}}
            setCell={noop}
            findWeekAndDay={findWeekAndDay}
            isPersonScheduledOnBlock={isPersonScheduledOnBlock}
            CONCEPTS={CONCEPTS}
            DIETAS_OPCIONES={DIETAS_OPCIONES}
            SI_NO={SI_NO}
            parseDietas={parseDietas}
            formatDietas={formatDietas}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('Juan')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Contraer'));
  });

  it('applies conditional styling when person does not work on a specific day', () => {
    const semana = ['2025-01-06', '2025-01-07'];
    const list = [{ role: 'EL', name: 'Juan' }];
    const collapsed = {};
    const setCollapsed = fn => fn(collapsed);

    // Mock isPersonScheduledOnBlock to return false for the first day
    const mockIsPersonScheduledOnBlock = (fecha, role, name) => {
      return fecha !== '2025-01-06'; // Juan doesn't work on 2025-01-06
    };

    const { container } = render(
      <table>
        <tbody>
          <ReportPersonRows
            list={list}
            block='base'
            scheduleWindowForISO={scheduleWindowForISO}
            onScheduleChange={onScheduleChange}
            semana={semana}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            data={{}}
            setCell={noop}
            findWeekAndDay={findWeekAndDay}
            isPersonScheduledOnBlock={mockIsPersonScheduledOnBlock}
            CONCEPTS={CONCEPTS}
            DIETAS_OPCIONES={DIETAS_OPCIONES}
            SI_NO={SI_NO}
            parseDietas={parseDietas}
            formatDietas={formatDietas}
          />
        </tbody>
      </table>
    );

    // Check that cells for the non-working day have the off-state class
    const cellsWithOffStyling = container.querySelectorAll('.report-off-cell');
    expect(cellsWithOffStyling.length).toBeGreaterThan(0);
  });

  it('passes the prelight block when checking off-map for non-ref roles', () => {
    const semana = ['2025-01-06'];
    const list = [{ role: 'E', name: 'Ricard Durany' }];
    const collapsed = {};
    const setCollapsed = fn => fn(collapsed);
    const mockIsPersonScheduledOnBlock = vi.fn(() => true);

    render(
      <table>
        <tbody>
          <ReportPersonRows
            list={list}
            block='pre'
            scheduleWindowForISO={scheduleWindowForISO}
            onScheduleChange={onScheduleChange}
            semana={semana}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            data={{}}
            setCell={noop}
            findWeekAndDay={findWeekAndDay}
            isPersonScheduledOnBlock={mockIsPersonScheduledOnBlock}
            CONCEPTS={CONCEPTS}
            DIETAS_OPCIONES={DIETAS_OPCIONES}
            SI_NO={SI_NO}
            parseDietas={parseDietas}
            formatDietas={formatDietas}
          />
        </tbody>
      </table>
    );

    expect(mockIsPersonScheduledOnBlock).toHaveBeenCalledWith(
      '2025-01-06',
      'E',
      'Ricard Durany',
      findWeekAndDay,
      'pre',
      { roleId: undefined }
    );
  });

  it('shows the custom role label in the header when the same name has a custom role', () => {
    const semana = ['2025-01-06'];
    const list = [{ role: 'E', roleId: 'electric_factura', roleLabel: 'Eléctrico factura', name: 'Pol Peitx' }];
    const collapsed = {};
    const setCollapsed = fn => fn(collapsed);
    const project = {
      roleCatalog: {
        version: 1,
        roles: [
          {
            id: 'e_default',
            label: 'Eléctrico/a',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 10,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
          {
            id: 'electric_factura',
            label: 'Eléctrico factura',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 10,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
        ],
      },
    };

    render(
      <table>
        <tbody>
          <ReportPersonRows
            project={project}
            list={list}
            block='base'
            scheduleWindowForISO={scheduleWindowForISO}
            onScheduleChange={onScheduleChange}
            semana={semana}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            data={{}}
            setCell={noop}
            findWeekAndDay={findWeekAndDay}
            isPersonScheduledOnBlock={isPersonScheduledOnBlock}
            CONCEPTS={CONCEPTS}
            DIETAS_OPCIONES={DIETAS_OPCIONES}
            SI_NO={SI_NO}
            parseDietas={parseDietas}
            formatDietas={formatDietas}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('Pol Peitx')).toBeInTheDocument();
    expect(screen.getByText('Eléctrico factura')).toBeInTheDocument();
  });

  it('shows only editable schedule inputs in the header cell for working days', () => {
    const semana = ['2025-01-06'];
    const list = [{ role: 'EL', name: 'Juan' }];
    const collapsed = {};
    const setCollapsed = fn => fn(collapsed);

    render(
      <table>
        <tbody>
          <ReportPersonRows
            list={list}
            block='base'
            scheduleWindowForISO={scheduleWindowForISO}
            onScheduleChange={onScheduleChange}
            semana={semana}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            data={{}}
            setCell={noop}
            findWeekAndDay={findWeekAndDay}
            isPersonScheduledOnBlock={isPersonScheduledOnBlock}
            CONCEPTS={CONCEPTS}
            DIETAS_OPCIONES={DIETAS_OPCIONES}
            SI_NO={SI_NO}
            parseDietas={parseDietas}
            formatDietas={formatDietas}
          />
        </tbody>
      </table>
    );

    const timeInputs = screen.getAllByDisplayValue(/^(08:00|17:00)$/);
    expect(timeInputs).toHaveLength(2);
    expect(screen.queryByText(/Localització|Localización|Rodaje|Rodatge/i)).not.toBeInTheDocument();
  });

  it('normalizes single-digit hour edits instead of clearing the other value', () => {
    const semana = ['2025-01-06'];
    const list = [{ role: 'EL', name: 'Juan' }];
    const collapsed = {};
    const setCollapsed = fn => fn(collapsed);
    const onScheduleChangeMock = vi.fn();
    const scheduleWindowSingleDigit = () => ({ start: '9:00', end: '23:00', isRest: false });

    render(
      <table>
        <tbody>
          <ReportPersonRows
            list={list}
            block='base'
            scheduleWindowForISO={scheduleWindowSingleDigit}
            onScheduleChange={onScheduleChangeMock}
            semana={semana}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            data={{}}
            setCell={noop}
            findWeekAndDay={findWeekAndDay}
            isPersonScheduledOnBlock={isPersonScheduledOnBlock}
            CONCEPTS={CONCEPTS}
            DIETAS_OPCIONES={DIETAS_OPCIONES}
            SI_NO={SI_NO}
            parseDietas={parseDietas}
            formatDietas={formatDietas}
          />
        </tbody>
      </table>
    );

    const endInput = screen.getByDisplayValue('23:00');
    fireEvent.focus(endInput);
    fireEvent.change(endInput, { target: { value: '20:00' } });
    fireEvent.blur(endInput);

    expect(onScheduleChangeMock).toHaveBeenCalledWith('base', '2025-01-06', 'end', '20:00', 'EL__Juan');
  });
});
