/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#60a5fa', // Azul claro para enlaces y acentos
          DEFAULT: '#f97316', // Naranja brillante principal
          dark: '#ea580c', // Naranja más oscuro
        },
        accent: {
          DEFAULT: '#60a5fa', // Azul claro para acentos
        },
        neutral: {
          bg: '#1a2b40', // Azul marino profundo de fondo
          panel: '#2a4058', // Azul oscuro para paneles
          border: '#3b5568', // Borde más suave
          text: '#ffffff', // Texto blanco
          surface: '#1e3a52', // Superficie de inputs
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
