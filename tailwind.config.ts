import type { Config } from "tailwindcss";

/**
 * Brand tokens extracted from peers-website.
 * Tailwind v4 also maps these in src/app/globals.css via @theme.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2937",
        paper: "#fffbf2",
        surface: "#ffffff",
        marigold: "#e89b24",
        "deep-navy": "#1b3a5c",
        leaf: "#3f6f45",
        cloud: "#e6dfd0",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        brand: "10px",
      },
      boxShadow: {
        brand: "0 1px 0 rgba(27, 58, 92, 0.16)",
        "brand-lg": "0 10px 24px -10px rgba(27, 58, 92, 0.45)",
      },
    },
  },
};

export default config;
