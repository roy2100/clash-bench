/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Space Mono', 'Courier New', 'monospace'],
        sans: ['IBM Plex Sans', 'Inter', 'sans-serif'],
      },
      colors: {
        bg: {
          primary: '#050810',
          secondary: '#0a0f1a',
          card: '#0d1525',
          border: 'rgba(255,255,255,0.04)',
        },
        grade: {
          S: '#00d4ff',
          A: '#00e676',
          B: '#a0e02c',
          C: '#ffd740',
          D: '#ff9800',
          F: '#ff4444',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
    },
  },
  plugins: [],
}
