<template>
  <v-dialog :model-value="modelValue" persistent max-width="320">
    <v-card color="primary" style="border-radius: 15px; overflow: hidden">
      <!-- Title -->
      <v-card-title class="text-uppercase pt-4 pb-0">
        {{ title }}
      </v-card-title>
      <v-card-text class="px-4 pt-1 pb-0 font-weight-light">
        {{ message }}
      </v-card-text>

      <!-- ELO Change Section -->
      <v-card-text v-if="eloChange !== null" class="px-4 pt-3 pb-0">
        <div class="elo-section">
          <!-- ELO number change -->
          <div class="elo-change-row">
            <span class="elo-old">{{ oldElo }}</span>
            <v-icon size="18" class="mx-1">mdi-arrow-right</v-icon>
            <span class="elo-new">{{ newElo }}</span>
            <span
              :class="['elo-diff', eloChange > 0 ? 'gain' : eloChange < 0 ? 'loss' : 'neutral']"
            >
              {{ eloChange > 0 ? '+' : '' }}{{ eloChange }}
            </span>
          </div>

          <!-- Rank display -->
          <div class="rank-display" :class="{ 'rank-changed': rankChanged }">
            <!-- Rank transition animation -->
            <Transition :name="rankUp ? 'rank-up' : 'rank-down'" mode="out-in">
              <div :key="newRankLabel" class="rank-badge">
                <v-img
                  v-if="newRankIconSrc"
                  :src="newRankIconSrc"
                  width="40"
                  height="40"
                  class="rank-icon"
                >
                  <div class="rank-div-overlay">
                    <p>{{ newRankDivLabel }}</p>
                  </div>
                </v-img>
                <span class="rank-label" :style="{ color: newRankColorHex }">
                  {{ newRankLabel }}
                </span>
              </div>
            </Transition>

            <!-- Rank up/down badge -->
            <Transition name="badge-pop">
              <div
                v-if="rankChanged && showBadge"
                class="rank-change-badge"
                :class="rankUp ? 'up' : 'down'"
              >
                <v-icon size="16">{{
                  rankUp ? 'mdi-arrow-up-bold' : 'mdi-arrow-down-bold'
                }}</v-icon>
                {{ rankUp ? 'Rank Up!' : 'Rank Down' }}
              </div>
            </Transition>
          </div>
        </div>
      </v-card-text>

      <!-- Placement info -->
      <v-card-text v-if="isPlacement" class="px-4 pt-2 pb-0 text-caption" style="opacity: 0.7">
        Placement {{ gamesPlayed }}/5
      </v-card-text>

      <v-card-actions>
        <v-btn class="rounded-lg" text="Ok" variant="tonal" @click="$emit('close')"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { rankIcon, rankDiv, rankText, rankColor } from '@/utils/rank.js'

export default {
  name: 'GameOverDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '' },
    message: { type: String, default: '' },
    oldElo: { type: Number, default: null },
    newElo: { type: Number, default: null },
    gamesPlayed: { type: Number, default: null },
  },
  emits: ['close'],
  data() {
    return {
      showBadge: false,
    }
  },
  computed: {
    eloChange() {
      if (this.oldElo === null || this.newElo === null) return null
      return this.newElo - this.oldElo
    },
    isPlacement() {
      return this.gamesPlayed !== null && this.gamesPlayed <= 5
    },
    oldRankLabel() {
      return rankText(this.oldElo)
    },
    newRankLabel() {
      return rankText(this.newElo)
    },
    newRankIconSrc() {
      return rankIcon(this.newElo)
    },
    newRankDivLabel() {
      return rankDiv(this.newElo)
    },
    newRankColorHex() {
      return rankColor(this.newElo)
    },
    rankChanged() {
      return this.oldRankLabel !== this.newRankLabel
    },
    rankUp() {
      return this.rankChanged && this.newElo > this.oldElo
    },
  },
  watch: {
    modelValue(open) {
      if (open && this.rankChanged) {
        this.showBadge = false
        setTimeout(() => {
          this.showBadge = true
        }, 400)
      }
    },
  },
}
</script>

<style scoped>
.elo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75em;
}

.elo-change-row {
  display: flex;
  align-items: center;
  gap: 0.25em;
  font-size: 1.1em;
}

.elo-old {
  opacity: 0.6;
}

.elo-new {
  font-weight: 700;
}

.elo-diff {
  font-weight: 700;
  font-size: 0.95em;
  margin-left: 0.5em;
  padding: 0.1em 0.5em;
  border-radius: 6px;
}

.elo-diff.gain {
  color: white;
  background: rgba(76, 175, 80, 0.9);
}

.elo-diff.loss {
  color: white;
  background: rgba(244, 67, 54, 0.9);
}

.elo-diff.neutral {
  color: #aaa;
  background: rgba(170, 170, 170, 0.15);
}

/* Rank display */
.rank-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4em;
  position: relative;
}

.rank-badge {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.rank-icon {
  flex-shrink: 0;
}

.rank-div-overlay {
  position: absolute;
  display: flex;
  width: 100%;
  height: 100%;
  place-items: center;
  place-content: center;
  font-size: 0.9em;
  color: #222;
  font-weight: 400;
}

.rank-label {
  color: white !important;
  font-weight: 700;
  font-size: 1.05em;
}

/* Rank changed shimmer */
.rank-display.rank-changed .rank-badge {
  animation: shimmer 1.5s ease-in-out;
}

@keyframes shimmer {
  0% {
    filter: brightness(1);
  }
  30% {
    filter: brightness(1.6) drop-shadow(0 0 8px currentColor);
  }
  100% {
    filter: brightness(1);
  }
}

/* Rank up transition */
.rank-up-enter-active {
  animation: slideUp 0.4s ease-out;
}
.rank-up-leave-active {
  animation: slideUp 0.3s ease-in reverse;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Rank down transition */
.rank-down-enter-active {
  animation: slideDown 0.4s ease-out;
}
.rank-down-leave-active {
  animation: slideDown 0.3s ease-in reverse;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Rank change badge */
.rank-change-badge {
  display: flex;
  align-items: center;
  gap: 0.3em;
  padding: 0.2em 0.7em;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85em;
  letter-spacing: 0.02em;
}

.rank-change-badge.up {
  color: white;
  background: rgba(76, 175, 80, 0.9);
}

.rank-change-badge.down {
  color: white;
  background: rgba(244, 67, 54, 0.9);
}

/* Badge pop-in animation */
.badge-pop-enter-active {
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.badge-pop-leave-active {
  animation: popIn 0.2s ease-in reverse;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
