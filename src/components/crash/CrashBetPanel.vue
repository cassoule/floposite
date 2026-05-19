<template>
  <div>
    <div
      v-if="room.status === 'betting' && isInRoom && !me?.inRound"
      class="d-flex flex-row align-center bet-panel pt-4 w-100"
      style="gap: 16px"
    >
      <v-slider
        v-model="bet"
        :min="room.minBet"
        :max="room.maxBet"
        :step="10"
        color="primary"
        class="flex-grow-1"
        thumb-label
        hide-details
      />
      <v-text-field
        v-model.number="bet"
        variant="outlined"
        rounded="lg"
        base-color="primary"
        type="number"
        density="compact"
        :max="room.maxBet"
        :min="room.minBet"
        label="Mise"
        style="max-width: 120px"
        hide-details
      />
      <v-text-field
        v-model.number="autoCashout"
        variant="outlined"
        rounded="lg"
        type="number"
        density="compact"
        label="Auto cashout"
        step="0.1"
        min="1.01"
        style="max-width: 130px"
        hide-details
      />
      <v-btn
        variant="flat"
        color="primary"
        :disabled="bet < room.minBet || bet > room.maxBet"
        rounded="lg"
        @click="$emit('place-bet', { amount: bet, autoCashout })"
        >Miser</v-btn
      >
    </div>

    <div
      v-else-if="room.status === 'betting' && isInRoom && me?.inRound"
      class="d-flex justify-center align-center pt-4"
    >
      <v-chip color="white" variant="tonal" size="large">
        Mise de {{ formatAmount(me.betAmount) }} Flopos placée
        <span v-if="me.autoCashout"> &nbsp;·&nbsp;Auto {{ me.autoCashout.toFixed(2) }}x </span>
      </v-chip>
    </div>

    <div
      v-if="room.status === 'flying' && isInRoom && me?.inRound && !me?.cashedOut"
      class="d-flex justify-center align-center pt-4"
    >
      <v-btn
        color="primary"
        variant="flat"
        rounded="lg"
        class="px-10 text-none"
        @click="$emit('cashout')"
      >
        Encaisser&nbsp;·
        {{ formatAmount((me.betAmount * displayMultiplier).toFixed(2)) }}
        Flopos
      </v-btn>
    </div>

    <div
      v-else-if="room.status === 'flying' && isInRoom && me?.cashedOut"
      class="d-flex justify-center align-center pt-4"
    >
      <v-chip color="success" variant="flat" size="large">
        Encaissé à {{ me.betAmount > 0 ? (me.winAmount / me.betAmount).toFixed(2) : '?' }}x · +{{
          formatAmount(me.winAmount)
        }}
        Flopos
      </v-chip>
    </div>
  </div>
</template>

<script>
import { formatAmount } from '@/utils/format.js'

export default {
  name: 'CrashBetPanel',
  props: {
    room: Object,
    me: Object,
    isInRoom: Boolean,
    displayMultiplier: Number,
  },
  emits: ['place-bet', 'cashout'],
  data: () => ({
    bet: 100,
    autoCashout: null,
  }),
  methods: {
    formatAmount,
  },
}
</script>

<style scoped>
.bet-panel {
  gap: 0.75rem;
}
</style>
