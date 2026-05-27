/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        accent: 'var(--accent)',
        'accent-muted': 'var(--accent-muted)',
        'accent-glow': 'var(--accent-glow)',
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        border: 'var(--border)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        success: 'var(--success)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
      },
      fontSize: {
        'xs': '11px',
        'sm': '13px',
        'base': '14px',
        'md': '15px',
        'lg': '17px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '30px',
      },
      borderRadius: {
        'card': '16px',
        'modal': '20px',
        'button': '12px',
        'input': '12px',
        'pill': '999px',
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'geist': ['Geist', 'system-ui', 'sans-serif'],
        'dm-sans': ['"DM Sans"', 'system-ui', 'sans-serif'],
        'jakarta': ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        'sora': ['Sora', 'system-ui', 'sans-serif'],
        'outfit': ['Outfit', 'system-ui', 'sans-serif'],
        'nunito': ['Nunito', 'system-ui', 'sans-serif'],
        'lexend': ['Lexend', 'system-ui', 'sans-serif'],
        'space': ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        'figtree': ['Figtree', 'system-ui', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'fade-in': 'fadeIn 300ms ease-out',
        'slide-in-right': 'slideInRight 250ms ease-out',
        'slide-in-up': 'slideInUp 200ms ease-out',
        'scale-in': 'scaleIn 300ms ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px var(--accent-glow)' },
          '50%': { boxShadow: '0 0 40px var(--accent-glow)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideInRight: {
          from: { transform: 'translateX(20px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      }
    },
  },
  plugins: [],
}
