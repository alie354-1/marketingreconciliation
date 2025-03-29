// Modern Marketing Analytics Dashboard Theme

import { colors, gradients, shadows, typography } from './colors';

// Spacing scale (for margins, paddings, etc.)
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  28: '7rem',      // 112px
  32: '8rem',      // 128px
  36: '9rem',      // 144px
  40: '10rem',     // 160px
  48: '12rem',     // 192px
  56: '14rem',     // 224px
  64: '16rem',     // 256px
  72: '18rem',     // 288px
  80: '20rem',     // 320px
  96: '24rem',     // 384px
};

// Border radius
export const borderRadius = {
  none: '0',
  xs: '0.125rem',  // 2px
  sm: '0.25rem',   // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  '3xl': '1.5rem', // 24px
  '4xl': '2rem',   // 32px
  full: '9999px',  // Fully rounded (circles)
};

// Transitions
export const transitions = {
  fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  standard: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
};

// Z-index values
export const zIndices = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
  tooltip: 1700,
};

// Animation presets
export const animations = {
  fadeIn: 'fadeIn 500ms ease-in-out forwards',
  slideUp: 'slideUp 300ms ease-out forwards',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  bounce: 'bounce 1s ease infinite',
  spin: 'spin 1s linear infinite',
};

// Breakpoints for responsive design (matches tailwind defaults)
export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Glass effect styles
export const glassEffects = {
  light: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  },
  dark: {
    background: 'rgba(17, 24, 39, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  },
  blue: {
    background: 'rgba(0, 120, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 120, 255, 0.18)',
    boxShadow: '0 8px 32px 0 rgba(0, 120, 255, 0.2)',
  },
};

// CSS variables for ThemeProvider
export const cssVariables = {
  colors: {
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    accent: 'var(--color-accent)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    background: 'var(--color-background)',
    text: 'var(--color-text)',
  },
};

// Combine all theme values
export const theme = {
  colors,
  gradients,
  shadows,
  typography,
  spacing,
  borderRadius,
  transitions,
  zIndices,
  animations,
  breakpoints,
  glassEffects,
  cssVariables,
};

export default theme;
