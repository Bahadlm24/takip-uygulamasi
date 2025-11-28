/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mapping existing CSS variables to Tailwind colors
        // We use specific names to match the classNames used in JSX
      },
      backgroundColor: {
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        tertiary: 'var(--bg-tertiary)',
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        'accent-primary': 'var(--accent-primary)',
        danger: 'var(--danger)',
      },
      borderColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
      }
    },
  },
  plugins: [],
}
