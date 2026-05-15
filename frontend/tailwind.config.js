/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        blink: "blink 1s step-end infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        blink: { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0 } },
      },
    },
  },
  plugins: [],
};
