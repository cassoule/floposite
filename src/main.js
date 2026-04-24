/* global localStorage*/
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vuetify from './plugins/vuetify'
import { register } from 'swiper/element/bundle'
import { MotionPlugin } from '@vueuse/motion'
import axios from 'axios'

import App from './App.vue'
import router from './router'

// Global axios interceptor: attach JWT token to every request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Global axios interceptor: auto-logout on 401 responses
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('discordId')
      router.push('/')
    }
    return Promise.reject(error)
  },
)

const app = createApp(App)
const pinia = createPinia()
register()

app.use(pinia)
app.use(router)
app.use(vuetify)
app.use(MotionPlugin)

app.mount('#app')
