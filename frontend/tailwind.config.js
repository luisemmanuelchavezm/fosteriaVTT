/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Ahora puedes usar la clase 'font-metal'
        metal: ['"Metal Mania"', "system-ui"],
      },
    },
  },
  plugins: [],
};
