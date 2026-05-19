<template>
  <v-card class="px-5 pt-3 pb-4 smooth-cards sidebar" variant="tonal" rounded="xl">
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="text-subtitle-2">
        <span class="font-weight-bold">Joueurs</span> ({{ room.players.length }})
      </div>
      <div class="text-caption" style="color: #777">
        Min: {{ formatAmount(room.minBet) }} · Max: {{ formatAmount(room.maxBet) }}
      </div>
    </div>
    <div class="players">
      <div v-for="p in room.players" :key="p.id" class="player d-flex align-start">
        <v-img :src="p.avatar" max-width="40px" rounded="circle" />
        <div class="player-info">
          <div class="top">
            <span class="name" :class="{ me: p.id === discordId }">{{ p.username }}</span>
            <v-chip size="x-small" variant="flat" :color="playerChipColor(p)">{{
              playerChipText(p)
            }}</v-chip>
          </div>
          <div class="meta">
            {{ formatAmount(p.bank) }}
            <span v-if="p.inRound"> · Mise: {{ formatAmount(p.betAmount) }}</span>
            <span v-if="p.autoCashout"> · Auto: {{ p.autoCashout.toFixed(2) }}x</span>
          </div>
          <div v-if="p.cashedOut" class="meta" style="color: #1d9e75">
            Encaissé à {{ (p.winAmount / p.betAmount).toFixed(2) }}x (+{{
              formatAmount(p.winAmount - p.betAmount)
            }})
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script>
import { formatAmount } from '@/utils/format.js'

export default {
  name: 'CrashPlayersSidebar',
  props: {
    room: Object,
    discordId: String,
  },
  methods: {
    formatAmount,
    playerChipText(p) {
      if (!p.inRound) return '—'
      if (p.cashedOut) return `${(p.winAmount / p.betAmount).toFixed(2)}x`
      if (this.room?.status === 'crashed' || this.room?.status === 'payout') return 'Crashé'
      if (this.room?.status === 'flying') return 'En vol'
      return 'En jeu'
    },
    playerChipColor(p) {
      if (!p.inRound) return 'default'
      if (p.cashedOut) return 'success'
      if (this.room?.status === 'crashed' || this.room?.status === 'payout') return 'error'
      if (this.room?.status === 'flying') return 'primary'
      return 'default'
    },
  },
}
</script>

<style scoped>
.smooth-cards {
  transition: 0.5s ease-in-out;
}
.sidebar {
  min-height: 100px;
  max-height: 450px;
}
.players {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  max-height: 360px;
}
.player {
  gap: 0.75rem;
}
.player .player-info {
  flex: 1;
}
.player .top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.player .name {
  font-weight: 600;
  opacity: 0.95;
}
.player .me {
  color: #5865f2;
}
.player .meta {
  font-size: 0.8rem;
  opacity: 0.7;
}
</style>
