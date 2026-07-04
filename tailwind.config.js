/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:       '#4B6BFF',
        'primary-d':   '#3A5AEE',
        'primary-l':   'rgba(75,107,255,0.18)',
        secondary:     '#FF6B35',
        'secondary-l': 'rgba(255,107,53,0.18)',
        'app-bg':      '#07071A',
        'surface-g':   '#0E0E2A',
        'text-dark':   '#EEEEF8',
        'text-grey':   '#8888B0',
        divider:       '#1C1C3C',
        success:       '#22C55E',
        warning:       '#FF9800',
        danger:        '#F44336',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        card:    '0 2px 20px rgba(0,0,0,0.45)',
        nav:     '0 -1px 0 rgba(255,255,255,0.06)',
        btn:     '0 4px 20px rgba(75,107,255,0.45)',
        'btn-o': '0 4px 20px rgba(255,107,53,0.45)',
        glass:   'inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 32px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
}
