<script>
import axios from 'axios'
import { frenchColorToHex } from '@/utils/colorToHex.js'
import { useToastStore } from '@/stores/toastStore.js'
import Toast from '@/components/Toast.vue'
import { io } from 'socket.io-client'
import CoinsCounter from '@/components/CoinsCounter.vue'

export default {
  name: 'Market',

  components: { CoinsCounter, Toast },

  setup() {
    const toastStore = useToastStore()
    const showToast = (msg, warning) => {
      toastStore.showSuccessOrWarningToast(msg, warning)
    }

    return {
      toastStore: toastStore.$state,
      showToast,
    }
  },

  data() {
    return {
      socket: null,
      users: null,
      user: null,
      skinsVideoUrls: {},
      skinsData: {},
      loading: true,
      loadingInventory: false,

      skinVideoDialog: false,
      selectedSkin: null,

      marketOffers: {},
      filteredMarketOffers: {},
      selectedOffer: null,
      seeOffer: false,
      buyoutModal: false,
      placeBidModal: false,
      bidAmount: null,
      collapseToolbar: true,
      searchQuery: '',
      offersType: 'open',

      createOfferDialog: false,
      userInventory: null,

      nowTick: Date.now(),
      _timer: null,

      delaySelect: [
        { title: 'Aucun délai', value: 0 },
        { title: '5 minutes', value: 5 * 60 * 1000 },
        { title: '15 minutes', value: 15 * 60 * 1000 },
        { title: '30 minutes', value: 30 * 60 * 1000 },
        { title: '1 heure', value: 60 * 60 * 1000 },
        { title: '2 heures', value: 2 * 60 * 60 * 1000 },
        { title: '4 heures', value: 4 * 60 * 60 * 1000 },
        { title: '8 heures', value: 8 * 60 * 60 * 1000 },
        { title: '12 heures', value: 12 * 60 * 60 * 1000 },
        { title: '24 heures', value: 24 * 60 * 60 * 1000 },
      ],

      durationSelect: [
        { title: '1 heure', value: 60 * 60 * 1000 },
        { title: '2 heures', value: 2 * 60 * 60 * 1000 },
        { title: '4 heures', value: 4 * 60 * 60 * 1000 },
        { title: '8 heures', value: 8 * 60 * 60 * 1000 },
        { title: '12 heures', value: 12 * 60 * 60 * 1000 },
        { title: '24 heures', value: 24 * 60 * 60 * 1000 },
      ],

      createOffer: {
        skin_uuid: null,
        price: null,
        delay: null,
        duration: null,
      },
    }
  },

  async mounted() {
    this.loading = true
    await this.fetchMarketOffers()
    await this.fetchSkinsVideosUrls(this.marketOffers)
    this.loading = false
    this.initSocket()

    this._forceCooldown = 0
    this._timer = setInterval(async () => {
      this.nowTick = Date.now()
    }, 500)
  },

  beforeUnmount() {
    if (this._timer) clearInterval(this._timer)
  },

  computed: {},

  methods: {
    initSocket() {
      this.socket = io(import.meta.env.VITE_FLAPI_URL.replace('/api', ''), {
        withCredentials: false,
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
      })

      this.socket.on('market:update', async () => {
        await this.fetchMarketOffers()
        this.showToast('Marché mis à jour', false)
      })
    },
    async fetchMarketOffers() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/market-place/offers'
      try {
        const response = await axios.get(fetchUrl)
        this.marketOffers = response.data.offers
        this.filterOffers()
      } catch (error) {
        console.error('Error fetching market offers:', error)
      }
    },
    async getUserInventory() {
      this.loadingInventory = true
      const fetchUrl =
        import.meta.env.VITE_FLAPI_URL + '/user/' + localStorage.getItem('discordId') + '/inventory'
      try {
        const response = await axios.get(fetchUrl)
        this.userInventory = response.data.inventory.filter((offer) => {
          return !this.marketOffers.some(
            (marketOffer) =>
              marketOffer.skin.uuid === offer.uuid && marketOffer.status !== 'closed',
          )
        })
        await this.fetchSkinsVideosUrls(this.userInventory)
      } catch (e) {
        console.error('flAPI error:', e)
      }
      this.loadingInventory = false
    },
    timeLeft(timestamp) {
      const left = Math.max(0, timestamp - this.nowTick) // Ensure it doesn't go negative
      const s = Math.ceil(left / 1000)
      return s
    },
    prettyTimeLeft(timestamp) {
      const left = Math.max(0, timestamp - this.nowTick) // Ensure it doesn't go negative
      const s = Math.ceil(left / 1000)
      const hh = String(Math.floor(s / 3600)).padStart(2, '0')
      const mm = String(Math.floor((s / 60) % 60)).padStart(2, '0')
      const ss = String(Math.floor(s % 60)).padStart(2, '0')
      if (hh === '00') {
        return `${mm}:${ss}`
      }
      return `${hh}:${mm}`
    },
    getImageUrl(skin, skinInfo) {
      if (skin.currentLvl === skinInfo?.levels?.length) {
        const chroma = skinInfo.chromas[skin.currentChroma - 1]
        return chroma?.fullRender || chroma?.displayIcon || skinInfo.displayIcon
      }
      const level = skinInfo?.levels[skin.currentLvl - 1]
      return level?.displayIcon || skinInfo?.displayIcon || skinInfo?.chromas[0].fullRender
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
    async fetchSkinsVideosUrls(offers) {
      try {
        const tasks = offers.map((offer) => Promise.all([this.getSkinData(offer.skin ?? offer)]))

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
        return offer.bids[0].offer_amount
      }
      return offer.starting_price
    },
    filterOffers() {
      const normalize = (str) =>
        str
          .normalize('NFD') // splits letters and accents
          .replace(/[\u0300-\u036f]/g, '') // removes accent marks
          .toLowerCase()

      let searched
      if (!this.searchQuery || this.searchQuery?.trim() === '') {
        searched = this.marketOffers
      } else {
        const query = normalize(this.searchQuery)

        searched = this.marketOffers.filter((offer) => {
          const name = normalize(offer.skin.displayName)
          const seller = normalize(offer.seller.username)

          return name.includes(query) || seller.includes(query)
        })
      }

      if (this.offersType) {
        this.filteredMarketOffers = searched.filter((offer) => {
          return offer.status === this.offersType
        })
      } else {
        this.filteredMarketOffers = searched
      }
    },
    async goToUser(id) {
      await this.$router.push('/akhy/' + id)
    },
    async confirmBid() {
      const url =
        import.meta.env.VITE_FLAPI_URL +
        '/market-place/offers/' +
        this.selectedOffer.id +
        '/place-bid'
      try {
        const response = await axios.post(url, {
          buyer_id: localStorage.getItem('discordId'),
          bid_amount: this.bidAmount,
          timestamp: Date.now(),
        })
        console.log('Bid placed successfully:', response.data)
        this.placeBidModal = false
        this.seeOffer = false
        this.bidAmount = null
        await this.fetchMarketOffers()
        this.showToast('Offre placée', false)
      } catch (error) {
        this.showToast(error.response.data.error, true)
        console.error('Error placing bid:', error)
      }
    },
    async confirmPurchase() {},
    async handleCreateOffer(skin_uuid) {
      const url = import.meta.env.VITE_FLAPI_URL + '/market-place/place-offer'
      const payload = {
        seller_id: localStorage.getItem('discordId'),
        skin_uuid: skin_uuid,
        starting_price: this.createOffer.price,
        delay: this.createOffer.delay,
        duration: this.createOffer.duration,
        timestamp: Date.now(),
      }
      try {
        const response = await axios.post(url, payload)
        this.createOfferDialog = false
        this.showToast(response.data.message, false)
        await this.fetchMarketOffers()
      } catch (e) {
        this.showToast(e.response.data.error, true)
        console.error('Error creating offer:', e)
      }
    },
  },
}
</script>

<template>
  <CoinsCounter />
  <v-layout class="w-100">
    <v-main class="d-flex pt-16" style="place-items: start; place-content: start; gap: 2em">
      <div class="w-100">
        <h1 class="text-white">FlopoMarket</h1>
        <div
          class="w-100 d-flex align-center flex-wrap"
          style="position: sticky; top: 1em; z-index: 1000; gap: 0 1em"
        >
          <v-toolbar
            class="w-sm-66 mr-2 mt-4 pr-0"
            density="compact"
            elevation="2"
            rounded="xl"
            color="#343434"
            style="border: 2px solid #ffffff55; min-width: 250px"
          >
            <template #default>
              <div class="d-flex w-100 align-center">
                <v-text-field
                  v-model="searchQuery"
                  placeholder="Rechercher par nom, vendeur..."
                  variant="plain"
                  rounded="xl"
                  density="compact"
                  hide-details
                  prepend-icon="mdi mdi-magnify"
                  class="ml-3 pb-2 w-100"
                  clearable
                  style="flex-grow: 1"
                  @update:model-value="filterOffers()"
                ></v-text-field>
              </div>
            </template>
            <template #append>
              <v-btn
                class="text-none"
                color="primary"
                variant="flat"
                rounded="xl"
                style="margin-right: 2px"
                elevation="0"
                @click="createOfferDialog = true"
                @click.stop="getUserInventory"
              >
                Créer
              </v-btn>
            </template>
          </v-toolbar>
          <div>
            <v-btn-toggle
              v-model="offersType"
              class="mt-4"
              base-color="#343434"
              color="#555"
              rounded="xl"
              variant="flat"
              density="compact"
              style="border: 2px solid #555555"
              @update:model-value="filterOffers()"
            >
              <v-btn class="text-none" value="open">Ouvertes</v-btn>
              <v-btn class="text-none" value="closed">Fermées</v-btn>
              <v-btn class="text-none" value="pending">En attente</v-btn>
            </v-btn-toggle>
          </div>
        </div>

        <div
          v-if="!loading"
          class="d-flex flex-column flex-md-row flex-md-wrap pt-8"
          style="min-height: 575px; place-items: start; justify-content: start"
        >
          <div
            v-if="filteredMarketOffers && filteredMarketOffers.length === 0"
            class="w-100 d-flex justify-center pt-16"
          >
            Aucune offre trouvée.
          </div>
          <div v-for="offer in filteredMarketOffers" class="w-100 w-md-50 pa-1 offer-card">
            <v-card
              class="text-white offer-card-card mb-2"
              color="transparent"
              :style="`border: 0px solid #${offer.skin.tierColor}; background: radial-gradient(circle at -100% -50%, #${offer.skin.tierColor}, #18181855)`"
              variant="flat"
              rounded="xl"
            >
              <v-card-title>
                <span>{{ offer.skin.displayName }}</span>
                <div class="d-flex align-center cursor-pointer" @click="goToUser(offer.seller.id)">
                  <v-img
                    :src="offer.seller.avatarUrl"
                    :alt="offer.seller.username"
                    min-width="18"
                    max-width="18"
                    max-height="18"
                    class="mt-1 mr-1 rounded-circle"
                  />
                  <p style="font-size: 0.8em; color: #ffffffaa">{{ offer.seller.username }}</p>
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
                  <div
                    class="position-absolute d-flex flex-column"
                    style="align-items: end; right: 0.5em"
                  >
                    <h3
                      v-if="offer.status !== 'closed'"
                      class="mb-2 font-weight-bold px-3 rounded-xl"
                      :style="`
                        background: #${offer.skin.tierColor}22;
                        backdrop-filter: blur(10px);
                        border: 1px solid #${offer.skin.tierColor}
                      `"
                    >
                      {{ getOfferLastPrice(offer) }}
                      <span style="font-size: 0.7em">Coins</span>
                    </h3>
                    <v-chip
                      v-if="offer.status !== 'closed'"
                      v-bind="props"
                      :color="
                        offer.starting_price / offer.skin.currentPrice > 1.1
                          ? 'red'
                          : offer.starting_price / offer.skin.currentPrice < 0.9
                            ? 'green'
                            : ''
                      "
                      style="backdrop-filter: blur(10px); border: 1px solid; font-size: 0.7em"
                      density="compact"
                      class="px-2"
                    >
                      <span class="font-weight-bold"
                        >{{ getOfferLastPrice(offer) / offer.skin.currentPrice > 1 ? '+' : ''
                        }}{{
                          (
                            (getOfferLastPrice(offer) / offer.skin.currentPrice) * 100 -
                            100
                          ).toFixed(1)
                        }}%</span
                      >
                      <v-menu
                        activator="parent"
                        location="end"
                        open-on-hover
                        open-on-click
                        transition="scale-transition"
                      >
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
                              style="
                                display: flex;
                                place-content: start;
                                place-items: center;
                                gap: 0.7rem;
                              "
                              >{{ offer.skin.displayName }}</v-list-item-title
                            >
                            <h4>Skin</h4>
                            <p class="d-flex text-grey">
                              Base <v-spacer /> {{ offer.skin.basePrice }}
                            </p>
                            <p class="d-flex text-grey align-center">
                              Actuel <v-spacer /> {{ offer.skin.currentPrice }}
                            </p>
                            <p class="d-flex text-grey">
                              Maximum <v-spacer /> {{ offer.skin.maxPrice }}
                            </p>
                            <p class="d-flex text-grey">Dernière vente <v-spacer /> -</p>
                          </v-list-item>
                          <v-list-item class="pb-3">
                            <h4>Enchère</h4>
                            <p class="d-flex text-grey">
                              Prix de départ <v-spacer /> {{ offer.starting_price }}
                            </p>
                            <p class="d-flex text-grey">
                              Achat immédiat <v-spacer /> {{ offer.buyout_price ?? '-' }}
                            </p>

                            <p class="d-flex text-grey">
                              Dernière offre <v-spacer />
                              {{ offer.bids.length > 0 ? getOfferLastPrice(offer) : '-' }}
                            </p>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </v-chip>
                  </div>
                </div>
              </v-card-item>
              <v-card-actions class="d-flex justify-space-between">
                <span
                  v-if="offer.status === 'closed'"
                  class="px-2 rounded-xl d-flex align-baseline mt-1 ml-1"
                  style="background: #843434; font-size: 1em"
                >
                  Terminée&nbsp;
                  <v-icon class="timer-icon mdi mdi-receipt-text-check-outline" size="15"></v-icon>
                </span>
                <span
                  v-else-if="offer.status === 'pending'"
                  class="px-2 rounded-xl d-flex align-baseline mt-1 ml-1 cursor-help"
                  style="background: #343434; font-size: 1em"
                  title="Les enchères commenceront à la fin du compte à rebours"
                >
                  {{ prettyTimeLeft(offer.opening_at) }}&nbsp;
                  <v-icon class="timer-icon mdi mdi-lock-outline" size="15"></v-icon>
                </span>
                <span
                  v-else-if="timeLeft(offer.closing_at) > 0"
                  class="px-2 rounded-xl d-flex align-baseline mt-1 ml-1"
                  style="background: #343434; font-size: 1em"
                >
                  {{ prettyTimeLeft(offer.closing_at) }}&nbsp;
                  <v-icon
                    class="timer-icon"
                    :class="
                      timeLeft(offer.closing_at) % 2 === 0
                        ? 'mdi mdi-timer-sand'
                        : 'mdi mdi-timer-sand-complete'
                    "
                    size="15"
                  ></v-icon>
                </span>
                <span
                  v-else
                  class="px-2 rounded-xl d-flex align-baseline mt-1 ml-1 cursor-help"
                  style="background: #343434; font-size: 1em"
                  title="Offre close, distribution en cours (15 minutes maximum)"
                >
                  En cours&nbsp;
                  <v-icon class="timer-icon mdi mdi-lock-outline" size="15"></v-icon>
                </span>
                <v-btn
                  class="w-50 text-white"
                  rounded="xl"
                  color="primary"
                  variant="flat"
                  @click="selectedOffer = offer"
                  @click.stop="seeOffer = true"
                >
                  {{
                    timeLeft(offer.closing_at) >= 0 && offer.status === 'open' ? 'Enchérir' : 'Voir'
                  }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </div>
        </div>
        <div
          v-else
          class="d-flex flex-column flex-md-row flex-md-wrap pt-8"
          style="min-height: 575px; place-items: start; justify-content: start"
        >
          <v-progress-circular indeterminate></v-progress-circular>
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
    v-model="seeOffer"
    class="modals"
    max-width="800"
    scrollable
    scroll-strategy="reposition"
  >
    <v-card v-if="selectedOffer" class="modal-card" color="primary" variant="flat">
      <v-card-title>
        <span style="text-wrap: wrap">{{ selectedOffer.skin.displayName }}</span>
        <span
          v-if="selectedOffer.status !== 'closed'"
          class="position-absolute right-0 top-0 mt-2 mr-2 px-2 rounded-xl"
          style="background: #343434; font-size: 0.7em"
          >{{
            prettyTimeLeft(
              selectedOffer.status === 'pending'
                ? selectedOffer.opening_at
                : selectedOffer.closing_at,
            )
          }}</span
        >
        <div class="d-flex align-center cursor-pointer" @click="goToUser(selectedOffer.seller.id)">
          <v-img
            :src="selectedOffer.seller.avatarUrl"
            :alt="selectedOffer.seller.username"
            min-width="18"
            max-width="18"
            max-height="18"
            class="mt-1 mr-1 rounded-circle"
          />
          <p style="font-size: 0.8em; color: #ffffffaa">{{ selectedOffer.seller.username }}</p>
        </div>
      </v-card-title>
      <v-card-text class="px-2" style="scrollbar-width: auto">
        <v-card
          class="d-flex justify-center pt-4 pb-16 px-4"
          color="#18181855"
          variant="flat"
          rounded="xl"
        >
          <v-img
            :src="getImageUrl(selectedOffer.skin, skinsData[selectedOffer.skin.uuid])"
            max-width="512"
            height="250"
          ></v-img>
          <div class="d-flex position-absolute top-1 right-0 mr-4" style="gap: 1em">
            <div v-for="(chroma, index) in skinsData[selectedOffer.skin.uuid].chromas">
              <v-img
                v-if="chroma.swatch"
                :src="chroma.swatch"
                class="rounded-lg"
                width="30px"
                height="30px"
                :style="`${index + 1 === selectedOffer.skin.currentChroma ? 'border: 2px solid #' + selectedOffer.skin.tierColor : ''}`"
              />
              <span v-if="!chroma.swatch" class="font-weight-bold text-white"
                >{{ getChromaName(selectedOffer.skin, skinsData[selectedOffer.skin.uuid]) }}
              </span>
            </div>
          </div>
          <v-card
            variant="flat"
            color="#343434"
            class="position-absolute bottom-0 mb-2"
            style="width: 96%"
            rounded="xl"
          >
            <v-card-text class="px-4 pt-5 pb-4">
              <v-row>
                <v-col class="py-0">
                  <p style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
                    Rareté :
                    <strong :style="`color: #${selectedOffer.skin.tierColor}`"
                      >{{ parseInt(selectedOffer.skin.tierRank) }}&nbsp;({{
                        selectedOffer.skin.tierText.split(':')[1]
                      }})</strong
                    >
                  </p>
                </v-col>
                <v-col class="py-0">
                  <p style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
                    Niveau : <strong>{{ selectedOffer.skin.currentLvl ?? '-' }}</strong
                    >/{{ skinsData[selectedOffer.skin.uuid].levels?.length }}
                  </p>
                </v-col>
                <v-col class="py-0">
                  <p style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
                    Chroma : <strong>{{ selectedOffer.skin.currentChroma ?? '-' }}</strong
                    >/{{ skinsData[selectedOffer.skin.uuid].chromas?.length }}
                  </p>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-card>
        <v-card variant="flat" color="#343434" class="mt-2" rounded="lg">
          <v-card-text class="px-4">
            <v-row>
              <v-col>
                <p>
                  Prix de départ : <strong>{{ selectedOffer.starting_price }}&nbsp;Coins</strong>
                </p>
                <p>
                  Achat immédiat :
                  <strong>{{ selectedOffer.buyout_price ?? 'N/A' }}&nbsp;Coins</strong>
                </p>
              </v-col>
              <v-col>
                <p>
                  Offres : <strong>{{ selectedOffer.bids.length }}</strong>
                </p>
                <p>
                  Dernière offre :
                  <strong
                    >{{
                      selectedOffer.bids.length > 0 ? getOfferLastPrice(selectedOffer) : '-'
                    }}&nbsp;Coins</strong
                  >
                </p>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <v-card variant="text" class="pt-2">
          <v-card-title class="px-2"> Offres </v-card-title>
          <v-card-text class="px-0">
            <v-list
              v-if="selectedOffer.bids.length > 0"
              class="py-0 ma-0"
              bg-color="#343434"
              rounded="lg"
            >
              <v-list-item v-for="bid in selectedOffer.bids" class="pa-0" style="min-height: 0">
                <v-divider></v-divider>
                <v-list-item-title class="d-flex align-center ga-2 mr-4 mt-0">
                  <p class="ml-4 mr-2" style="font-size: 0.7em">{{ bid.offered_at }}</p>
                  <v-divider vertical></v-divider>
                  <v-img :src="bid.bidder.avatarUrl" max-width="20" rounded="circle" class="ml-1" />
                  <p class="pb-1">{{ bid.bidder.username }}</p>
                  <v-spacer></v-spacer>
                  {{ bid.offer_amount }} Coins
                </v-list-item-title>
                <v-divider></v-divider>
              </v-list-item>
            </v-list>
            <v-list v-else rounded="lg" bg-color="#343434">
              <v-list-item>
                <v-list-item-title class="text-center">
                  Aucune offre pour le moment.
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-card-text>
      <v-card-actions v-if="selectedOffer.status === 'open'">
        <v-btn
          class="text-white px-3 text-none"
          rounded="lg"
          color="primary"
          variant="flat"
          @click="placeBidModal = true"
        >
          Enchérir
        </v-btn>
        <!--          <v-btn
          class="text-white px-3 text-none"
          rounded="lg"
          color="primary"
          variant="flat"
          :disabled="selectedOffer.buyout_price === null"
          @click="buyoutModal = true"
        >
          Acheter pour {{ selectedOffer.buyout_price ?? '-' }}
        </v-btn>-->
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="buyoutModal" class="modals" max-width="400" persistent>
    <v-card class="modal-card" color="primary" variant="flat">
      <v-card-title>Confirmer l'achat</v-card-title>
      <v-card-text>
        Êtes-vous sûr de vouloir acheter ce skin pour {{ selectedOffer.buyout_price }} Coins ?
      </v-card-text>
      <v-card-actions>
        <v-btn text="Annuler" rounded="lg" @click="buyoutModal = false">Annuler</v-btn>
        <v-btn text="Confirmer" variant="flat" rounded="lg" color="primary" @click="confirmPurchase"
          >Confirmer</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="placeBidModal" class="modals" max-width="400" persistent>
    <v-card class="modal-card" color="primary" variant="flat">
      <v-card-title>Placer une offre</v-card-title>
      <v-card-text>
        <v-number-input
          v-model="bidAmount"
          color="primary"
          variant="outlined"
          rounded="xl"
          control-variant="hidden"
          :min="getOfferLastPrice(selectedOffer) + 10"
          :hint="'Minimum : ' + (getOfferLastPrice(selectedOffer) + 10) + ' Coins'"
        >
          <template #append-inner>
            <p>Coins</p>
          </template>
        </v-number-input>
        <p>Dernière offre pour ce skin : {{ getOfferLastPrice(selectedOffer) }} Coins</p>
        <p v-if="bidAmount">Placer une offre de {{ bidAmount }} Coins ?</p>
      </v-card-text>
      <v-card-actions>
        <v-btn text="Annuler" rounded="lg" @click="placeBidModal = false">Annuler</v-btn>
        <v-btn
          text="Confirmer"
          variant="flat"
          rounded="lg"
          color="primary"
          :disabled="!bidAmount"
          @click="confirmBid"
          >Confirmer</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog
    v-model="createOfferDialog"
    class="modals"
    max-width="800"
    scrollable
    scroll-strategy="reposition"
  >
    <v-card class="modal-card" color="primary" variant="flat">
      <v-card-title class="px-6"><h2>Inventaire</h2></v-card-title>
      <v-card-item v-if="!loadingInventory">
        <div v-if="userInventory?.length === 0">
          <p>Aucun skin dans l'inventaire.</p>
          <a href="/cases" class="text-white"
            ><span class="text-decoration-underline">Ouvrir une caisse</span
            ><span class="text-decoration-none">&nbsp;🗝️</span></a
          >
        </div>
        <v-expansion-panels
          v-if="userInventory?.length > 0"
          color="dark"
          bg-color="#282828"
          rounded="xl"
          variant="default"
          elevation="0"
        >
          <v-expansion-panel v-for="skin in userInventory" :key="'inv-' + skin.uuid">
            <v-expansion-panel-title
              class="d-flex ga-3"
              @click="createOffer.price = skin.currentPrice * 0.75"
            >
              <v-img
                :src="getImageUrl(skin, skinsData[skin.uuid])"
                height="30"
                min-width="50"
                max-width="50"
              ></v-img>
              <p
                style="
                  font-weight: bold;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                "
              >
                {{ skin.displayName }}
              </p>
              <v-spacer></v-spacer>
              <p>{{ skin.currentPrice }}&nbsp;Flopos</p>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <h3 class="mt-3">Infos</h3>
              <v-divider class="mt-1 mb-5"></v-divider>
              <v-row>
                <v-col cols="3"> Base&nbsp;: </v-col>
                <v-col cols="5">
                  <strong>{{ skin.basePrice }} Flopos</strong>
                </v-col>
                <v-col> Niveau&nbsp;: </v-col>
                <v-col>
                  <strong>{{ skin.currentLvl }}/{{ skinsData[skin.uuid]?.levels.length }}</strong>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="3"> Actuel&nbsp;: </v-col>
                <v-col cols="5">
                  <strong>{{ skin.currentPrice }} Flopos</strong>
                </v-col>
                <v-col> Chroma&nbsp;: </v-col>
                <v-col>
                  <strong
                    >{{ skin.currentChroma }}/{{ skinsData[skin.uuid]?.chromas.length }}</strong
                  >
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="3"> Max&nbsp;: </v-col>
                <v-col cols="9">
                  <strong>{{ skin.maxPrice }} Flopos</strong>
                </v-col>
              </v-row>

              <h3 class="mt-6">Enchères</h3>
              <v-divider class="mt-1 mb-5"></v-divider>
              <div class="w-100 d-flex flex-wrap">
                <v-number-input
                  v-model="createOffer.price"
                  :key="'COP-' + skin.uuid"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  :min="skin.currentPrice * 0.75"
                  :placeholder="'Min : ' + (skin.currentPrice * 0.75).toFixed() + ' (75%)'"
                  label="Prix de départ"
                ></v-number-input>
              </div>
              <div class="w-100 d-sm-flex ga-3">
                <v-select
                  v-model="createOffer.delay"
                  :key="'CODL-' + skin.uuid"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  label="Délai avant ouverture"
                  :items="delaySelect"
                  style="flex-grow: 1; flex-shrink: 1; flex-basis: 50%"
                ></v-select>
                <v-select
                  v-model="createOffer.duration"
                  :key="'CODU-' + skin.uuid"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  label="Durée"
                  :items="durationSelect"
                  style="flex-grow: 1; flex-shrink: 1; flex-basis: 50%"
                ></v-select>
              </div>
              <v-btn
                color="primary"
                rounded="lg"
                text="Créer"
                :disabled="
                  createOffer.price === null ||
                  createOffer.delay === null ||
                  createOffer.duration === null
                "
                @click="handleCreateOffer(skin.uuid)"
              ></v-btn>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-item>
      <v-card-item v-else class="d-flex justify-center">
        <v-progress-circular indeterminate></v-progress-circular>
      </v-card-item>
    </v-card>
  </v-dialog>

  <toast v-if="toastStore.show" :key="toastStore.toastKey" />
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
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 15px;
  background: radial-gradient(circle at -100% -200%, #5865f2, #181818 100%) !important;
  z-index: -1;
}

@media (max-width: 800px) {
}
</style>
