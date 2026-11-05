/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Mirrors src/constants/theme.ts so className and StyleSheet code look the same.
      colors: {
        primary: { DEFAULT: '#6D0AC7', soft: '#F1E7FB', light: '#B58BE6' },
        accent: '#1BDAB5',
        background: '#F2F2F2',
        surface: '#FFFFFF',
        border: '#D2DDEC',
        ink: '#262626',
        'ink-dark': '#0C0D0D',
        muted: '#707070',
        success: { DEFAULT: '#58BE2F', soft: '#EAF7E4' },
        danger: { DEFAULT: '#D44433', soft: '#FBEAE8' },
        'light-gray': '#C4C4C4',
        'lighter-gray': '#E4E4E4',
        'light-red': '#FF6473',
        timeline: '#B2B2B2',
        'cyan-blue': '#177BC9',
        overlay: 'rgba(12,13,13,0.45)',
      },
      fontFamily: {
        sans: ['Nunito-Regular'],
        'nunito-medium': ['Nunito-Medium'],
        'nunito-semibold': ['Nunito-SemiBold'],
        'nunito-bold': ['Nunito-Bold'],
        lato: ['Lato-Regular'],
        'lato-bold': ['Lato-Bold'],
      },
      borderRadius: { sm: '10px', md: '14px', lg: '20px', xl: '28px' },
      fontSize: {
        display: ['30px', '38px'],
        h1: ['24px', '30px'],
        h2: ['20px', '26px'],
        h3: ['17px', '22px'],
        body: ['15px', '21px'],
        label: ['13px', '18px'],
        caption: ['12px', '17px'],
      },
      minHeight: { touch: '44px' },
      maxWidth: { content: '720px' },
    },
  },
  plugins: [],
};
