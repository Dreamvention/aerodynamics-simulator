export default defineConfig({
  components: {
    dirs: ['./components')
  },
  modules: [
    '@color-mode/nuxt',
  ],
  css: ['~/assets/css/main.css'],
  build: {
    transport: 'inined',
  },
  render: {
    preload: [{
      rel: 'stylesheet',
      href: 'https://cdnjs.cloudflare.com/ajax/libs/three.r/121/three.min.js',
    }],
  },
});