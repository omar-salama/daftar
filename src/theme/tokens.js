/**
 * Semantic theme tokens for Daftar design system.
 * Serves as the single source of truth for Tailwind configuration and JavaScript/React Native styling.
 */
const tokens = {
  colors: {
    surface: {
      DEFAULT: 'var(--color-surface)',
      elevated: 'var(--color-surface-elevated)',
      hover: 'var(--color-surface-hover)',
      overlay: 'var(--color-surface-overlay)',
    },
    border: {
      DEFAULT: 'var(--color-border)',
      strong: 'var(--color-border-strong)',
    },
    foreground: {
      DEFAULT: 'var(--color-foreground)',
      secondary: 'var(--color-foreground-secondary)',
      muted: 'var(--color-foreground-muted)',
      tertiary: 'var(--color-foreground-tertiary)',
      placeholder: 'var(--color-foreground-placeholder)',
    },
    brand: {
      DEFAULT: 'var(--color-brand)',
      active: 'var(--color-brand-active)',
    },
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
  },
};

module.exports = { tokens };
