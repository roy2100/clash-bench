/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Cascadia Code"', '"Cascadia Mono"', 'Consolas', '"Courier New"', 'monospace'],
        sans: ['"Segoe UI Variable"', '"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Fluent 2 neutral surfaces
        fn: {
          1: '#ffffff',
          2: '#f5f5f5',
          3: '#f0f0f0',
          4: '#ebebeb',
        },
        // Fluent 2 foreground
        ff: {
          1: '#242424',
          2: '#424242',
          3: '#616161',
          4: '#898989',
        },
        // Fluent 2 stroke
        fs: {
          1: '#d1d1d1',
          2: '#c7c7c7',
        },
        // Fluent brand blue
        brand: {
          DEFAULT: '#0078d4',
          hover: '#106ebe',
          pressed: '#005a9e',
          light: '#eff6fc',
          tint: '#cce4f6',
        },
        grade: {
          S: '#00b4d8',
          A: '#38b000',
          B: '#85bb00',
          C: '#f5a623',
          D: '#f76707',
          F: '#e03131',
        },
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        md: '4px',
        lg: '6px',
        xl: '8px',
        '2xl': '12px',
      },
      boxShadow: {
        f2: '0 1px 2px rgba(0,0,0,0.12), 0 0 2px rgba(0,0,0,0.08)',
        f4: '0 2px 4px rgba(0,0,0,0.14), 0 0 2px rgba(0,0,0,0.12)',
        f8: '0 4px 8px rgba(0,0,0,0.14), 0 0 2px rgba(0,0,0,0.12)',
        f16: '0 8px 16px rgba(0,0,0,0.14), 0 0 2px rgba(0,0,0,0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
    },
  },
  plugins: [],
}
