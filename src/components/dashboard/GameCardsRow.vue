<template>
  <div>
    <div
      class="w-100 mt-5 d-flex flex-column align-start justify-center"
      style="gap: 0.5rem; position: relative; place-content: space-between"
    >
      <div
        class="d-flex justify-space-between rounded-xl w-100 px-2 pb-1"
        style="background: #dddddd22"
      >
        <v-chip-group
          v-model="gameCardsFilter"
          class="mb-0 pb-0 text-secondary"
          selected-class="text-white"
        >
          <v-chip size="small" :value="'1v1'" filter>1v1</v-chip>
          <v-chip size="small" :value="'Multi'" filter>Multi</v-chip>
          <v-chip size="small" :value="'Solo'" filter>Solo</v-chip>
          <v-chip size="small" :value="'Elo'" filter>Elo</v-chip>
          <v-chip size="small" :value="'Coins'" filter class="mr-0">Coins</v-chip>
        </v-chip-group>
        <v-btn
          :key="Date.now() + '-daily-reward'"
          class="text-none mt-2"
          color="primary"
          variant="tonal"
          style="border: 1px solid #5865f2; border-radius: 20px; height: 27px"
          :disabled="user?.dailyQueried"
          @click="$emit('daily-claim')"
        >
          <span
            v-if="user?.dailyQueried"
            style="font-size: 12px; font-variant-numeric: tabular-nums; color: white"
          >
            {{ dailyCountdown }}
          </span>
          <v-icon
            v-else
            class="mdi mdi-gift animate__animated animate__heartBeat animate__infinite animate__slow"
            size="18"
            color="white"
          ></v-icon>
        </v-btn>
      </div>
    </div>

    <div
      class="w-100 mt-2"
      style="
        display: flex;
        flex-direction: column;
        gap: 0rem;
        row-gap: 0rem;
        overflow-x: auto;
        flex-wrap: wrap;
        border-radius: 20px;
      "
    >
      <game-card
        v-for="game in games"
        :key="game.name"
        :game="game"
        :gameCardsFilter="gameCardsFilter"
        :SOTDRank="
          game.name === 'Solitaire'
            ? user?.solitaireOTDRank
            : game.name === 'Sudoku'
              ? user?.sudokuOTDRank
              : null
        "
      ></game-card>
    </div>
  </div>
</template>

<script>
import GameCard from '../GameCard.vue'
import 'animate.css'

export default {
  name: 'GameCardsRow',
  components: { GameCard },
  props: {
    user: { type: Object, default: null },
    games: { type: Array, default: () => [] },
  },
  emits: ['daily-claim'],
  data() {
    return {
      gameCardsFilter: null,
      dailyCountdown: '',
      dailyCountdownInterval: null,
    }
  },
  mounted() {
    this.startDailyCountdown()
  },
  beforeUnmount() {
    if (this.dailyCountdownInterval) {
      clearInterval(this.dailyCountdownInterval)
    }
  },
  methods: {
    startDailyCountdown() {
      const update = () => {
        const now = new Date()
        const midnight = new Date(now)
        midnight.setHours(24, 0, 0, 0)
        const diff = midnight - now
        const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
        this.dailyCountdown = `${h}:${m}:${s}`
      }
      update()
      this.dailyCountdownInterval = setInterval(update, 1000)
    },
  },
}
</script>
