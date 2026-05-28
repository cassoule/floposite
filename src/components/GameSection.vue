<template>
  <section :id="id" class="game-section">
    <div class="section-header">
      <h2 class="section-title">{{ title }}</h2>
      <p class="section-description">{{ description }}</p>
    </div>

    <div class="section-grid">
      <!-- if 3 games or less : simple grid -->
      <div v-if="games.length <= 3" class="cards-grid">
          <GameCard 
            v-for="(game, index) in games" 
            :key="index"
            :title="game.title" 
            :image="game.image" 
            :buttonText="game.buttonText" 
            :buttonType="game.buttonType" 
            :to="game.to"
            :requiresAuth="game.requiresAuth"
            :isLoggedIn="isLoggedIn"
            @open-login="emit('open-login')"
          />
      </div>

      <!-- else : infinite carousel -->
      <div v-else class="infinite-carousel-container">
        <div 
          class="infinite-carousel-track" 
          ref="trackRef"
          @mouseenter="slowDown"
          @mouseleave="speedUp"
          @touchstart="slowDown"
          @touchend="speedUp"
        >
          <div class="carousel-set">
            <GameCard 
              v-for="(game, index) in games" 
              :key="'orig-' + index"
              :title="game.title" 
              :image="game.image" 
              :buttonText="game.buttonText" 
              :buttonType="game.buttonType" 
              :to="game.to"
              :requiresAuth="game.requiresAuth"
              :isLoggedIn="isLoggedIn"
              class="carousel-item"
              @open-login="emit('open-login')"
            />
          </div>
          <div class="carousel-set" aria-hidden="true">
            <GameCard 
              v-for="(game, index) in games" 
              :key="'clone-' + index"
              :title="game.title" 
              :image="game.image" 
              :buttonText="game.buttonText" 
              :buttonType="game.buttonType" 
              :to="game.to"
              :requiresAuth="game.requiresAuth"
              :isLoggedIn="isLoggedIn"
              class="carousel-item"
              @open-login="emit('open-login')"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import GameCard from '@/components/GameCardIndex.vue'

const props = defineProps({
  id: {
    type: String,
    default: ''
  },
  title: String,
  description: String,
  games: {
    type: Array,
    required: true,
    default: () => []
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['open-login'])

// Infinite Carousel Logic
const trackRef = ref(null)
let animInstance = null

const animConfig = {
  duration: 35000, 
  iterations: Infinity,
  easing: 'linear'
}

const keyframes = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-50%)' } 
]

onMounted(() => {
  // Only start animation if we have more than 3 games and the track element is available
  if (props.games.length > 3 && trackRef.value) {
    animInstance = trackRef.value.animate(keyframes, animConfig)
  }
})

const slowDown = () => {
  if (animInstance) animInstance.playbackRate = 0.15 
}

const speedUp = () => {
  if (animInstance) animInstance.playbackRate = 1 
}

onUnmounted(() => {
  if (animInstance) animInstance.cancel()
})
</script>

<style scoped>
.game-section {
  width: 100%;
  max-width: 1200px;
  margin: 60px auto;
  padding: 0 48px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 32px;
  scroll-margin-top: 100px;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  color: #FFF;
  font-family: 'Poppins', sans-serif;
  font-size: 40px;
  font-weight: 700;
  line-height: normal;
  margin: 0;
}

.section-description {
  color: #ABB0B6;
  font-family: 'Poppins', sans-serif;
  font-size: 20px;
  font-weight: 500;
  line-height: normal;
  margin: 0;
}

.section-grid {
  width: 100%;
}

.cards-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
  gap: 32px; 
  width: 100%; 
}

.infinite-carousel-container {
  width: 100%;
  overflow: hidden;
  position: relative;
  
  padding: 32px 0; 
  margin-top: -32px;
  margin-bottom: -32px;

  mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
}

.infinite-carousel-track {
  display: flex;
  width: max-content;
  cursor: pointer;
  align-items: center; 
}

.carousel-set {
  display: flex;
  gap: 32px;
  padding-right: 32px;
  align-items: flex-end; 
}

.carousel-item {
  width: 280px;
  flex-shrink: 0;
  transition: transform 0.3s ease, box-shadow 0.3s ease, z-index 0.3s ease; 
  position: relative;
  z-index: 1; 
}

.carousel-item:hover {
  transform: scale(1.05) translateY(-16px);
  box-shadow: 0 10px 25px #7834e62a; 
  z-index: 10; 
}

/* --- Mobile --- */
@media (max-width: 968px) {
  .game-section { padding: 0 24px; }
  .carousel-set { gap: 16px; padding-right: 16px; }
  .carousel-item { width: 240px; }
  
  .infinite-carousel-container {
    mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
    padding: 24px 0;
    margin-top: -24px;
    margin-bottom: -24px;
  }
}
</style>
