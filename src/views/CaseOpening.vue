<script>
import { Swiper, SwiperSlide } from 'swiper/vue';
import {Pagination, Autoplay} from 'swiper/modules';
import 'swiper/css';
import axios from 'axios'

export default {
  components: {
    Swiper,
    SwiperSlide,
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
      crslSpeed: 3000,
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
      while (this.crslSpeed > 100) {
        this.crslSpeed = Math.max(100, this.crslSpeed - 200); // don't go below 100
        await this.sleep(500); // pause 1s between steps
      }
    }
  },

};

</script>

<template>
  <v-layout class="w-100">
    <v-main class="d-flex pt-16" style="place-items: start; place-content: start; gap: 2em">
      <v-card class="w-100" color="dark">
        <v-card-item class="w-100 px-0">
          <swiper
            v-if="skins"
            class="w-100"
            :autoplay="{ delay: 0, disableOnInteraction: false }"
            :allow-touch-move="false"
            :speed="crslSpeed"
            :loop="true"
            :freeMode="true"
            :freeModeMomentum="true"
            :breakpoints="{
              '600': {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              '800': {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              '1050': {
                slidesPerView: 4,
                spaceBetween: 20,
              },
            }"
            :space-between="30"
            style="user-select: none"
            @swiper="onSwiper"
            @slideChange="onSlideChange"
          >
            <swiper-slide
              v-for="skin in skins"
              :key="skin.id"
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
                    class="skin-img"
                    height="50"
                    min-width="70"
                    max-width="70"
                  />
                </div>
              </div>
              <div
                class="skin-bg"
                :style="`background: radial-gradient(circle at -0% 0%, #${skin.tierColor}, transparent 80%)`"
              ></div>
            </swiper-slide>
          </swiper>
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
  width: 100%;
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