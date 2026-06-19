import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/{*/{*.{js,ts,vue}',
    './pages/**/{*.{js,ts,vue}',
    './app.vue',
  ],
  theme: {
    extend: {}
  },
  plugins: [],
} as Config;