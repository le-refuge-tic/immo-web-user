/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:       '#4B6BFF',
        'primary-d':   '#3A5AEE',
        'primary-l':   '#EEF1FF',
        secondary:     '#FF6B35',
        'secondary-l': '#FFF0EB',
        'app-bg':      '#F8F9FA',
        'surface-g':   '#F0F2F5',
        'text-dark':   '#1A1A2E',
        'text-grey':   '#9E9E9E',
        divider:       '#E8EAED',
        success:       '#4CAF50',
        warning:       '#FF9800',
        danger:        '#F44336',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        card:    '0 6px 20px rgba(0,0,0,0.07)',
        nav:     '0 -4px 20px rgba(0,0,0,0.08)',
        btn:     '0 4px 12px rgba(75,107,255,0.30)',
        'btn-o': '0 4px 12px rgba(255,107,53,0.30)',
      },
    },
  },
  plugins: [],
}
