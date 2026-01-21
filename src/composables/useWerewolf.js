import { ref, computed, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

// Singleton pour le socket werewolf
let socket = null
const roomState = ref(null)
const myPlayer = ref(null)
const availableRooms = ref([])
const chatMessages = ref([])
const isConnected = ref(false)
const isAuthenticated = ref(false)
const error = ref(null)
const seerVision = ref(null)
const gameEvents = ref([])
const voteUpdate = ref(null)

export function useWerewolf() {
  // Utiliser les clés localStorage de l'auth Discord
  const userId = ref(localStorage.getItem('discordId'))
  const username = ref(localStorage.getItem('globalName'))

  const connect = () => {
    if (socket && socket.connected) {
      console.log('[Werewolf] Already connected')
      return
    }

    const baseUrl = import.meta.env.VITE_FLAPI_URL.replace('/api', '')
    socket = io(`${baseUrl}/werewolf`, {
      transports: ['websocket'],
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true',
      },
    })

    socket.on('connect', () => {
      isConnected.value = true
      error.value = null
      console.log('[Werewolf] Connected to server')

      // Authenticate - OBLIGATOIRE apres connexion
      if (userId.value && username.value) {
        socket.emit('authenticate', {
          userId: userId.value,
          username: username.value,
        })
      } else {
        error.value = 'Authentification Discord requise'
        console.error('[Werewolf] Missing Discord credentials')
      }
    })

    socket.on('disconnect', () => {
      isConnected.value = false
      isAuthenticated.value = false
      console.log('[Werewolf] Disconnected from server')
    })

    // Confirmation d'authentification
    socket.on('authenticated', (data) => {
      isAuthenticated.value = true
      console.log(`[Werewolf] Authenticated: ${data.username} (${data.userId})`)
      addGameEvent('authenticated', `Connecte en tant que ${data.username}`)
    })

    socket.on('error', (err) => {
      error.value = err.message || err
      console.error('[Werewolf] Error:', err)
    })

    // Liste des salles disponibles
    socket.on('available-rooms', (rooms) => {
      availableRooms.value = rooms
    })

    // Room events
    socket.on('room-state', (state) => {
      roomState.value = state
      myPlayer.value = state.myPlayer
    })

    socket.on('room-created', (data) => {
      roomState.value = data.state
      myPlayer.value = data.state?.myPlayer
      addGameEvent('room_created', `Salle ${data.roomId} creee`)
    })

    socket.on('room-joined', (data) => {
      roomState.value = data.state
      myPlayer.value = data.state?.myPlayer
      addGameEvent('room_joined', `Vous avez rejoint la salle ${data.roomId}`)
    })

    socket.on('room-left', () => {
      roomState.value = null
      myPlayer.value = null
      chatMessages.value = []
      gameEvents.value = []
      addGameEvent('room_left', 'Vous avez quitte la salle')
    })

    socket.on('player-joined', (data) => {
      addGameEvent('player_joined', `${data.username} a rejoint (${data.playerCount} joueurs)`)
    })

    socket.on('player-left', (data) => {
      addGameEvent('player_left', `${data.username} a quitte (${data.playerCount} joueurs)`)
    })

    socket.on('player-disconnected', (data) => {
      addGameEvent('player_disconnected', `${data.username} s'est deconnecte`)
    })

    // Game events
    socket.on('game-started', (data) => {
      if (data.state) {
        roomState.value = data.state
        myPlayer.value = data.state.myPlayer
      }
      addGameEvent('game_started', `La partie commence! Tour ${data.turn}, Phase: ${data.phase}`)
    })

    socket.on('phase-changed', (data) => {
      const phaseNames = {
        night: 'Nuit',
        day: 'Jour',
        voting: 'Vote',
        ended: 'Fin',
      }
      // Mettre a jour phaseEndTime dans roomState
      if (roomState.value) {
        roomState.value.phase = data.phase
        roomState.value.turn = data.turn
        roomState.value.phaseEndTime = data.phaseEndTime
      }
      addGameEvent('phase_changed', `${phaseNames[data.phase] || data.phase} - Tour ${data.turn}`)
    })

    socket.on('deaths-occurred', (data) => {
      if (data.deaths && data.deaths.length > 0) {
        data.deaths.forEach((death) => {
          const causeNames = {
            werewolf_attack: 'devore par les loups',
            voted_out: 'elimine par le village',
            witch_poison: 'empoisonne par la sorciere',
            hunter_revenge: 'tue par le chasseur',
          }
          addGameEvent(
            'death',
            `${death.playerId} est mort (${causeNames[death.cause] || death.cause})`,
          )
        })
      }
    })

    // Actions de nuit
    socket.on('action-registered', (data) => {
      addGameEvent('action_registered', `Action enregistree: ${data.abilityId}`)
    })

    socket.on('werewolves-voted', () => {
      addGameEvent('werewolves_voted', 'Tous les loups ont vote')
    })

    // Votes
    socket.on('vote-registered', (data) => {
      addGameEvent('vote_registered', `Vote enregistre pour ${data.targetId || 'passer'}`)
    })

    socket.on('vote-update', (data) => {
      voteUpdate.value = data
      addGameEvent('vote_update', `Votes: ${data.totalVotes}/${data.requiredVotes}`)
    })

    // Vision de la voyante
    socket.on('seer-vision', (data) => {
      seerVision.value = data
      addGameEvent('seer_vision', `Vision: ${data.target} est ${data.role} (${data.team})`)
    })

    // Items
    socket.on('item-used', (data) => {
      addGameEvent('item_used', `Item utilise: ${data.item}`)
    })

    // Chat
    socket.on('chat-message', (msg) => {
      chatMessages.value.push(msg)
    })
  }

  const disconnect = () => {
    if (socket) {
      socket.disconnect()
      socket = null
      isConnected.value = false
      isAuthenticated.value = false
      roomState.value = null
      myPlayer.value = null
      chatMessages.value = []
      gameEvents.value = []
    }
  }

  // Actions - Le backend utilise l'auth stockee, pas besoin de passer userId/username
  const createRoom = (config = {}) => {
    if (!socket || !isAuthenticated.value) return
    socket.emit('create-room', { config })
  }

  const joinRoom = (roomId) => {
    if (!socket || !isAuthenticated.value) return
    socket.emit('join-room', { roomId })
  }

  const leaveRoom = () => {
    if (!socket || !roomState.value) return
    socket.emit('leave-room', {})
  }

  const toggleReady = () => {
    if (!socket || !roomState.value) return
    socket.emit('toggle-ready', {})
  }

  const startGame = () => {
    if (!socket || !roomState.value) return
    socket.emit('start-game', {})
  }

  const performNightAction = (abilityId, targets) => {
    if (!socket || !roomState.value) return
    socket.emit('night-action', { abilityId, targets })
  }

  const vote = (targetId) => {
    if (!socket || !roomState.value) return
    socket.emit('vote', { targetId })
  }

  const skipVote = () => {
    if (!socket || !roomState.value) return
    socket.emit('vote', { targetId: null })
  }

  const sendChatMessage = (message, channel = 'all') => {
    if (!socket || !roomState.value || !message.trim()) return
    socket.emit('chat-message', { channel, message: message.trim() })
  }

  const useItem = (itemId, targets = []) => {
    if (!socket || !roomState.value) return
    socket.emit('use-item', { itemId, targets })
  }

  const refreshRooms = () => {
    if (!socket || !isAuthenticated.value) return
    // Le backend envoie automatiquement available-rooms, mais on peut forcer un refresh
    // En se reconnectant au namespace ou en demandant explicitement
  }

  // Helper function to add game events
  const addGameEvent = (type, message) => {
    gameEvents.value.push({
      type,
      message,
      timestamp: Date.now(),
    })
    // Keep only last 50 events
    if (gameEvents.value.length > 50) {
      gameEvents.value.shift()
    }
  }

  // Computed properties
  const isInRoom = computed(() => !!roomState.value)
  const isInGame = computed(() => roomState.value?.isStarted === true)
  const isHost = computed(() => myPlayer.value?.isHost === true)
  const isAlive = computed(() => myPlayer.value?.isAlive !== false)
  const currentPhase = computed(() => roomState.value?.phase || 'lobby')
  const currentTurn = computed(() => roomState.value?.turn || 0)
  const phaseEndTime = computed(() => roomState.value?.phaseEndTime || null)

  const alivePlayers = computed(() => {
    if (!roomState.value?.players) return []
    return roomState.value.players.filter((p) => p.isAlive)
  })

  const deadPlayers = computed(() => {
    if (!roomState.value?.players) return []
    return roomState.value.players.filter((p) => !p.isAlive)
  })

  const canStartGame = computed(() => {
    if (!roomState.value || !isHost.value) return false
    const readyPlayers = roomState.value.players.filter((p) => p.isReady || p.isHost)
    return readyPlayers.length >= (roomState.value.config?.minPlayers || 2)
  })

  const canAct = computed(() => {
    return isAlive.value && !myPlayer.value?.statusEffects?.some((s) => s.type === 'silenced')
  })

  const myAbilities = computed(() => {
    return myPlayer.value?.role?.abilities || []
  })

  const nightAbility = computed(() => {
    return myAbilities.value.find((a) => a.type === 'night')
  })

  // Utiliser chatChannels de room-state si disponible
  const availableChannels = computed(() => {
    if (roomState.value?.chatChannels) {
      return roomState.value.chatChannels
    }
    // Fallback
    const channels = ['all']
    if (myPlayer.value?.team === 'werewolves' && isAlive.value && currentPhase.value === 'night') {
      channels.push('werewolves')
    }
    if (!isAlive.value) {
      channels.push('dead')
    }
    return channels
  })

  // Cleanup on unmount
  onUnmounted(() => {
    // Don't disconnect automatically - let the user control this
  })

  return {
    // State
    socket,
    isConnected,
    isAuthenticated,
    roomState,
    myPlayer,
    availableRooms,
    chatMessages,
    error,
    seerVision,
    gameEvents,
    voteUpdate,
    userId,
    username,

    // Computed
    isInRoom,
    isInGame,
    isHost,
    isAlive,
    currentPhase,
    currentTurn,
    phaseEndTime,
    alivePlayers,
    deadPlayers,
    canStartGame,
    canAct,
    myAbilities,
    nightAbility,
    availableChannels,

    // Methods
    connect,
    disconnect,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
    performNightAction,
    vote,
    skipVote,
    sendChatMessage,
    useItem,
    refreshRooms,
  }
}
