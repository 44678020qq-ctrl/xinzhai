import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f5f5f4",
          100: "#e7e5e4",
          200: "#d6d3d1",
          300: "#b5b2ae",
          400: "#8a8580",
          500: "#65605b",
          600: "#4a4642",
          700: "#35312d",
          800: "#201d1a",
          900: "#0e0c0a",
          950: "#050403",
        },
        paper: "#fefef9",
        accent: "#8b7355",
      },
      fontFamily: {
        sans: ["Noto Serif SC", "STSong", "Georgia", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        "ink-spread": "inkSpread 1.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        inkSpread: {
          "0%": { opacity: "0", letterSpacing: "0.5em" },
          "100%": { opacity: "1", letterSpacing: "0.1em" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
