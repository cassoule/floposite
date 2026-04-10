<template>
  <div class="login">
    <div>
      <h1 style="font-size: 3em"><span style="color: #5865f2">Flopo</span>Site</h1>
      <p>Connectes-toi via <span style="color: #5865f2">Discord</span> 👇</p>

      <v-btn
        class="btn-login text-capitalize px-8"
        style="border-radius: 10px"
        height="40"
        color="white"
        variant="text"
        :disabled="!flapi_ready"
        @click="handleLogin"
      >
        <span>Connexion</span>
        <div class="shine"></div>
      </v-btn>

      <p v-if="maintenanceInfo?.scheduled" class="mt-5" style="color: #ddd">
        ⏳ Maintenance prévue<span v-if="maintenanceInfo.remaining">
          dans {{ maintenanceInfo.remaining }}</span
        >
      </p>

      <p v-else-if="!flapi_ready" class="mt-5" style="color: #ddd">
        <template v-if="maintenanceInfo?.active">
          🔧 FlopoBot est en maintenance<span v-if="maintenanceInfo.remaining"
            >, retour dans {{ maintenanceInfo.remaining }}</span
          >
        </template>
        <template v-else> FlopoBot n'est pas disponible pour le moment :( </template>
      </p>
    </div>
  </div>

  <div class="flopo-img">
    <v-img class="flopobot" src="flopobot.webp"></v-img>
  </div>

  <div class="flopo-img-sm">
    <v-img src="flopobot.webp" width="200px"></v-img>
  </div>

  <footer
    class="w-100 d-flex justify-end flex-wrap px-4"
    style="position: fixed; bottom: 5px; left: 0; z-index: 10; column-gap: 4em"
  >
    <a href="/cgv">Conditions Générales de Vente</a>
    <a href="/privacy">Politique de Confidentialité</a>
  </footer>
</template>

<script>
/* global localStorage */
import flapi, { FLAPI_BASE } from '@/services/flapi.js'
import { getSocket } from '@/services/socket.js'
import { useFlopoToasts } from '@/composables/useFlopoToasts.js'

export default {
  setup() {
    return { ...useFlopoToasts() }
  },

  data() {
    return {
      flapi_ready: false,
      discordId: null,
      maintenanceInfo: null,
      socket: null,
    }
  },

  computed: {
    discordAuthUrl() {
      return FLAPI_BASE + '/auth/discord'
    },
  },

  async mounted() {
    this.initSocket()
    await this.checkFlapi()
  },

  beforeUnmount() {
    if (this.socket) {
      this.socket.off('connect', this._onConnect)
      this.socket.off('disconnect', this._onDisconnect)
      this.socket.off('maintenance-update', this._onMaintenanceUpdate)
      this.socket.off('maintenance-scheduled', this._onMaintenanceScheduled)
    }
  },

  methods: {
    initSocket() {
      this.socket = getSocket()

      this._onConnect = async () => {
        console.log('Connected to WebSocket server')
        await this.checkFlapi()
      }
      this._onDisconnect = () => {
        console.log('Disconnected from WebSocket server')
      }
      this._onMaintenanceUpdate = (data) => {
        if (data.active) {
          this.maintenanceInfo = {
            active: true,
            remaining: this.formatRemaining(data.estimatedEnd),
          }
          this.flapi_ready = false
        }
      }
      this._onMaintenanceScheduled = (data) => {
        if (data?.startsAt) {
          this.maintenanceInfo = { scheduled: true, remaining: this.formatRemaining(data.startsAt) }
        } else {
          this.maintenanceInfo = null
        }
      }

      this.socket.on('connect', this._onConnect)
      this.socket.on('disconnect', this._onDisconnect)
      this.socket.on('maintenance-update', this._onMaintenanceUpdate)
      this.socket.on('maintenance-scheduled', this._onMaintenanceScheduled)
    },

    handleLogin() {
      window.location = this.discordAuthUrl
    },

    formatRemaining(timestamp) {
      if (!timestamp) return null
      const ms = timestamp - Date.now()
      if (ms <= 0) return null
      const totalSeconds = Math.ceil(ms / 1000)
      if (totalSeconds < 60) return `${totalSeconds}s`
      const minutes = Math.ceil(ms / 60000)
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`
      }
      return `${minutes}min`
    },

    async checkFlapi() {
      console.log('Checking flAPI...')
      try {
        const response = await flapi.get('/check')
        console.log('flAPI ready')
        this.flapi_ready = true
        // Check if a maintenance is scheduled
        if (response.data.scheduledMaintenance) {
          const { startsAt } = response.data.scheduledMaintenance
          this.maintenanceInfo = { scheduled: true, remaining: this.formatRemaining(startsAt) }
        }
      } catch (err) {
        console.log('flAPI not ready')
        this.flapi_ready = false
        if (err.response?.status === 503 && err.response?.data?.error === 'maintenance') {
          this.maintenanceInfo = {
            active: true,
            remaining: this.formatRemaining(err.response.data.estimatedEnd),
          }
        } else {
          this.maintenanceInfo = null
        }
      }
      this.discordId = localStorage.getItem('discordId')
      const token = localStorage.getItem('token')
      if (this.discordId && token && this.flapi_ready) this.$router.push('/dashboard')
    },
  },
}
</script>

<style>
.discord-login {
  background: #5865f2;
  color: white;
  padding: 12px 24px;
  border-radius: 10px;
  text-decoration: none;
  display: inline-block;
  margin-top: 20px;
}

.btn-login {
  box-sizing: border-box;
  position: relative;
  margin-top: 40px;
  padding: 12px 40px;
  font-size: 1em;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #ddd;
  background: #1c2526;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden !important;
  z-index: 1;
  pointer-events: all;
  transition: all 0.3s ease;
}

.btn-login::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, #5865f2, #7984f5);
  border-radius: 14px;
  z-index: -1;
  transition: all 0.3s ease;
}

.btn-login::after {
  content: '';
  position: absolute;
  inset: 2px;
  background: #1c2526;
  border-radius: 10px;
  z-index: -1;
}

.btn-login:hover::before {
  filter: blur(1px);
}

.shine {
  box-sizing: border-box;
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
  z-index: 0;
}

.btn-login:hover .shine {
  transform: translateX(100%);
}

.login {
  display: flex;
  place-content: center;
  place-items: center;
  pointer-events: none;
}

.flopo-img {
  position: fixed;
  top: -50vh;
  right: -25vw;
  width: 150vw;
  height: 200vh;
  background: linear-gradient(-90deg, #5865f255, transparent);
  background-position: center;
  background-size: cover;
  border-radius: 20px;
  transform-style: preserve-3d;
  transition: transform 0.1s ease;
}

.flopobot {
  position: absolute;
  top: 50%;
  left: 65%;
  width: 300px;
  transform: translate(-50%, -50%) translateZ(175px);
}

.flopo-img-sm {
  position: absolute;
  bottom: 50px;
  right: 10px;
  display: none;
}

@media (max-width: 850px) {
  /*html {
    height: 100vh !important;
    width: 100vw !important;
    overflow: hidden !important;
  }*/
  .flopo-img {
    display: none;
    position: absolute;
    background: transparent;
    top: -10vh;
    height: 120vh;
  }

  .flopobot {
    position: absolute;
    top: 70%;
    left: 70%;
  }

  .flopo-img-sm {
    display: flex;
  }

  .login {
    margin-top: 10rem;
  }
}

a {
  color: #dddddd77 !important;
  font-size: 0.9em;
  line-height: 0.95em;
}

a:hover {
  color: #ddd !important;
}
</style>
