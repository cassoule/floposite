<!-- Sudoku.vue -->
<template>
  <CoinsCounter />
  <v-layout class="w-100 mt-16">
    <v-main class="d-flex w-100 mb-16 pb-16 mt-8" style="height: 130vh">
      <div class="w-100">
        <div
          class="text-white mb-4 d-flex flex-wrap w-100"
          style="position: relative; place-items: baseline; gap: 0.5em"
        >
          <div v-if="gameState?.isSOTD" class="d-flex mr-2" style="place-items: center; gap: 0.5em">
            <v-icon class="mdi mdi-trophy-outline mr-2" />
            <h1 style="font-size: 1.8rem" rounded="lg">Sudoku Of The Day</h1>
          </div>
          <div
            v-if="gameState && !gameState.isSOTD"
            class="d-flex mr-2"
            style="place-items: center; gap: 0.5em"
          >
            <v-icon class="mdi mdi-grid mr-2" />
            <h1 style="font-size: 1.8rem" rounded="lg">Sudoku</h1>
            <p class="bg-info py-1 px-3 ml-2 mt-2 rounded-xl" style="text-transform: capitalize">
              {{ gameState.difficulty }}
            </p>
          </div>
          <p v-if="!gameState || gameState?.isSOTD" class="font-weight-medium">{{ timeLeft() }}</p>
          <v-spacer></v-spacer>
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
          <v-progress-circular
            size="20"
            :width="10"
            color="primary"
            indeterminate
          ></v-progress-circular>
        </div>

        <!-- Game board -->
        <div v-if="gameState" class="sudoku-container pb-16">
          <div class="sudoku-board" @keydown="handleKeyPress" tabindex="0" ref="board">
            <div
              v-for="(_, index) in 81"
              :key="index"
              class="sudoku-cell"
              :class="getCellClasses(index)"
              @click="selectCell(index)"
            >
              <template v-if="grid[index]">
                <span class="cell-value" :class="{ given: givenCells.has(index) }">
                  {{ grid[index] }}
                </span>
              </template>
              <template v-else-if="notes[index] && notes[index].size > 0">
                <div class="notes-grid">
                  <span v-for="n in 9" :key="n" class="note-value">{{
                    notes[index].has(n) ? n : ''
                  }}</span>
                </div>
              </template>
            </div>
          </div>

          <div class="sudoku-controls mt-4">
            <div class="d-flex justify-center mb-3" style="gap: 0.5em">
              <v-btn
                :variant="notesMode ? 'flat' : 'tonal'"
                :color="notesMode ? 'primary' : 'grey'"
                rounded="lg"
                class="text-none"
                @click="notesMode = !notesMode"
                prepend-icon="mdi-pencil-outline"
              >
                Notes
              </v-btn>
              <v-btn
                variant="tonal"
                color="grey"
                rounded="lg"
                class="text-none"
                @click="eraseCell"
                prepend-icon="mdi-eraser"
              >
                Effacer
              </v-btn>
            </div>
            <div class="number-pad">
              <v-btn
                v-for="n in 9"
                :key="n"
                variant="tonal"
                color="white"
                rounded="lg"
                class="number-btn"
                @click="inputNumber(n)"
              >
                {{ n }}
              </v-btn>
            </div>
            <div class="d-flex justify-center mt-4">
              <v-btn
                variant="flat"
                color="primary"
                rounded="lg"
                class="text-none px-8"
                :disabled="!isGridComplete"
                @click="handleSubmit"
              >
                Valider
              </v-btn>
            </div>
          </div>
        </div>

        <!-- Menu (no game active) -->
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
                  Sudoku Of The Day
                </v-card-title>
                <v-card-text>
                  <p>
                    Jouer une grille commune à tout le monde générée chaque jour, pour tenter de
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
                    @click="handleStartSotd"
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
                  <v-icon class="mdi mdi-grid" />
                  Sudoku
                </v-card-title>
                <v-card-text class="pb-0 mb-0">
                  <p>Jouer une grille aléatoire de Sudoku.</p>
                  <v-select
                    v-model="difficulty"
                    :items="difficulties"
                    item-title="title"
                    variant="outlined"
                    rounded="lg"
                    density="comfortable"
                    label="Difficulté"
                    class="mt-3"
                    hide-details
                  >
                    <template v-slot:item="{ props: itemProps, item }">
                      <v-list-item v-bind="itemProps" :subtitle="item.props.subtitle"></v-list-item>
                    </template>
                  </v-select>
                </v-card-text>
                <v-card-actions>
                  <v-btn block variant="flat" color="primary" rounded="lg" @click="handleStart">
                    Jouer
                  </v-btn>
                </v-card-actions>
              </v-card>
            </div>
          </v-alert>
        </div>

        <!-- Rankings -->
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
                  <v-col cols="9" />
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
                    sm="9"
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
                  <v-col cols="3" offset="9" offset-sm="0" class="d-flex align-center justify-end">
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
                  >
                    Personne n'a complété le SOTD aujourd'hui
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-alert>
        </div>

        <!-- Timer overlay during game -->
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
              <p>{{ formatTimer() }}</p>
            </v-card-text>
          </v-card>
        </div>
      </div>

      <!-- Win dialog -->
      <v-dialog v-model="winDialog" class="modals" max-width="400" persistent>
        <v-card variant="flat" color="secondary" class="rounded-xl modal-card">
          <v-card-item class="text-white">
            <h2>{{ !gameState?.isSOTD ? 'Bravo !' : 'Tu as complété le SOTD !' }}</h2>
          </v-card-item>
          <v-card-text class="text-secondary">
            <v-alert variant="tonal" color="white" class="rounded-xl mb-4">
              <v-alert-title>Statistiques</v-alert-title>
              <v-card-text class="px-0 pb-2">
                <div class="d-flex justify-space-between flex-wrap" style="gap: 1em">
                  <h3>{{ formatFinishTime(finishTime) }}</h3>
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

      <!-- Error dialog -->
      <v-dialog v-model="errorDialog" class="modals" max-width="400">
        <v-card variant="flat" color="secondary" class="rounded-xl modal-card">
          <v-card-item class="text-white">
            <h2>Erreurs dans la grille</h2>
          </v-card-item>
          <v-card-text class="text-secondary">
            <p>
              {{ errors.length }} cellule{{ errors.length > 1 ? 's' : '' }} incorrecte{{
                errors.length > 1 ? 's' : ''
              }}.
            </p>
          </v-card-text>
          <v-card-text class="text-white d-flex">
            <v-spacer></v-spacer>
            <v-btn variant="flat" color="primary" class="rounded-lg" @click="errorDialog = false">
              Corriger
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
      @click="gameState ? handleReset() : $router.push('/dashboard')"
    ></v-btn>
  </v-layout>
</template>

<script>
/* global localStorage, setInterval, clearInterval */
import api from '../services/api'
import { io } from 'socket.io-client'
import CoinsCounter from '../components/CoinsCounter.vue'

export default {
  name: 'Sudoku',
  components: {
    CoinsCounter,
  },
  data() {
    return {
      gameState: null,
      userId: null,
      isLoading: false,
      now: Date.now(),

      grid: Array(81).fill(null),
      givenCells: new Set(),
      notes: Array.from({ length: 81 }, () => new Set()),
      selectedCell: null,
      notesMode: false,
      errors: [],
      errorDialog: false,

      difficulty: 'medium',
      difficulties: [
        { title: 'Facile', value: 'easy', props: { subtitle: '+100 FlopoCoins' } },
        { title: 'Moyen', value: 'medium', props: { subtitle: '+200 FlopoCoins' } },
        { title: 'Difficile', value: 'hard', props: { subtitle: '+500 FlopoCoins' } },
        { title: 'Expert', value: 'expert', props: { subtitle: '+1000 FlopoCoins' } },
      ],

      winDialog: false,
      finishTime: null,
      rankings: null,

      timerInterval: null,
      elapsedTime: 0,
    }
  },
  computed: {
    isGridComplete() {
      return this.grid.every((cell) => cell !== null)
    },
  },
  async mounted() {
    try {
      this.userId = localStorage.getItem('discordId')
      if (!this.userId) this.$router.push('/')

      this.initSocket()
      this.isLoading = true
      await this.getRankings()
      await this.fetchGameState(this.userId)
      this.isLoading = false
    } catch (error) {
      console.error('Failed to load game state:', error)
      if (!this.userId) this.$router.push('/')
    }
  },
  beforeUnmount() {
    if (this.timerInterval) clearInterval(this.timerInterval)
    if (this.socket) this.socket.disconnect()
  },
  methods: {
    initSocket() {
      this.socket = io(import.meta.env.VITE_FLAPI_URL.replace(/\/api$/, ''), {
        withCredentials: false,
        auth: { token: localStorage.getItem('token') },
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
      })

      this.socket.on('sudoku:update', (payload) => {
        if (payload?.userId === this.userId) {
          window.location.reload()
        }
      })
    },

    charToNum(char) {
      if (!char || char === '-') return ''
      return char.charCodeAt(0) - 'a'.charCodeAt(0) + 1
    },

    numToChar(num) {
      return String.fromCharCode('a'.charCodeAt(0) + num - 1)
    },

    initGrid(puzzle) {
      this.grid = Array(81).fill(null)
      this.givenCells = new Set()
      this.notes = Array.from({ length: 81 }, () => new Set())
      this.errors = []
      this.selectedCell = null

      for (let i = 0; i < 81; i++) {
        if (puzzle[i] !== '-') {
          this.grid[i] = puzzle[i]
          this.givenCells.add(i)
        }
      }
      console.log(this.grid)
    },

    startTimer() {
      if (this.timerInterval) clearInterval(this.timerInterval)
      this.elapsedTime = 0
      this.timerInterval = setInterval(() => {
        if (this.gameState) {
          this.elapsedTime = Date.now() - this.gameState.startTime
        }
      }, 100)
    },

    formatTimer() {
      return this.formatFinishTime(this.elapsedTime)
    },

    formatFinishTime(startAt) {
      let remainder = startAt

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
        const response = await api.getSudokuRankings()
        this.rankings = response.data.rankings
      } catch (error) {
        console.error('Failed to fetch rankings:', error)
      }
    },

    async handleStart() {
      await this.getRankings()
      try {
        const response = await api.startSudoku(this.difficulty)
        this.gameState = response.data.gameState
        this.initGrid(this.gameState.puzzle)
        this.startTimer()
        this.$nextTick(() => this.$refs.board?.focus())
      } catch (error) {
        console.error('Failed to start new game:', error)
      }
    },

    async handleStartSotd() {
      await this.getRankings()
      try {
        const response = await api.startSudokuSOTD()
        this.gameState = response.data.gameState
        this.initGrid(this.gameState.puzzle)
        this.startTimer()
        this.$nextTick(() => this.$refs.board?.focus())
      } catch (error) {
        console.error('Failed to start SOTD:', error)
      }
    },

    async handleReset() {
      if (this.timerInterval) clearInterval(this.timerInterval)
      await this.getRankings()
      try {
        await api.resetSudoku()
        this.gameState = null
        this.grid = Array(81).fill(null)
        this.givenCells = new Set()
        this.notes = Array.from({ length: 81 }, () => new Set())
        this.errors = []
        this.selectedCell = null
      } catch (error) {
        console.error('Failed to reset game:', error)
      }
    },

    async fetchGameState() {
      try {
        const response = await api.getSudokuState(this.userId)
        this.gameState = response?.data?.gameState
        if (this.gameState) {
          this.initGrid(this.gameState.puzzle)
          this.restoreProgress()
          this.startTimer()
        }
      } catch (error) {
        console.error('Failed to load game state:', error)
      }
    },

    restoreProgress() {
      if (this.gameState?.progress) {
        for (let i = 0; i < 81; i++) {
          if (!this.givenCells.has(i) && this.gameState.progress[i] !== '-') {
            this.grid[i] = this.gameState.progress[i]
          }
        }
        this.grid = [...this.grid]
      }
      if (this.gameState?.notes && Array.isArray(this.gameState.notes)) {
        for (let i = 0; i < 81; i++) {
          if (Array.isArray(this.gameState.notes[i])) {
            this.notes[i] = new Set(this.gameState.notes[i])
          }
        }
        this.notes = [...this.notes]
      }
    },

    selectCell(index) {
      this.selectedCell = index
      this.$refs.board?.focus()
    },

    inputNumber(num) {
      if (this.selectedCell === null) return
      if (this.givenCells.has(this.selectedCell)) return

      if (this.notesMode) {
        const cellNotes = this.notes[this.selectedCell]
        if (cellNotes.has(num)) {
          cellNotes.delete(num)
        } else {
          cellNotes.add(num)
        }
        this.grid[this.selectedCell] = null
      } else {
        this.grid[this.selectedCell] = num
        this.notes[this.selectedCell] = new Set()
        this.clearNotesForRelated(this.selectedCell, num)
        // Clear error highlight for this cell
        this.errors = this.errors.filter((e) => e !== this.selectedCell)
      }
      // Force reactivity
      this.grid = [...this.grid]
      this.notes = [...this.notes]
      this.saveProgress()
    },

    eraseCell() {
      if (this.selectedCell === null) return
      if (this.givenCells.has(this.selectedCell)) return

      this.grid[this.selectedCell] = null
      this.notes[this.selectedCell] = new Set()
      this.errors = this.errors.filter((e) => e !== this.selectedCell)
      this.grid = [...this.grid]
      this.notes = [...this.notes]
      this.saveProgress()
    },

    saveProgress() {
      const grid = this.grid.map((cell) => (cell != null ? String(cell) : '-')).join('')
      const notes = this.notes.map((s) => [...s])
      api.saveSudokuProgress(grid, notes).catch(() => {})
    },

    clearNotesForRelated(index, num) {
      const row = Math.floor(index / 9)
      const col = index % 9
      const boxRow = Math.floor(row / 3) * 3
      const boxCol = Math.floor(col / 3) * 3

      for (let i = 0; i < 9; i++) {
        // Same row
        this.notes[row * 9 + i].delete(num)
        // Same column
        this.notes[i * 9 + col].delete(num)
      }
      // Same 3x3 box
      for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
          this.notes[r * 9 + c].delete(num)
        }
      }
    },

    handleKeyPress(event) {
      if (this.selectedCell === null) return

      const num = parseInt(event.key)
      if (num >= 1 && num <= 9) {
        this.inputNumber(num)
        return
      }

      if (event.key === 'Backspace' || event.key === 'Delete') {
        this.eraseCell()
        return
      }

      const row = Math.floor(this.selectedCell / 9)
      const col = this.selectedCell % 9

      if (event.key === 'ArrowUp' && row > 0) this.selectedCell -= 9
      if (event.key === 'ArrowDown' && row < 8) this.selectedCell += 9
      if (event.key === 'ArrowLeft' && col > 0) this.selectedCell -= 1
      if (event.key === 'ArrowRight' && col < 8) this.selectedCell += 1
    },

    getCellClasses(index) {
      const row = Math.floor(index / 9)
      const col = index % 9
      const classes = []

      // Box borders
      if (col % 3 === 0 && col !== 0) classes.push('box-left')
      if (row % 3 === 0 && row !== 0) classes.push('box-top')

      if (this.selectedCell !== null) {
        const selRow = Math.floor(this.selectedCell / 9)
        const selCol = this.selectedCell % 9
        const selBoxRow = Math.floor(selRow / 3)
        const selBoxCol = Math.floor(selCol / 3)
        const boxRow = Math.floor(row / 3)
        const boxCol = Math.floor(col / 3)

        if (index === this.selectedCell) {
          classes.push('selected')
        } else if (
          row === selRow ||
          col === selCol ||
          (boxRow === selBoxRow && boxCol === selBoxCol)
        ) {
          classes.push('highlighted')
        }

        // Highlight matching numbers
        if (
          this.grid[this.selectedCell] &&
          parseInt(this.grid[index]) === parseInt(this.grid[this.selectedCell]) &&
          index !== this.selectedCell
        ) {
          classes.push('matching')
        }
      }

      if (this.errors.includes(index)) {
        classes.push('error')
      }

      if (this.givenCells.has(index)) {
        classes.push('given')
      }

      return classes
    },

    async handleSubmit() {
      const gridString = this.grid.join('')
      this.isLoading = true

      try {
        console.log(gridString)
        const response = await api.submitSudoku(gridString)

        if (response.data.valid) {
          this.finishTime = response.data.time
          this.winDialog = true
          if (this.timerInterval) clearInterval(this.timerInterval)
        } else {
          this.errors = response.data.errors
          this.errorDialog = true
        }
      } catch (error) {
        console.error('Failed to submit:', error)
      } finally {
        this.isLoading = false
      }
    },
  },
}
</script>

<style scoped>
.sudoku-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sudoku-board {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 1px;
  background: #444;
  border: 3px solid #888;
  border-radius: 8px;
  overflow: hidden;
  max-width: 500px;
  width: 100%;
  aspect-ratio: 1;
  outline: none;
}

.sudoku-cell {
  background: #1e1e1e;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  font-size: clamp(1rem, 4vw, 1.8rem);
  user-select: none;
  transition: background 0.1s;
}

.sudoku-cell.box-left {
  border-left: 2px solid #888;
}

.sudoku-cell.box-top {
  border-top: 2px solid #888;
}

.sudoku-cell.selected {
  background: #3a4a6b;
}

.sudoku-cell.highlighted {
  background: #2a2a3a;
}

.sudoku-cell.matching {
  background: #3a3a5a;
}

.sudoku-cell.error {
  background: rgba(255, 83, 80, 0.8);
  margin: 0 !important;
}

.cell-value {
  color: #90caf9;
  font-weight: bold;
}

.cell-value.given {
  color: #fff;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  place-items: center;
}

.note-value {
  font-size: clamp(0.4rem, 1.5vw, 0.65rem);
  color: #888;
  line-height: 1;
}

.number-pad {
  display: flex;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
  max-width: 500px;
}

.number-btn {
  min-width: 45px !important;
  height: 45px !important;
  font-size: 1.2rem !important;
  font-weight: bold !important;
}

.sudoku-controls {
  max-width: 500px;
  width: 100%;
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
