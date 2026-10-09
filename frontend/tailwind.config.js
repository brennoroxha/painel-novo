export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f0f14',
          secondary: '#1a1a22',
          tertiary: '#252532'
        },
        text: {
          primary: '#ffffff',
          secondary: '#a0a0b0',
          muted: '#6a6a78'
        }
      }
    }
  },
  plugins: []
};
