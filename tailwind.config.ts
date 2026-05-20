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
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
          950: "#0c0a09",
        },
        paper: "#fefef9",
        accent: "#92400e",
        wuxing: {
          wood: "#4ade80",
          fire: "#fb923c",
          earth: "#fbbf24",
          metal: "#94a3b8",
          water: "#60a5fa",
        },
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
