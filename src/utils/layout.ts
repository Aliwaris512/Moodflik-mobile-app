export type SizeClass = 'compact' | 'regular' | 'medium' | 'expanded';

export const RAIL_WIDTH = 88;

/**
 * Layout rules shared by every screen. Widths are in dp/pt.
 * - compact  (<360): flip-phone cover screens, small/zoomed phones
 * - regular  (<600): normal phones in portrait, folded foldables
 * - medium   (<840): unfolded foldables, small tablets
 * - expanded (840+): tablets, desktops
 */
export function getLayout(width: number, height: number) {
  const size: SizeClass =
    width < 360 ? 'compact' : width < 600 ? 'regular' : width < 840 ? 'medium' : 'expanded';
  const landscape = width > height;
  // Side navigation rail when there is room: unfolded foldables, tablets, and phones turned sideways
  // (a bottom bar would eat too much of a short landscape screen).
  const rail = width >= 700 || (landscape && width >= 560);
  const available = width - (rail ? RAIL_WIDTH : 0);
  return {
    width,
    height,
    size,
    landscape,
    compact: size === 'compact',
    rail,
    /** Side padding for screen content. */
    gutter: size === 'compact' ? 12 : size === 'regular' ? 16 : 24,
    /** Max width of a single reading column. */
    contentMax: size === 'expanded' ? 760 : 640,
    /** Room to show two panes side by side (e.g. profile details + posts). */
    twoPane: available >= 640,
    /** Room for an extra side column next to the feed. */
    sideColumn: available >= 960,
    /** Short screens (landscape phones) get a slimmer header. */
    short: height < 500,
  };
}

export type ResponsiveLayout = ReturnType<typeof getLayout>;
