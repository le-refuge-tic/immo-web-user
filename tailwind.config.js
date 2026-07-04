/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:       '#4B6BFF',
        'primary-d':   '#3A5AEE',
        'primary-l':   'rgba(75,107,255,0.12)',
        secondary:     '#FF6B35',
        'secondary-l': 'rgba(255,107,53,0.12)',
        'app-bg':      '#F5F5F7',
        'surface-g':   '#FFFFFF',
        'text-dark':   '#1D1D1F',
        'text-grey':   '#6E6E73',
        divider:       'rgba(0,0,0,0.08)',
        success:       '#34C759',
        warning:       '#FF9800',
        danger:        '#FF3B30',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        card:    '0 4px 24px rgba(0,0,0,0.07)',
        nav:     '0 -1px 0 rgba(0,0,0,0.06)',
        btn:     '0 4px 16px rgba(75,107,255,0.35)',
        'btn-o': '0 4px 16px rgba(255,107,53,0.35)',
        glass:   'inset 0 1.5px 0 rgba(255,255,255,0.9), 0 8px 32px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
