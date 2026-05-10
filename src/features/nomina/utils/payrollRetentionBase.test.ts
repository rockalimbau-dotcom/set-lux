import { describe, expect, it } from 'vitest';
import { baseEstadoPercentApplied, DEFAULT_ESTADO_SOCIAL_PERCENT, retentionBaseIrpfEstado } from './payrollRetentionBase';

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

describe('baseEstadoPercentApplied', () => {
  it('returns gross for Estado % (cotización aprox. sobre bruto íntegro)', () => {
    expect(baseEstadoPercentApplied(2236)).toBe(2236);
    expect(baseEstadoPercentApplied(-10)).toBe(0);
  });
});

describe('DEFAULT_ESTADO_SOCIAL_PERCENT', () => {
  it('matches sum of typical worker SS rates on payslip (CC+MEI+FP+desempleo)', () => {
    expect(DEFAULT_ESTADO_SOCIAL_PERCENT).toBeCloseTo(4.7 + 0.15 + 0.1 + 1.6, 10);
  });
});

