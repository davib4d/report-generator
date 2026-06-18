/** @type {import('tailwindcss').Config} */
export default {
  // Isso avisa ao Tailwind para procurar classes CSS dentro de todos os arquivos do React
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}