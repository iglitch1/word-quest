/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: { light: '#4ade80', DEFAULT: '#16a34a', dark: '#15803d' },
        ocean: { light: '#67e8f9', DEFAULT: '#06b6d4', dark: '#0891b2' },
        sky: { light: '#93c5fd', DEFAULT: '#3b82f6', dark: '#2563eb' },
        volcano: { light: '#fca5a5', DEFAULT: '#ef4444', dark: '#dc2626' },
        star: { light: '#c4b5fd', DEFAULT: '#8b5cf6', dark: '#7c3aed' },
        sun: { light: '#fde68a', DEFAULT: '#f59e0b', dark: '#d97706' },
        coin: '#fbbf24',
      },
      fontFamily: {
        game: ['Nunito', 'Quicksand', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'coin-spin': 'coin-spin 0.6s ease-out',
        'star-pop': 'star-pop 0.5s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(251, 191, 36, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(251, 191, 36, 0.8)' },
        },
        'coin-spin': {
          '0%': { transform: 'rotateY(0deg) scale(1)' },
          '50%': { transform: 'rotateY(180deg) scale(1.3)' },
          '100%': { transform: 'rotateY(360deg) scale(1)' },
        },
        'star-pop': {
          '0%': { transform: 'scale(0) rotate(-30deg)', opacity: '0' },
          '60%': { transform: 'scale(1.3) rotate(10deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
      },
    },
  },
  plugins: [],
}
