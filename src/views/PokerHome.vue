<script>
/* global localStorage */
import flapi from '@/services/flapi.js'
import { getSocket } from '@/services/socket.js'
import { formatAmount } from '@/utils/format.js'
import { useFlopoToasts } from '@/composables/useFlopoToasts.js'
import CoinsCounter from '@/components/CoinsCounter.vue'
import HomeBtn from '@/components/HomeBtn.vue'

export default {
  components: { CoinsCounter, HomeBtn },

  setup() {
    return { ...useFlopoToasts() }
  },

  data() {
    return {
      socket: null,
      discordId: null,

      rooms: null,
      users: {},

      roomCreationDialog: false,
      roomMinBetExponent: 2,
      minExponent: 2,
      roomFakeMoney: false,
    }
  },

  computed: {
    userCoins() {
      if (this.roomFakeMoney) {
        return 100000
      }
      return this.users.find((u) => u.id === this.discordId)?.coins || 1000
    },
    maxExponent() {
      const maxValue = this.userCoins > 1000 ? this.userCoins : 1000
      return Math.floor(Math.log10(maxValue))
    },
    formattedRoomMinBet() {
      return Math.pow(10, this.roomMinBetExponent)
    },
  },

  async mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) this.$router.push('/')

    await this.getRooms()
    this.initSocket()
    await this.getUsers()

    this.roomFakeMoney = this.users.find((u) => u.id === this.discordId)?.coins ? false : true
  },

  beforeUnmount() {
    if (this.socket && this._onPokerUpdate) {
      this.socket.off('poker-update', this._onPokerUpdate)
    }
  },

  methods: {
    formatAmount,

    initSocket() {
      this.socket = getSocket()

      this._onPokerUpdate = async () => {
        await this.getRooms()
      }
      this.socket.on('poker-update', this._onPokerUpdate)
    },

    async createRoom() {
      try {
        const response = await flapi.post('/poker/create', {
          minBet: this.formattedRoomMinBet,
          fakeMoney: this.roomFakeMoney,
        })
        this.$router.push(`/poker/${response.data.roomId}`)
      } catch (e) {
        this.showErrorToast(e.response.data.message)
      }
    },

    async getRooms() {
      try {
        const response = await flapi.get('/poker')
        this.rooms = response.data.rooms
      } catch (e) {
        console.log(e)
      }
    },

    async getUsers() {
      try {
        const response = await flapi.get('/users')
        this.users = response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }

      try {
        const response = await flapi.get('/users/by-elo')
        this.usersByElo = response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },
  },
}
</script>

<template>
  <CoinsCounter />
  <v-layout class="w-100">
    <v-main class="d-flex w-100">
      <div class="w-100 mt-16">
        <h1 class="text-white mb-4" style="position: relative; width: fit-content">Flopoker</h1>

        <h2
          class="text-white d-flex justify-space-between align-center mt-8 mb-4"
          style="border-radius: 15px; background: #dddddd22; padding: 5px 5px 5px 0.6em"
        >
          Tables
          <v-btn
            class="text-none"
            text="Créer une table"
            variant="flat"
            color="primary"
            append-icon="mdi-plus"
            style="border-radius: 10px"
            @click="roomCreationDialog = true"
          ></v-btn>
        </h2>

        <v-dialog
          v-model="roomCreationDialog"
          class="modals"
          max-width="800"
          scroll-strategy="reposition"
        >
          <v-card class="modal-card" variant="tonal">
            <v-card-title class="text-white px-6 pt-4"> Créer une table </v-card-title>
            <v-card-text class="text-white">
              <p v-if="users.find((u) => u.id === discordId) && !roomFakeMoney" class="mb-4">
                Tu as actuellement {{ formatAmount(userCoins) }} FlopoCoins
                <span class="text-grey">({{ userCoins }})</span>
              </p>
              <p>Mise initiale</p>
              <v-slider
                v-model="roomMinBetExponent"
                :min="minExponent"
                :max="maxExponent"
                :step="1"
                hide-details
                color="primary"
                style="flex-grow: 6"
              >
                <template #append>
                  <p class="text-right" style="min-width: 110px; font-size: 1em; padding: 0">
                    {{ formatAmount(formattedRoomMinBet) }} <span class="text-grey">coins</span>
                  </p>
                </template>
              </v-slider>

              <v-alert class="mt-4" color="white" variant="tonal" rounded="xl">
                <template #prepend>
                  <v-checkbox
                    v-model="roomFakeMoney"
                    :disabled="!users.find((u) => u.id === discordId)"
                    color="primary"
                    label="Fake Money"
                    hide-details
                    @click="roomMinBetExponent = 2"
                  ></v-checkbox>
                </template>
                <template #text>
                  <p v-if="roomFakeMoney" class="px-2">
                    N'importe qui peut rejoindre.
                    <br />
                    Les FlopoCoins ne seront pas affectés.
                  </p>
                  <p v-else class="px-2">
                    Il faut assez de FlopoCoins pour rejoindre.
                    <br />
                    Tu peux perdre et gagner des FlopoCoins.
                  </p>
                </template>
              </v-alert>
            </v-card-text>
            <v-card-text class="d-flex justify-end">
              <v-btn
                class="text-none"
                color="primary"
                variant="flat"
                style="border-radius: 10px"
                @click="createRoom"
                @click.stop="roomCreationDialog = false"
              >
                {{
                  roomFakeMoney
                    ? 'Créer'
                    : 'Créer pour ' + formatAmount(formattedRoomMinBet) + ' FC'
                }}
              </v-btn>
            </v-card-text>
          </v-card>
        </v-dialog>

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
              <p v-if="!room.fakeMoney" style="float: right">
                <span class="text-grey" style="font-size: 0.75em">Prix d'entrée</span>
                {{ formatAmount(room.minBet) }}
              </p>
              <p v-else style="float: right">
                <span class="text-grey" style="font-size: 0.75em">Fake Money</span>
              </p>
            </v-card-title>
            <v-card-text class="d-flex justify-space-between pt-1 pb-1">
              <div
                style="
                  display: flex;
                  place-content: start;
                  gap: 0;
                  width: 100%;
                  overflow: hidden;
                  border-radius: 10px;
                "
              >
                <div
                  v-for="(player, index) in Object.values(room.players)"
                  :key="player.id + Date.now()"
                  :style="`transform: translateX(calc(-10px * ${index})); z-index: 1;`"
                >
                  <v-img
                    :src="player.avatar"
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
            <br />
            <span class="text-secondary font-weight-thin">Tu peux en créer une ^^</span>
          </p>
        </div>
      </div>
    </v-main>

    <home-btn />
  </v-layout>
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

.modals {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.modal-card {
  position: relative;
  margin-top: 10px;
  background: transparent !important;
  border-radius: 15px !important;
}
.modal-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 100%;
  background: radial-gradient(circle at -100% -200%, #5865f2, #181818 100%) !important;
  z-index: -1;
}
</style>
