<template>
  <CoinsCounter v-if="userId" />
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
            v-if="isAutoSolvable || isAutoSolving"
            class="text-none auto-solve-btn"
            prepend-icon="mdi-auto-fix"
            variant="flat"
            color="success"
            rounded="lg"
            :loading="isAutoSolving"
            :disabled="isAutoSolving"
            @click="handleAutoSolve"
          >
            Terminer la partie
          </v-btn>
          <v-btn
            v-if="gameState"
            class="text-none"
            prepend-icon="mdi-undo-variant"
            variant="tonal"
            color="gray"
            rounded="lg"
            :disabled="isAutoSolving"
            @click="handleUndo"
            >Revenir en arrière</v-btn
          >
          <v-btn
            v-if="gameState"
            class="text-none"
            variant="flat"
            color="error"
            rounded="lg"
            :disabled="isAutoSolving"
            @click="handleReset"
          >
            Abandonner
          </v-btn>
        </div>
        <div v-if="isLoading" class="loading-overlay">
          <v-progress-circular
            size="20"
            :width="10"
            color="primary"
            indeterminate
          ></v-progress-circular>
        </div>
        <div v-if="gameState?.seed" class="seed-overlay">
          <div style="font-size: 0.6em">Seed : {{ gameState.seed }}</div>
        </div>

        <div v-if="gameState" class="solitaire-board pb-16">
          <div class="top-section">
            <div class="stock-and-waste">
              <Pile type="stock" :pile="gameState.stockPile" @stock-pile-clicked="handleDrawCard" />
              <Pile
                type="wastePile"
                :pile="gameState.wastePile"
                :animating-keys="animatingCards"
                @drag-start-from-pile="handleDragStart"
                @auto-move-triggered="handleAutoMove"
              />
            </div>
            <div class="foundations">
              <Pile
                v-for="(pile, index) in gameState.foundationPiles"
                :key="'foundation-' + index"
                :data-foundation="index"
                type="foundationPiles"
                :pile-index="index"
                :pile="pile"
                :animating-keys="animatingCards"
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
              :animating-keys="animatingCards"
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
                Le premier du classement recevra 2500 Flopos, 1500 pour le 2e, 750 pour le 3e, à la
                fin de chaque journée (en plus des 1000 gagnés lors de la première complétion).
              </v-card-subtitle>
              <v-card-text>
                <v-row v-if="rankings && rankings.length > 0" class="text-secondary">
                  <v-col cols="6" class="text-right"> Pts </v-col>
                  <v-col cols="3" class="text-right"> Coups </v-col>
                  <v-col cols="3" class="text-right"> Temps </v-col>
                </v-row>

                <v-row
                  v-for="stats in rankings"
                  :key="stats.id"
                  class="text-white font-weight-bolder"
                  style="border-radius: 10px"
                  :style="
                    stats.userId === userId
                      ? 'background: radial-gradient(circle at -100% -300%,#5865f2,transparent 100%)'
                      : ''
                  "
                >
                  <v-col
                    cols="12"
                    sm="3"
                    class=""
                    style="
                      display: flex;
                      overflow: hidden;
                      text-wrap: nowrap;
                      text-overflow: ellipsis;
                      gap: 0.7em;
                      align-items: center;
                    "
                    :title="'@' + stats.user.username"
                  >
                    <v-img
                      :src="stats.user.avatarUrl"
                      color="transparent"
                      style="border-radius: 50%; min-width: 30px; max-width: 30px; height: 30px"
                    />
                    <p>@{{ stats.user.username }}</p>
                  </v-col>
                  <v-col cols="12" sm="0" order-sm="12" class="py-0 d-sm-none">
                    <v-divider
                      color="#ddd"
                      opacity=".3"
                      class="mx-1"
                      thickness="2"
                      style="border-radius: 50px"
                    ></v-divider>
                  </v-col>
                  <v-col cols="3" offset="3" offset-sm="0" class="d-flex align-center justify-end">
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
                    class="d-flex flex-column justify-center align-center ga-6"
                    style="
                      width: 25%;
                      overflow: hidden;
                      text-wrap: nowrap;
                      text-overflow: ellipsis;
                      text-align: center;
                    "
                  >
                    Personne n'a complété le SOTD aujourd'hui
                    <v-card-text
                      v-if="!resetVotes.locked && !isLoading"
                      class="py-0 text-secondary"
                      style="font-size: 1em"
                    >
                      <div class="d-flex flex-column align-center" style="gap: 1.2em">
                        <v-btn
                          size="small"
                          variant="flat"
                          color="error"
                          rounded="lg"
                          class="text-none"
                          :disabled="resetVotes.hasVoted || resetVoteLoading"
                          :loading="resetVoteLoading"
                          @click="handleVoteReset"
                        >
                          {{ resetVotes.hasVoted ? 'Vote envoyé' : 'Voter pour réinitialiser' }}
                        </v-btn>
                        <span>
                          {{ resetVotes.count }}/{{ resetVotes.threshold }}
                          <span
                            class="d-none d-sm-inline"
                            style="opacity: 0.7"
                            title="Si le tableau du jour est injouable"
                          >
                            (mélange impossible)
                          </span>
                        </span>
                      </div>
                    </v-card-text>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-alert>
        </div>

        <div v-if="gameState" style="position: fixed; bottom: 1em; left: 1em">
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

        <!-- Flying cards: animate moves to foundations, auto-moves, and draws -->
        <div v-if="flyingCards.length" class="flying-layer">
          <div
            v-for="f in flyingCards"
            :key="f.id"
            class="flying-card"
            :style="{
              width: f.w + 'px',
              height: f.h + 'px',
              transform: `translate(${f.x}px, ${f.y}px)`,
            }"
          >
            <div v-if="f.flip" class="flying-flip" :class="{ flipped: f.flipped }">
              <img class="flying-face back" src="/cards/webp/card_back.webp" alt="" />
              <img class="flying-face front" :src="`/cards/webp/${f.rank}${f.suit}.webp`" alt="" />
            </div>
            <img
              v-else
              class="flying-face-single"
              :src="`/cards/webp/${f.rank}${f.suit}.webp`"
              alt=""
            />
          </div>
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

      <RegisterWelcomeModal
        v-model="welcomeDialog"
        :anon-username="userName"
        @quit="closeWelcomeAndShowStats"
        @register="closeWelcomeAndShowStats"
      />

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

      <SaveScoreDialog
        v-if="guestDialog"
        :visible="guestDialog"
        game="solitaire"
        :submission-token="pendingSubmissionToken"
        :finish-time="finishTime"
        :moves="gameState?.moves"
        :score="gameState?.score"
        :is-s-o-t-d="gameState?.isSOTD"
        :seed="gameState?.seed"
        @close="guestDialog = false"
      />

      <v-snackbar
        v-model="resetSnackbar"
        :timeout="2000"
        color="primary"
        rounded="xl"
        location="top"
        closable
      >
        <v-icon class="mdi mdi-restart mr-2" />
        Le SOTD a été reset par vote.
        <template #actions>
          <v-btn size="small" icon variant="text" @click="resetSnackbar = false">
            <v-icon class="mdi mdi-close" />
          </v-btn>
        </template>
      </v-snackbar>
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
/* global localStorage, setTimeout, requestAnimationFrame */
import Pile from '../components/solitaire/Pile.vue'
import api from '../services/api'
import { getSocket } from '@/services/socket.js'
import CoinsCounter from '../components/CoinsCounter.vue'
import SaveScoreDialog from '../components/SaveScoreDialog.vue'
import RegisterWelcomeModal from '../components/dashboard/RegisterWelcomeModal.vue'

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
    CoinsCounter,
    SaveScoreDialog,
    RegisterWelcomeModal,
  },
  data() {
    return {
      gameState: null,
      draggedCardSourceInfo: null,
      userId: null,
      isLoading: false,
      now: Date.now(),

      // Guest support
      gameId: null,

      hardMode: false,

      seedChoiceDialog: false,
      winDialog: false,
      welcomeDialog: false,

      userSeed: null,
      rankings: null,

      resetVotes: { count: 0, threshold: 3, hasVoted: false, locked: false },
      resetVoteLoading: false,
      resetSnackbar: false,

      isNewUser: false,

      // Guest save support
      guestDialog: false,
      pendingSubmissionToken: null,
      finishTime: 0,

      // Flying-card animations (auto-complete, auto-move, draw)
      isAutoSolving: false,
      flyingCards: [],
      animatingCards: {},
    }
  },
  computed: {
    userName() {
      return localStorage.getItem('discordUsername') || 'joueur'
    },
    // The board can be finished automatically once every tableau card is face-up
    // and the stock + waste are empty — Klondike is guaranteed winnable from here.
    isAutoSolvable() {
      const gs = this.gameState
      if (!gs || gs.isDone) return false
      if (!gs.stockPile || !gs.wastePile || !gs.tableauPiles || !gs.foundationPiles) return false
      if (gs.stockPile.length > 0 || gs.wastePile.length > 0) return false

      const allFaceUp = gs.tableauPiles.every((pile) => pile.every((card) => card.faceUp))
      if (!allFaceUp) return false

      const foundationCount = gs.foundationPiles.reduce((acc, pile) => acc + pile.length, 0)
      return foundationCount < 52
    },
  },
  created() {
    this.syncQueue = Promise.resolve()
    this.undoStack = []
    this.syncGeneration = 0
    this.flyingIdSeq = 0
  },
  async mounted() {
    try {
      this.userId = localStorage.getItem('discordId')

      this.initSocket()
      this.isLoading = true
      await this.getRankings()
      await this.fetchResetVotes()
      if (this.userId) {
        await this.fetchGameState(this.userId)
        await this.claimPendingSubmission()
      }
      this.isLoading = false
      if (this.gameState?.isDone) {
        this.winDialog = true
      }
    } catch (error) {
      console.error('Failed to load game state:', error)
    }
  },
  beforeUnmount() {
    if (this.socket) {
      if (this._onSolitaireUpdate) this.socket.off('solitaire:update', this._onSolitaireUpdate)
      if (this._onSotdResetVoteUpdate)
        this.socket.off('sotd-reset-vote-update', this._onSotdResetVoteUpdate)
      if (this._onSotdReset) this.socket.off('sotd-reset', this._onSotdReset)
    }
  },
  methods: {
    async claimPendingSubmission() {
      const stored = localStorage.getItem('solitairePendingSubmission')
      if (!stored || !this.userId) return
      try {
        const data = JSON.parse(stored)
        const response = await api.claimSolitaireSubmission(data.token)
        console.log('Pending submission claimed:', response.data)
        this.finishTime = response.data.time
        this.isNewUser = response.data.isNewUser || false

        // Création du faux gameState avec les piles vides pour éviter le crash
        this.gameState = {
          moves: response.data.moves,
          score: response.data.score,
          isSOTD: data.isSOTD ?? false,
          seed: data.seed ?? null,
          stockPile: [],
          wastePile: [],
          foundationPiles: [],
          tableauPiles: [],
          isDone: true,
        }

        if (this.isNewUser) {
          this.welcomeDialog = true
        } else {
          this.winDialog = true
        }
        localStorage.removeItem('solitairePendingSubmission')
      } catch (error) {
        console.error('Failed to claim pending submission:', error)
        localStorage.removeItem('solitairePendingSubmission')
      }
    },

    initSocket() {
      this.socket = getSocket()

      this._onSolitaireUpdate = (payload) => {
        if (payload?.userId === this.userId && this.userId) {
          this.gameState = null
          this.gameId = null
          this.undoStack = []
          this.getRankings()
        }
      }
      this.socket.on('solitaire:update', this._onSolitaireUpdate)

      this._onSotdResetVoteUpdate = (payload) => {
        this.resetVotes = {
          ...this.resetVotes,
          count: payload.count,
          threshold: payload.threshold,
          locked: payload.locked,
        }
      }
      this.socket.on('sotd-reset-vote-update', this._onSotdResetVoteUpdate)

      this._onSotdReset = () => {
        this.resetVotes = {
          count: 0,
          threshold: this.resetVotes.threshold,
          hasVoted: false,
          locked: false,
        }
        this.resetSnackbar = true
        this.getRankings()
      }
      this.socket.on('sotd-reset', this._onSotdReset)
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

      return `${hours > 0 ? paddedHours + ':' : ''}${paddedMinutes}:${paddedSeconds}.${paddedMilliseconds[0]}`
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

    async fetchResetVotes() {
      try {
        const response = await api.getSotdResetVotes()
        this.resetVotes = response.data
      } catch (error) {
        console.error('Failed to fetch SOTD reset votes:', error)
      }
    },

    async handleVoteReset() {
      if (this.resetVoteLoading || this.resetVotes.hasVoted || this.resetVotes.locked) return
      this.resetVoteLoading = true
      try {
        const response = await api.voteSotdReset()
        if (response.data.reset) {
          this.resetVotes = {
            count: 0,
            threshold: response.data.threshold,
            hasVoted: false,
            locked: false,
          }
          this.resetSnackbar = true
          await this.getRankings()
        } else {
          this.resetVotes = {
            count: response.data.count,
            threshold: response.data.threshold,
            hasVoted: true,
            locked: false,
          }
        }
      } catch (error) {
        console.error('Failed to vote to reset SOTD:', error)
      } finally {
        this.resetVoteLoading = false
      }
    },

    async handleRestart() {
      this.clearAnimations()
      this.undoStack = []
      await this.getRankings()
      try {
        const response = await api.startNewGame(this.userSeed, this.hardMode)
        this.gameState = response.data.gameState
        this.gameId = response.data.gameId || null
        this.pendingSubmissionToken = null
        this.isNewUser = false
      } catch (error) {
        console.error('Failed to start new game:', error)
      }
    },

    async handleRestartSotd() {
      this.clearAnimations()
      this.undoStack = []
      await this.getRankings()
      try {
        const response = await api.startSOTD()
        this.gameState = response.data.gameState
        this.gameId = response.data.gameId || null
        this.pendingSubmissionToken = null
        this.isNewUser = false
      } catch (error) {
        console.error('Failed to start new game:', error)
      }
    },

    async handleReset() {
      this.clearAnimations()
      this.undoStack = []
      await this.getRankings()
      try {
        await api.resetGame(this.gameId)
        this.gameState = null
        this.gameId = null
        this.pendingSubmissionToken = null
        this.isNewUser = false
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

    handleDragStart(sourceInfo) {
      if (this.isAutoSolving) return
      this.draggedCardSourceInfo = sourceInfo
    },

    enqueueSync(fn) {
      const generation = this.syncGeneration
      this.syncQueue = this.syncQueue.then(async () => {
        // A reconcile invalidated everything queued before it.
        if (generation !== this.syncGeneration) return
        try {
          await fn()
        } catch (error) {
          await this.handleDesync(error)
        }
      })
    },

    snapshot() {
      this.undoStack.push(JSON.parse(JSON.stringify(this.gameState)))
    },

    async handleDesync(error) {
      this.syncGeneration++
      this.undoStack = []
      this.clearAnimations()
      console.warn(
        'Solitaire desync, reconciling with server:',
        error?.response?.data?.error || error?.message,
      )
      try {
        const serverState = error?.response?.data?.gameState
        if (serverState) {
          this.gameState = serverState
        } else if (this.userId) {
          const response = await api.getGameState(this.userId)
          if (response?.data?.gameState) this.gameState = response.data.gameState
        }
      } catch (e) {
        console.error('Failed to reconcile solitaire state:', e)
      }
    },

    isMoveLegal(moveData) {
      if (!this.gameState) return false
      const { sourcePileType, sourcePileIndex, sourceCardIndex, destPileType, destPileIndex } =
        moveData

      let sourcePile
      if (sourcePileType === 'tableauPiles')
        sourcePile = this.gameState.tableauPiles[sourcePileIndex]
      else if (sourcePileType === 'wastePile') sourcePile = this.gameState.wastePile
      else if (sourcePileType === 'foundationPiles')
        sourcePile = this.gameState.foundationPiles[sourcePileIndex]
      else return false

      const sourceCard = sourcePile?.[sourceCardIndex]
      if (!sourceCard || !sourceCard.faceUp) return false

      if (destPileType === 'tableauPiles') {
        const destinationPile = this.gameState.tableauPiles[destPileIndex]
        const topCard = destinationPile[destinationPile.length - 1]
        if (!topCard) return sourceCard.rank === 'K'
        return (
          getCardColor(sourceCard.suit) !== getCardColor(topCard.suit) &&
          getRankValue(topCard.rank) - getRankValue(sourceCard.rank) === 1
        )
      }

      if (destPileType === 'foundationPiles') {
        // Only a single card may go to a foundation.
        if (sourcePile.slice(sourceCardIndex).length > 1) return false
        const destinationPile = this.gameState.foundationPiles[destPileIndex]
        const topCard = destinationPile[destinationPile.length - 1]
        if (!topCard) return sourceCard.rank === 'A'
        return (
          sourceCard.suit === topCard.suit &&
          getRankValue(sourceCard.rank) - getRankValue(topCard.rank) === 1
        )
      }

      return false
    },

    applyAndSyncMove(movePayload, { animate = false } = {}) {
      if (!this.gameState || !this.isMoveLegal(movePayload)) return

      this.snapshot()
      if (animate) this.animateMove(movePayload)
      else this.performLocalMove(movePayload)

      this.enqueueSync(async () => {
        const response = await api.moveCard({
          ...movePayload,
          userId: this.userId,
          gameId: this.gameId,
        })
        this.gameState.score = response.data.gameState.score
        this.gameState.moves = response.data.gameState.moves
        this.handleWinResponse(response)
      })
    },

    animateMove(movePayload) {
      const { sourcePileType, sourcePileIndex, sourceCardIndex } = movePayload

      let sourcePile
      if (sourcePileType === 'tableauPiles')
        sourcePile = this.gameState.tableauPiles[sourcePileIndex]
      else if (sourcePileType === 'wastePile') sourcePile = this.gameState.wastePile
      else if (sourcePileType === 'foundationPiles')
        sourcePile = this.gameState.foundationPiles[sourcePileIndex]

      if (!sourcePile) {
        this.performLocalMove(movePayload)
        return
      }

      // Capture the moving cards and their on-screen positions before the move.
      const movingCards = sourcePile.slice(sourceCardIndex)
      const fromRects = movingCards.map((c) =>
        document.querySelector(`[data-card="${c.rank}${c.suit}"]`)?.getBoundingClientRect(),
      )

      // Hide them at their destination, then commit the move now.
      movingCards.forEach((c) => (this.animatingCards[c.rank + c.suit] = true))
      this.performLocalMove(movePayload)

      // Once the destination has rendered, fly a clone to each card's new spot.
      this.$nextTick(() => {
        movingCards.forEach((card, i) => {
          const key = card.rank + card.suit
          const fromRect = fromRects[i]
          const toRect = document
            .querySelector(`[data-card="${card.rank}${card.suit}"]`)
            ?.getBoundingClientRect()
          if (!fromRect || !toRect) {
            delete this.animatingCards[key]
            return
          }
          this.spawnFlyingCard({
            rank: card.rank,
            suit: card.suit,
            fromRect,
            toRect,
            onLand: () => delete this.animatingCards[key],
          })
        })
      })
    },

    handleWinResponse(response) {
      if (!response.data.win) return
      this.isNewUser = response.data.isNewUser || false
      if (response.data.submissionToken) {
        this.pendingSubmissionToken = response.data.submissionToken
        this.finishTime = Date.now() - this.gameState.startTime
        this.guestDialog = true
      } else if (this.isNewUser) {
        this.welcomeDialog = true
      } else {
        this.winDialog = true
      }
    },

    handleDrop(destinationInfo) {
      if (this.isAutoSolving || !this.draggedCardSourceInfo) return

      const movePayload = {
        ...this.draggedCardSourceInfo,
        ...destinationInfo,
      }
      this.draggedCardSourceInfo = null

      this.applyAndSyncMove(movePayload)
    },

    handleUndo() {
      if (this.isAutoSolving) return
      this.clearAnimations()
      if (this.undoStack.length > 0) {
        this.gameState = this.undoStack.pop()
        this.enqueueSync(async () => {
          const response = await api.undoMove(this.gameId)
          this.gameState.score = response.data.gameState.score
          this.gameState.moves = response.data.gameState.moves
        })
      } else {
        this.enqueueSync(async () => {
          const response = await api.undoMove(this.gameId)
          this.gameState = response.data.gameState
        })
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

    performLocalDraw() {
      const gs = this.gameState
      const drawCount = gs.hardMode ? 3 : 1

      if (gs.stockPile.length > 0) {
        for (let i = 0; i < drawCount && gs.stockPile.length > 0; i++) {
          const card = gs.stockPile.pop()
          card.faceUp = true
          gs.wastePile.push(card)
        }
      } else if (gs.wastePile.length > 0) {
        gs.stockPile = gs.wastePile.reverse()
        gs.stockPile.forEach((card) => (card.faceUp = false))
        gs.wastePile = []
      }
    },

    handleAutoMove(sourceInfo) {
      if (this.isAutoSolving) return
      const destinationInfo = this.findBestAutoMove(sourceInfo)

      if (destinationInfo) {
        this.applyAndSyncMove({ ...sourceInfo, ...destinationInfo }, { animate: true })
      }
    },

    findBestAutoMove(sourceInfo) {
      const { sourcePileType, sourcePileIndex, sourceCardIndex } = sourceInfo

      let sourcePile =
        sourcePileType === 'tableauPiles'
          ? this.gameState.tableauPiles[sourcePileIndex]
          : this.gameState.wastePile

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

          if (!topCard) {
            if (sourceCard.rank === 'A') {
              return { destPileType: 'foundationPiles', destPileIndex: i }
            }
          } else {
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
        if (sourcePileType === 'tableauPiles' && sourcePileIndex === i) {
          continue
        }

        const destPile = this.gameState.tableauPiles[i]
        const topCard = destPile.length > 0 ? destPile[destPile.length - 1] : null

        if (!topCard) {
          if (sourceCard.rank === 'K') {
            return { destPileType: 'tableauPiles', destPileIndex: i }
          }
        } else {
          const sourceColor = getCardColor(sourceCard.suit)
          const destColor = getCardColor(topCard.suit)
          const sourceValue = getRankValue(sourceCard.rank)
          const destValue = getRankValue(topCard.rank)

          if (sourceColor !== destColor && destValue - sourceValue === 1) {
            return { destPileType: 'tableauPiles', destPileIndex: i }
          }
        }
      }

      return null
    },

    closeWelcomeAndShowStats() {
      this.welcomeDialog = false
      this.winDialog = true
    },

    handleDrawCard() {
      if (this.isAutoSolving || !this.gameState) return

      this.snapshot()

      const gs = this.gameState
      const drawingFromStock = gs.stockPile.length > 0

      let drawnCards = []
      let fromRects = []
      if (drawingFromStock) {
        const count = Math.min(gs.hardMode ? 3 : 1, gs.stockPile.length)
        drawnCards = gs.stockPile.slice(gs.stockPile.length - count)
        fromRects = drawnCards.map((c) =>
          document.querySelector(`[data-card="${c.rank}${c.suit}"]`)?.getBoundingClientRect(),
        )
        drawnCards.forEach((c) => (this.animatingCards[c.rank + c.suit] = true))
      }

      this.performLocalDraw()

      if (drawingFromStock) {
        this.$nextTick(() => {
          drawnCards.forEach((card, i) => {
            const key = card.rank + card.suit
            const fromRect = fromRects[i]
            const toRect = document
              .querySelector(`[data-card="${card.rank}${card.suit}"]`)
              ?.getBoundingClientRect()
            if (!fromRect || !toRect) {
              delete this.animatingCards[key]
              return
            }
            this.spawnFlyingCard({
              rank: card.rank,
              suit: card.suit,
              flip: true,
              fromRect,
              toRect,
              onLand: () => delete this.animatingCards[key],
            })
          })
        })
      }

      this.enqueueSync(async () => {
        const response = await api.drawCard(this.gameId)
        this.gameState.score = response.data.gameState.score
        this.gameState.moves = response.data.gameState.moves
      })
    },

    // --- Auto-complete (flying cascade) ---

    async handleAutoSolve() {
      if (this.isAutoSolving || !this.isAutoSolvable) return
      this.isAutoSolving = true

      await this.syncQueue

      const serverPromise = api.autoCompleteSolitaire(this.gameId).catch((error) => {
        console.error('Auto-complete failed on server:', error)
        return null
      })

      // Precompute the full deal order, then play it out as a flying cascade.
      const sequence = this.computeSolveSequence()
      await this.playSolveSequence(sequence)

      const response = await serverPromise
      if (response?.data?.win) {
        if (response.data.gameState) {
          this.gameState.score = response.data.gameState.score
          this.gameState.moves = response.data.gameState.moves
        }
        this.gameState.isDone = true
        this.handleWinResponse(response)
      } else {
        // Server didn't confirm the finish — reconcile so we never show a false win.
        console.error('Auto-complete not confirmed by server; reconciling.')
        this.syncGeneration++
        this.undoStack = []
        if (this.userId) {
          try {
            const r = await api.getGameState(this.userId)
            if (r?.data?.gameState) this.gameState = r.data.gameState
          } catch (e) {
            console.error('Failed to reconcile after auto-complete:', e)
          }
        }
      }

      this.isAutoSolving = false
    },

    findFoundationMoveIn(state) {
      for (let t = 0; t < state.tableauPiles.length; t++) {
        const pile = state.tableauPiles[t]
        if (pile.length === 0) continue
        const card = pile[pile.length - 1]
        for (let f = 0; f < state.foundationPiles.length; f++) {
          const fp = state.foundationPiles[f]
          const top = fp.length > 0 ? fp[fp.length - 1] : null
          if (!top) {
            if (card.rank === 'A') return { sourcePileIndex: t, destFoundationIndex: f }
          } else if (
            card.suit === top.suit &&
            getRankValue(card.rank) - getRankValue(top.rank) === 1
          ) {
            return { sourcePileIndex: t, destFoundationIndex: f }
          }
        }
      }
      return null
    },

    computeSolveSequence() {
      const clone = JSON.parse(JSON.stringify(this.gameState))
      const sequence = []
      let move
      while ((move = this.findFoundationMoveIn(clone))) {
        const card = clone.tableauPiles[move.sourcePileIndex].pop()
        clone.foundationPiles[move.destFoundationIndex].push(card)
        sequence.push({
          sourcePileIndex: move.sourcePileIndex,
          destFoundationIndex: move.destFoundationIndex,
          rank: card.rank,
          suit: card.suit,
        })
      }
      return sequence
    },

    playSolveSequence(sequence) {
      const STAGGER_MS = 90
      const FLIGHT_MS = 320
      return new Promise((resolve) => {
        let i = 0
        const launchNext = () => {
          if (i >= sequence.length) {
            setTimeout(resolve, FLIGHT_MS)
            return
          }
          this.launchFlyingCard(sequence[i], FLIGHT_MS)
          i++
          setTimeout(launchNext, STAGGER_MS)
        }
        launchNext()
      })
    },

    launchFlyingCard(move, flightMs) {
      const { sourcePileIndex, destFoundationIndex, rank, suit } = move
      const pile = this.gameState.tableauPiles[sourcePileIndex]
      const card = pile[pile.length - 1]

      const fromRect = document
        .querySelector(`[data-card="${rank}${suit}"]`)
        ?.getBoundingClientRect()
      const toRect = document
        .querySelector(`[data-foundation="${destFoundationIndex}"]`)
        ?.getBoundingClientRect()

      // Remove from the tableau immediately so the source slot updates.
      pile.pop()

      const destPile = this.gameState.foundationPiles[destFoundationIndex]
      if (!fromRect || !toRect) {
        // No geometry available — just commit the move without animating.
        destPile.push(card)
        return
      }
      this.spawnFlyingCard({
        rank,
        suit,
        fromRect,
        toRect,
        flightMs,
        onLand: () => destPile.push(card),
      })
    },

    spawnFlyingCard({ rank, suit, flip = false, fromRect, toRect, flightMs = 320, onLand }) {
      const id = ++this.flyingIdSeq
      this.flyingCards.push({
        id,
        rank,
        suit,
        flip,
        flipped: false,
        w: fromRect.width,
        h: fromRect.height,
        x: fromRect.left,
        y: fromRect.top,
        tx: toRect.left,
        ty: toRect.top,
      })

      // Next frame: move (and flip) to the target so the CSS transitions animate.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const f = this.flyingCards.find((c) => c.id === id)
          if (f) {
            f.x = f.tx
            f.y = f.ty
            if (flip) f.flipped = true
          }
        }),
      )

      setTimeout(() => {
        if (onLand) onLand()
        const idx = this.flyingCards.findIndex((c) => c.id === id)
        if (idx !== -1) this.flyingCards.splice(idx, 1)
      }, flightMs)
    },

    /** Drops every in-flight clone and reveals any cards hidden behind them. */
    clearAnimations() {
      this.flyingCards = []
      this.animatingCards = {}
    },
  },
}
</script>

<style scoped>
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
  position: fixed;
  bottom: 1em;
  right: 1em;
}

/* Auto-complete flying cascade */
.flying-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1500;
}
.flying-card {
  position: absolute;
  top: 0;
  left: 0;
  transition: transform 0.32s cubic-bezier(0.25, 0.7, 0.3, 1);
  will-change: transform;
  perspective: 600px;
}
.flying-face-single {
  width: 100%;
  height: 100%;
  border-radius: 5px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}
.flying-flip {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.32s cubic-bezier(0.25, 0.7, 0.3, 1);
}
.flying-flip.flipped {
  transform: rotateY(180deg);
}
.flying-face {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 5px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}
.flying-face.front {
  transform: rotateY(180deg);
}
.flying-face.back {
  transform: rotateY(0deg);
}
.auto-solve-btn {
  animation: auto-solve-glow 1.4s ease-in-out infinite;
}
@keyframes auto-solve-glow {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.5);
  }
  50% {
    box-shadow: 0 0 16px 4px rgba(76, 175, 80, 0.7);
  }
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

@media (max-width: 730px) {
  .menu {
    flex-direction: column;
  }
}
</style>
