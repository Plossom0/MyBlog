/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FBF9F4',
        ink: '#2A2723',
        clay: '#B85C38',
        moss: '#3D5A4C',
        muted: '#8B847A',
        line: '#E6E0D6',
        codebg: '#1E1B17',
      },
      fontFamily: {
        display: ['var(--font-sans)'],
        serif: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      maxWidth: {
        prose: '720px',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out both',
        'fade-in': 'fadeIn 0.5s ease-out both',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
