/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1b1b1b",
        sand: "#f6f1e7",
        ember: "#e4572e",
        tide: "#2d6a8e",
        moss: "#4a7c59"
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Source Sans 3", "sans-serif"]
      }
    }
  },
  plugins: []
};
