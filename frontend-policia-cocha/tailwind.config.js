/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'policia-green': '#006847', // El verde oficial de tus capturas
        'policia-dark': '#004d35',  // Un tono más oscuro para hovers
        'policia-light': '#f0fdf4', // Un fondo muy clarito
      }
    },
  },
  plugins: [],
}