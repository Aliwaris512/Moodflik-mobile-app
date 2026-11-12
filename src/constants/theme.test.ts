import { describe, expect, test } from 'bun:test';
import { colors, fonts, layout } from './theme';

describe('Moodflik design tokens', () => {
  test('preserves the reference palette', () => {
    expect(colors.primary).toBe('#6D0AC7');
    expect(colors.secondary).toBe('#6D0AC7');
    expect(colors.accent).toBe('#1BDAB5');
    expect(colors.background).toBe('#F2F2F2');
  });

  test('uses the bundled Moodflik font family names and accessible targets', () => {
    expect(fonts.nunitoRegular).toBe('Nunito-Regular');
    expect(fonts.latoBold).toBe('Lato-Bold');
    expect(layout.touchTarget).toBeGreaterThanOrEqual(44);
  });
});
