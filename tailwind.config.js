/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"Segoe UI"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#e7f9ee',
          100: '#c8f0d7',
          200: '#96e3b1',
          300: '#5dd189',
          400: '#31c169',
          500: '#25D366',
          600: '#1da851',
          700: '#128C7E',
          800: '#0c6b5e',
          900: '#075E54',
        },
        surface: {
          light: '#ffffff',
          dark: '#111318',
        },
        telegram: {
          500: '#2AABEE',
          600: '#229ED9',
        },
      },
      backgroundImage: {
        'insta-gradient': 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
        'insta-gradient-soft': 'linear-gradient(135deg, #34cd7a 0%, #25D366 50%, #128C7E 100%)',
      },
      keyframes: {
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.92) translateY(4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'typing-dot': {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%': { transform: 'translateY(-4px)', opacity: '1' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.15s ease-out',
        'typing-dot': 'typing-dot 1.2s infinite ease-in-out',
      },
    },
  },
  plugins: [],
};
