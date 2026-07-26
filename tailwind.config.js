const { tokens } = require('./src/theme/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: tokens.colors,
      spacing: tokens.spacing,
      borderRadius: tokens.rounded,
      fontFamily: {
        sans: ['Inter'],
        mono: ['JetBrainsMono'],
      },
    },
  },
  plugins: [],
};
