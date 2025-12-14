import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vuetify from './plugins/vuetify'
import { register } from 'swiper/element/bundle';

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()
register()

app.use(pinia)
app.use(router)
app.use(vuetify)

app.mount('#app')
