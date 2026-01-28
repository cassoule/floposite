<template>
  <v-layout>
    <v-main
      class="d-flex"
      style="place-items: center; place-content: center; flex-wrap: wrap; gap: 2em"
    >
      <div class="game-section">
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

          <v-btn
            v-if="!foundLobby"
            class="my-2"
            color="primary"
            text="Chercher un joueur"
            :loading="inQueue"
            :disabled="foundLobby !== null && foundLobby !== undefined"
            style="border-radius: 10px"
            @click="joinQueue"
          />
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
              <span>Toi</span>
              <v-img
                v-if="playerAvatar"
                :src="playerAvatar"
                :min-width="25"
                :max-width="25"
                :height="25"
                rounded="xl"
              ></v-img>
            </div>
            <p class="score-text">
              Score: <span class="font-weight-bold">{{ myScore }}</span>
            </p>
            <p v-if="myGameOver && !myWin" class="text-error">Perdu!</p>
            <p v-if="myWin" class="text-success">Victoire!</p>
          </div>

          <div class="player-card opp-grid">
            <div class="d-flex align-center gap-2">
              <span>{{ oppName }}</span>
              <v-img
                v-if="oppAvatar"
                :src="oppAvatar"
                :min-width="25"
                :max-width="25"
                :height="25"
                rounded="xl"
              ></v-img>
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
            <p class="score-text">
              Score: <span class="font-weight-bold">{{ oppScore }}</span>
            </p>
            <p v-if="oppGameOver && !oppWin" class="text-error">Perdu!</p>
            <p v-if="oppWin" class="text-success">Victoire!</p>
          </div>
        </div>

        <div v-if="foundLobby && countdown > 0" class="countdown-overlay">
          <div class="countdown-display">
            <h2 class="text-white mb-2">La partie commence dans</h2>
            <div class="countdown-number">{{ countdown }}</div>
          </div>
        </div>

        <div v-if="foundLobby" class="grids-container">
          <div class="grid-wrapper">
            <p class="grid-label text-white">Ta grille</p>
            <canvas
              ref="myCanvas"
              :width="canvasWidth"
              :height="canvasHeight"
              class="game-canvas my-canvas"
            ></canvas>
          </div>

          <div class="grid-wrapper">
            <p class="grid-label text-white-50">Grille de {{ oppName }}</p>
            <canvas
              ref="oppCanvas"
              :width="canvasWidth"
              :height="canvasHeight"
              class="game-canvas opp-canvas"
            ></canvas>
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
      inQueue: false,
      oppName: null,
      oppAvatar: null,

      // Game control
      gameLoop: null,
      gameSpeed: 150,
      gameStarted: false,
      countdown: 0,
      countdownInterval: null,

      // Dialog
      endGameDialog: false,
      title: null,
      message: null,

      // ELO
      elo: null,
      oppElo: null,
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

  created() {
    this._boundHandleUnload = (e) => this.handleUnload(e)
    window.addEventListener('beforeunload', this._boundHandleUnload)
    window.addEventListener('pagehide', this._boundHandleUnload)
  },

  beforeUnmount() {
    window.removeEventListener('beforeunload', this._boundHandleUnload)
    window.removeEventListener('pagehide', this._boundHandleUnload)
    window.removeEventListener('keydown', this.handleKeyPress)
    this.leaveQueueSync({ reason: 'component-destroy' })
    this.stopGameLoop()
    this.stopCountdown()
  },

  beforeRouteLeave(to, from, next) {
    this.leaveQueueSync({ reason: 'route-leave' })
    next()
  },

  methods: {
    initSocket() {
      this.socket = io(import.meta.env.VITE_FLAPI_URL.replace('/api', ''), {
        withCredentials: false,
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
      })

      this.socket.emit('snakeconnection', { id: this.discordId })

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

          if (!this.gameStarted && this.countdown === 0) {
            this.startCountdown()
          }
        }

        this.inQueue = this.inQueue && (this.foundLobby === null || this.foundLobby === undefined)
      })

      this.socket.on('snakegamestate', (e) => {
        const lobby = e.lobby

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
    },

    handleUnload(evt) {
      this.leaveQueueSync({ reason: 'unload' })
    },

    leaveQueueSync(meta = {}) {
      const payload = {
        discordId: this.discordId,
        game: 'snake',
        ...meta,
      }

      if (!this.inQueue && !this.foundLobby) return

      const url = `${import.meta.env.VITE_FLAPI_URL}/queue/leave`
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
          navigator.sendBeacon(url, blob)
        } else {
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch(() => {})
        }
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
      this.countdown = 5
      this.initGame() // Initialize grids so they can be displayed
      this.drawMyGame() // Draw initial state

      this.countdownInterval = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          this.stopCountdown()
          this.startGame()
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
      this.gameLoop = setInterval(() => {
        this.update()
        this.drawMyGame()
        this.emitGameState()
      }, this.gameSpeed)
    },

    stopGameLoop() {
      if (this.gameLoop) {
        clearInterval(this.gameLoop)
        this.gameLoop = null
      }
    },

    update() {
      if (this.myGameOver || this.myWin) return

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
        this.myScore += 10
        this.spawnFood()

        // Increase speed
        if (this.myScore % 50 === 0 && this.gameSpeed > 50) {
          this.gameSpeed -= 2
          this.stopGameLoop()
          this.startGameLoop()
        }
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

      this.socket.emit('snakegamestate', {
        playerId: this.discordId,
        snake: this.mySnake,
        food: this.myFood,
        score: this.myScore,
        gameOver: this.myGameOver,
        win: this.myWin,
      })
    },

    handleMatchEnd() {
      if (this.endGameDialog) return

      this.stopGameLoop()

      // Determine winner
      if (this.myWin && !this.oppWin) {
        this.title = 'Victoire'
        this.message = 'Tu as rempli la grille en premier !'
        this.socket.emit('snakegameOver', { playerId: this.discordId, winner: this.discordId })
      } else if (this.oppWin && !this.myWin) {
        this.title = 'Défaite'
        this.message = `${this.oppName} a rempli la grille en premier`
        const winnerId =
          this.foundLobby.p1.id === this.discordId ? this.foundLobby.p2.id : this.foundLobby.p1.id
        this.socket.emit('snakegameOver', { playerId: this.discordId, winner: winnerId })
      } else if (this.myGameOver && this.oppGameOver) {
        // Both lost, higher score wins
        if (this.myScore > this.oppScore) {
          this.title = 'Victoire'
          this.message = `Tu as survécu plus longtemps ! (${this.myScore} vs ${this.oppScore})`
          this.socket.emit('snakegameOver', { playerId: this.discordId, winner: this.discordId })
        } else if (this.oppScore > this.myScore) {
          this.title = 'Défaite'
          this.message = `${this.oppName} a survécu plus longtemps (${this.oppScore} vs ${this.myScore})`
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
      this.drawGame(ctx, this.mySnake, this.myFood)
    },

    drawOppGame() {
      const canvas = this.$refs.oppCanvas
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      this.drawGame(ctx, this.oppSnake, this.oppFood)
    },

    drawGame(ctx, snake, food) {
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

      // Draw food
      if (food) {
        ctx.fillStyle = '#ff5252'
        ctx.beginPath()
        ctx.arc(
          food.x * this.gridSize + this.gridSize / 2,
          food.y * this.gridSize + this.gridSize / 2,
          this.gridSize / 2 - 2,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      }

      // Draw snake
      if (snake && snake.length > 0) {
        snake.forEach((segment, index) => {
          let baseHeadColor = '#5862f2'
          let alphaValue = 1 - (index / snake.length) * 0.7
          let hexAlpha = Math.floor(alphaValue * 255)
            .toString(16)
            .padStart(2, '0')
          ctx.fillStyle = baseHeadColor + hexAlpha

          ctx.fillRect(
            segment.x * this.gridSize + 1,
            segment.y * this.gridSize + 1,
            this.gridSize - 2,
            this.gridSize - 2,
          )
        })
      }
    },

    reload() {
      location.reload()
    },

    leaveAndGoBack() {
      this.leaveQueueSync({ reason: 'manual-leave' })
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
  text-align: center;
}

.players-info {
  display: flex;
  gap: 2em;
  flex-wrap: wrap;
  justify-content: center;
}

.player-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 1em 1.5em;
  border-radius: 10px;
  min-width: 200px;
}

.my-grid {
  border: 2px solid #5862f2;
}

.opp-grid {
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
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 1000;
}

.countdown-display {
  text-align: center;
  padding: 2em;
  background: rgba(88, 98, 242, 0.1);
  border-radius: 20px;
  border: 2px solid #5862f2;
}

.countdown-number {
  font-size: 6em;
  font-weight: bold;
  color: #5862f2;
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
