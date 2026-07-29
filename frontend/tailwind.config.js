/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        panel: '#F0F8FF',
        panel2: '#EBF3FC',
        border: '#D0E1FD',
        borderStrong: '#B9D3FA',
        ink: '#0F1B33',
        inkDim: '#5B6B8C',
        inkFaint: '#93A4C4',
        accent: '#2F5FE0',
        accentDim: '#E7EFFE',
        ok: '#2ECC71',
        okDim: '#E5FAEF',
        crit: '#E74C3C',
        critDim: '#FDEBE9',
        warn: '#F1C40F',
        warnDim: '#FDF6DC'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
};