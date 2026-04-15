/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./{app,components,libs,pages,hooks}/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          brown: '#2C1D00',
          carton: '#AB9462',
          cream: '#F3F3F3',
          purple: '#AB9462',
          pink: '#FFCCCC',
          coral: '#FF6666',
          yellow: '#FFFFCC',
          tan: '#996633',
          gold: '#FFCC00',
          oxblood: '#9A1900',
          rose: '#FF9999',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
      },
      animation: {
        'just-landed-scroll': 'just-landed-scroll 30s linear infinite',
      },
      keyframes: {
        'just-landed-scroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}

