const path = require("path")

module.exports = {
  darkMode: "class",
  presets: [require("@medusajs/ui-preset")],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      transitionProperty: {
        width: "width margin",
        height: "height",
        bg: "background-color",
        display: "display opacity",
        visibility: "visibility",
        padding: "padding-top padding-right padding-bottom padding-left",
      },
      colors: {
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          hover: "rgb(var(--color-primary-hover) / <alpha-value>)",
          light: "rgb(var(--color-primary-light) / <alpha-value>)",
        },
        rose: {
          50: "#FCF7F6",
          100: "#F7E8E8",
          200: "#EFD2D2",
          300: "#E4B6B6",
          400: "#D89C9C",
          500: "#C98484",
          DEFAULT: "#C98484",
          600: "#A95E5E",
          700: "#874747",
          800: "#6D3B3B",
          900: "#5B3434",
          950: "#301B1B",
        },
        brand: {
          DEFAULT: "#C98484",
          orange: "#C98484",
          hover: "#A95E5E",
          light: "#fcf7f6",
          subtle: "rgba(201, 132, 132, 0.08)",
        },
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        elevated: "rgb(var(--color-elevated) / <alpha-value>)",
        subtle: "rgb(var(--color-subtle) / <alpha-value>)",
        input: "rgb(var(--color-input) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        info: "rgb(var(--color-info) / <alpha-value>)",
        "on-primary": "rgb(var(--color-on-primary) / <alpha-value>)",
        overlay: "rgb(var(--color-overlay) / <alpha-value>)",
        ring: "rgb(var(--color-ring) / <alpha-value>)",
        corporate: {
          dark: "rgb(var(--color-background) / <alpha-value>)",
          surface: "rgb(var(--color-surface) / <alpha-value>)",
          card: "rgb(var(--color-card) / <alpha-value>)",
          border: "rgb(var(--color-border) / <alpha-value>)",
        },
        light: {
          bg: "rgb(var(--color-background) / <alpha-value>)",
          surface: "rgb(var(--color-surface) / <alpha-value>)",
          border: "rgb(var(--color-border) / <alpha-value>)",
        },
        grey: {
          0: "#FFFFFF",
          5: "#F9FAFB",
          10: "#F3F4F6",
          20: "#E5E7EB",
          30: "#D1D5DB",
          40: "#9CA3AF",
          50: "#6B7280",
          60: "#4B5563",
          70: "#374151",
          80: "#1F2937",
          90: "#111827",
        },
      },
      borderRadius: {
        none: "var(--radius-none)",
        soft: "var(--radius-soft)",
        base: "var(--radius-base)",
        rounded: "var(--radius-rounded)",
        large: "var(--radius-large)",
        circle: "var(--radius-circle)",
      },
      spacing: {
        section: "var(--space-section)",
        gutter: "var(--container-gutter)",
      },
      maxWidth: {
        content: "var(--container-content)",
        reading: "var(--container-reading)",
        "8xl": "var(--container-wide)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
        focus: "var(--shadow-focus)",
      },
      screens: {
        // Canonical mobile-first breakpoints for all new code.
        xs: "512px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
        "desktop-wide": "1440px",
        // Legacy aliases kept temporarily while external/older modules migrate.
        "2xsmall": "320px",
        xsmall: "512px",
        small: "1024px",
        medium: "1280px",
        large: "1440px",
        xlarge: "1680px",
        "2xlarge": "1920px",
      },
      fontSize: {
        "3xl": "2rem",
        "ui-xs": ["var(--font-size-xs)", { lineHeight: "1rem" }],
        "ui-sm": ["var(--font-size-sm)", { lineHeight: "1.25rem" }],
        "ui-base": ["var(--font-size-ui-base)", { lineHeight: "1.5rem" }],
        body: [
          "var(--font-size-body)",
          { lineHeight: "var(--line-height-body)" },
        ],
        "ui-lg": ["var(--font-size-lg)", { lineHeight: "1.75rem" }],
        "heading-4": [
          "var(--font-size-heading-4)",
          { lineHeight: "var(--line-height-heading)" },
        ],
        "heading-3": [
          "var(--font-size-heading-3)",
          { lineHeight: "var(--line-height-heading)" },
        ],
        "heading-2": [
          "var(--font-size-heading-2)",
          { lineHeight: "var(--line-height-heading)" },
        ],
        "heading-1": [
          "var(--font-size-heading-1)",
          { lineHeight: "var(--line-height-tight)" },
        ],
      },
      fontFamily: {
        sans: ["var(--font-family-body)"],
        heading: ["var(--font-family-heading)"],
        display: ["var(--font-family-display)"],
        mono: ["var(--font-family-mono)"],
      },
      keyframes: {
        ring: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-in-right": {
          "0%": {
            opacity: "0",
            transform: "translateX(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "fade-in-top": {
          "0%": {
            opacity: "0",
            transform: "translateY(-10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-out-top": {
          "0%": {
            height: "100%",
          },
          "99%": {
            height: "0",
          },
          "100%": {
            visibility: "hidden",
          },
        },
        "accordion-slide-up": {
          "0%": {
            height: "var(--radix-accordion-content-height)",
            opacity: "1",
          },
          "100%": {
            height: "0",
            opacity: "0",
          },
        },
        "accordion-slide-down": {
          "0%": {
            "min-height": "0",
            "max-height": "0",
            opacity: "0",
          },
          "100%": {
            "min-height": "var(--radix-accordion-content-height)",
            "max-height": "none",
            opacity: "1",
          },
        },
        enter: {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        leave: {
          "0%": { transform: "scale(1)", opacity: 1 },
          "100%": { transform: "scale(0.9)", opacity: 0 },
        },
        "slide-in": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        ring: "ring 2.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
        "fade-in-right":
          "fade-in-right 0.3s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-in-top": "fade-in-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-out-top":
          "fade-out-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "accordion-open":
          "accordion-slide-down 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        "accordion-close":
          "accordion-slide-up 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        enter: "enter 200ms ease-out",
        "slide-in": "slide-in 1.2s cubic-bezier(.41,.73,.51,1.02)",
        leave: "leave 150ms ease-in forwards",
      },
    },
  },
  plugins: [require("tailwindcss-radix")()],
}
