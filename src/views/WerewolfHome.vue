<template>
  <v-layout class="w-100">
    <v-main
      class="d-flex justify-center flex-wrap flex-md-nowrap pt-16"
      style="place-items: start; place-content: start; gap: 2em"
    >
      <div class="werewolf-container">
        <!-- Header -->
        <div class="werewolf-header">
          <div class="header-left">
            <v-btn icon variant="text" @click="goBack" class="back-btn">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <h1 class="game-title">Erynies</h1>
          </div>
          <div class="header-right">
            <!-- <div class="connection-status" :class="{ connected: isConnected }">
              <span class="status-dot"></span>
              {{ isConnected ? 'Connecté' : 'Déconnecté' }}
            </div> -->
            <v-btn
              icon
              size="small"
              color="secondary"
              variant="tonal"
              @click="refreshRooms"
              :loading="refreshing"
            >
              <v-icon left>mdi-refresh</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- Error display -->
        <v-alert
          v-if="error"
          rounded="lg"
          type="error"
          class="error-alert"
          closable
          @click:close="error = null"
        >
          {{ error }}
        </v-alert>

        <!-- Main Content -->
        <div class="werewolf-content">
          <!-- Loading state -->
          <div v-if="!isConnected" class="loading-state">
            <v-progress-circular indeterminate color="purple" size="64"></v-progress-circular>
            <p>Connexion au serveur...</p>
          </div>

          <!-- Room List (when not in a room) -->
          <div v-else-if="!isInRoom" class="rooms-section">
            <div class="section-header">
              <h2>Parties disponibles</h2>
              <div class="header-actions">
                <v-btn color="primary" rounded="lg" variant="flat" @click="showCreateDialog = true">
                  <v-icon left>mdi-plus</v-icon>
                  Creer une partie
                </v-btn>
              </div>
            </div>

            <div v-if="availableRooms.length === 0" class="no-rooms">
              <v-icon size="64" color="grey">mdi-ghost-outline</v-icon>
              <p>Aucune partie disponible</p>
              <p class="hint">Creez une nouvelle partie pour commencer!</p>
            </div>

            <div v-else class="rooms-grid">
              <div v-for="room in availableRooms" :key="room.roomId" class="room-card">
                <div class="room-header">
                  <span class="room-id">{{ room.roomId }}</span>
                  <span class="room-status">En attente</span>
                </div>
                <div class="room-info">
                  <div class="info-row">
                    <v-icon small>mdi-account</v-icon>
                    <span>Hote: {{ room.hostUsername }}</span>
                  </div>
                  <div class="info-row">
                    <v-icon small>mdi-account-group</v-icon>
                    <span>{{ room.playerCount }}/{{ room.maxPlayers }} joueurs</span>
                  </div>
                </div>
                <v-btn
                  color="primary"
                  variant="flat"
                  rounded="lg"
                  block
                  @click="joinRoom(room.roomId)"
                  :disabled="room.playerCount >= room.maxPlayers"
                >
                  Rejoindre
                </v-btn>
              </div>
            </div>

            <!-- Join by code -->
            <div class="join-by-code">
              <v-text-field
                v-model="joinCode"
                label="Code de la salle"
                variant="outlined"
                rounded="lg"
                density="compact"
                hide-details
                @keyup.enter="joinByCode"
              ></v-text-field>
              <v-btn
                color="primary"
                variant="flat"
                rounded="lg"
                @click="joinByCode"
                :disabled="!joinCode"
              >
                Rejoindre
              </v-btn>
            </div>
          </div>

          <!-- Lobby (in room but game not started) -->
          <WerewolfLobby
            v-else-if="!isInGame"
            @leave="leaveRoom"
            @toggle-ready="toggleReady"
            @start="startGame"
          />

          <!-- Game (in progress) -->
          <WerewolfGame v-else @leave="leaveRoom" />
        </div>

        <!-- Create Room Dialog -->
        <v-dialog v-model="showCreateDialog" max-width="500" class="modals" rounded="lg">
          <v-card class="create-dialog modal-card text-white" rounded="lg">
            <v-card-title>Créer une partie</v-card-title>
            <v-card-text>
              <v-number-input
                v-model.number="newRoomConfig.maxPlayers"
                label="Nombre max de joueurs"
                type="number"
                min="2"
                max="20"
                controls="hidden"
                variant="outlined"
                density="compact"
                rounded="lg"
              ></v-number-input>
              <v-select
                v-model.number="newRoomConfig.nightDuration"
                :items="durationOptions"
                label="Duree de la nuit"
                variant="outlined"
                density="compact"
                rounded="lg"
              ></v-select>
              <v-select
                v-model.number="newRoomConfig.dayDuration"
                :items="dayDurationOptions"
                label="Duree du jour"
                variant="outlined"
                density="compact"
                rounded="lg"
              ></v-select>
              <v-checkbox
                v-model="newRoomConfig.enableItems"
                label="Activer les items"
                color="primary"
                density="compact"
                rounded="lg"
              ></v-checkbox>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn variant="text" rounded="lg" @click="showCreateDialog = false">Annuler</v-btn>
              <v-btn color="primary" variant="flat" rounded="lg" @click="handleCreateRoom">
                Créer
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>
    </v-main>
  </v-layout>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWerewolf } from '@/composables/useWerewolf'
import WerewolfLobby from '@/components/werewolf/WerewolfLobby.vue'
import WerewolfGame from '@/components/werewolf/WerewolfGame.vue'

export default {
  name: 'WerewolfHome',
  components: {
    WerewolfLobby,
    WerewolfGame,
  },

  setup() {
    const router = useRouter()
    const {
      isConnected,
      isInRoom,
      isInGame,
      availableRooms,
      error,
      connect,
      disconnect,
      createRoom,
      joinRoom,
      leaveRoom,
      toggleReady,
      startGame,
      refreshRooms,
    } = useWerewolf()

    // Local state
    const showCreateDialog = ref(false)
    const joinCode = ref('')
    const refreshing = ref(false)

    const newRoomConfig = ref({
      maxPlayers: 10,
      nightDuration: 90000,
      dayDuration: 180000,
      enableItems: true,
    })

    const durationOptions = [
      { title: '1 minute', value: 60000 },
      { title: '1.5 minutes', value: 90000 },
      { title: '2 minutes', value: 120000 },
    ]

    const dayDurationOptions = [
      { title: '2 minutes', value: 120000 },
      { title: '3 minutes', value: 180000 },
      { title: '5 minutes', value: 300000 },
    ]

    const goBack = () => {
      if (isInRoom.value) {
        leaveRoom()
      } else {
        router.push('/dashboard')
      }
    }

    const handleCreateRoom = () => {
      createRoom(newRoomConfig.value)
      showCreateDialog.value = false
    }

    const joinByCode = () => {
      if (joinCode.value) {
        joinRoom(joinCode.value.toUpperCase())
        joinCode.value = ''
      }
    }

    const handleRefreshRooms = async () => {
      refreshing.value = true
      refreshRooms()
      setTimeout(() => {
        refreshing.value = false
      }, 1000)
    }

    onMounted(() => {
      connect()
    })

    onUnmounted(() => {
      // Optionally disconnect when leaving the page
      // disconnect()
    })

    return {
      // State
      isConnected,
      isInRoom,
      isInGame,
      availableRooms,
      error,
      showCreateDialog,
      joinCode,
      refreshing,
      newRoomConfig,
      durationOptions,
      dayDurationOptions,

      // Methods
      goBack,
      handleCreateRoom,
      joinByCode,
      joinRoom,
      leaveRoom,
      toggleReady,
      startGame,
      refreshRooms: handleRefreshRooms,
    }
  },
}
</script>

<style scoped>
.werewolf-container {
  min-height: 100vh;
  background: transparent;
  color: white;
  padding: 20px;
}

.werewolf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-btn {
  color: white;
}

.game-title {
  font-size: 1.8em;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
}

.wolf-icon {
  font-size: 1.2em;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 0, 0, 0.2);
  border-radius: 20px;
  font-size: 0.9em;
}

.connection-status.connected {
  background: rgba(0, 255, 0, 0.2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4444;
}

.connected .status-dot {
  background: #44ff44;
}

.error-alert {
  margin-bottom: 20px;
}

.werewolf-content {
  max-width: 1400px;
  margin: 0 auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
}

.rooms-section {
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.section-header h2 {
  font-size: 1.5em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.no-rooms {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 15px;
  color: #888;
}

.no-rooms .hint {
  font-size: 0.9em;
  color: #666;
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.room-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.room-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(156, 39, 176, 0.5);
  transform: translateY(-2px);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.room-id {
  font-size: 1.2em;
  font-weight: bold;
  color: #bb86fc;
}

.room-status {
  font-size: 0.8em;
  padding: 4px 12px;
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  border-radius: 10px;
}

.room-info {
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #aaa;
  font-size: 0.9em;
}

.join-by-code {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 400px;
  margin: 30px auto 0;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.join-by-code .v-text-field {
  flex: 1;
}

.create-dialog {
  background: #1a1a2e !important;
}

.create-dialog .v-card-title {
  color: white;
}

@media (max-width: 600px) {
  .werewolf-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .header-left {
    flex-direction: column;
  }

  .section-header {
    flex-direction: column;
    text-align: center;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .join-by-code {
    flex-direction: column;
  }
}
</style>
