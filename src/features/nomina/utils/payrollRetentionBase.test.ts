import { describe, expect, it } from 'vitest';
import { retentionBaseIrpfEstado } from './payrollRetentionBase';

describe('retentionBaseIrpfEstado', () => {
  it('returns full bruto when exemption off', () => {
    expect(retentionBaseIrpfEstado(1000, 100, false)).toBe(1000);
  });

  it('subtracts dietas when exemption on', () => {
    expect(retentionBaseIrpfEstado(1000, 100, true)).toBe(900);
  });

  it('does not go below zero', () => {
    expect(retentionBaseIrpfEstado(50, 200, true)).toBe(0);
  });

  it('ignores exemption when no dietas', () => {
    expect(retentionBaseIrpfEstado(1000, 0, true)).toBe(1000);
  });
});
