<template>
  <div class="game-card" @click="handleClick">
    <div class="card-glow"></div>

    <!-- Image plein format, cover -->
    <div class="image-container">
      <img :src="image" :alt="title" class="game-img" />
      <div class="image-overlay"></div>
    </div>

    <!-- Footer superposé sur le dégradé bas -->
    <div class="card-footer">
      <h3 class="game-title">{{ title }}</h3>
      <button :class="['action-btn', buttonType]">
        <span class="play-icon">
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
            <path
              d="M1 1L9 6L1 11V1Z"
              fill="currentColor"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  title: String,
  image: String,
  buttonText: { type: String, default: 'Jouer' },
  buttonType: { type: String, default: 'purple' },
  to: { type: String, default: null },
  requiresAuth: { type: Boolean, default: false },
  isLoggedIn: { type: Boolean, default: false },
})

const emit = defineEmits(['open-login'])
const router = useRouter()

function handleClick() {
  if (props.requiresAuth && !props.isLoggedIn) {
    localStorage.setItem('returnUrl', props.to || '/')
    emit('open-login')
    return
  }
  if (props.to) {
    router.push(props.to)
  }
}
</script>

<style scoped>
/* ─── Card ────────────────────────────────────────────── */
.game-card {
  position: relative;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 280px;
  overflow: hidden;

  /* Glassmorphism */
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);

  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s ease;
  cursor: pointer;
}

.game-card:hover {
  transform: translateY(-6px);
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.card-glow {
  position: absolute;
  inset: -40px;
  background: radial-gradient(ellipse at 50% 120%, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  z-index: 0;
}

.game-card:hover .card-glow {
  opacity: 1;
}

/* ─── Image cover ─────────────────────────────────────── */
.image-container {
  position: relative;
  width: 100%;
  /* Ratio 16/9 pour tous les screenshots */
  aspect-ratio: 16 / 9;
  overflow: hidden;
  z-index: 1;
}

.game-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* Centre sur la partie haute de l'image (plus intéressante en général) */
  object-position: center top;
  display: block;
  transition: transform 0.5s ease;
}

.game-card:hover .game-img {
  transform: scale(1.05);
}

/* Dégradé bas qui fond l'image vers le footer */
.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(to bottom, transparent 0%, rgba(15, 18, 40, 0.75) 100%);
  pointer-events: none;
}

/* ─── Footer ──────────────────────────────────────────── */
.card-footer {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  /* Fond verre pour séparer proprement du bas de l'image */
  background: rgba(255, 255, 255, 0.04);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.game-title {
  font-family: 'Poppins', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  letter-spacing: -0.3px;
}

/* ─── Bouton outline + glow ───────────────────────────── */
.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 18px;
  border-radius: 100px;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.purple {
  background: transparent;
  color: #ffffff;
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  box-shadow: none;
}

.purple:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.85);
  box-shadow:
    0 0 14px rgba(255, 255, 255, 0.18),
    0 0 28px rgba(139, 92, 246, 0.2);
  transform: scale(1.04);
}

.yellow {
  background: transparent;
  color: #ffb703;
  border: 1.5px solid rgba(255, 183, 3, 0.45);
  box-shadow: none;
}

.yellow:hover {
  background: rgba(255, 183, 3, 0.08);
  border-color: #ffb703;
  box-shadow:
    0 0 14px rgba(255, 183, 3, 0.28),
    0 0 28px rgba(255, 183, 3, 0.14);
  transform: scale(1.04);
}

.action-btn:active {
  transform: scale(0.96);
}

.play-icon {
  display: flex;
  align-items: center;
}
</style>
