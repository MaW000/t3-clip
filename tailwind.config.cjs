/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        casablanca: {
          50: "#fefbf6",
          100: "#fef7ed",
          200: "#fcecd2",
          300: "#f9e0b7",
          400: "#f5c980",
          500: "#f1b24a",
          600: "#d9a043",
          700: "#b58638",
          800: "#916b2c",
          900: "#765724",
        },
        tamarind: {
          50: "#f5f3f3",
          100: "#eae7e6",
          200: "#cbc3c1",
          300: "#ac9f9c",
          400: "#6e5852",
          500: "#301008",
          600: "#2b0e07",
          700: "#240c06",
          800: "#1d0a05",
          900: "#180804",
        },
        "periwinkle-gray": {
          50: "#fcfdff",
          100: "#fafbfe",
          200: "#f2f5fd",
          300: "#ebeffb",
          400: "#dbe2f9",
          500: "#ccd6f6",
          600: "#b8c1dd",
          700: "#99a1b9",
          800: "#7a8094",
          900: "#646979",
        },
        pizazz: {
          50: "#fff9f2",
          100: "#fff4e6",
          200: "#ffe2bf",
          300: "#ffd199",
          400: "#ffaf4d",
          500: "#ff8c00",
          600: "#e67e00",
          700: "#bf6900",
          800: "#995400",
          900: "#7d4500",
        },
      },
    },
  },
  plugins: [],
};

module.exports = config;
