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
    await this.getSkins()
  },
  data() {
    return {
      skins: null,
      skinsData: {},
      crslSpeed: 200,
    };
  },
  methods: {
    async getSkins() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/carousel-skins'
      try {
        const response = await axios.get(fetchUrl)
        this.skins = response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },
    getImageUrl(skin) {
      const level = skin.levels[skin.currentLvl - 1]
      return level?.displayIcon || skin.displayIcon || skin.chromas[0].fullRender
    },
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    async openingAnim() {
      // safety: ensure starting value present
      while (this.crslSpeed < 8000) {
        this.crslSpeed = Math.min(8000, this.crslSpeed + 200);
        await this.sleep(10); // pause 1s between steps
      }
      while (this.crslSpeed > 2500) {
        this.crslSpeed = Math.max(2500, this.crslSpeed - 100); // don't go below 100
        await this.sleep(10); // pause 1s between steps
      }
      let i = 0;
      while (this.crslSpeed > 100) {
        this.crslSpeed = Math.max(100, this.crslSpeed - 10); // don't go below 100
        await this.sleep(10 + i / 10); // pause 1s between steps
        i++
      }
      while (this.crslSpeed > 0) {
        this.crslSpeed = Math.max(0, this.crslSpeed - 2); // don't go below 100
        await this.sleep(10 + i / 10); // pause 1s between steps
        i++
      }
    }
  },

};

</script>

<template>
  <v-layout class="w-100">
    <v-main class="d-flex pt-16" style="place-items: start; place-content: start; gap: 2em">
      <v-card class="w-100" color="dark" style="position: relative">
        <div class="w-100 h-100 z-10 d-flex align-center justify-center" style="position: absolute; z-index: 10; pointer-events: none">
          <v-divider vertical color="white" opacity="1" length="100%" thickness="2"></v-divider>
        </div>
        <v-card-item class="w-100 px-0">
          <InfiniteCarousel v-if="skins" :gap="0" :speed="crslSpeed">
            <template v-for="skin in skins.selectedSkins">
              <InfiniteCarouselItem
                class="carousel-item"
                style="border-radius: 10px"
              >
                <div
                  style="
                      display: flex;
                      flex-direction: column;
                      place-content: start;
                      width: 100%;
                      padding: 1em 0;
                      gap: 1rem;
                    "
                >
                  <div
                    style="
                        display: flex;
                        place-content: center;
                        place-items: center;
                        width: 100%;
                        gap: 1em;
                      "
                  >
                    <v-img
                      :src="getImageUrl(skin)"
                      :lazy-src="getImageUrl(skin)"
                      class="skin-img"
                      height="50"
                      min-width="70"
                      max-width="70"
                    />
                  </div>
                </div>
                <div
                  class="skin-bg"
                  :style="`background: radial-gradient(circle at 75% 50%, #${skin.tierColor}, transparent 100%)`"
                ></div>
              </InfiniteCarouselItem>
            </template>
          </InfiniteCarousel>
        </v-card-item>
        <v-card-actions>
          <v-btn @click="openingAnim">Open</v-btn>
          {{crslSpeed}}
        </v-card-actions>
      </v-card>
    </v-main>
  </v-layout>

  <v-btn
    class="back-btn text-none"
    text="Retour"
    variant="tonal"
    color="#ddd"
    @click="$router.push('/dashboard')"
  ></v-btn>
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
</style>