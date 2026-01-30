/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-dark': 'rgb(var(--color-primary-dark) / <alpha-value>)',
        black: 'rgb(var(--color-black) / <alpha-value>)',
        white: 'rgb(var(--color-white) / <alpha-value>)',
        gray: 'rgb(var(--color-gray) / <alpha-value>)',
        grey: 'rgb(var(--color-grey) / <alpha-value>)',
        dark: 'rgb(var(--color-dark) / <alpha-value>)',
        smokie: 'rgb(var(--color-smokie) / <alpha-value>)',
        red: 'rgb(var(--color-red) / <alpha-value>)',
        green: 'rgb(var(--color-green) / <alpha-value>)',
        aqua: 'rgb(var(--color-aqua) / <alpha-value>)',
        blue: 'rgb(var(--color-blue) / <alpha-value>)',
        'bg-light': 'rgb(var(--color-bg-light) / <alpha-value>)',
        'bg-light-blue': 'rgb(var(--color-bg-light-blue) / <alpha-value>)',
        'bg-light-green': 'rgb(var(--color-bg-light-green) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
      'text-secondary': 'rgba(var(--color-text-secondary) / 0.6)',
      'text-tertiary': 'rgba(var(--color-text-tertiary) / 0.4)',
        'text-disabled': 'rgb(var(--color-text-disabled) / <alpha-value>)',
      },
      fontFamily: {
        base: ['var(--font-base)', 'Helvetica', 'sans-serif'],
        oranienbaum: ['Oranienbaum', 'serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      screens: {
        'xxl': '1920px',
      },
    },
  },
  plugins: [],
}
