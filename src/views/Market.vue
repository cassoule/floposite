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
      collapseToolbar: false,
      searchQuery: '',

      nowTick: Date.now(),
      _timer: null,
    }
  },

  async mounted() {
    this.loading = true
    await this.fetchMarketOffers()
    this.loading = false

    this._forceCooldown = 0
    this._timer = setInterval(async () => {
      this.nowTick = Date.now()
    }, 500)
  },

  beforeUnmount() {
    if (this._timer) clearInterval(this._timer)
  },

  computed: {
    nowTime() {
      return Date.now()
    },
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
    prettyTimeLeft(timestamp) {
      const left = Math.max(0, timestamp - this.nowTick) // Ensure it doesn't go negative
      const s = Math.ceil(left / 1000)
      const hh = String(Math.floor(s / 3600)).padStart(2, '0')
      const mm = String(Math.floor(s / 60 % 60)).padStart(2, '0')
      const ss = String(Math.floor(s % 60)).padStart(2, '0')
      return `${hh}:${mm}:${ss}`
    },

  },
}
</script>

<template>
  <v-layout class="w-100">
    <v-main class="d-flex pt-16" style="place-items: start; place-content: start; gap: 2em">
      <div class="w-100">
        <h1>FlopoMarket</h1>
        <v-toolbar
          class="w-100 w-md-50 mr-2 mt-4 pr-0"
          density="compact"
          elevation="2"
          rounded="xl"
          color="#343434"
          :collapse="collapseToolbar"
          style="border: 2px solid #ffffff55; position: sticky; top: 1em; z-index: 1000; min-width: 250px"
        >
          <template #default>
            <div class="d-flex align-center">
              <v-text-field
                v-model="searchQuery"
                placeholder="Rechercher..."
                variant="plain"
                rounded="xl"
                density="compact"
                hide-details
                prepend-icon="mdi mdi-magnify"
                class="ml-3 pb-2"
                style="width: 130px"
              ></v-text-field>
              <div class="ml-3" :class="collapseToolbar ? 'd-none' : ''">
                <v-btn class="text-none" density="comfortable" prepend-icon="mdi mdi-filter" text="Filtrer" color="#ffffff99"></v-btn>
              </div>
            </div>

          </template>
          <template #append>
            <v-btn
              :icon="!collapseToolbar ? 'mdi mdi-chevron-left' : 'mdi mdi-chevron-right'"
              color="#ffffff99"
              style="transform: translateX(5px)"
              @click="collapseToolbar = !collapseToolbar"
            />
          </template>
        </v-toolbar>

        <div v-if="marketOffers" class="d-flex flex-column flex-md-row flex-md-wrap pt-8" style="min-height: 400px; place-items: start; justify-content: start">
          <div v-for="offer in marketOffers" class="w-100 w-md-50 pa-1 offer-card">
            <v-card class="text-white offer-card-card mb-2" color="transparent" :style="`border: 0px solid #${offer.skin.tierColor}; background: radial-gradient(circle at -100% -50%, #${offer.skin.tierColor}, #18181855)`" variant="flat" rounded="xl">
              <v-card-title>
                <p class="d-flex justify-space-between align-center"><span>{{offer.skin.displayName}}</span><span style="font-size: .7em">{{ prettyTimeLeft(offer.closing_at) }}</span></p>
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
                    height="100"
                    contain
                  ></v-img>
                  <div class="position-absolute d-flex flex-column" style="align-items: end; right: 0.5em">
                    <h2
                      class="mb-2 font-weight-bold px-3 rounded-xl"
                      :style="`
                        background: #${offer.skin.tierColor}22;
                        backdrop-filter: blur(10px);
                        border: 1px solid #${offer.skin.tierColor}
                      `"
                    >
                      {{offer.starting_price}}
                      <span style="font-size: .7em">Coins</span>
                    </h2>
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
                  <v-btn class="w-50 text-white" rounded="xl" color="primary" :style="`border: 2px solid #ffffff55`" variant="flat">Enchérir</v-btn>
              </v-card-actions>
            </v-card>
          </div>
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

@media (max-width: 800px) {
}
</style>