<!-- Solitaire.vue -->
<template>
  <v-layout class="w-100 mt-16">
    <v-main class="d-flex w-100 mb-16 pb-16 mt-8" style="height: 130vh">
      <div class="w-100">
        <div
          class="text-white mb-4 d-flex flex-wrap w-100"
          style="position: relative; place-items: baseline; gap: 0.5em"
        >
          <div v-if="gameState?.isSOTD" class="d-flex mr-2" style="place-items: center; gap: 0.5em">
            <v-icon class="mdi mdi-trophy-outline mr-2" />
            <h1 style="font-size: 1.8rem" rounded="lg">Solitaire Of The Day</h1>
          </div>
          <div
            v-if="gameState && !gameState.isSOTD"
            class="d-flex mr-2"
            style="place-items: center; gap: 0.5em"
          >
            <v-icon class="mdi mdi-cards-spade mr-2" />
            <h1 style="font-size: 1.8rem" rounded="lg">Solitaire</h1>
            <p v-if="gameState?.hardMode" class="bg-error py-1 px-3 ml-2 mt-2 rounded-xl">
              Hard Mode
            </p>
          </div>
          <p v-if="!gameState || gameState?.isSOTD" class="font-weight-medium">{{ timeLeft() }}</p>
          <v-spacer></v-spacer>
          <v-btn
            v-if="gameState"
            class="text-none"
            prepend-icon="mdi-undo-variant"
            variant="tonal"
            color="gray"
            rounded="lg"
            @click="handleUndo"
            >Revenir en arrière</v-btn
          >
          <v-btn
            v-if="gameState"
            class="text-none"
            variant="flat"
            color="error"
            rounded="lg"
            @click="handleReset"
          >
            Abandonner
          </v-btn>
        </div>
        <div v-if="isLoading" class="loading-overlay">
          <div class="spinner">...</div>
        </div>
        <div v-if="gameState?.seed" class="seed-overlay">
          <div>Seed : {{ gameState.seed }}</div>
        </div>

        <div v-if="gameState" class="solitaire-board pb-16" :key="Date.now()">
          <div class="top-section">
            <div class="stock-and-waste">
              <Pile type="stock" :pile="gameState.stockPile" @stock-pile-clicked="handleDrawCard" />
              <Pile
                type="wastePile"
                :pile="gameState.wastePile"
                @drag-start-from-pile="handleDragStart"
                @auto-move-triggered="handleAutoMove"
              />
            </div>
            <div class="foundations">
              <Pile
                v-for="(pile, index) in gameState.foundationPiles"
                :key="'foundation-' + index"
                type="foundationPiles"
                :pile-index="index"
                :pile="pile"
                @drag-start-from-pile="handleDragStart"
                @drop-on-pile="handleDrop"
              />
            </div>
          </div>
          <div class="tableau-section">
            <Pile
              v-for="(pile, index) in gameState.tableauPiles"
              :key="'tableau-' + index"
              type="tableauPiles"
              :pile-index="index"
              :pile="pile"
              @drag-start-from-pile="handleDragStart"
              @drop-on-pile="handleDrop"
              @auto-move-triggered="handleAutoMove"
            />
          </div>
        </div>
        <div v-else>
          <v-alert variant="tonal" color="secondary" rounded="xl">
            <div class="menu" style="gap: 1em">
              <v-card
                class="d-flex flex-column"
                variant="text"
                color="white"
                style="flex-basis: 75%; gap: 1em"
              >
                <v-card-title>
                  <v-icon class="mdi mdi-trophy-outline" />
                  Solitaire Of The Day
                </v-card-title>
                <v-card-text>
                  <p>
                    Jouer un tableau commun à tout le monde généré chaque jour, pour tenter de
                    gagner des FlopoCoins et apparaître dans le classement.
                  </p>
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    class="buy-btn"
                    block
                    variant="flat"
                    color="primary"
                    rounded="lg"
                    @click="handleRestartSotd"
                  >
                    Jouer
                  </v-btn>
                </v-card-actions>
              </v-card>
              <v-divider vertical class="d-none d-sm-flex" />
              <v-divider class="d-flex d-sm-none" />
              <v-card
                class="d-flex flex-column"
                variant="text"
                color="white"
                style="flex-basis: 50%; gap: 1em"
              >
                <v-card-title>
                  <v-icon class="mdi mdi-cards-spade" />
                  Solitaire
                </v-card-title>
                <v-card-text class="pb-0 mb-0">
                  <p>Jouer un tableau aléatoire de Solitaire.</p>
                  <div class="d-flex" style="place-items: center; place-content: start; gap: 1rem">
                    <v-switch v-model="hardMode" color="primary" inset hide-details>
                      <template #prepend> Facile </template>
                      <template #label>
                        <p>Difficile</p>
                      </template>
                    </v-switch>
                    <v-icon
                      class="mdi mdi-information-outline mt-1"
                      title="Piochez 3 cartes à la fois en mode difficile"
                    ></v-icon>
                  </div>
                </v-card-text>
                <v-card-actions>
                  <v-btn-group
                    color="primary"
                    variant="flat"
                    class="w-100"
                    density="compact"
                    rounded="lg"
                    divided
                  >
                    <v-btn class="w-66" @click="userSeed = null" @click.stop="handleRestart">
                      Jouer
                    </v-btn>
                    <v-btn class="w-33" @click="seedChoiceDialog = true"> Seed </v-btn>
                  </v-btn-group>
                </v-card-actions>
              </v-card>
            </div>
          </v-alert>
        </div>

        <div v-if="!gameState" class="my-16">
          <v-alert variant="tonal" color="secondary" rounded="xl">
            <v-card variant="text" color="secondary" rounded="xl">
              <v-card-title class="text-white">
                Classement SOTD {{ new Date().toLocaleDateString() }}
              </v-card-title>
              <v-card-subtitle>
                Le premier du classement recevra 1000 FlopoCoins à la fin de chaque journée (en plus
                des 1000 gagnés lors de la première complétion).
              </v-card-subtitle>
              <v-card-text>
                <v-row v-if="rankings && rankings.length > 0" class="text-secondary">
                  <v-col cols="6" class="text-right"> Pts </v-col>
                  <v-col cols="3" class="text-right"> Coups </v-col>
                  <v-col cols="3" class="text-right"> Temps </v-col>
                </v-row>

                <v-row
                  v-for="(stats, index) in rankings"
                  :key="stats.id"
                  class="text-white font-weight-bolder"
                  style="border-radius: 10px"
                  :style="
                    stats.user_id === userId
                      ? 'background: radial-gradient(circle at -100% -300%,#5865f2,transparent 100%)'
                      : ''
                  "
                >
                  <v-col
                    cols="3"
                    style="
                      display: flex;
                      width: 25%;
                      overflow: hidden;
                      text-wrap: nowrap;
                      text-overflow: ellipsis;
                      gap: 0.7em;
                      align-items: center;
                    "
                    :title="'@' + stats.globalName"
                  >
                    <v-img
                      :src="avatars[stats.id]"
                      color="transparent"
                      style="border-radius: 50%; min-width: 30px; max-width: 30px; height: 30px"
                    />
                    <p>@{{ stats.globalName }}</p>
                  </v-col>
                  <v-col cols="3" class="d-flex align-center justify-end">
                    {{ stats.score }}
                  </v-col>
                  <v-col cols="3" class="d-flex align-center justify-end">
                    {{ stats.moves }}
                  </v-col>
                  <v-col cols="3" class="d-flex align-center justify-end">
                    {{ formatFinishTime(stats.time) }}
                  </v-col>
                </v-row>

                <v-row
                  v-if="!rankings || rankings.length === 0"
                  class="mt-4 mb-1 text-white font-weight-bolder"
                >
                  <v-col
                    cols="12"
                    style="
                      width: 25%;
                      overflow: hidden;
                      text-wrap: nowrap;
                      text-overflow: ellipsis;
                      text-align: center;
                    "
                    title="@cassoule"
                  >
                    Personne n'a complété le SOTD aujourd'hui
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-alert>
        </div>

        <div
          v-if="gameState"
          :key="Date.now() + '-stats'"
          style="position: fixed; bottom: 1em; left: 1em"
        >
          <v-card
            variant="tonal"
            rounded="xl"
            style="backdrop-filter: blur(100px); --webkit-backdrop-filter: blur(100px)"
          >
            <v-card-text class="d-flex py-1" style="gap: 2rem">
              <p>{{ gameState.score }} points</p>
              <p>{{ gameState.moves }} coups</p>
            </v-card-text>
          </v-card>
        </div>
      </div>

      <v-dialog v-model="seedChoiceDialog" class="modals" max-width="400">
        <v-card variant="flat" color="secondary" class="rounded-xl modal-card">
          <v-card-item class="text-white">
            <h2>Génération avec seed</h2>
          </v-card-item>
          <v-card-text class="text-white">
            <v-text-field
              v-model="userSeed"
              variant="outlined"
              rounded="lg"
              density="comfortable"
              label="Entrer un seed"
              clearable
            />
            <v-btn
              variant="flat"
              block
              color="primary"
              class="rounded-lg"
              @click="handleRestart"
              @click.stop="seedChoiceDialog = false"
            >
              Jouer
            </v-btn>
          </v-card-text>
        </v-card>
      </v-dialog>

      <v-dialog v-model="winDialog" class="modals" max-width="400" persistent>
        <v-card variant="flat" color="secondary" class="rounded-xl modal-card">
          <v-card-item class="text-white">
            <h2>{{ !gameState?.isSOTD ? 'Bravo !' : 'Tu as complété le SOTD !' }}</h2>
          </v-card-item>
          <v-card-subtitle class="px-6 text-secondary">
            Seed : {{ gameState?.seed }}
          </v-card-subtitle>
          <v-card-text class="text-secondary">
            <v-alert variant="tonal" color="white" class="rounded-xl mb-4">
              <v-alert-title>Statistiques</v-alert-title>
              <v-card-text class="px-0 pb-2">
                <div class="d-flex justify-space-between flex-wrap" style="gap: 1em">
                  <h3>{{ gameState?.moves }} coups</h3>
                  <h3>{{ gameState?.score }} points</h3>
                </div>
              </v-card-text>
            </v-alert>
            <p v-if="gameState?.isSOTD">Tu as validé une partie du SOTD.</p>
            <p v-if="gameState?.isSOTD">
              S'il s'agit de ta meilleure partie aujourd'hui tu peux la retrouver dans le
              classement.
            </p>
          </v-card-text>
          <v-card-text class="text-white d-flex">
            <v-spacer></v-spacer>
            <v-btn
              variant="flat"
              color="primary"
              class="rounded-lg"
              @click="handleReset"
              @click.stop="winDialog = false"
            >
              Quitter
            </v-btn>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-main>

    <v-btn
      class="back-btn text-none"
      text="Retour"
      variant="tonal"
      color="#ddd"
      @click="gameState ? (gameState = null) : $router.push('/dashboard')"
    ></v-btn>
  </v-layout>
</template>

<script>
import Pile from '../components/solitaire/Pile.vue'
import api from '../services/api'
import axios from 'axios'
import { getAllCardImagePaths } from '../utils/cardImages.js'
import { io } from 'socket.io-client'

function getRankValue(rank) {
  if (rank === 'A') return 1
  if (rank === 'T') return 10
  if (rank === 'J') return 11
  if (rank === 'Q') return 12
  if (rank === 'K') return 13
  return parseInt(rank, 10)
}

function getCardColor(suit) {
  return suit === 'h' || suit === 'd' ? 'red' : 'black'
}

export default {
  name: 'Solitaire',
  components: {
    Pile,
  },
  data() {
    return {
      gameState: null,
      draggedCardSourceInfo: null,
      userId: null,
      isLoading: false,
      now: Date.now(),

      hardMode: false,

      seedChoiceDialog: false,
      winDialog: false,

      userSeed: null,
      rankings: null,

      avatars: {},
    }
  },
  async mounted() {
    // Fetch the initial game state when the component is created
    try {
      this.userId = localStorage.getItem('discordId')
      if (!this.userId) this.$router.push('/')

      this.initSocket()
      this.isLoading = true
      await this.preloadImages()
      await this.getRankings()
      await this.fetchGameState(this.userId)
      this.isLoading = false
      this.fetchAvatars()
      if (this.gameState?.isDone) {
        this.winDialog = true
      }
    } catch (error) {
      console.error('Failed to load game state:', error)
      if (!this.userId) this.$router.push('/')
    }
  },
  methods: {
    initSocket() {
      this.socket = io(import.meta.env.VITE_FLAPI_URL.replace('/api', ''), {
        withCredentials: false,
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
      })

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server')
      })

      this.socket.on('solitaire:update', (payload) => {
        if (payload?.userId === this.userId) {
          let i = 0;
          const interval = setInterval(() => {
            const move = payload.moves[i];
            this.processMove(move);
            i++;
            if (i >= payload.moves.length) {
              clearInterval(interval); // stop when done
            }
          }, 100);
        }
      })
    },
    formatFinishTime(startAt, endAt = null) {
      const start = new Date(startAt)
      const end = endAt ? new Date(endAt) : new Date()

      let remainder = endAt ? end - start : start

      const hours = Math.floor(remainder / 3600000)
      remainder %= 3600000

      const minutes = Math.floor(remainder / 60000)
      remainder %= 60000

      const seconds = Math.floor(remainder / 1000)
      const milliseconds = remainder % 1000

      const paddedHours = String(hours).padStart(2, '0')
      const paddedMinutes = String(minutes).padStart(2, '0')
      const paddedSeconds = String(seconds).padStart(2, '0')
      const paddedMilliseconds = String(milliseconds).padStart(3, '0')

      return `${hours > 0 ? paddedHours + ':' : ''}${paddedMinutes}:${paddedSeconds}.${paddedMilliseconds}`
    },
    timeLeft() {
      const endOfDay = new Date(this.now)
      endOfDay.setHours(24, 0, 0, 0)

      const ms = endOfDay - this.now

      const totalSeconds = Math.floor(ms / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)

      return `Temps restant : ${hours}h ${minutes}m`
    },

    async getRankings() {
      try {
        const response = await api.getRankings()
        this.rankings = response.data.rankings
      } catch (error) {
        console.error('Failed to fetch rankings:', error)
      }
    },

    fetchAvatars() {
      this.rankings.forEach(async (stats) => {
        this.avatars[stats.id] = await this.getAvatar(stats.id)
      })
    },

    async getAvatar(id) {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + id + '/avatar'
      try {
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

    async handleRestart() {
      await this.getRankings()
      try {
        const response = await api.startNewGame(this.userId, this.userSeed, this.hardMode)
        this.gameState = response.data.gameState
      } catch (error) {
        console.error('Failed to start new game:', error)
      }
    },

    async handleRestartSotd() {
      await this.getRankings()
      try {
        const response = await api.startSOTD(this.userId)
        this.gameState = response.data.gameState
      } catch (error) {
        console.error('Failed to start new game:', error)
      }
    },

    async handleReset() {
      await this.getRankings()
      try {
        const response = await api.resetGame(this.userId)
        this.gameState = null
      } catch (error) {
        console.error('Failed to reset game:', error)
      }
    },

    async fetchGameState() {
      try {
        const response = await api.getGameState(this.userId)
        this.gameState = response?.data?.gameState
      } catch (error) {
        console.error('Failed to load game state:', error)
      }
    },

    // Called when a drag operation starts from any valid pile.
    // The 'sourceInfo' object is now fully detailed.
    handleDragStart(sourceInfo) {
      if (this.isLoading) return
      this.draggedCardSourceInfo = sourceInfo
    },

    // Called when a card is dropped onto a valid destination pile.
    async handleDrop(destinationInfo) {
      if (!this.draggedCardSourceInfo || this.isLoading) return

      this.isLoading = true

      const oldState = JSON.parse(JSON.stringify(this.gameState))

      // Combine the stored source info and the new destination info.
      const movePayload = {
        userId: this.userId,
        ...this.draggedCardSourceInfo,
        ...destinationInfo,
      }

      this.performLocalMove(movePayload)
      this.draggedCardSourceInfo = null

      try {
        const response = await api.moveCard(movePayload)
        this.gameState.score = response.data.gameState.score
        this.gameState.moves = response.data.gameState.moves

        if (response.data.win && !this.oldState?.isDone) {
          this.gameState.endTime = response.data.endTime
          this.winDialog = true
        }
      } catch (error) {
        // The backend correctly identifies invalid moves now.
        console.warn('Invalid move:', error.response.data.error)
        this.gameState = oldState
      } finally {
        this.isLoading = false
      }
    },

    async handleAutoMove(sourceInfo) {
      if (this.isLoading) return

      // Find a valid foundation pile destination for the clicked card
      const destinationInfo = this.findBestAutoMove(sourceInfo)

      // If a valid destination was found, process it
      if (destinationInfo) {
        const movePayload = { ...sourceInfo, ...destinationInfo }
        await this.processMove(movePayload)
      }
    },

    async processMove(movePayload) {
      this.isLoading = true
      const oldState = JSON.parse(JSON.stringify(this.gameState))

      this.performLocalMove(movePayload)

      try {
        const response = await api.moveCard({ userId: this.userId, ...movePayload })
        this.gameState.score = response.data.gameState.score
        this.gameState.moves = response.data.gameState.moves
        // On success, our optimistic state is correct. We do nothing.
        if (response.data.win && !this.oldState?.isDone) {
          this.gameState.endTime = response.data.endTime
          this.winDialog = true
        }
      } catch (error) {
        console.warn('Invalid move detected by server. Reverting UI.')
        this.gameState = oldState // Roll back on error
      } finally {
        this.isLoading = false
      }
    },

    async handleUndo() {
      this.isLoading = true
      const oldState = JSON.parse(JSON.stringify(this.gameState))

      try {
        const response = await api.undoMove(this.userId)
        this.gameState = { ...response.data.gameState }
        this.isLoading = false
      } catch (error) {
        console.error('Failed to undo move:', error)
        this.gameState = oldState
        this.isLoading = false
      }
    },

    performLocalMove(moveData) {
      const { sourcePileType, sourcePileIndex, sourceCardIndex, destPileType, destPileIndex } =
        moveData

      let sourcePile
      if (sourcePileType === 'tableauPiles') {
        sourcePile = this.gameState.tableauPiles[sourcePileIndex]
      } else if (sourcePileType === 'wastePile') {
        sourcePile = this.gameState.wastePile
      } else if (sourcePileType === 'foundationPiles') {
        sourcePile = this.gameState.foundationPiles[sourcePileIndex]
      }

      const destPile =
        destPileType === 'tableauPiles'
          ? this.gameState.tableauPiles[destPileIndex]
          : this.gameState.foundationPiles[destPileIndex]

      if (!sourcePile || !destPile) return

      const cardsToMove = sourcePile.splice(sourceCardIndex)
      destPile.push(...cardsToMove)

      if (sourcePileType === 'tableauPiles' && sourcePile.length > 0) {
        sourcePile[sourcePile.length - 1].faceUp = true
      }
    },

    async handleDrawCard() {
      const oldState = JSON.parse(JSON.stringify(this.gameState))

      /*if (this.gameState.stockPile.length > 0) {
        const card = this.gameState.stockPile.pop();
        card.faceUp = true;
        this.gameState.wastePile.push(card);
      } else {
        this.gameState.stockPile = this.gameState.wastePile.reverse();
        this.gameState.stockPile.forEach(c => c.faceUp = false);
        this.gameState.wastePile = [];
      }*/

      try {
        this.isLoading = true
        const response = await api.drawCard(this.userId)
        this.gameState = { ...response.data.gameState }
        this.isLoading = false
        await this.fetchGameState()
      } catch (error) {
        console.error('Failed to draw card:', error)
        this.gameState = oldState
      }
    },

    findBestAutoMove(sourceInfo) {
      const { sourcePileType, sourcePileIndex, sourceCardIndex } = sourceInfo

      let sourcePile =
        sourcePileType === 'tableauPiles'
          ? this.gameState.tableauPiles[sourcePileIndex]
          : this.gameState.wastePile

      // Can only auto-move the top card of a stack
      /*if (sourceCardIndex !== sourcePile.length - 1) {
        return null
      }*/

      const sourceCard = sourcePile[sourceCardIndex]

      if (sourcePileType === 'wastePile') {
        if (sourceCardIndex !== sourcePile.length - 1) {
          return
        }
      }

      if (sourceCardIndex === sourcePile.length - 1) {
        for (let i = 0; i < this.gameState.foundationPiles.length; i++) {
          const foundationPile = this.gameState.foundationPiles[i]
          const topCard =
            foundationPile.length > 0 ? foundationPile[foundationPile.length - 1] : null

          // Rule for moving to an empty foundation (must be an Ace)
          if (!topCard) {
            if (sourceCard.rank === 'A') {
              return { destPileType: 'foundationPiles', destPileIndex: i }
            }
          }
          // Rule for moving to a non-empty foundation
          else {
            if (
              sourceCard.suit === topCard.suit &&
              getRankValue(sourceCard.rank) - getRankValue(topCard.rank) === 1
            ) {
              return { destPileType: 'foundationPiles', destPileIndex: i }
            }
          }
        }
      }

      for (let i = 0; i < this.gameState.tableauPiles.length; i++) {
        // If the source is a tableau pile, you can't move it to itself.
        if (sourcePileType === 'tableauPiles' && sourcePileIndex === i) {
          continue
        }

        const destPile = this.gameState.tableauPiles[i]
        const topCard = destPile.length > 0 ? destPile[destPile.length - 1] : null

        if (!topCard) {
          // Moving a King to an empty tableau pile
          if (sourceCard.rank === 'K') {
            return { destPileType: 'tableauPiles', destPileIndex: i }
          }
        } else {
          // Moving to a non-empty tableau pile
          const sourceColor = getCardColor(sourceCard.suit)
          const destColor = getCardColor(topCard.suit)
          const sourceValue = getRankValue(sourceCard.rank)
          const destValue = getRankValue(topCard.rank)

          if (sourceColor !== destColor && destValue - sourceValue === 1) {
            return { destPileType: 'tableauPiles', destPileIndex: i }
          }
        }
      }

      // Loop through all foundation piles to find a valid spot

      // If no valid move was found after checking all piles
      return null
    },

    async preloadImages() {
      const imagePaths = getAllCardImagePaths()
      const promises = imagePaths.map((imagePath) => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.src = imagePath
          img.onload = () => resolve()
          img.onerror = () => {
            console.warn('Failed to load image:', imagePath)
            resolve()
          }
        })
      })
      await Promise.all(promises)
      console.log('All cards preloaded')
    },
  },
}
</script>

<style scoped>
/* Add your CSS for the board layout here */
.solitaire-board {
  padding: 20px;
  border-radius: 10px;
}
.top-section,
.tableau-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
.top-section {
  flex-wrap: wrap;
  gap: 1em;
}
.stock-and-waste,
.foundations,
.tableau-section {
  display: flex;
  gap: 7px;
}
.foundations {
  margin-left: 50px;
}
.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 12px;
}
.loading-overlay {
  position: absolute;
  bottom: 0;
}
.seed-overlay {
  position: fixed;
  bottom: 0;
  right: 0.5rem;
}

.buy-btn {
  z-index: 1;
  border-radius: 10px !important;
  background:
    radial-gradient(
      ellipse farthest-corner at right bottom,
      #fedb37 0%,
      #fdb931 8%,
      #9f7928 30%,
      #8a6e2f 40%,
      transparent 200%
    ),
    radial-gradient(
      ellipse farthest-corner at left top,
      #ffffff 0%,
      #ffffac 8%,
      #d1b464 25%,
      #5d4a1f 62.5%,
      #5d4a1f 100%
    );
  transition:
    0.3s ease-in-out,
    0.6s ease-in-out box-shadow;
  box-shadow: 0 0 0 0 transparent;
}

.menu {
  display: flex;
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

@media (max-width: 600px) {
  .menu {
    flex-direction: column;
  }
}
</style>