/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          50: '#e6f1ff',
          100: '#cce4ff',
          200: '#99c8ff',
          300: '#66adff',
          400: '#3391ff',
          500: '#0D47A1', // Primary blue
          600: '#0b3d8a',
          700: '#093473',
          800: '#072a5c',
          900: '#041f45',
          DEFAULT: '#0D47A1',
          foreground: '#FFFFFF',
        },
        // Secondary - Teal
        secondary: {
          50: '#e0f7fa',
          100: '#b2ebf2',
          200: '#80deea',
          300: '#4dd0e1',
          400: '#26c6da',
          500: '#00BCD4', // Secondary teal
          600: '#00acc1',
          700: '#0097a7',
          800: '#00838f',
          900: '#006064',
          DEFAULT: '#00BCD4',
          foreground: '#FFFFFF',
        },
        // Accent - Coral
        accent: {
          50: '#ffebee',
          100: '#ffcdd2',
          200: '#ef9a9a',
          300: '#e57373',
          400: '#ef5350',
          500: '#FF5722', // Accent coral
          600: '#f4511e',
          700: '#e64a19',
          800: '#d84315',
          900: '#bf360c',
          DEFAULT: '#FF5722',
          foreground: '#FFFFFF',
        },
        // Grayscale
        gray: {
          50: '#F5F7FA', // Background light gray
          100: '#EDF2F7',
          200: '#E2E8F0',
          300: '#CBD5E0',
          400: '#A0AEC0',
          500: '#718096',
          600: '#4A5568',
          700: '#2D3748',
          800: '#1A202C',
          900: '#263238', // Text dark gray
        },
        // Feedback colors
        success: '#10B981', // Green
        warning: '#FBBF24', // Yellow 
        error: '#EF4444',   // Red
        info: '#3B82F6',    // Blue
        
        // UI specific colors
        border: 'hsl(220, 13%, 91%)',
        input: 'hsl(220, 13%, 91%)',
        ring: 'hsl(224, 98%, 58%)',
        background: '#F5F7FA',
        foreground: '#263238',
        
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F5F7FA',
          foreground: '#4A5568',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#263238',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#263238',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem',  // 2px
        DEFAULT: '0.25rem', // 4px
        md: '0.375rem',  // 6px
        lg: '0.5rem',    // 8px
        xl: '0.75rem',   // 12px
        '2xl': '1rem',   // 16px
        '3xl': '1.5rem', // 24px
        full: '9999px',  // Fully rounded
      },
      boxShadow: {
        xs: '0 0 0 1px rgba(0, 0, 0, 0.05)',
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        outline: '0 0 0 3px rgba(13, 71, 161, 0.5)', // Primary color based
        none: 'none',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "fade-out": {
          from: { opacity: 1 },
          to: { opacity: 0 },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: 0 },
          to: { transform: "scale(1)", opacity: 1 },
        },
        "scale-out": {
          from: { transform: "scale(1)", opacity: 1 },
          to: { transform: "scale(0.95)", opacity: 0 },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "pulse": {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        "spin-reverse": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(-360deg)" },
        },
        "bounce-delayed": {
          '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
          '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "scale-out": "scale-out 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-out",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "reverse": "spin-reverse 3s linear infinite",
        "bounce-delayed": "bounce-delayed 1s infinite",
        "delay-100": "1s",
      },
    },
  },
  plugins: [
    // We need a different approach that doesn't use top-level await
    function({ addBase, addComponents, addUtilities, theme }) {
      // This is a placeholder for the actual plugins
      // We'll just add the core functionality directly here
      
      // Basic form styles (inspired by @tailwindcss/forms)
      addBase({
        '[type="text"],[type="email"],[type="url"],[type="password"],[type="number"],[type="date"],[type="datetime-local"],[type="month"],[type="search"],[type="tel"],[type="time"],[type="week"],[multiple],textarea,select': {
          'appearance': 'none',
          'background-color': '#fff',
          'border-color': theme('colors.gray.300', 'currentColor'),
          'border-width': '1px',
          'border-radius': theme('borderRadius.DEFAULT', '0.25rem'),
          'padding-top': theme('spacing.2', '0.5rem'),
          'padding-right': theme('spacing.3', '0.75rem'),
          'padding-bottom': theme('spacing.2', '0.5rem'),
          'padding-left': theme('spacing.3', '0.75rem'),
          'line-height': theme('lineHeight.normal', '1.5'),
          '&:focus': {
            'outline': 'none',
            'ring-width': '2px',
            'ring-color': theme('colors.primary.500', '#3b82f6'),
            'border-color': theme('colors.primary.500', '#3b82f6'),
          },
        },
      });
    },
  ],
}
