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
    }
  },

  async mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) this.$router.push('/')

    this.initSocket()
    await this.getRooms()
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
        this.$router.push('/poker/' + response.data.roomId)
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
  },
}
</script>

<template>
  <v-layout>
    <v-main>
      <h1 class="text-white">Flopoker</h1>

      <h2 class="text-white d-flex justify-space-between align-center mt-12 mb-4">
        Tables actives
        <v-btn
          class="text-none"
          text="Créer une table"
          variant="flat"
          color="primary"
          rounded="lg"
          @click="createRoom"
        ></v-btn>
      </h2>

      <div class="rooms-cont">
        <v-card
          v-for="room in rooms"
          :key="room.id"
          class="px-3 room"
          color="primary"
          variant="tonal"
          rounded="xl"
          block
          @click="$router.push('/poker/' + room.id)"
        >
          <v-card-title class="text-white pb-0 pt-4">
            {{ room.name }}
            <p style="float: right">
              {{ Object.keys(room.players)?.length }}<span class="text-primary">/8</span>
            </p>
          </v-card-title>
          <v-card-subtitle class="pb-4 d-flex justify-space-between">
            <div>Créé par {{ room.host_name }}</div>
            <div>{{ new Date(room.created_at).toLocaleString() }}</div>
          </v-card-subtitle>
        </v-card>
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