<template>
  <div class="werewolf-lobby">
    <!-- Room Info Header -->
    <div class="lobby-header">
      <div class="room-info">
        <h2>
          Salle: <span class="room-code">{{ roomState?.roomId }}</span>
        </h2>
        <v-btn variant="text" size="small" @click="copyRoomCode" class="copy-btn">
          <v-icon small>mdi-content-copy</v-icon>
          Copier
        </v-btn>
      </div>
      <div class="lobby-config">
        <span
          >{{ roomState?.players?.length || 0 }}/{{
            roomState?.config?.maxPlayers || 10
          }}
          joueurs</span
        >
        <span class="config-item">
          <v-icon small>mdi-weather-night</v-icon>
          {{ formatDuration(roomState?.config?.nightDuration) }}
        </span>
        <span class="config-item">
          <v-icon small>mdi-white-balance-sunny</v-icon>
          {{ formatDuration(roomState?.config?.dayDuration) }}
        </span>
      </div>
    </div>

    <!-- Players Grid -->
    <div class="players-section">
      <h3>Joueurs</h3>
      <div class="players-grid">
        <div
          v-for="player in roomState?.players"
          :key="player.userId"
          class="player-card"
          :class="{
            'is-ready': player.isReady,
            'is-host': player.isHost,
            'is-me': player.userId === myPlayer?.userId,
          }"
        >
          <div class="player-avatar">
            <v-icon v-if="player.isHost" class="host-crown">mdi-crown</v-icon>
            <div v-if="!player.avatarUrl" class="avatar-circle">
              {{ player.username?.charAt(0)?.toUpperCase() || '?' }}
            </div>
            <div v-else class="avatar-circle" style="padding: 0; overflow: hidden">
              <v-img :src="player.avatarUrl" :alt="player.username" />
            </div>
          </div>
          <div class="player-info">
            <span class="player-name">{{ player.username }}</span>
            <div class="d-flex ga-1 flex-wrap">
              <span v-if="player.isHost" class="player-badge host">Hote</span>
              <span v-if="player.isReady" class="player-badge ready">Pret</span>
              <span v-if="player.userId === myPlayer?.userId" class="player-badge me">Vous</span>
            </div>
          </div>
        </div>

        <!-- Empty slots -->
        <div v-for="i in emptySlots" :key="'empty-' + i" class="player-card empty">
          <div class="player-avatar">
            <div class="avatar-circle empty">
              <v-icon>mdi-account-plus</v-icon>
            </div>
          </div>
          <div class="player-info">
            <span class="player-name">En attente...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Game Config Preview -->
    <div class="config-preview">
      <h3>Configuration</h3>
      <div class="config-grid">
        <div class="config-item-card">
          <v-icon>mdi-account-group</v-icon>
          <span>Min: {{ roomState?.config?.minPlayers || 4 }} joueurs</span>
        </div>
        <div class="config-item-card">
          <v-icon>mdi-weather-night</v-icon>
          <span>Nuit: {{ formatDuration(roomState?.config?.nightDuration) }}</span>
        </div>
        <div class="config-item-card">
          <v-icon>mdi-white-balance-sunny</v-icon>
          <span>Jour: {{ formatDuration(roomState?.config?.dayDuration) }}</span>
        </div>
        <div class="config-item-card">
          <v-icon>mdi-vote</v-icon>
          <span>Vote: {{ formatDuration(roomState?.config?.voteDuration) }}</span>
        </div>
        <div class="config-item-card">
          <v-icon>mdi-package-variant</v-icon>
          <span>Items: {{ roomState?.config?.enableItems ? 'Oui' : 'Non' }}</span>
        </div>
      </div>
    </div>

    <!-- Roles Preview -->
    <div class="roles-preview">
      <h3>Roles possibles</h3>
      <div class="roles-list">
        <div class="role-chip villager">
          <span class="role-icon">👤</span>
          <span>Villageois</span>
        </div>
        <div class="role-chip werewolf">
          <span class="role-icon">🐺</span>
          <span>Loup-Garou</span>
        </div>
        <div class="role-chip seer">
          <span class="role-icon">👁️</span>
          <span>Voyante</span>
        </div>
        <div class="role-chip guard">
          <span class="role-icon">🛡️</span>
          <span>Gardien</span>
        </div>
        <div class="role-chip witch">
          <span class="role-icon">🧪</span>
          <span>Sorciere</span>
        </div>
        <div class="role-chip hunter">
          <span class="role-icon">🏹</span>
          <span>Chasseur</span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="lobby-actions">
      <v-btn color="red" variant="outlined" @click="$emit('leave')">
        <v-icon left>mdi-exit-to-app</v-icon>
        Quitter
      </v-btn>

      <v-btn
        v-if="!isHost"
        :color="myPlayer?.isReady ? 'orange' : 'green'"
        @click="$emit('toggle-ready')"
      >
        <v-icon left>{{ myPlayer?.isReady ? 'mdi-close' : 'mdi-check' }}</v-icon>
        {{ myPlayer?.isReady ? 'Pas Pret' : 'Pret' }}
      </v-btn>

      <v-btn v-if="isHost" color="purple" :disabled="!canStartGame" @click="$emit('start')">
        <v-icon left>mdi-play</v-icon>
        Demarrer ({{ readyCount }}/{{ minPlayers }})
      </v-btn>
    </div>

    <!-- Waiting message -->
    <div v-if="!canStartGame" class="waiting-message">
      <v-progress-circular indeterminate color="purple" size="24"></v-progress-circular>
      <span>En attente de {{ minPlayers - readyCount }} joueur(s) pret(s)...</span>
    </div>

    <!-- Snackbar for copy -->
    <v-snackbar v-model="showCopied" :timeout="2000" color="success"> Code copie! </v-snackbar>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useWerewolf } from '@/composables/useWerewolf'

export default {
  name: 'WerewolfLobby',
  emits: ['leave', 'toggle-ready', 'start'],

  setup() {
    const { roomState, myPlayer, isHost, canStartGame } = useWerewolf()

    const showCopied = ref(false)

    const emptySlots = computed(() => {
      const current = roomState.value?.players?.length || 0
      const max = roomState.value?.config?.maxPlayers || 10
      return Math.max(0, Math.min(max - current, 6)) // Show max 6 empty slots
    })

    const readyCount = computed(() => {
      if (!roomState.value?.players) return 0
      return roomState.value.players.filter((p) => p.isReady || p.isHost).length
    })

    const minPlayers = computed(() => {
      return roomState.value?.config?.minPlayers || 2
    })

    const formatDuration = (ms) => {
      if (!ms) return '?'
      const seconds = Math.floor(ms / 1000)
      if (seconds < 60) return `${seconds}s`
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      if (remainingSeconds === 0) return `${minutes}min`
      return `${minutes}m${remainingSeconds}s`
    }

    const copyRoomCode = async () => {
      if (roomState.value?.roomId) {
        try {
          await navigator.clipboard.writeText(roomState.value.roomId)
          showCopied.value = true
        } catch (e) {
          console.error('Failed to copy:', e)
        }
      }
    }

    return {
      roomState,
      myPlayer,
      isHost,
      canStartGame,
      emptySlots,
      readyCount,
      minPlayers,
      showCopied,
      formatDuration,
      copyRoomCode,
    }
  },
}
</script>

<style scoped>
.werewolf-lobby {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.lobby-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.room-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.room-info h2 {
  margin: 0;
  font-size: 1.3em;
}

.room-code {
  color: #bb86fc;
  font-family: monospace;
  font-size: 1.2em;
}

.copy-btn {
  color: #888;
}

.lobby-config {
  display: flex;
  gap: 20px;
  color: #aaa;
  font-size: 0.9em;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.players-section {
  margin-bottom: 30px;
}

.players-section h3 {
  margin-bottom: 15px;
  color: #ddd;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.player-card.is-ready {
  background: rgba(76, 175, 80, 0.1);
  border-color: rgba(76, 175, 80, 0.3);
}

.player-card.is-host {
  border-color: rgba(255, 193, 7, 0.5);
}

.player-card.is-me {
  border-color: rgba(156, 39, 176, 0.5);
}

.player-card.empty {
  opacity: 0.5;
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.2);
}

.player-avatar {
  position: relative;
}

.host-crown {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  color: #ffc107;
  font-size: 20px;
}

.avatar-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #bb86fc, #6200ea);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3em;
  font-weight: bold;
}

.avatar-circle.empty {
  background: rgba(255, 255, 255, 0.1);
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.player-name {
  font-weight: 500;
}

.player-badge {
  font-size: 0.75em;
  padding: 2px 8px;
  border-radius: 10px;
  width: fit-content;
}

.player-badge.host {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.player-badge.ready {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.player-badge.me {
  background: rgba(156, 39, 176, 0.2);
  color: #bb86fc;
}

.config-preview {
  margin-bottom: 30px;
}

.config-preview h3 {
  margin-bottom: 15px;
  color: #ddd;
}

.config-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.config-item-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 0.9em;
  color: #aaa;
}

.roles-preview {
  margin-bottom: 30px;
}

.roles-preview h3 {
  margin-bottom: 15px;
  color: #ddd;
}

.roles-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.role-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 0.9em;
}

.role-chip.villager {
  background: rgba(76, 175, 80, 0.2);
  color: #81c784;
}

.role-chip.werewolf {
  background: rgba(244, 67, 54, 0.2);
  color: #e57373;
}

.role-chip.seer {
  background: rgba(156, 39, 176, 0.2);
  color: #ce93d8;
}

.role-chip.guard {
  background: rgba(33, 150, 243, 0.2);
  color: #64b5f6;
}

.role-chip.witch {
  background: rgba(103, 58, 183, 0.2);
  color: #b39ddb;
}

.role-chip.hunter {
  background: rgba(255, 152, 0, 0.2);
  color: #ffb74d;
}

.role-icon {
  font-size: 1.2em;
}

.lobby-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.waiting-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: #aaa;
}

@media (max-width: 600px) {
  .lobby-header {
    flex-direction: column;
    text-align: center;
  }

  .lobby-config {
    flex-wrap: wrap;
    justify-content: center;
  }

  .players-grid {
    grid-template-columns: 1fr;
  }
}
</style>
