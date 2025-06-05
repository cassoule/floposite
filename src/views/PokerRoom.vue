<script>
import { io } from 'socket.io-client'
import axios from 'axios'

export default {
  data() {
    return {
      socket: null,
      discordId: null,

      room_id: this.$route.params.id,
      room: null,
      roomTimeout: false,
    }
  },

  async mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) this.$router.push('/')

    this.initSocket()
    await this.getRoom()
  },

  created() {
    setTimeout(() => {
      if (!this.room) this.roomTimeout = true
    }, 2000)
  },

  computed: {
    hasJoinedRoom() {
      return this.room ? Object.values(this.room?.players).filter((p) => p.id === this.discordId).length > 0 : false
    }
  },

  methods: {
    initSocket() {
      this.socket = io(import.meta.env.VITE_FLAPI_URL, {
        withCredentials: false,
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
      })

      this.socket.on('message', (data) => {
        console.log('room message', data);
      });

      this.socket.on('new-poker-room', async () => {
        await this.getRoom()
      })

      this.socket.on('player-joined', async () => {
        await this.getRoom()
      })
    },

    async getRoom() {
      const url = import.meta.env.VITE_FLAPI_URL + '/poker-rooms/' + this.room_id
      try {
        const response = await axios.get(url)
        this.room = response.data.room
      } catch (e) {
        console.log(e)
      }
    },

    async joinRoom() {
      const url = import.meta.env.VITE_FLAPI_URL + '/poker-room/join'
      try {
        const response = await axios.post(url, { userId: this.discordId, roomId: this.room_id })
      } catch (e) {
        console.log(e)
      }
    }
  },
}
</script>

<template>
  <v-layout>
    <v-main class="text-secondary">
      <div v-if="room">
        <h1 class="text-white">Poker Room</h1>
        <p>{{ room }}</p>
        <p>joined ? {{hasJoinedRoom}}</p>
        <v-btn v-if="!hasJoinedRoom" text="S'asseoir" class="text-none" color="primary" rounded="lg" @click="joinRoom" />
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