import { describe, expect, it } from 'vitest';
import { safeRedirect } from './auth';
describe('sign-in redirects', () => {
  it('keeps local return destinations and rejects external or browser-normalized URLs', () => {
    expect(safeRedirect('/checkout')).toBe('/checkout');
    expect(safeRedirect('/products?q=phone%20case')).toBe('/products?q=phone%20case');
    for (const value of [undefined, 'https://attacker.test', '//attacker.test', '/\\attacker.test', '/\n/attacker.test']) {
      expect(safeRedirect(value)).toBe('/account');
    }
  });
});
