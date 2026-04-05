/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Semantic tokens via CSS variables (supports opacity modifiers) ── */
        "surface-dim":                 "rgb(var(--color-surface-dim) / <alpha-value>)",
        "surface":                     "rgb(var(--color-surface) / <alpha-value>)",
        "surface-bright":              "rgb(var(--color-surface-bright) / <alpha-value>)",
        "surface-container-lowest":    "rgb(var(--color-surface-container-lowest) / <alpha-value>)",
        "surface-container-low":       "rgb(var(--color-surface-container-low) / <alpha-value>)",
        "surface-container":           "rgb(var(--color-surface-container) / <alpha-value>)",
        "surface-container-high":      "rgb(var(--color-surface-container-high) / <alpha-value>)",
        "surface-container-highest":   "rgb(var(--color-surface-container-highest) / <alpha-value>)",
        "on-surface":                  "rgb(var(--color-on-surface) / <alpha-value>)",
        "on-surface-variant":          "rgb(var(--color-on-surface-variant) / <alpha-value>)",
        "background":                  "rgb(var(--color-background) / <alpha-value>)",
        "on-background":               "rgb(var(--color-on-background) / <alpha-value>)",
        "surface-variant":             "rgb(var(--color-surface-variant) / <alpha-value>)",
        "surface-tint":                "rgb(var(--color-primary) / <alpha-value>)",

        "outline":                     "rgb(var(--color-outline) / <alpha-value>)",
        "outline-variant":             "rgb(var(--color-outline-variant) / <alpha-value>)",
        "inverse-surface":             "rgb(var(--color-inverse-surface) / <alpha-value>)",
        "inverse-on-surface":          "rgb(var(--color-inverse-on-surface) / <alpha-value>)",

        "primary":                     "rgb(var(--color-primary) / <alpha-value>)",
        "on-primary":                  "rgb(var(--color-on-primary) / <alpha-value>)",
        "primary-container":           "rgb(var(--color-primary-container) / <alpha-value>)",
        "on-primary-container":        "rgb(var(--color-on-primary-container) / <alpha-value>)",
        "primary-fixed":               "rgb(var(--color-primary-fixed) / <alpha-value>)",
        "primary-fixed-dim":           "rgb(var(--color-primary-fixed-dim) / <alpha-value>)",
        "inverse-primary":             "rgb(var(--color-inverse-primary) / <alpha-value>)",

        "secondary":                   "rgb(var(--color-secondary) / <alpha-value>)",
        "on-secondary":                "rgb(var(--color-on-secondary) / <alpha-value>)",
        "secondary-container":         "rgb(var(--color-secondary-container) / <alpha-value>)",
        "on-secondary-container":      "rgb(var(--color-on-secondary-container) / <alpha-value>)",
        "secondary-fixed":             "rgb(var(--color-secondary-fixed) / <alpha-value>)",
        "secondary-fixed-dim":         "rgb(var(--color-secondary-fixed-dim) / <alpha-value>)",

        "tertiary":                    "rgb(var(--color-tertiary) / <alpha-value>)",
        "on-tertiary":                 "rgb(var(--color-on-tertiary) / <alpha-value>)",
        "tertiary-container":          "rgb(var(--color-tertiary-container) / <alpha-value>)",
        "on-tertiary-container":       "rgb(var(--color-on-tertiary-container) / <alpha-value>)",
        "tertiary-fixed":              "rgb(var(--color-tertiary-fixed) / <alpha-value>)",
        "tertiary-fixed-dim":          "rgb(var(--color-tertiary-fixed-dim) / <alpha-value>)",

        "error":                       "rgb(var(--color-error) / <alpha-value>)",
        "on-error":                    "rgb(var(--color-on-error) / <alpha-value>)",
        "error-container":             "rgb(var(--color-error-container) / <alpha-value>)",
        "on-error-container":          "rgb(var(--color-on-error-container) / <alpha-value>)",
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg":      "0.25rem",
        "xl":      "0.5rem",
        "2xl":     "0.75rem",
        "full":    "9999px",
      },
      fontFamily: {
        "headline": ["Inter", "sans-serif"],
        "body":     ["Inter", "sans-serif"],
        "label":    ["Inter", "sans-serif"],
        "mono":     ["JetBrains Mono", "monospace"],
        "display":  ["'Instrument Serif'", "serif"],
        "sans":     ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
