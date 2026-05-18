import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#F39A2D",
          "orange-dark": "#C77816",
          navy: "#0F2747",
          text: "#1F2937",
          muted: "#6B7280",
          cream: "#FFF7EC",
          success: "#059669",
        },
        solar: {
          amber: "#f59e0b",
          orange: "#ea580c",
          dark: "#1c1917",
          cream: "#fef3c7",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      fontVariantNumeric: {
        tabular: ["tabular-nums"],
      },
      borderRadius: {
        lg: "12px",
        xl: "12px",
        "2xl": "12px",
      },
      boxShadow: {
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        lg: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
