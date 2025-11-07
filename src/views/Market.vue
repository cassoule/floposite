<script>
import axios from 'axios'
import { frenchColorToHex } from '@/utils/colorToHex.js'

export default {
  name: 'Market',

  components: {},

  data() {
    return {
      users: null,
      user: null,
      skinsVideoUrls: {},
      skinsData: {},
      loading: true,
      loadingInventory: true,

      skinVideoDialog: false,
      selectedSkin: null,

      marketOffers: {},
    }
  },

  async mounted() {
    this.loading = true
    await this.fetchMarketOffers()
    this.loading = false
  },

  computed: {

  },

  methods: {
    async fetchMarketOffers() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/market-place/offers'
      try {
        const response = await axios.get(fetchUrl)
        this.marketOffers = response.data.offers
      } catch (error) {
        console.error('Error fetching market offers:', error)
      }
    },
  },
}
</script>

<template>
  <v-layout class="w-100" :key="Date.now()">
    <v-main class="d-flex pt-16" style="place-items: start; place-content: start; gap: 2em">
      <div class="w-100">
        <h1>FlopoMarket</h1>
        <div v-if="marketOffers" class="d-flex flex-column pt-8" style="min-height: 400px; place-items: start; justify-content: center; gap: 1em">
          <v-card v-for="offer in marketOffers" class="w-100 text-white" color="transparent" :style="`border: 2px solid #${offer.skin.tierColor}; background: radial-gradient(circle at -100% 0%, #${offer.skin.tierColor}, transparent)`" variant="flat" rounded="xl">
            <v-card-title>
              {{offer.skin.displayName}}
              <div class="d-flex align-center">
                <v-img
                  :src="offer.seller.avatarUrl"
                  :alt="offer.seller.username"
                  min-width="18"
                  max-width="18"
                  max-height="18"
                  class="mt-1 mr-1 rounded-circle"
                />
                <p style="font-size: .8em; color: #ffffffaa">{{offer.seller.username}}</p>
              </div>
            </v-card-title>
            <v-card-item>
              <div class="d-flex flex-row" style="gap: 1em; justify-content: space-between">
                <v-img
                  :src="offer.skin.displayIcon"
                  :alt="offer.skin.displayName"
                  max-width="300"
                  max-height="150"
                  min-height="100"
                  contain
                ></v-img>
                <div class="position-absolute d-flex flex-column" style="align-items: end; right: 2em">
                  <h2 class="mb-2 font-weight-bold" style="text-shadow: 0 0 10px #000">{{offer.starting_price}} <span style="font-size: .9em">Flopocoins</span></h2>
                  <v-chip v-bind="props" :color="offer.starting_price / offer.skin.currentPrice > 1.1
                            ? 'red'
                            : offer.starting_price / offer.skin.currentPrice < 0.9
                              ? 'green'
                              : ''"
                          style="backdrop-filter: blur(10px); border: 1px solid"
                  >
                    <span class="font-weight-bold">{{offer.starting_price / offer.skin.currentPrice > 1 ? '+' : ''}}{{((offer.starting_price / offer.skin.currentPrice * 100) - 100).toFixed(1)}}%</span>
                    <v-menu activator="parent" location="end" open-on-hover open-on-click transition="scale-transition">
                      <v-list
                        width="250"
                        class="mr-2 py-0"
                        elevation="20"
                        rounded="xl"
                        bg-color="#181818"
                        base-color="white"
                        variant="tonal"
                        style="border: 2px solid #ffffff55"
                      >
                        <v-list-item class="px-4 pt-3">
                          <v-list-item-title
                            class="pb-2"
                            style="display: flex; place-content: start; place-items: center; gap: 0.7rem"
                          >{{offer.skin.displayName}}</v-list-item-title>
                          <h4>Skin</h4>
                          <p class="d-flex text-grey">
                            Base <v-spacer/> {{offer.skin.basePrice}}
                          </p>
                          <p class="d-flex text-grey align-center">
                            Actuel <v-spacer/> {{offer.skin.currentPrice}}
                          </p>
                          <p class="d-flex text-grey">
                            Maximum <v-spacer/> {{offer.skin.maxPrice}}
                          </p>
                          <p class="d-flex text-grey">
                            Dernière vente <v-spacer/> -
                          </p>
                        </v-list-item>
                        <v-list-item class="pb-3">
                          <h4>Enchère</h4>
                          <p class="d-flex text-grey">
                            Prix de départ <v-spacer/> {{offer.starting_price}}
                          </p>
                          <p class="d-flex text-grey">
                            Achat immédiat <v-spacer/> {{offer.buyout_price ?? '-'}}
                          </p>

                          <p class="d-flex text-grey">
                            Dernière offre <v-spacer/> -
                          </p>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </v-chip>
                </div>
              </div>
            </v-card-item>
            <v-card-actions class="d-flex justify-end">
              <v-btn-group density="compact" rounded="xl">
                <v-btn class="text-none px-4" color="primary" variant="flat" text="Enchérir"></v-btn>
                <v-btn class="text-none text-white px-4" :color="'#'+offer.skin.tierColor" variant="flat" text="Acheter" :disabled="offer.buyout_price === null"></v-btn>
              </v-btn-group>
            </v-card-actions>
          </v-card>
        </div>
      </div>
    </v-main>

    <v-btn
      class="back-btn text-none"
      text="Retour"
      variant="tonal"
      color="#ddd"
      @click="$router.push('/dashboard')"
    ></v-btn>
  </v-layout>

  <v-dialog
    v-model="skinVideoDialog"
    class="modals"
    max-width="800"
    scroll-strategy="reposition"
    scrollable
  >
    <v-card
      class="mr-2 py-0"
      elevation="20"
      rounded="xl"
      :color="`#${selectedSkin.tierColor}77`"
      bg-color="#181818"
      base-color="white"
      variant="flat"
      :style="`border: 2px solid #${selectedSkin.tierColor}`"
    >
      <v-card-item class="pa-0">
        <v-video
          class="skin-video w-100"
          :volume="25"
          theme="dark"
          :color="`#${selectedSkin.tierColor}`"
          autoplay
          floating
          controls-variant="hidden"
          elevation="0"
          :src="skinsVideoUrls[selectedSkin.uuid]"
          style="user-select: none"
        ></v-video>
      </v-card-item>
      <div style="position: absolute; top: 10px; right: 10px; cursor: pointer">
        <v-icon
          class="mdi mdi-close video-close-icon text-white"
          @click="skinVideoDialog = false"
        />
      </div>
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

.rank-ctn {
  width: 45%;
}

.graphs-list {
  display: flex;
  flex-wrap: wrap;
}

.graphs {
  flex-grow: 1;
  flex-shrink: 0;
}

.video-close-icon {
  z-index: 1 !important;
}

.video-close-icon::after {
  content: '';
  position: absolute;
  z-index: -1;
  width: 0;
  height: 0;
  overflow: hidden;
  box-shadow: 5px -5px 25px 25px #1c252677;
}

.win-card {
  position: relative;
}
.win-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 100%;
  background: radial-gradient(circle at 23% 23%, #3eaa3e, #00000000 23%) !important;
  z-index: -1;
}

.lose-card {
  position: relative;
}
.lose-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 100%;
  background: radial-gradient(circle at 23% 23%, #aa3e3e, #00000000 23%) !important;
  z-index: -1;
}

.draw-card {
  position: relative;
}
.draw-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 100%;
  background: radial-gradient(circle at 23% 23%, #5865f2, #00000000 23%) !important;
  z-index: -1;
}

.inventory {
  flex-direction: column;
  overflow-y: hidden;
  overflow-x: scroll;
  scrollbar-width: auto;
  user-select: none;
}

.inventory-grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(2, auto);
  gap: 0.2em;
}

.inventory-item {
  position: relative;
  width: 400px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: 0.3s ease-in-out;
  user-select: none;
}

.skin-img {
  height: 85px !important;
  min-width: 200px !important;
  user-select: none;
}

@media (max-width: 800px) {
  .graphs-list {
    display: block;
  }

  .graphs {
    width: 100%;
  }

  .username {
    max-width: 70px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rank-ctn {
    width: 100%;
  }
}
</style>