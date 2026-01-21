<template>
  <div
    class="player-card"
    :class="{
      dead: !player.isAlive,
      'is-me': isMe,
      werewolf: showRole && player.team === 'werewolves',
      compact: compact
    }"
  >
    <div class="card-avatar">
      <div class="avatar-circle">
        {{ player.username?.charAt(0)?.toUpperCase() }}
      </div>
      <div v-if="!player.isAlive" class="death-overlay">
        <v-icon>mdi-skull</v-icon>
      </div>
    </div>

    <div class="card-info">
      <div class="card-header">
        <span class="player-name">{{ player.username }}</span>
        <span v-if="isMe" class="me-badge">Vous</span>
      </div>

      <div class="card-details">
        <!-- Role (if visible) -->
        <div v-if="showRole && player.role" class="role-display">
          <span class="role-icon">{{ getRoleIcon(player.role.name) }}</span>
          <span class="role-name">{{ player.role.name }}</span>
        </div>

        <!-- Lives and Armor -->
        <div v-if="player.isAlive && (player.lives || player.armor)" class="health-display">
          <span v-for="i in (player.lives || 1)" :key="'life-' + i" class="life-icon">❤️</span>
          <span v-if="player.armor" class="armor-icon">🛡️</span>
        </div>

        <!-- Status Effects -->
        <div v-if="player.statusEffects?.length > 0" class="status-effects">
          <span
            v-for="effect in player.statusEffects"
            :key="effect.type"
            class="effect-badge"
            :title="effect.type"
          >
            {{ getEffectIcon(effect.type) }}
          </span>
        </div>

        <!-- Vote count -->
        <div v-if="votes > 0" class="votes-display">
          <v-icon small color="red">mdi-vote</v-icon>
          <span>{{ votes }}</span>
        </div>
      </div>
    </div>

    <!-- Items (if any) -->
    <div v-if="player.items?.length > 0 && !compact" class="card-items">
      <span
        v-for="item in player.items"
        :key="item.id"
        class="item-badge"
        :title="item.name"
      >
        {{ getItemIcon(item.type) }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WerewolfPlayerCard',

  props: {
    player: {
      type: Object,
      required: true
    },
    isMe: {
      type: Boolean,
      default: false
    },
    showRole: {
      type: Boolean,
      default: false
    },
    votes: {
      type: Number,
      default: 0
    },
    compact: {
      type: Boolean,
      default: false
    }
  },

  setup() {
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

    const getEffectIcon = (effectType) => {
      const icons = {
        'protected': '🛡️',
        'silenced': '🤐',
        'revealed': '👁️',
        'poisoned': '☠️',
        'cursed': '😈'
      }
      return icons[effectType] || '✨'
    }

    const getItemIcon = (itemType) => {
      const icons = {
        'shield': '🛡️',
        'potion_life': '❤️',
        'potion_death': '☠️',
        'reveal': '👁️'
      }
      return icons[itemType] || '📦'
    }

    return {
      getRoleIcon,
      getEffectIcon,
      getItemIcon
    }
  }
}
</script>

<style scoped>
.player-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.player-card.compact {
  padding: 8px;
  gap: 8px;
}

.player-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.player-card.dead {
  opacity: 0.5;
}

.player-card.is-me {
  border-left: 3px solid #bb86fc;
}

.player-card.werewolf {
  border-left: 3px solid #f44336;
}

.card-avatar {
  position: relative;
  flex-shrink: 0;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #bb86fc, #6200ea);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1em;
}

.compact .avatar-circle {
  width: 32px;
  height: 32px;
  font-size: 0.9em;
}

.death-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.player-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.me-badge {
  font-size: 0.7em;
  padding: 2px 6px;
  background: rgba(156, 39, 176, 0.3);
  color: #bb86fc;
  border-radius: 8px;
}

.card-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.role-display {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85em;
  color: #aaa;
}

.role-icon {
  font-size: 1em;
}

.health-display {
  display: flex;
  gap: 2px;
  font-size: 0.8em;
}

.status-effects {
  display: flex;
  gap: 4px;
}

.effect-badge {
  font-size: 0.9em;
}

.votes-display {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85em;
  color: #f44336;
}

.card-items {
  display: flex;
  gap: 4px;
}

.item-badge {
  font-size: 0.9em;
  padding: 2px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
</style>
