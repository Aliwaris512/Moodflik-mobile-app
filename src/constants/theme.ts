export const colors = {
  primary: '#6D0AC7',
  secondary: '#6D0AC7',
  accent: '#1BDAB5',
  background: '#F2F2F2',
  surface: '#FFFFFF',
  border: '#D2DDEC',
  text: '#262626',
  darkText: '#0C0D0D',
  black: '#000000',
  white: '#FFFFFF',
  lightGray: '#C4C4C4',
  lighterGray: '#E4E4E4',
  lightRed: '#FF6473',
  timeline: '#B2B2B2',
  cyanBlue: '#177BC9',
  muted: '#707070',
  success: '#58BE2F',
  danger: '#D44433',
  // Soft tints of the brand colours, used for chips, icon circles and pressed states.
  primarySoft: '#F1E7FB',
  primaryLight: '#B58BE6',
  successSoft: '#EAF7E4',
  dangerSoft: '#FBEAE8',
  overlay: 'rgba(12,13,13,0.45)',
} as const;

export const fonts = {
  nunitoRegular: 'Nunito-Regular',
  nunitoMedium: 'Nunito-Medium',
  nunitoSemiBold: 'Nunito-SemiBold',
  nunitoBold: 'Nunito-Bold',
  latoRegular: 'Lato-Regular',
  latoBold: 'Lato-Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  h1: { fontFamily: fonts.nunitoBold, fontSize: 24, lineHeight: 30 },
  h2: { fontFamily: fonts.nunitoBold, fontSize: 20, lineHeight: 26 },
  h3: { fontFamily: fonts.nunitoSemiBold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.nunitoRegular, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.nunitoRegular, fontSize: 12, lineHeight: 17 },
  display: { fontFamily: fonts.nunitoBold, fontSize: 30, lineHeight: 38 },
  label: { fontFamily: fonts.nunitoSemiBold, fontSize: 13, lineHeight: 18 },
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const layout = {
  contentMaxWidth: 720,
  touchTarget: 44,
  radius: radius.md,
  tabBarHeight: 64,
  shadow: {
    shadowColor: '#6D0AC7',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  shadowStrong: {
    shadowColor: '#6D0AC7',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
} as const;

export const Colors = {
  light: {
    text: colors.text,
    background: colors.background,
    backgroundElement: colors.surface,
    backgroundSelected: '#E8F2FF',
    textSecondary: colors.muted,
  },
  dark: {
    text: colors.surface,
    background: '#1B1B1B',
    backgroundElement: '#2B2B2B',
    backgroundSelected: '#3A3A3A',
    textSecondary: '#D0D0D0',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;
export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 } as const;
export const Fonts = {
  sans: fonts.nunitoRegular,
  rounded: fonts.nunitoRegular,
  serif: 'serif',
  mono: 'monospace',
} as const;
export const BottomTabInset = 70;
export const MaxContentWidth = layout.contentMaxWidth;
