import type { Config } from "tailwindcss";

/**
 * Tailwind theme tuned to the Pear Pay logo palette: pear greens on a deep
 * forest-green background, with a bright lime accent.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pear: {
          50: "#f2fbe7",
          100: "#e3f6cb",
          200: "#c9ed9c",
          300: "#aade63",
          400: "#92cf3f",
          500: "#74b327", // primary lime ("Pay")
          600: "#598c1d",
          700: "#446a1b",
          800: "#39551c",
          900: "#16301a", // deep forest
          950: "#0a1f12", // page background
        },
        leaf: "#2e6b2e",
        cream: "#eafff3",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 60px -10px rgba(116, 179, 39, 0.45)",
      },
      backgroundImage: {
        "pear-radial":
          "radial-gradient(1200px 600px at 50% -10%, rgba(116,179,39,0.18), transparent 70%)",
      },
    },
  },
  plugins: [],
};

export default config;
