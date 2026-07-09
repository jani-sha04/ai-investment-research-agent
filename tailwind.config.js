/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ledger: {
          paper: "#EEEAE0",
          paperDark: "#E4DFD1",
          line: "#C9C1AC",
          ink: "#1B2A3A",
          inkSoft: "#3C4A58",
          brass: "#A97142",
          brassDark: "#8A5A32"
        },
        verdict: {
          invest: "#3F7A5C",
          investBg: "#E4EEE7",
          watch: "#B4812A",
          watchBg: "#F3EAD4",
          pass: "#A5433A",
          passBg: "#F2E3E0"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      },
      backgroundImage: {
        "grid-paper":
          "linear-gradient(rgba(27,42,58,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(27,42,58,0.05) 1px, transparent 1px)"
      },
      backgroundSize: {
        grid: "28px 28px"
      }
    }
  },
  plugins: []
};
