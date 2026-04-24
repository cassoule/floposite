<template>
  <v-layout class="w-100">
    <v-main class="text-secondary w-100">
      <v-row class="align-center mt-12 mb-8" no-gutters>
        <v-col
          cols="12"
          class="d-flex align-center justify-space-between"
          style="flex-wrap: wrap; gap: 1em"
        >
          <div class="d-flex align-center" style="gap: 0.5rem">
            <h2 class="text-h5 text-white">Sic Bo</h2>
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

      <v-row v-if="!room" justify="center" class="my-8">
        <v-progress-circular class="my-16 py-16" indeterminate :size="36" />
      </v-row>

      <v-row v-if="room" no-gutters class="pb-8" style="align-items: flex-start">
        <v-col cols="12" lg="4" class="mb-2 mb-lg-4 pl-lg-4 d-flex flex-column" style="order: 1">
          <v-card
            class="px-3 px-lg-5 pt-3 pt-lg-6 pb-2 smooth-cards d-flex flex-column align-center justify-center"
            variant="tonal"
            rounded="xl"
            style="flex: 0 0 auto"
          >
            <Dice3D
              :status="room.status"
              :dice="room.dice || []"
              class="dice-3d-wrapper"
              style="width: 100%; min-height: unset; flex-shrink: 0"
            />

            <div class="dice-result-wrapper mt-2 mt-lg-5 w-100 text-center">
              <transition name="fade" mode="out-in">
                <div
                  v-if="showDelayedResult && room.dice && room.dice.length === 3"
                  class="dice-result"
                  key="result"
                >
                  <span class="dice-values">{{ room.dice.join(' - ') }}</span>
                  <span class="dice-sep"> | </span>
                  <span class="dice-oddeven">{{ diceSum % 2 === 0 ? 'Even' : 'Odd' }}</span>
                  <span class="dice-sep"> | </span>
                  <span class="dice-bigsmall">{{ diceSum >= 11 ? 'Big' : 'Small' }}</span>
                </div>
                <div v-else class="dice-placeholder" key="placeholder">En attente du lancer...</div>
              </transition>
            </div>

            <template v-if="$vuetify.display.lgAndUp && isInRoom && room.status === 'betting'">
              <v-divider class="my-3 w-100" />
              <div class="d-flex align-center flex-nowrap w-100" style="gap: 8px">
                <span class="font-weight-bold text-no-wrap">Mise :</span>
                <v-slider
                  v-model="betAmount"
                  :min="room.minBet || 10"
                  :max="maxAllowedBet"
                  :step="10"
                  color="primary"
                  hide-details
                  thumb-label
                  class="flex-grow-1 mx-2"
                />
                <v-text-field
                  v-model.number="betAmount"
                  :max="maxAllowedBet"
                  variant="outlined"
                  rounded="lg"
                  base-color="primary"
                  type="number"
                  density="compact"
                  style="max-width: 110px"
                  hide-details
                  class="centered-input"
                />
              </div>
            </template>
          </v-card>
        </v-col>

        <v-col
          v-if="isInRoom && room.status === 'betting'"
          cols="12"
          class="mb-4 d-lg-none mobile-order-2"
        >
          <v-card class="px-4 py-2 smooth-cards" variant="tonal" rounded="xl">
            <div class="d-flex align-center flex-nowrap" style="gap: 8px">
              <span class="font-weight-bold text-no-wrap">Mise :</span>
              <v-slider
                v-model="betAmount"
                :min="room.minBet || 10"
                :max="maxAllowedBet"
                :step="10"
                color="primary"
                hide-details
                thumb-label
                class="flex-grow-1 mx-2"
                style="min-width: 50px"
              />
              <v-text-field
                v-model.number="betAmount"
                :max="maxAllowedBet"
                variant="outlined"
                rounded="lg"
                base-color="primary"
                type="number"
                density="compact"
                style="max-width: 110px"
                hide-details
                class="centered-input"
              />
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" lg="8" class="mb-4 pr-lg-4 mobile-order-3 desktop-order-0">
          <SicBoBoard :totals-data="totalsData" @place-bet="placeBet" />
        </v-col>

        <v-col cols="12" class="mobile-order-4 desktop-order-2">
          <v-card class="px-5 pt-4 pb-5 smooth-cards" variant="tonal" rounded="xl">
            <div class="d-flex align-center justify-space-between mb-4">
              <h3 class="">Joueurs en table ({{ room.players.length }})</h3>
            </div>

            <div v-if="room.players.length === 0" class="text-center opacity-50 py-4">
              Aucun joueur pour le moment.
            </div>

            <v-row v-else>
              <v-col v-for="p in room.players" :key="p.id" cols="12" sm="6" md="4">
                <v-card
                  variant="outlined"
                  rounded="lg"
                  class="pa-3"
                  :style="p.id === discordId ? 'border-color: #5865f2;' : ''"
                >
                  <div class="d-flex align-center mb-2">
                    <v-img :src="p.avatar" max-width="32px" rounded="circle" class="mr-3"></v-img>
                    <div>
                      <div class="font-weight-bold" :class="{ 'text-primary': p.id === discordId }">
                        {{ p.username }}
                      </div>
                      <div class="text-caption opacity-70">{{ formatAmount(p.bank) }}</div>
                    </div>
                  </div>
                  <v-divider class="my-2"></v-divider>
                  <div class="d-flex justify-space-between text-caption mb-1">
                    <span>Mise totale :</span>
                    <span class="font-weight-bold">{{ formatAmount(getPlayerTotalBet(p)) }}</span>
                  </div>
                  <div class="d-flex flex-wrap gap-1 mt-2" style="gap: 4px">
                    <v-chip
                      v-for="(b, idx) in p.bets"
                      :key="idx"
                      size="x-small"
                      color="primary"
                      variant="flat"
                    >
                      {{ formatBetType(b.betType || b.type || 'pari') }}:
                      {{ formatAmount(b.amount) }}
                    </v-chip>
                    <span v-if="!p.bets || p.bets.length === 0" class="text-caption opacity-50"
                      >Aucun pari</span
                    >
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>

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
        <template #actions><v-icon>mdi-dice-multiple</v-icon></template>
      </v-snackbar>
    </v-main>
    <home-btn />
  </v-layout>
</template>

<script>
import flapi from '@/services/flapi.js'
import { getSocket } from '@/services/socket.js'
import { formatAmount } from '@/utils/format.js'
import Dice3D from '@/components/Dice3D.vue'
import SicBoBoard from '@/components/SicBoBoard.vue'
import HomeBtn from '@/components/HomeBtn.vue'

export default {
  name: 'SicBoView',
  components: {
    Dice3D,
    SicBoBoard,
    HomeBtn,
  },
  data: () => ({
    discordId: null,
    room: null,
    betAmount: 50,
    snackbar: { show: false, msg: '' },
    nowTick: Date.now(),
    socket: null,

    showDelayedResult: false,
    diceTimer: null,

    totalsData: [
      { val: 4, payout: 50 },
      { val: 5, payout: 18 },
      { val: 6, payout: 14 },
      { val: 7, payout: 12 },
      { val: 8, payout: 8 },
      { val: 9, payout: 6 },
      { val: 10, payout: 6 },
      { val: 11, payout: 6 },
      { val: 12, payout: 6 },
      { val: 13, payout: 8 },
      { val: 14, payout: 12 },
      { val: 15, payout: 14 },
      { val: 16, payout: 18 },
      { val: 17, payout: 50 },
    ],
  }),
  computed: {
    isInRoom() {
      if (!this.room) return false
      return this.room.players.some((p) => p.id === this.discordId)
    },
    me() {
      return this.room?.players.find((p) => p.id === this.discordId) || null
    },
    diceSum() {
      if (!this.room?.dice || this.room.dice.length !== 3) return 0
      return this.room.dice.reduce((a, b) => a + b, 0)
    },
    prettyTimeLeft() {
      if (!this.room?.phase_ends_at) return '—'
      const left = Math.max(0, this.room.phase_ends_at - this.nowTick)
      const s = Math.ceil(left / 1000)
      const mm = String(Math.floor(s / 60)).padStart(2, '0')
      const ss = String(Math.floor(s % 60)).padStart(2, '0')
      return `${mm}:${ss}`
    },
    myTotalBet() {
      if (!this.me || !this.me.bets) return 0
      return this.me.bets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
    },
    maxAllowedBet() {
      const roomMax = this.room.maxBet
      return Math.max(0, roomMax - this.myTotalBet)
    },
  },

  watch: {
    'room.dice': {
      handler(newVal, oldVal) {
        if (newVal && newVal.length === 3) {
          if (!oldVal || oldVal.length !== 3) {
            this.showDelayedResult = false
            clearTimeout(this.diceTimer)

            this.diceTimer = setTimeout(() => {
              this.showDelayedResult = true
            }, 3000)
          }
        } else {
          this.showDelayedResult = false
          clearTimeout(this.diceTimer)
        }
      },
      immediate: true,
    },
  },

  async mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) return this.$router.push('/')

    this.initSocket()
    await this.getRoom()

    this._timer = setInterval(() => {
      this.nowTick = Date.now()
    }, 500)
  },

  async beforeUnmount() {
    if (this.socket) {
      this.socket.off('connect', this._onConnect)
      this.socket.off('sicbo-update', this._onSicboUpdate)
      this.socket.off('sicbo-player-joined', this._onSicboUpdate)
      this.socket.off('sicbo-player-left', this._onSicboUpdate)
      this.socket.off('sicbo-bet-placed', this._onSicboUpdate)
      this.socket.off('sicbo-rolling', this._onSicboUpdate)
      this.socket.off('sicbo-payout', this._onSicboUpdate)
      this.socket.off('sicbo-new-round', this._onSicboUpdate)
    }
    if (this._timer) clearInterval(this._timer)
    if (this.diceTimer) clearTimeout(this.diceTimer)
    if (this.isInRoom) {
      await flapi.post('/sicbo/leave').catch(() => {})
    }
  },

  methods: {
    formatAmount,

    formatBetType(type) {
      if (!type || typeof type !== 'string') return '?'
      const dict = {
        small: 'Small',
        big: 'Big',
        even: 'Pair',
        odd: 'Impair',
        any_triple: 'Any Triple',
      }
      if (dict[type]) return dict[type]
      if (type.startsWith('triple_')) return `Triple ${type.split('_')[1]}`
      if (type.startsWith('double_')) return `Double ${type.split('_')[1]}`
      if (type.startsWith('total_')) return `Total ${type.split('_')[1]}`
      if (type.startsWith('single_')) return `Simple ${type.split('_')[1]}`
      return type
    },

    toast(msg) {
      this.snackbar = { show: true, msg }
    },

    initSocket() {
      this.socket = getSocket()

      this._onConnect = async () => {
        await this.getRoom()
      }
      this.socket.on('connect', this._onConnect)

      this._onSicboUpdate = (payload) => {
        if (payload) {
          this.room = payload.room ? payload.room : payload
        }
      }

      this.socket.on('sicbo-update', this._onSicboUpdate)
      this.socket.on('sicbo-player-joined', this._onSicboUpdate)
      this.socket.on('sicbo-player-left', this._onSicboUpdate)
      this.socket.on('sicbo-bet-placed', this._onSicboUpdate)
      this.socket.on('sicbo-rolling', this._onSicboUpdate)

      this.socket.on('sicbo-payout', (payload) => {
        this._onSicboUpdate(payload)

        const allRes = payload?.allRes
        if (allRes && allRes[this.discordId]) {
          let totalDelta = 0
          allRes[this.discordId].forEach((bet) => {
            totalDelta += bet.delta || 0
          })

          if (totalDelta !== 0) {
            const signe = totalDelta > 0 ? '+' : ''
            this.toast(`${signe}${this.formatAmount(totalDelta)} Flopos`)
          } else {
            this.toast('Manche terminée (0 Flopos)')
          }
        }
      })

      this.socket.on('sicbo-new-round', this._onSicboUpdate)
    },

    async getRoom() {
      try {
        const response = await flapi.get('/sicbo', { params: { t: Date.now() } })
        this.room = response.data.room
      } catch (e) {
        this.toast(e?.response?.data?.message || 'Erreur salle')
      }
    },

    async join() {
      try {
        await flapi.post('/sicbo/join')
        await this.getRoom()
        this.toast('Tu as rejoint la table')
      } catch (e) {
        this.toast(e?.response?.data?.message || 'Erreur connexion')
      }
    },

    async leave() {
      try {
        await flapi.post('/sicbo/leave')
        await this.getRoom()
        this.toast('Tu as quitté la table')
      } catch (e) {
        this.toast(e?.response?.data?.message || 'Erreur déconnexion')
      }
    },

    getPlayerTotalBet(p) {
      if (!p || !p.bets) return 0
      return p.bets.reduce((sum, bet) => sum + (Number(bet.amount) || 0), 0)
    },

    async placeBet(betType) {
      if (!this.isInRoom) return this.toast("Rejoins la partie d'abord !")
      if (this.room.status !== 'betting') return this.toast('Les paris sont fermés !')
      if (this.betAmount <= 0) return this.toast('Montant invalide.')

      const roomMax = this.room?.maxBet || 1000
      if (this.myTotalBet + this.betAmount > roomMax) {
        return this.toast(`Tu ne peux pas miser plus de ${roomMax} au total !`)
      }

      try {
        await flapi.post('/sicbo/bet', { betType, amount: this.betAmount })
      } catch (e) {
        this.toast(e?.response?.data?.message || 'Erreur de mise')
      }
    },
  },
}
</script>

<style scoped>
.centered-input :deep(input) {
  text-align: center;
}

.centered-input :deep(input[type='number']::-webkit-inner-spin-button),
.centered-input :deep(input[type='number']::-webkit-outer-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

.centered-input :deep(input[type='number']) {
  -moz-appearance: textfield;
}

.dice-3d-wrapper {
  height: 120px;
}

@media (min-width: 1280px) {
  .dice-3d-wrapper {
    height: 260px;
  }
}

.dice-result-wrapper {
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dice-result {
  font-weight: 800;
  letter-spacing: 0.05em;
  line-height: 1.5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.dice-values {
  color: #ffffff;
  font-size: 1.8rem;
}

.dice-sep {
  color: #4a5568;
  font-weight: 400;
  margin: 0 6px;
  font-size: 1.2rem;
}

.dice-oddeven,
.dice-bigsmall {
  font-size: 1.4rem;
  text-transform: uppercase;
}

.dice-placeholder {
  font-size: 1rem;
  color: #64748b;
  font-style: italic;
  letter-spacing: 0.05em;
}

@media (max-width: 600px) {
  .dice-result-wrapper {
    min-height: 40px;
  }
  .dice-values {
    font-size: 1.3rem;
  }
  .dice-oddeven,
  .dice-bigsmall {
    font-size: 1.1rem;
  }
  .dice-sep {
    margin: 0 4px;
    font-size: 1rem;
  }
}

.mobile-order-2 {
  order: 2;
}

.mobile-order-3 {
  order: 3;
}

.mobile-order-4 {
  order: 4;
}

@media (min-width: 1280px) {
  .desktop-order-minus1 {
    order: -1;
  }
  .desktop-order-0 {
    order: 0;
  }
  .desktop-order-2 {
    order: 2;
  }
}

.smooth-cards {
  transition: 0.5s ease-in-out;
}

.time-left {
  opacity: 0.85;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.back-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  border-radius: 10px;
}
</style>
