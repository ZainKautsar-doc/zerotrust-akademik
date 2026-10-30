/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'midnight-canvas': '#05060f',
        'steel-plate': '#2f343e',
        'fog-veil': '#9da7ba',
        'moon-mist': '#c7d3ea',
        'frost-glow': '#d1e4fa',
        'ice-highlight': '#d8ecf8',
        'pure-white': '#ffffff',
        'void-violet': '#663af3',
        'glass-edge': 'rgba(186, 215, 247, 0.12)',
        'frosted-glass': 'rgba(186, 214, 247, 0.03)',
        'deep-glass': 'rgba(5, 6, 15, 0.97)',
      },
      fontFamily: {
        sans: ['Inter', 'Untitled Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'aeonikPro', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'dotDigital', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
        'input': '6px',
        'badge': '6px',
      }
    },
  },
  plugins: [],
}
