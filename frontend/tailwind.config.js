/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8F5F0',
          100: '#C8E6DA',
          200: '#A3D5C2',
          300: '#7CC4A9',
          400: '#55B390',
          500: '#238B57',
          600: '#1E7A4D',
          700: '#155D3B',
          800: '#0D4F4F',
          900: '#0A3A3A',
          950: '#062626',
        },
        accent: {
          50: '#FFF8E1',
          400: '#F59E0B',
          500: '#EAB308',
          600: '#CA8A04',
        },
        surface: {
          light: '#F8FAF8',
          card: '#FFFFFF',
          dark: '#0D2E2E',
        },
        glass: {
          border: 'rgba(255, 255, 255, 0.15)',
          surface: 'rgba(255, 255, 255, 0.08)',
          'card-light': 'rgba(255, 255, 255, 0.85)',
          'card-dark': 'rgba(13, 79, 79, 0.85)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(13, 79, 79, 0.12)',
        'glass-hover': '0 12px 40px 0 rgba(13, 79, 79, 0.2)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
