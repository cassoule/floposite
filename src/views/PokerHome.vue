<script>
import { io } from 'socket.io-client'
import axios from 'axios'
import Toast from '@/components/Toast.vue'
import { useToastStore } from '@/stores/toastStore.js'

export default {
  components: { Toast },

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

    const showCommandToast = (message) => {
      toastStore.showCommandToast(message)
    }

    const showSuccessOrWarningToast = (message, warning) => {
      toastStore.showSuccessOrWarningToast(message, warning)
    }

    const showErrorToast = (message) => {
      toastStore.showErrorToast(message)
    }

    return {
      toastStore: toastStore.$state,
      showLogoutToast,
      showSentToast,
      showSendingToast,
      showCommandToast,
      showSuccessOrWarningToast,
      showErrorToast,
    }
  },

  data() {
    return {
      socket: null,
      discordId: null,

      rooms: null,
      avatars: {},
      users: {},
    }
  },

  async mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) this.$router.push('/')

    this.initSocket()
    await this.getRooms()
    await this.getUsers()
    this.fetchAvatars()
  },

  methods: {
    initSocket() {
      this.socket = io(import.meta.env.VITE_FLAPI_URL, {
        withCredentials: false,
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
      })

      this.socket.on('new-poker-room', async () => {
        await this.getRooms()
      })
    },

    async createRoom() {
      const url = import.meta.env.VITE_FLAPI_URL + '/create-poker-room'
      try {
        const response = await axios.post(url, { creatorId: this.discordId })
        this.$router.push(`/poker/${response.data.roomId}`)
      } catch (e) {
        this.showErrorToast(e.response.data.message)
      }
    },

    async getRooms() {
      const url = import.meta.env.VITE_FLAPI_URL + '/poker-rooms'
      try {
        const response = await axios.get(url)
        this.rooms = response.data.rooms
      } catch (e) {
        console.log(e)
      }
    },

    async getUsers() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/users'
      try {
        console.log(fetchUrl)
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          },
          withCredentials: false,
        })
        this.users = response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }

      try {
        const response = await axios.get(fetchUrl + '/by-elo', {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          },
          withCredentials: false,
        })
        this.usersByElo = response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },


    fetchAvatars() {
      this.users.forEach(async (user) => {
        this.avatars[user.id] = await this.getAvatar(user.id)
      })
    },

    async getAvatar(id) {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + id + '/avatar'
      try {
        console.log(fetchUrl)
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          },
          withCredentials: false,
        })
        return response.data.avatarUrl
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },
  },
}
</script>

<template>
  <v-layout class="w-100">
    <v-main class="d-flex w-100">
      <div class="w-100 mt-16">
        <h1 class="text-white mb-4" style="position: relative; width: fit-content">
          Flopoker
          <v-badge content="β BETA" color="secondary" style="position: absolute; top: .8em; right: -1em"/>
        </h1>

        <v-alert color="#dddddd22" variant="flat" rounded="xl" closable>
          <v-alert-title class="text-white">
            Bêta, mais...
          </v-alert-title>
          <br>
          <p class="text-white">Le Flopoker est en bêta, cependant il influe maintenant réellement sur les coins et l'elo de chaque joueurs présent au <i>classement</i>.</p>
          <p class="text-white font-weight-bold">Je ne peux pas assurer que les coins (ou l'elo) perdus à l'occasion de potentiels bugs puissent être récupérés.</p>
          <br>
          <p class="text-white">Si un joueur non présent au <i>classement</i> ou avec moins de 100 FlopoCoins rejoint une table alors celle-ci n'influera que sur l'elo des joueurs présent au <i>classement</i> et pas sur leurs FlopoCoins.</p>
          <template #close="{ props }">
            <v-icon v-bind="props" icon="mdi mdi-close" color="white"></v-icon>
          </template>
          <template #prepend>
            <v-icon icon="mdi mdi-beta" color="white"></v-icon>
          </template>
        </v-alert>

        <h2 class="text-white d-flex justify-space-between align-center mt-8 mb-4" style="border-radius: 15px; background: #dddddd22; padding: 5px 5px 5px .6em">
          Tables
          <v-btn
            class="text-none"
            text="Créer une table"
            variant="flat"
            color="primary"
            append-icon="mdi-plus"
            style="border-radius: 10px"
            @click="createRoom"
          ></v-btn>
        </h2>

        <div v-if="rooms ? Object.keys(rooms)?.length > 0 : false" class="rooms-cont">
          <v-card
            v-for="room in rooms"
            :key="room.id"
            class="px-0 room"
            :color="Object.keys(room.players).includes(discordId) ? 'secondary' : 'primary'"
            variant="tonal"
            style="border-radius: 15px !important"
            block
            @click="$router.push('/poker/' + room.id)"
          >
            <v-card-title class="text-white pb-0 pt-2">
              {{ room.name }}
              <p style="float: right">
                {{ Object.keys(room.players)?.length }}<span class="text-primary">/8</span>
              </p>
            </v-card-title>
            <v-card-text class="d-flex justify-space-between pt-1 pb-1">
              <div style="display: flex; place-content: start; gap: 0; width: 100%; overflow: hidden; border-radius: 10px">
                <div v-for="(player, index) in Object.values(room.players)"
                     :key="player.id + Date.now()"
                     :style="`transform: translateX(calc(-10px * ${index})); z-index: 1;`"
                >
                  <v-img
                    :src="avatars[player.id]"
                    color="transparent"
                    style="border-radius: 50%; width: 20px; height: 20px"
                  />
                </div>
              </div>
            </v-card-text>
            <v-card-subtitle class="pb-3 d-flex justify-space-between">
              <div>Créé par {{ room.host_name }}</div>
              <div>{{ new Date(room.created_at).toLocaleString() }}</div>
            </v-card-subtitle>
          </v-card>
        </div>
        <div v-else class="rooms-cont">
          <p class="ma-auto text-center text-white">
            Aucune table pour le moment
            <br>
            <span class="text-secondary font-weight-thin">Tu peux en créer une ^^</span>
          </p>
        </div>
      </div>
    </v-main>

    <v-btn
      class="back-btn text-none"
      text="Retour"
      variant="tonal"
      color="#ddd"
      @click="$router.push('/dashboard')"
    ></v-btn>


  </v-layout>
  <toast v-if="toastStore.show" :key="toastStore.toastKey" />
</template>

<style scoped>
.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 12px;
}
.rooms-cont {
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
  height: 400px;
  gap: 1em;
}
.room {
  border: 2px solid transparent;
  transition: 0.1s ease-in-out;
  flex-shrink: 0;
}

.room:hover {
  border: 2px solid #5865f2;
}
</style>