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

      this.socket.on('poker-room-started', async () => {
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
    },

    async leaveRoom() {
      const url = import.meta.env.VITE_FLAPI_URL + '/poker-room/leave'
      try {
        const response = await axios.post(url, { userId: this.discordId, roomId: this.room_id })
      } catch (e) {
        console.log(e)
      }
    },

    async startGame() {
      const url = import.meta.env.VITE_FLAPI_URL + '/poker-room/start'
      try {
        const response = await axios.post(url, { roomId: this.room_id })
      } catch (e) {
        console.log(e)
      }
    }
  },
}
</script>

<template>
  <v-layout class="w-100">
    <v-main class="text-secondary w-100">
      <div v-if="room" class="w-100 mt-16">
        <h1 class="text-white">
          Poker Room
          <span class="text-primary" style="font-size: 1.2rem">{{room.name}}</span>
        </h1>
        <p class="mb-8">{{hasJoinedRoom ? 'Tu es assis à cette table' : ''}}</p>
        <v-btn v-if="!hasJoinedRoom" text="S'asseoir" class="text-none" color="primary" rounded="lg" @click="joinRoom" />
        <v-btn v-else text="Quitter" class="text-none" color="error" rounded="lg" @click="leaveRoom" />
        <p>{{room}}</p>
        <p v-for="player in room.players" :key="player.id" class="mt-6">
          {{player}}
        </p>
        <v-btn v-if="discordId === room.host_id" text="Commencer" class="text-none" color="secondary" variant="tonal" rounded="lg" @click="startGame" />
      </div>

      <div v-else class="w-100 mt-16" style="display: flex; flex-direction: column; place-items: center">
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