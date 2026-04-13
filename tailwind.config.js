/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./{app,components,libs,pages,hooks}/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#2AB52A',
          greenDark: '#1F8C1F',
          greenLight: '#EAF8EA',
          orange: '#F8771A',
          orangeDark: '#D9620D',
          orangeLight: '#FFF2E8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        handwriting: ['Pacifico', 'cursive'],
      },
    },
  },
  plugins: [],
}

