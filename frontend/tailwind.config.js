/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        yellow: {
          400: '#F5C400',
          500: '#E8B400',
          600: '#D4A200',
        },
        dark: {
          50:  '#2A2A2A',
          100: '#252525',
          200: '#1E1E1E',
          300: '#181818',
          400: '#111111',
          500: '#0D0D0D',
          600: '#0A0A0A',
        },
        line: {
          DEFAULT: '#2A2A2A',
          light: '#333333',
        },
        muted: {
          DEFAULT: '#A8A49E',
          dark: '#6B6865',
        },
      },
      fontFamily: {
        sans:    ['"Barlow"', 'sans-serif'],
        display: ['"Barlow Condensed"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        widest2: '0.18em',
      },
    },
  },
  plugins: [],
}
