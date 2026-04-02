import { describe, expect, it } from 'vitest';

import { storageKeyFor } from './helpers';

describe('calcPublicidad storageKeyFor', () => {
  it('uses roleId for custom roles so diario payroll can read report data', () => {
    expect(storageKeyFor('E', 'Pol Peitx', undefined, 'electric_factura')).toBe('electric_factura__Pol Peitx');
    expect(storageKeyFor('EP', 'Pol Peitx', 'pre', 'electric_factura')).toBe('electric_factura.pre__Pol Peitx');
    expect(storageKeyFor('ER', 'Pol Peitx', 'pick', 'electric_factura')).toBe('electric_factura.pick__Pol Peitx');
  });
});
