<template>
  <div class="player-selector">
    <div class="players-grid">
      <div
        v-for="player in players"
        :key="player.userId"
        class="player-option"
        :class="{
          selected: selected === player.userId,
          dead: !player.isAlive
        }"
        @click="selectPlayer(player)"
      >
        <div class="player-avatar">
          {{ player.username?.charAt(0)?.toUpperCase() }}
        </div>
        <div class="player-info">
          <span class="player-name">{{ player.username }}</span>
          <span v-if="showVotes && votes" class="player-votes">
            {{ getVotesFor(player.userId) }} vote(s)
          </span>
        </div>
        <div v-if="selected === player.userId" class="selected-indicator">
          <v-icon color="purple">mdi-check-circle</v-icon>
        </div>
        <div v-if="showVotes && votes" class="vote-bar">
          <div
            class="vote-fill"
            :style="{ width: getVotePercentage(player.userId) + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <div v-if="players.length === 0" class="no-players">
      Aucun joueur disponible
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'WerewolfPlayerSelector',

  props: {
    players: {
      type: Array,
      default: () => []
    },
    selected: {
      type: String,
      default: null
    },
    showVotes: {
      type: Boolean,
      default: false
    },
    votes: {
      type: Object,
      default: null
    }
  },

  emits: ['select'],

  setup(props, { emit }) {
    const totalVotes = computed(() => {
      if (!props.votes) return 0
      return Object.keys(props.votes).length
    })

    const getVotesFor = (playerId) => {
      if (!props.votes) return 0
      return Object.values(props.votes).filter(v => v === playerId).length
    }

    const getVotePercentage = (playerId) => {
      if (!totalVotes.value) return 0
      return (getVotesFor(playerId) / totalVotes.value) * 100
    }

    const selectPlayer = (player) => {
      if (!player.isAlive) return
      emit('select', player.userId)
    }

    return {
      getVotesFor,
      getVotePercentage,
      selectPlayer
    }
  }
}
</script>

<style scoped>
.player-selector {
  width: 100%;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.player-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.player-option:hover:not(.dead) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(156, 39, 176, 0.3);
}

.player-option.selected {
  border-color: #bb86fc;
  background: rgba(156, 39, 176, 0.1);
}

.player-option.dead {
  opacity: 0.4;
  cursor: not-allowed;
}

.player-avatar {
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

.player-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.player-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-votes {
  font-size: 0.8em;
  color: #888;
}

.selected-indicator {
  flex-shrink: 0;
}

.vote-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
}

.vote-fill {
  height: 100%;
  background: linear-gradient(90deg, #bb86fc, #ff4444);
  transition: width 0.3s ease;
}

.no-players {
  text-align: center;
  color: #666;
  padding: 20px;
  font-style: italic;
}
</style>
