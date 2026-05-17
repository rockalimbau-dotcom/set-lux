import { describe, expect, it } from 'vitest';

import {
  PRICE_KEY_FESTIVO,
  PRICE_KEY_LEGACY_FESTIVO,
  migratePriceRow,
} from './priceKeys';

describe('migratePriceRow', () => {
  it('moves legacy festivo key to Precio Festivo', () => {
    const migrated = migratePriceRow({
      [PRICE_KEY_LEGACY_FESTIVO]: '175',
      'Precio jornada': '100',
    });

    expect(migrated[PRICE_KEY_FESTIVO]).toBe('175');
    expect(migrated[PRICE_KEY_LEGACY_FESTIVO]).toBeUndefined();
  });
});
