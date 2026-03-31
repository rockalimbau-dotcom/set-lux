import { describe, expect, it } from 'vitest';

import { visibleRoleFor } from './aggregationHelpers';

describe('payroll diario visibleRoleFor', () => {
  it('keeps base role for base-source member scheduled in prelight', () => {
    expect(visibleRoleFor('EP', 'Ricard Durany', new Set(), 'base')).toBe('E');
  });

  it('keeps pickup suffix for dedicated pickup crew', () => {
    expect(visibleRoleFor('ER', 'Ricard Durany', new Set(), 'pick')).toBe('ER');
  });
});
