import { primary, accent, slate, danger, claudfather } from "./src/styles/palette";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      // Color palette: single source of truth lives in src/styles/palette.ts.
      // primary = blue (brand), accent = purple, slate = neutral, danger = red, and
      // Claudlobby's page's own (claudfather).
      colors: {
        primary,
        accent,
        slate,
        danger,
        claudfather,
      },

      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Consolas",
          "Monaco",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
