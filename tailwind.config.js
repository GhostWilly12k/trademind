/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // We can add your custom colors here to use like 'bg-vision-navy'
        'vision-navy': '#0F123B',
        'vision-blue': '#0075FF',
        'vision-cyan': '#00C9FF',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}