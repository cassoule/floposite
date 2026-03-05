<script>
/* global localStorage, setTimeout */
import axios from 'axios'
import CoinsCounter from '@/components/CoinsCounter.vue'
import { getRarityColor } from '@/utils/csRarity.js'

export default {
  components: {
    CoinsCounter,
  },
  data() {
    return {
      discordId: null,
      rouletteSkins: [],
      resultSkin: null,
      resultIndex: 0,
      crslSpeed: 5, // Duration in seconds

      // Animation State
      isSpinning: false,
      currentTranslateX: 0,

      targetIndex: 0,
      randomOffset: 0,

      cardWidth: 200,
      cardGap: 10,

      caseOpeningDialog: false,
      skinResultDialog: false,

      user: null,
      loading: false,
      displayPrice: 0,

      skipAnimation: false, // For testing purposes

      CS_CASE_PRICE: 300,
    }
  },
  computed: {
    itemFullWidth() {
      return this.cardWidth + this.cardGap
    },
    doubledSkins() {
      if (!this.rouletteSkins || this.rouletteSkins.length === 0) return []
      return [...this.rouletteSkins, ...this.rouletteSkins, ...this.rouletteSkins.slice(0, 3)]
    },
  },
  watch: {
    skinResultDialog(val) {
      if (val) {
        this.playResultAnimations()
      }
    },
  },
  async mounted() {
    const discordId = localStorage.getItem('discordId')
    if (!discordId) this.$router.push('/')
    this.discordId = discordId
    try {
      const response = await axios.get(import.meta.env.VITE_FLAPI_URL + '/user/' + this.discordId)
      this.user = response.data.user
    } catch (e) {
      console.log(e)
      this.$router.push('/')
    }
    window.addEventListener('resize', this.updatePosition)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updatePosition)
  },
  methods: {
    getRarityColor,
    async openCase() {
      this.loading = true
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/open-cs-case')
        // Refresh user coins
        try {
          const userResp = await axios.get(
            import.meta.env.VITE_FLAPI_URL + '/user/' + this.discordId,
          )
          this.user = userResp.data.user
        } catch (e) {
          console.log(e)
          this.$router.push('/')
        }

        this.resultSkin = response.data.skin
        this.rouletteSkins = response.data.rouletteSkins
        this.resultIndex = response.data.resultIndex

        if (this.skipAnimation) {
          this.skinResultDialog = true
        } else {
          this.caseOpeningDialog = true
          await this.sleep(500)
          this.startAnimation()
        }
      } catch (e) {
        console.error('flAPI error:', e)
      }
      this.loading = false
    },
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms))
    },

    startAnimation() {
      if (this.isSpinning) return

      this.isSpinning = false
      this.currentTranslateX = 0

      this.$nextTick(() => {
        this.isSpinning = true

        const listLength = this.rouletteSkins.length
        this.targetIndex = this.resultIndex + listLength

        const maxRandom = this.cardWidth * 0.45
        const minRandom = -this.cardWidth * 0.45
        this.randomOffset = Math.floor(Math.random() * (maxRandom - minRandom + 1)) + minRandom

        this.updatePosition()

        setTimeout(() => {
          this.handleAnimationEnd()
        }, this.crslSpeed * 1000)
      })
    },

    async handleAnimationEnd() {
      this.isSpinning = false
      await this.sleep(750)
      this.skinResultDialog = true
    },

    updatePosition() {
      if (!this.caseOpeningDialog || !this.$refs.rouletteContainer) return
      const containerWidth = this.$refs.rouletteContainer.clientWidth
      const cardPosition = this.targetIndex * this.itemFullWidth
      const centerOffset = containerWidth / 2 - this.cardWidth / 2
      this.currentTranslateX = -(cardPosition - centerOffset + this.randomOffset)
    },

    async playResultAnimations() {
      this.displayPrice = 0
      const targetPrice = this.resultSkin?.price || 0
      await this.sleep(300)
      this.animateNumber('displayPrice', 0, targetPrice, 1000)
    },

    animateNumber(property, start, end, duration) {
      let startTimestamp = null
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp
        const progress = Math.min((timestamp - startTimestamp) / duration, 1)
        const ease = (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x))
        this[property] = Math.floor(ease(progress) * (end - start) + start)
        if (progress < 1) {
          window.requestAnimationFrame(step)
        }
      }
      window.requestAnimationFrame(step)
    },
  },
}
</script>

<template>
  <CoinsCounter />
  <v-layout class="w-100">
    <v-main
      class="d-flex justify-center flex-wrap pt-16"
      style="place-items: start; place-content: center; gap: 2em"
    >
      <v-switch
        v-model="skipAnimation"
        density="compact"
        hide-details
        :label="'Skip Animation : ' + (skipAnimation ? 'ON' : 'OFF')"
        color="primary"
        style="position: fixed; bottom: 10px; right: 10px; transform: scale(0.75); width: 200px"
      ></v-switch>
      <v-card color="#1A1A1A" rounded="xl" class="px-0" style="min-width: 280px; max-width: 400px">
        <v-card-item class="px-4 py-4">
          <div
            rounded="lg"
            style="
              width: 100%;
              height: 180px;
              border-radius: 12px;
              background: radial-gradient(circle at 50% 120%, #4b69ff 0%, #1a1a1a 70%);
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              overflow: hidden;
            "
          >
            <div
              style="
                font-size: 3em;
                font-weight: 900;
                opacity: 0.15;
                letter-spacing: 0.1em;
                user-select: none;
              "
            >
              CS2
            </div>
            <div
              style="
                position: absolute;
                bottom: 10px;
                width: 60%;
                height: 2px;
                background: linear-gradient(to right, transparent, #4b69ff, transparent);
              "
            ></div>
          </div>
          <div class="d-flex justify-space-between align-baseline w-100 flex-wrap mt-3">
            <h2 class="mr-4">CS2 Case</h2>
            <p class="text-secondary">{{ CS_CASE_PRICE }}&nbsp;Coins</p>
          </div>
        </v-card-item>
        <v-card-item class="pb-3">
          <v-btn
            block
            :loading="loading"
            color="primary"
            rounded="lg"
            :disabled="user?.coins < CS_CASE_PRICE || loading"
            @click="openCase"
          >
            Ouvrir
          </v-btn>
        </v-card-item>
      </v-card>

      <v-card
        color="#1A1A1A"
        rounded="xl"
        variant="tonal"
        class="px-0"
        style="min-width: 280px; max-width: 400px"
      >
        <v-card-item class="px-4 py-4 text-secondary">
          <div
            rounded="lg"
            style="
              width: 100%;
              height: 180px;
              border-radius: 12px;
              background: radial-gradient(circle at 50% 120%, #dddddd22 0%, #1a1a1a22 70%);
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              overflow: hidden;
            "
          >
            <div
              style="
                font-size: 3em;
                font-weight: 900;
                opacity: 0.15;
                letter-spacing: 0.1em;
                user-select: none;
              "
            >
              ...
            </div>
          </div>
          <div class="d-flex justify-space-between align-baseline w-100 flex-wrap mt-3">
            <h2 class="mr-4">Bientôt disponible</h2>
          </div>
        </v-card-item>
        <v-card-item class="pb-3">
          <v-btn disabled block :loading="loading" color="primary" rounded="lg"> ... </v-btn>
        </v-card-item>
      </v-card>
    </v-main>

    <v-btn
      class="back-btn text-none"
      text="Retour"
      variant="tonal"
      color="#ddd"
      @click="$router.push('/dashboard')"
    ></v-btn>
  </v-layout>

  <!-- Roulette Dialog -->
  <v-dialog
    v-model="caseOpeningDialog"
    persistent
    class="modals"
    width="1500"
    transition="dialog-bottom-transition"
  >
    <v-card
      color="#1A1A1A"
      rounded="xl"
      class="w-100 px-0"
      style="box-shadow: inset 0 0 10px 2px #4b69ff"
    >
      <v-card-item class="px-0">
        <div ref="rouletteContainer" class="roulette-container">
          <div
            class="selector-line"
            style="background: #4b69ff; box-shadow: 0 0 10px 1px #4b69ff99"
          ></div>
          <div
            class="roulette-rail"
            :style="{
              transform: `translateX(${currentTranslateX}px)`,
              transition: isSpinning
                ? `transform ${crslSpeed}s cubic-bezier(0.10, 0.75, 0.25, 1)`
                : 'none',
            }"
          >
            <div
              v-for="(skin, index) in doubledSkins"
              :key="'roulette_' + index"
              ref="skinCards"
              class="skin-card"
            >
              <v-img :src="skin.imageUrl" width="100%" max-height="100px" />
              <div
                class="skin-card-bg"
                :style="`background: radial-gradient(circle at 0% 0%, ${getRarityColor(skin.rarity)}, transparent 80%)`"
              ></div>
            </div>
          </div>
        </div>
      </v-card-item>
    </v-card>
  </v-dialog>

  <!-- Result Dialog -->
  <v-dialog v-model="skinResultDialog" class="modals" width="500" scrim="#181818" persistent>
    <v-card
      v-if="resultSkin"
      color="#1A1A1A"
      rounded="xl"
      class="overflow-hidden"
      style="position: relative"
    >
      <!-- Glow Background -->
      <div
        class="glow-bg"
        :style="`background: radial-gradient(circle, ${getRarityColor(resultSkin.rarity)} 0%, transparent 100%);`"
      ></div>

      <v-card-item class="w-100 px-10 pt-8 pb-0">
        <div
          v-motion
          :initial="{ opacity: 0, scale: 0.5, y: 50 }"
          :enter="{
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 250, damping: 15, mass: 1 },
          }"
          class="mb-4 relative-container w-100"
          style="display: flex; justify-content: center"
        >
          <v-img
            :src="resultSkin.imageUrl"
            width="100%"
            height="20vh"
            max-height="250px"
            style="filter: drop-shadow(0 0 5px #333)"
          />
        </div>
      </v-card-item>

      <v-card-item
        class="result-card-item w-100 d-flex flex-column align-center justify-center pt-0 pb-6 text-center"
        style="z-index: 2"
      >
        <!-- Title -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :enter="{ opacity: 1, y: 0, transition: { delay: 300, duration: 500 } }"
          class="w-100"
        >
          <h2 class="w-100 text-h5 font-weight-bold text-white mb-1">
            {{ resultSkin.displayName }}
          </h2>
          <p class="text-grey" style="font-size: 0.9em">{{ resultSkin.weaponType }}</p>
        </div>

        <!-- Badges -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 10 }"
          :enter="{ opacity: 1, y: 0, transition: { delay: 400, duration: 400 } }"
          class="d-flex justify-center ga-2 mt-2"
        >
          <v-chip v-if="resultSkin.isStattrak" color="orange" size="small" variant="flat">
            StatTrak
          </v-chip>
          <v-chip v-if="resultSkin.isSouvenir" color="#ffd700" size="small" variant="flat">
            Souvenir
          </v-chip>
          <v-chip :color="getRarityColor(resultSkin.rarity)" size="small" variant="flat">
            {{ resultSkin.rarity }}
          </v-chip>
          <v-chip size="small" variant="flat">
            {{ resultSkin.wearState }}
          </v-chip>
        </div>

        <!-- Stats Row -->
        <v-row class="w-100 mt-1 mx-0">
          <v-col cols="6" class="text-center">
            <div
              v-motion
              :initial="{ opacity: 0, scale: 0.8 }"
              :enter="{ opacity: 1, scale: 1, transition: { delay: 600, duration: 400 } }"
            >
              <p class="text-caption text-uppercase text-grey">Float</p>
              <p class="text-h6 font-weight-bold" style="font-size: 1.2em !important">
                {{ resultSkin.float?.toFixed(4) }}
              </p>
            </div>
          </v-col>
          <v-col cols="6" class="text-center">
            <div
              v-motion
              :initial="{ opacity: 0, scale: 0.8 }"
              :enter="{ opacity: 1, scale: 1, transition: { delay: 700, duration: 400 } }"
            >
              <p class="text-caption text-uppercase text-grey">Valeur</p>
              <div class="text-h6 font-weight-bold" style="font-size: 1.2em !important">
                {{ displayPrice }}
                <span class="font-weight-thin" style="font-size: 0.9em">Flopos</span>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Float Bar -->
        <div
          v-if="resultSkin.float != null"
          v-motion
          :initial="{ opacity: 0 }"
          :enter="{ opacity: 1, transition: { delay: 800, duration: 500 } }"
          class="w-100 mt-3 px-4"
        >
          <div class="float-bar-track">
            <div class="float-bar-marker" :style="{ left: `${resultSkin.float * 100}%` }"></div>
          </div>
        </div>
      </v-card-item>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-btn
          variant="tonal"
          color="secondary"
          rounded="lg"
          class="px-4"
          @click="$router.push('/akhy/' + discordId)"
        >
          Voir l'inventaire
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          variant="tonal"
          color="secondary"
          rounded="lg"
          class="px-6"
          @click="((skinResultDialog = false), (caseOpeningDialog = false))"
        >
          Fermer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.result-card-item :deep(.v-card-item__content) {
  width: 100%;
}

.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 12px;
}

.roulette-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  height: 250px;
}

.selector-line {
  position: absolute;
  left: 50%;
  top: 5%;
  bottom: 0;
  width: 2px;
  transform: translateX(-50%);
  z-index: 10;
  height: 90%;
}

.roulette-rail {
  display: flex;
  height: 100%;
  align-items: center;
  will-change: transform;
}

.skin-card {
  position: relative;
  width: 200px;
  margin-right: 10px;
  flex-shrink: 0;
  border-radius: 20px;
  height: 200px;
  padding: 0.5em;
  border: 1px solid #444;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  user-select: none;
  pointer-events: none;
  background-color: #181818;
  transition: all 0.3s ease;
}

.skin-card-bg {
  position: absolute;
  width: 150%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 0;
  border-radius: 10px;
  transition: 0.2s ease-in-out;
  opacity: 0.6;
}

.skin-card .v-img {
  z-index: 2;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
}

.glow-bg {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  opacity: 0.3;
  filter: blur(50px);
  pointer-events: none;
  z-index: 0;
  border-radius: 50%;
}

.relative-container {
  animation: float 4s ease-in-out infinite;
  animation-delay: 1.2s;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

/* Float bar */
.float-bar-track {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(to right, #4caf50, #8bc34a, #cddc39, #ffeb3b, #ff9800, #f44336);
  position: relative;
}

.float-bar-marker {
  position: absolute;
  top: -4px;
  width: 2px;
  height: 12px;
  background: white;
  border-radius: 1px;
  transform: translateX(-50%);
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
}

:deep(.v-overlay__content) {
  overflow: visible !important;
}
</style>
