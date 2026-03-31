import { describe, expect, it } from 'vitest';

import { determineRoleDisplay } from './rowHelpers';

describe('determineRoleDisplay', () => {
  it('keeps base role code for base crew working only in prelight', () => {
    expect(determineRoleDisplay('E', 'E', 0, 2, 0)).toBe('E');
  });

  it('keeps base role code for base crew working only in pickup', () => {
    expect(determineRoleDisplay('E', 'E', 0, 0, 2)).toBe('E');
  });

  it('preserves prelight suffix when the role was created from prelight team', () => {
    expect(determineRoleDisplay('EP', 'E', 0, 2, 0)).toBe('EP');
  });

  it('preserves pickup suffix when the role was created from pickup team', () => {
    expect(determineRoleDisplay('ER', 'E', 0, 0, 2)).toBe('ER');
  });
});
