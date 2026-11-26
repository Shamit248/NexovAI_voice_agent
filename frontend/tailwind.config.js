/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        luxury: {
          bg: '#f8f9fa',
          surface: '#ffffff',
          card: '#ffffff',
          border: '#e2e8f0',
          borderSubtle: '#f1f5f9',
          gold: '#b48346',
          goldLight: '#fef3c7',
          goldDark: '#78350f',
          emerald: '#059669',
          emeraldLight: '#ecfdf5',
          emeraldDeep: '#064e3b',
          ink: '#0f172a',
          slate: '#475569',
          stone: '#64748b',
        }
      },
      boxShadow: {
        'titanium': '0 0 0 1px rgba(203, 213, 225, 0.8), 0 20px 45px -10px rgba(15, 23, 42, 0.12), 0 0 30px -5px rgba(180, 131, 70, 0.08)',
        'specular': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.9)',
        'gold-glow': '0 0 20px -3px rgba(180, 131, 70, 0.3)',
        'emerald-glow': '0 0 20px -3px rgba(5, 150, 105, 0.3)',
        'card-subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 6px 16px -2px rgba(15, 23, 42, 0.05)',
      }
    },
  },
  plugins: [],
}
