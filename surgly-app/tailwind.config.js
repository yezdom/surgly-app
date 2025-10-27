/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#0A0E27',
          secondary: '#131842',
          tertiary: '#1E293B',
        },
        light: {
          primary: '#FFFFFF',
          secondary: '#F8FAFC',
          tertiary: '#F1F5F9',
        },
        accent: {
          blue: '#4F46E5',
          purple: '#8B5CF6',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
        text: {
          dark: {
            primary: '#F1F5F9',
            secondary: '#94A3B8',
          },
          light: {
            primary: '#0F172A',
            secondary: '#64748B',
          },
        },
        border: {
          dark: '#1E293B',
          light: '#E2E8F0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'body-lg': '18px',
        'h4': '24px',
        'h3': '28px',
        'h2': '36px',
        'h1': '48px',
        'metric': '40px',
      },
      spacing: {
        '128': '32rem',
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(79, 70, 229, 0.15)',
        'glow-strong': '0 0 30px rgba(79, 70, 229, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
