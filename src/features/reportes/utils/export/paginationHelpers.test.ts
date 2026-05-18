import { describe, it, expect } from 'vitest';
import { estimatePersonHeight, paginatePersonKeysForPDF } from './paginationHelpers';

describe('paginationHelpers', () => {
  const concepts = ['Horas extra', 'Turn Around', 'Dietas'];
  const semana = ['2025-05-04', '2025-05-05'];

  it('paginatePersonKeysForPDF moves worker to next page when block does not fit', () => {
    const data: Record<string, Record<string, Record<string, string>>> = {
      p1: {
        'Horas extra': { '2025-05-04': '1', '2025-05-05': '1' },
        'Turn Around': { '2025-05-04': '1' },
        Dietas: { '2025-05-04': 'Comida + Cena + Dieta sin pernoctar' },
      },
      p2: {
        'Horas extra': { '2025-05-04': '2' },
        'Turn Around': { '2025-05-04': '1' },
        Dietas: { '2025-05-04': 'Comida' },
      },
      p3: {
        Dietas: {
          '2025-05-04':
            'Comida + Cena + Dieta sin pernoctar + Dieta con pernocta + Ticket(25) + Otros(10)',
        },
      },
    };

    const pages = paginatePersonKeysForPDF(
      ['p1', 'p2', 'p3'],
      concepts,
      semana,
      data,
      220
    );

    expect(pages.length).toBeGreaterThan(1);
    const lastPage = pages[pages.length - 1];
    expect(lastPage).toContain('p3');
    expect(pages.flat()).toEqual(['p1', 'p2', 'p3']);
  });

  it('estimatePersonHeight grows with longer cell content', () => {
    const short = estimatePersonHeight(
      'p1',
      ['Dietas'],
      semana,
      { p1: { Dietas: { '2025-05-04': 'Comida' } } }
    );
    const long = estimatePersonHeight(
      'p1',
      ['Dietas'],
      semana,
      {
        p1: {
          Dietas: {
            '2025-05-04':
              'Comida + Cena + Dieta sin pernoctar + Dieta con pernocta + Gastos de bolsillo',
            '2025-05-05': 'Comida + Cena + Dieta sin pernoctar',
          },
        },
      }
    );
    expect(long).toBeGreaterThan(short);
  });
});
