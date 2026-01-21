<template>
  <div class="werewolf-game">
    <!-- Game Header -->
    <div class="game-header">
      <div class="phase-info">
        <div class="phase-icon" :class="currentPhase">
          {{ phaseIcon }}
        </div>
        <div class="phase-details">
          <span class="phase-name">{{ phaseName }}</span>
          <span class="turn-info">Tour {{ currentTurn }}</span>
        </div>
      </div>

      <div class="timer-display" v-if="timeRemaining > 0">
        <v-progress-circular
          :model-value="timerProgress"
          :size="60"
          :width="4"
          :color="timerColor"
        >
          {{ timeRemaining }}s
        </v-progress-circular>
      </div>

      <div class="player-status">
        <div class="my-role" v-if="myPlayer?.role">
          <span class="role-icon">{{ getRoleIcon(myPlayer.role.name) }}</span>
          <span class="role-name">{{ myPlayer.role.name }}</span>
          <span class="team-badge" :class="myPlayer.team">{{ myPlayer.team === 'werewolves' ? 'Loup' : 'Village' }}</span>
        </div>
        <div class="lives-display" v-if="myPlayer">
          <span v-for="i in myPlayer.lives" :key="'life-' + i" class="life-heart">❤️</span>
          <span v-if="myPlayer.armor" class="armor-shield">🛡️</span>
        </div>
      </div>
    </div>

    <!-- Main Game Area -->
    <div class="game-main">
      <!-- 3D Scene -->
      <div ref="threeContainer" class="three-container"></div>

      <!-- Player Circle Overlay (2D fallback / additional info) -->
      <div class="players-overlay">
        <div
          v-for="(player, index) in roomState?.players"
          :key="player.userId"
          class="player-marker"
          :class="{
            dead: !player.isAlive,
            selected: selectedTarget === player.userId,
            werewolf: canSeeWerewolves && player.team === 'werewolves',
            me: player.userId === myPlayer?.userId
          }"
          :style="getPlayerPosition(index, roomState?.players?.length)"
          @click="handlePlayerClick(player)"
        >
          <div class="marker-avatar">
            {{ player.username?.charAt(0)?.toUpperCase() }}
          </div>
          <div class="marker-name">{{ player.username }}</div>
          <div v-if="!player.isAlive" class="death-marker">💀</div>
          <div v-if="player.isProtected" class="protection-marker">🛡️</div>
          <div v-if="getVotesFor(player.userId) > 0" class="vote-count">
            {{ getVotesFor(player.userId) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Action Panel -->
    <div class="action-panel" :class="currentPhase">
      <!-- Night Phase Actions -->
      <div v-if="currentPhase === 'night' && canAct" class="night-actions">
        <h3>{{ getNightActionTitle() }}</h3>
        <p class="action-hint">{{ getNightActionHint() }}</p>

        <WerewolfPlayerSelector
          v-if="nightAbility"
          :players="getSelectablePlayers()"
          :selected="selectedTarget"
          @select="handleNightAction"
        />

        <div v-if="actionSubmitted" class="action-submitted">
          <v-icon color="green">mdi-check-circle</v-icon>
          Action enregistree
        </div>
      </div>

      <!-- Day Phase -->
      <div v-else-if="currentPhase === 'day'" class="day-phase">
        <h3>Phase de Discussion</h3>
        <p>Discutez pour trouver les loups-garous!</p>
      </div>

      <!-- Voting Phase -->
      <div v-else-if="currentPhase === 'voting' && canAct" class="voting-actions">
        <h3>Vote d'elimination</h3>
        <p>Choisissez qui eliminer</p>

        <WerewolfPlayerSelector
          :players="alivePlayers.filter(p => p.userId !== myPlayer?.userId)"
          :selected="selectedTarget"
          :show-votes="true"
          :votes="roomState?.votes"
          @select="handleVote"
        />

        <v-btn
          color="grey"
          variant="outlined"
          @click="handleSkipVote"
          class="skip-vote-btn"
        >
          Passer mon vote
        </v-btn>
      </div>

      <!-- Dead Player View -->
      <div v-else-if="!myPlayer?.isAlive" class="dead-view">
        <h3>Vous etes mort 💀</h3>
        <p>Vous pouvez observer la partie et parler aux autres morts.</p>
      </div>

      <!-- Waiting -->
      <div v-else class="waiting-view">
        <v-progress-circular indeterminate color="purple" size="32"></v-progress-circular>
        <span>En attente...</span>
      </div>
    </div>

    <!-- Sidebar -->
    <div class="game-sidebar">
      <!-- Players List -->
      <div class="sidebar-section players-list">
        <h4>Joueurs ({{ alivePlayers.length }}/{{ roomState?.players?.length }})</h4>
        <div class="players-scroll">
          <WerewolfPlayerCard
            v-for="player in roomState?.players"
            :key="player.userId"
            :player="player"
            :is-me="player.userId === myPlayer?.userId"
            :show-role="!player.isAlive || currentPhase === 'ended'"
            :votes="getVotesFor(player.userId)"
            compact
          />
        </div>
      </div>

      <!-- Events Log -->
      <div class="sidebar-section events-log">
        <h4>Evenements</h4>
        <div class="events-scroll">
          <div
            v-for="(event, index) in recentEvents"
            :key="index"
            class="event-item"
            :class="event.type"
          >
            {{ event.message }}
          </div>
        </div>
      </div>

      <!-- Chat -->
      <WerewolfChat
        :messages="chatMessages"
        :channels="availableChannels"
        @send="sendChatMessage"
      />
    </div>

    <!-- End Screen -->
    <WerewolfEndScreen
      v-if="currentPhase === 'ended'"
      :room-state="roomState"
      :my-player="myPlayer"
      @leave="$emit('leave')"
    />

    <!-- Seer Vision Modal -->
    <v-dialog v-model="showSeerVision" max-width="400">
      <v-card class="seer-vision-card">
        <v-card-title>
          <v-icon color="purple">mdi-eye</v-icon>
          Vision de la Voyante
        </v-card-title>
        <v-card-text v-if="seerVision">
          <div class="vision-result">
            <div class="vision-target">{{ seerVision.target }}</div>
            <div class="vision-role" :class="seerVision.team">
              {{ seerVision.role }}
            </div>
            <div class="vision-team">
              Equipe: {{ seerVision.team === 'werewolves' ? 'Loups-Garous' : 'Village' }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="purple" @click="showSeerVision = false">Compris</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { useWerewolf } from '@/composables/useWerewolf'
import WerewolfChat from './WerewolfChat.vue'
import WerewolfPlayerSelector from './WerewolfPlayerSelector.vue'
import WerewolfPlayerCard from './WerewolfPlayerCard.vue'
import WerewolfEndScreen from './WerewolfEndScreen.vue'

export default {
  name: 'WerewolfGame',
  components: {
    WerewolfChat,
    WerewolfPlayerSelector,
    WerewolfPlayerCard,
    WerewolfEndScreen
  },
  emits: ['leave'],

  setup() {
    const {
      roomState,
      myPlayer,
      chatMessages,
      gameEvents,
      seerVision,
      currentPhase,
      currentTurn,
      alivePlayers,
      canAct,
      nightAbility,
      availableChannels,
      performNightAction,
      vote,
      skipVote,
      sendChatMessage
    } = useWerewolf()

    // Local state
    const threeContainer = ref(null)
    const selectedTarget = ref(null)
    const actionSubmitted = ref(false)
    const showSeerVision = ref(false)
    const timeRemaining = ref(0)
    let timerInterval = null

    // Three.js variables
    let scene, camera, renderer, controls
    let playerMeshes = []

    // Phase info
    const phaseIcon = computed(() => {
      const icons = {
        night: '🌙',
        day: '☀️',
        voting: '🗳️',
        ended: '🏁'
      }
      return icons[currentPhase.value] || '❓'
    })

    const phaseName = computed(() => {
      const names = {
        night: 'Nuit',
        day: 'Jour',
        voting: 'Vote',
        ended: 'Fin'
      }
      return names[currentPhase.value] || currentPhase.value
    })

    const timerProgress = computed(() => {
      const total = getPhaseDuration()
      if (!total) return 0
      return (timeRemaining.value / (total / 1000)) * 100
    })

    const timerColor = computed(() => {
      if (timeRemaining.value <= 10) return 'red'
      if (timeRemaining.value <= 30) return 'orange'
      return 'green'
    })

    const recentEvents = computed(() => {
      return [...gameEvents.value].reverse().slice(0, 20)
    })

    const canSeeWerewolves = computed(() => {
      return myPlayer.value?.team === 'werewolves' && myPlayer.value?.isAlive
    })

    // Watch for seer vision
    watch(seerVision, (newVision) => {
      if (newVision) {
        showSeerVision.value = true
      }
    })

    // Watch for phase changes to reset state
    watch(currentPhase, () => {
      selectedTarget.value = null
      actionSubmitted.value = false
      updateTimer()
    })

    // Methods
    const getPhaseDuration = () => {
      if (!roomState.value?.config) return 60000
      switch (currentPhase.value) {
        case 'night': return roomState.value.config.nightDuration
        case 'day': return roomState.value.config.dayDuration
        case 'voting': return roomState.value.config.voteDuration
        default: return 60000
      }
    }

    const updateTimer = () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }

      const endTime = roomState.value?.phaseEndTime
      if (!endTime) {
        timeRemaining.value = Math.floor(getPhaseDuration() / 1000)
      } else {
        timeRemaining.value = Math.max(0, Math.floor((endTime - Date.now()) / 1000))
      }

      timerInterval = setInterval(() => {
        if (roomState.value?.phaseEndTime) {
          timeRemaining.value = Math.max(0, Math.floor((roomState.value.phaseEndTime - Date.now()) / 1000))
        } else {
          timeRemaining.value = Math.max(0, timeRemaining.value - 1)
        }
      }, 1000)
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

    const getPlayerPosition = (index, total) => {
      if (!total) return {}
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2
      const radius = 35 // % from center
      const x = 50 + radius * Math.cos(angle)
      const y = 50 + radius * Math.sin(angle)
      return {
        left: `${x}%`,
        top: `${y}%`
      }
    }

    const getSelectablePlayers = () => {
      if (!alivePlayers.value) return []

      // Werewolves can't target other werewolves
      if (myPlayer.value?.team === 'werewolves') {
        return alivePlayers.value.filter(p => p.team !== 'werewolves')
      }

      // Others can target anyone except themselves
      return alivePlayers.value.filter(p => p.userId !== myPlayer.value?.userId)
    }

    const getNightActionTitle = () => {
      const role = myPlayer.value?.role?.name
      if (role === 'Loup-Garou' || role === 'Loup Alpha') {
        return 'Choisissez votre victime'
      }
      if (role === 'Voyante') {
        return 'Choisissez qui sonder'
      }
      if (role === 'Gardien') {
        return 'Choisissez qui proteger'
      }
      if (role === 'Sorciere') {
        return 'Utilisez vos potions'
      }
      return 'Action de nuit'
    }

    const getNightActionHint = () => {
      const role = myPlayer.value?.role?.name
      if (role === 'Loup-Garou' || role === 'Loup Alpha') {
        return 'Selectionnez un villageois a devorer cette nuit'
      }
      if (role === 'Voyante') {
        return 'Decouvrez le role d\'un joueur'
      }
      if (role === 'Gardien') {
        return 'Protegez un joueur des loups cette nuit'
      }
      return ''
    }

    const handlePlayerClick = (player) => {
      if (!canAct.value) return
      if (!player.isAlive && currentPhase.value !== 'ended') return

      selectedTarget.value = player.userId
    }

    const handleNightAction = (targetId) => {
      if (!nightAbility.value) return

      selectedTarget.value = targetId
      performNightAction(nightAbility.value.id, [targetId])
      actionSubmitted.value = true
    }

    const handleVote = (targetId) => {
      selectedTarget.value = targetId
      vote(targetId)
      actionSubmitted.value = true
    }

    const handleSkipVote = () => {
      skipVote()
      actionSubmitted.value = true
    }

    const getVotesFor = (playerId) => {
      if (!roomState.value?.votes) return 0
      return Object.values(roomState.value.votes).filter(v => v === playerId).length
    }

    // Three.js setup
    const initThreeScene = () => {
      if (!threeContainer.value) return

      // Scene
      scene = new THREE.Scene()

      // Dynamic background based on phase
      updateSceneBackground()

      // Camera
      const aspect = threeContainer.value.clientWidth / threeContainer.value.clientHeight
      camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
      camera.position.set(0, 12, 15)

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight)
      renderer.setPixelRatio(window.devicePixelRatio)
      threeContainer.value.appendChild(renderer.domElement)

      // Controls
      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.maxPolarAngle = Math.PI / 2.2
      controls.minDistance = 10
      controls.maxDistance = 30

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
      scene.add(ambientLight)

      const moonLight = new THREE.DirectionalLight(0x8888ff, 0.6)
      moonLight.position.set(5, 10, 5)
      scene.add(moonLight)

      // Ground
      const groundGeometry = new THREE.CircleGeometry(12, 32)
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d4a2d,
        roughness: 0.8
      })
      const ground = new THREE.Mesh(groundGeometry, groundMaterial)
      ground.rotation.x = -Math.PI / 2
      scene.add(ground)

      // Create player meshes
      updatePlayerMeshes()

      // Handle resize
      window.addEventListener('resize', handleResize)

      // Start animation
      animate()
    }

    const updateSceneBackground = () => {
      if (!scene) return

      const colors = {
        night: 0x0a0a1a,
        day: 0x1a2a3a,
        voting: 0x1a1a2a,
        ended: 0x0f0f1f
      }

      scene.background = new THREE.Color(colors[currentPhase.value] || 0x1a1a2e)
    }

    const updatePlayerMeshes = () => {
      if (!scene) return

      // Remove old meshes
      playerMeshes.forEach(mesh => scene.remove(mesh))
      playerMeshes = []

      const players = roomState.value?.players || []
      const radius = 8
      const angleStep = (Math.PI * 2) / players.length

      players.forEach((player, index) => {
        const angle = index * angleStep - Math.PI / 2
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius

        // Player body
        const geometry = new THREE.CapsuleGeometry(0.4, 1.5, 4, 8)
        const material = new THREE.MeshStandardMaterial({
          color: getPlayerColor(player),
          emissive: player.userId === myPlayer.value?.userId ? 0x440044 : 0x000000,
          emissiveIntensity: 0.3
        })

        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(x, 1, z)
        mesh.lookAt(0, 1, 0)
        mesh.userData = { player }

        // Death animation
        if (!player.isAlive) {
          mesh.rotation.z = Math.PI / 2
          mesh.position.y = 0.4
          material.opacity = 0.5
          material.transparent = true
        }

        scene.add(mesh)
        playerMeshes.push(mesh)
      })
    }

    const getPlayerColor = (player) => {
      if (!player.isAlive) return 0x444444

      // Show werewolves to other werewolves
      if (canSeeWerewolves.value && player.team === 'werewolves') {
        return 0xff4444
      }

      // My player
      if (player.userId === myPlayer.value?.userId) {
        return 0xbb86fc
      }

      return 0x44aa44
    }

    const handleResize = () => {
      if (!threeContainer.value || !camera || !renderer) return

      camera.aspect = threeContainer.value.clientWidth / threeContainer.value.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight)
    }

    const animate = () => {
      requestAnimationFrame(animate)

      if (controls) {
        controls.update()
      }

      // Animate player meshes
      playerMeshes.forEach(mesh => {
        if (mesh.userData.player?.isAlive) {
          mesh.position.y = 1 + Math.sin(Date.now() * 0.002) * 0.05
        }
      })

      if (renderer && scene && camera) {
        renderer.render(scene, camera)
      }
    }

    // Watch for player changes
    watch(() => roomState.value?.players, () => {
      updatePlayerMeshes()
    }, { deep: true })

    // Watch for phase changes
    watch(currentPhase, () => {
      updateSceneBackground()
    })

    // Lifecycle
    onMounted(() => {
      initThreeScene()
      updateTimer()
    })

    onUnmounted(() => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
      if (renderer) {
        renderer.dispose()
      }
      window.removeEventListener('resize', handleResize)
    })

    return {
      // Refs
      threeContainer,

      // State
      roomState,
      myPlayer,
      chatMessages,
      selectedTarget,
      actionSubmitted,
      showSeerVision,
      seerVision,
      timeRemaining,

      // Computed
      currentPhase,
      currentTurn,
      alivePlayers,
      canAct,
      nightAbility,
      availableChannels,
      phaseIcon,
      phaseName,
      timerProgress,
      timerColor,
      recentEvents,
      canSeeWerewolves,

      // Methods
      getRoleIcon,
      getPlayerPosition,
      getSelectablePlayers,
      getNightActionTitle,
      getNightActionHint,
      handlePlayerClick,
      handleNightAction,
      handleVote,
      handleSkipVote,
      getVotesFor,
      sendChatMessage
    }
  }
}
</script>

<style scoped>
.werewolf-game {
  display: grid;
  grid-template-columns: 1fr 350px;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
  background: #0f0f1f;
  color: white;
  overflow: hidden;
}

/* Header */
.game-header {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 25px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.phase-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.phase-icon {
  font-size: 2.5em;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
}

.phase-icon.night {
  background: rgba(100, 100, 200, 0.2);
}

.phase-icon.day {
  background: rgba(255, 200, 100, 0.2);
}

.phase-icon.voting {
  background: rgba(200, 100, 200, 0.2);
}

.phase-details {
  display: flex;
  flex-direction: column;
}

.phase-name {
  font-size: 1.4em;
  font-weight: bold;
}

.turn-info {
  color: #888;
  font-size: 0.9em;
}

.timer-display {
  font-weight: bold;
}

.player-status {
  display: flex;
  align-items: center;
  gap: 20px;
}

.my-role {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.role-icon {
  font-size: 1.5em;
}

.role-name {
  font-weight: 500;
}

.team-badge {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 0.8em;
}

.team-badge.villagers {
  background: rgba(76, 175, 80, 0.3);
  color: #81c784;
}

.team-badge.werewolves {
  background: rgba(244, 67, 54, 0.3);
  color: #e57373;
}

.lives-display {
  display: flex;
  gap: 5px;
  font-size: 1.2em;
}

/* Main Game Area */
.game-main {
  position: relative;
  overflow: hidden;
}

.three-container {
  width: 100%;
  height: 100%;
}

.players-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.player-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.3s ease;
}

.player-marker:hover:not(.dead) {
  transform: translate(-50%, -50%) scale(1.1);
}

.player-marker.dead {
  opacity: 0.5;
}

.player-marker.selected .marker-avatar {
  box-shadow: 0 0 0 3px #bb86fc;
}

.player-marker.werewolf .marker-avatar {
  border: 2px solid #ff4444;
}

.player-marker.me .marker-avatar {
  border: 2px solid #bb86fc;
}

.marker-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a4a6a, #2a2a4a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2em;
}

.marker-name {
  font-size: 0.75em;
  margin-top: 5px;
  background: rgba(0, 0, 0, 0.7);
  padding: 2px 8px;
  border-radius: 8px;
  white-space: nowrap;
}

.death-marker,
.protection-marker {
  position: absolute;
  top: -5px;
  right: -5px;
  font-size: 1.2em;
}

.vote-count {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: #ff4444;
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75em;
  font-weight: bold;
}

/* Action Panel */
.action-panel {
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 150px;
}

.action-panel h3 {
  margin-bottom: 10px;
}

.action-hint {
  color: #888;
  font-size: 0.9em;
  margin-bottom: 15px;
}

.action-submitted {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #4caf50;
  margin-top: 15px;
}

.skip-vote-btn {
  margin-top: 15px;
}

.day-phase,
.dead-view,
.waiting-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 10px;
  color: #888;
}

/* Sidebar */
.game-sidebar {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.02);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.sidebar-section {
  padding: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-section h4 {
  margin-bottom: 10px;
  color: #aaa;
  font-size: 0.9em;
}

.players-list {
  max-height: 200px;
}

.players-scroll {
  max-height: 150px;
  overflow-y: auto;
}

.events-log {
  flex: 1;
  min-height: 0;
}

.events-scroll {
  max-height: 120px;
  overflow-y: auto;
}

.event-item {
  padding: 5px 10px;
  margin-bottom: 5px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
  font-size: 0.85em;
  color: #aaa;
}

.event-item.death {
  background: rgba(244, 67, 54, 0.1);
  color: #e57373;
}

.event-item.phase_changed {
  background: rgba(156, 39, 176, 0.1);
  color: #ce93d8;
}

.event-item.game_started,
.event-item.game_ended {
  background: rgba(76, 175, 80, 0.1);
  color: #81c784;
}

/* Seer Vision */
.seer-vision-card {
  background: #1a1a2e !important;
}

.seer-vision-card .v-card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
}

.vision-result {
  text-align: center;
  padding: 20px;
}

.vision-target {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 10px;
}

.vision-role {
  font-size: 1.3em;
  padding: 10px 20px;
  border-radius: 10px;
  margin-bottom: 10px;
}

.vision-role.villagers {
  background: rgba(76, 175, 80, 0.2);
  color: #81c784;
}

.vision-role.werewolves {
  background: rgba(244, 67, 54, 0.2);
  color: #e57373;
}

.vision-team {
  color: #888;
}

/* Responsive */
@media (max-width: 900px) {
  .werewolf-game {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto auto;
  }

  .game-sidebar {
    flex-direction: row;
    flex-wrap: wrap;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .sidebar-section {
    flex: 1;
    min-width: 200px;
  }

  .game-header {
    flex-wrap: wrap;
    gap: 10px;
  }

  .player-status {
    flex-wrap: wrap;
  }
}
</style>
