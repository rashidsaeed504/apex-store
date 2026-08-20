/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
    extend: {
      colors: {
        apex: {
          black: '#050505',
          dark: '#0a0a0a',
          charcoal: '#1a1a1a',
          gray: '#2a2a2a',
          red: '#dc2626',
          'red-dark': '#b91c1c',
          'red-light': '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'red-glow': '0 0 30px rgba(220, 38, 38, 0.3)',
        'red-glow-sm': '0 0 15px rgba(220, 38, 38, 0.2)',
        'red-glow-lg': '0 0 60px rgba(220, 38, 38, 0.4)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-red': 'pulse-red 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          'from': { boxShadow: '0 0 20px rgba(220, 38, 38, 0.2)' },
          'to': { boxShadow: '0 0 40px rgba(220, 38, 38, 0.4)' },
        },
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(220, 38, 38, 0)' },
        },
      },
    },
  },
  plugins: [],
}
