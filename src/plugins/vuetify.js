// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

import { VVideo } from 'vuetify/labs/VVideo'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#5865f2',
          secondary: '#dee0fc88',
          dark: '#181818',
          text: '#B2B3BB'
        },
      },
    },
  },
  components: {
    VVideo,
  }
})