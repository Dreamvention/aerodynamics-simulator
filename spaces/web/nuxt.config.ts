export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  nitro: {
    prerender: {
      crawlLinks: true,
      ignore: ['/admin']
    }
  },
  app: {
    head: {
      title: 'Aerodynamics Simulator',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          hid: 'description',
          name: 'description',
          content: 'Advanced aerodynamic simulation and analysis for drone design'
        }
      ],
      script: [
        {
          src: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
        }
      ]
    }
  }
})
