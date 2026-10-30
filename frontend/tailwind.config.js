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
        'fog-veil': '#b4bfd3',
        'moon-mist': '#d6e2f7',
        'frost-glow': '#e6f0fd',
        'ice-highlight': '#f0f6ff',
        'pure-white': '#ffffff',
        'void-violet': '#663af3',
        'glass-edge': 'rgba(186, 215, 247, 0.22)',
        'frosted-glass': 'rgba(186, 214, 247, 0.05)',
        'deep-glass': 'rgba(5, 6, 15, 0.98)',
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
