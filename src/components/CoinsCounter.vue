<script>
/* global localStorage, setInterval, clearInterval */
import axios from 'axios'
import { io } from 'socket.io-client'

export default {
  emits: ['update-coins'],
  data() {
    return {
      displayCoins: 0,
      socket: null,
    }
  },
  async mounted() {
    this.initSocket()
    await this.fetchUserCoins()
    this._timer = setInterval(async () => {
      this.nowTick = Date.now()
      await this.fetchUserCoins()
    }, 1000 * 60)
  },
  beforeUnmount() {
    clearInterval(this._timer)
  },
  methods: {
    initSocket() {
      this.socket = io(import.meta.env.VITE_FLAPI_URL.replace(/\/api$/, ''), {
        withCredentials: false,
        auth: { token: localStorage.getItem('token') },
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
      })

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server')
      })

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server')
      })

      this.socket.on('data-updated', (data) => {
        if (data.userId === localStorage.getItem('discordId') && data.newCoins !== undefined) {
          const initialCoins = this.displayCoins
          this.$emit('update-coins', data.newCoins)
          this.animateNumber('displayCoins', initialCoins, data.newCoins, 800)
        }
      })
    },
    async fetchUserCoins() {
      const discordId = localStorage.getItem('discordId')
      if (!discordId) return
      try {
        const url = import.meta.env.VITE_FLAPI_URL + '/user/' + discordId + '/coins'
        const response = await axios.get(url)
        const initialCoins = this.displayCoins
        this.$emit('update-coins', response.data.coins)
        this.animateNumber('displayCoins', initialCoins, response.data.coins, 800)
      } catch (error) {
        console.error('Error fetching user coins:', error)
      }
    },
    animateNumber(property, start, end, duration) {
      let startTimestamp = null
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp
        const progress = Math.min((timestamp - startTimestamp) / duration, 1)

        // Easing function (easeOutExpo) for a "cool" slowing down effect
        const ease = (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x))

        this[property] = Math.floor(ease(progress) * (end - start) + start)

        if (progress < 1) {
          window.requestAnimationFrame(step)
        }
      }
      window.requestAnimationFrame(step)
    },
  },
}
</script>

<template>
  <div
    v-motion
    class="coins-counter"
    :initial="{ opacity: 0 }"
    :enter="{ opacity: 1, transition: { delay: 0, duration: 400 } }"
  >
    <v-chip style="background: #181818aa">
      {{ displayCoins.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') }} Coins
    </v-chip>
  </div>
</template>

<style scoped>
.coins-counter {
  position: fixed;
  top: 2.5em;
  right: 2em;
  z-index: 1000;
  backdrop-filter: blur(2px) brightness(50%);
  border-radius: 20px;
  border: 2px solid #77777777;
}
</style>
