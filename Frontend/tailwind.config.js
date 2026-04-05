/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Light-theme semantic tokens ──────────────────────────────── */
        "surface-dim": "#f0f2f8",
        "surface": "#f8f9fc",
        "surface-bright": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f4f9",
        "surface-container": "#edeef5",
        "surface-container-high": "#e6e8f0",
        "surface-container-highest": "#dde0ea",
        "on-surface": "#1a1c2e",
        "on-surface-variant": "#5f6170",
        "on-background": "#1a1c2e",
        "background": "#f8f9fc",
        "surface-variant": "#e2e3ef",
        "surface-tint": "#6C63FF",

        "outline": "#8e8e9d",
        "outline-variant": "#c8c9d4",

        "primary": "#6C63FF",
        "on-primary": "#ffffff",
        "primary-container": "#e8e6ff",
        "on-primary-container": "#1a009e",
        "primary-fixed": "#e1e0ff",
        "primary-fixed-dim": "#6C63FF",
        "on-primary-fixed": "#1a009e",
        "on-primary-fixed-variant": "#4a42e0",
        "inverse-primary": "#c0c1ff",

        "secondary": "#00a572",
        "on-secondary": "#ffffff",
        "secondary-container": "#b8f5d8",
        "on-secondary-container": "#002113",
        "secondary-fixed": "#b8f5d8",
        "secondary-fixed-dim": "#00a572",
        "on-secondary-fixed": "#002113",
        "on-secondary-fixed-variant": "#005236",

        "tertiary": "#c07800",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#ffddb8",
        "on-tertiary-container": "#2a1700",
        "tertiary-fixed": "#ffddb8",
        "tertiary-fixed-dim": "#c07800",
        "on-tertiary-fixed": "#2a1700",
        "on-tertiary-fixed-variant": "#885500",

        "error": "#dc362e",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#410002",

        "inverse-surface": "#2e3142",
        "inverse-on-surface": "#eff0f8",
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      fontFamily: {
        "headline": ["Inter", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"],
        "display": ["'Instrument Serif'", "serif"],
        "sans": ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [],
}
