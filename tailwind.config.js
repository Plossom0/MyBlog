/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 使用 CSS 变量支持深/浅模式切换 + 透明度修饰符
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        clay: 'rgb(var(--color-clay) / <alpha-value>)',
        moss: 'rgb(var(--color-moss) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        codebg: 'rgb(var(--color-codebg) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Exo', 'var(--font-sans)'],
        serif: ['Inter', 'var(--font-sans)'],
        mono: ['Roboto Mono', 'var(--font-mono)'],
      },
      maxWidth: {
        prose: '720px',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out both',
        'fade-in': 'fadeIn 0.5s ease-out both',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
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
        glowPulse: {
          '0%, 100%': { textShadow: '0 0 10px rgba(6, 182, 212, 0.3)' },
          '50%': { textShadow: '0 0 20px rgba(6, 182, 212, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
