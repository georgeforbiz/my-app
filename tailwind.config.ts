import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        brand: {
          blue: "#1D4ED8",
          "blue-soft": "#3B82F6",
          red: "#DC2626",
          "red-hover": "#B91C1C"
        },
        armenia: {
          red: "#D90012",
          blue: "#0033A0",
          gold: "#F2A900",
          cream: "#F7F8FC",
          ink: "#121826"
        },
        vstah: {
          navy: "#003366",
          "navy-dark": "#00264d"
        }
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)",
        "card-hover": "0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
