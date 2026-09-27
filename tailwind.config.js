/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#e11d48',
          600: '#e11d48',
          700: '#be123c',
          900: '#881337',
        },
        dark: {
          base: '#0f172a',
          card: '#1e293b',
          border: '#334155',
        }
      }
    },
  },
  plugins: [],
}
