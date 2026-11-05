/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito-Regular'],
        nunito: ['Nunito-Regular'],
        'nunito-medium': ['Nunito-Medium'],
        'nunito-semibold': ['Nunito-SemiBold'],
        'nunito-bold': ['Nunito-Bold'],
        'nunito-black': ['Nunito-Black'],
        lato: ['Lato-Regular'],
        'lato-bold': ['Lato-Bold'],
      },
      colors: {
        brand: '#00234b',
        'brand-2': '#01377d',
        accent: '#1bdab5',
        danger: '#ff6473',
        border: '#d2ddec',
        ink: '#262626',
        muted: '#504f55',
        surface: '#f3f3f4',
      },
    },
  },
  plugins: [],
};
