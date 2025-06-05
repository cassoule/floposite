<script>
import { io } from 'socket.io-client'
import axios from 'axios'

export default {
  data() {
    return {
      socket: null,
      discordId: null,

      room: null,
      roomTimeout: false,
    }
  },

  async mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) this.$router.push('/')

    this.initSocket()
    await this.getRoom(this.$route.params.id)
  },

  created() {
    setTimeout(() => {
      if (!this.room) this.roomTimeout = true
    }, 2000)
  },

  methods: {
    initSocket() {
      this.socket = io(import.meta.env.VITE_FLAPI_URL, {
        withCredentials: false,
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
      })

      this.socket.emit('tictactoeconnection', { id: this.discordId })

      this.socket.on('new-poker-room', async () => {
        await this.getRooms()
      })
    },

    async getRoom(id) {
      const url = import.meta.env.VITE_FLAPI_URL + '/poker-rooms/' + id
      try {
        const response = await axios.get(url)
        this.room = response.data.room
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
      <div v-if="room">
        <h1>Poker Room</h1>
        <p>{{ room }}</p>
      </div>
      <div v-else style="display: flex; flex-direction: column; place-items: center">
        <v-progress-circular class="mb-6" color="primary" indeterminate />
        <p class="text-secondary">
          {{ roomTimeout ? "Cette partie n'a pas l'air accessible" : "Connexion..." }}
        </p>
      </div>
    </v-main>
    <v-btn
      class="back-btn text-none"
      text="Retour"
      variant="tonal"
      color="#ddd"
      @click="$router.push('/poker')"
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
</style>