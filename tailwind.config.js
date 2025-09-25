/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#60a5fa',
          DEFAULT: '#2563eb',
          dark: '#1e40af',
        },
        accent: {
          DEFAULT: '#F59E0B',
        },
        neutral: {
          bg: '#0d0d0d',
          panel: '#1a1a1a',
          border: '#2d2d2d',
          text: '#e5e5e5',
          surface: '#141414',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(37,99,235,0.25)',
      },
    },
  },
  plugins: [],
};
