<!-- MotsFleches.vue -->
<template>
  <CoinsCounter />
  <v-layout class="w-100 mt-16">
    <v-main class="d-flex w-100 mb-16 pb-16 mt-8" style="min-height: 100vh">
      <div class="w-100">
        <div
          class="text-white mb-4 d-flex flex-wrap w-100"
          style="position: relative; place-items: baseline; gap: 0.5em"
        >
          <div v-if="gameState?.isSOTD" class="d-flex mr-2" style="place-items: center; gap: 0.5em">
            <v-icon class="mdi mdi-trophy-outline mr-2" />
            <h1 style="font-size: 1.8rem">Mots Fléchés Of The Day</h1>
          </div>
          <div
            v-if="gameState && !gameState.isSOTD"
            class="d-flex mr-2"
            style="place-items: center; gap: 0.5em"
          >
            <v-icon class="mdi mdi-archive-outline mr-2" />
            <h1 style="font-size: 1.8rem">Mots Fléchés · Archive {{ gameState.date }}</h1>
          </div>
          <p v-if="!gameState || gameState?.isSOTD" class="font-weight-medium">
            {{ timeLeft() }}
          </p>
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
        <div v-if="gameState" class="mf-container pb-16">
          <div class="mf-layout">
            <div
              class="mf-board"
              :style="{
                gridTemplateColumns: `repeat(${gameState.cols}, 1fr)`,
                gridTemplateRows: `repeat(${gameState.rows}, 1fr)`,
                aspectRatio: `${gameState.cols} / ${gameState.rows}`,
              }"
            >
              <template v-for="(_, r) in gameState.rows">
                <template v-for="(__, c) in gameState.cols" :key="`${r}-${c}`">
                  <!-- Definition cell -->
                  <div v-if="getDefClues(r, c)" class="mf-cell mf-def" :title="defTitle(r, c)">
                    <div class="mf-def-text">
                      <span v-for="(clue, idx) in getDefClues(r, c)" :key="idx" class="mf-def-line">
                        {{ definitionFor(clue) || clue.word }}
                      </span>
                    </div>
                  </div>
                  <!-- Black cell (no clue) -->
                  <div v-else-if="gameState.blackMask[r][c]" class="mf-cell mf-black"></div>
                  <!-- Input cell -->
                  <div v-else class="mf-cell mf-input-wrap">
                    <span
                      v-for="(a, ai) in arrowsAtStart[`${r},${c}`] || []"
                      :key="`a${ai}`"
                      class="mf-arrow"
                      :class="arrowClass(a.arrow)"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      maxlength="1"
                      class="mf-input"
                      :class="{ 'mf-error': isError(r, c) }"
                      :data-r="r"
                      :data-c="c"
                      :value="filledGrid[r] && filledGrid[r][c]"
                      @input="onInput($event, r, c)"
                      @keydown="onKey($event, r, c)"
                      @focus="onFocus(r, c)"
                    />
                  </div>
                </template>
              </template>
            </div>

            <div class="mf-controls mt-4">
              <div class="mf-timer mb-2">
                <v-icon class="mdi mdi-timer-outline mr-1" />
                {{ formatTimer() }}
              </div>
              <v-btn
                variant="flat"
                color="primary"
                rounded="lg"
                class="text-none px-8"
                :disabled="!isComplete"
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
                  Mots Fléchés Of The Day
                </v-card-title>
                <v-card-text>
                  <p>
                    Une grille commune générée chaque jour. Résolvez-la le plus vite possible pour
                    gagner des FlopoCoins et apparaître au classement.
                  </p>
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    block
                    variant="flat"
                    color="primary"
                    rounded="lg"
                    class="text-none"
                    @click="handleStartSotd"
                  >
                    Lancer la grille du jour
                  </v-btn>
                </v-card-actions>
              </v-card>
              <v-divider vertical class="d-none d-sm-flex" />
              <v-divider class="d-flex d-sm-none" />
              <v-card
                class="d-flex flex-column"
                variant="text"
                color="white"
                style="flex-basis: 50%; gap: 0.5em"
              >
                <v-card-title class="pb-0 mb-0">
                  <v-icon class="mdi mdi-archive-outline" />
                  Archives
                </v-card-title>
                <v-card-text
                  class="pt-0 mt-0"
                  style="max-height: 190px; overflow-y: auto; scrollbar-width: auto"
                >
                  <v-list
                    v-if="archive.length"
                    density="compact"
                    class="mf-archive-list"
                    bg-color="transparent"
                  >
                    <v-list-item
                      v-for="entry in archive.filter(
                        (e) => e.date !== new Date().toISOString().slice(0, 10),
                      )"
                      :key="entry.date"
                      :title="entry.date"
                      :subtitle="`${entry.wordCount} mots · ${entry.rows}×${entry.cols}${entry.hasPlayed ? ' · joué' : ''}`"
                      rounded="lg"
                      @click="handleStartArchive(entry.date)"
                    >
                      <template #append>
                        <v-icon class="mdi mdi-play-circle-outline" />
                      </template>
                    </v-list-item>
                  </v-list>
                  <p v-else class="text-disabled">Aucune grille archivée pour l'instant.</p>
                </v-card-text>
              </v-card>
            </div>
          </v-alert>
        </div>

        <div v-if="!gameState" class="my-16">
          <v-alert variant="tonal" color="secondary" rounded="xl">
            <v-card
              v-if="rankings && rankings.length"
              class="d-flex flex-column"
              variant="text"
              color="secondary"
              rounded="xl"
            >
              <v-card-title>Classement du jour</v-card-title>
              <v-card-text>
                <v-row v-if="rankings && rankings.length > 0" class="text-secondary">
                  <v-col cols="6" class="text-right"> Score </v-col>
                  <v-col cols="3" class="text-right"> Mots </v-col>
                  <v-col cols="3" class="text-right"> Temps </v-col>
                </v-row>
                <v-row
                  v-for="(stats, index) in rankings"
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
                    {{ stats.cluesSolved }}
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
                    Personne n'a complété la grille aujourd'hui
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-alert>
        </div>
      </div>

      <v-dialog v-model="winDialog" max-width="450">
        <v-card rounded="xl">
          <v-card-title>Bravo !</v-card-title>
          <v-card-text>
            Grille terminée en {{ formatFinishTime(finishTime) }} · {{ finishClues }} mots trouvés ·
            score <strong>{{ finishScore }}</strong>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="flat" color="primary" rounded="lg" @click="closeWin">OK</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="errorDialog" max-width="450">
        <v-card rounded="lg">
          <v-card-title>Erreurs</v-card-title>
          <v-card-text>
            {{ errors.length }} case(s) incorrecte(s). Les erreurs sont surlignées en rouge.
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="flat" color="primary" rounded="lg" @click="errorDialog = false">
              Corriger
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-main>

    <v-btn
      class="back-btn text-none"
      text="Retour"
      variant="tonal"
      color="#ddd"
      @click="gameState ? handleReset() : $router.push('/dashboard')"
    />
  </v-layout>
</template>

<script>
/* global localStorage, setInterval, clearInterval */
import api from '../services/api'
import { getSocket } from '@/services/socket.js'
import CoinsCounter from '../components/CoinsCounter.vue'

export default {
  name: 'MotsFleches',
  components: { CoinsCounter },
  data() {
    return {
      userId: null,
      isLoading: false,
      now: Date.now(),
      gameState: null,
      filledGrid: [],
      errors: [],
      errorDialog: false,
      winDialog: false,
      finishTime: 0,
      finishClues: 0,
      finishScore: 0,
      rankings: [],
      archive: [],
      timerInterval: null,
      elapsedTime: 0,
      saveTimeout: null,
    }
  },
  computed: {
    isComplete() {
      if (!this.gameState) return false
      for (let r = 0; r < this.gameState.rows; r++) {
        for (let c = 0; c < this.gameState.cols; c++) {
          if (this.gameState.blackMask[r][c]) continue
          if (!this.filledGrid[r] || !this.filledGrid[r][c]) return false
        }
      }
      return true
    },
    // Map: "r,c" of the FIRST letter cell of a word → list of arrow descriptors
    // pointing from the adjacent def cell into this cell.
    arrowsAtStart() {
      const map = {}
      if (!this.gameState?.defCells) return map
      for (const [cellKey, clues] of Object.entries(this.gameState.defCells)) {
        const [dr, dc] = cellKey.split(',').map(Number)
        for (const clue of clues) {
          let sr, sc
          switch (clue.arrow) {
            case '→':
              sr = dr
              sc = dc + 1
              break
            case '↓':
              sr = dr + 1
              sc = dc
              break
            case '↳':
              sr = dr + 1
              sc = dc
              break
            case '↱':
              sr = dr - 1
              sc = dc
              break
            case '⤵':
              sr = dr
              sc = dc + 1
              break
            case '⤓':
              sr = dr
              sc = dc - 1
              break
            default:
              continue
          }
          const k = `${sr},${sc}`
          if (!map[k]) map[k] = []
          map[k].push({ arrow: clue.arrow, dir: clue.dir, word: clue.word })
        }
      }
      return map
    },
  },
  async mounted() {
    this.userId = localStorage.getItem('discordId')
    if (!this.userId) return this.$router.push('/')

    this.initSocket()
    this.isLoading = true
    try {
      await Promise.all([this.fetchRankings(), this.fetchArchive(), this.fetchGameState()])
    } catch (e) {
      console.error('mots-fleches load failed', e)
    }
    this.isLoading = false
  },
  beforeUnmount() {
    if (this.timerInterval) clearInterval(this.timerInterval)
    if (this.saveTimeout) clearTimeout(this.saveTimeout)
    if (this.socket && this._onUpdate) {
      this.socket.off('motsFleches:update', this._onUpdate)
    }
  },
  methods: {
    initSocket() {
      this.socket = getSocket()
      this._onUpdate = (payload) => {
        if (payload?.userId === this.userId) window.location.reload()
      }
      this.socket.on('motsFleches:update', this._onUpdate)
    },

    initFilledGrid() {
      const { rows, cols } = this.gameState
      this.filledGrid = Array.from({ length: rows }, () => Array(cols).fill(''))
      this.errors = []
    },

    getDefClues(r, c) {
      const arr = this.gameState?.defCells?.[`${r},${c}`]
      return arr && arr.length ? arr : null
    },

    definitionFor(clue) {
      if (!clue) return ''
      const defs = this.gameState?.definitions
      if (!defs) return ''
      const key = clue.word ? clue.word.toUpperCase() : ''
      return defs[key] || ''
    },

    defTitle(r, c) {
      const clues = this.getDefClues(r, c) || []
      return clues.map((cl) => `${cl.arrow} ${this.definitionFor(cl) || cl.word}`).join('\n')
    },

    truncate(s, n) {
      if (!s) return ''
      return s.length > n ? s.slice(0, n - 1) + '…' : s
    },

    arrowClass(arrow) {
      switch (arrow) {
        case '→':
          return 'arrow-right'
        case '↓':
          return 'arrow-down'
        case '↳':
          // H word, def above start → down then right
          return 'arrow-bent-h'
        case '↱':
          // H word, def below start → up then right
          return 'arrow-bent-h arrow-bent-up'
        case '⤵':
          // V word, def left of start → right then down
          return 'arrow-bent-v'
        case '⤓':
          // V word, def right of start → left then down
          return 'arrow-bent-v arrow-bent-mirror'
        default:
          return 'arrow-right'
      }
    },

    isError(r, c) {
      return this.errors.some((e) => e.r === r && e.c === c)
    },

    onInput(ev, r, c) {
      const raw = ev.target.value || ''
      const ch = raw
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(-1)
      if (!this.filledGrid[r]) this.filledGrid[r] = []
      this.filledGrid[r][c] = ch
      ev.target.value = ch
      this.errors = this.errors.filter((e) => !(e.r === r && e.c === c))
      this.scheduleSave()
      if (ch) this.focusNext(r, c)
    },

    onKey(ev, r, c) {
      if (ev.key === 'Backspace' && !this.filledGrid[r][c]) {
        ev.preventDefault()
        this.focusPrev(r, c)
        return
      }
      if (ev.key === 'ArrowRight') {
        ev.preventDefault()
        this.focusOffset(r, c, 0, 1)
      } else if (ev.key === 'ArrowLeft') {
        ev.preventDefault()
        this.focusOffset(r, c, 0, -1)
      } else if (ev.key === 'ArrowDown') {
        ev.preventDefault()
        this.focusOffset(r, c, 1, 0)
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault()
        this.focusOffset(r, c, -1, 0)
      }
    },

    onFocus(r, c) {
      this.focused = { r, c }
    },

    focusNext(r, c) {
      this.focusOffset(r, c, 0, 1)
    },

    focusPrev(r, c) {
      this.focusOffset(r, c, 0, -1)
    },

    focusOffset(r, c, dr, dc) {
      const { rows, cols, blackMask } = this.gameState
      let nr = r + dr
      let nc = c + dc
      while (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (!blackMask[nr][nc]) {
          const tr = nr
          const tc = nc
          this.$nextTick(() => {
            const el = document.querySelector(`.mf-board .mf-input[data-r='${tr}'][data-c='${tc}']`)
            if (el) {
              el.focus()
              el.select?.()
            }
          })
          return
        }
        nr += dr
        nc += dc
      }
    },

    scheduleSave() {
      if (this.saveTimeout) clearTimeout(this.saveTimeout)
      this.saveTimeout = setTimeout(() => this.saveProgress(), 600)
    },

    async saveProgress() {
      if (!this.gameState) return
      try {
        await api.saveMotsFlechesProgress(this.filledGrid)
      } catch (e) {
        console.warn('progress save failed', e?.response?.status)
      }
    },

    startTimer() {
      if (this.timerInterval) clearInterval(this.timerInterval)
      this.elapsedTime = 0
      this.timerInterval = setInterval(() => {
        if (this.gameState) this.elapsedTime = Date.now() - this.gameState.startTime
      }, 200)
    },

    formatTimer() {
      return this.formatFinishTime(this.elapsedTime)
    },

    formatFinishTime(ms) {
      let r = ms || 0
      const h = Math.floor(r / 3600000)
      r %= 3600000
      const m = Math.floor(r / 60000)
      r %= 60000
      const s = Math.floor(r / 1000)
      const pad = (n, w = 2) => String(n).padStart(w, '0')
      return `${h > 0 ? pad(h) + ':' : ''}${pad(m)}:${pad(s)}`
    },

    timeLeft() {
      const end = new Date(this.now)
      end.setHours(24, 0, 0, 0)
      const ms = end - this.now
      const total = Math.floor(ms / 1000)
      const h = Math.floor(total / 3600)
      const m = Math.floor((total % 3600) / 60)
      return `Temps restant : ${h}h ${m}m`
    },

    async fetchRankings() {
      try {
        const res = await api.getMotsFlechesRankings()
        this.rankings = res.data.rankings || []
      } catch (e) {
        console.warn('rankings fetch failed', e?.response?.status)
      }
    },

    async fetchArchive() {
      try {
        const res = await api.getMotsFlechesArchive(60)
        this.archive = res.data.archive || []
      } catch (e) {
        console.warn('archive fetch failed', e?.response?.status)
      }
    },

    async fetchGameState() {
      try {
        const res = await api.getMotsFlechesState(this.userId)
        this.gameState = res.data.gameState
        this.initFilledGrid()
        this.startTimer()
      } catch (e) {
        if (e?.response?.status !== 404) console.warn('state fetch failed', e?.response?.status)
      }
    },

    async handleStartSotd() {
      try {
        this.isLoading = true
        const res = await api.startMotsFlechesSOTD()
        this.gameState = res.data.gameState
        this.initFilledGrid()
        this.startTimer()
      } catch (e) {
        console.error('start sotd failed', e)
      } finally {
        this.isLoading = false
      }
    },

    async handleStartArchive(date) {
      try {
        this.isLoading = true
        const res = await api.startMotsFlechesArchive(date)
        this.gameState = res.data.gameState
        this.initFilledGrid()
        this.startTimer()
      } catch (e) {
        console.error('start archive failed', e)
      } finally {
        this.isLoading = false
      }
    },

    async handleReset() {
      try {
        await api.resetMotsFleches()
      } catch {
        /* noop */
      }
      this.gameState = null
      this.filledGrid = []
      if (this.timerInterval) clearInterval(this.timerInterval)
      await this.fetchArchive()
      await this.fetchRankings()
    },

    async handleSubmit() {
      this.isLoading = true
      try {
        const res = await api.submitMotsFleches(this.filledGrid)
        if (res.data.valid) {
          this.finishTime = res.data.time
          this.finishClues = res.data.cluesSolved
          this.finishScore = res.data.score
          this.winDialog = true
          if (this.timerInterval) clearInterval(this.timerInterval)
        } else {
          this.errors = res.data.errors || []
          this.errorDialog = true
        }
      } catch (e) {
        console.error('submit failed', e)
      } finally {
        this.isLoading = false
      }
    },

    closeWin() {
      this.winDialog = false
      this.gameState = null
      this.filledGrid = []
      this.fetchRankings()
      this.fetchArchive()
    },
  },
}
</script>

<style scoped>
.mf-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.mf-layout {
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.mf-board {
  display: grid;
  gap: 1px;
  background: #444;
  border: 2px solid #888;
  border-radius: 6px;
  overflow: hidden;
  width: 100%;
}
.mf-cell {
  background: #5218f6;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  user-select: none;
  color: white;
  border: none;
  outline: none;
  padding: 0;
  text-align: center;
  min-width: 0;
  min-height: 0;
}
.mf-black {
  background: #111;
}
.mf-def {
  background: #5218f644;
  font-size: clamp(0.4rem, 0.9vw, 0.6rem);
  padding: 2px;
  line-height: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: help;
}
.mf-def-text {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 3px;
  overflow: hidden;
}
.mf-def-line {
  width: 100%;
  color: #e3e3e3;
  font-size: inherit;
  hyphens: auto;
  overflow: hidden;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  text-align: left;
}
.mf-def-line + .mf-def-line {
  border-top: 1px solid #aaa;
  padding-top: 2px;
  margin-top: 1px;
}
.mf-input-wrap {
  background: #fefefe;
  position: relative;
}
.mf-input {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  background: transparent;
  border: none;
  outline: none;
  text-align: center;
  text-transform: uppercase;
  color: #111;
  font-weight: 700;
  font-size: clamp(0.9rem, 2.6vw, 1.5rem);
  caret-color: #1976d2;
  padding: 0;
  box-sizing: border-box;
}
.mf-input:focus {
  background: #c5dafc;
}
.mf-error {
  background: #ffb3b3 !important;
  color: #8b0000;
}
/* Arrows are rendered on the FIRST INPUT cell of each word,
   pointing INTO the cell from the side where the def cell sits. */
.mf-arrow {
  position: absolute;
  pointer-events: none;
  z-index: 2;
}
/* → : def on the left, word goes right → triangle on LEFT edge, pointing right */
.mf-arrow.arrow-right {
  left: 0px;
  top: 50%;
  width: 0;
  height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 7px solid #483874;
  transform: translateY(-50%);
}
/* ↓ : def above, word goes down → triangle on TOP edge, pointing down */
.mf-arrow.arrow-down {
  top: 0px;
  left: 50%;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 7px solid #483874;
  transform: translateX(-50%);
}
/* Bent arrow base: 14×14 corner indicator with a segment + a triangle head */
.mf-arrow.arrow-bent-h,
.mf-arrow.arrow-bent-v {
  width: 16px;
  height: 16px;
  top: 1px;
  left: 1px;
}
.mf-arrow.arrow-bent-h::before,
.mf-arrow.arrow-bent-v::before {
  content: '';
  position: absolute;
  background: #483874;
}
.mf-arrow.arrow-bent-h::after,
.mf-arrow.arrow-bent-v::after {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
}
/* ↳ : def is ABOVE this input cell, word goes right.
   Vertical segment from top, then arrow head exits right. */
.mf-arrow.arrow-bent-h::before {
  width: 1px;
  height: 9px;
  left: 4px;
  top: -1px;
}
.mf-arrow.arrow-bent-h::after {
  left: 4px;
  top: 5px;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 7px solid #483874;
}
/* ↱ : def is BELOW this input cell → flip vertically and anchor to bottom */
.mf-arrow.arrow-bent-h.arrow-bent-up {
  top: auto;
  bottom: 0px;
  transform: scaleY(-1);
}
/* ⤵ : def is to the LEFT of this input cell, word goes down.
   Horizontal segment from left, then arrow head exits down. */
.mf-arrow.arrow-bent-v::before {
  width: 9px;
  height: 2px;
  left: -1px;
  top: 3px;
}
.mf-arrow.arrow-bent-v::after {
  left: 5px;
  top: 3px;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 7px solid #483874;
}
/* ⤓ : def is to the RIGHT of this input cell → flip horizontally, anchor right */
.mf-arrow.arrow-bent-v.arrow-bent-mirror {
  left: auto;
  right: 0px;
  transform: scaleX(-1);
}
.mf-input {
  background: #fff;
  color: #111;
  caret-color: #1976d2;
  font-weight: 600;
}
.mf-input:focus {
  background: #c5dafc;
}
.mf-error {
  background: #ffb3b3 !important;
  color: #8b0000;
}
.mf-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5em;
}
.mf-timer {
  color: white;
  font-variant-numeric: tabular-nums;
}
.mf-archive-list {
  max-height: 240px;
  overflow-y: auto;
}
.loading-overlay {
  display: flex;
  justify-content: center;
  padding: 1em;
}
.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 12px;
}
.menu {
  display: flex;
}

@media (max-width: 730px) {
  .menu {
    flex-direction: column;
  }
}
</style>
