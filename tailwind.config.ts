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
