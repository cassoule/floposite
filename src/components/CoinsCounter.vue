<script>
import axios from 'axios'

export default {
  emits: ['update-coins'],
  async mounted() {
    await this.fetchUserCoins()
    this._timer = setInterval(async () => {
      this.nowTick = Date.now()
      await this.fetchUserCoins()
    }, 2500)
  },
  beforeDestroy() {
    clearInterval(this._timer)
  },
  data() {
    return {
      displayCoins: 0,
    }
  },
  methods: {
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
    class="coins-counter"
    v-motion
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
