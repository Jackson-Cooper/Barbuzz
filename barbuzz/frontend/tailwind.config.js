myan-and-jackson/barbuzz/frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors
        charcoal: '#121212',
        amber: '#FFC300',
        electricBlue: '#3EC1F3',
        magenta: '#FF4D88',
        
        // Secondary colors
        slate: '#2C2C2C',
        teal: '#00D1A0',
        offWhite: '#F2F2F2',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        'xl': '1.5rem',
      },
      backdropBlur: {
        xs: '10px',
      },
      boxShadow: {
        'neon-amber': '0 0 8px #FFC300',
        'electric-blue': '0 0 8px #3EC1F3',
        'bright-magenta': '0 0 8px #FF4D88',
      },
    },
  },
  plugins: [],
}
