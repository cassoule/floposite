<template>
  <div class="end-screen-overlay">
    <div class="end-screen-content">
      <!-- Victory Banner -->
      <div class="victory-banner" :class="winnerTeam">
        <div class="victory-icon">{{ winnerIcon }}</div>
        <h1 class="victory-title">{{ victoryTitle }}</h1>
        <p class="victory-subtitle">{{ victorySubtitle }}</p>
      </div>

      <!-- Your Result -->
      <div class="your-result" :class="{ winner: didWin, loser: !didWin }">
        <div class="result-icon">{{ didWin ? '🏆' : '💔' }}</div>
        <div class="result-text">
          <span class="result-title">{{ didWin ? 'Victoire!' : 'Defaite' }}</span>
          <span class="result-role">Vous etiez: {{ myPlayer?.role?.name }}</span>
        </div>
      </div>

      <!-- All Players Reveal -->
      <div class="players-reveal">
        <h3>Roles reveles</h3>
        <div class="players-grid">
          <div
            v-for="player in sortedPlayers"
            :key="player.userId"
            class="reveal-card"
            :class="{
              winner: isWinner(player),
              dead: !player.isAlive,
              'is-me': player.userId === myPlayer?.userId
            }"
          >
            <div class="reveal-avatar">
              {{ player.username?.charAt(0)?.toUpperCase() }}
            </div>
            <div class="reveal-info">
              <span class="reveal-name">{{ player.username }}</span>
              <div class="reveal-role" :class="player.team">
                <span class="role-icon">{{ getRoleIcon(player.role?.name) }}</span>
                <span>{{ player.role?.name }}</span>
              </div>
            </div>
            <div class="reveal-status">
              <span v-if="isWinner(player)" class="status-badge winner">🏆</span>
              <span v-else-if="!player.isAlive" class="status-badge dead">💀</span>
              <span v-else class="status-badge survivor">✓</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="stats-summary">
        <div class="stat-item">
          <span class="stat-value">{{ roomState?.turn || 0 }}</span>
          <span class="stat-label">Tours</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ deathCount }}</span>
          <span class="stat-label">Morts</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ survivorCount }}</span>
          <span class="stat-label">Survivants</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="end-actions">
        <v-btn
          color="purple"
          size="large"
          @click="$emit('leave')"
        >
          <v-icon left>mdi-exit-to-app</v-icon>
          Retour au Lobby
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'WerewolfEndScreen',

  props: {
    roomState: {
      type: Object,
      required: true
    },
    myPlayer: {
      type: Object,
      required: true
    }
  },

  emits: ['leave'],

  setup(props) {
    const winnerTeam = computed(() => {
      return props.roomState?.winnersTeam || 'villagers'
    })

    const winnerIcon = computed(() => {
      if (winnerTeam.value === 'werewolves') return '🐺'
      if (winnerTeam.value === 'neutral') return '🃏'
      return '🏘️'
    })

    const victoryTitle = computed(() => {
      if (winnerTeam.value === 'werewolves') return 'Les Loups-Garous gagnent!'
      if (winnerTeam.value === 'neutral') return 'Le Neutre gagne!'
      return 'Le Village gagne!'
    })

    const victorySubtitle = computed(() => {
      if (winnerTeam.value === 'werewolves') return 'Les loups ont devore le village...'
      if (winnerTeam.value === 'neutral') return 'Le farceur a survecu!'
      return 'Tous les loups ont ete elimines!'
    })

    const didWin = computed(() => {
      const myTeam = props.myPlayer?.team
      // Farceur wins differently
      if (props.myPlayer?.role?.name === 'Farceur') {
        return props.myPlayer?.isAlive || true // Simplified logic
      }
      return myTeam === winnerTeam.value
    })

    const sortedPlayers = computed(() => {
      if (!props.roomState?.players) return []

      return [...props.roomState.players].sort((a, b) => {
        // Winners first
        const aWinner = isWinner(a)
        const bWinner = isWinner(b)
        if (aWinner && !bWinner) return -1
        if (!aWinner && bWinner) return 1

        // Then alive players
        if (a.isAlive && !b.isAlive) return -1
        if (!a.isAlive && b.isAlive) return 1

        // Then by team
        if (a.team === 'werewolves' && b.team !== 'werewolves') return -1
        if (a.team !== 'werewolves' && b.team === 'werewolves') return 1

        return 0
      })
    })

    const deathCount = computed(() => {
      if (!props.roomState?.players) return 0
      return props.roomState.players.filter(p => !p.isAlive).length
    })

    const survivorCount = computed(() => {
      if (!props.roomState?.players) return 0
      return props.roomState.players.filter(p => p.isAlive).length
    })

    const isWinner = (player) => {
      if (player.role?.name === 'Farceur') {
        return player.isAlive // Simplified
      }
      return player.team === winnerTeam.value
    }

    const getRoleIcon = (roleName) => {
      const icons = {
        'Villageois': '👤',
        'Loup-Garou': '🐺',
        'Loup Alpha': '🐺',
        'Voyante': '👁️',
        'Gardien': '🛡️',
        'Sorciere': '🧪',
        'Chasseur': '🏹',
        'Maudit': '😈',
        'Farceur': '🃏'
      }
      return icons[roleName] || '❓'
    }

    return {
      winnerTeam,
      winnerIcon,
      victoryTitle,
      victorySubtitle,
      didWin,
      sortedPlayers,
      deathCount,
      survivorCount,
      isWinner,
      getRoleIcon
    }
  }
}
</script>

<style scoped>
.end-screen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.end-screen-content {
  max-width: 800px;
  width: 100%;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.victory-banner {
  text-align: center;
  padding: 40px 20px;
  border-radius: 20px;
  margin-bottom: 30px;
}

.victory-banner.villagers {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(56, 142, 60, 0.1));
  border: 2px solid rgba(76, 175, 80, 0.5);
}

.victory-banner.werewolves {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.3), rgba(183, 28, 28, 0.1));
  border: 2px solid rgba(244, 67, 54, 0.5);
}

.victory-banner.neutral {
  background: linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(103, 58, 183, 0.1));
  border: 2px solid rgba(156, 39, 176, 0.5);
}

.victory-icon {
  font-size: 5em;
  margin-bottom: 20px;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.victory-title {
  font-size: 2.5em;
  margin-bottom: 10px;
  color: white;
}

.victory-subtitle {
  font-size: 1.2em;
  color: #aaa;
}

.your-result {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 30px;
  border-radius: 15px;
  margin-bottom: 30px;
}

.your-result.winner {
  background: rgba(76, 175, 80, 0.2);
  border: 2px solid rgba(76, 175, 80, 0.4);
}

.your-result.loser {
  background: rgba(244, 67, 54, 0.2);
  border: 2px solid rgba(244, 67, 54, 0.4);
}

.result-icon {
  font-size: 3em;
}

.result-text {
  display: flex;
  flex-direction: column;
}

.result-title {
  font-size: 1.5em;
  font-weight: bold;
}

.result-role {
  color: #aaa;
}

.players-reveal {
  margin-bottom: 30px;
}

.players-reveal h3 {
  margin-bottom: 15px;
  color: #ccc;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.reveal-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.reveal-card.winner {
  border: 2px solid rgba(76, 175, 80, 0.5);
  background: rgba(76, 175, 80, 0.1);
}

.reveal-card.dead {
  opacity: 0.6;
}

.reveal-card.is-me {
  border: 2px solid rgba(156, 39, 176, 0.5);
}

.reveal-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #bb86fc, #6200ea);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.reveal-info {
  flex: 1;
  min-width: 0;
}

.reveal-name {
  display: block;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reveal-role {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85em;
}

.reveal-role.villagers {
  color: #81c784;
}

.reveal-role.werewolves {
  color: #e57373;
}

.role-icon {
  font-size: 1em;
}

.reveal-status {
  flex-shrink: 0;
}

.status-badge {
  font-size: 1.2em;
}

.stats-summary {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 25px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  margin-bottom: 30px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2em;
  font-weight: bold;
  color: #bb86fc;
}

.stat-label {
  color: #888;
  font-size: 0.9em;
}

.end-actions {
  display: flex;
  justify-content: center;
}

@media (max-width: 600px) {
  .victory-banner {
    padding: 30px 15px;
  }

  .victory-icon {
    font-size: 3em;
  }

  .victory-title {
    font-size: 1.8em;
  }

  .players-grid {
    grid-template-columns: 1fr;
  }

  .stats-summary {
    gap: 20px;
    flex-wrap: wrap;
  }
}
</style>
