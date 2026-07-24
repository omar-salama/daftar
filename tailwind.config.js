/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0a0a0a',
          elevated: '#141414',
          overlay: '#1c1c1e',
        },
        border: {
          DEFAULT: '#2c2c2e',
          subtle: '#1c1c1e',
        },
        text: {
          DEFAULT: '#f5f5f7',
          secondary: '#a1a1aa',
          tertiary: '#71717a',
        },
        accent: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        income: '#22c55e',
        expense: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter'],
        mono: ['JetBrainsMono'],
      },
    },
  },
  plugins: [],
};
