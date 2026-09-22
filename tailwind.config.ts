import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Code", "monospace"],
        sans: ["JetBrains Mono", "monospace"],
      },
      colors: {
        terminal: {
          green: "#00FF41",
          "green-dim": "#00CC33",
          "green-glow": "#00FF4133",
          cyan: "#00FFFF",
          "cyan-dim": "#00CCCC",
          amber: "#FFB000",
          red: "#FF3131",
          bg: "#0A0A0A",
          "bg-secondary": "#0D0D0D",
          "bg-card": "#111111",
          "bg-card-hover": "#151515",
          border: "#1A1A1A",
          "border-active": "#00FF4140",
          "text-dim": "#404040",
          "text-muted": "#606060",
          "text-secondary": "#888888",
        },
      },
      animation: {
        "cursor-blink": "blink 1s step-end infinite",
        "scan-line": "scanline 3s linear infinite",
        "fade-in-up": "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "terminal-boot": "boot 0.3s ease-out forwards",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        blink: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0" } },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        boot: {
          "0%": { opacity: "0", transform: "scaleX(0)" },
          "100%": { opacity: "1", transform: "scaleX(1)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 8px #00FF4133" },
          "50%": { boxShadow: "0 0 20px #00FF4166" },
        },
      },
      boxShadow: {
        "terminal-glow": "0 0 20px #00FF4120, 0 0 40px #00FF4108",
        "card-glow": "0 0 0 1px #00FF4115, inset 0 1px 0 #00FF4108",
        "input-focus": "0 0 0 1px #00FF4140, 0 0 12px #00FF4115",
      },
    },
  },
  plugins: [],
};
export default config;
