/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#060411',
          900: '#0c081d',
          800: '#130d2f',
          700: '#1b1240',
          600: '#2d1e67',
          500: '#4d37a8',
          400: '#7358d6',
          300: '#a38fed',
        }
      }
    },
  },
  plugins: [],
}
