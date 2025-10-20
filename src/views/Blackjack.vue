<template>
  <v-layout class="w-100">
    <v-main class="text-secondary w-100" :key="Date.now()">
      <!-- Header -->
      <v-row class="align-center mt-12 mb-8" no-gutters>
        <v-col
          cols="12"
          class="d-flex align-center justify-space-between"
          style="flex-wrap: wrap; gap: 1em"
        >
          <div class="d-flex align-center" style="gap: 0.5rem">
            <h2 class="text-h5 text-white">Blackjack</h2>
            <v-chip class="ml-2" size="small" color="white" variant="flat">β Bêta</v-chip>
          </div>

          <div class="d-flex align-center" style="gap: 1rem">
            <div class="d-flex align-center time-left">
              <v-icon size="18">mdi-timer-outline</v-icon>
              <span class="ml-2" style="width: 40px">{{ prettyTimeLeft }}</span>
            </div>
            <v-btn v-if="!isInRoom" color="primary" rounded="lg" @click="join">Rejoindre</v-btn>
            <v-btn v-else color="secondary" variant="tonal" rounded="lg" @click="leave"
              >Quitter</v-btn
            >
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

          <!-- My hands -->
          <v-card
            v-if="me"
            class="mt-4 px-5 pt-3 pb-4 smooth-cards me-card"
            variant="tonal"
            rounded="xl"
          >
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="d-flex align-center" style="gap: 0.5rem">
                <v-img :src="me.avatar" width="40px" rounded="circle"></v-img>
                <div>
                  <div class="text-subtitle-2 font-weight-bold">{{ me.globalName }}</div>
                  <div class="meta" style="color: #777">
                    {{ formatAmount(me.bank) }} • Mise: {{ formatAmount(me.currentBet) }}
                  </div>
                </div>
              </div>
              <!-- Status for the active hand -->
              <v-chip size="small" variant="flat" :color="meStatusColor(activeHand)">{{
                myHandStatusText(activeHand)
              }}</v-chip>
            </div>

            <!-- Hand Selection (if multiple hands) -->
            <div v-if="me.hands && me.hands.length > 1" class="d-flex mt-2 mb-3" style="gap: 0.5rem">
              <v-chip
                v-for="(hand, index) in me.hands"
                :key="'hand-select-' + index"
                :color="index === activeHandIndex ? 'primary' : 'default'"
                variant="flat"
                size="small"
              >
                <span>{{formatAmount(hand.bet)}} Flopos</span>
              </v-chip>
            </div>

            <!-- Render each hand -->
            <div v-for="(hand, index) in me.hands" :key="'player-hand-' + index">
              <div
                class="cards-row mb-3"
                :class="{
                  'active-hand-border':
                    index === activeHandIndex &&
                    room.status === 'playing' &&
                    !hand.busted &&
                    !hand.stood &&
                    !hand.surrendered &&
                    !hand.doubled,
                }"
              >
                <v-img
                  v-for="(c, cIdx) in hand.cards"
                  :key="'p-' + index + '-' + cIdx"
                  :src="'/cards/webp/' + c + '.webp'"
                  max-width="70px"
                ></v-img>
                <div class="hand-total ml-3" v-if="hand.total !== null && hand.total > 0">
                  {{ hand.total }}{{ hand.soft ? ' (soft)' : '' }}
                </div>
              </div>

              <!-- Betting panel (only if no bet yet, and only one hand) -->
              <div
                v-if="room.status === 'betting' && !me.currentBet && me.hands.length === 1"
                class="d-flex flex-column align-center bet-panel pt-14"
              >
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

              <!-- Action bar (only for the active hand during playing phase) -->
              <div
                v-else-if="room.status === 'playing' && index === activeHandIndex"
                class="d-flex align-center pb-3"
                style="gap: 0.5rem; flex-wrap: wrap"
              >
                <v-btn
                  class="text-none"
                  color="primary"
                  variant="flat"
                  rounded="lg"
                  append-icon="mdi-plus"
                  @click="doAction('hit', index)"
                  :disabled="!canHit(hand)"
                  >Hit</v-btn
                >
                <v-btn
                  class="text-none"
                  color="primary"
                  variant="flat"
                  rounded="lg"
                  append-icon="mdi-hand-back-right-outline"
                  @click="doAction('stand', index)"
                  :disabled="!canStand(hand)"
                  >Hold</v-btn
                >
                <v-btn
                  class="text-none"
                  color="primary"
                  variant="flat"
                  rounded="lg"
                  append-icon="mdi-cash-multiple"
                  @click="doAction('double', index)"
                  :disabled="!canDouble(hand)"
                  >Double</v-btn
                >
                <v-btn
                  class="text-none"
                  color="secondary"
                  variant="outlined"
                  rounded="lg"
                  append-icon="mdi-call-split"
                  @click="doAction('split', index)"
                  :disabled="!canSplit(hand)"
                  >Split</v-btn
                >
              </div>
            </div>
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
                    <!-- Display status for the first hand in the sidebar, or iterate if desired -->
                    <v-chip size="x-small" variant="flat" :color="playerStatusColor(p.hands[0])">{{
                      playerHandStatusText(p.hands[0])
                    }}</v-chip>
                  </div>
                  <div class="meta">
                    {{ formatAmount(p.bank) }} • Mise: {{ formatAmount(p.currentBet) }}
                  </div>
                  <div class="cards-mini" v-if="p.hands && p.hands[0]">
                    <!-- Display cards for all hands in the sidebar if needed, here just first hand -->
                    <div
                      v-for="(hand, hIdx) in p.hands"
                      :key="p.id + '-hand-mini-' + hIdx"
                      class="d-flex align-center mr-2"
                    >
                      <v-img
                        v-for="(c, idx) in hand.cards"
                        class="mr-1"
                        :key="p.id + '-' + hIdx + '-' + idx"
                        :src="'/cards/webp/' + c + '.webp'"
                        min-width="40px"
                        max-width="40px"
                      ></v-img>
                      <span class="total ml-1" v-if="hand.cards.length && hand.total !== null">{{
                        hand.total
                      }}</span>
                    </div>
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
    activeHandIndex: 0, // Tracks the currently selected hand for the 'me' player
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
    myHands() {
      return this.me?.hands || []
    },
    activeHand() {
      return this.myHands[this.activeHandIndex] || null
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
      const left = Math.max(0, this.room.phase_ends_at - this.nowTick) // Ensure it doesn't go negative
      const s = Math.ceil(left / 1000)
      const mm = String(Math.floor(s / 60)).padStart(2, '0')
      const ss = String(Math.floor(s % 60)).padStart(2, '0')
      return `${mm}:${ss}`
    },
  },

  watch: {
    myHands: {
      handler(newHands, oldHands) {
        // If the number of hands changes, or if the active hand no longer exists,
        // reset activeHandIndex to 0 or try to find the next valid unfinished hand.
        if (!newHands[this.activeHandIndex]) {
          // If current activeHandIndex is invalid, try to find an unfinished hand
          const firstUnfinishedIndex = newHands.findIndex(
            (hand) => !(hand.busted || hand.stood || hand.surrendered || hand.doubled),
          )
          this.activeHandIndex = firstUnfinishedIndex !== -1 ? firstUnfinishedIndex : 0
        }

        // Logic to automatically switch to the next hand if the current one is finished
        if (this.room?.status === 'playing' && newHands.length > 0) {
          const currentActiveHand = newHands[this.activeHandIndex]
          if (
            currentActiveHand &&
            (currentActiveHand.busted ||
              currentActiveHand.stood ||
              currentActiveHand.surrendered ||
              currentActiveHand.doubled)
          ) {
            // Find the next active hand that isn't finished
            const nextActiveIndex = newHands.findIndex(
              (hand, index) =>
                index > this.activeHandIndex &&
                !(hand.busted || hand.stood || hand.surrendered || hand.doubled),
            )
            if (nextActiveIndex !== -1) {
              this.activeHandIndex = nextActiveIndex
            } else {
              // If no subsequent unfinished hands, check from the beginning
              const firstUnfinishedIndex = newHands.findIndex(
                (hand) => !(hand.busted || hand.stood || hand.surrendered || hand.doubled),
              )
              if (firstUnfinishedIndex !== -1 && firstUnfinishedIndex !== this.activeHandIndex) {
                this.activeHandIndex = firstUnfinishedIndex
              }
            }
          }
        }
      },
      deep: true,
    },
    'room.status'(newStatus, oldStatus) {
      if (newStatus === 'betting' || newStatus === 'waiting' || newStatus === 'results') {
        this.activeHandIndex = 0
      }
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
      this.socket.on('connect', async () => {
        await this.getRoom()
      })
      this.socket.on('reconnect', async () => {
        await this.getRoom()
      })
      this.socket.on('connect_error', (err) => {
        console.log('socket connect_error', err?.message)
      })

      this.socket.on('blackjack:update', (payload) => {
        if (payload?.room) {
          this.room = payload.room
          // After room update, ensure activeHandIndex is valid or reset it
          if (this.me && this.me.hands && this.activeHandIndex >= this.me.hands.length) {
            this.activeHandIndex = 0
          }
        }
      })
      this.socket.on('blackjack:toast', (p) => {
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
        case 'player-split':
          return `Main divisée !`
        case 'payout-res':
          if (p.allRes[this.discordId]) {
            let totalDelta = 0
            p.allRes[this.discordId].forEach((hand) => {
              totalDelta += hand.delta
            })
            return `${totalDelta < 0 ? '' : '+'}${this.formatAmount(totalDelta)} Flopos`
          }
          return 'Manche terminée'
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
        // Ensure activeHandIndex is valid after room update
        if (this.me && this.me.hands && this.activeHandIndex >= this.me.hands.length) {
          this.activeHandIndex = 0
        }
      } catch (e) {
        console.log(e)
        // Consider showing a toast for error in fetching room
        this.toast(e?.response?.data?.message || 'Erreur lors de la récupération de la salle')
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
        this.toast(e?.response?.data?.message || 'Erreur lors de la connexion')
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
        this.toast(e?.response?.data?.message || 'Erreur lors de la déconnexion')
      }
    },

    async placeBet() {
      try {
        const r = await axios.post((import.meta.env.VITE_FLAPI_URL || '') + '/blackjack/bet', {
          userId: this.discordId,
          amount: this.bet,
        })
        if (r.status === 200) this.toast('Mise acceptée')
        // We rely on the socket.io update for the room state after bet,
        // but a manual getRoom() can be a fallback or for initial setup
        await this.getRoom()
      } catch (e) {
        const msg = e?.response?.data?.message || 'Erreur de mise'
        this.toast(msg)
      }
    },

    async doAction(action, handIndex) {
      try {
        const r = await axios.post(
          (import.meta.env.VITE_FLAPI_URL || '') + '/blackjack/action/' + action,
          {
            userId: this.discordId,
            handIndex: handIndex,
          },
        )
        if (r.status !== 200) {
          this.toast(r?.data?.message || 'Action refusée')
        }
        // Socket.io should update the room state, no immediate getRoom needed.
      } catch (e) {
        const msg = e?.response?.data?.message || 'Action refusée'
        this.toast(msg)
      }
    },

    formatAmount(amount) {
      if (amount === null || amount === undefined) return '0'
      const num = Number(amount)
      if (isNaN(num)) return '0'

      if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2).replace(/\.00$/, '') + 'Md'
      }
      if (num >= 1000000) {
        return (num / 1000000).toFixed(2).replace(/\.00$/, '') + 'M'
      }
      if (num >= 10000) {
        return (num / 1000).toFixed(2).replace(/\.00$/, '') + 'K'
      }
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    },

    myHandStatusText(hand) {
      if (!hand) return '—'
      if (hand.surrendered) return 'Abandon'
      if (hand.busted) return 'Brûlé'
      if (hand.stood) return 'Tenu'
      if (hand.doubled) return 'Doublé'
      // A hand is "active" if it's the playing phase and not yet finished
      if (
        this.room?.status === 'playing' &&
        !(hand.busted || hand.stood || hand.surrendered || hand.doubled)
      )
        return 'En jeu'
      if (hand.cards?.length > 0 && hand.finished) return 'Terminé' // Backend should mark 'finished'
      return '—'
    },
    meStatusColor(hand) {
      if (!hand) return 'default'
      if (hand.surrendered) return 'warning'
      if (hand.busted) return 'error'
      if (hand.stood) return 'success'
      if (hand.doubled) return 'info'
      if (
        this.room?.status === 'playing' &&
        !(hand.busted || hand.stood || hand.surrendered || hand.doubled)
      )
        return 'primary' // Highlight active hand
      return 'default'
    },
    // Action eligibility now just checks hand status and room phase
    canHit(hand) {
      if (!hand) return false
      return (
        this.room?.status === 'playing' &&
        !(hand.busted || hand.stood || hand.surrendered || hand.doubled) // Cannot hit if already finished
      )
    },
    canStand(hand) {
      return this.canHit(hand) // Same conditions for standing
    },
    canDouble(hand) {
      if (!hand) return false
      return (
        this.room?.status === 'playing' &&
        hand.cards?.length === 2 && // Can only double on initial two cards
        !(hand.busted || hand.stood || hand.surrendered || hand.doubled) &&
        this.me.bank >= (hand.bet || this.bet) // Ensure player has enough funds to double their current bet for this hand
      )
    },
    canSplit(hand) {
      if (!hand) return false
      // For splitting, the two cards must be of the same rank, and only on initial two cards.
      // Also, the player must have enough bank to place an equal bet on the new hand.
      const canSplitRanks =
        hand.cards?.length === 2 && hand.cards[0].slice(0, -1) === hand.cards[1].slice(0, -1)
      return (
        this.room?.status === 'playing' &&
        canSplitRanks &&
        !(hand.busted || hand.stood || hand.surrendered || hand.doubled) &&
        this.me.bank >= (hand.bet || this.bet) && // Ensure player has enough funds for a new bet
        this.myHands.length < 4 // Common rule: max 4 hands (initial + 3 splits)
      )
    },
    // Player status for sidebar (simplified, just show first hand's status)
    playerHandStatusText(hand) {
      if (!hand) return '—'
      if (hand.surrendered) return 'Ab.'
      if (hand.busted) return 'Brûlé'
      if (hand.stood) return 'Tenu'
      if (hand.doubled) return 'Doublé'
      if (
        this.room?.status === 'playing' &&
        !(hand.busted || hand.stood || hand.surrendered || hand.doubled)
      )
        return 'En jeu'
      if (hand.cards?.length > 0 && hand.finished) return 'Terminé'
      return '—'
    },
    playerStatusColor(hand) {
      if (!hand) return 'default'
      if (hand.surrendered) return 'warning'
      if (hand.busted) return 'error'
      if (hand.stood) return 'success'
      if (hand.doubled) return 'info'
      return 'default'
    },
  },
}
</script>

<style scoped>
/* Add a subtle border to the active hand for better UX */
.active-hand-border {
  border: 2px solid #5865f2; /* Adjust color as needed */
  border-radius: 10px;
  padding: 5px; /* Give some space for the border */
  margin: -5px; /* Offset margin to keep layout stable */
}

/* Existing styles */
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
.player .meta {
  font-size: 0.8rem;
  opacity: 0.7;
}
.cards-mini {
  display: flex;
  flex-direction: column;
  align-items: start;
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
  transition: 0.5s ease-in-out;
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