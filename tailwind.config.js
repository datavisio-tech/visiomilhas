/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        card: "2rem",
        metric: "1.75rem",
      },
      spacing: {
        "card-p": "1.5rem",
        "card-p-lg": "2rem",
      },
      backgroundColor: {
        "premium-dark": "#0f172a",
        "premium-light": "#f8fafc",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.05)",
        "card-hover": "0 4px 12px 0 rgba(15, 23, 42, 0.08)",
        premium: "0 20px 40px 0 rgba(15, 23, 42, 0.1)",
      },
      fontSize: {
        "label-xs": [
          "0.75rem",
          { lineHeight: "1rem", letterSpacing: "0.22em" },
        ],
        "label-sm": [
          "0.875rem",
          { lineHeight: "1.25rem", letterSpacing: "0.18em" },
        ],
      },
    },
  },
  plugins: [],
};
