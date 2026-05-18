<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-3">
      <v-chip size="small" :color="statusColor" variant="flat">{{ statusLabel }}</v-chip>
      <div class="d-flex align-center" style="gap: 6px; flex-wrap: wrap">
        <v-chip
          v-for="(h, i) in room.history.slice(-4)"
          :key="'hist-' + i"
          size="x-small"
          :class="{ 'history-gold': h >= 10 }"
          variant="flat"
          :style="{ background: getHistoryGradient(h), color: 'white' }"
        >
          {{ h.toFixed(2) }}x
        </v-chip>
      </div>
    </div>

    <div class="multiplier-wrap d-flex justify-center align-center my-2">
      <span class="multiplier-text" :style="multiplierStyle">
        {{ room.status === 'betting' ? '—' : displayMultiplier.toFixed(2) + 'x' }}
      </span>
    </div>

    <div class="chart-area" ref="chartArea" @mousemove="onMouseMove" @mouseleave="onMouseLeave">
      <div class="parallax-bg" :class="{ 'is-flying': room.status === 'flying' }"></div>

      <canvas ref="crashCanvas"></canvas>

      <div class="plane-container" :style="planeStyle">
        <img
          v-if="!planeFallback"
          src="/crash_plane.webp"
          class="plane-img"
          :class="{ 'plane-crashed': room.status === 'crashed' || room.status === 'payout' }"
          alt="avion"
          @error="onPlaneImgError"
        />
        <v-icon
          v-else
          size="40"
          :color="room.status === 'crashed' || room.status === 'payout' ? 'error' : 'primary'"
          >mdi-airplane</v-icon
        >
      </div>

      <div v-if="hoveredPlayer" class="avatar-tooltip" :style="tooltipStyle">
        <div class="font-weight-bold">{{ hoveredPlayer.username }}</div>
        <div style="opacity: 0.9">Encaissé à {{ hoveredPlayer.cashoutMulti.toFixed(2) }}x</div>
        <div style="color: #1d9e75; font-weight: bold">
          +{{ formatAmount(hoveredPlayer.winAmount) }} Flopos
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { formatAmount } from '@/utils/format.js'

// Curve follows e^(LAMBDA * t) — controls how fast the multiplier grows
const LAMBDA = 0.08
const CURVE_MAX_T = 10
const CURVE_INIT_MAX_Y = 2.0
const CURVE_MIN_Y = 1.0

export default {
  name: 'CrashChart',
  props: { room: Object },
  emits: ['update-multiplier'],
  data: () => ({
    ctx: null,
    rafId: null,
    flyStartTime: null,
    serverMultiplier: 1.0,
    displayMultiplier: 1.0,
    currentT: 0,
    planeStyle: { left: '0px', top: '0px' },
    planeFallback: false,
    avatarCache: {},
    drawnAvatars: [],
    hoveredPlayer: null,
    tooltipStyle: { top: '0px', left: '0px' },
  }),
  computed: {
    multiplierStyle() {
      const s = this.room?.status
      if (s === 'crashed' || s === 'payout') {
        return { color: '#e24b4a' }
      }
      if (s === 'betting') {
        return { color: 'rgba(255, 255, 255, 0.4)' }
      }
      if (s === 'flying') {
        const { r, g, b } = this.getInterpolatedColor(this.displayMultiplier)
        return {
          color: `rgb(${r}, ${g}, ${b})`,
          textShadow: `0 0 15px rgba(${r}, ${g}, ${b}, 0.5)`,
        }
      }
      return {}
    },
    statusLabel() {
      switch (this.room?.status) {
        case 'betting':
          return 'Mises ouvertes'
        case 'flying':
          return 'En vol ✈'
        case 'crashed':
          return 'Crashé !'
        case 'payout':
          return 'Résultats'
        default:
          return '—'
      }
    },
    statusColor() {
      switch (this.room?.status) {
        case 'betting':
          return 'primary'
        case 'flying':
          return 'success'
        case 'crashed':
          return 'error'
        case 'payout':
          return 'warning'
        default:
          return 'default'
      }
    },
  },
  watch: {
    'room.status'(newStatus, oldStatus) {
      if (newStatus === 'flying' && oldStatus !== 'flying') {
        this.currentT = 0
        this.displayMultiplier = 1.0
        this.serverMultiplier = 1.0
        this.flyStartTime = performance.now()
        this.startRAF()
      }
      if (newStatus === 'betting') {
        this.stopRAF()
        this.currentT = 0
        this.displayMultiplier = 1.0
        this.flyStartTime = null
        this.hoveredPlayer = null
        this.$nextTick(() => this.drawFrame())
      }
      if (newStatus === 'crashed' || newStatus === 'payout') {
        this.stopRAF()
        if (this.room?.currentMultiplier) {
          this.displayMultiplier = this.room.currentMultiplier
          this.currentT = Math.log(this.displayMultiplier) / LAMBDA
        }
        this.$emit('update-multiplier', this.displayMultiplier)
        this.$nextTick(() => {
          this.drawFrame()
          setTimeout(() => this.tiltPlaneCrash(), 20)
        })
      }
    },
    'room.currentMultiplier'(val) {
      this.serverMultiplier = val
      // If local time drifts more than 30ms from server, nudge flyStartTime to re-sync
      if (this.room?.status === 'flying' && val > 1.0) {
        const expectedElapsed = (Math.log(val) / LAMBDA) * 1000
        const actualElapsed = performance.now() - this.flyStartTime
        const drift = actualElapsed - expectedElapsed
        if (Math.abs(drift) > 30) this.flyStartTime += drift * 0.1
      }
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.initCanvas()

      // If we mount mid-round, back-calculate flyStartTime so the curve starts at the right spot
      if (this.room?.status === 'flying') {
        const m = this.room.currentMultiplier ?? 1.0
        this.serverMultiplier = m
        this.flyStartTime = performance.now() - (Math.log(Math.max(m, 1.0001)) / LAMBDA) * 1000
        this.startRAF()
      } else {
        this.drawFrame()
      }
    })

    window.addEventListener(
      'resize',
      (this._onResize = () => {
        this.resizeCanvas()
        this.drawFrame()
      }),
    )
  },
  beforeUnmount() {
    this.stopRAF()
    if (this._onResize) window.removeEventListener('resize', this._onResize)
  },
  methods: {
    formatAmount,

    // Color gradient: pink at 1x → blue at 5x → gold at 10x+
    getInterpolatedColor(h) {
      if (h >= 10) return { r: 255, g: 215, b: 0 }

      const minLog = Math.log(1.0)
      const maxLog = Math.log(10)
      const currentLog = Math.log(Math.max(1.0, h))
      const percent = Math.max(0, Math.min(1, (currentLog - minLog) / (maxLog - minLog)))

      const stops = [
        { p: 0,   r: 237, g: 97,  b: 227 }, // pink
        { p: 0.5, r: 88,  g: 101, b: 242 }, // blue
        { p: 1,   r: 255, g: 215, b: 0   }, // gold
      ]

      let c1 = stops[0], c2 = stops[stops.length - 1]
      for (let i = 0; i < stops.length - 1; i++) {
        if (percent >= stops[i].p && percent <= stops[i + 1].p) {
          c1 = stops[i]
          c2 = stops[i + 1]
          break
        }
      }

      const range = c2.p - c1.p
      const localPct = range === 0 ? 0 : (percent - c1.p) / range

      return {
        r: Math.round(c1.r + (c2.r - c1.r) * localPct),
        g: Math.round(c1.g + (c2.g - c1.g) * localPct),
        b: Math.round(c1.b + (c2.b - c1.b) * localPct),
      }
    },

    getHistoryGradient(h) {
      if (h < 1.5) return 'linear-gradient(135deg, #fa2524 0%, #b31b1b 100%)'

      const { r, g, b } = this.getInterpolatedColor(h)
      const r2 = Math.max(0, r - 40)
      const g2 = Math.max(0, g - 40)
      const b2 = Math.max(0, b - 40)

      return `linear-gradient(135deg, rgb(${r}, ${g}, ${b}) 0%, rgb(${r2}, ${g2}, ${b2}) 100%)`
    },

    initCanvas() {
      const canvas = this.$refs.crashCanvas
      if (!canvas) return
      this.ctx = canvas.getContext('2d')
      this.resizeCanvas()
    },

    // Scale canvas to device pixel ratio to avoid blurry rendering on retina screens
    resizeCanvas() {
      const canvas = this.$refs.crashCanvas
      const area = this.$refs.chartArea
      if (!canvas || !area) return
      const dpr = window.devicePixelRatio || 1
      const w = area.clientWidth
      const h = area.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      this.ctx.scale(dpr, dpr)
    },
    startRAF() {
      this.stopRAF()
      const loop = (now) => {
        this.rafId = requestAnimationFrame(loop)
        this.tickFrame(now)
      }
      this.rafId = requestAnimationFrame(loop)
    },
    stopRAF() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId)
        this.rafId = null
      }
    },
    tickFrame(now) {
      if (!this.flyStartTime) return
      const elapsedSec = (now - this.flyStartTime) / 1000
      this.displayMultiplier = Math.exp(LAMBDA * Math.max(0, elapsedSec))
      this.currentT = Math.max(0, elapsedSec)
      this.$emit('update-multiplier', this.displayMultiplier)
      this.drawFrame()
    },

    onMouseMove(e) {
      const canvas = this.$refs.crashCanvas
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      let found = null
      for (const av of this.drawnAvatars) {
        const dx = mouseX - av.x
        const dy = mouseY - av.y
        if (dx * dx + dy * dy <= (av.radius + 4) * (av.radius + 4)) {
          found = av
          break
        }
      }

      if (found) {
        this.hoveredPlayer = found
        this.tooltipStyle = {
          left: found.x + 15 + 'px',
          top: found.y - 10 + 'px',
        }
      } else {
        this.hoveredPlayer = null
      }
    },
    onMouseLeave() {
      this.hoveredPlayer = null
    },

    drawFrame() {
      const canvas = this.$refs.crashCanvas
      const ctx = this.ctx
      if (!canvas || !ctx) return
      const dpr = window.devicePixelRatio || 1
      const W = canvas.width / dpr
      const H = canvas.height / dpr
      ctx.clearRect(0, 0, W, H)

      this.drawnAvatars = []

      const isCrashed = this.room?.status === 'crashed' || this.room?.status === 'payout'
      const isBetting = this.room?.status === 'betting'
      const currentY = isBetting ? 1.0 : (this.displayMultiplier ?? 1.0)
      const currentT = this.currentT || 0

      let lineColor, fillColorTop, fillColorBot
      if (isCrashed) {
        lineColor = '#e24b4a'
        fillColorTop = 'rgba(226,75,74,0.18)'
        fillColorBot = 'rgba(226,75,74,0)'
      } else if (isBetting) {
        lineColor = '#5865f2'
        fillColorTop = 'rgba(88,101,242,0.18)'
        fillColorBot = 'rgba(88,101,242,0)'
      } else {
        const { r, g, b } = this.getInterpolatedColor(currentY)
        lineColor = `rgb(${r}, ${g}, ${b})`
        fillColorTop = `rgba(${r}, ${g}, ${b}, 0.3)`
        fillColorBot = `rgba(${r}, ${g}, ${b}, 0)`
      }

      const gridColor = 'rgba(128,128,128,0.12)'
      const tickColor = '#888'
      const PAD_LEFT = 44
      const PAD_RIGHT = 32
      const PAD_TOP = 10
      const PAD_BOTTOM = 28
      const plotW = W - PAD_LEFT - PAD_RIGHT
      const plotH = H - PAD_TOP - PAD_BOTTOM

      // Axes expand as the multiplier grows
      const maxT = Math.max(CURVE_MAX_T, currentT)
      const minY = CURVE_MIN_Y
      const maxY = Math.max(CURVE_INIT_MAX_Y, currentY * 1.25)

      const toPixel = (t, y) => ({
        x: PAD_LEFT + (t / maxT) * plotW,
        y: PAD_TOP + plotH - ((y - minY) / (maxY - minY)) * plotH,
      })

      const ySteps = this.niceYTicks(minY, maxY, 5)
      ctx.save()
      ctx.strokeStyle = gridColor
      ctx.lineWidth = 1
      ctx.fillStyle = tickColor
      ctx.font = '11px monospace'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      for (const yVal of ySteps) {
        const py = PAD_TOP + plotH - ((yVal - minY) / (maxY - minY)) * plotH
        ctx.beginPath()
        ctx.moveTo(PAD_LEFT, py)
        ctx.lineTo(W - 12, py)
        ctx.stroke()
        ctx.fillText(yVal.toFixed(1) + 'x', PAD_LEFT - 4, py)
      }
      ctx.restore()

      if (currentT > 0 && !isBetting) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(PAD_LEFT, PAD_TOP, plotW + PAD_RIGHT, plotH)
        ctx.clip()

        const grad = ctx.createLinearGradient(0, PAD_TOP, 0, PAD_TOP + plotH)
        grad.addColorStop(0, fillColorTop)
        grad.addColorStop(1, fillColorBot)

        // 80 segments gives a smooth curve without being too expensive
        const segments = 80
        const first = toPixel(0, 1.0)
        const lastPx = toPixel(currentT, currentY)
        ctx.beginPath()
        ctx.moveTo(first.x, first.y)
        for (let i = 1; i <= segments; i++) {
          const t = (i / segments) * currentT
          const y = Math.exp(LAMBDA * t)
          const p = toPixel(t, y)
          ctx.lineTo(p.x, p.y)
        }
        ctx.lineTo(lastPx.x, PAD_TOP + plotH)
        ctx.lineTo(first.x, PAD_TOP + plotH)
        ctx.closePath()
        ctx.fillStyle = grad
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(first.x, first.y)
        for (let i = 1; i <= segments; i++) {
          const t = (i / segments) * currentT
          const y = Math.exp(LAMBDA * t)
          const p = toPixel(t, y)
          ctx.lineTo(p.x, p.y)
        }
        ctx.strokeStyle = lineColor
        ctx.lineWidth = 3
        ctx.lineJoin = 'round'
        ctx.shadowColor = lineColor
        ctx.shadowBlur = 8
        ctx.stroke()
        ctx.restore()

        for (const p of Object.values(this.room?.players || {})) {
          if (p.inRound && p.cashedOut && p.betAmount > 0) {
            const cashoutMulti = p.winAmount / p.betAmount
            const tCashout = Math.log(cashoutMulti) / LAMBDA

            if (tCashout <= currentT) {
              const pos = toPixel(tCashout, cashoutMulti)
              const radius = 12

              // Store position for hover hit-detection in onMouseMove
              this.drawnAvatars.push({
                x: pos.x,
                y: pos.y,
                radius: radius,
                username: p.username,
                cashoutMulti: cashoutMulti,
                winAmount: p.winAmount,
              })

              if (!this.avatarCache[p.id]) {
                const img = new Image()
                img.crossOrigin = 'Anonymous'
                img.src = p.avatar
                this.avatarCache[p.id] = img
              }

              const img = this.avatarCache[p.id]

              if (img.complete) {
                ctx.save()
                ctx.beginPath()
                ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
                ctx.closePath()
                ctx.clip()
                ctx.drawImage(img, pos.x - radius, pos.y - radius, radius * 2, radius * 2)
                ctx.restore()

                ctx.save()
                ctx.beginPath()
                ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
                const { r: cr, g: cg, b: cb } = this.getInterpolatedColor(cashoutMulti)
                ctx.strokeStyle = `rgb(${cr}, ${cg}, ${cb})`
                ctx.lineWidth = 2
                ctx.stroke()
                ctx.restore()
              }
            }
          }
        }

        this.updatePlanePositionCanvas(lastPx, currentT, toPixel)
      } else {
        this.planeStyle = {
          left: PAD_LEFT - 26 + 'px',
          top: PAD_TOP + plotH - 26 + 'px',
          bottom: 'auto',
          transform: 'rotate(0deg)',
          transition: 'none',
        }
      }
    },

    // Angle the plane to match the slope of the curve at the current point
    updatePlanePositionCanvas(lastPx, currentT, toPixel) {
      const isCrashed = this.room?.status === 'crashed' || this.room?.status === 'payout'
      const deltaT = 0.02
      const prevT = Math.max(0, currentT - deltaT)
      const prevY = Math.exp(LAMBDA * prevT)
      const prevPx = toPixel(prevT, prevY)
      const angle = Math.atan2(lastPx.y - prevPx.y, lastPx.x - prevPx.x) * (180 / Math.PI)
      if (isCrashed) {
        this.planeStyle = {
          ...this.planeStyle,
          left: lastPx.x - 26 + 'px',
          top: lastPx.y - 26 + 'px',
        }
      } else {
        this.planeStyle = {
          left: lastPx.x - 26 + 'px',
          top: lastPx.y - 26 + 'px',
          bottom: 'auto',
          transform: `rotate(${angle}deg)`,
          transition: 'none',
        }
      }
    },

    tiltPlaneCrash() {
      this.planeStyle = {
        ...this.planeStyle,
        transform: 'rotate(45deg)',
        transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
      }
    },

    // Rounds tick values to clean numbers so the Y axis doesn't look ugly
    niceYTicks(min, max, targetCount) {
      const range = max - min
      const rawStep = range / targetCount
      const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
      const niceSteps = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10]
      let step = niceSteps.find((s) => s * mag >= rawStep) || niceSteps[niceSteps.length - 1]
      step *= mag
      const ticks = []
      let t = Math.ceil(min / step) * step
      while (t <= max + step * 0.01) {
        ticks.push(parseFloat(t.toFixed(4)))
        t += step
      }
      return ticks
    },

    onPlaneImgError() {
      this.planeFallback = true
    },
  },
}
</script>

<style scoped>
.chart-area {
  position: relative;
  overflow: hidden;
  height: 250px;
  border-radius: 10px;
  margin: 0.5rem 0;
  cursor: default;
}
.parallax-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/planets.png');
  background-repeat: repeat-x;
  background-size: auto 100%;
  background-position: 0 0;
  opacity: 0.3;
  z-index: 0;
  animation: scrollSpace 15s linear infinite;
  animation-play-state: paused;
}
.parallax-bg.is-flying {
  animation-play-state: running;
}
@keyframes scrollSpace {
  from {
    background-position: 0 0;
  }
  to {
    background-position: -1000px 0;
  }
}
.chart-area canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  z-index: 1;
}
.plane-container {
  position: absolute;
  pointer-events: none;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
.plane-img {
  width: 52px;
  height: 52px;
  object-fit: contain;
  transition:
    filter 0.3s ease,
    opacity 0.3s ease;
}
.plane-crashed {
  filter: hue-rotate(340deg) saturate(2);
  opacity: 0.65;
}

.avatar-tooltip {
  position: absolute;
  background: rgba(20, 20, 20, 0.95);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  pointer-events: none;
  z-index: 10;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  transform: translateY(-50%);
  line-height: 1.4;
}

.multiplier-wrap {
  min-height: 60px;
}
.multiplier-text {
  font-size: 42px;
  font-weight: 500;
  transition:
    color 0.1s linear,
    text-shadow 0.1s linear;
  line-height: 1;
  position: relative;
}

.history-gold {
  font-weight: bold;
  box-shadow: 0 0 8px rgba(241, 196, 15, 0.6);
  animation: pulseGoldChip 1.5s infinite alternate;
}
@keyframes pulseGoldChip {
  from {
    box-shadow: 0 0 4px rgba(241, 196, 15, 0.4);
  }
  to {
    box-shadow: 0 0 12px rgba(241, 196, 15, 0.9);
  }
}
</style>