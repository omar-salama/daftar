/**
 * Semantic theme tokens for Daftar design system.
 * Serves as the single source of truth for Tailwind configuration and JavaScript/React Native styling.
 */
const tokens = {
  colors: {
    surface: {
      DEFAULT: '#09090b',
      elevated: '#18181b',
      hover: '#27272a',
      overlay: 'rgba(0,0,0,0.6)',
    },
    border: {
      DEFAULT: '#18181b',
      strong: '#27272a',
    },
    foreground: {
      DEFAULT: '#f4f4f5',
      secondary: '#d4d4d8',
      muted: '#a1a1aa',
      tertiary: '#8e8e93',
      placeholder: '#52525b',
    },
    brand: {
      DEFAULT: '#2563eb',
      active: '#1d4ed8',
    },
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
};

module.exports = { tokens };
