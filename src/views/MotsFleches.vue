<template>
  <CoinsCounter v-if="userId" />
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
                  <div
                    v-if="getDefClues(r, c)"
                    class="mf-cell mf-def"
                    :title="defTitle(r, c)"
                    :style="{ '--mf-lines': defLineClamp(r, c) }"
                    @click="openDefSheet(r, c)"
                  >
                    <div class="mf-def-text">
                      <span v-for="(clue, idx) in getDefClues(r, c)" :key="idx" class="mf-def-line">
                        {{ clue.def }}
                      </span>
                    </div>
                  </div>
                  <!-- Black cell (no clue) -->
                  <div v-else-if="gameState.blackMask[r][c]" class="mf-cell mf-black"></div>
                  <!-- Input cell -->
                  <div
                    v-else
                    class="mf-cell mf-input-wrap"
                    :class="{ 'mf-active': activeWordCells.has(`${r},${c}`) }"
                  >
                    <span
                      v-for="(a, ai) in arrowsAtStart[`${r},${c}`] || []"
                      :key="`a${ai}`"
                      class="mf-arrow"
                      :class="arrowClass(a.arrow)"
                      :style="arrowStyle(a)"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      class="mf-input"
                      :class="{ 'mf-error': isError(r, c), 'mf-revealed': isRevealed(r, c) }"
                      :readonly="isRevealed(r, c)"
                      :data-r="r"
                      :data-c="c"
                      :value="filledGrid[r] && filledGrid[r][c]"
                      @input="onInput($event, r, c)"
                      @keydown="onKey($event, r, c)"
                      @focus="onFocus(r, c)"
                      @click="onCellClick(r, c)"
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
              <div class="d-flex flex-wrap justify-center align-center" style="gap: 0.75em">
                <v-btn
                  variant="flat"
                  color="white"
                  rounded="lg"
                  class="text-none"
                  :disabled="!canHint"
                  :loading="hintLoading"
                  @click="handleHint"
                >
                  <v-icon class="mdi mdi-lightbulb-on-outline mr-1" />
                  Indice<span v-if="gameState.isSOTD" class="ml-1">· 100&nbsp;Flopos</span>
                </v-btn>
                <v-btn
                  variant="flat"
                  color="primary"
                  rounded="lg"
                  class="text-none px-8"
                  :disabled="!isComplete"
                  @click="requestSubmit"
                >
                  Valider
                </v-btn>
              </div>
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
                    v-if="archivedGrids.length"
                    density="compact"
                    class="mf-archive-list"
                    bg-color="transparent"
                  >
                    <v-list-item
                      v-for="entry in archivedGrids"
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
                  <p v-else class="text-white">Aucune grille archivée pour l'instant.</p>
                </v-card-text>
              </v-card>
            </div>
          </v-alert>
        </div>

        <div v-if="!gameState" class="my-16">
          <v-alert variant="tonal" color="secondary" rounded="xl">
            <v-card
              v-if="rankings"
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

      <RegisterWelcomeModal
        v-model="welcomeDialog"
        :anonUsername="userName"
        @quit="closeWelcomeAndShowStats"
        @register="closeWelcomeAndShowStats"
      />

      <SaveScoreDialog
        :visible="guestDialog"
        :submissionToken="pendingSubmissionToken"
        :finishTime="finishTime"
        game="mots-fleches"
        @close="guestDialog = false"
      />

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
            <p v-if="gameState?.isSOTD" class="text-medium-emphasis text-caption mt-2">
              Chaque validation échouée retire 1000 points au score de la grille du jour.
            </p>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="flat" color="primary" rounded="lg" @click="errorDialog = false">
              Corriger
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="confirmDialog" max-width="460">
        <v-card rounded="lg">
          <v-card-title>Valider la grille ?</v-card-title>
          <v-card-text>
            <p>
              Si une seule case est incorrecte, la validation échoue et ajoute un malus de
              <strong>1000 points</strong> au score (les cases fausses sont surlignées).
            </p>
            <div v-if="penaltySummary.total" class="mf-malus-recap mt-3">
              <div>Malus déjà accumulés :</div>
              <div v-if="penaltySummary.hints">
                {{ penaltySummary.hints }} indice(s) · −{{ penaltySummary.hintsPts }} pts
              </div>
              <div v-if="penaltySummary.fails">
                {{ penaltySummary.fails }} essai(s) raté(s) · −{{ penaltySummary.failsPts }} pts
              </div>
              <div class="font-weight-bold">Total : −{{ penaltySummary.total }} pts</div>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" rounded="lg" class="text-none" @click="confirmDialog = false">
              Annuler
            </v-btn>
            <v-btn
              variant="flat"
              color="primary"
              rounded="lg"
              class="text-none"
              @click="confirmSubmit"
            >
              Valider quand même
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-snackbar v-model="hintSnackbar" :timeout="3500" color="amber-darken-3" rounded="lg">
        {{ hintMessage }}
      </v-snackbar>

      <!-- Mobile: full definition text on tap (no hover available on touch) -->
      <v-bottom-sheet v-model="defSheetOpen">
        <v-card class="mf-def-sheet pa-4" rounded="t-xl">
          <div class="text-medium-emphasis text-caption mb-2">
            Définition{{ defSheetClues.length > 1 ? 's' : '' }}
          </div>
          <div v-for="(clue, i) in defSheetClues" :key="i" class="mf-def-sheet-item">
            <span class="mf-def-sheet-arrow">{{ clue.arrow }}</span>
            <span>{{ clue.def || '—' }}</span>
          </div>
        </v-card>
      </v-bottom-sheet>
    </v-main>

    <v-btn
      class="back-btn text-none"
      text="Retour"
      variant="tonal"
      color="#ddd"
      @click="gameState ? handleReset() : $router.push('/dashboard')"
    />

    <!-- Running tally of score penalties (grid of the day only). -->
    <div v-if="gameState && gameState.isSOTD" class="mf-malus">
      <div class="mf-malus-title">Malus du score</div>
      <div class="mf-malus-row">
        <span>Indices ({{ penaltySummary.hints }})</span>
        <span>−{{ penaltySummary.hintsPts }}</span>
      </div>
      <div class="mf-malus-row">
        <span>Essais ratés ({{ penaltySummary.fails }})</span>
        <span>−{{ penaltySummary.failsPts }}</span>
      </div>
      <div class="mf-malus-row mf-malus-total">
        <span>Total</span>
        <span>−{{ penaltySummary.total }}</span>
      </div>
    </div>
  </v-layout>
</template>

<script>
/* global localStorage, setInterval, setTimeout, clearInterval, clearTimeout */
import api from '../services/api'
import { getSocket } from '@/services/socket.js'
import CoinsCounter from '../components/CoinsCounter.vue'
import SaveScoreDialog from '../components/SaveScoreDialog.vue'
import RegisterWelcomeModal from '../components/dashboard/RegisterWelcomeModal.vue'

export default {
  name: 'MotsFleches',
  components: { CoinsCounter, SaveScoreDialog, RegisterWelcomeModal },
  data() {
    return {
      userId: null,
      gameId: null,
      isLoading: false,
      now: Date.now(),
      gameState: null,
      filledGrid: [],
      errors: [],
      errorDialog: false,
      winDialog: false,
      welcomeDialog: false,
      guestDialog: false,
      isNewUser: false,
      pendingSubmissionToken: null,
      finishTime: 0,
      finishClues: 0,
      finishScore: 0,
      rankings: [],
      archive: [],
      timerInterval: null,
      elapsedTime: 0,
      saveTimeout: null,
      activeDir: 'H',
      focused: null,
      defSheetOpen: false,
      defSheetClues: [],
      hintLoading: false,
      hintSnackbar: false,
      hintMessage: '',
      failedAttempts: 0,
      confirmDialog: false,
    }
  },
  computed: {
    userName() {
      return localStorage.getItem('discordUsername') || 'joueur'
    },
    todayParis() {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date())
    },
    archivedGrids() {
      return this.archive.filter((e) => e.date !== this.todayParis)
    },
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
    arrowsAtStart() {
      const map = {}
      if (!this.gameState?.defCells) return map
      for (const [cellKey, clues] of Object.entries(this.gameState.defCells)) {
        const [dr, dc] = cellKey.split(',').map(Number)
        const total = clues.length
        clues.forEach((clue, idx) => {
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
              return
          }
          const k = `${sr},${sc}`
          if (!map[k]) map[k] = []
          map[k].push({ arrow: clue.arrow, dir: clue.dir, idx, total })
        })
      }
      return map
    },
    wordAt() {
      const map = {}
      if (!this.gameState?.defCells || !this.gameState?.blackMask) return map
      const { rows, cols, blackMask } = this.gameState
      const isInput = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols && !blackMask[r][c]
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
          if (!isInput(sr, sc)) continue
          const dir = clue.dir === 'V' ? 'V' : 'H'
          const stepR = dir === 'V' ? 1 : 0
          const stepC = dir === 'H' ? 1 : 0
          const cells = []
          let r = sr
          let c = sc
          while (isInput(r, c)) {
            cells.push(`${r},${c}`)
            r += stepR
            c += stepC
          }
          const word = { cells, startKey: `${sr},${sc}` }
          for (const k of cells) {
            if (!map[k]) map[k] = {}
            map[k][dir] = word
          }
        }
      }
      return map
    },
    activeWordCells() {
      if (!this.focused) return new Set()
      const key = `${this.focused.r},${this.focused.c}`
      const cells = this.wordAt[key]?.[this.activeDir]?.cells
      return new Set(cells || [])
    },
    canHint() {
      if (!this.focused || !this.gameState || this.gameState.isDone || this.hintLoading) {
        return false
      }
      return !this.isRevealed(this.focused.r, this.focused.c)
    },
    penaltySummary() {
      const hints = this.gameState?.hintsUsed || 0
      const fails = this.failedAttempts || 0
      const hintsPts = hints * 500
      const failsPts = fails * 1000
      return { hints, fails, hintsPts, failsPts, total: hintsPts + failsPts }
    },
  },
  async mounted() {
    this.userId = localStorage.getItem('discordId')

    this.isLoading = true
    try {
      await Promise.all([this.fetchRankings(), this.fetchArchive()])
      if (this.userId) {
        this.initSocket()
        await this.fetchGameState()
        await this.claimPendingSubmission()
      }
    } catch (e) {
      console.error('mots-fleches load failed', e)
    }
    this.isLoading = false
  },
  beforeUnmount() {
    if (this.timerInterval) clearInterval(this.timerInterval)
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
      if (this.gameState && !this.gameState.isDone) this.saveProgress()
    }
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

    async claimPendingSubmission() {
      const stored = localStorage.getItem('mots-flechesPendingSubmission')
      if (!stored || !this.userId) return

      let data
      try {
        data = JSON.parse(stored)
      } catch {
        return
      }

      try {
        const response = await api.claimMotsFlechesSubmission(data.token)
        if (response.data.success) {
          this.finishTime = response.data.time
          this.finishClues = response.data.cluesSolved
          this.finishScore = response.data.score
          this.isNewUser = response.data.isNewUser || false
          if (this.isNewUser) {
            this.welcomeDialog = true
          } else {
            this.winDialog = true
          }
          localStorage.removeItem('mots-flechesPendingSubmission')
        }
      } catch (e) {
        console.error('Failed to claim mots fléchés submission:', e)
        localStorage.removeItem('mots-flechesPendingSubmission')
      }
    },

    initFilledGrid() {
      const { rows, cols } = this.gameState
      const saved = this.gameState.filledGrid
      if (Array.isArray(saved) && saved.length === rows) {
        this.filledGrid = Array.from({ length: rows }, (_, r) => {
          const row = Array.isArray(saved[r]) ? saved[r] : []
          return Array.from({ length: cols }, (__, c) => row[c] || '')
        })
      } else {
        this.filledGrid = Array.from({ length: rows }, () => Array(cols).fill(''))
      }
      this.errors = []
      this.failedAttempts = this.gameState.failedAttempts || 0
      if (!this.gameState.revealed) this.gameState.revealed = {}
    },

    getDefClues(r, c) {
      const arr = this.gameState?.defCells?.[`${r},${c}`]
      return arr && arr.length ? arr : null
    },

    defTitle(r, c) {
      const clues = this.getDefClues(r, c) || []
      return clues.map((cl) => `${cl.arrow} ${cl.def || ''}`).join('\n')
    },

    defLineClamp(r, c) {
      return (this.getDefClues(r, c) || []).length >= 2 ? 2 : 4
    },

    openDefSheet(r, c) {
      if (!this.$vuetify.display.mobile) return
      const clues = this.getDefClues(r, c)
      if (!clues) return
      this.defSheetClues = clues
      this.defSheetOpen = true
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
    arrowStyle(a) {
      if (!a || a.total <= 1) return null
      const centerPct = ((a.idx + 0.5) / a.total) * 100
      switch (a.arrow) {
        case '→':
          return { top: `${centerPct}%` }
        case '⤵':
        case '⤓':
          return { top: `calc(${centerPct}% - 8px)` }
        default:
          return null
      }
    },

    isError(r, c) {
      return this.errors.some((e) => e.r === r && e.c === c)
    },

    isRevealed(r, c) {
      return !!this.gameState?.revealed?.[`${r},${c}`]
    },

    showHintMessage(msg) {
      this.hintMessage = msg
      this.hintSnackbar = true
    },

    async handleHint() {
      if (!this.canHint) return
      const { r, c } = this.focused
      if (this.gameState.blackMask[r][c] || this.getDefClues(r, c)) return
      if (this.gameState.isSOTD && !this.userId) {
        this.showHintMessage('Connecte-toi pour utiliser un indice sur la grille du jour.')
        return
      }

      this.hintLoading = true
      try {
        const res = await api.hintMotsFleches(r, c, this.gameId)
        const letter = res.data.letter
        if (!this.filledGrid[r]) this.filledGrid[r] = []
        this.filledGrid[r][c] = letter
        this.errors = this.errors.filter((e) => !(e.r === r && e.c === c))
        if (!this.gameState.revealed) this.gameState.revealed = {}
        this.gameState.revealed[`${r},${c}`] = true
        if (typeof res.data.hintsUsed === 'number') this.gameState.hintsUsed = res.data.hintsUsed
        this.saveProgress()
        if (res.data.cost) this.showHintMessage(`Indice révélé · −${res.data.cost} FlopoCoins`)
      } catch (e) {
        this.showHintMessage(e?.response?.data?.error || "Indice indisponible pour l'instant.")
      } finally {
        this.hintLoading = false
      }
    },

    setCell(r, c, ch) {
      if (this.isRevealed(r, c)) return
      if (!this.filledGrid[r]) this.filledGrid[r] = []
      this.filledGrid[r][c] = ch
      this.errors = this.errors.filter((e) => !(e.r === r && e.c === c))
      this.scheduleSave()
    },

    onInput(ev, r, c) {
      if (this.isRevealed(r, c)) {
        ev.target.value = (this.filledGrid[r] && this.filledGrid[r][c]) || ''
        return
      }
      const source = ev.data != null ? ev.data : ev.target.value || ''
      const ch = source
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(-1)
      this.setCell(r, c, ch)
      ev.target.value = ch
      if (ch) this.focusNext(r, c)
    },

    onKey(ev, r, c) {
      if (
        ev.key &&
        ev.key.length === 1 &&
        /^[a-zA-Z]$/.test(ev.key) &&
        !ev.ctrlKey &&
        !ev.metaKey &&
        !ev.altKey
      ) {
        ev.preventDefault()
        this.setCell(r, c, ev.key.toUpperCase())
        this.focusNext(r, c)
        return
      }

      if (ev.key === 'Backspace') {
        ev.preventDefault()
        if (!this.isRevealed(r, c) && this.filledGrid[r] && this.filledGrid[r][c]) {
          this.setCell(r, c, '')
        } else {
          this.focusPrev(r, c)
        }
        return
      }

      if (ev.key === 'ArrowRight') {
        ev.preventDefault()
        this.activeDir = 'H'
        this.focusOffset(r, c, 0, 1)
      } else if (ev.key === 'ArrowLeft') {
        ev.preventDefault()
        this.activeDir = 'H'
        this.focusOffset(r, c, 0, -1)
      } else if (ev.key === 'ArrowDown') {
        ev.preventDefault()
        this.activeDir = 'V'
        this.focusOffset(r, c, 1, 0)
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault()
        this.activeDir = 'V'
        this.focusOffset(r, c, -1, 0)
      }
    },

    onFocus(r, c) {
      if (this._programmaticFocus) {
        this.focused = { r, c }
        return
      }
      const key = `${r},${c}`
      const w = this.wordAt[key] || {}
      const dirs = []
      if (w.H) dirs.push('H')
      if (w.V) dirs.push('V')
      if (dirs.length === 1) {
        this.activeDir = dirs[0]
      } else if (dirs.length === 2) {
        const startDirs = new Set((this.arrowsAtStart[key] || []).map((a) => a.dir))
        if (startDirs.size === 1) {
          this.activeDir = [...startDirs][0]
        } else if (!dirs.includes(this.activeDir)) {
          this.activeDir = dirs[0]
        }
      }
      this.focused = { r, c }
      this._suppressToggleClick = true
    },

    onCellClick(r, c) {
      if (this._suppressToggleClick) {
        this._suppressToggleClick = false
        return
      }
      const w = this.wordAt[`${r},${c}`] || {}
      if (w.H && w.V) {
        this.activeDir = this.activeDir === 'H' ? 'V' : 'H'
      }
    },

    focusNext(r, c) {
      const dr = this.activeDir === 'V' ? 1 : 0
      const dc = this.activeDir === 'H' ? 1 : 0
      this.focusOffset(r, c, dr, dc, true)
    },

    focusPrev(r, c) {
      const dr = this.activeDir === 'V' ? -1 : 0
      const dc = this.activeDir === 'H' ? -1 : 0
      this.focusOffset(r, c, dr, dc, true)
    },

    focusOffset(r, c, dr, dc, skipRevealed = false) {
      const { rows, cols, blackMask } = this.gameState
      let nr = r + dr
      let nc = c + dc
      while (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (!blackMask[nr][nc] && !(skipRevealed && this.isRevealed(nr, nc))) {
          const tr = nr
          const tc = nc
          this.$nextTick(() => {
            const el = document.querySelector(`.mf-board .mf-input[data-r='${tr}'][data-c='${tc}']`)
            if (el) {
              this._programmaticFocus = true
              el.focus()
              el.select?.()
              this._programmaticFocus = false
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
        await api.saveMotsFlechesProgress(this.filledGrid, this.gameId)
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
        this.gameId = res.data.gameId || null
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
        this.gameId = res.data.gameId || null
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
        await api.resetMotsFleches(this.gameId)
      } catch {
        /* noop */
      }
      this.gameState = null
      this.gameId = null
      this.filledGrid = []
      if (this.timerInterval) clearInterval(this.timerInterval)
      await this.fetchArchive()
      await this.fetchRankings()
    },

    requestSubmit() {
      if (this.gameState?.isSOTD) {
        this.confirmDialog = true
      } else {
        this.handleSubmit()
      }
    },

    confirmSubmit() {
      this.confirmDialog = false
      this.handleSubmit()
    },

    async handleSubmit() {
      this.isLoading = true
      try {
        const res = await api.submitMotsFleches(this.filledGrid, this.gameId)
        if (res.data.valid) {
          this.finishTime = res.data.time
          this.finishClues = res.data.cluesSolved
          this.finishScore = res.data.score
          if (this.timerInterval) clearInterval(this.timerInterval)
          if (!this.userId && res.data.submissionToken) {
            this.pendingSubmissionToken = res.data.submissionToken
            this.guestDialog = true
          } else {
            this.winDialog = true
          }
        } else {
          this.errors = res.data.errors || []
          if (typeof res.data.failedAttempts === 'number') {
            this.failedAttempts = res.data.failedAttempts
          }
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
      this.gameId = null
      this.filledGrid = []
      this.fetchRankings()
      this.fetchArchive()
    },

    closeWelcomeAndShowStats() {
      this.welcomeDialog = false
      this.winDialog = true
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
  max-width: min(1100px, calc((100vh - 240px) * 11 / 9));
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
  font-size: clamp(0.45rem, 0.95vw, 0.65rem);
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
  justify-content: flex-start;
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
  line-clamp: var(--mf-lines, 3);
  -webkit-line-clamp: var(--mf-lines, 3);
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

.mf-input-wrap.mf-active .mf-input {
  background: #e7eefc;
}
.mf-input-wrap .mf-input:focus {
  background: #c5dafc;
}
.mf-def-sheet-item {
  display: flex;
  gap: 0.6em;
  align-items: baseline;
  padding: 0.5em 0;
  font-size: 1rem;
  line-height: 1.45;
}
.mf-def-sheet-item + .mf-def-sheet-item {
  border-top: 1px solid #e0e0e0;
}
.mf-def-sheet-arrow {
  font-size: 1.15rem;
  flex-shrink: 0;
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

.mf-revealed {
  background: #ffe9a8 !important;
  color: #7a5200 !important;
}
.mf-input-wrap .mf-revealed:focus {
  background: #ffe08a !important;
}
.mf-malus {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  z-index: 5;
  min-width: 175px;
  padding: 0.6rem 0.75rem;
  border-radius: 12px;
  background: rgba(20, 12, 40, 0.85);
  border: 1px solid #ddd;
  color: #aaa;
  font-size: 0.78rem;
  backdrop-filter: blur(4px);
}
.mf-malus-title {
  display: flex;
  align-items: center;
  font-weight: 700;
  margin-bottom: 0.35rem;
  color: #ddd;
}
.mf-malus-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}
.mf-malus-total {
  margin-top: 0.3rem;
  padding-top: 0.3rem;
  border-top: 1px solid #aaaaaa77;
  font-weight: 700;
  color: #eee;
}
.mf-malus-recap {
  font-size: 0.85rem;
  color: #777;
}
@media (max-width: 730px) {
  .mf-malus {
    min-width: 0;
    font-size: 0.7rem;
    padding: 0.45rem 0.55rem;
    opacity: 0.92;
  }
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
  .mf-layout {
    max-width: 100%;
  }
}
</style>
