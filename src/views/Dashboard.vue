<template>
  <div v-if="user" class="user-tab">
    <div style="margin-top: 1rem">
      <v-img :src="avatar" lazy-src="anon.png" width="70" color="transparent" style="border-radius: 50%; width: 70px; height: 70px" />
      <h1 class="mb-3">Salut <span style="color: #5865F2">@{{ user?.globalName }}</span></h1>
      <p>{{ user?.coins }} coins</p>
      <p>{{ user_inventory?.length }} skins <span style="color: rgba( 255, 255, 255, 0.3 )">({{ inventoryValue }}€)</span></p>
      <p>{{ user?.warns }} warns <span style="color: rgba( 255, 255, 255, 0.3 )">({{ user?.allTimeWarns }} all time)</span></p>
    </div>

    <div v-if="discordId === devId" class="mt-5 d-flex align-center" style="gap: 1rem">
      <v-text-field v-model="message" variant="outlined" placeholder="Envoyer un message" density="compact" rounded="lg" hide-details></v-text-field>
      <v-btn text="10 coins" append-icon="mdi mdi-play" class="text-capitalize" color="primary" variant="flat" rounded="lg" :disabled="user?.coins < 10 || !message" @click="sendMessage"></v-btn>
    </div>

    <v-tabs
      v-model="tab"
      variant="tonal"
      color="white"
      align-tabs="center"
      grow
      class="tabs mt-5"
    >
      <v-tab value="commandes" icon><i class="mdi mdi-slash-forward-box"/></v-tab>
      <v-tab value="predictions" icon><i class="mdi mdi-tooltip-question-outline"/></v-tab>
      <v-tab value="skins" icon><i class="mdi mdi-pistol"/></v-tab>
      <v-tab value="votes" icon>
        <i class="mdi mdi-timer-outline"/>
        <v-badge v-if="active_polls && Object.keys(active_polls)?.length > 0" dot color="primary" />
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="commandes">
        <div class="actions-container">
          <v-card class="action-card" variant="tonal">
            <v-card-title>Modif Pseudo</v-card-title>
            <v-card-subtitle>
              <p>Modifie le pseudo de quelqu'un pendant 1h</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <p style="color: #ddd;" class="mr-5 mt-2">Bientôt disponible...</p>
              <v-btn text="1K coins" class="text-none" append-icon="mdi-play" color="primary" variant="flat" rounded="lg" :disabled="user?.coins < 1000"/>
            </v-card-text>
          </v-card>

          <v-card class="action-card" variant="tonal">
            <v-card-title>Spam Ping</v-card-title>
            <v-card-subtitle>
              <p>Spam quelqu'un pendant 1 minute (1 ping par seconde)</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <p style="color: #ddd;" class="mr-5 mt-2">Bientôt disponible...</p>
              <v-btn text="10K coins" class="text-none" append-icon="mdi-play" color="primary" variant="flat" rounded="lg" :disabled="user?.coins < 10000"/>
            </v-card-text>
          </v-card>

          <v-card class="action-card" variant="tonal">
            <v-card-title>Slow Mode</v-card-title>
            <v-card-subtitle>
              <p>Limite quelqu'un à un message par minute pendant 1 heure</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <p style="color: #ddd;" class="mr-5 mt-2">Bientôt disponible...</p>
              <v-btn text="10K coins" class="text-none" append-icon="mdi-play" color="primary" variant="flat" rounded="lg" :disabled="user?.coins < 10000"/>
            </v-card-text>
          </v-card>

          <v-card class="action-card" variant="tonal">
            <v-card-title>Time-Out</v-card-title>
            <v-card-subtitle>
              <p>Time-out quelqu'un pendant 6 heures</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <p style="color: #ddd;" class="mr-5 mt-2">Bientôt disponible...</p>
              <v-btn text="100K coins" class="text-none" append-icon="mdi-play" color="primary" variant="flat" rounded="lg" :disabled="user?.coins < 100000"/>
            </v-card-text>
          </v-card>
        </div>
      </v-tabs-window-item>

      <v-tabs-window-item value="predictions">
        <div style="height: 390px;">
          <div class="pt-16 pl-5">
            <p class="pt-16 w-100 text-center text-h4">Prédictions</p>
            <p class="pt-8 w-100 text-center">Bientôt disponible</p>
          </div>
        </div>
      </v-tabs-window-item>

      <v-tabs-window-item value="skins">
        <div class="inventory">
          <div v-for="skin in user_inventory" :key="skin.id" class="inventory-item" :style="`border-radius: 10px;`">
            <div style="display: flex; place-content: space-between; min-width: 300px; width: 100%; padding: .5em 1em">
              <div style="display: flex; width: 70%; gap: 1em">
                <v-img :src="skin.displayIcon" class="skin-img" height="25" min-width="70" max-width="70"/>
                <span style="color: #ddd; overflow: hidden; white-space: nowrap; text-overflow: ellipsis">{{ skin.displayName }}</span>
              </div>
              <span style="font-weight: bold">{{ skin.currentPrice.toFixed(2)}}€</span>
            </div>
            <div class="skin-bg" :style="`background: radial-gradient(circle at -50% 0%, #${skin.tierColor}, transparent 80%)`"></div>
          </div>
        </div>
      </v-tabs-window-item>

      <v-tabs-window-item value="votes">
        <div class="votes-containers">
          <v-card v-for="poll in active_polls" :key="poll.id" class="votes-card" variant="tonal">
            <div v-if="poll.requiredMajority - poll.for > 0">
              <v-card-title><span style="font-weight: bold">{{ poll.username.username }}</span> propose de timeout <span style="font-weight: bold">{{ poll.toUsername.username }}</span></v-card-title>
              <v-card-subtitle>Pendant <span style="font-weight: bold">{{ poll.time_display.replaceAll('*', '') }}</span></v-card-subtitle>
              <v-card-subtitle>Il manque {{ poll.requiredMajority - poll.for }} vote(s)</v-card-subtitle>
              <v-card-text class="d-flex align-end">
                {{((new Date(poll.endTime).getTime() - Date.now())/1000).toFixed()}}s restantes
                <v-spacer/>
                <v-btn text="Oui" color="primary" variant="flat" rounded="lg" class="mr-2" disabled/>
                <v-btn text="Non" color="primary" variant="tonal" style="border: 1px solid #5865f2" rounded="lg" disabled/>
              </v-card-text>
            </div>
            <div v-else>
              <v-card-title><span style="font-weight: bold">{{ poll.toUsername.username }}</span> a été timeout</v-card-title>
              <v-card-subtitle>Pendant <span style="font-weight: bold">{{ poll.time_display.replaceAll('*', '') }}</span></v-card-subtitle>
              <v-card-subtitle class="pb-3">{{ poll.for }} ont voté pour</v-card-subtitle>
            </div>

          </v-card>
          <div v-if="Object.keys(active_polls)?.length === 0" class="pt-16 pl-5">
            <p class="pt-16 w-100 text-center">Aucun vote en cours</p>
          </div>
        </div>
      </v-tabs-window-item>
    </v-tabs-window>
    <p v-if="tab === 'skins'" class="mt-2">Valeur totale : {{ inventoryValue }}€</p>
    <p v-else class="mt-2">{{ user?.coins }} coins</p>

    <button class="discord-logout" @click="logout">Déconnexion</button>
  </div>

  <div v-else-if="users" style="width: fit-content; margin-top: 5rem; margin-bottom: 3rem">
    <div>
      <v-img v-if="avatar" :src="avatar" lazy-src="anon.webp" width="70" style="border-radius: 50%;" />
      <h1 class="mb-3">Salut <span style="color: #5865F2">{{ discordId }}</span> (⊙_⊙)？</h1>
      <p>Je crois qu'on ne se connait pas...</p>
    </div>

    <button class="discord-logout" @click="logout">Déconnexion</button>
  </div>

  <div v-if="users" class="leaderboard-container">
    <h2 style="display: flex; place-content: space-between">Classement</h2>
    <div class="leaderboard">
      <div v-for="akhy in users" :key="akhy.id" style="border-radius: 10px;" :style="akhy.id === discordId ? 'background: radial-gradient(circle at -100% -300%,#5865f2,transparent 100%)' : ''">
        <div style="display: flex; place-content: space-between; min-width: 300px; width: 100%; padding: .5em 1em"><span style="color: #ddd">@{{ akhy?.globalName }}</span> {{ akhy.coins }}</div>
      </div>
    </div>
  </div>
  <toast v-if="toastStore.show" :key="toastStore.toastKey" />
</template>

<script>
import axios from 'axios'
import { io } from 'socket.io-client';
import Toast from '../components/Toast.vue'
import { useToastStore } from '../stores/toastStore.js'

export default {
  components: {
    Toast
  },

  setup() {
    const toastStore = useToastStore()

    const showLogoutToast = () => {
      toastStore.showLogoutToast()
    }

    const showSendingToast = () => {
      toastStore.showSendingToast()
    }

    const showSentToast = () => {
      toastStore.showSentToast()
    }

    const showErrorToast = (message) => {
      toastStore.showErrorToast(message)
    }

    return {
      toastStore: toastStore.$state,
      showLogoutToast,
      showSentToast,
      showSendingToast,
      showErrorToast,
    }
  },

  computed: {
    user() {
      const filtered = this.users?.filter(u => u.id === this.discordId)
      if (filtered?.length < 1) return null
      return this.users?.filter(u => u.id === this.discordId)[0]
    },
    inventoryValue() {
      if (!this.user_inventory) return null
      let sum = 0
      this.user_inventory.forEach(s => { sum += s.currentPrice })
      return sum
    },
    devId() {
      return import.meta.env.VITE_DEV_ID
    },
  },

  data() {
    return {
      tab: null,
      message: null,
      discordId: null,
      users: null,
      avatar: null,
      socket: null,
      user_inventory: null,
      active_polls: null,
    }
  },

  async mounted() {
    this.discordId = localStorage.getItem('discordId');
    if (!this.discordId) this.$router.push('/');

    await this.getUsers()
    if (!this.users) this.$router.push('/');

    await this.getAvatar()
    await this.getInventory()
    await this.getActivePolls()

    this.initSocket();
  },

  methods: {
    initSocket() {
      // Connect to your bot's Socket.IO server
      this.socket = io(import.meta.env.VITE_FLAPI_URL, {
        withCredentials: false,
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      // Handle connection events
      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      // Listen for data updates
      this.socket.on('data-updated', (data) => {
        console.log('Database updated:', data);
        this.getUsers(); // Refresh data when updates occur
      });

      this.socket.on('new-poll', (data) => {
        console.log('New Poll:', data.action);
        this.getActivePolls()
      })

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });
    },

    logout() {
      localStorage.removeItem('discordId');
      this.showLogoutToast();
      this.$router.push('/');
    },

    async getUsers() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/users'
      try {
        console.log(fetchUrl)
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          },
          withCredentials: false
        })
        this.users = response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getAvatar() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + this.discordId + '/avatar'
      try {
        console.log(fetchUrl)
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          },
          withCredentials: false
        })
        this.avatar = response.data.avatarUrl
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getInventory() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + this.discordId + '/inventory'
      try {
        console.log(fetchUrl)
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          },
          withCredentials: false
        })
        this.user_inventory = response.data.inventory
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getActivePolls() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/polls'
      try {
        console.log(fetchUrl)
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          },
          withCredentials: false
        })
        this.active_polls = response.data.activePolls
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async sendMessage() {
      let msg = this.message
      this.message = null
      this.showSendingToast()
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/send-message', {
          userId: this.discordId,
          channelId: '1368908514545631262',
          message: msg,
        });
        this.showSentToast()
      } catch (e) {
        this.showErrorToast(e.response.data.error)
      }

    },

    timeLeft(end) {
      return  Math.max(0, (new Date(end).getTime() - Date.now())/1000).toFixed()
    }
  },

  beforeUnmount() {
    // Clean up socket connection when component is destroyed
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
</script>

<style>
.discord-logout {
  position: fixed;
  top: 2em;
  right: 2.15em;
  background: #A12829;
  color: white;
  padding: 7px 17px;
  border-radius: 10px;
  border: none;
  text-decoration: none;
  display: inline-block;
  cursor: pointer;
  transition: 0.2s ease-in-out;
}
.discord-logout:hover {
  background: #aa3e3e;
  box-shadow: 0 0 32px 0 #A1282955;
}
.user-tab {
  width: fit-content;
  margin-top: 5rem;
}
.leaderboard-container {
  width: fit-content;
  margin-top: 5rem
}
.leaderboard {
  float: right;
  background: rgba( 255, 255, 255, 0.2 );
  box-shadow: 0 8px 32px 0 #5865f211;
  border-radius: 15px;
  padding: 6px 5px;
  height: 700px;
  overflow-y: scroll;
}

.inventory {
  display: flex;
  flex-direction: column;
  border-radius: 0 0 10px 10px;
  height: 390px;
  gap: 5px;
  overflow-y: scroll;
  padding: 8px 0;
}

.inventory-item {
  position: relative;
  overflow: hidden;
  min-height: 40px;
  transition: .3s ease-in-out;
}
.skin-bg {
  position: absolute;
  width: 150%;
  height: 100%;
  top: 0;
  left: -50%;
  z-index: -1;
  border-radius: 10px;
  transition: .2s ease-in-out;
}
.skin-img {
  transition: .3s ease-in-out;
}

.inventory-item:hover .skin-bg {
  transform: translateX(30%);
}

@media (min-width: 550px) {
  .inventory-item:hover {
    transition-delay: .3s;
    min-height: 100px;
  }
  .inventory-item:hover .skin-img {
    transition-delay: .3s;
    height: 85px !important;
    min-width: 200px !important;
  }
}



.tabs {
  background: rgba( 255, 255, 255, 0.2 );
  border-radius: 10px 10px 0 0;
  min-width: 800px;
}

.actions-container {
  height: 390px;
  overflow-y: scroll;
  border-radius: 0 0 10px 10px;
}

.action-card {
  position: relative;
  margin-top: 10px;
  background: transparent !important;
  border-radius: 15px !important;
}
.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 100%;
  background: radial-gradient(circle at -100% -300%,#5865f2,transparent 90%) !important;
  z-index: -1;
  transition: 0.2s ease-in-out;
}
.action-card:hover::before {
  transform: translateX(30%);
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
  background: radial-gradient(circle at -100% -300%,#5865f2,transparent 90%) !important;
  z-index: -1;
  transition: 0.2s ease-in-out;
}
.votes-card:hover::before {
  transform: translateX(30%);
}


@media (max-width: 1200px) {
  .tabs {
    min-width: 450px;
  }
}

@media (max-width: 850px) {
  .leaderboard {
    width: 100%;
  }
  .leaderboard-container {
    width: 100%;
    margin-top: 0;
  }
  .user-tab {
    width: 100%;
    margin-top: 0;
    margin-bottom: 3rem;
  }
  .inventory {
    width: 100%;
  }
  .tabs {
    min-width: auto;
  }
}
</style>