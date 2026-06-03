/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm Study Journal palette
        paper: '#FBF7F0',
        card: '#FFFCF6',
        ink: '#1C1A17',
        accent: {
          DEFAULT: '#C75B39',
          700: '#A8492C',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        paper: '0 1px 2px rgba(28,26,23,0.04), 0 10px 30px -16px rgba(28,26,23,0.18)',
      },
    },
  },
  plugins: [],
}
