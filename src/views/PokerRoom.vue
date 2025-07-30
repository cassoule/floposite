<script>
import { io } from 'socket.io-client'
import axios from 'axios'
import { time } from '@discordjs/formatters'
import Toast from '../components/Toast.vue'
import { useToastStore } from '../stores/toastStore.js'

export default {
  components: { Toast },
  setup() {
    const toastStore = useToastStore()

    const showSuccessOrWarningToast = (message, warning) => {
      toastStore.showSuccessOrWarningToast(message, warning)
    }

    return {
      toastStore: toastStore.$state,
      showSuccessOrWarningToast,
    }
  },

  data() {
    return {
      socket: null,
      discordId: null,

      room_id: this.$route.params.id,
      room: null,
      roomTimeout: false,

      raiseValue: 0,
      adjustInterval: null,

      now: Date.now(),
      users: {},
      avatars: {},
    }
  },

  async mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) this.$router.push('/')

    await this.getUsers()
    this.initSocket()
    this.fetchAvatars()
    await this.getRoom()
  },

  created() {
    setTimeout(() => {
      if (!this.room) this.roomTimeout = true
    }, 2000)

    this.interval = setInterval(() => {
      this.now = Date.now()
    }, 1)
  },

  beforeDestroy() {
    clearInterval(this.interval)
  },

  computed: {
    hasJoinedRoom() {
      return this.room
        ? Object.values(this.room?.players).filter((p) => p.id === this.discordId).length > 0
        : false
    },

    isInQueue() {
      return this.room
        ? Object.values(this.room?.queue).filter((p) => p.id === this.discordId).length > 0
        : false
    },

    timeLeft() {
      if (this.room?.playing && !this.room?.waiting_for_restart) {
        let tl = Math.min(
          Math.floor((((this.now - (this.room?.last_move_at || this.now)) / 1000) * 100) / 60),
          100,
        )
        if (tl === 100) {
          console.log('no time left')
          if (this.discordId === this.room?.current_player) {
            console.log('auto fold')
            this.handleFold()
          }
        }
        if (Object.keys(this.room?.afk).includes(this.discordId)) {
          if (this.discordId === this.room?.current_player) {
            console.log('afk fold')
            this.handleFold()
          }
        }
        return tl
      } else {
        return 0
      }
    },

    totalPot() {
      if (!this.room?.players) return 0
      return Object.values(this.room.players).reduce((sum, player) => {
        return sum + (player.bet || 0)
      }, 0)
    },
  },

  methods: {
    time,
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
        const initialRoom = this.room
        await this.getRoom()
        if (initialRoom === this.room) window.location.reload()
        this.raiseValue =
          (this.room?.highest_bet ?? 0) - (this.room?.players[this.discordId]?.bet ?? 0) + 10
      })

      this.socket.on('player-joined', async () => {
        await this.getRoom()
      })

      this.socket.on('poker-room-started', async () => {
        await this.getRoom()
        this.raiseValue =
          (this.room?.highest_bet ?? 0) - (this.room?.players[this.discordId]?.bet ?? 0) + 10
      })

      this.socket.on('room-start', async (data) => {
        console.log('room start', data)
      })

      this.socket.on('player-fold', async (data) => {
        if (data.roomId === this.room.id) {
          this.showSuccessOrWarningToast(`${data.playerId !== this.discordId ? `${data.playerName} ` : ''}FOLDED`, true)
        }

      })

      this.socket.on('player-check', async (data) => {
        if (data.roomId === this.room.id) {
          this.showSuccessOrWarningToast(`${data.playerId !== this.discordId ? `${data.playerName} a ` : 'Tu as '}CHECK`, false)
        }
      })

      this.socket.on('player-call', async (data) => {
        if (data.roomId === this.room.id) {
          this.showSuccessOrWarningToast(`${data.playerId !== this.discordId ? `${data.playerName} a ` : 'Tu as '}CALL`, false)
        }
      })

      this.socket.on('player-raise', async (data) => {
        if (data.roomId === this.room.id) {
          this.showSuccessOrWarningToast(`${data.playerId !== this.discordId ? `${data.playerName} a ` : 'Tu as '}RAISE par ${data.amount}`, false)
        }
      })

      this.socket.on('player-winner', async (data) => {
        if (data.roomId === this.room.id) {
          let playerNames = ''
          data.playerIds.forEach((playerId, index) => {
            if (index > 0) {
              playerNames += ', '
            }
            playerNames += this.room.players[playerId].globalName
          })
          this.showSuccessOrWarningToast(`${data.playerIds.includes(this.discordId) ? `Tu a gagné ` : playerNames + (data.playerIds.length > 1 ? ' ont gagné ' : ' a gagné ')}${data.amount}`, false)
        }
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
      await this.getUsers()
    },

    async joinRoom() {
      const url = import.meta.env.VITE_FLAPI_URL + '/poker-room/join'
      try {
        const response = await axios.post(url, { userId: this.discordId, roomId: this.room_id })
      } catch (e) {
        console.log(e)
      }
      await this.getRoom()
    },

    async handleAccept(id) {
      const url = import.meta.env.VITE_FLAPI_URL + '/poker-room/accept'
      try {
        const response = await axios.post(url, { userId: id, roomId: this.room_id })
      } catch (e) {
        console.log(e)
      }
      await this.getRoom()
    },

    async leaveRoom() {
      const url = import.meta.env.VITE_FLAPI_URL + '/poker-room/leave'
      try {
        this.$router.push('/poker')
        const response = await axios.post(url, { userId: this.discordId, roomId: this.room_id })
      } catch (e) {
        console.log(e)
      }
      await this.getRoom()
    },

    async startGame() {
      const url =
        import.meta.env.VITE_FLAPI_URL +
        (this.room?.waiting_for_restart || this.room?.current_turn === 4
          ? '/poker-room/next-round'
          : '/poker-room/start')
      try {
        const response = await axios.post(url, { roomId: this.room_id })
      } catch (e) {
        console.log(e)
      }
      await this.getRoom()
    },

    async handleFold() {
      const url = import.meta.env.VITE_FLAPI_URL + '/poker-room/action/fold'
      try {
        const response = await axios.post(url, { roomId: this.room_id, playerId: this.discordId })
      } catch (e) {
        console.log(e)
      }
      await this.getRoom()
    },

    async handleCheck() {
      const url = import.meta.env.VITE_FLAPI_URL + '/poker-room/action/check'
      try {
        const response = await axios.post(url, { roomId: this.room_id, playerId: this.discordId })
      } catch (e) {
        console.log(e)
      }
      await this.getRoom()
    },

    async handleCall() {
      const url = import.meta.env.VITE_FLAPI_URL + '/poker-room/action/call'
      try {
        const response = await axios.post(url, { roomId: this.room_id, playerId: this.discordId })
      } catch (e) {
        console.log(e)
      }
      await this.getRoom()
    },

    async handleRaise() {
      const url = import.meta.env.VITE_FLAPI_URL + '/poker-room/action/raise'
      try {
        const response = await axios.post(url, {
          roomId: this.room_id,
          playerId: this.discordId,
          amount: this.raiseValue,
        })
      } catch (e) {
        console.log(e)
      }
      await this.getRoom()
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
      this.adjustValue(amount) // Apply once immediately
      this.stopAdjust() // Clear any existing interval

      this.adjustInterval = setInterval(() => {
        this.adjustValue(amount)
      }, 150) // adjust the speed if needed
    },

    stopAdjust() {
      if (this.adjustInterval) {
        clearInterval(this.adjustInterval)
        this.adjustInterval = null
      }
    },

    adjustValue(amount) {
      const minRaise = this.room?.highest_bet - this.room?.players[this.discordId]?.bet + 10
      const maxRaise = this.room?.players[this.discordId]?.bank

      const newValue = this.raiseValue + amount
      if (amount < 0 && newValue >= minRaise) {
        this.raiseValue = newValue
      } else if (amount > 0 && newValue <= maxRaise) {
        this.raiseValue = newValue
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
    <v-main class="text-secondary w-100">
      <div v-if="room" class="w-100 mt-16">
        <h1 class="text-white">
          Flopoker
          <span class="text-primary" style="font-size: 1.2rem">{{ room.name }}</span>
          <span class="ml-16" style="float: right">
            <v-btn
              v-if="
                discordId === room?.host_id &&
                (!room?.playing ||
                  room?.waiting_for_restart ||
                  room?.current_turn === 4 ||
                  room?.curent_turn === null)
              "
              :text="room?.playing ? 'Manche suivante' : 'Commencer'"
              class="text-none mr-4"
              color="white"
              variant="tonal"
              rounded="lg"
              :disabled="Object.keys(room?.players)?.length - Object.keys(room?.afk)?.length < 2"
              @click="startGame"
            />
            <v-btn
              v-if="!hasJoinedRoom"
              text="S'asseoir"
              class="text-none"
              color="primary"
              rounded="lg"
              :loading="isInQueue"
              @click="joinRoom"
            />
            <v-btn
              v-else-if="!Object.keys(room?.afk).includes(discordId)"
              :text="
                Object.keys(room.players).length - Object.keys(room.afk).length <= 1 &&
                discordId === room.host_id
                  ? 'Supprimer la table'
                  : 'Quitter'
              "
              class="text-none"
              color="error"
              rounded="lg"
              @click="leaveRoom"
            />
            <div
              v-if="
                Object.keys(room.players).length - Object.keys(room.afk).length < 2 &&
                discordId === room?.host_id
              "
              class="d-flex flex-column mt-2 ml-1"
              style="place-items: start; place-content: start"
            >
              <p class="text-center" style="font-size: 0.7rem; color: #ddd">
                En attente d'un autre joueur...
              </p>
            </div>
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
          <span
            v-if="room.fakeMoney"
            title="Un des joueurs ne possède pas de FlopoCoins, cette table n'aura d'impact que sur l'elo des joueurs concernés"
            style="
              background: red;
              border-radius: 20px;
              padding: 3px 8px;
              font-weight: bold;
              margin-left: 1em;
              cursor: default;
            "
          >
            FAKE MONEY
          </span>
        </p>
        <div style="position: relative">
          <v-card
            class="w-100 mt-16 py-16"
            style="
              position: relative;
              border-radius: 200px;
              background: #3f51b522;
              border: 8px solid #3f51b599;
            "
          >
            <div class="d-flex py-16" style="place-content: center; flex-wrap: wrap">
              <div v-for="card in room.tapis" :key="card" class="mr-2 mb-2">
                <v-img :src="'/cards/' + card + '.png'" :alt="card" width="80" />
              </div>
              <div v-for="card in [1, 2, 3, 4, 5]">
                <v-img
                  v-if="room.tapis.length < card"
                  :src="'/cards/card_back.png'"
                  width="80"
                  class="mr-2 mb-2"
                />
              </div>
            </div>
            <div
              v-if="room?.playing && room.current_turn !== null && room.current_turn !== 4"
              style="position: absolute; bottom: 2em; text-align: center; width: 100%; color: white"
            >
              <p>
                <span style="color: #dddddddd">Current Bet</span> {{ room?.highest_bet ?? 0 }}
                <span class="ml-4" style="color: #dddddddd">Pot</span> {{ totalPot }}
              </p>
              <p v-if="room?.current_player">
                <span style="color: #dddddddd">Au tour de </span>
                {{ room?.players[room?.current_player]?.globalName }}
              </p>
            </div>
          </v-card>
          <v-divider class="mt-6" />
          <div class="d-flex mb-16 pb-16" style="gap: 1rem; flex-wrap: wrap">
            <v-card
              v-for="(player, index) in Object.values(room.players)"
              :key="player.id"
              :variant="player.id === discordId ? 'tonal' : 'text'"
              class="mt-6"
              rounded="xl"
              style="width: 200px; overflow: hidden"
            >
              <div
                v-if="player.id === room.current_player"
                style="
                  width: 200px;
                  height: 100%;
                  border: 15px solid transparent;
                  position: absolute;
                  z-index: -1;
                  transition: 0.1s ease;
                "
                :style="`border-image: conic-gradient(from 0deg, #5865f2 ${100 - timeLeft}%, transparent 0) 1`"
              >
                <div
                  style="
                    width: calc(100% + 18px);
                    height: calc(100% + 18px);
                    top: -9px;
                    left: -9px;
                    background: #37384a;
                    position: absolute;
                    z-index: 0;
                    border-radius: 18px;
                  "
                ></div>
              </div>
              <v-card-title style="display: flex; place-items: center; gap: 0.5rem">
                <v-img
                  :src="avatars[player.id]"
                  class="bg-primary"
                  width="20"
                  max-width="20"
                  height="20"
                  rounded="xl"
                ></v-img>
                {{ player.globalName }}
                <span
                  v-if="room.dealer === player.id"
                  style="
                    background: #ddd;
                    color: black;
                    border-radius: 50%;
                    padding: 0 0.4em;
                    font-size: 0.6em;
                    font-weight: bold;
                  "
                >
                  D
                </span>
                <span
                  v-if="Object.keys(room.afk).includes(player.id)"
                  style="
                    background: red;
                    color: white;
                    border-radius: 5px;
                    padding: 0 0.4em;
                    font-size: 0.6em;
                    font-weight: bold;
                  "
                >
                  AFK
                </span>
              </v-card-title>
              <v-card-text class="text-white pb-0">
                {{ formatAmount(player.bet ?? 0) }} FC
                <span v-if="player.allin" class="bg-primary ml-2 px-2 rounded-lg font-weight-bold">
                  ALL IN
                </span>
                <span v-if="player.folded" class="bg-error ml-2 px-2 rounded-lg font-weight-bold">
                  FOLDED
                </span>
                <span
                  v-if="room.winners.includes(player.id)"
                  class="ml-2 px-2"
                  style="
                    background: #5865f2;
                    color: white;
                    border-radius: 10px;
                    padding: 0 0.4em;
                    font-size: 1em;
                  "
                >
                  {{ room.winners.length > 1 ? 'SHARE' : 'WIN' }}
                </span>
              </v-card-text>
              <v-card-subtitle class="mb-3" :title="player.bank + ' FC'">
                {{ formatAmount(player.bank) }} FC
              </v-card-subtitle>
              <v-card-subtitle class="mb-3" :title="player.bank + ' FC'">
                {{ users.find(u => u.id === player.id)?.elo ? users.find(u => u.id === player.id)?.elo + ' FlopoElo' : 'Non Classé' }}
              </v-card-subtitle>
              <div>
                <v-card-text
                  v-if="player.id === discordId || !room.playing || room.current_turn === 4"
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
                <v-card-text
                  v-if="player.id === discordId || !room.playing || room.current_turn === 4"
                  class="text-center font-weight-bold"
                >
                  {{ player.solve }}
                </v-card-text>
              </div>
            </v-card>
            <div v-if="Object.values(room?.queue).length > 0" class="mt-6 ml-6 d-flex flex-column">
              <p class="mb-3">File d'attente</p>
              <p v-for="player in room?.queue" class="mb-3">
                {{ player.globalName }}
                <button
                  v-if="discordId === room?.host_id"
                  :disabled="room?.current_turn !== 4 && room?.current_turn !== null"
                  style="font-size: 0.75em; padding: 0.3em 0.6em; margin-left: 1em"
                  @click="handleAccept(player.id)"
                >
                  Accepter
                </button>
              </p>
            </div>
          </div>
        </div>

        <!--COMMANDS-->
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
            <v-btn color="error" style="border-radius: 10px; flex-grow: 1" @click="handleFold"
              >Fold</v-btn
            >
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
              {{
                room.players[discordId].bank <= room.highest_bet - room.players[discordId].bet
                  ? 'All In'
                  : 'Call'
              }}
            </v-btn>
          </v-card-text>
          <v-card-text class="d-flex pa-3 pt-1" style="gap: 0.5em">
            <v-slider
              v-model="raiseValue"
              hide-details
              color="primary"
              step="10"
              :min="room.highest_bet - room.players[discordId]?.bet + 10"
              :max="room.players[discordId]?.bank"
              :thumb-label="raiseValue"
              style="flex-grow: 6"
            >
              <template #prepend>
                <button
                  class="py-0 px-2 ma-0 mr-1"
                  style="font-size: 0.9em"
                  :disabled="raiseValue <= room.highest_bet - room.players[discordId]?.bet + 10"
                  @mousedown="startAdjust(-10)"
                  @mouseup="stopAdjust"
                  @mouseleave="stopAdjust"
                >
                  -
                </button>
                <button
                  class="py-0 px-2 ma-0"
                  style="font-size: 0.9em"
                  :disabled="raiseValue >= room.players[discordId]?.bank"
                  @mousedown="startAdjust(10)"
                  @mouseup="stopAdjust"
                  @mouseleave="stopAdjust"
                >
                  +
                </button>
                <p class="text-right" style="min-width: 50px; font-size: 0.6em; padding: 0">
                  {{ formatAmount(raiseValue) }}
                </p>
              </template>
            </v-slider>
            <v-btn
              color="primary"
              :disabled="raiseValue <= 0 || Object.values(room.players).find((p) => p.allin)"
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
  <toast v-if="toastStore.show" :key="toastStore.toastKey" />
</template>

<style scoped>
.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 12px;
}
</style>