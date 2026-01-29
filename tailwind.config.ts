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
    },
  },
  plugins: [],
};
export default config;
