import { describe, expect, test } from 'bun:test';
import { getLayout } from './layout';

describe('responsive layout', () => {
  test('flip cover screens and small phones are compact with a bottom bar', () => {
    const flipCover = getLayout(300, 340);
    expect(flipCover.compact).toBe(true);
    expect(flipCover.rail).toBe(false);
    expect(getLayout(320, 640).size).toBe('compact');
  });

  test('regular phones and folded foldables use a single column with a bottom bar', () => {
    for (const [w, h] of [
      [393, 852],
      [440, 956],
      [411, 960],
    ]) {
      const layout = getLayout(w, h);
      expect(layout.size).toBe('regular');
      expect(layout.rail).toBe(false);
      expect(layout.twoPane).toBe(false);
    }
  });

  test('unfolded foldables get a navigation rail and two panes', () => {
    const fold = getLayout(760, 840);
    expect(fold.size).toBe('medium');
    expect(fold.rail).toBe(true);
    expect(fold.twoPane).toBe(true);
    expect(fold.sideColumn).toBe(false);
  });

  test('phones in landscape switch to the rail and a slim header', () => {
    const landscape = getLayout(852, 393);
    expect(landscape.rail).toBe(true);
    expect(landscape.short).toBe(true);
  });

  test('tablets get the feed side column', () => {
    expect(getLayout(1194, 834).sideColumn).toBe(true);
  });
});
