/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#228B22',
          foreground: '#FFFDF7',
          dark: '#1B5E20',
        },
        background: '#FFFDF7',
        foreground: '#1B3D1B',
        muted: {
          DEFAULT: '#FDF8F0',
          foreground: '#6B7B6B',
        },
        success: '#2E7D32',
        destructive: '#B71C1C',
      },
      fontFamily: {
        heading: ['Segoe UI', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
