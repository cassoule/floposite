<template>
  <div ref="container" class="dice-container"></div>
</template>

<script>
import * as THREE from 'three'

/**
 * Maps the target die value to its final rotation (Euler angles).
 * (ya trop de maths, j'ai arrêté les maths avec fegd, merci l'ia)
 */
const FACE_ROTATIONS = {
  1: new THREE.Euler(0, 0, 0),
  6: new THREE.Euler(Math.PI, 0, 0),
  2: new THREE.Euler(0, 0, Math.PI / 2),
  5: new THREE.Euler(0, 0, -Math.PI / 2),
  3: new THREE.Euler(-Math.PI / 2, 0, 0),
  4: new THREE.Euler(Math.PI / 2, 0, 0),
}

export default {
  name: 'Dice3D',
  props: {
    status: { type: String, default: 'betting' },
    dice: { type: Array, default: () => [] },
    size: { type: Number, default: 1.4 },
  },

  data() {
    return {
      rolling: false,
      isMobile: false,
    }
  },

  beforeCreate() {
    // Initialization outside of Vue (avoids unnecessary reactivity overhead on Three.js objects)
    this.scene = this.camera = this.renderer = null
    this.diceMeshes = []
    this.animationId = null
    this.clock = new THREE.Clock()
  },

  watch: {
    dice: {
      handler(v) {
        this.maybeRoll(v)
      },
      deep: true,
    },
    status(s) {
      if (s === 'rolling') this.maybeRoll(this.dice)
    },
  },

  mounted() {
    this.initThreeJS()
    window.addEventListener('resize', this.onResize)
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.onResize)
    cancelAnimationFrame(this.animationId)
    this.renderer?.dispose()
  },

  methods: {
    maybeRoll(values) {
      if (this.status === 'rolling' && values?.length === 3 && !this.rolling)
        this.startRollAnimation(values)
    },

    initThreeJS() {
      const el = this.$refs.container
      const W = el.clientWidth
      const H = el.clientHeight || 300

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      this.renderer.setSize(W, H)
      this.renderer.shadowMap.enabled = true
      el.appendChild(this.renderer.domElement)

      this.scene = new THREE.Scene()
      this.camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200)

      this.scene.add(new THREE.AmbientLight(0xffffff, 0.6))
      const dir = new THREE.DirectionalLight(0xfffaed, 1.8)
      dir.position.set(2, 12, 4)
      dir.castShadow = true
      this.scene.add(dir)
      const fill = new THREE.PointLight(0x4477ee, 0.8)
      fill.position.set(-3, 8, 2)
      this.scene.add(fill)

      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(12, 12),
        new THREE.MeshStandardMaterial({
          color: 0x1a1a2e,
          transparent: true,
          opacity: 0.15,
          side: THREE.DoubleSide,
        }),
      )
      plane.rotation.x = -Math.PI / 2
      plane.position.y = 0.01
      plane.receiveShadow = true
      this.scene.add(plane)

      this.setupDice()
      this.updateLayout()

      this.tick = this.tick.bind(this)
      this.tick()
    },

    /**
     * Aligns the dice in a line on mobile, or in a triangle on desktop.
     */
    updateLayout() {
      const w = window.innerWidth
      this.isMobile = w < 1280

      const scaleMultiplier = this.isMobile ? 1.6 : 1.0
      const s = this.size * scaleMultiplier

      let starts

      if (this.isMobile) {
        starts = [
          { x: -1.5 * s, y: s * 1.2, z: 0 },
          { x: 0, y: s * 1.2, z: 0 },
          { x: 1.5 * s, y: s * 1.2, z: 0 },
        ]
        this.camera.position.set(0, 13, 2.5)
      } else {
        starts = [
          { x: -1.6 * s, y: s * 1.2, z: -0.9 * s },
          { x: 1.6 * s, y: s * 1.2, z: -0.9 * s },
          { x: 0, y: s * 1.2, z: 1.8 * s },
        ]
        this.camera.position.set(0, 14, 2)
      }

      this.camera.lookAt(0, 1.5, 0)

      if (this.diceMeshes.length) {
        this.diceMeshes.forEach((d, i) => {
          d.homePos = { ...starts[i] }
          d.mesh.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier)
          d.effectiveSize = s

          if (d.settled && d.phase === 'idle') {
            d.mesh.position.set(d.homePos.x, d.homePos.y, d.homePos.z)
          }
        })
      }
    },

    /**
     * Dynamically generates a canvas texture for a given face.
     */
    makeFace(n) {
      const S = 256
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = S
      const ctx = canvas.getContext('2d')

      ctx.fillStyle = '#f4ede0'
      ctx.fillRect(0, 0, S, S)

      const pos = {
        1: [[0.5, 0.5]],
        2: [
          [0.27, 0.27],
          [0.73, 0.73],
        ],
        3: [
          [0.27, 0.27],
          [0.5, 0.5],
          [0.73, 0.73],
        ],
        4: [
          [0.27, 0.27],
          [0.73, 0.27],
          [0.27, 0.73],
          [0.73, 0.73],
        ],
        5: [
          [0.27, 0.27],
          [0.73, 0.27],
          [0.5, 0.5],
          [0.27, 0.73],
          [0.73, 0.73],
        ],
        6: [
          [0.27, 0.22],
          [0.73, 0.22],
          [0.27, 0.5],
          [0.73, 0.5],
          [0.27, 0.78],
          [0.73, 0.78],
        ],
      }

      ctx.fillStyle = n === 1 || n === 4 ? '#d51e0f' : '#1a1a2e'
      ;(pos[n] || []).forEach(([px, py]) => {
        ctx.beginPath()
        ctx.arc(px * S, py * S, S * 0.08, 0, Math.PI * 2)
        ctx.fill()
      })

      return new THREE.CanvasTexture(canvas)
    },

    setupDice() {
      // Order required by Three.js BoxGeometry to map faces correctly
      const faceOrder = [2, 5, 1, 6, 3, 4]
      const mats = faceOrder.map(
        (n) =>
          new THREE.MeshStandardMaterial({ map: this.makeFace(n), roughness: 0.3, metalness: 0.1 }),
      )
      const geo = new THREE.BoxGeometry(this.size, this.size, this.size)

      this.diceMeshes = [0, 1, 2].map(() => {
        const mesh = new THREE.Mesh(geo, mats)
        mesh.castShadow = mesh.receiveShadow = true
        this.scene.add(mesh)

        return {
          mesh,
          target: 1,
          phase: 'idle', // 'idle' | 'falling' | 'snap'
          settled: true,
          homePos: { x: 0, y: 0, z: 0 },
          effectiveSize: this.size,
          vy: 0,
          vx: 0,
          vz: 0,
          wx: 0,
          wy: 0,
          wz: 0,
          bounces: 0,
          snapT: 0,
          snapFrom: null,
          snapTo: null,
        }
      })
    },

    startRollAnimation(values) {
      this.rolling = true

      this.diceMeshes.forEach((d, i) => {
        d.target = Number(values[i]) || 1
        const home = d.homePos

        d.mesh.position.set(home.x, home.y + 3 + i * 0.8, home.z)
        d.mesh.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        )

        d.vy = 0
        d.vx = (Math.random() - 0.5) * 1.2
        d.vz = (Math.random() - 0.5) * 1.2
        d.wx = (Math.random() - 0.5) * 0.5
        d.wy = (Math.random() - 0.5) * 0.5
        d.wz = (Math.random() - 0.5) * 0.5

        d.bounces = 0
        d.phase = 'falling'
        d.settled = false
      })

      const check = setInterval(() => {
        if (this.diceMeshes.every((d) => d.settled)) {
          clearInterval(check)
          this.rolling = false
        }
      }, 100)
    },

    /**
     * Custom physics engine for each die (gravity, bounces, friction, and final interpolation)
     */
    updatePhysics(d, dt) {
      if (d.settled) return

      const G = -24
      const GY = d.effectiveSize
      const m = d.mesh

      if (d.phase === 'falling') {
        d.vy += G * dt
        m.position.y += d.vy * dt
        m.position.x += d.vx * dt
        m.position.z += d.vz * dt

        d.vx *= 0.87
        d.vz *= 0.87

        m.rotation.x += d.wx
        m.rotation.y += d.wy
        m.rotation.z += d.wz

        // Handle collision with the ground
        if (m.position.y <= GY) {
          m.position.y = GY
          d.bounces++

          // Velocity loss on each bounce
          const e = Math.max(0, 0.5 - d.bounces * 0.13)
          d.vy = -d.vy * e
          d.vx *= 0.5
          d.vz *= 0.5
          d.wx *= 0.6
          d.wy *= 0.6
          d.wz *= 0.6

          // Transition from "falling" to "snap" phase to force the correct result display
          if (d.bounces >= 3 || Math.abs(d.vy) < 0.4) {
            d.phase = 'snap'
            d.snapT = 0
            d.snapFrom = { x: m.rotation.x, y: m.rotation.y, z: m.rotation.z }
            const exact = FACE_ROTATIONS[d.target]
            d.snapTo = { x: exact.x, y: exact.y, z: exact.z }
          }
        }

        m.position.x = Math.max(-6, Math.min(6, m.position.x))
        m.position.z = Math.max(-4, Math.min(4, m.position.z))
      } else if (d.phase === 'snap') {
        d.snapT = Math.min(1, d.snapT + 0.045)
        const t = 1 - Math.pow(1 - d.snapT, 3) // Cubic interpolation (ease-out)

        const lerpAngle = (a, b, t) => {
          let diff = b - a
          while (diff > Math.PI) diff -= Math.PI * 2
          while (diff < -Math.PI) diff += Math.PI * 2
          return a + diff * t
        }

        m.rotation.x = lerpAngle(d.snapFrom.x, d.snapTo.x, t)
        m.rotation.y = lerpAngle(d.snapFrom.y, d.snapTo.y, t)
        m.rotation.z = lerpAngle(d.snapFrom.z, d.snapTo.z, t)

        if (d.snapT >= 1) {
          m.rotation.set(d.snapTo.x, d.snapTo.y, d.snapTo.z)
          d.settled = true
          d.phase = 'idle'
        }
      }
    },

    tick() {
      this.animationId = requestAnimationFrame(this.tick)
      const dt = Math.min(0.1, this.clock.getDelta())
      if (this.rolling) this.diceMeshes.forEach((d) => this.updatePhysics(d, dt))
      this.renderer.render(this.scene, this.camera)
    },

    onResize() {
      const el = this.$refs.container
      if (!el) return

      const wasMobile = this.isMobile
      const isNowMobile = window.innerWidth < 1280

      if (wasMobile !== isNowMobile) {
        this.updateLayout()
      }

      const W = el.clientWidth
      const H = el.clientHeight || 300
      this.camera.aspect = W / H
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(W, H)
    },
  },
}
</script>

<style scoped>
.dice-container {
  width: 100%;
  height: 100%;
  min-height: 250px;
}
</style>
