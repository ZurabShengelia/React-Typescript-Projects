import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1360px" },
    },
    extend: {

      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.375rem" }],
        base: ["1rem", { lineHeight: "1.625rem" }],
        lg: ["1.25rem", { lineHeight: "1.75rem" }],
        xl: ["1.5rem", { lineHeight: "2rem" }],
        "2xl": ["2rem", { lineHeight: "2.375rem" }],
        "3xl": ["2.5rem", { lineHeight: "2.875rem" }],
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      colors: {
        base: {
          DEFAULT: "var(--color-base)",
          panel: "var(--color-panel)",
          raised: "var(--color-raised)",
          border: "var(--color-border)",
          borderStrong: "var(--color-border-strong)",
        },
        ink: {
          DEFAULT: "var(--color-ink)",
          muted: "var(--color-ink-muted)",
          faint: "var(--color-ink-faint)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          muted: "var(--color-accent-muted)",

          ink: "var(--color-accent-ink)",
        },
        success: { DEFAULT: "var(--color-success)", muted: "var(--color-success-muted)" },

        terminal: {
          DEFAULT: "var(--color-terminal-bg)",
          ink: "var(--color-terminal-ink)",
        },

        chart: {
          line: "var(--color-chart-line)",
          grid: "var(--color-chart-grid)",
          axis: "var(--color-chart-axis)",
        },
        danger: { DEFAULT: "var(--color-danger)", muted: "var(--color-danger-muted)" },
        scrim: "var(--color-scrim)",
        warning: { DEFAULT: "var(--color-warning)", muted: "var(--color-warning-muted)" },
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.02) inset",

        pop: "0 8px 24px -12px rgba(0,0,0,0.45)",
      },
      keyframes: {

        "typing-dot": {
          "0%, 60%, 100%": { opacity: "0.25" },
          "30%": { opacity: "1" },
        },
      },
      animation: {
        "typing-dot": "typing-dot 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
