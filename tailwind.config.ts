import type { Config } from "tailwindcss"
import { fontFamily } from "tailwindcss/defaultTheme"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        serif: ["var(--font-playfair)", ...fontFamily.serif],
        mono: ["var(--font-mono)", ...fontFamily.mono],
      },
      colors: {
        // Brand palette
        cream: {
          DEFAULT: "#F5EFE6",
          50: "#FDFAF6",
          100: "#F5EFE6",
          200: "#EDE3D7",
          300: "#E0D0BF",
          400: "#CEBBA5",
          500: "#B89E87",
        },
        parchment: "#EDE3D7",
        paper: "#FFFDF9",
        forest: {
          DEFAULT: "#1B2E22",
          50: "#E8EEE9",
          100: "#C4D5C8",
          200: "#9CBBA3",
          300: "#6F9E7A",
          400: "#4A8358",
          500: "#2D6640",
          600: "#1B5032",
          700: "#1B2E22",
          800: "#122018",
          900: "#0A1410",
        },
        gold: {
          DEFAULT: "#C9A84C",
          50: "#FAF5E9",
          100: "#F2E5C3",
          200: "#E8D098",
          300: "#DCB96D",
          400: "#D4A84C",
          500: "#C9A84C",
          600: "#B8961E",
          700: "#9A7D18",
          800: "#7B6313",
          900: "#5C4A0E",
        },
        ink: {
          DEFAULT: "#2C2C2C",
          light: "#4A4A4A",
          muted: "#6B6B6B",
          faint: "#9A9A9A",
        },
        border: {
          DEFAULT: "#D8CFC4",
          light: "#E8E1D9",
          dark: "#C0B5A8",
        },
        // Semantic colors
        background: "#F5EFE6",
        foreground: "#2C2C2C",
        muted: {
          DEFAULT: "#EDE3D7",
          foreground: "#6B6B6B",
        },
        primary: {
          DEFAULT: "#1B2E22",
          foreground: "#F5EFE6",
        },
        secondary: {
          DEFAULT: "#EDE3D7",
          foreground: "#2C2C2C",
        },
        accent: {
          DEFAULT: "#C9A84C",
          foreground: "#FFFDF9",
        },
        destructive: {
          DEFAULT: "#C0392B",
          foreground: "#FFFDF9",
        },
        ring: "#C9A84C",
        card: {
          DEFAULT: "#FFFDF9",
          foreground: "#2C2C2C",
        },
        popover: {
          DEFAULT: "#FFFDF9",
          foreground: "#2C2C2C",
        },
        input: "#D8CFC4",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        book: "0 20px 60px -10px rgba(27, 46, 34, 0.3), 0 10px 20px -5px rgba(27, 46, 34, 0.15)",
        "book-sm": "0 8px 30px -4px rgba(27, 46, 34, 0.2), 0 4px 10px -2px rgba(27, 46, 34, 0.1)",
        "page-left": "-4px 0 15px rgba(0,0,0,0.12), -1px 0 3px rgba(0,0,0,0.08)",
        "page-right": "4px 0 15px rgba(0,0,0,0.12), 1px 0 3px rgba(0,0,0,0.08)",
        card: "0 2px 10px rgba(27, 46, 34, 0.08), 0 1px 3px rgba(27, 46, 34, 0.05)",
        "card-hover": "0 8px 30px rgba(27, 46, 34, 0.12), 0 3px 8px rgba(27, 46, 34, 0.08)",
        "inner-top": "inset 0 4px 8px rgba(0,0,0,0.06)",
        "spine": "inset -8px 0 20px rgba(0,0,0,0.15)",
      },
      backgroundImage: {
        "paper-texture": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23FFFDF9'/%3E%3Ccircle cx='1' cy='1' r='0.5' fill='%23F5EFE6' opacity='0.3'/%3E%3C/svg%3E\")",
        "gradient-cream": "linear-gradient(135deg, #F5EFE6 0%, #EDE3D7 100%)",
        "gradient-forest": "linear-gradient(135deg, #1B2E22 0%, #2D4A34 100%)",
        "gradient-gold": "linear-gradient(135deg, #C9A84C 0%, #D4B57A 100%)",
        "book-spine": "linear-gradient(to right, rgba(0,0,0,0.15) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.1) 100%)",
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "fade-up": "fade-up 0.6s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "flip-forward": "flip-forward 0.7s cubic-bezier(0.645, 0.045, 0.355, 1.000)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      spacing: {
        "book-page": "720px",
        "page-width": "360px",
      },
      transitionTimingFunction: {
        "page-flip": "cubic-bezier(0.645, 0.045, 0.355, 1.000)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
}

export default config
