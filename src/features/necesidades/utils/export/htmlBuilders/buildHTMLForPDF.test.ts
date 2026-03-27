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
});
