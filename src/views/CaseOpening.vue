<script>
import { Swiper, SwiperSlide } from 'swiper/vue';
import {Pagination, Autoplay} from 'swiper/modules';
import {InfiniteCarousel, InfiniteCarouselItem} from 'vue-infinite-carousel';
import "vue-infinite-carousel/dist/vue-infinite-carousel.css";
import 'swiper/css';
import axios from 'axios';

export default {
  components: {
    Swiper,
    SwiperSlide,
    InfiniteCarousel,
    InfiniteCarouselItem,
  },
  setup() {
    const onSwiper = (swiper) => {
      console.log(swiper);
    };
    const onSlideChange = () => {
      console.log('slide change');
    };
    return {
      onSwiper,
      onSlideChange,
      modules: [Pagination],
    };
  },
  async mounted() {
    // Fetch user data from localStorage or an API
    const discordId = localStorage.getItem('discordId');
    if (!discordId) this.$router.push('/')
    try {
      const response = await axios.get(import.meta.env.VITE_FLAPI_URL + '/user/' + discordId);
      this.user = response.data.user;
    } catch (e) {
      console.log(e)
      this.$router.push('/')
    }
  },
  data() {
    return {
      skins: null,
      skinsData: {},
      //crslSpeed: 200,
      crslSpeed: 7, // Duration in seconds

      // Animation State
      isSpinning: false,
      currentTranslateX: 0,

      // Configuration (Adjust these to match your CSS)
      cardWidth: 200, // Width of one item
      cardGap: 10,

      caseOpeningDialog: false,
      selectedCaseType: null,

      user: null,
      loading: false,
    };
  },
  computed: {
    itemFullWidth() {
      return this.cardWidth + this.cardGap;
    },
    doubledSkins() {
      // Safety check to ensure data exists
      if (!this.skins || !this.skins?.selectedSkins) return [];
      return [...this.skins.selectedSkins, ...this.skins.selectedSkins, ...this.skins.selectedSkins.slice(0, 3)];
    },
  },
  methods: {
    async fetchCase(caseType='standard') {
      this.loading = true
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/open-case'
      try {
        const userId = localStorage.getItem('discordId') || ''
        const response = await axios.post(fetchUrl, { userId, caseType })
        this.skins = response.data
        this.caseOpeningDialog = true
        await this.sleep(1000)
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
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    startAnimation() {
      if (this.isSpinning) return;

      // 1. Reset Position (Optional: if you want to start from 0 every time)
      this.isSpinning = false;
      this.currentTranslateX = 0;

      // 2. Wait for Vue to render the reset, then animate
      this.$nextTick(() => {
        // Trigger the spin
        this.isSpinning = true;

        const rawIndex = this.skins.randomSelectedSkinIndex;
        const listLength = this.skins.selectedSkins.length;
        // 3. Get the Target Index from your API data
        const targetIndex =  rawIndex + listLength;

        // 4. Calculate Container Center
        const containerWidth = this.$refs.rouletteContainer.clientWidth;

        // 5. Calculate where the card starts (in pixels from left 0)
        const cardPosition = targetIndex * this.itemFullWidth;

        // 6. Calculate the offset to make that card centered
        // (Container Half) - (Card Half)
        const centerOffset = (containerWidth / 2) - (this.cardWidth / 2);

        // 7. Add Random Jitter (So it doesn't land purely in the middle of the card)
        // Let's say we want it to land anywhere within 90% of the card width
        const maxRandom = this.cardWidth * 0.45;
        const minRandom = -this.cardWidth * 0.45;
        const randomOffset = Math.floor(Math.random() * (maxRandom - minRandom + 1)) + minRandom;

        // 8. Final Calculation
        // We move negative (left) to bring the card into view
        const targetTranslate = -(cardPosition - centerOffset + randomOffset);

        this.currentTranslateX = targetTranslate;

        // 9. Handle "Animation End"
        setTimeout(() => {
          this.handleAnimationEnd();
        }, this.crslSpeed * 1000);
      });
    },

    handleAnimationEnd() {
      // Logic to show modal, play sound, add item to inventory, etc.
      this.isSpinning = false;
    }
  },
};

</script>

<template>
  <v-layout class="w-100">
    <v-main class="d-flex justify-center flex-wrap flex-md-nowrap pt-16" style="place-items: start; place-content: start; gap: 2em">
      <v-card color="#1A1A1A" rounded="xl" class="w-33 px-0" style="min-width: 225px">
        <v-card-item class="px-4 py-4">
          <v-img src="flopobot.webp" rounded="lg" width="100%" max-height="150px" :style="`background: radial-gradient(circle at 70% 170%, #5A9FE2, transparent 100%)`" />
          <div class="d-flex justify-space-between align-baseline w-100 flex-wrap mt-3">
            <h2 class="mr-4" style="width: 145px">Standard Case</h2>
            <p class="text-secondary" style="width: 85px">500 Flopos</p>
          </div>
        </v-card-item>
        <v-card-item class="pb-3">
          <v-btn block :loading="loading" color="primary" rounded="lg" :disabled="user?.coins < 500 || loading" @click="fetchCase('standard')">Ouvrir</v-btn>
        </v-card-item>
      </v-card>

      <v-card color="#1A1A1A" rounded="xl" class="w-33 px-0" style="min-width: 225px">
        <v-card-item class="px-4 py-4">
          <v-img src="flopobot.webp" rounded="lg" width="100%" max-height="150px" :style="`background: radial-gradient(circle at 70% 170%, #D1548D, transparent 100%)`" />
          <div class="d-flex justify-space-between align-baseline w-100 flex-wrap mt-3">
            <h2 class="mr-4" style="width: 145px">Premium Case</h2>
            <p class="text-secondary" style="width: 85px">1000 Flopos</p>
          </div>

        </v-card-item>
        <v-card-item class="pb-3">
          <v-btn block :loading="loading" color="primary" rounded="lg" :disabled="user?.coins < 1000 || loading" @click="fetchCase('premium')">Ouvrir</v-btn>
        </v-card-item>
      </v-card>

      <v-card color="#1A1A1A" rounded="xl" class="w-33 px-0" style="min-width: 225px">
        <v-card-item class="px-4 py-4">
          <v-img src="flopobot.webp" rounded="lg" width="100%" max-height="150px" :style="`background: radial-gradient(circle at 70% 170%, #F5955B, transparent 100%)`" />
          <div class="d-flex justify-space-between align-baseline w-100 flex-wrap mt-3">
            <h2 class="mr-4" style="width: 145px">Deluxe Case</h2>
            <p class="text-secondary" style="width: 85px">2000 Flopos</p>
          </div>
        </v-card-item>
        <v-card-item class="pb-3">
          <v-btn block :loading="loading" color="primary" rounded="lg" :disabled="user?.coins < 2000 || loading" @click="fetchCase('ultra')">Ouvrir</v-btn>
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

  <v-dialog v-model="caseOpeningDialog" width="1500">
    <v-card color="#1A1A1A" rounded="xl" class="w-100 px-0" style="box-shadow: 0 0 100px 10px #444;">
      <v-card-item class="px-0">
        <div class="roulette-container" ref="rouletteContainer">
          <div class="selector-line"></div>
          <div
            class="roulette-rail"
            :style="{
                transform: `translateX(${currentTranslateX}px)`,
                transition: isSpinning ? `transform ${crslSpeed}s cubic-bezier(0.10, 0.75, 0.25, 1)` : 'none'
              }"
          >
            <div
              v-for="(skin, index) in doubledSkins"
              :key="skin.uuid + '_pos_' + index"
              class="skin-card"
              ref="skinCards"
            >
              <v-img :src="getImageUrl(skin, skinsData[skin.uuid])" :lazy-src="getImageUrl(skin, skinsData[skin.uuid])" width="100%" max-height="100px" />
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
</template>

<style scoped>
.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 12px;
}
.carousel-item {
  position: relative;
  width: 400px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: 0.3s ease-in-out;
  user-select: none;
}
.skin-img {
  height: 85px !important;
  min-width: 90% !important;
  user-select: none;
}

.roulette-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #1a1a1a;
  height: 250px; /* Adjust as needed */
}

.selector-line {
  position: absolute;
  left: 50%;
  top: 5%;
  bottom: 0;
  width: 2px;
  background: #5865f2;
  box-shadow: 0 0 10px 1px #5865f299;
  transform: translateX(-50%);
  z-index: 10;
  height: 90%;
}

.roulette-rail {
  display: flex;
  height: 100%;
  align-items: center;
  /* Will be handled by inline styles in JS */
  will-change: transform;
}

.skin-card {
  position: relative;
  /* Must match data.cardWidth */
  width: 200px;
  /* Must match data.cardGap */
  margin-right: 10px;
  flex-shrink: 0;
  border-radius: 20px;

  /* styling */
  height: 200px;
  padding: .5em;
  border: 1px solid #444;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  user-select: none;
  pointer-events: none;
}

.skin-card-bg {
  position: absolute;
  width: 150%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: -1;
  border-radius: 10px;
  transition: 0.2s ease-in-out;
}
</style>