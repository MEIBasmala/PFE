import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate"; 
export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        syne: ["Syne", "sans-serif"],
        "dm-serif": ["DM Serif Display", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // KhabirLens custom colors
        cream: "hsl(var(--cream-bg))",
        "kl-white": "hsl(var(--pure-white))",
        "kl-gray": {
          bg: "hsl(var(--gray-bg))",
          line: "hsl(var(--gray-line))",
          20: "hsl(var(--gray-20))",
          30: "hsl(var(--gray-30))",
        },
        "kl-text": {
          dark: "hsl(var(--text-dark))",
          m: "hsl(var(--text-m))",
          l: "hsl(var(--text-l))",
        },
        "kl-orange": {
          DEFAULT: "hsl(var(--orange))",
          20: "hsl(var(--orange-20))",
        },
        "kl-saffron": {
          DEFAULT: "hsl(var(--saffron))",
          light: "hsl(var(--saffron-light))",
        },
        "kl-green": {
          DEFAULT: "hsl(var(--green))",
          light: "hsl(var(--green-light))",
          dark: "hsl(var(--green-dark))",
        },
        "kl-error": {
          DEFAULT: "hsl(var(--error))",
          light: "hsl(var(--error-light))",
        },
        "kl-success": "hsl(var(--success))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
      },
      boxShadow: {
        kl: "var(--sh)",
        "kl-m": "var(--sh-m)",
        "kl-l": "var(--sh-l)",
        "kl-card": "var(--card-shadow)",
        "kl-hover": "var(--hover-shadow)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;