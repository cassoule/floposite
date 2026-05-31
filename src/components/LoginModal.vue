<template>
  <transition name="modal-fade">
    <div v-if="visible" class="login-modal-overlay" @click.self="$emit('close')">
      <div class="login-modal">
        <button class="modal-close" @click="$emit('close')">&times;</button>

        <div class="modal-cat">
          <img src="/flopobot.webp" alt="Flopo" class="modal-cat-img" />
        </div>

        <h2 class="modal-title">Bienvenue sur <span class="title-flopo">Flopo</span>Site</h2>
        <p class="modal-subtitle">Connecte-toi pour accéder à tous les jeux, classements et récompenses</p>

        <div class="login-methods">
          <button
            v-for="method in methods"
            :key="method.id"
            class="login-method-btn"
            :class="[method.id, method.btnClass]"
            :disabled="isMethodDisabled(method)"
            @click="handleLogin(method)"
          >
            <img
              v-if="method.src"
              :src="method.src"
              :alt="method.label || method.id"
              class="login-method-img"
            />
            <component
              :is="method.component || 'i'"
              v-else-if="method.icon"
              :class="method.icon"
              :aria-label="method.label || method.id"
            ></component>

            <span v-if="method.label && !method.hideLabel">{{ method.label }}</span>
          </button>
        </div>

        <div class="modal-status" v-if="!flapi_ready">
          <div class="status-dot" :class="{ active: maintenanceInfo?.active, scheduled: maintenanceInfo?.scheduled }"></div>
          <template v-if="maintenanceInfo?.scheduled">
            <span>Maintenance prévue<span v-if="maintenanceInfo.remaining"> dans {{ maintenanceInfo.remaining }}</span></span>
          </template>
          <template v-else-if="maintenanceInfo?.active">
            <span>FlopoBot en maintenance<span v-if="maintenanceInfo.remaining">, retour dans {{ maintenanceInfo.remaining }}</span></span>
          </template>
          <template v-else>
            <span>FlopoBot n'est pas disponible pour le moment :(</span>
          </template>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
/* global localStorage */
import flapi, { FLAPI_BASE } from '@/services/flapi.js'
import { getSocket } from '@/services/socket.js'
import { getMethods, subscribe, defaultHandler } from '@/services/loginMethods.js'

export default {
  name: 'LoginModal',

  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['close'],

  data() {
    return {
      flapi_ready: false,
      maintenanceInfo: null,
      socket: null,
      methods: [],
    }
  },

  created() {
    this.methods = getMethods()
    this._unsubscribe = subscribe(() => {
      this.methods = [...getMethods()]
    })
  },

  async mounted() {
    this.initSocket()
    await this.checkFlapi()
  },

  beforeUnmount() {
    if (this._unsubscribe) this._unsubscribe()
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

    isMethodDisabled(method) {
      if (method.isDisabled) return method.isDisabled(this)
      // Legacy: only Discord requires flapi_ready
      return !this.flapi_ready && method.id === 'discord'
    },

    handleLogin(method) {
      // Redirect to dashboard after login
      localStorage.setItem('returnUrl', '/dashboard')
      if (method.handler) {
        method.handler(method, this)
      } else if (method.authUrl) {
        window.location = method.authUrl
      }
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

    },
  },
}
</script>

<style scoped>
/* ─── Overlay ─── */
.login-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  font-family: 'Poppins', sans-serif;
}

/* ─── Modal ─── */
.login-modal {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  background: #1a1d23;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 48px 40px 36px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  color: #888;
  font-size: 28px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: color 0.2s ease;
}

.modal-close:hover {
  color: #fff;
}

/* ─── Cat image ─── */
.modal-cat-img {
  width: 140px;
  height: auto;
}

/* ─── Title ─── */
.modal-title {
  font-size: 1.8em;
  margin: 0;
  font-family: 'Poppins', sans-serif;
  font-weight: 300;
  color: #fff;
}

.title-flopo {
  color: #5865f2;
  font-weight: 700;
}

.modal-subtitle {
  color: #ABB0B6;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  margin: -4px 0 0;
  max-width: 300px;
}

/* ─── Login methods ─── */
.login-methods {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 4px;
}

.login-method-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 16px 20px;
  border: none;
  border-radius: 14px;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.login-method-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Discord button - style bleu */
.login-method-btn.discord {
  background: #5865f2;
  color: #fff;
  border: none;
  box-shadow: 0px 4px 12px 0px rgba(88, 101, 242, 0.35);
  font-size: 20px;
  letter-spacing: 0.02em;
}

.login-method-btn.discord:hover {
  background: #4752c4;
  box-shadow: 0px 4px 16px 0px rgba(88, 101, 242, 0.5);
}

.login-method-btn.discord:active {
  transform: scale(0.97);
}

/* Rendre le SVG Discord blanc sur fond bleu */
.login-method-btn.discord .login-method-img {
  filter: brightness(0) invert(1);
  height: 28px;
}

/* Logo SVG universel */
.login-method-img {
  height: 32px;
  width: auto;
  object-fit: contain;
}

/* ─── Status ─── */
.modal-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ABB0B6;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  margin-top: 4px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #666;
  flex-shrink: 0;
}

.status-dot.active {
  background: #f44336;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

.status-dot.scheduled {
  background: #ff9800;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ─── Transition ─── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .login-modal,
.modal-fade-leave-active .login-modal {
  transition: transform 0.25s ease;
}
.modal-fade-enter-from .login-modal {
  transform: scale(0.92);
}
.modal-fade-leave-to .login-modal {
  transform: scale(0.92);
}
</style>