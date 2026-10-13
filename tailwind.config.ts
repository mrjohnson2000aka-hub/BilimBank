import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#142B4A', 700: '#0E2038', 600: '#1E3A63', 100: '#DCE4EF', 50: '#EEF2F8' },
        emerald: { DEFAULT: '#18A875', 700: '#0D7350', 600: '#12865D', 100: '#C9EEDF', 50: '#E6F7F0' },
        ink: '#172033', muted: '#5A6578', line: '#E2E8F0', canvas: '#F7F9FC',
        warn: { DEFAULT: '#9A5B00', 50: '#FDF3E1' }, danger: { DEFAULT: '#B42318', 50: '#FDECEA' }, info: { DEFAULT: '#1D5FA6', 50: '#E8F1FB' }
      },
      fontFamily: { sans: ['"Manrope Variable"', 'Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(20,43,74,.05), 0 4px 16px rgba(20,43,74,.06)', pop: '0 12px 40px rgba(20,43,74,.16)' },
      borderRadius: { xl: '14px', '2xl': '18px' }
    }
  },
  plugins: []
} satisfies Config;
