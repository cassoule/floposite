<script>
import { io } from 'socket.io-client'
import axios from 'axios'

export default {
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

      this.socket.emit('tictactoeconnection', { id: this.discordId })

      this.socket.on('new-poker-room', async () => {
        await this.getRooms()
      })
    },

    async createRoom() {
      const url = import.meta.env.VITE_FLAPI_URL + '/create-poker-room'
      try {
        const response = await axios.post(url, { creatorId: this.discordId })
      } catch (e) {
        console.log(e)
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
    }
  }
}
</script>

<template>
  <v-layout>
    <v-main>
      <h1>Poker Home</h1>
      <v-btn class="mt-4" text="Créer un lobby" variant="flat" color="primary" rounded="lg" @click="createRoom"></v-btn>

      <div>
        <v-btn
          v-for="room in rooms"
          :key="room.id"
          :text="room.name"
          class="my-2"
          color="primary"
          variant="tonal"
          block
          @click="$router.push('/poker/' + room.id)"
        />
      </div>
    </v-main>

    <v-btn class="back-btn text-none" text="Retour" variant="tonal" color="#ddd" @click="$router.push('/dashboard')"></v-btn>
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