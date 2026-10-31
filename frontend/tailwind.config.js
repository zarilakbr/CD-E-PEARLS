/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#FBF8F3',
        champagne: '#F3EBDD',
        blush: '#F1E4DC',
        navy: '#12263A',
        ocean: '#1B3A57',
        midnight: '#0D1C2B',
        gold: '#8A6A2F',
        'gold-light': '#D9B877',
        'rose-gold': '#B98B73',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Jost', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

