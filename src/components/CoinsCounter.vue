<script>
/* global localStorage, setInterval, clearInterval */
import flapi from '@/services/flapi.js'
import { getSocket } from '@/services/socket.js'
import { formatCoins } from '@/utils/format.js'

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
    if (this.socket && this._onDataUpdated) {
      this.socket.off('data-updated', this._onDataUpdated)
    }
  },
  methods: {
    formatCoins,
    initSocket() {
      this.socket = getSocket()

      this._onDataUpdated = (data) => {
        if (data.userId === localStorage.getItem('discordId') && data.newCoins !== undefined) {
          const initialCoins = this.displayCoins
          this.$emit('update-coins', data.newCoins)
          this.animateNumber('displayCoins', initialCoins, data.newCoins, 800)
        }
      }
      this.socket.on('data-updated', this._onDataUpdated)
    },
    async fetchUserCoins() {
      const discordId = localStorage.getItem('discordId')
      if (!discordId) return
      try {
        const response = await flapi.get('/user/' + discordId + '/coins')
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
    <v-chip style="background: #181818aa"> {{ formatCoins(displayCoins) }} Coins </v-chip>
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
