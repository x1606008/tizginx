/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tizgin: {
          navy: "#082B55",
          ocean: "#0877C9",
          green: "#35C759",
          bg: "#F4F8FC",
          dark: "#071A30",
          danger: "#EF4444",
          warning: "#F59E0B",
          success: "#16A34A",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      }
    },
  },
  plugins: [],
};
