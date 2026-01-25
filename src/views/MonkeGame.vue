<script>
import axios from 'axios'
import CoinsCounter from '@/components/CoinsCounter.vue'

export default {
  components: {
    CoinsCounter,
  },

  async mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) this.$router.push('/')

    this.userGamePath = await this.getUserGamePathArray()
  },

  data() {
    return {
      discordId: null,
      now: Date.now(),

      user: {},

      endGameDialog: false,
      userGamePath: null,
      betAmount: 10,

      startProgressTime: Date.now(),
      progress: 0,
    }
  },

  computed: {
    initialBet() {
      return this.userGamePath && this.userGamePath.length > 0
        ? this.userGamePath[this.userGamePath.length - 1].bet
        : 0
    },
    currentWithdrawValue() {
      if (!this.userGamePath || this.userGamePath.length === 0) return 0
      let value = this.userGamePath[0].bet
      return value
    },
    potentialNextWithdrawValue() {
      if (!this.userGamePath || this.userGamePath.length === 0) return 0
      let value = Math.round(this.userGamePath[0].bet * 1.33)
      return value
    },
    currentGains() {
      if (!this.userGamePath || this.userGamePath.length === 0) return 0
      let gains = this.currentWithdrawValue - this.initialBet
      return gains
    },
  },

  methods: {
    async getUserGamePathArray() {
      try {
        const url = `${import.meta.env.VITE_FLAPI_URL}/monke-game/${this.discordId}`
        const response = await axios.get(url)
        return response.data.userGamePath?.reverse() || []
      } catch (error) {
        console.error('Error fetching user game path:', error)
        return []
      }
    },
    async handleStart() {
      try {
        const url = `${import.meta.env.VITE_FLAPI_URL}/monke-game/${this.discordId}/start`
        const response = await axios.post(url, { initialBet: this.betAmount })
        this.userGamePath = response.data.userGamePath?.reverse() || []
      } catch (error) {
        console.error('Error starting game:', error)
      }
    },
    async handleClick(step, key) {
      try {
        const url = `${import.meta.env.VITE_FLAPI_URL}/monke-game/${this.discordId}/play`
        const response = await axios.post(url, { choice: key, step: step.round })
        this.userGamePath = response.data.userGamePath?.reverse() || []
        if (response.data.lost) {
          this.endGameDialog = true
          this.startProgress()
          setTimeout(() => {
            this.endGameDialog = false
            setTimeout(() => {
              this.userGamePath = []
            }, 100)
          }, 2500)
        }
      } catch (error) {
        console.error('Error starting game:', error)
      }
    },
    async handleWithdraw() {
      try {
        const url = `${import.meta.env.VITE_FLAPI_URL}/monke-game/${this.discordId}/stop`
        const response = await axios.post(url)
        console.log('Withdraw response:', response.data)
        this.userGamePath = []
      } catch (error) {
        console.error('Error withdrawing:', error)
      }
    },
    async startProgress() {
      this.progress = 0
      this.startProgressTime = Date.now()
      while (this.progress < 100) {
        this.now = Date.now()
        this.progress = Math.min(100, ((this.now - this.startProgressTime) / 2500) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    },
  },
}
</script>

<template>
  <CoinsCounter @update-coins="user.coins = $event" />
  <v-layout>
    <v-main
      class="d-flex"
      style="place-items: center; place-content: center; gap: 2em; flex-wrap: wrap"
    >
      <div class="mt-8 w-100">
        <h1 class="text-white" style="position: relative">Monke Game</h1>
      </div>
      <div
        class="mt-0 w-100 d-flex flex-column align-center"
        style="
          height: 70vh;
          border-radius: 15px;
          padding: 1em;
          overflow-y: scroll;
          scrollbar-width: auto;
        "
      >
        <div v-if="!userGamePath || userGamePath.length === 0">
          <v-card class="modals-card text-white" variant="tonal" rounded="xl">
            <v-card-title>Nouvelle partie</v-card-title>
            <v-card-text class="mt-2 mb-0 pb-3">
              <v-number-input
                v-model="betAmount"
                label="Montant de la mise initiale"
                type="number"
                :min="10"
                :max="Math.min(10000, user?.coins || 10000)"
                :step="10"
                variant="outlined"
                rounded="lg"
                hint="Entre 10 et 10k coins"
                density="comfortable"
              ></v-number-input>
            </v-card-text>
            <v-card-actions class="d-flex justify-end pa-4 pt-0">
              <v-btn
                class="text-none"
                variant="flat"
                :disabled="!betAmount || betAmount < 10 || user?.coins < betAmount"
                color="primary"
                rounded="lg"
                @click="handleStart"
              >
                Démarrer
              </v-btn>
            </v-card-actions>
          </v-card>
        </div>
        <div
          v-for="step in userGamePath"
          class="w-100 d-flex ga-2 align-center justify-center mb-2"
        >
          <span class="mr-2 text-center" style="width: 25px">{{ step.round + 1 }}</span>
          <v-btn
            v-for="key in [0, 1, 2]"
            class="game-btn"
            :class="{ 'wrong-btn': step.result === key, 'chosen-btn': step.choice === key }"
            style="position: relative"
            :color="step.result === key ? 'error' : 'primary'"
            rounded="lg"
            :disabled="step.round < userGamePath?.length - 1"
            :key="'btn' + key"
            @click="handleClick(step, key)"
          ></v-btn>
        </div>
      </div>
    </v-main>

    <v-expansion-panels
      v-if="userGamePath && userGamePath?.length > 0"
      class="text-white"
      style="
        position: fixed;
        bottom: 1rem;
        left: 1rem;
        width: 250px;
        background-color: transparent !important;
        backdrop-filter: blur(100px);
        border-radius: 15px;
      "
      elevation="0"
    >
      <v-expansion-panel rounded="xl" style="background-color: transparent !important">
        <v-expansion-panel-title color="transparent">
          <v-btn
            class="text-none mr-3"
            color="primary"
            rounded="lg"
            variant="flat"
            style="width: 90%"
            :disabled="userGamePath?.length === 1"
            @click.stop="handleWithdraw"
          >
            <span class="font-weight-bold">
              +{{ currentWithdrawValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '&nbsp;') }}
              Coins
            </span>
            <template #prepend>
              <v-icon class="mt-1" color="white" icon="mdi-cash-plus"></v-icon>
            </template>
          </v-btn>
          <template v-slot:actions="{ expanded }">
            <v-icon color="white" :icon="expanded ? 'mdi-menu-up' : 'mdi-menu-down'"></v-icon>
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text class="text-white" rounded="lg">
          <div class="d-flex align-center justify-space-between mt-2">
            Mise :
            <p>
              <span class="font-weight-bold">
                {{ initialBet.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '&nbsp;') }} Coins
              </span>
            </p>
          </div>
          <div class="d-flex align-center justify-space-between mt-2">
            Suivant :
            <p>
              <span class="font-weight-bold">
                {{
                  potentialNextWithdrawValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '&nbsp;')
                }}
                Coins
              </span>
            </p>
          </div>
          <div class="d-flex align-center justify-space-between mt-2">
            Gains :
            <p style="font-size: 1.2em">
              <span class="font-weight-bold">
                +{{ currentGains.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '&nbsp;') }} Coins
              </span>
            </p>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-dialog v-model="endGameDialog" persistent max-width="350">
      <v-card class="modal-card" color="primary" style="border-radius: 15px">
        <v-card-title class="text-white justify-center px-5 pt-4">Perdu !</v-card-title>
        <v-card-text class="text-white justify-center">
          <p v-if="userGamePath?.length > 1" style="text-wrap: pretty">
            Tu aurais pu récupérer
            <span class="font-weight-bold">
              {{ currentWithdrawValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '&nbsp;') }}
              Coins
            </span>
            <br />
            <span v-if="currentGains > 0" style="font-size: 0.8em">
              et faire un bénéfice de
              <span class="font-weight-bold">
                +{{ currentGains.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '&nbsp;') }} Coins
              </span>
            </span>
          </p>
          <br />
          <p v-if="userGamePath?.length > 1">
            Tu avais fait une série de {{ userGamePath?.length - 1 }} palier{{
              userGamePath?.length - 1 > 1 ? 's' : ''
            }}.
          </p>
          <p v-else>Tu as perdu au premier palier. Finito !</p>
        </v-card-text>
        <v-progress-linear v-model="progress" color="white"></v-progress-linear>
      </v-card>
    </v-dialog>

    <v-btn
      class="back-btn text-none"
      text="Retour"
      variant="tonal"
      color="#ddd"
      @click="$router.push('/dashboard')"
    ></v-btn>
  </v-layout>
</template>

<style scoped>
.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 12px;
}

.chosen-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 100;
  border: 4px solid white;
  border-radius: 12px;
  box-sizing: border-box;
}

.game-btn {
  max-width: 200px;
  height: 75px;
  flex-grow: 1;
  flex-shrink: 0;
}
</style>
