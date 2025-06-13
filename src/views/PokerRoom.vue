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

      raiseValue: 0,
      adjustInterval: null,
    }
  },

  async mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) this.$router.push('/')

    this.initSocket()
    await this.getRoom()

    if (this.room.host_id === this.discordId)
      setTimeout(async () => {
        await this.joinRoom()
      }, 250)
  },

  created() {
    setTimeout(() => {
      if (!this.room) this.roomTimeout = true
    }, 2000)
  },

  computed: {
    hasJoinedRoom() {
      return this.room
        ? Object.values(this.room?.players).filter((p) => p.id === this.discordId).length > 0
        : false
    },
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
        console.log('room message', data)
      })

      this.socket.on('new-poker-room', async () => {
        await this.getRoom()
        this.raiseValue = ((this.room?.highest_bet ?? 0) - ((this.room?.players[this.discordId]?.bet ?? 0))) + 10
      })

      this.socket.on('player-joined', async () => {
        await this.getRoom()
      })

      this.socket.on('poker-room-started', async () => {
        await this.getRoom()
        this.raiseValue = ((this.room?.highest_bet ?? 0) - ((this.room?.players[this.discordId]?.bet ?? 0))) + 10
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
        this.$router.push('/poker')
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
    },

    async handleFold() {
      const url = import.meta.env.VITE_FLAPI_URL + '/poker-room/action/fold'
      try {
        const response = await axios.post(url, { roomId: this.room_id, playerId: this.discordId })
      } catch (e) {
        console.log(e)
      }
    },

    async handleCheck() {
      const url = import.meta.env.VITE_FLAPI_URL + '/poker-room/action/check'
      try {
        const response = await axios.post(url, { roomId: this.room_id, playerId: this.discordId })
      } catch (e) {
        console.log(e)
      }
    },

    async handleCall() {
      const url = import.meta.env.VITE_FLAPI_URL + '/poker-room/action/call'
      try {
        const response = await axios.post(url, { roomId: this.room_id, playerId: this.discordId })
      } catch (e) {
        console.log(e)
      }
    },

    async handleRaise() {
      const url = import.meta.env.VITE_FLAPI_URL + '/poker-room/action/raise'
      try {
        const response = await axios.post(url, { roomId: this.room_id, playerId: this.discordId, amount: this.raiseValue })
      } catch (e) {
        console.log(e)
      }
    },

    formatAmount(amount) {
      if (amount >= 1000000000) {
        amount /= 1000000000
        return (
          amount
            .toFixed(2)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + 'Md'
        )
      }
      if (amount >= 1000000) {
        amount /= 1000000
        return (
          amount
            .toFixed(2)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + 'M'
        )
      }
      if (amount >= 10000) {
        amount /= 1000
        return (
          amount
            .toFixed(2)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + 'K'
        )
      }
      return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    },

    startAdjust(amount) {
      this.adjustValue(amount); // Apply once immediately
      this.stopAdjust(); // Clear any existing interval

      this.adjustInterval = setInterval(() => {
        this.adjustValue(amount);
      }, 150); // adjust the speed if needed
    },

    stopAdjust() {
      if (this.adjustInterval) {
        clearInterval(this.adjustInterval);
        this.adjustInterval = null;
      }
    },

    adjustValue(amount) {
      const minRaise = (this.room?.highest_bet - this.room?.players[this.discordId]?.bet) + 10;
      const maxRaise = this.room?.players[this.discordId]?.bank;

      const newValue = this.raiseValue + amount;
      if (amount < 0 && newValue >= minRaise) {
        this.raiseValue = newValue;
      } else if (amount > 0 && newValue <= maxRaise) {
        this.raiseValue = newValue;
      }
    },
  },
}
</script>

<template>
  <v-layout class="w-100">
    <v-main class="text-secondary w-100">
      <div v-if="room" class="w-100 mt-16">
        <h1 class="text-white">
          Flopoker
          <span class="text-primary" style="font-size: 1.2rem">{{ room.name }}</span>
          <span class="ml-16" style="float: right">
            <v-btn
              v-if="discordId === room.host_id && !room.playing"
              text="Commencer"
              class="text-none mr-4"
              color="white"
              variant="tonal"
              rounded="lg"
              :disabled="Object.keys(room.players).length < 2"
              @click="startGame"
            />
            <v-btn
              v-if="!hasJoinedRoom"
              text="S'asseoir"
              class="text-none"
              color="primary"
              rounded="lg"
              @click="joinRoom"
            />
            <v-btn
              v-else
              :text="Object.keys(room.players).length === 1 ? 'Supprimer la table' : 'Quitter'"
              class="text-none"
              color="error"
              rounded="lg"
              @click="leaveRoom"
            />
          </span>
        </h1>
        <p class="mb-8 mt-10">
          {{
            hasJoinedRoom
              ? room.host_id === discordId
                ? "Tu es l'host de cette table"
                : 'Tu es assis à cette table'
              : ''
          }}
        </p>
        <!--        <p>{{room}}</p>-->
        <div style="position: relative">
          <v-card
            class="w-100 mt-16 py-16"
            style="border-radius: 200px; background: #3f51b522; border: 8px solid #3f51b599"
          >
            <div class="d-flex py-16" style="place-content: center; flex-wrap: wrap">
              <div v-for="card in room.tapis" :key="card" class="mr-2 mb-2">
                <v-img :src="'/cards/' + card + '.png'" :alt="card" width="80"></v-img>
              </div>
              <div v-for="card in [1, 2, 3, 4, 5]">
                <v-img
                  v-if="room.tapis.length < card"
                  :src="'/cards/card_back.png'"
                  width="80"
                  class="mr-2 mb-2"
                ></v-img>
              </div>
            </div>
          </v-card>
          <div class="d-flex mb-16 pb-16" style="gap: 1rem; flex-wrap: wrap">
            <v-card
              v-for="(player, index) in Object.values(room.players)"
              :key="player.id"
              :variant="player.id === discordId ? 'tonal' : 'text'"
              class="mt-6"
              rounded="xl"
              :style="`width: 200px; ${room.current_player === player.id ? 'border: 4px solid #5865f2' : 'border: 4px solid transparent'}`"
            >
              <v-card-title>
                {{ player.globalName }}
                <span
                  v-if="room.dealer === player.id"
                  style="background: #ddd; color: black; border-radius: 50%; padding: 0 0.2em"
                >
                  D
                </span>
              </v-card-title>
              <v-card-text class="text-white pb-0">
                {{ formatAmount(player.bet ?? 0) }} FC
                <span v-if="player.allin" class="bg-primary ml-2 px-2 rounded-lg font-weight-bold">ALL IN</span>
                <span v-if="player.folded" class="bg-error ml-2 px-2 rounded-lg font-weight-bold">FOLDED</span>
              </v-card-text>
              <v-card-subtitle class="mb-3" :title="player.bank + ' FC'">
                {{ formatAmount(player.bank) }} FC
              </v-card-subtitle>
              <div>
                <v-card-text
                  v-if="player.id === discordId || player.allin || player.folded || !room.playing"
                  class="d-flex"
                  style="place-content: center; gap: 1rem"
                >
                  <div v-for="card in player.hand" :key="card">
                    <v-img :src="'/cards/' + card + '.png'" :alt="card" width="70"></v-img>
                  </div>
                </v-card-text>
                <v-card-text v-else class="d-flex" style="place-content: center; gap: 1rem">
                  <div>
                    <v-img :src="'/cards/card_back.png'" alt="back_card" width="70"></v-img>
                  </div>
                  <div>
                    <v-img :src="'/cards/card_back.png'" alt="back_card" width="70"></v-img>
                  </div>
                </v-card-text>
                <v-card-text v-if="player.id === discordId || player.allin || player.folded || !room.playing" class="text-center font-weight-bold">
                  {{ player.solve }}
                </v-card-text>
              </div>
            </v-card>
            <div
              v-if="Object.keys(room.players).length < 2"
              class="mt-6 d-flex flex-column"
              style="place-items: center; place-content: end; gap: 1em"
            >
              <v-progress-circular color="primary" indeterminate></v-progress-circular>
              <p class="text-center" style="font-size: 0.8em; color: #ddd">
                En attente d'un <br />
                autre joueur...
              </p>
            </div>
          </div>
        </div>

        <v-card
          v-if="Object.keys(room.players).includes(discordId)"
          :color="discordId !== room.current_player ? 'dark' : 'white'"
          :variant="discordId !== room.current_player ? 'flat' : 'tonal'"
          style="
            position: fixed;
            bottom: 1em;
            right: 1em;
            border-radius: 15px;
            width: 90%;
            max-width: 500px;
            backdrop-filter: blur(20px) brightness(30%);
            transition: 0.5s ease-in;
          "
          :style="discordId !== room.current_player ? 'height: 35px' : ''"
          :disabled="discordId !== room.current_player"
        >
          <v-card-text class="d-flex pt-2 pb-0" style="place-content: space-between">
            <p style="flex-grow: 1">
              <span style="color: #ddddddaa">Your Bet</span>
              {{ formatAmount(room.players[discordId].bet ?? 0) }}
            </p>
            <p style="flex-grow: 1; text-align: center">
              <span style="color: #ddddddaa">Current Bet</span>
              {{ formatAmount(room.highest_bet ?? 0) }}
            </p>
            <p style="flex-grow: 1; text-align: right">
              <span style="color: #ddddddaa">Stack</span>
              {{ formatAmount(room.players[discordId].bank ?? 0) }}
            </p>
          </v-card-text>
          <v-card-text class="d-flex pt-2 pb-0" style="place-content: space-between">
            <p>C'est à ton tour !</p>
            <p>
              <span style="color: #ddddddaa">To Call</span>
              {{ formatAmount((room.highest_bet ?? 0) - (room.players[discordId].bet ?? 0)) }}
            </p>
          </v-card-text>
          <v-card-text class="d-flex pa-3 pb-1" style="gap: 0.5em">
            <v-btn color="error" style="border-radius: 10px; flex-grow: 1" @click="handleFold">Fold</v-btn>
            <v-btn
              color="primary"
              :disabled="room.players[discordId].bet < room.highest_bet"
              style="border-radius: 10px; flex-grow: 1"
              @click="handleCheck"
            >
              Check
            </v-btn>
            <v-btn
              color="primary"
              :disabled="room.players[discordId].bet >= room.highest_bet"
              style="border-radius: 10px; flex-grow: 1; width: 15%"
              @click="handleCall"
            >
              {{ room.players[discordId].bank <= room.highest_bet ? 'All In' : 'Call' }}
            </v-btn>
          </v-card-text>
          <v-card-text class="d-flex pa-3 pt-1" style="gap: .5em">
            <v-slider
              v-model="raiseValue"
              hide-details
              color="primary"
              step="10"
              :min="(room.highest_bet - room.players[discordId]?.bet) + 10"
              :max="room.players[discordId]?.bank"
              :thumb-label="raiseValue"
              style="flex-grow: 6"
            >
              <template #prepend>
                <button class="py-0 px-2 ma-0 mr-1" style="font-size: .9em" :disabled="raiseValue <= (room.highest_bet - room.players[discordId]?.bet) + 10" @mousedown="startAdjust(-10)" @mouseup="stopAdjust" @mouseleave="stopAdjust">-</button>
                <button class="py-0 px-2 ma-0" style="font-size: .9em" :disabled="raiseValue >= room.players[discordId]?.bank" @mousedown="startAdjust(10)" @mouseup="stopAdjust" @mouseleave="stopAdjust">+</button>
                <p class="text-right" style="min-width: 50px; font-size: .6em; padding: 0">{{ formatAmount(raiseValue) }}</p>
              </template>
            </v-slider>
            <v-btn
              color="primary"
              :disabled="raiseValue <= 0"
              style="border-radius: 10px; flex-grow: 2; width: 17%"
              :style="
                raiseValue === room.players[discordId]?.bank ? 'border: 2px solid #dddddddd' : ''
              "
              @click="handleRaise"
            >
              {{ raiseValue === room.players[discordId]?.bank ? 'All in' : 'Raise' }}
            </v-btn>
          </v-card-text>
        </v-card>
      </div>

      <div
        v-else
        class="w-100 mt-16"
        style="display: flex; flex-direction: column; place-items: center"
      >
        <v-progress-circular class="mb-6" color="primary" indeterminate />
        <p class="text-secondary">
          {{ roomTimeout ? "Cette partie n'a pas l'air accessible" : 'Connexion...' }}
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