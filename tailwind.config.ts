import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // EMC Dark Theme Colors
        background: {
          DEFAULT: "#0a0a0f",
          secondary: "#12121a",
          tertiary: "#1a1a24",
        },
        foreground: {
          DEFAULT: "#e4e4e7",
          muted: "#a1a1aa",
        },
        accent: {
          DEFAULT: "#00d4ff",
          hover: "#00b8e0",
          muted: "#00d4ff20",
        },
        border: {
          DEFAULT: "#27272a",
          hover: "#3f3f46",
        },
        // Status colors from mockups
        status: {
          denied: "#ef4444",
          hired: "#22c55e",
          interviewed: "#eab308",
          pending: "#f97316",
          "consent-sent": "#f97316",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
        "pulse-subtle": "pulseSubtle 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

