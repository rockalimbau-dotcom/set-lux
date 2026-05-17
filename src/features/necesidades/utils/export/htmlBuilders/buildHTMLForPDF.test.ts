import { describe, expect, it } from 'vitest';
import { buildNecesidadesHTMLForPDF } from './buildHTMLForPDF';

describe('buildNecesidadesHTMLForPDF', () => {
  it('keeps real calendar dates after filtering an empty rest day', () => {
    const html = buildNecesidadesHTMLForPDF(
      { nombre: 'Proyecto Test' },
      'Semana 1',
      '2026-03-02',
      [
        { crewTipo: 'Descanso' },
        { crewTipo: 'Rodaje', crewList: [{ role: 'G', name: 'bbbb' }] },
        { crewTipo: 'Rodaje' },
        { crewTipo: 'Rodaje' },
        { crewTipo: 'Rodaje' },
        {},
        {},
      ]
    );

    expect(html).not.toContain('<br/>02/03');
    expect(html).toContain('<br/>03/03');
    expect(html).toContain('<br/>04/03');
    expect(html).toContain('<br/>05/03');
    expect(html).toContain('<br/>06/03');
  });

  it('applies jornada palette colors to day headers and crew cells', () => {
    const html = buildNecesidadesHTMLForPDF(
      { nombre: 'Proyecto Test' },
      'Semana 1',
      '2026-03-02',
      [
        {
          crewTipo: 'Rodaje',
          crewList: [{ role: 'G', name: 'Ana' }],
          crewStart: '07:00',
          crewEnd: '20:00',
        },
        { crewTipo: 'Carga' },
        {},
        {},
        {},
        {},
        {},
      ]
    );

    expect(html).toContain('background:#EFF6FF');
    expect(html).toContain('background:#BFDBFE');
    expect(html).toContain('background:#FFF7ED');
    expect(html).toContain('border:1px solid #60A5FA');
  });

  it('renders custom roleLabel in crew rows when available', () => {
    const html = buildNecesidadesHTMLForPDF(
      { nombre: 'Proyecto Test' },
      'Semana 1',
      '2026-03-02',
      [
        {
          crewTipo: 'Rodaje',
          crewList: [{ role: 'E', roleId: 'electric_night', roleLabel: 'Eléctrico noche', name: 'Ana' }],
        },
        {},
        {},
        {},
        {},
        {},
        {},
      ]
    );

    expect(html).toContain('Eléctrico noche');
    expect(html).toContain('Ana');
  });

  it('applies gender to slash role labels in crew rows', () => {
    const html = buildNecesidadesHTMLForPDF(
      { nombre: 'Proyecto Test' },
      'Semana 1',
      '2026-03-02',
      [
        {
          crewTipo: 'Rodaje',
          crewList: [{ role: 'E', roleId: 'e_default', roleLabel: 'Eléctrico/a', name: 'Ana', gender: 'female' }],
        },
        {},
        {},
        {},
        {},
        {},
        {},
      ]
    );

    expect(html).toContain('Eléctrica');
    expect(html).not.toContain('Eléctrico/a');
  });

  it('matches the same neutral role label used in team rows', () => {
    const html = buildNecesidadesHTMLForPDF(
      { nombre: 'Proyecto Test' },
      'Semana 1',
      '2026-03-02',
      [
        {
          crewTipo: 'Rodaje',
          crewList: [{ role: 'E', roleId: 'e_default', roleLabel: 'Eléctrico/a', name: 'Alex', gender: 'neutral' }],
        },
        {},
        {},
        {},
        {},
        {},
        {},
      ]
    );

    expect(html).toContain('Electric@');
    expect(html).not.toContain('Eléctrico/a');
  });

  it('translates stored jornada aliases in schedule headers', () => {
    const html = buildNecesidadesHTMLForPDF(
      { nombre: 'Proyecto Test' },
      'Semana 1',
      '2026-03-02',
      [
        {
          prelightTipo: 'Pickup',
          preStart: '08:00',
          preEnd: '10:00',
          preList: [{ role: 'E', name: 'Ana' }],
        },
        {},
        {},
        {},
        {},
        {},
        {},
      ]
    );

    expect(html).toContain('Recogida | 08:00 - 10:00');
  });

  it('includes table styles that wrap very long unbroken text in cells', () => {
    const longText = 'k'.repeat(120);
    const html = buildNecesidadesHTMLForPDF(
      { nombre: 'Proyecto Test' },
      'Semana 1',
      '2026-03-02',
      [
        {
          crewTipo: 'Rodaje',
          loc: longText,
          needTransport: longText,
          obs: longText,
        },
        {},
        {},
        {},
        {},
        {},
        {},
      ]
    );

    expect(html).toContain('table-layout: fixed');
    expect(html).toContain('overflow-wrap: anywhere');
    expect(html).toContain(longText);
  });
});
