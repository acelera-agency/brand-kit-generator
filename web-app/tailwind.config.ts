import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0F14",
        "ink-deep": "#06090C",
        paper: "#F7F5F0",
        "paper-pure": "#FFFFFF",
        accent: "#1F6E5A",
        "accent-soft": "#D7E5DE",
        signal: "#C2410C",
        muted: "#6B7280",
        "muted-strong": "#4B5563",
        rule: "#E5E1D8",
        "rule-strong": "#D4CFC1",
      },
      fontFamily: {
        display: ['"Inter Tight"', "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      maxWidth: {
        container: "1320px",
      },
      letterSpacing: {
        tightest: "-0.035em",
        tighter: "-0.025em",
        tight: "-0.015em",
        wide: "0.06em",
        wider: "0.08em",
        widest: "0.1em",
      },
    },
  },
  plugins: [],
};

export default config;
