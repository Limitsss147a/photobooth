/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/src/**/*.{html,js,jsx,ts,tsx}',
    './src/renderer/index.html'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
