import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2ea3f2',
          hover: '#1a8cd8',
          light: '#e8f4fd',
        },
        text: {
          heading: '#333333',
          body: '#666666',
        },
        border: {
          DEFAULT: '#dddddd',
          light: '#eeeeee',
        },
        section: {
          alt: '#f7f7f7',
        },
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        heading: ['var(--font-heading)', 'sans-serif'],
      },
      maxWidth: {
        container: '1080px',
      },
      fontSize: {
        'h1': ['1.5rem', { lineHeight: '1.3', fontWeight: '700' }],
        'h2': ['1.25rem', { lineHeight: '1.3', fontWeight: '700' }],
        'h3': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['0.875rem', { lineHeight: '1.7' }],
      },
      screens: {
        'tablet': '768px',
        'desktop': '1024px',
      },
    },
  },
  plugins: [],
}

export default config
