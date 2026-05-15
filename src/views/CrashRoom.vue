<template>
  <v-layout class="w-100">
    <v-main class="text-secondary w-100">
      <CrashHeader
        :pretty-time-left="prettyTimeLeft"
        :is-in-room="isInRoom"
        @join="join"
        @leave="leave"
      />

      <v-row v-if="!room" justify="center" class="my-8">
        <v-progress-circular class="my-16 py-16" indeterminate :size="36" />
      </v-row>

      <v-row v-else class="pb-8" no-gutters>
        <v-col cols="12" lg="8" class="pr-lg-4 order-2 order-lg-1">
          <v-card class="px-5 pt-4 pb-5 smooth-cards" variant="tonal" rounded="xl">
            <CrashChart :room="room" @update-multiplier="(m) => (displayMultiplier = m)" />

            <CrashBetPanel
              :room="room"
              :me="me"
              :is-in-room="isInRoom"
              :display-multiplier="displayMultiplier"
              @place-bet="placeBet"
              @cashout="doCashout"
            />
          </v-card>
        </v-col>

        <v-col cols="12" lg="4" class="order-3 mt-4 order-lg-2 mt-lg-0">
          <CrashPlayersSidebar :room="room" :discord-id="discordId" />
        </v-col>
      </v-row>

      <v-snackbar
        v-model="snackbar.show"
        :timeout="2000"
        location="bottom right"
        color="primary"
        rounded="lg"
        close-on-content-click
      >
        {{ snackbar.msg }}
        <template #actions><v-icon>mdi-airplane</v-icon></template>
      </v-snackbar>
    </v-main>

    <home-btn />
  </v-layout>
</template>

<script>
import flapi, { FLAPI_BASE } from '@/services/flapi.js'
import { getSocket } from '@/services/socket.js'
import { formatAmount } from '@/utils/format.js'
import HomeBtn from '@/components/HomeBtn.vue'
import CrashHeader from '@/components/crash/CrashHeader.vue'
import CrashPlayersSidebar from '@/components/crash/CrashPlayersSidebar.vue'
import CrashBetPanel from '@/components/crash/CrashBetPanel.vue'
import CrashChart from '@/components/crash/CrashChart.vue'

export default {
  components: { HomeBtn, CrashHeader, CrashPlayersSidebar, CrashBetPanel, CrashChart },
  data: () => ({
    discordId: null,
    room: null,
    snackbar: { show: false, msg: '' },
    nowTick: Date.now(),
    socket: null,
    displayMultiplier: 1.0,
  }),
  computed: {
    isInRoom() {
      return this.room?.players?.some((p) => p.id === this.discordId) ?? false
    },
    me() {
      return this.room?.players?.find((p) => p.id === this.discordId) ?? null
    },
    prettyTimeLeft() {
      if (!this.room?.phase_ends_at) return '—'
      const left = Math.max(0, this.room.phase_ends_at - this.nowTick)
      const s = Math.ceil(left / 1000)
      const mm = String(Math.floor(s / 60)).padStart(2, '0')
      const ss = String(s % 60).padStart(2, '0')
      return `${mm}:${ss}`
    },
  },
  async mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) return this.$router.push('/')

    this.initSocket()
    await this.getRoom()

    this._forceCooldown = 0
    this._timer = setInterval(async () => {
      this.nowTick = Date.now()
      if (this.room?.phase_ends_at) {
        const left = this.room.phase_ends_at - this.nowTick
        if (left <= -250 && this.nowTick - (this._forceCooldown || 0) > 1000) {
          this._forceCooldown = this.nowTick
          await this.getRoom()
        }
      }
    }, 500)

    this._onVis = () => {
      if (document.visibilityState === 'visible') this.getRoom()
    }
    document.addEventListener('visibilitychange', this._onVis)
  },
  async beforeUnmount() {
    if (this.socket) {
      this.socket.off('connect', this._onConnect)
      this.socket.off('reconnect', this._onReconnect)
      this.socket.off('connect_error', this._onConnectError)
      this.socket.off('crash:update', this._onCrashUpdate)
      this.socket.off('crash-update', this._onCrashUpdate)
      this.socket.off('crash-flying', this._onCrashUpdate)
      this.socket.off('crash-crashed', this._onCrashUpdate)
      this.socket.off('crash-new-round', this._onCrashUpdate)
      this.socket.off('crash-player-joined', this._onCrashUpdate)
      this.socket.off('crash-player-left', this._onCrashUpdate)
      this.socket.off('crash-bet-placed', this._onCrashUpdate)
      this.socket.off('crash-player-cashed-out', this._onCrashUpdate)
      this.socket.off('crash:tick', this._onCrashTick)
      this.socket.off('crash-tick', this._onCrashTick)
      this.socket.off('crash:toast', this._onCrashToast)
      this.socket.off('crash-toast', this._onCrashToast)
    }
    if (this._timer) clearInterval(this._timer)
    if (this._onVis) document.removeEventListener('visibilitychange', this._onVis)
    if (this.isInRoom) await flapi.post('/crash/leave')
  },
  created() {
    this._boundHandleUnload = () => this.handleUnload()
    window.addEventListener('beforeunload', this._boundHandleUnload)
    window.addEventListener('pagehide', this._boundHandleUnload)
  },
  methods: {
    formatAmount,
    initSocket() {
      this.socket = getSocket()
      this._onConnect = async () => await this.getRoom()
      this.socket.on('connect', this._onConnect)
      this._onReconnect = async () => await this.getRoom()
      this.socket.on('reconnect', this._onReconnect)
      this._onConnectError = (err) => console.log('socket connect_error', err?.message)
      this.socket.on('connect_error', this._onConnectError)

      this._onCrashUpdate = (payload) => {
        if (payload) this.room = payload.room ? payload.room : payload
        if (payload?.allRes) this.handlePayoutResults(payload.allRes)
      }
      this.socket.on('crash:update', this._onCrashUpdate)
      this.socket.on('crash-update', this._onCrashUpdate)
      this.socket.on('crash-flying', this._onCrashUpdate)
      this.socket.on('crash-crashed', this._onCrashUpdate)
      this.socket.on('crash-new-round', this._onCrashUpdate)
      this.socket.on('crash-player-joined', this._onCrashUpdate)
      this.socket.on('crash-player-left', this._onCrashUpdate)
      this.socket.on('crash-bet-placed', this._onCrashUpdate)
      this.socket.on('crash-player-cashed-out', this._onCrashUpdate)

      this._onCrashTick = (payload) => {
        if (this.room) this.room.currentMultiplier = payload.currentMultiplier
      }
      this.socket.on('crash:tick', this._onCrashTick)
      this.socket.on('crash-tick', this._onCrashTick)

      this._onCrashToast = (p) => {
        if (p.userId && p.userId !== this.discordId) this.toast(this.humanToast(p))
        else if (!p.userId || p.userId === this.discordId) this.toast(this.humanToast(p))
      }
      this.socket.on('crash:toast', this._onCrashToast)
      this.socket.on('crash-toast', this._onCrashToast)
    },
    handlePayoutResults(allRes) {
      const mine = allRes[this.discordId]
      if (mine) this.toast(`${mine.delta >= 0 ? '+' : ''}${this.formatAmount(mine.delta)} Flopos`)
    },
    humanToast(p) {
      if (!p?.type) return ''
      if (p.type === 'player-bet')
        return `Mise de ${this.formatAmount(p.amount)} Flopos placée${p.autoCashout ? ` · Auto ${p.autoCashout.toFixed(2)}x` : ''}`
      if (p.type === 'player-cashed-out')
        return `Encaissé à ${p.multiplier?.toFixed(2)}x · +${this.formatAmount(p.winAmount)} Flopos`
      if (p.type === 'payout-res')
        return p.allRes?.[this.discordId]
          ? `${p.allRes[this.discordId].delta >= 0 ? '+' : ''}${this.formatAmount(p.allRes[this.discordId].delta)} Flopos`
          : 'Manche terminée'
      return ''
    },
    async getRoom() {
      try {
        const res = await flapi.get('/crash', {
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
          params: { t: Date.now() },
        })
        this.room = res.data.room
      } catch (e) {
        this.toast(e?.response?.data?.message || 'Erreur salle')
      }
    },
    async join() {
      try {
        await flapi.post('/crash/join')
        await this.getRoom()
        this.toast('Tu as rejoint la table')
      } catch (e) {
        this.toast(e?.response?.data?.message || 'Erreur')
      }
    },
    async leave() {
      try {
        await flapi.post('/crash/leave')
        await this.getRoom()
        this.toast('Tu as quitté la table')
      } catch (e) {
        this.toast(e?.response?.data?.message || 'Erreur')
      }
    },
    async placeBet(payload) {
      try {
        const r = await flapi.post('/crash/bet', payload)
        if (r.status === 200) this.toast('Mise acceptée')
        await this.getRoom()
      } catch (e) {
        this.toast(e?.response?.data?.message || 'Erreur de mise')
      }
    },
    async doCashout() {
      try {
        const r = await flapi.post('/crash/cashout')
        if (r.status === 200)
          this.toast(`Encaissé · +${this.formatAmount(r.data.winAmount)} Flopos`)
      } catch (e) {
        this.toast(e?.response?.data?.message || 'Cashout refusé')
      }
    },
    toast(msg) {
      this.snackbar = { show: true, msg }
    },
    handleUnload() {
      if (!this.isInRoom) return
      fetch((FLAPI_BASE || '') + '/crash/leave', {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...(localStorage.getItem('token')
            ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
            : {}),
        },
      }).catch(console.error)
    },
  },
}
</script>

<style scoped>
.smooth-cards {
  transition: 0.5s ease-in-out;
}
</style>
