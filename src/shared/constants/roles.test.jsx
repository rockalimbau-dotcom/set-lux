import { describe, it, expect } from 'vitest';
import {
  ROLE_ORDER,
  ROLES,
  ROLE_COLORS,
  roleRank,
  ROLE_CODE_TO_LABEL,
  roleLabelFromCode,
} from './roles.ts';

describe('roles', () => {
  describe('ROLE_ORDER', () => {
    it('contains all role codes in correct order', () => {
      expect(ROLE_ORDER).toEqual(['G', 'BB', 'E', 'TM', 'FB', 'AUX', 'M', 'REF']);
    });

    it('has 8 role codes', () => {
      expect(ROLE_ORDER).toHaveLength(8);
    });
  });

  describe('ROLES', () => {
    it('contains all roles with correct structure', () => {
      expect(ROLES).toHaveLength(8);
      
      ROLES.forEach(role => {
        expect(role).toHaveProperty('code');
        expect(role).toHaveProperty('label');
        expect(typeof role.code).toBe('string');
        expect(typeof role.label).toBe('string');
      });
    });

    it('has correct role codes', () => {
      const codes = ROLES.map(role => role.code);
      expect(codes).toEqual(['G', 'BB', 'E', 'TM', 'FB', 'AUX', 'M', 'REF']);
    });

    it('has correct role labels', () => {
      const labels = ROLES.map(role => role.label);
      expect(labels).toEqual([
        'Gaffer',
        'Best Boy',
        'Eléctrico/a',
        'Técnico de mesa',
        'Finger Boy',
        'Auxiliar',
        'Meritorio',
        'Refuerzo Eléctrico'
      ]);
    });
  });

  describe('ROLE_COLORS', () => {
    it('has colors for all role codes', () => {
      ROLE_ORDER.forEach(code => {
        expect(ROLE_COLORS[code]).toBeDefined();
        expect(ROLE_COLORS[code]).toHaveProperty('bg');
        expect(ROLE_COLORS[code]).toHaveProperty('fg');
      });
    });

    it('has valid color values', () => {
      Object.values(ROLE_COLORS).forEach(color => {
        expect(typeof color.bg).toBe('string');
        expect(typeof color.fg).toBe('string');
        expect(color.bg).toMatch(/linear-gradient|#[0-9A-Fa-f]{6}/);
        expect(color.fg).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('has specific color values', () => {
      expect(ROLE_COLORS.G.bg).toContain('linear-gradient');
      expect(ROLE_COLORS.G.fg).toBe('#0b0b0b');
      expect(ROLE_COLORS.E.bg).toContain('#FDE047');
      expect(ROLE_COLORS.E.bg).toContain('#F59E0B');
    });
  });

  describe('roleRank', () => {
    it('returns correct rank for valid role codes', () => {
      expect(roleRank('G')).toBe(0);
      expect(roleRank('BB')).toBe(1);
      expect(roleRank('E')).toBe(2);
      expect(roleRank('TM')).toBe(3);
      expect(roleRank('FB')).toBe(4);
      expect(roleRank('AUX')).toBe(5);
      expect(roleRank('M')).toBe(6);
      expect(roleRank('REF')).toBe(7);
    });

    it('returns 999 for invalid role codes', () => {
      expect(roleRank('INVALID')).toBe(999);
      expect(roleRank('')).toBe(999);
      expect(roleRank('X')).toBe(999);
    });

    it('handles case sensitivity', () => {
      expect(roleRank('g')).toBe(999); // lowercase should return 999
      expect(roleRank('bb')).toBe(999);
    });
  });

  describe('ROLE_CODE_TO_LABEL', () => {
    it('has mappings for all role codes', () => {
      ROLE_ORDER.forEach(code => {
        expect(ROLE_CODE_TO_LABEL[code]).toBeDefined();
        expect(typeof ROLE_CODE_TO_LABEL[code]).toBe('string');
      });
    });

    it('has correct label mappings', () => {
      expect(ROLE_CODE_TO_LABEL.G).toBe('Gaffer');
      expect(ROLE_CODE_TO_LABEL.BB).toBe('Best boy');
      expect(ROLE_CODE_TO_LABEL.E).toBe('Eléctrico');
      expect(ROLE_CODE_TO_LABEL.AUX).toBe('Auxiliar');
      expect(ROLE_CODE_TO_LABEL.M).toBe('Meritorio');
      expect(ROLE_CODE_TO_LABEL.TM).toBe('Técnico de mesa');
      expect(ROLE_CODE_TO_LABEL.FB).toBe('Finger boy');
      expect(ROLE_CODE_TO_LABEL.REF).toBe('Refuerzo');
    });
  });

  describe('roleLabelFromCode', () => {
    it('returns correct label for valid role codes', () => {
      expect(roleLabelFromCode('G')).toBe('Gaffer');
      expect(roleLabelFromCode('BB')).toBe('Best boy');
      expect(roleLabelFromCode('E')).toBe('Eléctrico');
      expect(roleLabelFromCode('AUX')).toBe('Auxiliar');
      expect(roleLabelFromCode('M')).toBe('Meritorio');
      expect(roleLabelFromCode('TM')).toBe('Técnico de mesa');
      expect(roleLabelFromCode('FB')).toBe('Finger boy');
      expect(roleLabelFromCode('REF')).toBe('Refuerzo');
    });

    it('returns original code for invalid role codes', () => {
      expect(roleLabelFromCode('INVALID')).toBe('INVALID');
      expect(roleLabelFromCode('X')).toBe('X');
    });

    it('handles empty and null values', () => {
      expect(roleLabelFromCode('')).toBe('');
      expect(roleLabelFromCode(null)).toBe('');
      expect(roleLabelFromCode(undefined)).toBe('');
    });

    it('handles case sensitivity', () => {
      expect(roleLabelFromCode('g')).toBe('g'); // lowercase should return as-is
      expect(roleLabelFromCode('bb')).toBe('bb');
    });
  });

  describe('integration tests', () => {
    it('ROLE_ORDER and ROLES are consistent', () => {
      const roleCodes = ROLES.map(role => role.code);
      expect(roleCodes).toEqual(ROLE_ORDER);
    });

    it('ROLE_COLORS and ROLE_ORDER are consistent', () => {
      const colorCodes = Object.keys(ROLE_COLORS);
      expect(colorCodes.sort()).toEqual(ROLE_ORDER.sort());
    });

    it('ROLE_CODE_TO_LABEL and ROLE_ORDER are consistent', () => {
      const labelCodes = Object.keys(ROLE_CODE_TO_LABEL);
      expect(labelCodes.sort()).toEqual(ROLE_ORDER.sort());
    });

    it('roleRank works with all role codes', () => {
      ROLE_ORDER.forEach((code, index) => {
        expect(roleRank(code)).toBe(index);
      });
    });
  });
});
