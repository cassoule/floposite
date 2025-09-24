<template>
  <v-layout class="w-100">
    <v-main class="text-secondary w-100" :key="Date.now()">
      <!-- Header -->
      <v-row class="align-center mt-12 mb-8" no-gutters>
        <v-col cols="12" class="d-flex align-center justify-space-between" style="flex-wrap: wrap; gap: 1em">
          <div class="d-flex align-center" style="gap: 0.5rem">
            <h2 class="text-h5 text-white">Blackjack</h2>
            <v-chip class="ml-2" size="small" color="white" variant="flat" style="font-size: 0.9em"
              >β Bêta</v-chip
            >
          </div>

          <div class="d-flex align-center" style="gap: 1rem">
            <div class="d-flex align-center time-left">
              <v-icon size="18">mdi-timer-outline</v-icon>
              <span class="ml-2" style="width: 40px">{{ prettyTimeLeft }}</span>
            </div>
            <v-btn v-if="!isInRoom" color="primary" rounded="lg" @click="join">Rejoindre</v-btn>
            <v-btn v-else color="secondary" variant="tonal" rounded="lg" @click="leave">Quitter</v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Loading -->
      <v-row v-if="!room" justify="center" class="my-8">
        <v-progress-circular class="my-16 py-16" indeterminate :size="36" />
      </v-row>

      <!-- Main content -->
      <v-row v-else class="pb-8" no-gutters>
        <!-- Table -->
        <v-col cols="12" lg="8" class="pr-lg-4 order-2 order-lg-1">
          <v-card class="px-5 pt-4 pb-5 smooth-cards dealer-card" variant="tonal" rounded="xl">
            <!-- Dealer -->
            <div class="d-flex align-center justify-space-between mb-3">
              <h3 class="">Dealer</h3>
              <v-chip size="small" :color="dealerRevealed ? 'primary' : 'default'" variant="flat">
                Total : {{ dealerTotalText }}
              </v-chip>
            </div>

            <div v-if="dealerCardsForView[0]" class="cards-row">
              <v-img
                v-for="(c, idx) in dealerCardsForView"
                :key="'d-' + idx"
                :src="c === 'XX' ? '/cards/webp/card_back.webp' : '/cards/webp/' + c + '.webp'"
                max-width="70px"
              ></v-img>
            </div>
            <div v-else class="cards-row d-flex w-100" style="height: 100px; place-content: center">
              <p class="font-weight-light">En attente de la prochaine manche</p>
            </div>
          </v-card>

          <!-- My hand -->
          <v-card v-if="me" class="mt-4 px-5 pt-3 pb-4 smooth-cards me-card" variant="tonal" rounded="xl">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="d-flex align-center" style="gap: 0.5rem">
                <v-img :src="me.avatar" width="40px" rounded="circle"></v-img>
                <div>
                  <div class="text-subtitle-2 font-weight-bold">{{ me.globalName }}</div>
                  <div class="meta" style="color: #777">
                    {{ formatAmount(me.bank) }} • Mise: {{ me.currentBet.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') }}
                  </div>
                </div>
              </div>
              <v-chip size="small" variant="flat" :color="meStatusColor">{{ myHandStatusText }}</v-chip>
            </div>

            <div class="cards-row mb-3">
              <v-img
                v-for="(c, idx) in myCards"
                :key="'p-' + idx"
                :src="'/cards/webp/' + c + '.webp'"
                max-width="70px"
              ></v-img>
              <div class="hand-total ml-3" v-if="myTotalText !== '0'">{{ myTotalText }}</div>
            </div>

            <!-- Betting panel -->
            <div v-if="room.status === 'betting' && !me.currentBet" class="d-flex flex-column align-center bet-panel pt-14">
              <div class="w-100 d-flex align-center justify-end">
                <v-text-field
                  v-model.number="bet"
                  variant="outlined"
                  rounded="lg"
                  base-color="primary"
                  type="number"
                  density="compact"
                  :max="room.maxBet"
                  :min="room.minBet"
                  style="max-width: 120px"
                  hide-details
                />
                <v-btn
                  class="ml-3"
                  variant="flat"
                  color="primary"
                  :disabled="bet < room.minBet || bet > room.maxBet"
                  rounded="lg"
                  @click="placeBet"
                >Miser</v-btn
                >
              </div>
              <v-slider
                v-model="bet"
                :min="room.minBet"
                :max="room.maxBet"
                :step="betStep"
                color="primary"
                class="px-1 w-100"
                thumb-label
                hide-details
              />
            </div>

            <!-- Action bar -->
            <div
              v-else-if="room.status === 'playing'"
              class="d-flex align-center"
              style="gap: 0.5rem"
            >
              <v-btn
                class="text-none"
                color="primary"
                variant="flat"
                rounded="lg"
                append-icon="mdi-plus"
                @click="doAction('hit')"
                :disabled="!canHit"
                >Hit</v-btn
              >
              <v-btn
                class="text-none"
                color="primary"
                variant="flat"
                rounded="lg"
                append-icon="mdi-hand-back-right-outline"
                @click="doAction('stand')"
                :disabled="!canStand"
                >Hold</v-btn
              >
              <v-btn
                class="text-none"
                color="primary"
                variant="flat"
                rounded="lg"
                append-icon="mdi-cash-multiple"
                @click="doAction('double')"
                :disabled="!canDouble"
                >Double</v-btn
              >
              <v-btn
                class="text-none"
                color="secondary"
                variant="outlined"
                rounded="lg"
                append-icon="mdi-call-split"
                  @click="doAction('surrender')"
                :disabled="!canSurrender"
                >Split</v-btn
              >
            </div>

            <div v-else class="text-white-70 text-caption" style="position: absolute; bottom: 15px">Prochaine manche imminente…</div>
          </v-card>
        </v-col>

        <!-- Sidebar: players -->
        <v-col cols="12" lg="4" class="order-3 mt-4 order-lg-2 mt-lg-0">
          <v-card class="px-5 pt-3 pb-4 smooth-cards sidebar" variant="tonal" rounded="xl">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-subtitle-2">
                <span class="font-weight-bold">Joueurs</span> ({{ room.players.length }})
              </div>
              <div class="text-caption" style="color: #777">Shoe: {{ room.shoeCount }}</div>
            </div>

            <div class="players">
              <div v-for="p in room.players" :key="p.id" class="player d-flex align-start">
                <v-img :src="p.avatar" max-width="40px" rounded="circle"></v-img>
                <div class="player-info">
                  <div class="top">
                    <span class="name" :class="{ me: p.id === discordId }">{{ p.globalName }}</span>
                    <v-chip
                      size="x-small"
                      variant="flat"
                      :color="playerStatusColor(p)"
                      >{{ playerHandStatusText(p) }}</v-chip
                    >
                  </div>
                  <div class="meta">{{ formatAmount(p.bank) }} • Mise: {{ p.currentBet.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') }}</div>
                  <div class="cards-mini" v-if="p.hands && p.hands[0]">
                    <v-img
                      v-for="(c, idx) in p.hands[0].cards"
                      :key="p.id + '-' + idx"
                      :src="'/cards/webp/' + c + '.webp'"
                      max-width="40px"
                    ></v-img>
                    <span class="total" v-if="p.hands[0].cards.length">{{ p.hands[0].total }}</span>
                  </div>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Snackbar -->
      <v-snackbar
        v-model="snackbar.show"
        class="cursor-pointer"
        :timeout="2000"
        location="bottom right"
        color="primary"
        rounded="lg"
        close-on-content-click
      >
        {{ snackbar.msg }}
        <template #actions>
          <v-icon>mdi-cards</v-icon>
        </template>
      </v-snackbar>
    </v-main>

    <v-btn
      class="back-btn text-none"
      text="Retour"
      variant="tonal"
      color="#ddd"
      @click="$router.push('/dashboard')"
    ></v-btn>
  </v-layout>
</template>

<script>
// Lightweight inline components and logic that match your style
import axios from 'axios'
import { io } from 'socket.io-client'
import { defineComponent } from 'vue'

export default {
  data: () => ({
    discordId: null,
    room: null,
    bet: 50,
    snackbar: { show: false, msg: '' },
    nowTick: Date.now(),
    socket: null,
  }),

  async mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) return this.$router.push('/')

    this.initSocket()
    await this.getRoom()

    this._forceCooldown = 0
    this._timer = setInterval(async () => {
      this.nowTick = Date.now()
      const room = this.room
      if (room?.phase_ends_at) {
        const left = room.phase_ends_at - this.nowTick
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

  beforeUnmount() {
    if (this.socket) this.socket.disconnect()
    if (this._timer) clearInterval(this._timer)
    if (this._onVis) document.removeEventListener('visibilitychange', this._onVis)
  },

  computed: {
    isInRoom() {
      if (!this.room) return false
      return this.room.players.some((p) => p.id === this.discordId)
    },
    me() {
      return this.room?.players.find((p) => p.id === this.discordId) || null
    },
    myHand() {
      return this.me?.hands?.[0] || null
    },
    myCards() {
      return this.myHand?.cards || []
    },
    myTotalText() {
      return this.myHand ? `${this.myHand.total}${this.myHand.soft ? ' (soft)' : ''}` : '—'
    },
    myHandStatusText() {
      const h = this.myHand
      if (!h) return '—'
      if (h.surrendered) return 'Abandon'
      if (h.busted) return 'Brûlé'
      if (h.stood) return 'Tenu'
      if (this.room?.status === 'playing') return 'En jeu'
      return '—'
    },
    meStatusColor() {
      const h = this.myHand
      if (!h) return 'default'
      if (h.surrendered) return 'warning'
      if (h.busted) return 'error'
      if (h.stood) return 'success'
      return 'default'
    },
    dealerRevealed() {
      return this.room && this.room.dealer?.total !== null
    },
    dealerCardsForView() {
      return this.room?.dealer?.cards || []
    },
    dealerTotalText() {
      return this.dealerRevealed ? this.room.dealer.total : '—'
    },
    betStep() {
      return 10
    },
    prettyTimeLeft() {
      if (!this.room?.phase_ends_at) return '—'
      const left = Math.max(1.5, this.room.phase_ends_at - this.nowTick)
      const s = Math.ceil(left / 1000)-1
      const mm = String(Math.floor(s / 60)).padStart(2, '0')
      const ss = String(Math.floor(s % 60)).padStart(2, '0')
      return `${mm}:${ss}`
    },
    canHit() {
      const h = this.myHand
      if (!h) return false
      return this.room?.status === 'playing' && !h.busted && !h.stood && !h.surrendered
    },
    canStand() {
      return this.canHit
    },
    canDouble() {
      const h = this.myHand
      if (!h) return false
      return (
        this.room?.status === 'playing' &&
        h.cards?.length === 2 &&
        !h.busted &&
        !h.stood &&
        !h.surrendered &&
        !h.doubled
      )
    },
    canSurrender() {
      const h = this.myHand
      if (!h) return false
      return (
        this.room?.status === 'playing' &&
        h.cards?.length === 2 &&
        !h.busted &&
        !h.stood &&
        !h.surrendered
      )
    },
  },

  methods: {
    toast(msg) {
      this.snackbar = { show: true, msg }
    },

    initSocket() {
      this.socket = io(import.meta.env.VITE_FLAPI_URL.replace('/api', ''), {
        withCredentials: false,
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
      })
      // Accept both helper-based and direct events
      //this.socket.on('blackjack:update', ({ type, room }) => { this.room = room })
      this.socket.on('connect', async () => {
        await this.getRoom()
      })
      this.socket.on('reconnect', async () => {
        await this.getRoom()
      })
      this.socket.on('connect_error', (err) => {
        console.log('socket connect_error', err?.message)
      })
      //this.socket.on('blackjack:toast', (p) => { if (p) this.toast(this.humanToast(p)) })

      // If your socket helper emits something like emitUpdate(event, snapshot),
      // also listen to a generic channel:
      this.socket.on('blackjack:update', (payload) => {
        if (payload?.room) this.room = payload.room
      })
      this.socket.on('blackjack:toast', (p) => {
        console.log('blackjack toast', p)
        if (p.userId) {
          if (p.userId === this.discordId) {
            this.toast(this.humanToast(p))
          }
        } else {
          this.toast(this.humanToast(p))
        }
      })
    },

    humanToast(p) {
      if (!p || !p.type) return ''
      switch (p.type) {
        case 'player-bet':
          return `+ Mise placée`
        case 'player-hit':
          return `Carte tirée`
        case 'player-stand':
          return `Le joueur reste`
        case 'player-double':
          return `Double !`
        case 'player-surrender':
          return `Abandon`
        case 'payout-res':
          if (p.allRes[this.discordId].result === 'lose') return 'Perdu'
          else return p.allRes[this.discordId].delta.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Flopos'
        case 'player-timeout':
          return 'Abandon automatique'
        case 'player-auto-stand':
          return 'Le joueur reste (automatique)'
        default:
          return ''
      }
    },

    async getRoom() {
      try {
        const response = await axios.get((import.meta.env.VITE_FLAPI_URL || '') + '/blackjack', {
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache', Expires: '0' },
          params: { t: Date.now() },
        })
        this.room = response.data.room
      } catch (e) {
        console.log(e)
      }
    },

    async join() {
      try {
        await axios.post((import.meta.env.VITE_FLAPI_URL || '') + '/blackjack/join', {
          userId: this.discordId,
        })
        await this.getRoom()
        this.toast('Tu as rejoint la table')
      } catch (e) {
        console.log(e)
      }
    },

    async leave() {
      try {
        await axios.post((import.meta.env.VITE_FLAPI_URL || '') + '/blackjack/leave', {
          userId: this.discordId,
        })
        await this.getRoom()
        this.toast('Tu as quitté la table')
      } catch (e) {
        console.log(e)
      }
    },

    async placeBet() {
      try {
        const r = await axios.post((import.meta.env.VITE_FLAPI_URL || '') + '/blackjack/bet', {
          userId: this.discordId,
          amount: this.bet,
        })
        if (r.status === 200) this.toast('Mise acceptée')
        await this.getRoom()
      } catch (e) {
        const msg = e?.response?.data?.message || 'Erreur de mise'
        this.toast(msg)
      }
    },

    async doAction(action) {
      try {
        const r = await axios.post(
          (import.meta.env.VITE_FLAPI_URL || '') + '/blackjack/action/' + action,
          {
            userId: this.discordId,
          },
        )
        if (r.status !== 200) {
          this.toast(r?.data?.message || 'Action refusée')
        }
      } catch (e) {
        const msg = e?.response?.data?.message || 'Action refusée'
        this.toast(msg)
      }
    },

    formatAmount(amount) {
      if (amount >= 1000000000) {
        amount /= 1000000000
        return (
          amount
            .toFixed(2)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + 'Md'
        )
      }
      if (amount >= 1000000) {
        amount /= 1000000
        return (
          amount
            .toFixed(2)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + 'M'
        )
      }
      if (amount >= 10000) {
        amount /= 1000
        return (
          amount
            .toFixed(2)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + 'K'
        )
      }
      return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    },

    playerHandStatusText(p) {
      const h = p.hands[0]
      if (!h) return '—'
      if (h.surrendered) return 'Abandon'
      if (h.busted) return 'Brûlé'
      if (h.stood) return 'Tenu'
      if (this.room?.status === 'playing') return 'En jeu'
      return '—'
    },
    playerStatusColor(p) {
      const h = p.hands[0]
      if (!h) return 'default'
      if (h.surrendered) return 'warning'
      if (h.busted) return 'error'
      if (h.stood) return 'success'
      return 'default'
    },
  },
}
</script>

<style scoped>
.text-white-70 {
  color: rgba(255, 255, 255, 0.7);
}
.cards-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.hand-total {
  font-weight: 600;
  opacity: 0.9;
}

.players {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.player {
  gap: 0.75rem;
}
.player .player-info {
  flex: 1;
}
.player .top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.player .name {
  font-weight: 600;
  opacity: 0.95;
}
.player .name.me {
  color: var(--v-theme-primary);
}
.player .meta {
  font-size: 0.8rem;
  opacity: 0.7;
}
.cards-mini {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.2rem;
  flex-wrap: wrap;
  width: 100%;
}
.cards-mini .total {
  margin-left: 0.25rem;
  font-size: 0.8rem;
  opacity: 0.8;
}

/* Avatar */
.avatar {
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  width: 36px;
  height: 36px;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Card visuals */
.card {
  width: 64px;
  height: 90px;
  border-radius: 10px;
  background: linear-gradient(180deg, #fff, #f3f3f3);
  color: #111;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}
.card.sm {
  width: 32px;
  height: 45px;
  border-radius: 6px;
}
.card.red {
  color: #d02626;
}
.card.black {
  color: #111;
}
.card .corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}
.card .corner.tl {
  top: 6px;
  left: 8px;
}
.card .corner.br {
  bottom: 6px;
  right: 8px;
  transform: rotate(180deg);
}
.card .corner .r {
  font-weight: 700;
  font-size: 14px;
}
.card .corner .s {
  font-size: 14px;
  margin-top: 2px;
}
.card.sm .corner .r,
.card.sm .corner .s {
  font-size: 10px;
}

/* Bet panel */
.bet-panel {
  gap: 0.75rem;
}
.time-left {
  opacity: 0.85;
}

.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 12px;
}

.smooth-cards {
  transition: .5s ease-in-out;
}
.sidebar {
  min-height: 100px;
  max-height: 430px;
  overflow-y: scroll;
}
.me-card {
  min-height: 235px;
}
.dealer-card {
  min-height: 180px;
}
</style>