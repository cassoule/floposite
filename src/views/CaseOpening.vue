<script>
import { InfiniteCarousel, InfiniteCarouselItem } from 'vue-infinite-carousel'
import 'vue-infinite-carousel/dist/vue-infinite-carousel.css'
import 'swiper/css'
import axios from 'axios'
import CoinsCounter from '@/components/CoinsCounter.vue'

export default {
  components: {
    CoinsCounter,
    InfiniteCarousel,
    InfiniteCarouselItem,
  },
  async mounted() {
    // Fetch user data from localStorage or an API
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
  data() {
    return {
      discordId: null,
      skins: null,
      skinsData: {},
      crslSpeed: 7, // Duration in seconds

      // Animation State
      isSpinning: false,
      currentTranslateX: 0,

      targetIndex: 0,
      randomOffset: 0,

      cardWidth: 200,
      cardGap: 10,

      caseOpeningDialog: false,
      skinResultDialog: false,
      selectedCaseType: null,

      user: null,
      loading: false,
      displayLevel: 0,
      displayPrice: 0,

      caseContentDialog: false,
      caseContent: null,
      selectedCase: null,
    }
  },
  computed: {
    itemFullWidth() {
      return this.cardWidth + this.cardGap
    },
    doubledSkins() {
      if (!this.skins || !this.skins?.selectedSkins) return []
      return [
        ...this.skins.selectedSkins,
        ...this.skins.selectedSkins,
        ...this.skins.selectedSkins.slice(0, 3),
      ]
    },
    caseColor() {
      switch (this.selectedCaseType) {
        case 'standard':
          return '#5A9FE2'
        case 'premium':
          return '#D1548D'
        case 'ultra':
          return '#F5955B'
        case 'esport':
          return '#FF5862'
        default:
          return '#5A9FE2'
      }
    },
  },
  watch: {
    skinResultDialog(val) {
      if (val) {
        this.playResultAnimations()
      }
    },
  },
  methods: {
    async fetchCase(caseType = 'standard') {
      this.loading = true
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/open-case'
      try {
        const userId = localStorage.getItem('discordId') || ''
        this.selectedCaseType = caseType
        const response = await axios.post(fetchUrl, { userId, caseType })
        try {
          const response = await axios.get(
            import.meta.env.VITE_FLAPI_URL + '/user/' + this.discordId,
          )
          this.user = response.data.user
        } catch (e) {
          console.log(e)
          this.$router.push('/')
        }
        this.skins = response.data
        this.caseOpeningDialog = true
        await this.getSkinData(this.skins.updatedSkin)
        await this.sleep(500)
        this.startAnimation()
      } catch (e) {
        console.error('flAPI error:', e)
      }
      this.loading = false
    },
    getImageUrl(skin) {
      const level = skin.levels[skin.currentLvl - 1]
      return level?.displayIcon || skin.displayIcon || skin.chromas[0].fullRender
    },
    getPreciseImageUrl(skin) {
      let skinInfo = this.skinsData[skin.uuid]
      if (skin.currentLvl === skinInfo.levels.length) {
        const chroma = skinInfo.chromas[skin.currentChroma - 1]
        return chroma?.fullRender || chroma?.displayIcon || skinInfo.displayIcon
      }
      const level = skinInfo.levels[skin.currentLvl - 1]
      return level?.displayIcon || skinInfo.displayIcon || skinInfo.chromas[0].fullRender
    },
    async getSkinData(skin) {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/skin/' + skin.uuid
      try {
        const response = await axios.get(fetchUrl)
        this.skinsData[skin.uuid] = response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },
    async getCaseContent(caseType) {
      this.selectedCase = caseType
      this.caseContent = null
      this.caseContentDialog = true
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/case-content/' + caseType
      try {
        const response = await axios.get(fetchUrl)
        this.caseContent = response.data.skins
      } catch (e) {
        console.error('flAPI error:', e)
      }
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

        const rawIndex = this.skins.randomSelectedSkinIndex
        const listLength = this.skins.selectedSkins.length
        this.targetIndex = rawIndex + listLength

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
      // 1. Reset values
      this.displayLevel = 0
      this.displayPrice = 0

      // Get target values (Add safety checks)
      const targetLevel = this.skins.updatedSkin.currentLvl || 1
      // NOTE: Replace 'value' with the actual property name for price/flopos from your API
      const targetPrice = this.skins.updatedSkin.currentPrice || 0

      // 2. Wait a split second for the modal to render (matches the pop-in animation)
      await this.sleep(300)

      // 3. Animate the numbers
      this.animateNumber('displayLevel', 0, targetLevel, 1500) // 1.5s duration
      this.animateNumber('displayPrice', 0, targetPrice, 2000) // 2s duration
    },

    animateNumber(property, start, end, duration) {
      let startTimestamp = null
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp
        const progress = Math.min((timestamp - startTimestamp) / duration, 1)

        // Easing function (easeOutExpo) for a "cool" slowing down effect
        const ease = (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x))

        this[property] = Math.floor(ease(progress) * (end - start) + start)

        if (progress < 1) {
          window.requestAnimationFrame(step)
        }
      }
      window.requestAnimationFrame(step)
    },
    getRegionColor(region) {
      switch (region) {
        case 'vct-am':
          return '#FF570C'
        case 'vct-emea':
          return '#D5FF1D' // Lime Green
        case 'vct-pcf':
          return '#01D2D7' // Orange Red
        case 'vct-cn':
          return '#E73056' // Gold
        default:
          return '#FFFFFF' // White as fallback
      }
    },
  },
}
</script>

<template>
  <CoinsCounter />
  <v-layout class="w-100">
    <v-main
      class="d-flex justify-center flex-wrap flex-md-nowrap pt-16"
      style="place-items: start; place-content: start; gap: 2em"
    >
      <v-card color="#1A1A1A" rounded="xl" class="w-33 px-0" style="min-width: 225px">
        <v-card-item class="px-4 py-4">
          <v-img
            src="cases/standard-png.png"
            rounded="lg"
            width="100%"
            height="150px"
            :style="`background: radial-gradient(circle at 70% 170%, #5A9FE2, transparent 100%)`"
          />
          <div class="d-flex justify-space-between align-baseline w-100 flex-wrap mt-3">
            <h2 class="mr-4" style="width: 177px;">Standard&nbsp;Case</h2>
            <p class="text-secondary">500&nbsp;Coins&nbsp;&nbsp;<v-icon class="mdi mdi-information-outline" size="20" @click="getCaseContent('standard')"/></p>
          </div>
        </v-card-item>
        <v-card-item class="pb-3">
          <v-btn
            block
            :loading="loading"
            color="primary"
            rounded="lg"
            :disabled="user?.coins < 500 || loading"
            @click="fetchCase('standard')"
            >Ouvrir</v-btn
          >
        </v-card-item>
      </v-card>

      <v-card color="#1A1A1A" rounded="xl" class="w-33 px-0" style="min-width: 225px">
        <v-card-item class="px-4 py-4">
          <v-img
            src="cases/premium-png.png"
            rounded="lg"
            width="100%"
            height="150px"
            :style="`background: radial-gradient(circle at 70% 170%, #D1548D, transparent 100%)`"
          />
          <div class="d-flex justify-space-between align-baseline w-100 flex-wrap mt-3">
            <h2 class="mr-4" style="width: 177px;">Premium&nbsp;Case</h2>
            <p class="text-secondary">750&nbsp;Coins&nbsp;&nbsp;<v-icon class="mdi mdi-information-outline" size="20" @click="getCaseContent('premium')"/></p>
          </div>
        </v-card-item>
        <v-card-item class="pb-3">
          <v-btn
            block
            :loading="loading"
            color="primary"
            rounded="lg"
            :disabled="user?.coins < 750 || loading"
            @click="fetchCase('premium')"
            >Ouvrir</v-btn
          >
        </v-card-item>
      </v-card>

      <v-card color="#1A1A1A" rounded="xl" class="w-33 px-0" style="min-width: 225px">
        <v-card-item class="px-4 py-4">
          <v-img
            src="cases/ultra-png.png"
            rounded="lg"
            width="100%"
            height="150px"
            :style="`background: radial-gradient(circle at 70% 170%, #F5955B, transparent 100%)`"
          />
          <div class="d-flex justify-space-between align-baseline w-100 flex-wrap mt-3">
            <h2 class="mr-4" style="width: 177px">Ultra Case</h2>
            <p class="text-secondary">1500&nbsp;Coins&nbsp;&nbsp;<v-icon class="mdi mdi-information-outline" size="20" @click="getCaseContent('ultra')"/></p>
          </div>
        </v-card-item>
        <v-card-item class="pb-3">
          <v-btn
            block
            :loading="loading"
            color="primary"
            rounded="lg"
            :disabled="user?.coins < 1500 || loading"
            @click="fetchCase('ultra')"
            >Ouvrir</v-btn
          >
        </v-card-item>
      </v-card>

      <v-card color="#1A1A1A" rounded="xl" class="w-33 px-0" style="min-width: 225px">
        <v-card-item class="px-4 py-4">
          <div
            style="max-height: 150px; width: 100%; border-radius: 12px; display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); overflow: hidden"
          >
            <v-img
              src="vct_logos/vct-emea.png"
              width="100%"
              max-height="75px"
              :style="`background: radial-gradient(circle at -200% -200%, ${getRegionColor('vct-emea')}, transparent 100%);`"
            />
            <v-img
              src="vct_logos/vct-am.png"
              width="100%"
              max-height="75px"
              :style="`background: radial-gradient(circle at 300% -200%, ${getRegionColor('vct-am')}, transparent 100%)`"
            />
            <v-img
              src="vct_logos/vct-pcf.png"
              width="100%"
              max-height="75px"
              :style="`background: radial-gradient(circle at -200% 300%, ${getRegionColor('vct-pcf')}, transparent 100%)`"
            />
            <v-img
              src="vct_logos/vct-cn.png"
              width="100%"
              max-height="75px"
              :style="`background: radial-gradient(circle at 300% 300%, ${getRegionColor('vct-cn')}, transparent 100%)`"
            />
          </div>
          <div class="d-flex justify-space-between align-baseline w-100 flex-wrap mt-3">
            <h2 class="mr-4" style="width: 177px">Esport Case</h2>
            <p class="text-secondary">100&nbsp;Coins&nbsp;&nbsp;<v-icon class="mdi mdi-information-outline" size="20" @click="getCaseContent('esport')"/></p>
          </div>
        </v-card-item>
        <v-card-item class="pb-3">
          <v-btn
            block
            :loading="loading"
            color="primary"
            rounded="lg"
            :disabled="user?.coins < 100 || loading"
            @click="fetchCase('esport')"
          >Ouvrir</v-btn
          >
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

  <v-dialog v-model="caseContentDialog" class="modals" width="600" scrim="#181818">
    <v-card
      color="#1A1A1A"
      rounded="xl"
      style="overflow-y: scroll;
            scrollbar-width: auto;"
    >
      <v-card-title class="mx-2 pt-4">
        Contenu de la caisse {{selectedCase.toUpperCase()}}
      </v-card-title>
      <v-card-subtitle class="mx-2">
        {{caseContent ? caseContent.length + ' skins disponibles' : ''}}
      </v-card-subtitle>
      <v-card-item>
        <div v-if="caseContent">
          <div
            v-for="skin in caseContent" :key="skin.uuid + '-case-content'"
            class="d-flex align-center"
            :style="`
              background: radial-gradient(circle at -50% -50%, ${skin.isVCT ? getRegionColor(skin.vctRegion) : (skin.isChampions ? '#ffd700' : (skin.isMelee ? '#000' : '#' + skin.tierColor))}, transparent 80%);
              border-radius: 12px; margin-bottom: .5em; padding: .2em 1em;
              border: 2px solid ${skin.isChampions ? '#ffd700' : (skin.isMelee ? '#aaaaaaaa' : 'none')};
            `"
          >
            <v-img :src="skin.displayIcon" min-width="100px" max-width="100px" height="50px" class="ma-2"/>
            <p class="font-weight-bold text-pretty" style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden">{{skin.displayName}}</p>
            <v-spacer></v-spacer>
            <p><span class="ml-2 font-weight-bold" style="white-space: nowrap">{{skin.basePrice}}&nbsp;-&nbsp;{{skin.maxPrice}}</span>&nbsp;Flopos</p>
          </div>
        </div>
        <div v-else class="w-100 d-flex justify-center align-center pa-6">
          <v-progress-circular indeterminate color="primary" class="ma-4" />
        </div>
      </v-card-item>
    </v-card>
  </v-dialog>

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
      :style="`box-shadow: inset 0 0 10px 2px ${caseColor};`"
    >
      <v-card-item class="px-0">
        <div class="roulette-container" ref="rouletteContainer">
          <div
            class="selector-line"
            :style="`background: ${caseColor}; box-shadow: 0 0 10px 1px ${caseColor}99;`"
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
              :key="skin.uuid + '_pos_' + index"
              class="skin-card"
              :class="{'melee-skin-card': skin.isMelee, 'vct-skin-card': skin.isVCT, 'champions-skin-card': skin.isChampions}"
              :style="skin.isVCT ? `
                background-image: url('vct_logos/${skin.vctRegion}.png');
                border: 0px solid ${getRegionColor(skin.vctRegion)};
                box-shadow: inset 0 0 20px 10px ${getRegionColor(skin.vctRegion)}55;
              ` : ``"
              ref="skinCards"
            >
              <v-img
                :src="getImageUrl(skin)"
                :lazy-src="skin.displayIcon"
                width="100%"
                max-height="100px"
              />
              <div
                class="skin-card-bg"
                :style="`background: radial-gradient(circle at 0% 0%, #${skin.tierColor}, transparent 80%)`"
              ></div>
            </div>
          </div>
        </div>
      </v-card-item>
    </v-card>
  </v-dialog>

  <v-dialog v-model="skinResultDialog" class="modals" width="500" scrim="#181818" persistent>
    <!-- v-if ensures we don't render before data exists -->
    <v-card
      v-if="skins && skins.updatedSkin"
      color="#1A1A1A"
      rounded="xl"
      class="overflow-hidden"
      style="position: relative"
    >
      <!-- Glow Background -->
      <div
        class="glow-bg"
        :style="`background: radial-gradient(circle, #${skinsData[skins.updatedSkin.uuid]?.tierColor || 'fff'} 0%, transparent 100%);`"
      ></div>

      <v-card-item class="px-14 pt-10 pb-0">
        <div
          v-motion
          :initial="{ opacity: 0, scale: 0.5, y: 50 }"
          :enter="{
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 250, damping: 15, mass: 1 },
          }"
          class="mb-6 relative-container w-100"
          style="min-width: 100% !important; display: flex; justify-content: center"
        >
          <v-img
            :src="getPreciseImageUrl(skins.updatedSkin)"
            width="100%"
            height="250px"
            style="filter: drop-shadow(0 0 5px #333)"
          ></v-img>
        </div>
      </v-card-item>

      <v-card-item
        class="d-flex flex-column align-center justify-center pt-0 pb-6 text-center"
        style="z-index: 2"
      >
        <!-- TITLE: Slide Up -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :enter="{ opacity: 1, y: 0, transition: { delay: 300, duration: 500 } }"
        >
          <h2 class="text-h4 font-weight-bold text-white mb-1 text-pretty" style="min-width: 250px">
            {{
              skins.updatedSkin.displayName ||
              skinsData[skins.updatedSkin.uuid]?.displayName ||
              'Skin Name'
            }}
          </h2>
        </div>

        <v-row class="w-100 mt-2">
          <!-- Level Counter -->
          <v-col cols="6" class="text-center border-e border-grey-darken-3">
            <div
              v-motion
              :initial="{ opacity: 0, scale: 0.8 }"
              :enter="{ opacity: 1, scale: 1, transition: { delay: 500, duration: 400 } }"
            >
              <p class="text-caption text-uppercase text-grey">Level</p>
              <div class="text-h6 font-weight-black text-primary">
                {{ displayLevel }}
                <span class="text-h6 text-grey-darken-1"
                  >/ {{ skinsData[skins.updatedSkin.uuid]?.levels?.length || '?' }}</span
                >
              </div>
            </div>
          </v-col>

          <!-- Price/Value Counter -->
          <v-col cols="6" class="text-center">
            <div
              v-motion
              :initial="{ opacity: 0, scale: 0.8 }"
              :enter="{ opacity: 1, scale: 1, transition: { delay: 600, duration: 400 } }"
            >
              <p class="text-caption text-uppercase text-grey">Valeur</p>
              <div class="text-h6 font-weight-bold">
                {{ displayPrice }}&nbsp;<span class="font-weight-thin" style="font-size: 0.7em"
                  >Flopos</span
                >
              </div>
            </div>
          </v-col>
        </v-row>
        <div v-if="skinsData[skins.updatedSkin.uuid]?.chromas?.length > 1">
          <p class="text-caption text-uppercase text-grey mt-4">Chroma</p>
          <div class="d-flex justify-center mt-2" style="gap: 1em">
            <div
              v-for="(chroma, index) in skinsData[skins.updatedSkin.uuid].chromas"
              :key="chroma.uuid || index"
            >
              <v-img
                v-if="chroma.swatch"
                :src="chroma.swatch"
                class="rounded-lg"
                width="40px"
                height="40px"
                :style="`${index + 1 === skins.updatedSkin.currentChroma ? 'border: 3px solid #' + skins.updatedSkin.tierColor : ''}`"
                v-motion
                :initial="{ opacity: 0, y: 20 }"
                :enter="{
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    // 800ms base delay (waits for main card animations) + 100ms per item
                    delay: 800 + index * 100,
                  },
                }"
              />
            </div>
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
          @click="$router.push('/akhy/'+discordId)"
        >
          Voir l'inventaire
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          variant="tonal"
          color="secondary"
          rounded="lg"
          class="px-6"
          @click="
            skinResultDialog = false;
            caseOpeningDialog = false
          "
        >
          Fermer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.box {
  width: 100px !important;
  height: 100px !important;
  background-color: #0cdcf7;
  border-radius: 5px;
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
  background-color: #181818; /* Default fallback */
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
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));
}

.melee-skin-card {
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
  background: radial-gradient(circle at center, #2a2a2a 0%, #000000 100%);
}

/* Hide the default color blob for melee to make it look 'stealthy/premium' */
.melee-skin-card .skin-card-bg {
  opacity: 0.2;
  mix-blend-mode: color-dodge;
}

/* The sweeping shine animation */
.melee-skin-card::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    to bottom right,
    transparent,
    transparent,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent,
    transparent,
    transparent
  );
  transform: rotate(45deg) translateY(-100%);
  animation: shine-sweep 10s infinite cubic-bezier(0.4, 0.0, 0.2, 1);
  pointer-events: none;
  z-index: 3;
}

@keyframes shine-sweep {
  0% { transform: rotate(70deg) translateY(-450px); }
  20% { transform: rotate(70deg) translateY(250px); } /* Fast sweep */
  100% { transform: rotate(70deg) translateY(450px); } /* Wait */
}

/* --- 2. VCT EFFECTS (Custom Image) --- */
.vct-skin-card {
  /* Replace with your actual VCT background image path */
  background-size: 80%;
  background-position: center;
}

/* Darken the image so the gun pops */
.vct-skin-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(15, 25, 35, 0.1); /* VCT Dark Blue overlay */
  z-index: 1;
}

.vct-skin-card .skin-card-bg {
  display: none; /* Hide default tier color, use image instead */
}

/* --- 3. CHAMPIONS EFFECTS (Golden Flow) --- */
.champions-skin-card {
  border: 2px solid #ffd700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
  /* The animated gradient background */
  background: linear-gradient(
    120deg,
    #2b2005 0%,
    #634f11 25%,
    #ffd700 50%,
    #634f11 75%,
    #2b2005 100%
  );
  background-size: 200% 200%;
  animation: gold-flow 4s ease infinite;
}

.champions-skin-card .skin-card-bg {
  display: none; /* Hide default tier color */
}

@keyframes gold-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Add some sparkles/dust to champions */
.champions-skin-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(white 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.2;
  z-index: 1;
}


.glow-bg {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  opacity: 0.3; /* Increased slightly for visibility */
  filter: blur(50px);
  pointer-events: none;
  z-index: 0;
  border-radius: 50%;
}

.relative-container {
  /* Continuous float animation */
  animation: float 4s ease-in-out infinite;
  animation-delay: 1.2s; /* Wait for enter animation to finish */
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

/* Ensure dialog overflow is visible for the glow */
:deep(.v-overlay__content) {
  overflow: visible !important;
}
</style>