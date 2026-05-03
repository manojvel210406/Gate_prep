/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e8f0f8',
          100: '#c5d8ee',
          200: '#9ebde3',
          300: '#77a2d8',
          400: '#5a8dce',
          500: '#3d79c4',
          600: '#2d6bb5',
          700: '#1a5aa0',
          800: '#0A3D62',   // main brand blue
          900: '#082e4a',
        },
        gold: {
          100: '#fdf3c8',
          200: '#fae691',
          300: '#f7d85a',
          400: '#D4AF37',   // main gold
          500: '#b8960a',
          600: '#9a7d06',
        },
        surface: '#F5F5F5',
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        bounceSoft: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
      },
      boxShadow: {
        'card': '0 2px 12px rgba(10,61,98,0.08)',
        'card-hover': '0 8px 30px rgba(10,61,98,0.16)',
        'glow': '0 0 20px rgba(212,175,55,0.25)',
      }
    },
  },
  plugins: [],
}
