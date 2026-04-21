import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#16a34a",  // verde caribeño
          dark: "#14532d",
          light: "#86efac",
        },
        accent: "#f59e0b",     // amarillo/dorado plátano
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
