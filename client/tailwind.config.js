/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // page surfaces — light minty ivory
        cream: '#eef3e7',
        'cream-soft': '#f5f9ee',
        // forest greens — used for body text + the dark hero card
        ink: '#0d3526',
        'ink-soft': '#1a4f3a',
        forest: {
          DEFAULT: '#0d3526',
          deep: '#062018',
          soft: '#1a4f3a',
        },
        // lime accent (replaces old pink semantic role)
        lime: {
          DEFAULT: '#cce85a',
          soft: '#e0f088',
          deep: '#a8c93e',
        },
        pink: {
          DEFAULT: '#cce85a',
          soft: '#e0f088',
        },
        peach: '#a8d999',
        coral: '#e87a5a',
      },
      fontFamily: {
        display: ['"Funnel Display"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderWidth: {
        '1.5': '1.5px',
        '3': '3px',
      },
      boxShadow: {
        hero: '0 30px 80px -30px rgba(13, 53, 38, 0.45)',
      },
    },
  },
  plugins: [],
}
