// Modern color scheme for marketing analytics dashboard

export const colors = {
  // Primary brand colors
  primary: {
    50: '#e6f2ff',
    100: '#cce5ff',
    200: '#99caff',
    300: '#66afff',
    400: '#3394ff',
    500: '#0078ff', // Main primary color
    600: '#0065d9',
    700: '#0052b3',
    800: '#003e8c',
    900: '#002a66',
  },
  
  // Secondary accent colors
  secondary: {
    50: '#e6f9f9',
    100: '#ccf3f4',
    200: '#99e8e9',
    300: '#66dcde',
    400: '#33d1d3',
    500: '#00c5c8', // Main secondary color
    600: '#00a7a9',
    700: '#00898b',
    800: '#006a6c',
    900: '#004c4d',
  },
  
  // Success colors
  success: {
    50: '#e6f9ee',
    100: '#ccf3dd',
    200: '#99e8bc',
    300: '#66dc9a',
    400: '#33d179',
    500: '#00c558', // Main success color
    600: '#00a74b',
    700: '#00893d',
    800: '#006a2f',
    900: '#004c21',
  },
  
  // Warning colors
  warning: {
    50: '#fff9e6',
    100: '#fff3cc',
    200: '#ffe799',
    300: '#ffdb66',
    400: '#ffcf33',
    500: '#ffc300', // Main warning color
    600: '#d9a600',
    700: '#b38800',
    800: '#8c6a00',
    900: '#664c00',
  },
  
  // Danger colors
  danger: {
    50: '#fdeaec',
    100: '#fbd5d9',
    200: '#f7abb3',
    300: '#f3818d',
    400: '#ef5767',
    500: '#eb2d41', // Main danger color
    600: '#c82637',
    700: '#a51f2d',
    800: '#821923',
    900: '#5e1219',
  },
  
  // Modern gray scale
  gray: {
    50: '#f9fafb',
    100: '#f4f5f7',
    200: '#e5e7eb',
    300: '#d2d6dc',
    400: '#9fa6b2',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Chart colors (for data visualization)
  chart: [
    '#0078ff', // primary
    '#00c5c8', // secondary
    '#eb2d41', // danger
    '#00c558', // success
    '#ffc300', // warning
    '#9061F9', // purple
    '#E74694', // pink
    '#74CAFF', // light blue
    '#FFA26B'  // orange
  ],
  
  // Glass effect colors
  glass: {
    background: 'rgba(255, 255, 255, 0.8)',
    border: 'rgba(255, 255, 255, 0.18)',
    glow: 'rgba(255, 255, 255, 0.25)',
    shadow: 'rgba(31, 38, 135, 0.37)'
  }
};

// Gradient presets for charts and UI elements
export const gradients = {
  primary: 'linear-gradient(135deg, #0078ff 0%, #00c5c8 100%)',
  success: 'linear-gradient(135deg, #00c558 0%, #00c5c8 100%)',
  warning: 'linear-gradient(135deg, #ffc300 0%, #ff9500 100%)',
  danger: 'linear-gradient(135deg, #eb2d41 0%, #ff6e6e 100%)',
  dark: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
  light: 'linear-gradient(135deg, #f9fafb 0%, #f4f5f7 100%)',
  chart: {
    blue: 'linear-gradient(180deg, rgba(0, 120, 255, 0.3) 0%, rgba(0, 120, 255, 0) 100%)',
    teal: 'linear-gradient(180deg, rgba(0, 197, 200, 0.3) 0%, rgba(0, 197, 200, 0) 100%)',
    green: 'linear-gradient(180deg, rgba(0, 197, 88, 0.3) 0%, rgba(0, 197, 88, 0) 100%)',
    red: 'linear-gradient(180deg, rgba(235, 45, 65, 0.3) 0%, rgba(235, 45, 65, 0) 100%)',
  }
};

// Shadow styles
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  outline: '0 0 0 3px rgba(0, 120, 255, 0.5)',
  none: 'none'
};

// Customize typography
export const typography = {
  fontFamily: {
    sans: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    serif: '"Merriweather", Georgia, Cambria, "Times New Roman", Times, serif',
    mono: '"Roboto Mono", SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '4rem',
  }
};
