<template>
  <v-layout class="w-100">
    <profile-menu
      v-if="user && !mounting"
      :user="user"
      :elos="elos"
      :elo-graphs="elo_graphs"
      @logout="logout"
      @buy-coins="coinsModal = true"
    ></profile-menu>

    <leaderboard-drawer
      v-model="leaderBoardOpen"
      :users="users"
      :users-by-elo="usersByElo"
      :sparklines="sparklines"
      :elos="elos"
      :elo-graphs="elo_graphs"
      :discord-id="discordId"
      :dev-id="devId"
      :mounting="mounting"
    />

    <v-main class="w-100" style="position: relative; min-height: 100vh">
      <div v-if="user && !mounting" class="w-100 user-tab">
        <game-cards-row :user="user" :games="games" @daily-claim="handleDailyQuery" />

        <v-tabs
          v-model="tab"
          variant="tonal"
          color="white"
          align-tabs="center"
          grow
          density="compact"
          class="tabs w-100 mt-5"
        >
          <v-tab class="new-tab" value="skins" icon><i class="mdi mdi-pistol" /></v-tab>
          <v-tab v-if="user?.isAkhy" value="commandes" icon>
            <i class="mdi mdi-slash-forward-box" />
          </v-tab>
          <v-tab v-if="user?.isAkhy" value="predictions" icon>
            <i class="mdi mdi-tooltip-question-outline" />
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="tab" class="w-100">
          <v-tabs-window-item value="skins">
            <cs-skins-tab />
          </v-tabs-window-item>

          <v-tabs-window-item v-if="user?.isAkhy" value="commandes">
            <akhy-commands-tab :user="user" :users="users" :avatars="avatars" />
          </v-tabs-window-item>

          <v-tabs-window-item v-if="user?.isAkhy" value="predictions">
            <predictions-tab
              :active-predis="active_predis"
              :discord-id="discordId"
              :dev-id="devId"
              :avatars="avatars"
              :users="users"
              :user="user"
              @refresh="getActivePredis"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </div>

      <div v-else class="user-tab w-100">
        <v-skeleton-loader
          class="px-0 w-100"
          type="heading"
          color="transparent"
        ></v-skeleton-loader>
        <v-skeleton-loader
          type="image@4"
          color="transparent"
          style="border-radius: 20px; overflow: hidden"
        ></v-skeleton-loader>
      </div>
      <v-divider class="my-8 py-4"> </v-divider>

      <v-footer
        color="transparent"
        class="d-flex flex-row flex-wrap justify-space-between align-baseline"
        style="position: absolute; bottom: 0; right: 0; width: 100%"
      >
        <p class="pr-6">&copy; 2026 Floposite. Tous droits réservés.</p>
        <div class="d-flex ga-4">
          <a href="/cgv">Conditions Générales de Vente</a>
          <a href="/privacy">Politique de Confidentialité</a>
        </div>
      </v-footer>
    </v-main>
  </v-layout>

  <!--  DIALOGS -->
  <register-welcome-modal
    v-model="isRegistered"
    :anon-username="anonUsername"
    :loading="loading"
    @register="handleRegister"
    @quit="logout"
  />

  <v-dialog v-model="loading" style="backdrop-filter: blur(10px) contrast(0.5)">
    <v-card class="px-6 py-4" variant="text" elevation="0">
      <v-card-text class="d-flex justify-center">
        <v-progress-circular
          :size="70"
          :width="10"
          color="primary"
          indeterminate
        ></v-progress-circular>
      </v-card-text>
      <v-card-subtitle class="text-center">Traitement de votre demande en cours...</v-card-subtitle>
    </v-card>
  </v-dialog>

  <coins-purchase-modal
    v-model="coinsModal"
    :max-width="coinsModalMaxWidth"
    :payment-modal="paymentModal"
    :loading="loading"
    @buy="buyCoins"
  />
</template>

<script>
/* global localStorage */
import flapi from '@/services/flapi.js'
import { getSocket } from '@/services/socket.js'
import { formatAmount } from '@/utils/format.js'
import { useFlopoToasts } from '@/composables/useFlopoToasts.js'
import { rankIcon, rankDiv, rankColor } from '../utils/rank.js'
import 'animate.css'
import ProfileMenu from '../components/ProfileMenu.vue'
import RegisterWelcomeModal from '../components/dashboard/RegisterWelcomeModal.vue'
import CoinsPurchaseModal from '../components/dashboard/CoinsPurchaseModal.vue'
import CsSkinsTab from '../components/dashboard/CsSkinsTab.vue'
import AkhyCommandsTab from '../components/dashboard/AkhyCommandsTab.vue'
import PredictionsTab from '../components/dashboard/PredictionsTab.vue'
import GameCardsRow from '../components/dashboard/GameCardsRow.vue'
import LeaderboardDrawer from '../components/dashboard/LeaderboardDrawer.vue'

export default {
  components: {
    ProfileMenu,
    RegisterWelcomeModal,
    CoinsPurchaseModal,
    CsSkinsTab,
    AkhyCommandsTab,
    PredictionsTab,
    GameCardsRow,
    LeaderboardDrawer,
  },

  setup() {
    return { ...useFlopoToasts() }
  },

  data() {
    return {
      mounting: true,
      windowWidth: window.innerWidth,

      anonUsername: null,
      leaderBoardOpen: false,

      isRegistered: false,
      tab: null,
      message: null,
      discordId: null,
      users: null,
      usersByElo: null,
      avatar: null,
      socket: null,
      user_inventory: null,
      user_isTimedOut: false,

      active_polls: null,
      active_slowmodes: null,
      active_predis: null,

      coinsModal: false,
      paymentModal: false,

      avatars: {},
      sparklines: {},
      elo_graphs: {},
      elos: {},
      buyCoinsForm: {
        price: null,
        coins: null,
      },

      loading: false,
      error: null,
      stripePromise: null,

      user: null,

      games: [
        {
          name: 'Puissance 4',
          description:
            'Joue une partie de puissance 4 contre un autre joueur, mais attention à ton FlopoRank.',
          route: 'connect-4',
          class: 'c4-action-card',
          chips: ['1v1', 'Elo'],
        },
        {
          name: 'Solitaire',
          description: 'Tente de gagner quelques FlopoCoins au solitaire.',
          route: 'solitaire',
          class: 'sol-action-card',
          chips: ['Solo', 'Coins'],
        },
        {
          name: 'Sudoku',
          description: 'Gagne des FlopoCoins en complétant des grilles de sudoku.',
          route: 'sudoku',
          class: 'sudoku-action-card',
          chips: ['Solo', 'Coins'],
        },
        {
          name: 'Blackjack',
          description: 'Mise tes FlopoCoins au Blackjack.',
          route: 'blackjack',
          class: 'bj-action-card',
          chips: ['Multi', 'Coins'],
        },
        {
          name: 'Flopoker',
          description: 'Mise tes FlopoCoins dans ce poker de 2 à 8 joueurs par table.',
          route: 'flopoker',
          class: 'poker-action-card',
          chips: ['Multi', 'Coins'],
        },
        {
          name: 'Morpion',
          description: 'Joue au morpion contre un autre joueur, mais attention à ton FlopoRank.',
          route: 'tic-tac-toe',
          class: 'ttt-action-card',
          chips: ['1v1', 'Elo'],
        },
        {
          name: 'Monke',
          description: 'Tente de gagner des FlopoCoins mais attention aux bombes !',
          route: 'monke-game',
          class: 'mg-action-card',
          chips: ['Solo', 'Coins'],
        },
        {
          name: 'Snake',
          description: 'Gagne des FlopoCoins en jouant au Snake en solo.',
          route: 'snake/solo',
          class: 'snake-action-card',
          chips: ['Solo', 'Coins'],
        },
      ],
    }
  },

  computed: {
    inventoryValue() {
      if (!this.user_inventory) return 0
      let sum = 0
      this.user_inventory.forEach((s) => {
        sum += s.currentPrice
      })
      return sum
    },
    devId() {
      return import.meta.env.VITE_DEV_ID
    },
    unseenActivePoll() {
      return (
        Object.values(this.active_polls)?.filter((p) => {
          return !p.voters.includes(this.discordId)
        })?.length > 0
      )
    },
    coinsModalMaxWidth() {
      if (this.windowWidth <= 850) {
        return 350
      } else if (this.windowWidth <= 1200) {
        return 511
      } else {
        return 1005
      }
    },
  },

  async mounted() {
    this.mounting = true
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) this.$router.push('/')

    await this.getCurrentUser().then(() => {
      if (!this.user) {
        this.isRegistered = true
      }
    })

    this.avatar = await this.getAvatar(this.discordId)
    this.anonUsername = await this.fetchUsername(this.discordId)

    await this.getActiveSlowmodes()

    await this.isTimedOut()

    this.initSocket()
    window.addEventListener('resize', this.updateWindowWidth)
    this.mounting = false

    await this.getUsers()
    await this.fetchSparklines()
    await this.fetchElos()
    await this.fetchEloGraphs()

    await this.getActivePolls()
    await this.getActivePredis()
  },

  beforeUnmount() {
    // Clean up socket listeners when component is destroyed (keep shared socket alive)
    if (this.socket) {
      if (this._onConnect) this.socket.off('connect', this._onConnect)
      if (this._onDataUpdated) this.socket.off('data-updated', this._onDataUpdated)
      if (this._onNewPoll) this.socket.off('new-poll', this._onNewPoll)
      if (this._onNewSlowmode) this.socket.off('new-slowmode', this._onNewSlowmode)
      if (this._onNewPredi) this.socket.off('new-predi', this._onNewPredi)
      if (this._onDisconnect) this.socket.off('disconnect', this._onDisconnect)
      if (this._onDailyQueried) this.socket.off('daily-queried', this._onDailyQueried)
    }
  },

  methods: {
    updateWindowWidth() {
      this.windowWidth = window.innerWidth
    },
    handleSuccess() {
      this.paymentModal = false
      this.coinsModal = false
      this.showSuccessOrWarningToast('Paiement effectué !', false)
      this.buyCoins()
    },
    updateUserCoinsLocally(userId, newCoins) {
      // Update coins in the users array (sorted by coins)
      if (this.users) {
        const userIndex = this.users.findIndex((u) => u.id === userId)
        if (userIndex !== -1) {
          this.users[userIndex].coins = newCoins
          // Re-sort the array by coins (descending)
          this.users.sort((a, b) => b.coins - a.coins)
        }
      }

      // Update coins in the usersByElo array as well
      if (this.usersByElo) {
        const userEloIndex = this.usersByElo.findIndex((u) => u.id === userId)
        if (userEloIndex !== -1) {
          this.usersByElo[userEloIndex].coins = newCoins
          // Keep the ELO sorting intact, only update the coins value
        }
      }
    },

    initSocket() {
      // Use the shared singleton socket
      this.socket = getSocket()

      // Handle connection events
      this._onConnect = () => {
        console.log('Connected to WebSocket server')
      }
      this.socket.on('connect', this._onConnect)

      // Listen for data updates
      this._onDataUpdated = async (data) => {
        // If we have userId and newCoins, update locally with animation
        if (data.userId && data.newCoins !== undefined) {
          this.updateUserCoinsLocally(data.userId, data.newCoins)
          this.sparklines[data.userId] = await this.getSparkline(data.userId)
          console.log(this.sparklines)
        } else {
          // Fallback to full refresh if data format is unexpected
          this.getUsers()
          this.fetchSparklines()
        }
      }
      this.socket.on('data-updated', this._onDataUpdated)

      this._onNewPoll = (data) => {
        console.log('New Poll:', data.action)
        this.getActivePolls()
      }
      this.socket.on('new-poll', this._onNewPoll)

      this._onNewSlowmode = (data) => {
        console.log('New Slowmode:', data.action)
        this.getActiveSlowmodes()
      }
      this.socket.on('new-slowmode', this._onNewSlowmode)

      this._onNewPredi = async (data) => {
        console.log('New predi:', data.action)
        await this.getActivePredis()
      }
      this.socket.on('new-predi', this._onNewPredi)

      this._onDisconnect = () => {
        console.log('Disconnected from WebSocket server')
      }
      this.socket.on('disconnect', this._onDisconnect)

      this._onDailyQueried = async (data) => {
        if (data.userId === this.discordId)
          this.showSuccessOrWarningToast('+500 FlopoCoins, récompense journalière récupérée', false)
        await this.getUsers()
      }
      this.socket.on('daily-queried', this._onDailyQueried)
    },

    async handleRegister() {
      try {
        const response = await flapi.post('/register-user')
        this.showSuccessOrWarningToast(response.data.message, false)
        await this.getUsers()
        this.avatar = await this.getAvatar(this.discordId)
        this.anonUsername = await this.fetchUsername(this.discordId)
        await this.fetchAvatars()
        await this.fetchSparklines()
        await this.fetchElos()
        await this.fetchEloGraphs()
        // await this.getInventory()
        await this.getActivePolls()
        await this.getActiveSlowmodes()
        await this.getActivePredis()
        await this.isTimedOut()
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async fetchUsername(id) {
      try {
        const response = await flapi.get('/user/' + id + '/username')
        return response.data?.user?.username
      } catch (e) {
        console.log(e)
      }
    },

    async fetchAvatars() {
      try {
        const response = await flapi.get('/users/avatars')
        this.users.forEach((user) => {
          this.avatars[user.id] = response.data.avatars[user.id]
        })
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async fetchSparklines() {
      try {
        const response = await flapi.get('/users/sparklines')
        this.users.forEach(async (user) => {
          this.sparklines[user.id] = response.data.sparklines[user.id]
        })
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async fetchElos() {
      try {
        const response = await flapi.get('/users/elos')
        this.users.forEach(async (user) => {
          this.elos[user.id] = response.data.elos[user.id]
        })
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async fetchEloGraphs() {
      try {
        const response = await flapi.get('/users/elo-graphs')
        this.users.forEach(async (user) => {
          this.elo_graphs[user.id] = response.data.eloGraphs[user.id]
        })
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    logout() {
      localStorage.removeItem('discordId')
      localStorage.removeItem('token')
      this.showLogoutToast()
      this.$router.push('/')
    },

    async getCurrentUser() {
      try {
        const response = await flapi.get('/user/' + this.discordId)
        this.user = response.data.user
      } catch (e) {
        this.user = null
        console.error('flAPI error:', e)
      }
    },

    async getUsers() {
      try {
        const response = await flapi.get('/users')
        this.users = response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }

      try {
        const response = await flapi.get('/users/by-elo')
        this.usersByElo = response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getAvatar(id) {
      try {
        const response = await flapi.get('/user/' + id + '/avatar')
        return response.data.avatarUrl
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getSparkline(id) {
      try {
        const response = await flapi.get('/user/' + id + '/sparkline')
        return response.data.sparkline
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getElo(id) {
      try {
        const response = await flapi.get('/user/' + id + '/elo')
        return response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getEloGraph(id) {
      try {
        const response = await flapi.get('/user/' + id + '/elo-graph')
        return response.data.eloGraph
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getInventory() {
      try {
        const response = await flapi.get('/user/' + this.discordId + '/inventory')
        this.user_inventory = response.data.inventory
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getActivePolls() {
      try {
        const response = await flapi.get('/polls')
        this.active_polls = response.data.activePolls
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getActiveSlowmodes() {
      try {
        const response = await flapi.get('/slowmodes')
        this.active_slowmodes = response.data.slowmodes
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async timeoutVote(voteKey, voteFor) {
      this.showCommandToast('Envoi du vote...')
      try {
        const response = await flapi.post('/timeout/vote', {
          voteKey: voteKey,
          voteFor: voteFor,
        })
        this.showSuccessOrWarningToast(response.data.message, false)
      } catch (e) {
        this.showErrorToast(e.response.data.message)
      }
    },

    async getActivePredis() {
      try {
        const response = await flapi.get('/predis')
        this.active_predis = response.data.predis
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async addCoins() {
      try {
        await flapi.post('/add-coins')
      } catch (e) {
        console.log(e)
      }
    },

    async buyCoins(offerId) {
      try {
        this.loading = true

        // Call the new checkout session endpoint
        const response = await flapi.post('/create-checkout-session', {
          offerId: offerId,
        })

        const { url } = response.data

        // Redirect to Stripe Checkout (Stripe.js v8 method)
        window.location.href = url
      } catch (e) {
        console.error('Error creating checkout session:', e)
        this.showErrorToast('Erreur lors de la création de la session de paiement')
      } finally {
        // this.loading = false will be handled on the success page after redirection
      }
    },

    async handleDailyQuery() {
      try {
        await flapi.get('/user/' + this.discordId + '/daily')
        this.user.dailyQueried = true
      } catch (e) {
        console.log(e)
      }
    },

    formatAmount,

    async isTimedOut() {
      try {
        const response = await flapi.post('/timedout')
        this.user_isTimedOut = response.data.isTimedOut
      } catch (e) {
        console.log(e)
      }
    },

    rankIcon,
    rankDiv,
    rankColor,
  },
}
</script>

<style>
button {
  padding: 12px 24px;
  background: #6772e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.predi-vote-options {
  gap: 1em;
  place-content: center;
}

.error {
  color: #ff3860;
  margin-top: 12px;
}
/* .discord-logout {
  position: absolute;
  top: 2em;
  right: 2em;
  background: #a12829;
  color: white;
  padding: 5px 17px;
  border-radius: 10px;
  border: none;
  text-decoration: none;
  display: inline-block;
  cursor: pointer;
  z-index: 10;
  transition: 0.2s ease-in-out;
}
.discord-logout:hover {
  background: #aa3e3e;
  box-shadow: 0 0 32px 0 #a1282955;
} */
.buy-btn {
  z-index: 1;
  /*border-radius: 10px !important;*/
  background:
    radial-gradient(
      ellipse farthest-corner at right bottom,
      #fedb37 0%,
      #fdb931 8%,
      #9f7928 30%,
      #8a6e2f 40%,
      transparent 200%
    ),
    radial-gradient(
      ellipse farthest-corner at left top,
      #ffffff 0%,
      #ffffac 8%,
      #d1b464 25%,
      #5d4a1f 62.5%,
      #5d4a1f 100%
    );
  transition:
    0.3s ease-in-out,
    0.6s ease-in-out box-shadow;
  box-shadow: 0 0 0 0 transparent;
}
.buy-btn:hover {
  box-shadow: 0 0 10px 0 #d1b46477;
}
.game-btn {
  z-index: 1;
  border-radius: 10px !important;
}
.user-tab {
  width: fit-content;
  margin-top: 5rem;
}
.leaderboard-container {
  width: fit-content;
  padding: 1rem 1rem 1rem 0;
  width: 100%;
}
.leaderboard {
  background: rgba(255, 255, 255, 0.1);
  border: solid 2px rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  padding: 0 0 6px 0;
  overflow-y: scroll;
  transition: 2s ease;
  position: relative;
}

/* Leaderboard transition animations */
.leaderboard-list-move {
  transition: 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.leaderboard-list-leave-active {
  position: absolute;
  opacity: 0 !important;
  width: 100%;
}

.inventory {
  display: flex;
  flex-direction: column;
  border-radius: 0 0 10px 10px;
  gap: 5px;
  overflow-y: scroll;
  padding: 8px 0;
}

.inventory-item {
  min-height: 40px;
  transition: 0.3s ease-in-out;
}
.skin-bg {
  position: absolute;
  width: 150%;
  height: 100%;
  top: 0;
  left: -50%;
  z-index: -1;
  border-radius: 10px;
  transition: 0.2s ease-in-out;
}
.skin-bg-no-hover {
  position: absolute;
  width: 150%;
  height: 100%;
  top: 0;
  left: -50%;
  z-index: -1;
  border-radius: 10px;
  transform: translateX(30%);
}
.skin-img {
  transition: 0.3s ease-in-out;
}

.inventory-item:hover .skin-bg {
  transform: translateX(30%);
}

@media (min-width: 1200px) {
  .inventory-item:hover {
    transition-delay: 0.3s;
    min-height: 100px;
  }
  .inventory-item:hover .skin-img {
    transition-delay: 0.3s;
    height: 85px !important;
    min-width: 200px !important;
  }
}

.bubble-text {
  position: relative;
  font-size: 0.8em;
  color: #eee;
  padding: 3px 10px;
  border-radius: 15px;
  margin-right: 10px;
}

.tabs {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px 20px 0 0;
  min-width: 800px;
}

.actions-container {
  height: 590px !important;
  overflow-y: scroll;
  border-radius: 0 0 15px 0;
}
.cases-actions-container {
  display: flex;
  flex-wrap: wrap;
  border-radius: 0 0 20px 20px;
  overflow: hidden;
}
.cases-actions-container > .game-action-card {
  border-radius: 0 !important;
  border: none !important;
  flex-grow: 1 !important;
  flex-shrink: 1 !important;
  flex-basis: 33%;
  min-width: 250px;
}

.cases-actions-container > .game-action-card::before {
  background: none !important;
  backdrop-filter: none !important;
}

.action-card {
  position: relative;
  margin-top: 10px;
  background: transparent !important;
  border-radius: 0 15px 15px 0 !important;
  border-left: 3px solid #fff !important;
}
.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 100%;
  background: radial-gradient(circle at -100% -300%, #5865f2, transparent 90%) !important;
  z-index: -1;
  transition: 0.2s ease-in-out;
}
.action-card:hover::before {
  transform: translateX(30%);
}

.red-action-card {
  position: relative;
  margin-top: 10px;
  background: transparent !important;
  border-radius: 0 15px 15px 0 !important;
  border-left: 3px solid #fff !important;
}
.red-action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 100%;
  background: radial-gradient(circle at 5% 50%, #170201, #9b030222 200%) !important;
  transform: translateX(30%);
  z-index: -1;
  transition: 0.2s ease-in-out;
}
.red-action-card:hover::before {
  transform: translateX(20%);
}
.red-action-card::after {
  content: '';
  pointer-events: none;
  position: absolute;
  z-index: -2;
  top: 0;
  left: 0;
  width: 104%;
  height: 100%;
  background: url('/erynies_card_back.png') no-repeat center center;
  background-size: 100% auto;
}

.game-action-card {
  position: relative;
  background: transparent !important;
  border-radius: 0 15px 15px 0 !important;
  border-left: 3px solid #fff !important;
}
.game-action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 102%;
  background: radial-gradient(circle at 50% 50%, #010217aa, #5865f255 70%) !important;
  -webkit-backdrop-filter: blur(7px);
  backdrop-filter: blur(7px);
  transform: translateX(20%);
  z-index: -1;
  transition: 0.2s ease-in-out;
}
.game-action-card:hover::before {
  transform: translateX(30%);
  -webkit-backdrop-filter: blur(0px);
  backdrop-filter: blur(0px);
}
.game-action-card::after {
  content: '';
  pointer-events: none;
  position: absolute;
  z-index: -2;
  top: -25%;
  left: 25%;
  width: 104%;
  height: 150%;
  transition: cubic-bezier(0.25, 0.8, 0.25, 1) 0.5s;
  transform: rotate(5deg);
}
.game-action-card:hover::after {
  transform: rotate(3deg) scale(1.1);
}
.ttt-action-card::after {
  background: url('/game_illu_ttt.png') no-repeat center center;
  background-size: 25% auto;
}
.poker-action-card::after {
  background: url('/game_illu_poker.png') no-repeat center center;
  background-size: 50% auto;
}
.c4-action-card::after {
  background: url('/game_illu_c4.png') no-repeat center center;
  background-size: 50% auto;
}
.sol-action-card::after {
  background: url('/game_illu_sol.png') no-repeat center center;
  background-size: 50% auto;
}
.bj-action-card::after {
  background: url('/game_illu_bj.png') no-repeat center center;
  background-size: 20% auto;
}
.mg-action-card::after {
  background: url('/game_illu_mg.png') no-repeat center center;
  background-size: 25% auto;
}
.snake-action-card::after {
  background: url('/game_illu_snake.png') no-repeat center center;
  background-size: 30% auto;
}
.sudoku-action-card::after {
  background: url('/game_illu_sudoku.png') no-repeat center center;
  background-size: 50% auto;
}

.disabled-card::after {
  content: 'Prochainement';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 200;
  background: radial-gradient(circle at 10% 0%, #5865f277, #0c131677 100%) !important;
  backdrop-filter: blur(10px) grayscale(1);
  border-radius: 0 15px 15px 0 !important;
  overflow: hidden;
  display: flex;
  place-content: center;
  place-items: center;
}

.modals {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.modals-blurry {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.modal-card {
  position: relative;
  margin-top: 10px;
  background: transparent !important;
  border-radius: 15px !important;
}
.modal-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 100%;
  background: radial-gradient(circle at -100% -200%, #5865f2, #181818 100%) !important;
  z-index: -1;
}
.scroll-modal-card {
  max-height: 80vh !important;
}

.votes-containers {
  height: 390px;
  overflow-y: scroll;
  border-radius: 0 0 10px 10px;
}

.votes-card {
  position: relative;
  margin-top: 10px;
  background: transparent !important;
  border-radius: 15px !important;
}

.votes-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 100%;
  background: radial-gradient(circle at -100% -300%, #5865f2, transparent 90%) !important;
  z-index: -1;
  transition: 0.2s ease-in-out;
}
.votes-card:hover::before {
  transform: translateX(30%);
}

.predis-containers {
  overflow-y: scroll;
  border-radius: 0 0 10px 10px;
}

.coins-modal {
  max-width: 1100px;
}

.article-card {
  width: fit-content;
  background: transparent !important;
  box-shadow: 0 0 32px 0 #0c131677 !important;
}

.predi-option-card {
  width: 50%;
  border: 2px solid #dddddd22 !important;
  background: rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 0 10px 0 #dddddd22 !important;
}

/*.predi-option-card:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 0 10px 0 #dddddd55 !important;
}*/

@media (max-width: 1200px) {
  /*.tabs {
    min-width: auto;
  }*/
  .coins-modal {
    max-width: 511px;
  }
  .leaderboard {
    width: 100%;
    height: fit-content;
  }
  .leaderboard-container {
    width: 100%;
    margin-top: 0;
  }
  .user-tab {
    width: 100%;
    margin-bottom: 3rem;
  }
}

@media (max-width: 850px) {
  .modals {
    backdrop-filter: blur(50px);
    -webkit-backdrop-filter: blur(50px);
  }
  .modal-card::before {
    background: radial-gradient(circle at -100% -200%, #5865f2, #181818aa 100%) !important;
  }
  .user-tab {
    margin-top: 5rem;
  }

  .inventory {
    width: 100%;
  }
  .tabs {
    min-width: auto;
  }
  .coins-modal {
    max-width: 400px;
  }
  .article-card {
    width: 100%;
  }
  .predi-vote-options {
    flex-direction: column;
    gap: 1em;
    place-content: center;
  }
  .predi-option-card {
    width: 100%;
    max-height: 600px !important;
    border: 2px solid #dddddd22 !important;
    background: rgba(255, 255, 255, 0.1) !important;
    box-shadow: 0 0 10px 0 #dddddd22 !important;
  }
}

.new-tab::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, #5865f2, transparent 100%);
  z-index: -1;
}
</style>
