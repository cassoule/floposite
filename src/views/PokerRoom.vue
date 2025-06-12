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

    if (this.room.host_id === this.discordId) await this.joinRoom()
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
          Flopoker
          <span class="text-primary" style="font-size: 1.2rem">{{room.name}}</span>
        </h1>
        <p class="mb-8">{{hasJoinedRoom ? (room.host_id === discordId ? 'Tu es l\'host de cette table' : 'Tu es assis à cette table') : ''}}</p>
        <v-btn v-if="!hasJoinedRoom" text="S'asseoir" class="text-none" color="primary" rounded="lg" @click="joinRoom" />
        <v-btn v-else :text="Object.keys(room.players).length === 1 ? 'Supprimer la table' : 'Quitter'" class="text-none" color="error" rounded="lg" @click="leaveRoom" />
<!--        <p>{{room}}</p>-->
        <div style="position: relative">
          <v-card class="w-100 mt-16 py-16" style="border-radius: 200px; background: #3f51b522; border: 8px solid #3f51b599;">
            <div class="d-flex py-16" style="place-content: center">
              <div v-for="card in room.tapis" :key="card" class="mr-2">
                <v-img :src="'/cards/'+card+'.png'" :alt="card" width="80"></v-img>
              </div>
              <div v-for="card in [1, 2, 3, 4, 5]">
                <v-img v-if="room.tapis.length < card" :src="'/cards/card_back.png'" width="80" class="mr-2"></v-img>
              </div>
            </div>
          </v-card>
          <div class="d-flex" style="gap: 1rem">
            <v-card v-for="(player, index) in Object.values(room.players)" :key="player.id" :variant="player.id === discordId ? 'flat' : 'tonal'" class="mt-6" rounded="xl" :style="`width: 200px; ${room.current_player === player.id ? 'border: 4px solid #5865f2' : 'border: 4px solid transparent'}`">
              <v-card-title>
                {{player.globalName}}
              </v-card-title>
              <v-card-subtitle>
                BET : {{player.bet ?? 0}} FlopoCoins
              </v-card-subtitle>
              <v-card-subtitle class="mb-3">
                BANK : {{player.bank}} FlopoCoins
              </v-card-subtitle>
              <div v-if="room.playing">
                <v-card-text v-if="player.id === discordId" class="d-flex" style="place-content: center; gap: 1rem">
                  <div v-for="card in player.hand" :key="card">
                    <v-img :src="'/cards/'+card+'.png'" :alt="card" width="70"></v-img>
                  </div>
                </v-card-text>
                <v-card-text v-else class="d-flex" style="place-content: center; gap: 1rem">
                  <div><v-img :src="'/cards/card_back.png'" alt="back_card" width="70"></v-img></div>
                  <div><v-img :src="'/cards/card_back.png'" alt="back_card" width="70"></v-img></div>
                </v-card-text>
                <v-card-item>
                  {{room.dealer === player.id ? 'Dealer' : ''}}
                  {{room.sb === player.id ? 'Small Blind' : ''}}
                  {{room.bb === player.id ? 'Big Blind' : ''}}
                  <br>
                  {{room.current_player === player.id ? 'Playing' : ''}}
                </v-card-item>
                <v-card-text v-if="player.id === discordId" class="text-center font-weight-bold">
                  {{player.solve}}
                </v-card-text>
              </div>
            </v-card>
          </div>
        </div>

        <v-btn v-if="discordId === room.host_id && !room.playing" text="Commencer" class="text-none mt-8" color="secondary" variant="tonal" rounded="lg" :disabled="Object.keys(room.players).length < 2" @click="startGame" />
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