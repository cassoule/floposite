<template>
  <v-layout>
    <v-main
      class="d-flex"
      style="place-items: center; place-content: center; flex-wrap: wrap; gap: 2em"
    >
      <div class="game-section mt-16">
        <div class="header-section">
          <h2 class="text-white mb-2">Snake 1v1</h2>
          <p style="display: flex; justify-content: start; align-items: center; gap: 0.5em">
            <v-img v-if="elo" :src="rankIcon(elo)" min-width="20" max-width="20" height="20">
              <div
                style="
                  position: absolute;
                  display: flex;
                  width: 100%;
                  height: 100%;
                  place-items: center;
                  place-content: center;
                  font-size: 0.8em;
                  color: #222;
                "
              >
                <p style="font-weight: 400">{{ rankDiv(elo) }}</p>
              </div>
            </v-img>
            {{ elo ? elo + ' Elo' : 'Non Classé' }}
          </p>

          <div class="d-flex gap-2 align-center">
            <v-btn
              v-if="!foundLobby"
              class="my-2"
              color="primary"
              text="Chercher un joueur"
              :loading="inQueue"
              :disabled="(foundLobby !== null && foundLobby !== undefined) || isScreenTooSmall"
              style="border-radius: 10px"
              @click="joinQueue"
            />
            <!-- <v-btn
              v-if="foundLobby && gameStarted"
              class="my-2"
              :color="autoplay ? 'success' : 'secondary'"
              :text="autoplay ? 'Autoplay ON' : 'Autoplay OFF'"
              style="border-radius: 10px"
              @click="autoplay = !autoplay"
            /> -->
          </div>
          <p v-if="!foundLobby && queue.length > 0" class="mb-3">
            {{ !foundLobby && queue.length > 0 ? `Dans la file d'attente :` : '&nbsp;' }}
            <span v-for="(p, index) in queue" :key="p">
              {{ index > 0 ? ', ' : '' }}
              {{ p }}
            </span>
          </p>
        </div>

        <div v-if="foundLobby" class="players-info">
          <div class="player-card my-grid">
            <div class="d-flex align-center gap-2">
              <v-img
                v-if="playerAvatar"
                :src="playerAvatar"
                :min-width="25"
                :max-width="25"
                :height="25"
                rounded="xl"
              ></v-img>
              <span class="ml-3">Toi</span>
            </div>
            <div class="d-flex align-center ga-3">
              <p class="score-text">
                Score: <span class="font-weight-bold">{{ myScore }}</span>
              </p>
              <p v-if="myGameOver && !myWin" class="text-error font-weight-bold">
                Perdu !&nbsp;<span
                  class="font-weight-regular text-secondary"
                  style="font-size: 0.9em"
                  >(en attente de l'adversaire)</span
                >
              </p>
              <p v-if="myWin" class="text-success font-weight-bold">
                Victoire !&nbsp;<span
                  class="font-weight-regular text-secondary"
                  style="font-size: 0.9em"
                  >(en attente de l'adversaire)</span
                >
              </p>
            </div>

            <div v-if="foundLobby" class="grids-container mt-2">
              <div class="grid-wrapper">
                <canvas
                  ref="myCanvas"
                  :width="canvasWidth"
                  :height="canvasHeight"
                  class="game-canvas my-canvas"
                ></canvas>
              </div>
            </div>
          </div>

          <div class="player-card opp-grid">
            <div class="d-flex align-center gap-2 w-100">
              <v-img
                v-if="oppAvatar"
                :src="oppAvatar"
                :min-width="25"
                :max-width="25"
                :height="25"
                rounded="xl"
              ></v-img>
              <span
                class="ml-3"
                style="
                  overflow: hidden;
                  white-space: nowrap;
                  text-overflow: ellipsis;
                  max-width: 110px;
                "
                >{{ oppName }}</span
              >
              <v-spacer />
              <v-img
                v-if="oppElo"
                :src="rankIcon(oppElo)"
                min-width="20"
                max-width="20"
                height="20"
              >
                <div
                  style="
                    position: absolute;
                    display: flex;
                    width: 100%;
                    height: 100%;
                    place-items: center;
                    place-content: center;
                    font-size: 0.8em;
                    color: #222;
                  "
                >
                  <p style="font-weight: 400">{{ rankDiv(oppElo) }}</p>
                </div>
              </v-img>
            </div>
            <div class="d-flex align-center ga-3">
              <p class="score-text">
                Score: <span class="font-weight-bold">{{ oppScore }}</span>
              </p>
              <p v-if="oppGameOver && !oppWin" class="text-error font-weight-bold">Perdu !</p>
              <p v-if="oppWin" class="text-success font-weight-bold">Victoire !</p>
            </div>

            <div v-if="foundLobby" class="grids-container mt-2">
              <div class="grid-wrapper">
                <canvas
                  ref="oppCanvas"
                  :width="canvasWidth"
                  :height="canvasHeight"
                  class="game-canvas opp-canvas"
                ></canvas>
              </div>
            </div>
          </div>
        </div>

        <div v-if="foundLobby && countdown > 0 && !gameStarted" class="countdown-overlay">
          <div class="countdown-display">
            <div class="countdown-number">{{ countdown }}</div>
          </div>
        </div>
      </div>
    </v-main>

    <v-dialog v-model="endGameDialog" persistent max-width="300">
      <v-card color="primary" style="border-radius: 15px">
        <v-card-title class="text-uppercase pt-4 pb-0">
          {{ title }}
        </v-card-title>
        <v-card-text class="px-4 py-0 font-weight-light">
          {{ message }}
        </v-card-text>
        <v-card-actions>
          <v-btn class="rounded-lg" text="Ok" variant="tonal" @click="reload"></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-btn
      class="back-btn text-none"
      text="Retour"
      variant="tonal"
      color="#ddd"
      @click="leaveAndGoBack"
    ></v-btn>
  </v-layout>
</template>

<script>
import { io } from 'socket.io-client'
import axios from 'axios'

export default {
  name: 'SnakeVersus',

  data() {
    return {
      canvasWidth: 500,
      canvasHeight: 500,
      gridSize: 500 / 9,

      // My game state
      mySnake: [],
      myDirection: 'RIGHT',
      myDirectionQueue: [],
      myFood: null,
      myScore: 0,
      myGameOver: false,
      myWin: false,

      // Opponent game state
      oppSnake: [],
      oppFood: null,
      oppScore: 0,
      oppGameOver: false,
      oppWin: false,

      // Socket & matchmaking
      socket: null,
      discordId: null,
      playerAvatar: null,
      queue: [],
      foundLobby: null,
      gameKey: null, // Track current game to filter events
      inQueue: false,
      oppName: null,
      oppAvatar: null,

      // Game control
      gameLoop: null,
      renderLoop: null,
      gameSpeed: 150,
      gameStarted: false,
      countdown: 0,
      countdownInterval: null,
      lastUpdateTime: 0,

      // Previous frame for interpolation
      prevMySnake: [],
      prevOppSnake: [],

      // Dialog
      endGameDialog: false,
      title: null,
      message: null,

      // ELO
      elo: null,
      oppElo: null,

      // Autoplay
      autoplay: false,
      autoplayCounter: 0,

      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    }
  },

  async mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) {
      this.$router.push('/')
      return
    }

    this.initSocket()
    this.setupKeyboardControls()

    this.elo = await this.getElo(this.discordId)
  },

  computed: {
    isScreenTooSmall() {
      return this.windowWidth < 800 //|| this.windowHeight < 870
    },
  },

  created() {
    this._boundHandleUnload = (e) => this.handleUnload(e)
    window.addEventListener('beforeunload', this._boundHandleUnload)
    window.addEventListener('pagehide', this._boundHandleUnload)
    window.addEventListener('resize', this.handleResize)
  },

  beforeUnmount() {
    window.removeEventListener('beforeunload', this._boundHandleUnload)
    window.removeEventListener('pagehide', this._boundHandleUnload)
    window.removeEventListener('keydown', this.handleKeyPress)
    window.removeEventListener('resize', this.handleResize)
    this.leaveQueueSync({ reason: 'component-destroy' })
    this.stopGameLoop()
    this.stopRenderLoop()
    this.stopCountdown()
  },

  beforeRouteLeave(to, from, next) {
    this.leaveQueueSync({ reason: 'route-leave' })
    next()
  },

  methods: {
    handleResize() {
      this.windowWidth = window.innerWidth
      this.windowHeight = window.innerHeight
    },
    initSocket() {
      this.socket = io(import.meta.env.VITE_FLAPI_URL.replace('/api', ''), {
        withCredentials: false,
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
      })

      this.socket.emit('snakeconnection', { id: this.discordId })

      // Listen for match confirmation with gameKey
      this.socket.on('snakematch', (e) => {
        console.log('Match found with gameKey:', e.gameKey)
        this.gameKey = e.gameKey
      })

      this.socket.on('snakequeue', async (e) => {
        this.queue = e.queue

        this.foundLobby = e.allPlayers.find(
          (obj) => obj.p1.id === this.discordId || obj.p2.id === this.discordId,
        )

        if (this.foundLobby) {
          this.oppName =
            this.foundLobby.p1.id === this.discordId
              ? this.foundLobby.p2.name
              : this.foundLobby.p1.name

          this.oppAvatar =
            this.foundLobby.p1.id === this.discordId
              ? this.foundLobby.p2.avatar
              : this.foundLobby.p1.avatar

          this.playerAvatar =
            this.foundLobby.p1.id === this.discordId
              ? this.foundLobby.p1.avatar
              : this.foundLobby.p2.avatar

          this.oppElo = await this.getElo(
            this.foundLobby.p1.id === this.discordId
              ? this.foundLobby.p2.id
              : this.foundLobby.p1.id,
          )

          // Restore game state from backend if game is already in progress
          const myData =
            this.foundLobby.p1.id === this.discordId ? this.foundLobby.p1 : this.foundLobby.p2
          const oppData =
            this.foundLobby.p1.id === this.discordId ? this.foundLobby.p2 : this.foundLobby.p1

          // Check if game has already started on backend
          const gameInProgress = myData.snake && myData.snake.length > 0

          if (gameInProgress) {
            // Restore my game state from backend (backend is source of truth)
            this.mySnake = myData.snake
            this.myFood = myData.food
            this.myScore = myData.score
            this.myGameOver = myData.gameOver || false
            this.myWin = myData.win || false

            // Restore opponent game state
            this.oppSnake = oppData.snake
            this.oppFood = oppData.food
            this.oppScore = oppData.score
            this.oppGameOver = oppData.gameOver
            this.oppWin = oppData.win

            // Restore direction (default to RIGHT if not set)
            this.myDirection = myData.direction || 'RIGHT'

            // Initialize previous state for interpolation
            this.prevMySnake = this.mySnake.map(segment => ({ ...segment }))
            this.prevOppSnake = this.oppSnake.map(segment => ({ ...segment }))

            // Mark game as started and restart game loop if not game over
            this.gameStarted = true
            if (!this.myGameOver && !this.myWin) {
              this.startGameLoop()
            }

            // Draw the restored state
            this.$nextTick(() => {
              this.drawMyGame()
              this.drawOppGame()
            })

            // Check if match already ended
            if ((this.myGameOver || this.myWin) && (this.oppGameOver || this.oppWin)) {
              this.handleMatchEnd()
            }
          } else if (!this.gameStarted && this.countdown === 0) {
            // Only start countdown for new games
            this.startCountdown()
          }
        }

        this.inQueue = this.inQueue && (this.foundLobby === null || this.foundLobby === undefined)
      })

      this.socket.on('snakegamestate', (e) => {
        // Filter by gameKey to only process updates for this game
        if (e.gameKey !== this.gameKey) {
          return
        }

        const lobby = e.lobby
        this.foundLobby = lobby
        console.log(lobby)

        if (lobby.p1.id === this.discordId) {
          // Update opponent state
          this.oppSnake = lobby.p2.snake
          this.oppFood = lobby.p2.food
          this.oppScore = lobby.p2.score
          this.oppGameOver = lobby.p2.gameOver
          this.oppWin = lobby.p2.win
        } else {
          // Update opponent state
          this.oppSnake = lobby.p1.snake
          this.oppFood = lobby.p1.food
          this.oppScore = lobby.p1.score
          this.oppGameOver = lobby.p1.gameOver
          this.oppWin = lobby.p1.win
        }

        this.drawOppGame()

        // Check for match end
        if ((this.myGameOver || this.myWin) && (this.oppGameOver || this.oppWin)) {
          this.handleMatchEnd()
        }
      })

      this.socket.on('snakegameOver', (e) => {
        // Filter by gameKey to ensure we only handle game over for this game
        if (e.gameKey !== this.gameKey) {
          return
        }

        const lobby = e.lobby
        this.foundLobby = lobby

        this.handleMatchEnd()
      })
    },

    handleUnload(evt) {
      this.leaveQueueSync({ reason: evt.type })
    },

    leaveQueueSync(meta = {}) {
      const payload = {
        discordId: this.discordId,
        game: 'snake',
        ...meta,
      }

      // Don't send if we never initialized (no discordId)
      if (!this.discordId) return

      const url = `${import.meta.env.VITE_FLAPI_URL}/queue/leave`
      try {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {})
      } catch {}

      if (this.socket?.connected) {
        try {
          this.socket.emit('snake:queue:leave', payload)
        } catch {}
      }
    },

    async getElo(id) {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + id + '/elo'
      try {
        const response = await axios.get(fetchUrl)
        return response.data.elo
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    joinQueue() {
      if (this.discordId !== null) {
        this.socket.emit('snakequeue', { playerId: this.discordId })
        this.inQueue = true
      }
    },

    startCountdown() {
      this.countdown = 3
      this.initGame() // Initialize grids so they can be displayed
      this.drawMyGame() // Draw initial state

      this.countdownInterval = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0 || this.gameStarted) {
          this.stopCountdown()
          if (!this.gameStarted) {
            this.startGame()
          }
        }
      }, 1000)
    },

    stopCountdown() {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval)
        this.countdownInterval = null
      }
    },

    startGame() {
      this.gameStarted = true
      this.startGameLoop()
    },

    initGame() {
      const startX = Math.floor(this.canvasWidth / this.gridSize / 2)
      const startY = Math.floor(this.canvasHeight / this.gridSize / 2)

      this.mySnake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY },
      ]

      this.myDirection = 'RIGHT'
      this.myDirectionQueue = []
      this.myScore = 0
      this.myGameOver = false
      this.myWin = false
      this.spawnFood()
    },

    setupKeyboardControls() {
      window.addEventListener('keydown', this.handleKeyPress)
    },

    handleKeyPress(e) {
      if (!this.gameStarted || this.myGameOver || this.countdown > 0) return

      const key = e.key
      let newDirection = null

      if (key === 'ArrowUp' || key === 'z') {
        newDirection = 'UP'
      } else if (key === 'ArrowDown' || key === 's') {
        newDirection = 'DOWN'
      } else if (key === 'ArrowLeft' || key === 'q') {
        newDirection = 'LEFT'
      } else if (key === 'ArrowRight' || key === 'd') {
        newDirection = 'RIGHT'
      }

      if (newDirection) {
        this.queueDirection(newDirection)
      }
    },

    queueDirection(newDirection) {
      const lastDirection =
        this.myDirectionQueue.length > 0
          ? this.myDirectionQueue[this.myDirectionQueue.length - 1]
          : this.myDirection

      const isValid =
        (newDirection === 'UP' && lastDirection !== 'DOWN') ||
        (newDirection === 'DOWN' && lastDirection !== 'UP') ||
        (newDirection === 'LEFT' && lastDirection !== 'RIGHT') ||
        (newDirection === 'RIGHT' && lastDirection !== 'LEFT')

      if (isValid && newDirection !== lastDirection) {
        this.myDirectionQueue.push(newDirection)
      }
    },

    startGameLoop() {
      this.lastUpdateTime = Date.now()
      this.gameLoop = setInterval(() => {
        this.prevMySnake = this.mySnake.map(segment => ({ ...segment }))
        this.prevOppSnake = this.oppSnake.map(segment => ({ ...segment }))
        this.update()
        this.emitGameState()
        this.lastUpdateTime = Date.now()
      }, this.gameSpeed)
      this.startRenderLoop()
    },

    stopGameLoop() {
      if (this.gameLoop) {
        clearInterval(this.gameLoop)
        this.gameLoop = null
      }
    },

    startRenderLoop() {
      const render = () => {
        this.drawMyGame()
        this.drawOppGame()
        this.renderLoop = requestAnimationFrame(render)
      }
      this.renderLoop = requestAnimationFrame(render)
    },

    stopRenderLoop() {
      if (this.renderLoop) {
        cancelAnimationFrame(this.renderLoop)
        this.renderLoop = null
      }
    },

    update() {
      if (this.myGameOver || this.myWin) return

      // Autoplay: move in a circle pattern
      if (this.autoplay) {
        this.autoplayCounter++
        const directions = ['DOWN', 'LEFT', 'UP', 'RIGHT']
        const directionIndex = this.autoplayCounter % 4
        const newDirection = directions[directionIndex]

        if (newDirection !== this.myDirection) {
          this.queueDirection(newDirection)
        }
      }

      // Update direction from queue
      if (this.myDirectionQueue.length > 0) {
        this.myDirection = this.myDirectionQueue.shift()
      }

      // Calculate new head position
      const head = { ...this.mySnake[0] }

      switch (this.myDirection) {
        case 'UP':
          head.y--
          break
        case 'DOWN':
          head.y++
          break
        case 'LEFT':
          head.x--
          break
        case 'RIGHT':
          head.x++
          break
      }

      // Check wall collision
      if (
        head.x < 0 ||
        head.x >= this.canvasWidth / this.gridSize ||
        head.y < 0 ||
        head.y >= this.canvasHeight / this.gridSize
      ) {
        this.myGameOver = true
        this.emitGameState()
        return
      }

      // Check self collision
      if (this.mySnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        this.myGameOver = true
        this.emitGameState()
        return
      }

      // Add new head
      this.mySnake.unshift(head)

      // Check food collision
      if (head.x === this.myFood.x && head.y === this.myFood.y) {
        this.myScore += 1
        this.spawnFood()

        // Increase speed
        //if (this.myScore % 5 === 0 && this.gameSpeed > 50) {
        this.gameSpeed -= 1
        this.stopGameLoop()
        this.startGameLoop()
        //}
      } else {
        this.mySnake.pop()
      }
    },

    spawnFood() {
      const maxX = this.canvasWidth / this.gridSize
      const maxY = this.canvasHeight / this.gridSize
      const totalCells = maxX * maxY

      // Check if won
      if (this.mySnake.length >= totalCells) {
        this.myWin = true
        this.emitGameState()
        return
      }

      let newFood
      do {
        newFood = {
          x: Math.floor(Math.random() * maxX),
          y: Math.floor(Math.random() * maxY),
        }
      } while (this.mySnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y))

      this.myFood = newFood
    },

    emitGameState() {
      if (!this.socket || !this.foundLobby) return

      const payload = {
        playerId: this.discordId,
        snake: this.mySnake,
        food: this.myFood,
        score: this.myScore,
        direction: this.myDirection,
        gameOver: this.myGameOver,
        win: this.myWin,
      }

      this.socket.emit('snakegamestate', payload)
    },

    handleMatchEnd() {
      if (this.endGameDialog) return

      this.stopGameLoop()

      // Determine winner
      if (this.myWin && !this.oppWin) {
        this.title = 'Victoire'
        this.message =
          this.myScore === (this.canvasWidth / this.gridSize) ** 2 - 3
            ? 'Tu as rempli la grille en premier !'
            : `${this.oppName} a abandonné !`
        this.socket.emit('snakegameOver', { playerId: this.discordId, winner: this.discordId })
      } else if (this.oppWin && !this.myWin) {
        this.title = 'Défaite'
        this.message =
          this.oppScore === (this.canvasWidth / this.gridSize) ** 2 - 3
            ? `${this.oppName} a rempli la grille en premier`
            : `Tu as abandonné !`
        const winnerId =
          this.foundLobby.p1.id === this.discordId ? this.foundLobby.p2.id : this.foundLobby.p1.id
        this.socket.emit('snakegameOver', { playerId: this.discordId, winner: winnerId })
      } else if (this.myGameOver && this.oppGameOver) {
        // Both lost, higher score wins
        if (this.myScore > this.oppScore) {
          this.title = 'Victoire'
          this.message = `Tu as marqué plus de points ! (${this.myScore} pts)`
          this.socket.emit('snakegameOver', { playerId: this.discordId, winner: this.discordId })
        } else if (this.oppScore > this.myScore) {
          this.title = 'Défaite'
          this.message = `${this.oppName} a marqué plus de points (${this.oppScore} pts)`
          const winnerId =
            this.foundLobby.p1.id === this.discordId ? this.foundLobby.p2.id : this.foundLobby.p1.id
          this.socket.emit('snakegameOver', { playerId: this.discordId, winner: winnerId })
        } else {
          this.title = 'Égalité'
          this.message = `Même score ! (${this.myScore})`
          this.socket.emit('snakegameOver', { playerId: this.discordId, winner: null })
        }
      } else if (this.myGameOver && !this.oppGameOver) {
        this.title = 'Défaite'
        this.message = 'Tu as perdu !'
        const winnerId =
          this.foundLobby.p1.id === this.discordId ? this.foundLobby.p2.id : this.foundLobby.p1.id
        this.socket.emit('snakegameOver', { playerId: this.discordId, winner: winnerId })
      } else if (this.oppGameOver && !this.myGameOver) {
        this.title = 'Victoire'
        this.message = `${this.oppName} a perdu !`
        this.socket.emit('snakegameOver', { playerId: this.discordId, winner: this.discordId })
      }

      this.endGameDialog = true
    },

    drawMyGame() {
      const canvas = this.$refs.myCanvas
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      this.drawGame(ctx, this.mySnake, this.myFood, this.myDirection, this.prevMySnake)
    },

    drawOppGame() {
      const canvas = this.$refs.oppCanvas
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      this.drawGame(ctx, this.oppSnake, this.oppFood, null, this.prevOppSnake)
    },

    drawGame(ctx, snake, food, direction = null, prevSnake = []) {
      // Clear canvas
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)

      // Draw grid
      ctx.strokeStyle = '#2a2a2a'
      ctx.lineWidth = 1
      for (let i = 0; i <= this.canvasWidth / this.gridSize; i++) {
        ctx.beginPath()
        ctx.moveTo(i * this.gridSize, 0)
        ctx.lineTo(i * this.gridSize, this.canvasHeight)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, i * this.gridSize)
        ctx.lineTo(this.canvasWidth, i * this.gridSize)
        ctx.stroke()
      }

      // Calculate interpolation factor
      const now = Date.now()
      const timeSinceUpdate = now - this.lastUpdateTime
      const progress = Math.min(timeSinceUpdate / this.gameSpeed, 1)

      // Draw food
      if (food) {
        const x = food.x * this.gridSize
        const y = food.y * this.gridSize

        ctx.font = `${this.gridSize}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🍎', x + this.gridSize / 2, y + this.gridSize / 2 + 2)
      }

      // Draw snake with interpolation
      const snakeSegments = snake.map((segment, index) => {
        let displayX = segment.x
        let displayY = segment.y

        if (prevSnake[index]) {
          const prev = prevSnake[index]
          const dx = segment.x - prev.x
          const dy = segment.y - prev.y
          
          // Check if this is a turn (both x and y changed)
          if (dx !== 0 && dy !== 0) {
            // This is a turn - interpolate in an L-shape
            // Move horizontally first, then vertically
            if (progress < 0.5) {
              // First half: move horizontally
              displayX = prev.x + dx * (progress * 2)
              displayY = prev.y
            } else {
              // Second half: move vertically
              displayX = segment.x
              displayY = prev.y + dy * ((progress - 0.5) * 2)
            }
          } else {
            // Straight movement - normal interpolation
            displayX = prev.x + dx * progress
            displayY = prev.y + dy * progress
          }
        }

        return {
          displayX,
          displayY,
          index,
          centerX: displayX * this.gridSize + this.gridSize / 2,
          centerY: displayY * this.gridSize + this.gridSize / 2,
        }
      })

      // Draw snake body as continuous shape
      if (snakeSegments.length > 0) {
        const bodyWidth = this.gridSize * 0.7

        // Draw the body with gradient alpha
        for (let i = snakeSegments.length - 1; i >= 0; i--) {
          const segment = snakeSegments[i]
          ctx.strokeStyle = '#5862f2'
          ctx.lineWidth = bodyWidth
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'

          // Draw line from this segment to the next
          if (i < snakeSegments.length - 1) {
            const nextSegment = snakeSegments[i + 1]
            const dx = Math.abs(segment.centerX - nextSegment.centerX)
            const dy = Math.abs(segment.centerY - nextSegment.centerY)
            
            ctx.beginPath()
            ctx.moveTo(nextSegment.centerX, nextSegment.centerY)
            
            // If both dx and dy are significant, draw an L-shaped path
            if (dx > 1 && dy > 1) {
              // Determine turn direction based on actual segment positions
              const curr = snake[i]
              const prev = prevSnake[i]
              
              if (prev && curr) {
                const xChanged = curr.x !== prev.x
                const yChanged = curr.y !== prev.y
                
                // If x changed (horizontal movement happened), draw vertical first
                if (xChanged && !yChanged) {
                  ctx.lineTo(nextSegment.centerX, segment.centerY)
                } else {
                  // Otherwise draw horizontal first
                  ctx.lineTo(segment.centerX, nextSegment.centerY)
                }
              } else {
                // Fallback: draw horizontal first
                ctx.lineTo(segment.centerX, nextSegment.centerY)
              }
            }
            
            ctx.lineTo(segment.centerX, segment.centerY)
            ctx.stroke()
          }
        }

        // Draw head as larger circle
        const head = snakeSegments[0]
        const headRadius = ((this.gridSize * .7) - 2) / 2

        ctx.fillStyle = '#5862f2'
        ctx.beginPath()
        ctx.arc(head.centerX, head.centerY, headRadius, 0, Math.PI * 2)
        ctx.fill()

        // Draw eyes on head (only for player's own snake if direction is provided)
        if (direction) {
          const eyeSize = this.gridSize / 6.5
          const eyeDistance = this.gridSize / 5

          let eye1X, eye1Y, eye2X, eye2Y

          switch (direction) {
            case 'UP':
              eye1X = head.centerX - eyeDistance
              eye1Y = head.centerY - eyeDistance / 1.5
              eye2X = head.centerX + eyeDistance
              eye2Y = head.centerY - eyeDistance / 1.5
              break
            case 'DOWN':
              eye1X = head.centerX - eyeDistance
              eye1Y = head.centerY + eyeDistance / 1.5
              eye2X = head.centerX + eyeDistance
              eye2Y = head.centerY + eyeDistance / 1.5
              break
            case 'LEFT':
              eye1X = head.centerX - eyeDistance / 1.5
              eye1Y = head.centerY - eyeDistance
              eye2X = head.centerX - eyeDistance / 1.5
              eye2Y = head.centerY + eyeDistance
              break
            case 'RIGHT':
              eye1X = head.centerX + eyeDistance / 1.5
              eye1Y = head.centerY - eyeDistance
              eye2X = head.centerX + eyeDistance / 1.5
              eye2Y = head.centerY + eyeDistance
              break
          }

          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(eye1X, eye1Y, eyeSize / 2, 0, Math.PI * 2)
          ctx.fill()

          ctx.beginPath()
          ctx.arc(eye2X, eye2Y, eyeSize / 2, 0, Math.PI * 2)
          ctx.fill()

          // Draw pupils
          ctx.fillStyle = '#000'
          ctx.beginPath()
          ctx.arc(eye1X, eye1Y, eyeSize / 3.5, 0, Math.PI * 2)
          ctx.fill()

          ctx.beginPath()
          ctx.arc(eye2X, eye2Y, eyeSize / 3.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    },

    reload() {
      this.gameKey = null // Clear gameKey on reload
      location.reload()
    },

    leaveAndGoBack() {
      this.leaveQueueSync({ reason: 'manual-leave' })
      this.gameKey = null // Clear gameKey when leaving
      this.$router.push('/snake')
    },

    rankIcon(elo) {
      if (elo < 900) {
        return ''
      } else if (elo < 1100) {
        return '/ranks_icons/bronze.svg'
      } else if (elo < 1300) {
        return '/ranks_icons/silver.svg'
      } else if (elo < 1600) {
        return '/ranks_icons/gold.svg'
      } else if (elo < 2000) {
        return '/ranks_icons/diamond.svg'
      } else if (elo >= 2000) {
        return '/ranks_icons/master.svg'
      } else {
        return ''
      }
    },

    rankDiv(elo) {
      if (!elo || elo < 900) return ''

      if (elo < 1100) {
        if (elo < 950) return 'I'
        else if (elo < 1000) return 'II'
        else if (elo < 1050) return 'III'
        else return 'IV'
      } else if (elo < 1300) {
        if (elo < 1150) return 'I'
        else if (elo < 1200) return 'II'
        else if (elo < 1250) return 'III'
        else return 'IV'
      } else if (elo < 1600) {
        if (elo < 1375) return 'I'
        else if (elo < 1450) return 'II'
        else if (elo < 1525) return 'III'
        else return 'IV'
      } else if (elo < 2000) {
        if (elo < 1700) return 'I'
        else if (elo < 1800) return 'II'
        else if (elo < 1900) return 'III'
        else return 'IV'
      } else if (elo >= 2000) {
        return ''
      }
      return ''
    },
  },
}
</script>

<style scoped>
.game-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5em;
  padding: 2em;
  max-width: 100%;
}

.header-section {
  text-align: start;
}

.players-info {
  display: flex;
  gap: 2em;
  flex-wrap: nowrap;
  justify-content: center;
}

.player-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 1em;
  border-radius: 20px;
  min-width: 200px;
}

.my-grid {
  border: 2px solid #5862f2;
}

.opp-grid {
  position: fixed;
  right: 20px;
  bottom: 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.score-text {
  margin: 0.5em 0;
  color: white;
}

.grids-container {
  display: flex;
  gap: 2em;
  flex-wrap: wrap;
  justify-content: center;
}

.grid-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5em;
}

.grid-label {
  font-size: 0.9em;
  font-weight: 500;
}

.game-canvas {
  border: 3px solid #5862f2;
  border-radius: 10px;
  background: #1a1a1a;
  box-shadow: 0 0 20px rgba(88, 98, 242, 0.3);
}

.opp-canvas {
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
  opacity: 0.8;
  height: 175px !important;
}

.countdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.countdown-display {
  text-align: center;
  padding: 1em 4em;
  background: rgba(88, 98, 242, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 2px solid #5862f2;
}

.countdown-number {
  font-size: 6em;
  width: 50px;
  text-align: center;
  font-weight: bold;
  color: white;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.back-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  border-radius: 10px;
}

@media (max-width: 900px) {
  .grids-container {
    flex-direction: column;
  }

  .game-canvas {
    max-width: 90vw;
    max-height: 90vw;
  }
}
</style>
