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
      selectedOffer: null,
      seeOffer: false,
      collapseToolbar: true,
      searchQuery: '',

      nowTick: Date.now(),
      _timer: null,
    }
  },

  async mounted() {
    this.loading = true
    await this.fetchMarketOffers()
    await this.fetchSkinsVideosUrls()
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
    timeLeft(timestamp) {
      const left = Math.max(0, timestamp - this.nowTick) // Ensure it doesn't go negative
      const s = Math.ceil(left / 1000)
      return s % 60
    },
    prettyTimeLeft(timestamp) {
      const left = Math.max(0, timestamp - this.nowTick) // Ensure it doesn't go negative
      const s = Math.ceil(left / 1000)
      const hh = String(Math.floor(s / 3600)).padStart(2, '0')
      const mm = String(Math.floor(s / 60 % 60)).padStart(2, '0')
      const ss = String(Math.floor(s % 60)).padStart(2, '0')
      if (hh === '00') {
        return `${mm}:${ss}`
      }
      return `${hh}:${mm}`
    },
    getImageUrl(skin, skinInfo) {
      if (skin.currentLvl === skinInfo?.levels.length) {
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
    async fetchSkinsVideosUrls() {
      try {
        const tasks = this.marketOffers.map((offer) =>
          Promise.all([this.getSkinData(offer.skin)])
        )

        await Promise.all(tasks)
      } catch (e) {
        console.error('inventory hydration error:', e)
      } finally {
        this.loadingInventory = false
      }
    },
    getChromaName(skin, skinInfo) {
      if (skin.currentChroma > 1) {
        const name = skinInfo.chromas[skin.currentChroma - 1]?.displayName
          .replace(/[\r\n]+/g, ' ')
          .replace(/\u00A0/g, ' ') // normalize NBSPs
          .replace(skinInfo.displayName, '')
          .trim()
        const match = name.match(/vari(?:ant|ante)\s*\d+\s*[-–—:]?\s*([^)]+?)(?:\)|$)/i)
        return match ? match[1].trim() : name
      }
      return 'Base'
    },
    getOfferLastPrice(offer) {
      if (offer.bids.length > 0) {
        return offer.bids[offer.bids.length - 1].offer_amount
      }
      return offer.starting_price
    },
  },
}
</script>

<template>
  <v-layout class="w-100">
    <v-main class="d-flex pt-16" style="place-items: start; place-content: start; gap: 2em">
      <div class="w-100">
        <h1 class="text-white">FlopoMarket</h1>
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

        <div v-if="!loading" class="d-flex flex-column flex-md-row flex-md-wrap pt-8" style="min-height: 400px; place-items: start; justify-content: start">
          <div v-for="offer in marketOffers" class="w-100 w-md-50 pa-1 offer-card">
            <v-card class="text-white offer-card-card mb-2" color="transparent" :style="`border: 0px solid #${offer.skin.tierColor}; background: radial-gradient(circle at -100% -50%, #${offer.skin.tierColor}, #18181855)`" variant="flat" rounded="xl">
              <v-card-title>
                <span>{{offer.skin.displayName}}</span>
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
                    :src="getImageUrl(offer?.skin, skinsData[offer.skin.uuid])"
                    :alt="offer.skin.displayName"
                    max-width="300"
                    height="100"
                    contain
                  ></v-img>
                  <div class="position-absolute d-flex flex-column" style="align-items: end; right: 0.5em">
                    <h3
                      class="mb-2 font-weight-bold px-3 rounded-xl"
                      :style="`
                        background: #${offer.skin.tierColor}22;
                        backdrop-filter: blur(10px);
                        border: 1px solid #${offer.skin.tierColor}
                      `"
                    >
                      {{getOfferLastPrice(offer)}}
                      <span style="font-size: .7em">Coins</span>
                    </h3>
                    <v-chip v-bind="props" :color="offer.starting_price / offer.skin.currentPrice > 1.1
                            ? 'red'
                            : offer.starting_price / offer.skin.currentPrice < 0.9
                              ? 'green'
                              : ''"
                            style="backdrop-filter: blur(10px); border: 1px solid; font-size: .7em"
                            density="compact"
                            class="px-2"
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
              <v-card-actions class="d-flex justify-space-between">
                <span class="px-2 rounded-xl d-flex align-baseline" style="background: #343434; font-size: 1em">
                  {{ prettyTimeLeft(offer.closing_at) }}&nbsp;
                  <v-icon :class="timeLeft(offer.closing_at)%2===0 ? 'mdi mdi-timer-sand' : 'mdi mdi-timer-sand-complete'" size="15"></v-icon>
                </span>
                <v-btn
                  class="w-50 text-white"
                  rounded="xl"
                  color="primary"
                  variant="flat"
                  @click="selectedOffer = offer"
                  @click.stop="seeOffer = true"
                >
                  Enchérir
                </v-btn>
              </v-card-actions>
            </v-card>
          </div>
        </div>
      </div>
    </v-main>

    <v-dialog v-model="seeOffer" class="modals" max-width="800" scrollable scroll-strategy="reposition">
      <v-card v-if="selectedOffer" class="modal-card" color="primary" variant="flat">
        <v-card-title>
          <span style="text-wrap: wrap">{{selectedOffer.skin.displayName}}</span>
          <span class="position-absolute right-0 top-0 mt-2 mr-2 px-2 rounded-xl" style="background: #343434; font-size: .7em">{{ prettyTimeLeft(selectedOffer.closing_at) }}</span>
          <div class="d-flex align-center">
            <v-img
              :src="selectedOffer.seller.avatarUrl"
              :alt="selectedOffer.seller.username"
              min-width="18"
              max-width="18"
              max-height="18"
              class="mt-1 mr-1 rounded-circle"
            />
            <p style="font-size: .8em; color: #ffffffaa">{{selectedOffer.seller.username}}</p>
          </div>
        </v-card-title>
        <v-card-text class="px-2" style="scrollbar-width: auto;">
          <v-card class="d-flex justify-center pt-4 pb-16 px-4" color="#18181855" variant="flat" rounded="xl">
            <v-img
              :src="getImageUrl(selectedOffer.skin, skinsData[selectedOffer.skin.uuid])"
              max-width="512"
              height="250"
            ></v-img>
            <div class="d-flex position-absolute top-1 right-0 mr-4" style="gap: 1em">
              <div v-for="(chroma, index) in skinsData[selectedOffer.skin.uuid].chromas">
                <v-img v-if="chroma.swatch" :src="chroma.swatch" class="rounded-lg" width="30px" height="30px" :style="`${index + 1 === selectedOffer.skin.currentChroma ? 'border: 2px solid #' + selectedOffer.skin.tierColor : ''}`" />
                <span v-if="!chroma.swatch" class="font-weight-bold text-white">{{
                    getChromaName(selectedOffer.skin, skinsData[selectedOffer.skin.uuid])
                  }}
                </span>
              </div>
            </div>
            <v-card variant="flat" color="#343434" class="position-absolute bottom-0 mb-2" style="width: 96%" rounded="xl">
              <v-card-text class="px-4 pt-5 pb-4">
                <v-row>
                  <v-col class="py-0">
                    <p style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">Rareté : <strong :style="`color: #${selectedOffer.skin.tierColor}`">{{parseInt(selectedOffer.skin.tierRank)}}&nbsp;({{selectedOffer.skin.tierText.split(':')[1]}})</strong></p>
                  </v-col>
                  <v-col class="py-0">
                    <p style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">Niveau : <strong>{{selectedOffer.skin.currentLvl ?? '-'}}</strong>/{{skinsData[selectedOffer.skin.uuid].levels?.length}}</p>
                  </v-col>
                  <v-col class="py-0">
                    <p style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">Chroma : <strong>{{selectedOffer.skin.currentChroma ?? '-'}}</strong>/{{skinsData[selectedOffer.skin.uuid].chromas?.length}}</p>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-card>
          <v-card variant="flat" color="#343434" class="mt-2" rounded="lg">
            <v-card-text class="px-4">
              <v-row>
                <v-col>
                  <p>Prix de départ : <strong>{{selectedOffer.starting_price}}&nbsp;Coins</strong></p>
                  <p>Achat immédiat : <strong>{{selectedOffer.buyout_price ?? 'N/A' }}&nbsp;Coins</strong></p>
                </v-col>
                <v-col>
                  <p>Offres : <strong>{{selectedOffer.bids.length}}</strong></p>
                  <p>Dernière offre : <strong>{{ selectedOffer.bids.length > 0 ? getOfferLastPrice(selectedOffer) : '-'}}&nbsp;Coins</strong></p>
                </v-col>

              </v-row>
            </v-card-text>
          </v-card>
          <v-card variant="text" class="pt-2">
            <v-card-title class="px-2">
              Offres
            </v-card-title>
            <v-card-text class="px-0">
              <v-list v-if="selectedOffer.bids.length > 0" class="py-0 ma-0" bg-color="#343434" rounded="lg">
                <v-list-item v-for="bid in selectedOffer.bids" class="pa-0" style="min-height: 0">
                  <v-divider></v-divider>
                  <v-list-item-title class="d-flex align-center ga-2 mr-4 mt-0">
                    <p class="ml-4 mr-2" style="font-size: .7em">{{bid.offered_at}}</p>
                    <v-divider vertical></v-divider>
                    <v-img
                      :src="bid.bidder.avatarUrl"
                      max-width="20"
                      rounded="circle"
                      class="ml-1"
                    />
                    <p class="pb-1">{{bid.bidder.username}}</p>
                    <v-spacer></v-spacer>
                    {{bid.offer_amount}} Coins
                  </v-list-item-title>
                  <v-divider></v-divider>
                </v-list-item>
              </v-list>
              <v-list v-else rounded="lg" bg-color="#343434">
                <v-list-item>
                  <v-list-item-title class="text-center">Aucune offre pour le moment.</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-card-text>
        <v-card-actions>
          <v-btn
            class="text-white px-3 text-none"
            rounded="lg"
            color="primary"
            variant="flat"
            @click="seeOffer = false"
          >
            Enchérir
          </v-btn>
          <v-btn
            class="text-white px-3 text-none"
            rounded="lg"
            color="primary"
            variant="flat"
            :disabled="selectedOffer.buyout_price === null"
            @click="seeOffer = false"
          >
            Acheter pour {{selectedOffer.buyout_price ?? '-'}}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-btn
      class="back-btn text-none"
      text="Retour"
      variant="tonal"
      color="#ddd"
      @click="$router.push('/dashboard')"
    ></v-btn>
  </v-layout>
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

.modals {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.modal-card {
  position: relative;
  margin-top: 10px;
  background: transparent !important;
  border-radius: 15px !important;
}
.modal-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 100%;
  background: radial-gradient(circle at -100% -200%, #5865f2, #181818 100%) !important;
  z-index: -1;
}

@media (max-width: 800px) {
}
</style>