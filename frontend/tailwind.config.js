/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#080909',
        surface: {
          DEFAULT: '#121414',
          card: '#161919',
          border: 'rgba(212, 175, 55, 0.25)',
          hover: '#1B1E1E',
        },
        gold: {
          DEFAULT: '#D4AF37',       // Metallic Gold
          metallic: '#D4AF37',
          champagne: '#F5D78E',      // Champagne Gold
          light: '#FBF0CE',
          dark: '#9A7B1C',
          muted: '#846E2A',
        },
        luxury: {
          bg: '#080909',
          card: '#121414',
          cardHover: '#171A1A',
          gold: '#D4AF37',
          champagne: '#F5D78E',
          textSecondary: '#A5AAA5',
          border: 'rgba(212, 175, 55, 0.22)',
          borderHover: 'rgba(212, 175, 55, 0.45)',
        },
        // Maintain backwards compatibility with component references
        primary: {
          DEFAULT: '#D4AF37',
          dark: '#9A7B1C',
          light: '#F5D78E',
        },
        secondary: {
          DEFAULT: '#F5D78E',
          dark: '#D4AF37',
          light: '#FBF0CE',
        },
        accent: {
          DEFAULT: '#D4AF37',
          dark: '#9A7B1C',
          light: '#F5D78E',
        },
        raksha: {
          text: '#FFFFFF',
          muted: '#A5AAA5',
          dim: '#6D736D',
          gold: '#D4AF37',
          champagne: '#F5D78E',
          dark: '#080909',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-gold': '0 0 25px -5px rgba(212, 175, 55, 0.4)',
        'glow-gold-lg': '0 0 40px -2px rgba(212, 175, 55, 0.55)',
        'glow-champagne': '0 0 25px -5px rgba(245, 215, 142, 0.4)',
        'glow-card': '0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 20px -5px rgba(212, 175, 55, 0.15)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
