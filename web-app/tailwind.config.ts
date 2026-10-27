import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0F14",
        "ink-deep": "#05080C",
        paper: "#F3F6F4",
        "paper-pure": "#FFFFFF",
        accent: "#087A68",
        "accent-soft": "#D9EEE9",
        signal: "#9A3412",
        muted: "#68737C",
        "muted-strong": "#3F4A54",
        rule: "#DDE5E0",
        "rule-strong": "#C7D2CC",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        container: "1320px",
      },
      letterSpacing: {
        wide: "0.06em",
        wider: "0.08em",
        widest: "0.1em",
      },
    },
  },
  plugins: [],
};

export default config;
