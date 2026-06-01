<template>
  <v-dialog :model-value="visible" persistent max-width="420">
    <v-card variant="flat" color="secondary" class="rounded-xl modal-card">
      <!-- Header avec icône trophée -->
      <v-card-item class="text-white pt-6 pb-0">
        <div class="d-flex align-center" style="gap: 10px">
          <v-icon size="32" color="warning">mdi-trophy</v-icon>
          <h2 class="text-h5 font-weight-bold">Bravo !</h2>
        </div>
      </v-card-item>
      <v-card-subtitle class="px-6 pt-2 text-secondary">
        Partie terminée avec succès
      </v-card-subtitle>

      <v-card-text class="text-secondary px-6">
        <!-- Statistiques -->
        <v-alert variant="tonal" color="white" class="rounded-xl mb-4 pa-4">
          <div class="d-flex flex-column" style="gap: 8px">
            <div class="d-flex align-center" style="gap: 12px">
              <v-icon size="28" color="primary">mdi-clock-outline</v-icon>
              <div>
                <div class="text-caption text-grey">Temps</div>
                <div class="text-h6 font-weight-bold text-white">{{ formattedTime }}</div>
              </div>
            </div>
            <div class="d-flex" style="gap: 24px">
              <div class="d-flex align-center" style="gap: 8px">
                <v-icon size="20" color="primary">mdi-counter</v-icon>
                <div>
                  <div class="text-caption text-grey">Coups</div>
                  <div class="text-body-1 font-weight-bold text-white">{{ moves || '—' }}</div>
                </div>
              </div>
              <div class="d-flex align-center" style="gap: 8px">
                <v-icon size="20" color="primary">mdi-star</v-icon>
                <div>
                  <div class="text-caption text-grey">Score</div>
                  <div class="text-body-1 font-weight-bold text-white">{{ score || '—' }}</div>
                </div>
              </div>
            </div>
          </div>
        </v-alert>

        <!-- Message -->
        <div class="text-center mb-2">
          <p class="text-white font-weight-bold text-body-1 mb-1">Gardez votre score</p>
          <p class="text-body-2 text-white">
            Connectez-vous pour sauvegarder votre score et apparaître dans le classement !
          </p>
        </div>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="d-flex flex-column px-6 pb-6" style="gap: 8px">
        <v-btn
          block
          variant="flat"
          color="#5865f2"
          class="rounded-lg text-none py-5"
          size="large"
          @click="handleLogin"
        >
          <template #prepend>
            <img
              src="/discord.svg"
              alt="Discord"
              style="height: 22px; filter: brightness(0) invert(1)"
            />
          </template>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { FLAPI_BASE } from '@/services/flapi.js'

export default {
  name: 'SaveScoreDialog',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    submissionToken: String,
    finishTime: Number,
    moves: Number,
    score: Number,
    isSOTD: {
      type: Boolean,
      default: false,
    },
    seed: {
      type: String,
      default: null,
    },
    game: {
      type: String,
      default: 'sudoku',
    },
  },
  emits: ['close'],
  computed: {
    formattedTime() {
      if (!this.finishTime) return '—'
      return this.formatFinishTime(this.finishTime)
    },
  },
  methods: {
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
    handleLogin() {
      const extra = {}
      if (this.game === 'solitaire') {
        extra.moves = this.moves
        extra.score = this.score
        extra.isSOTD = this.isSOTD
        extra.seed = this.seed
      }
      localStorage.setItem(
        `${this.game}PendingSubmission`,
        JSON.stringify({
          token: this.submissionToken,
          time: this.finishTime,
          ...extra,
        }),
      )
      localStorage.setItem('returnUrl', `/${this.game}`)
      window.location = FLAPI_BASE + '/auth/discord'
    },
  },
}
</script>

<style scoped>
.modal-card {
  position: relative;
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
