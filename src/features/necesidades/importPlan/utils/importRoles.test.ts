import { describe, expect, it } from 'vitest';

import { applyImportToNeeds } from './applyImport';
import { buildPreviewWeeks } from './buildPreviewWeeks';

describe('necesidades import roles', () => {
  const baseRoster = [
    {
      role: 'E',
      roleId: 'electric_night',
      roleLabel: 'Eléctrico noche',
      name: 'Ana',
      gender: 'female',
    },
  ];

  it('keeps roleId and roleLabel in preview weeks', () => {
    const weeks = buildPreviewWeeks(
      [
        {
          scope: 'pro',
          startDate: '2026-03-02',
          label: 'Semana 1',
          days: {
            0: {
              dateISO: '2026-03-02',
              weekStart: '2026-03-02',
              dayIndex: 0,
              sequences: [],
              locationSequencesText: 'Set A',
              transportText: '',
              observationsText: '',
              crewStart: '08:00',
              crewEnd: '18:00',
            },
          },
        },
      ],
      baseRoster,
      false
    );

    expect(weeks[0].days[0].crewList?.[0]).toMatchObject({
      role: 'E',
      roleId: 'electric_night',
      roleLabel: 'Eléctrico noche',
      name: 'Ana',
    });
  });

  it('keeps roleId and roleLabel when applying import to needs', () => {
    const result = applyImportToNeeds(
      { pre: [], pro: [] },
      {
        weeks: [
          {
            scope: 'pro',
            startDate: '2026-03-02',
            label: 'Semana 1',
            days: {
              0: {
                dateISO: '2026-03-02',
                weekStart: '2026-03-02',
                dayIndex: 0,
                sequences: [],
                locationSequencesText: 'Set A',
                transportText: '',
                observationsText: '',
                crewStart: '08:00',
                crewEnd: '18:00',
              },
            },
          },
        ],
        warnings: [],
      },
      {},
      baseRoster
    );

    expect(result.pro[0].days[0].crewList[0]).toMatchObject({
      role: 'E',
      roleId: 'electric_night',
      roleLabel: 'Eléctrico noche',
      name: 'Ana',
    });
  });
});
