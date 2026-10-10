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
          navy: "rgb(var(--brand-navy) / <alpha-value>)",
          text: "#1F2937",
          cream: "#FFF7EC",
          success: "#059669",
          primary: "rgb(var(--brand-primary) / <alpha-value>)",
          "primary-dark": "rgb(var(--brand-primary-dark) / <alpha-value>)",
          accent: "rgb(var(--brand-accent) / <alpha-value>)",
          "accent-dark": "rgb(var(--brand-accent-dark) / <alpha-value>)",
          "accent-deep": "rgb(var(--brand-accent-deep) / <alpha-value>)",
          "accent-deeper": "rgb(var(--brand-accent-deeper) / <alpha-value>)",
          "accent-soft": "rgb(var(--brand-accent-soft) / <alpha-value>)",
          "accent-muted": "rgb(var(--brand-accent-muted) / <alpha-value>)",
          "accent-faint": "rgb(var(--brand-accent-faint) / <alpha-value>)",
          "accent-wash": "rgb(var(--brand-accent-wash) / <alpha-value>)",
          "accent-end": "rgb(var(--brand-accent-end) / <alpha-value>)",
          "accent-2": "rgb(var(--brand-accent-2) / <alpha-value>)",
          highlight: "rgb(var(--brand-highlight) / <alpha-value>)",
          ink: "rgb(var(--brand-ink) / <alpha-value>)",
          "ink-soft": "rgb(var(--brand-ink-soft) / <alpha-value>)",
          body: "rgb(var(--brand-body) / <alpha-value>)",
          "body-soft": "rgb(var(--brand-body-soft) / <alpha-value>)",
          caption: "rgb(var(--brand-caption) / <alpha-value>)",
          faint: "rgb(var(--brand-faint) / <alpha-value>)",
          muted: "rgb(var(--brand-muted) / <alpha-value>)",
          "line-strong": "rgb(var(--brand-line-strong) / <alpha-value>)",
          line: "rgb(var(--brand-line) / <alpha-value>)",
          "line-soft": "rgb(var(--brand-line-soft) / <alpha-value>)",
          surface: "rgb(var(--brand-surface) / <alpha-value>)",
          "surface-alt": "rgb(var(--brand-surface-alt) / <alpha-value>)",
          slate: "rgb(var(--brand-slate) / <alpha-value>)",
          "slate-strong": "rgb(var(--brand-slate-strong) / <alpha-value>)",
          cyan: "rgb(var(--brand-cyan) / <alpha-value>)",
          "blue-050": "rgb(var(--brand-blue-050) / <alpha-value>)",
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
