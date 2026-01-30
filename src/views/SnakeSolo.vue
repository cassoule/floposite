<template>
  <v-layout>
    <v-main
      class="d-flex"
      style="place-items: center; place-content: center; flex-direction: column"
    >
      <div class="game-container">
        <div class="game-header">
          <v-card class="score-section" variant="tonal" rounded="xl">
            <v-card-text>
              <h3 class="text-white">
                Score : <span class="font-weight-bold">{{ score }}</span>
              </h3>
              <p class="text-white-50">Meilleur : {{ highScore }}</p>
            </v-card-text>
          </v-card>
          <div v-if="!gameStarted && !gameOver" class="start-message">
            <p v-if="!isScreenTooSmall" class="text-white">
              Appuie sur&nbsp;<kbd>ESPACE</kbd>&nbsp;pour commencer.
            </p>
            <p v-else class="text-white">Ton écran est trop petit</p>
          </div>
          <div v-if="gameOver" class="game-over-message">
            <h3 v-if="isWin" class="text-white mb-2" style="font-size: 2em">Victoire !</h3>
            <h3 v-else class="text-white mb-2">Game Over</h3>
            <p class="text-white mb-3" style="font-size: 1.3em">
              <span class="text-secondary">Score :</span>&nbsp;<span class="font-weight-bold">
                {{ score }}
              </span>
            </p>
            <v-btn class="text-none" color="primary" variant="flat" rounded="lg" @click="resetGame">
              Rejouer
            </v-btn>
          </div>
        </div>

        <div class="canvas-container">
          <canvas
            ref="bgCanvas"
            :width="canvasWidth"
            :height="canvasHeight"
            class="bg-canvas"
          ></canvas>
          <canvas
            ref="gameCanvas"
            :width="canvasWidth"
            :height="canvasHeight"
            class="game-canvas"
          ></canvas>
        </div>
      </div>
    </v-main>

    <v-btn
      class="back-btn text-none"
      text="Retour"
      variant="tonal"
      color="#ddd"
      @click="$router.push('/snake')"
    ></v-btn>
  </v-layout>
</template>

<script>
import axios from 'axios'

export default {
  name: 'SnakeSolo',

  data() {
    return {
      discordId: null,
      canvasWidth: 500,
      canvasHeight: 500,
      gridSize: 500 / 9,
      snake: [],
      prevSnake: [], // Track previous frame for interpolation
      direction: 'RIGHT',
      directionQueue: [],
      food: null,
      score: 0,
      highScore: 0,
      gameStarted: false,
      gameOver: false,
      isWin: false,
      gameLoop: null,
      renderLoop: null,
      gameSpeed: 150, // milliseconds per frame
      lastUpdateTime: 0,
      lastRenderTime: 0,
      targetFps: 60,
      needsRender: true,

      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    }
  },

  computed: {
    isScreenTooSmall() {
      return this.windowWidth < 800 //|| this.windowHeight < 870
    },
  },

  mounted() {
    const discordId = localStorage.getItem('discordId')
    if (!discordId) {
      this.$router.push('/')
      return
    }
    this.discordId = discordId

    this.loadHighScore()
    this.initGame()
    this.setupKeyboardControls()
    this.drawStaticBackground()
    this.drawGame()

    window.addEventListener('resize', this.handleResize)
  },

  beforeUnmount() {
    this.stopGameLoop()
    this.stopRenderLoop()
    window.removeEventListener('keydown', this.handleKeyPress)
    window.removeEventListener('resize', this.handleResize)
  },

  methods: {
    handleResize() {
      this.windowWidth = window.innerWidth
      this.windowHeight = window.innerHeight
    },

    initGame() {
      // Initialize snake in the middle
      const startX = Math.floor(this.canvasWidth / this.gridSize / 2)
      const startY = Math.floor(this.canvasHeight / this.gridSize / 2)

      this.snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY },
      ]

      this.direction = 'RIGHT'
      this.directionQueue = []
      this.score = 0
      this.gameOver = false
      this.isWin = false
      this.spawnFood()
    },

    setupKeyboardControls() {
      window.addEventListener('keydown', this.handleKeyPress)
    },

    handleKeyPress(e) {
      if (e.code === 'Space' && this.gameOver) {
        e.preventDefault()
        this.resetGame()
        return
      }
      if (e.code === 'Space' && !this.gameStarted) {
        e.preventDefault()
        this.startGame()
        return
      }

      if (!this.gameStarted || this.gameOver) return

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

    changeDirection(dir) {
      if (!this.gameStarted) {
        this.startGame()
      }

      if (this.gameOver) return

      this.queueDirection(dir)
    },

    queueDirection(newDirection) {
      // Get the last direction in the queue, or the current direction if queue is empty
      const lastDirection =
        this.directionQueue.length > 0
          ? this.directionQueue[this.directionQueue.length - 1]
          : this.direction

      // Check if the new direction is valid (not opposite to the last direction)
      const isValid =
        (newDirection === 'UP' && lastDirection !== 'DOWN') ||
        (newDirection === 'DOWN' && lastDirection !== 'UP') ||
        (newDirection === 'LEFT' && lastDirection !== 'RIGHT') ||
        (newDirection === 'RIGHT' && lastDirection !== 'LEFT')

      // Only add to queue if it's valid and different from the last queued direction
      if (isValid && newDirection !== lastDirection) {
        this.directionQueue.push(newDirection)
      }
    },

    startGame() {
      if (this.gameStarted || this.isScreenTooSmall) return

      this.gameStarted = true
      this.startGameLoop()
    },

    startGameLoop() {
      this.lastUpdateTime = Date.now()
      this.gameLoop = setInterval(() => {
        this.prevSnake = this.snake.map(segment => ({ ...segment }))
        this.update()
        this.lastUpdateTime = Date.now()
        this.needsRender = true
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
      const render = (timestamp) => {
        const elapsed = timestamp - this.lastRenderTime
        const frameTime = 1000 / this.targetFps
        
        if (elapsed >= frameTime && this.needsRender) {
          this.drawGame()
          this.lastRenderTime = timestamp
          this.needsRender = false
        }
        
        // Always render during interpolation
        if (this.gameStarted && !this.gameOver) {
          const timeSinceUpdate = Date.now() - this.lastUpdateTime
          if (timeSinceUpdate < this.gameSpeed) {
            this.needsRender = true
          }
        }
        
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
      if (this.gameOver) return

      // Update direction from queue if available
      if (this.directionQueue.length > 0) {
        this.direction = this.directionQueue.shift()
      }

      // Calculate new head position
      const head = { ...this.snake[0] }

      switch (this.direction) {
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
        this.endGame()
        return
      }

      // Check self collision
      if (this.snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        this.endGame()
        return
      }

      // Add new head
      this.snake.unshift(head)

      // Check food collision
      if (head.x === this.food.x && head.y === this.food.y) {
        this.score++
        this.spawnFood()

        // Increase speed slightly every 5 foods
        //if (this.score % 5 === 0 && this.gameSpeed > 50) {
        this.gameSpeed -= 1
        this.stopGameLoop()
        this.startGameLoop()
        //}
      } else {
        // Remove tail if no food eaten
        this.snake.pop()
      }
    },

    spawnFood() {
      const maxX = this.canvasWidth / this.gridSize
      const maxY = this.canvasHeight / this.gridSize
      const totalCells = maxX * maxY

      // Check if snake has filled the entire grid
      if (this.snake.length >= totalCells) {
        this.isWin = true
        this.endGame()
        return
      }

      let newFood
      do {
        newFood = {
          x: Math.floor(Math.random() * maxX),
          y: Math.floor(Math.random() * maxY),
        }
      } while (this.snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y))

      this.food = newFood
    },

    drawStaticBackground() {
      const canvas = this.$refs.bgCanvas
      if (!canvas) return

      const ctx = canvas.getContext('2d')

      // Clear and fill background
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)

      // Draw grid once
      ctx.strokeStyle = '#2a2a2a'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i <= this.canvasWidth / this.gridSize; i++) {
        ctx.moveTo(i * this.gridSize, 0)
        ctx.lineTo(i * this.gridSize, this.canvasHeight)
        ctx.moveTo(0, i * this.gridSize)
        ctx.lineTo(this.canvasWidth, i * this.gridSize)
      }
      ctx.stroke()
    },

    drawGame() {
      const canvas = this.$refs.gameCanvas
      if (!canvas) return

      const ctx = canvas.getContext('2d')

      // Clear only the game layer (transparent)
      ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)

      // Calculate interpolation factor
      const now = Date.now()
      const timeSinceUpdate = now - this.lastUpdateTime
      const progress = Math.min(timeSinceUpdate / this.gameSpeed, 1)

      // Draw food as circle (much faster than emoji)
      if (this.food) {
        const x = this.food.x * this.gridSize + this.gridSize / 2
        const y = this.food.y * this.gridSize + this.gridSize / 2
        const radius = this.gridSize / 3

        ctx.fillStyle = '#ff4444'
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
        
        // Add small highlight
        ctx.fillStyle = '#ff8888'
        ctx.beginPath()
        ctx.arc(x - radius / 3, y - radius / 3, radius / 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw snake with interpolation
      const snakeSegments = this.snake.map((segment, index) => {
        let displayX = segment.x
        let displayY = segment.y

        if (this.prevSnake[index]) {
          const prev = this.prevSnake[index]
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

      // Draw snake body as continuous shape with single path
      if (snakeSegments.length > 0) {
        const bodyWidth = this.gridSize * .7

        ctx.strokeStyle = '#5862f2'
        ctx.lineWidth = bodyWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()

        // Start from tail
        const tail = snakeSegments[snakeSegments.length - 1]
        ctx.moveTo(tail.centerX, tail.centerY)

        // Draw path through all segments
        for (let i = snakeSegments.length - 2; i >= 0; i--) {
          const segment = snakeSegments[i]
          const nextSegment = snakeSegments[i + 1]
          const dx = Math.abs(segment.centerX - nextSegment.centerX)
          const dy = Math.abs(segment.centerY - nextSegment.centerY)
          
          // If both dx and dy are significant, draw an L-shaped path
          if (dx > 1 && dy > 1) {
            const curr = this.snake[i]
            const prev = this.prevSnake[i]
            
            if (prev && curr) {
              const xChanged = curr.x !== prev.x
              const yChanged = curr.y !== prev.y
              
              if (xChanged && !yChanged) {
                ctx.lineTo(nextSegment.centerX, segment.centerY)
              } else {
                ctx.lineTo(segment.centerX, nextSegment.centerY)
              }
            } else {
              ctx.lineTo(segment.centerX, nextSegment.centerY)
            }
          }
          
          ctx.lineTo(segment.centerX, segment.centerY)
        }
        
        ctx.stroke()

        // Draw head as larger circle
        const head = snakeSegments[0]
        const headRadius = ((this.gridSize * .7) - 2) / 2

        ctx.fillStyle = '#5862f2'
        ctx.beginPath()
        ctx.arc(head.centerX, head.centerY, headRadius, 0, Math.PI * 2)
        ctx.fill()

        // Draw eyes on head
        const eyeSize = this.gridSize / 6.5
        const eyeDistance = this.gridSize / 7

        let eye1X, eye1Y, eye2X, eye2Y

        switch (this.direction) {
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

        if (!this.gameOver) {
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(eye1X, eye1Y, eyeSize / 2, 0, Math.PI * 2)
          ctx.fill()

          ctx.beginPath()
          ctx.arc(eye2X, eye2Y, eyeSize / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        

        // Draw pupils
        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.arc(eye1X, eye1Y, eyeSize / 3.5, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.arc(eye2X, eye2Y, eyeSize / 3.5, 0, Math.PI * 2)
        ctx.fill()
      }
    },

    async endGame() {
      this.gameOver = true
      this.gameStarted = false
      this.stopGameLoop()

      if (this.score > this.highScore) {
        this.highScore = this.score
        this.saveHighScore()
      }

      const url = import.meta.env.VITE_FLAPI_URL + '/snake/reward'
      try {
        const response = await axios.post(url, {
          discordId: this.discordId,
          score: this.score,
          isWin: this.isWin,
        })
      } catch (error) {
        console.error('Error rewarding snake solo score:', error)
      }
    },

    resetGame() {
      this.stopGameLoop()
      this.stopRenderLoop()
      this.gameSpeed = 150
      this.initGame()
      this.gameStarted = false
      this.needsRender = true
      this.drawGame()
    },

    loadHighScore() {
      const saved = localStorage.getItem('snakeHighScore')
      this.highScore = saved ? parseInt(saved) : 0
    },

    saveHighScore() {
      localStorage.setItem('snakeHighScore', this.highScore.toString())
    },
  },
}
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5em;
  padding: 2em;
}

.game-header {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1em;
}

.score-section {
  position: fixed;
  bottom: 20px;
  left: 20px;
  text-align: start;
}

.score-section h2 {
  font-size: 2em;
  margin-bottom: 0.2em;
}

.start-message,
.game-over-message {
  position: absolute;
  z-index: 200;
  text-align: center;
  padding: 1em;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  bottom: 50%;
  transform: translateY(50%);
  width: fit-content;
  backdrop-filter: blur(100px);
}

.canvas-container {
  position: relative;
  display: inline-block;
}

.bg-canvas {
  position: absolute;
  top: 0;
  left: 0;
  border: 3px solid #5862f2;
  border-radius: 10px;
  background: #1a1a1a;
  box-shadow: 0 0 30px rgba(88, 98, 242, 0.3);
}

.game-canvas {
  position: relative;
  border: 3px solid #5862f2;
  border-radius: 10px;
  pointer-events: none;
}

.mobile-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5em;
  margin-top: 1em;
}

.control-row {
  display: flex;
  gap: 0.5em;
}

kbd {
  background: #333;
  padding: 0.3em 0.6em;
  border-radius: 5px;
  border: 1px solid #555;
  font-family: monospace;
  color: #5862f2;
}

.back-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  border-radius: 10px;
}

@media (max-width: 768px) {
  .game-canvas {
    max-width: 90vw;
    max-height: 90vw;
  }
}
</style>
