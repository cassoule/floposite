<script>
/* global localStorage, setTimeout */
import flapi from '@/services/flapi.js'
import { frenchColorToHex } from '@/utils/colorToHex.js'
import HomeBtn from '@/components/HomeBtn.vue'
import CsInventoryGrid from '@/components/akhy-stats/CsInventoryGrid.vue'
import CsLoadoutShowcase from '@/components/akhy-stats/CsLoadoutShowcase.vue'
import { useFlopoToasts } from '@/composables/useFlopoToasts.js'
import { getRarityColor } from '@/utils/csRarity.js'
import { rankIcon, rankDiv, rankText, rankColor } from '@/utils/rank.js'
import FlopoRankBar from '@/components/akhy-stats/FlopoRankBar.vue'

export default {
  name: 'AkhyStats',

  components: { HomeBtn, CsInventoryGrid, FlopoRankBar, CsLoadoutShowcase },

  setup() {
    return { ...useFlopoToasts() }
  },

  data() {
    return {
      users: null,
      user: null,
      sparkline: null,
      elo: null,
      eloGraph: null,
      user_inventory: null,
      cs_inventory: null,
      cs_loadout: [],
      featured_skins: [],
      skinsVideoUrls: {},
      skinsData: {},
      active_slowmodes: null,
      user_isTimedOut: false,
      games: null,
      loading: true,
      loadingInventory: true,

      skinVideoDialog: false,
      skinHistoryDialog: false,
      skinDetailsDialog: false,
      selectedSkin: null,

      instantSellProcessing: false,
      csSkinDetailsDialog: false,
      selectedCsSkin: null,
      csSellProcessing: false,

      flopoRankDialog: false,

      isSpinning: false,
      isDestructing: false,
      isUpgrading: false,
      resultLabel: null,
      wheelRotation: 0,
      upgradeCost: null,

      // Constants
      radius: 40,
      fetchingSkinStats: false,
      displayPrice: 0,
    }
  },

  computed: {
    inventoryValue() {
      if (!this.user_inventory) return null
      let sum = 0
      this.user_inventory.forEach((s) => {
        sum += s.currentPrice
      })
      return sum
    },
    csInventoryValue() {
      if (!this.cs_inventory) return 0
      return this.cs_inventory.reduce((sum, s) => sum + (s.price || 0), 0)
    },
    isOwnProfile() {
      const discordId = localStorage.getItem('discordId')
      return discordId && this.user && discordId === this.user.id
    },
    devId() {
      return import.meta.env.VITE_DEV_ID
    },
    circumference() {
      return 2 * Math.PI * this.radius
    },

    // Pre-calculate SVG path data for the segments
    computedSegments() {
      let accumulatedPercent = 0

      return this.segments.map((seg) => {
        // Length of this segment in pixels
        const segLength = seg.percent * this.circumference

        // Offset = Where this segment starts (negative value for clockwise stacking)
        const offset = -(accumulatedPercent * this.circumference)

        accumulatedPercent += seg.percent

        return {
          ...seg,
          // "Draw this length, then a gap equal to full circumference"
          dashArray: `${segLength} ${this.circumference}`,
          dashOffset: offset,
        }
      })
    },

    wheelStyle() {
      return {
        transform: `rotate(${this.wheelRotation}deg)`,
        // High suspense easing
        transition: this.isSpinning ? 'transform 6s cubic-bezier(0.15, 0.80, 0.15, 1)' : 'none',
      }
    },

    canBeUpgraded() {
      return (
        this.selectedSkin &&
        (this.selectedSkin.currentLvl < this.skinsData[this.selectedSkin.uuid]?.levels.length ||
          this.selectedSkin.currentChroma < this.skinsData[this.selectedSkin.uuid]?.chromas.length)
      )
    },

    formattedDisplayPrice() {
      return this.displayPrice.toFixed(0)
    },
  },

  async mounted() {
    this.users = await this.getUsers()
    this.user = this.users.find((u) => u.id === this.$route.params.id)
    if (this.user) {
      const id = this.$route.params.id
      //this.sparkline = await this.getSparkline(id)
      this.elo = await this.getElo(id)
      //this.eloGraph = await this.getEloGraph(id)
      await this.getActiveSlowmodes()
      await this.isTimedOut()
      await this.getGames()
    }
    this.loading = false
    this.$nextTick(() => {
      this.scrollToPlayerRank()
    })
    if (this.user) {
      this.loadingInventory = true
      await this.getInventory()
      //await this.fetchSkinsVideoUrls()
    }
  },

  methods: {
    scrollToPlayerRank() {
      this.$refs.flopoRankBar?.scrollToPlayerRank()
    },
    async getUsers() {
      try {
        const response = await flapi.get('/users')
        return response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getAvatar(id) {
      try {
        const response = await flapi.get('/user/' + id + '/avatar')
        return response.data.avatarUrl
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getSparkline() {
      try {
        const response = await flapi.get('/user/' + this.$route.params.id + '/sparkline')
        return response.data.sparkline
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getElo() {
      try {
        const response = await flapi.get('/user/' + this.$route.params.id + '/elo')
        return response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getEloGraph() {
      try {
        const response = await flapi.get('/user/' + this.$route.params.id + '/elo-graph')
        return response.data.eloGraph
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getInventory() {
      try {
        const [inventoryRes, featuredRes, loadoutRes] = await Promise.all([
          flapi.get('/user/' + this.$route.params.id + '/inventory'),
          flapi.get('/user/' + this.$route.params.id + '/featured-skins'),
          flapi.get('/user/' + this.$route.params.id + '/loadout'),
        ])
        this.user_inventory = inventoryRes.data.inventory
        this.cs_inventory = inventoryRes.data.csInventory || []
        this.featured_skins = featuredRes.data.featuredSkins || []
        this.cs_loadout = loadoutRes.data.loadout || []
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async fetchSkinsVideoUrls() {
      try {
        if (!this.user_inventory?.length) {
          this.loadingInventory = false
          return
        }

        const tasks = this.user_inventory.map((s) =>
          Promise.all([this.getSkinVideoUrl(s), this.getSkinData(s)]),
        )

        await Promise.all(tasks)
      } catch (e) {
        console.error('inventory hydration error:', e)
      } finally {
        this.loadingInventory = false
      }
    },

    async getSkinVideoUrl(skin) {
      try {
        const response = await flapi.post('/skin/' + skin.uuid, {
          level: skin.currentLvl,
          chroma: skin.currentChroma,
        })
        this.skinsVideoUrls[skin.uuid] = response.data.url
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getSkinData(skin) {
      try {
        const response = await flapi.get('/skin/' + skin.uuid)
        this.skinsData[skin.uuid] = response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getActiveSlowmodes() {
      try {
        const response = await flapi.get('/slowmodes')
        this.active_slowmodes = response.data.slowmodes
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getGames() {
      try {
        const response = await flapi.get('/user/' + this.$route.params.id + '/games-history')
        this.games = response.data.games
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async isTimedOut() {
      try {
        const response = await flapi.post('/timedout')
        this.user_isTimedOut = response.data.isTimedOut
      } catch (e) {
        console.log(e)
      }
    },

    cardClass(game) {
      if (game.p1 === this.$route.params.id) {
        if (game.p1Score > game.p2Score) {
          return 'win-card'
        } else if (game.p2Score > game.p1Score) {
          return 'lose-card'
        } else {
          return 'draw-card'
        }
      } else if (game.p2 === this.$route.params.id) {
        if (game.p1Score > game.p2Score) {
          return 'lose-card'
        } else if (game.p2Score > game.p1Score) {
          return 'win-card'
        } else {
          return 'draw-card'
        }
      } else {
        return 'draw-card'
      }
    },

    rankIcon,
    rankDiv,
    rankText,
    rankColor,
    getChromaText(skin, skinInfo) {
      let result = ''
      for (let i = 1; i <= skinInfo.chromas.length; i++) {
        result += skin.currentChroma === i ? '💠 ' : '◽ '
      }
      return result || 'N/A'
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
    getSkinChromasColors(skinInfo) {
      const colors = []
      for (const chroma of skinInfo.chromas) {
        const name = chroma?.displayName
          .replace(/[\r\n]+/g, ' ')
          .replace(/\u00A0/g, ' ') // normalize NBSPs
          .replace(skinInfo.displayName, '')
          .trim()
        const match = name.match(/vari(?:ant|ante)\s*\d+\s*[-–—:]?\s*([^)]+?)(?:\)|$)/i)
        if (match) {
          colors.push(frenchColorToHex(match[1].trim()))
        } else {
          colors.push('#FFFFFF')
        }
      }
      return colors
    },
    getImageUrl(skin, skinInfo) {
      if (skin.currentLvl === skinInfo.levels.length) {
        const chroma = skinInfo.chromas[skin.currentChroma - 1]
        return chroma?.fullRender || chroma?.displayIcon || skinInfo.displayIcon
      }
      const level = skinInfo.levels[skin.currentLvl - 1]
      return level?.displayIcon || skinInfo.displayIcon || skinInfo.chromas[0].fullRender
    },
    async goToUser(id) {
      this.loading = true
      await this.$router.push('/akhy/' + id)
      window.location.reload()
    },
    async handleInstantSell() {
      this.instantSellProcessing = true
      const discordId = localStorage.getItem('discordId')
      if (!discordId || !this.user || discordId !== this.user.id) {
        return
      }
      try {
        await flapi.post('/skin/' + this.selectedSkin.uuid + '/instant-sell')
        await this.getInventory()
        this.users = await this.getUsers()
        this.user = this.users.find((u) => u.id === this.$route.params.id)
        setTimeout(() => {
          this.skinDetailsDialog = false
          this.instantSellProcessing = false
        }, 500)
      } catch (e) {
        console.log(e)
        this.showErrorToast(e.response?.data?.error || 'Erreur lors de la vente.')
        setTimeout(() => {
          this.instantSellProcessing = false
        }, 500)
      }
    },
    getRarityColor,
    openCsSkinDetails(skin) {
      this.selectedCsSkin = skin
      this.csSkinDetailsDialog = true
    },
    async handleCsInstantSell() {
      const discordId = localStorage.getItem('discordId')
      if (!discordId || !this.user || discordId !== this.user.id) return
      this.csSellProcessing = true
      try {
        await flapi.post('/cs-skin/' + this.selectedCsSkin.id + '/instant-sell')
        await this.getInventory()
        this.users = await this.getUsers()
        this.user = this.users.find((u) => u.id === this.$route.params.id)
        setTimeout(() => {
          this.csSkinDetailsDialog = false
          this.csSellProcessing = false
        }, 500)
      } catch (e) {
        console.log(e)
        this.showErrorToast(e.response?.data?.error || 'Erreur lors de la vente.')
        setTimeout(() => {
          this.csSellProcessing = false
        }, 500)
      }
    },
    async handleSkinDetailsOpen(skin) {
      const discordId = localStorage.getItem('discordId')
      if (!discordId || !this.user || discordId !== this.user.id) {
        return
      }
      this.selectedSkin = skin
      this.displayPrice = skin.currentPrice
      this.skinDetailsDialog = true
      this.fetchingSkinStats = true
      try {
        const response = await flapi.get('/skin-upgrade/' + skin.uuid + '/fetch')
        this.segments = response.data.segments
        this.upgradeCost = response.data.upgradePrice
        console.log(response.data)
      } catch (e) {
        console.error('flAPI error:', e)
        this.skinDetailsDialog = false
      }
      this.fetchingSkinStats = false
    },
    async startUpgrade() {
      if (this.isSpinning) return

      this.isSpinning = true
      this.resultLabel = null

      try {
        const response = await flapi.post('/skin-upgrade/' + this.selectedSkin.uuid)
        this.users = await this.getUsers()
        this.user = this.users.find((u) => u.id === this.$route.params.id)
        const winningSegmentId = response.data.wonId
        const winIndex = this.segments.findIndex((s) => s.id === winningSegmentId)
        if (winIndex === -1) throw new Error('Invalid segment ID from backend')
        let startDeg = 0
        for (let i = 0; i < winIndex; i++) {
          startDeg += this.segments[i].percent * 360
        }
        const endDeg = startDeg + this.segments[winIndex].percent * 360
        const padding = 5
        const randomAngleInSegment =
          Math.random() * (endDeg - startDeg - padding * 2) + startDeg + padding
        const fullSpins = 5 // Spin 5 times for effect
        const spinDeg = fullSpins * 360
        const currentBase = Math.floor(this.wheelRotation / 360) * 360
        const finalRotation = currentBase - spinDeg - randomAngleInSegment
        this.wheelRotation = finalRotation

        setTimeout(async () => {
          this.resultLabel = this.segments[winIndex].label

          if (winningSegmentId === 'DESTRUCTED') {
            this.isDestructing = true

            setTimeout(async () => {
              this.isSpinning = false
              this.skinDetailsDialog = false // Close Modal
              this.isDestructing = false
              await this.getInventory() // Update background list
            }, 1000)
          } else if (winningSegmentId === 'SUCCEEDED') {
            this.isUpgrading = true
            const oldPrice = this.selectedSkin.currentPrice
            await this.getInventory()
            const updatedSkin = this.user_inventory.find((s) => s.uuid === this.selectedSkin.uuid)
            if (updatedSkin) {
              this.selectedSkin = updatedSkin
              this.tweenPrice(oldPrice, updatedSkin.currentPrice, 2000)
              await this.getSkinVideoUrl(this.selectedSkin)
              await this.handleSkinDetailsOpen(this.selectedSkin)
              this.isSpinning = false
            }
            setTimeout(() => {
              this.isUpgrading = false
            }, 1500)
          }
          this.isSpinning = false
        }, 6000) // Must match transition duration
      } catch (e) {
        console.error('Wheel error', e)
        this.showErrorToast(e.response?.data?.error || "Erreur lors de l'amélioration.")
        this.isSpinning = false
      }
    },
    tweenPrice(startValue, endValue, duration = 1500) {
      let startTime = null

      const step = (timestamp) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)
        const ease = 1 - Math.pow(1 - progress, 4)
        const current = startValue + (endValue - startValue) * ease

        this.displayPrice = current

        if (progress < 1) {
          window.requestAnimationFrame(step)
        } else {
          this.displayPrice = endValue
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
  <v-layout class="w-100">
    <v-main class="d-flex pt-16" style="place-items: start; place-content: start; gap: 2em">
      <div v-if="user && !loading" class="w-100">
        <v-list
          width="100%"
          class="mt-10 py-0 graphs-list"
          rounded="xl"
          bg-color="#181818"
          base-color="white"
          variant="tonal"
          style="border: 2px solid #ffffff55"
        >
          <v-list-item class="w-100 pt-8">
            <div class="d-flex w-100" style="gap: 2em; flex-wrap: wrap; place-content: center">
              <v-img
                :src="user.avatarUrl"
                min-width="128"
                max-width="128"
                height="128"
                rounded="circle"
              ></v-img>
              <div>
                <h1 class="font-weight-bold">
                  @{{ user.username }}&nbsp;
                  <i
                    v-if="user?.isAkhy"
                    class="mdi mdi-check-decagram-outline"
                    title="Akhy certifié"
                  ></i>
                  <i v-if="user?.id === devId" class="mdi mdi-crown-outline" title="FlopoDev"></i>
                </h1>
                <h3 class="d-flex mt-2" style="place-items: baseline">
                  {{ user?.coins.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') }}
                  <span class="ml-1" style="color: rgba(255, 255, 255, 0.3)">Flopos</span>
                </h3>
                <h3 v-if="!loadingInventory">
                  {{ user_inventory?.length }} skins
                  <span style="color: rgba(255, 255, 255, 0.3)"
                    >{{
                      inventoryValue?.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
                    }}
                    Flopos</span
                  >
                </h3>
                <h3>
                  {{ user?.warns }} warns
                  <span style="color: rgba(255, 255, 255, 0.3)"
                    >{{ user?.allTimeWarns }} all time</span
                  >
                </h3>
              </div>
              <v-spacer></v-spacer>
              <div class="d-flex rank-ctn" style="place-content: space-between">
                <div style="margin-right: 4em">
                  <h1>FlopoRank</h1>
                  <template v-if="elo?.isPlacement">
                    <h2 class="mt-2" style="color: #ddddddaa">
                      Placement {{ elo?.gamesPlayed }}/5
                    </h2>
                    <h3 v-if="elo?.elo">{{ elo.elo }}</h3>
                    <h3 v-else>-</h3>
                  </template>
                  <template v-else>
                    <h2 class="mt-2" :style="`color: ${rankColor(user?.elo)}`">
                      {{ rankText(user?.elo) }}
                    </h2>
                    <h3 v-if="elo?.elo">
                      {{ elo.elo }}
                      <span style="color: rgba(255, 255, 255, 0.3)">
                        {{ Math.max(...(eloGraph ?? [])) }} PB
                      </span>
                    </h3>
                    <h3 v-else>-</h3>
                  </template>
                </div>
                <v-img
                  v-if="!elo?.isPlacement"
                  class="mt-3"
                  :src="rankIcon(user?.elo)"
                  max-width="96"
                  height="96"
                >
                  <div
                    :style="`position: absolute; display: flex; width: 100%; height: 100%; place-items: center; place-content: center; font-size: 2.5em; color: #222`"
                  >
                    <p style="font-weight: 500">{{ rankDiv(user?.elo) }}</p>
                  </div>
                </v-img>
              </div>
            </div>
          </v-list-item>

          <flopo-rank-bar
            ref="flopoRankBar"
            :users="users"
            :user="user"
            :elo="elo"
            @user-clicked="goToUser"
          />
        </v-list>

        <v-list
          v-if="games"
          width="100%"
          class="mt-10 py-0 position-relative"
          rounded="xl"
          bg-color="#181818"
          base-color="white"
          variant="tonal"
          style="border: 2px solid #ffffff55; max-height: 500px"
        >
          <v-list-item
            class="pt-4 position-sticky top-0 w-100"
            rounded="0"
            style="backdrop-filter: blur(5px); z-index: 100"
          >
            <h2 style="width: fit-content; white-space: nowrap">
              Historique des parties
              <span class="ml-4" style="font-size: 0.8em">
                {{ games?.length === 50 ? `${games?.length} dernières` : games?.length }} parties
              </span>
            </h2>
          </v-list-item>
          <v-list-item v-for="game in games" :key="game.id || game.date" class="pb-3 px-2">
            <v-card :class="cardClass(game)" variant="tonal" color="secondary" rounded="xl">
              <v-card-text v-if="game.type !== 'SOTD'" class="pb-0">
                <div class="d-flex justify-space-between" style="place-items: center">
                  <div
                    class="d-flex flex-column"
                    style="place-items: start; justify-content: start; width: 33%; gap: 1em"
                  >
                    <div class="d-flex" style="place-items: center; justify-content: start">
                      <v-img
                        class="mr-2"
                        :src="
                          game.p1 === $route.params.id
                            ? users.find((u) => u.id === game.p1)?.avatarUrl
                            : users.find((u) => u.id === game.p2)?.avatarUrl
                        "
                        :width="30"
                        :height="30"
                        rounded="circle"
                      ></v-img>
                      <h3
                        class="username"
                        :title="
                          game.p1 === $route.params.id
                            ? users.find((u) => u.id === game.p1)?.username
                            : users.find((u) => u.id === game.p2)?.username
                        "
                      >
                        {{
                          game.p1 === $route.params.id
                            ? users.find((u) => u.id === game.p1)?.username
                            : users.find((u) => u.id === game.p2)?.username
                        }}
                      </h3>
                    </div>
                    <h4 class="d-flex" style="gap: 0.5em">
                      <v-img
                        class=""
                        :src="
                          game.p1 === $route.params.id ? rankIcon(game.p1Elo) : rankIcon(game.p2Elo)
                        "
                        min-width="20"
                        max-width="20"
                        height="20"
                      >
                        <div
                          :style="`position: absolute; display: flex; width: 100%; height: 100%; place-items: center; place-content: center; font-size: .8em; color: #222`"
                        >
                          <p style="font-weight: 300">
                            {{
                              game.p1 === $route.params.id
                                ? rankDiv(game.p1Elo)
                                : rankDiv(game.p2Elo)
                            }}
                          </p>
                        </div>
                      </v-img>
                      {{ game.p1 === $route.params.id ? game.p1Elo : game.p2Elo }}
                    </h4>
                    <h4>
                      {{
                        (() => {
                          const diff =
                            game.p1 === $route.params.id
                              ? game.p1NewElo - game.p1Elo
                              : game.p2NewElo - game.p2Elo

                          return diff > 0 ? `+${diff}` : diff
                        })()
                      }}
                      Elo
                    </h4>
                  </div>
                  <div
                    class="d-flex"
                    style="gap: 0.5rem; place-items: center; place-content: center; width: 33%"
                  >
                    <h2
                      class="bg-dark px-2 py-1 rounded"
                      style="min-width: 30px; text-align: center"
                    >
                      {{
                        game.p1 === $route.params.id
                          ? game.p1Score
                              .toFixed(0)
                              .padStart(
                                Math.max(
                                  String(game.p1Score.toFixed(0)).length,
                                  game.p2Score.toFixed(0).length,
                                ),
                                '0',
                              )
                          : game.p2Score
                              .toFixed(0)
                              .padStart(
                                Math.max(
                                  String(game.p1Score.toFixed(0)).length,
                                  game.p2Score.toFixed(0).length,
                                ),
                                '0',
                              )
                      }}
                    </h2>
                    <h2>-</h2>
                    <h2
                      class="bg-dark px-2 py-1 rounded"
                      style="min-width: 30px; text-align: center"
                    >
                      {{
                        game.p1 === $route.params.id
                          ? game.p2Score
                              .toFixed(0)
                              .padStart(
                                Math.max(
                                  String(game.p1Score.toFixed(0)).length,
                                  game.p2Score.toFixed(0).length,
                                ),
                                '0',
                              )
                          : game.p1Score
                              .toFixed(0)
                              .padStart(
                                Math.max(
                                  String(game.p1Score.toFixed(0)).length,
                                  game.p2Score.toFixed(0).length,
                                ),
                                '0',
                              )
                      }}
                    </h2>
                  </div>
                  <div
                    class="d-flex flex-column"
                    style="place-items: end; justify-content: start; width: 33%; gap: 1em"
                  >
                    <div
                      class="d-flex cursor-pointer"
                      style="place-items: center; place-content: start"
                      @click="
                        game.p1 === $route.params.id
                          ? goToUser(users.find((u) => u.id === game.p2)?.id)
                          : goToUser(users.find((u) => u.id === game.p1)?.id)
                      "
                    >
                      <h3
                        class="username"
                        :title="
                          game.p1 === $route.params.id
                            ? users.find((u) => u.id === game.p2)?.username
                            : users.find((u) => u.id === game.p1)?.username
                        "
                      >
                        {{
                          game.p1 === $route.params.id
                            ? users.find((u) => u.id === game.p2)?.username
                            : users.find((u) => u.id === game.p1)?.username
                        }}
                      </h3>
                      <v-img
                        class="ml-2"
                        :src="
                          game.p1 === $route.params.id
                            ? users.find((u) => u.id === game.p2)?.avatarUrl
                            : users.find((u) => u.id === game.p1)?.avatarUrl
                        "
                        :width="30"
                        :height="30"
                        rounded="circle"
                      ></v-img>
                    </div>
                    <h4 class="d-flex" style="gap: 0.5em">
                      {{ game.p1 === $route.params.id ? game.p2Elo : game.p1Elo }}
                      <v-img
                        class=""
                        :src="
                          game.p1 === $route.params.id ? rankIcon(game.p2Elo) : rankIcon(game.p1Elo)
                        "
                        min-width="20"
                        max-width="20"
                        height="20"
                      >
                        <div
                          :style="`position: absolute; display: flex; width: 100%; height: 100%; place-items: center; place-content: center; font-size: .8em; color: #222`"
                        >
                          <p style="font-weight: 300">
                            {{
                              game.p1 === $route.params.id
                                ? rankDiv(game.p2Elo)
                                : rankDiv(game.p1Elo)
                            }}
                          </p>
                        </div>
                      </v-img>
                    </h4>
                    <h4>&nbsp;</h4>
                  </div>
                </div>
              </v-card-text>
              <v-card-subtitle class="text-right pb-2"
                >{{ game.type }} -
                {{ new Date(game.timestamp - 60000).toLocaleDateString() }}</v-card-subtitle
              >
            </v-card>
          </v-list-item>
          <v-list-item v-if="games.length === 0">
            <p class="text-center pt-12 pb-16">Aucune partie classée</p>
          </v-list-item>
        </v-list>

        <v-list
          width="100%"
          class="mt-10 py-0 px-0 graphs-list"
          rounded="xl"
          bg-color="#181818"
          base-color="white"
          variant="tonal"
          style="border: 2px solid #ffffff55"
        >
          <v-list-item class="w-100 px-0">
            <!-- CS2 Loadout Showcase -->
            <cs-loadout-showcase
              :loadout="cs_loadout"
              :featured-skins="featured_skins"
              :is-own-profile="isOwnProfile"
            />
          </v-list-item>
        </v-list>

        <!-- CS2 Inventory -->
        <cs-inventory-grid
          :cs-inventory="cs_inventory"
          :cs-inventory-value="csInventoryValue"
          :is-own-profile="isOwnProfile"
          @skin-clicked="openCsSkinDetails"
        />
      </div>

      <div
        v-else-if="loading"
        class="w-100 d-flex"
        style="place-items: center; place-content: center"
      >
        <v-progress-circular :size="50" width="10" color="primary" indeterminate />
      </div>

      <div v-else class="w-100 d-flex" style="place-items: center; place-content: center">
        <h3>Utilisateur introuvable</h3>
      </div>
    </v-main>

    <home-btn />
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

  <v-dialog
    v-model="skinHistoryDialog"
    class="modals"
    max-width="800"
    scroll-strategy="reposition"
    scrollable
  >
    <v-card class="modal-card text-white" variant="flat">
      <v-card-title>
        <h3>Offres pour {{ selectedSkin.displayName }}</h3>
      </v-card-title>
      <v-card-text variant="text">
        <v-list bg-color="transparent" class="text-white px-0">
          <v-list-item
            v-for="offer in selectedSkin.offers"
            :key="offer.uuid || offer.id"
            variant="tonal"
            rounded="xl"
            class="mb-2"
          >
            <v-list-item-title class="d-flex align-center ga-3 pt-1">
              <v-img :src="offer.seller.avatarUrl" rounded="circle" max-width="20"></v-img>
              <h3 class="mb-1">{{ offer.seller.username }}</h3>
              <v-spacer></v-spacer>
              <p>{{ offer.postedAt }}</p>
            </v-list-item-title>
            <v-list-item-subtitle class="d-flex align-center ga-1 pt-1">
              <h3 class="mb-1">Prix de départ : {{ offer.startingPrice }}</h3>
              <v-spacer></v-spacer>
              <v-chip
                :color="
                  offer.status === 'open'
                    ? 'primary'
                    : offer.status === 'closed'
                      ? 'error'
                      : 'warning'
                "
                variant="flat"
              >
                {{
                  offer.status === 'open'
                    ? 'En cours'
                    : offer.status === 'closed'
                      ? 'Terminée'
                      : 'En attente'
                }}
              </v-chip>
            </v-list-item-subtitle>
            <v-list bg-color="transparent" rounded="lg">
              <v-list-item
                v-if="offer.bids.length === 0"
                class="mb-1 w-100"
                rounded="lg"
                style="background: #343434"
              >
                <div class="d-flex ga-2 align-center">
                  <p style="font-size: 0.8em">Aucune enchère</p>
                </div>
              </v-list-item>
              <v-list-item
                v-for="bid in offer.bids"
                :key="bid.id || bid.offeredAt"
                class="mb-1 w-100"
                rounded="lg"
                style="background: #343434"
              >
                <div class="d-flex ga-2 align-center">
                  <p style="white-space: nowrap; font-size: 0.8em">{{ bid.offeredAt }}</p>
                  <v-divider vertical />
                  <v-img
                    :src="bid.bidder.avatarUrl"
                    max-width="20"
                    min-width="20"
                    height="20"
                    rounded="circle"
                  ></v-img>
                  <p
                    style="
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                      font-size: 0.8em;
                    "
                  >
                    {{ bid.bidder.username }}
                  </p>
                  <v-spacer></v-spacer>
                  <p>{{ bid.offerAmount }}</p>
                </div>
              </v-list-item>
            </v-list>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog
    v-model="skinDetailsDialog"
    :persistent="isDestructing || isUpgrading || isSpinning"
    class="modals"
    max-width="450"
    scroll-strategy="reposition"
    scrollable
  >
    <v-card class="text-white" variant="text" elevation="0">
      <v-card-text
        style="
          display: flex;
          flex-direction: row;
          align-items: start;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
        "
      >
        <div
          style="
            min-width: 250px;
            max-width: 400px;
            border: 2px solid #77777777;
            flex-grow: 1;
            border-radius: 20px;
            background: #181818;
            position: relative;
            overflow: hidden;
          "
          :style="selectedSkin.isChampions ? 'border: 2px solid #ffd700cc' : ''"
        >
          <div
            class="details-item"
            :class="{
              'shake-anim': isDestructing,
              'success-anim': isUpgrading,
              'melee-skin-card': selectedSkin.isMelee,
              'vct-skin-card': selectedSkin.isVCT,
              'champions-skin-card': selectedSkin.isChampions,
            }"
            :style="`border-radius: 10px`"
          >
            <div
              class="w-100"
              style="
                position: relative;
                display: flex;
                flex-direction: column;
                place-content: space-between;
                padding: 0.5em 1em;
                gap: 1rem;
              "
            >
              <div
                class="w-100"
                style="
                  display: flex;
                  place-content: space-between;
                  gap: 1em;
                  overflow: clip;
                  max-width: 100%;
                "
              >
                <span
                  style="
                    font-weight: bold;
                    color: #ddd;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    flex-grow: 0;
                    flex-shrink: 1;
                  "
                >
                  {{ selectedSkin?.displayName }}
                </span>
                <span class="price-text" style="flex-shrink: 0; flex-grow: 3; text-align: right">
                  {{ formattedDisplayPrice.replace(/\B(?=(\d{3})+(?!\d))/g, `&nbsp;`) }}&nbsp;<span
                    style="color: rgba(255, 255, 255, 0.3)"
                    >Flopos</span
                  >
                </span>
              </div>

              <div
                style="
                  display: flex;
                  place-content: space-between;
                  place-items: center;
                  width: 100%;
                  gap: 1em;
                "
              >
                <v-img
                  :key="selectedSkin.currentLvl + '-' + selectedSkin.currentChroma"
                  :src="getImageUrl(selectedSkin, skinsData[selectedSkin.uuid])"
                  class="skin-img pop-in-img"
                  height="25"
                  min-width="70"
                  max-width="70"
                />
                <div class="d-flex ga-2">
                  <v-icon
                    v-if="selectedSkin.offers.length > 0"
                    class="mdi mdi-history"
                    @click="skinHistoryDialog = true"
                  ></v-icon>
                  <v-icon
                    v-if="skinsVideoUrls[selectedSkin.uuid] !== null"
                    class="mdi mdi-television"
                    @click="skinVideoDialog = true"
                  ></v-icon>
                </div>
              </div>

              <div
                style="
                  display: flex;
                  place-content: space-between;
                  place-items: center;
                  width: 100%;
                  gap: 1em;
                "
              >
                <v-spacer></v-spacer>
                <div class="d-flex" style="gap: 1em">
                  <div
                    v-for="(chroma, index) in skinsData[selectedSkin.uuid].chromas"
                    :key="chroma.uuid || index"
                  >
                    <v-img
                      v-if="chroma.swatch"
                      :src="chroma.swatch"
                      class="rounded-lg"
                      width="30px"
                      height="30px"
                      :style="`${index + 1 === selectedSkin.currentChroma ? 'border: 2px solid #' + selectedSkin.tierColor : ''}`"
                    />
                    <span v-if="!chroma.swatch" class="font-weight-bold"
                      >{{ getChromaName(selectedSkin, skinsData[selectedSkin.uuid]) }}
                    </span>
                  </div>
                </div>
              </div>
              <div
                style="
                  display: flex;
                  place-content: space-between;
                  place-items: center;
                  width: 100%;
                  gap: 1em;
                "
              >
                <v-progress-linear
                  :model-value="
                    (selectedSkin.currentLvl / skinsData[selectedSkin.uuid].levels.length) * 100
                  "
                  :color="
                    selectedSkin.isVCT
                      ? getRegionColor(selectedSkin.vctRegion)
                      : '#' + selectedSkin.tierColor
                  "
                  style="box-shadow: 0 0 20px 1px #181818"
                ></v-progress-linear>
                <p>
                  Lvl&nbsp;<span class="font-weight-bold">{{ selectedSkin.currentLvl }}</span
                  >/{{ skinsData[selectedSkin.uuid].levels.length }}
                </p>
              </div>
              <div>
                <v-img
                  :src="'/vct_logos/' + selectedSkin.vctRegion + '.png'"
                  style="position: absolute; width: 30px; top: 38px; right: 15px"
                />
              </div>
            </div>
          </div>
          <v-divider
            v-if="!selectedSkin.isMelee && !selectedSkin.isChampions"
            class="mx-2 my-0"
          ></v-divider>
          <div
            style="
              padding: 0.5em 1em 1em 1em;
              opacity: 1;
              display: flex;
              flex-direction: column;
              height: 100%;
              transition: all 0.3s ease;
            "
            :style="
              canBeUpgraded
                ? ''
                : 'opacity: 0.5 !important; pointer-events: none; transform: scale(0); height: 0; padding: 0'
            "
          >
            <div class="align-baseline mt-auto">
              <!-- Assuming you have an upgradeCost variable -->
              <p style="font-size: 1.05em" class="mb-0">Améliorer</p>
              <p style="color: #ccccccaa">
                Coût de l'amélioration : <span class="font-weight-bold">{{ upgradeCost }}</span
                >&nbsp;Flopos
              </p>
            </div>
            <!-- START UPGRADE WHEEL -->
            <div
              v-if="!fetchingSkinStats"
              class="d-flex justify-center align-center my-2"
              style="position: relative; height: 160px"
            >
              <!-- Marker -->
              <div
                style="
                  position: absolute;
                  top: 0;
                  left: 50%;
                  transform: translateX(-50%) translateY(5px);
                  z-index: 10;
                "
              >
                <v-icon
                  color="white"
                  icon="mdi-menu-up"
                  size="25"
                  style="filter: drop-shadow(0 0 5px black)"
                ></v-icon>
              </div>

              <!-- Background Ambient Glow (Optional: Adds depth behind the wheel) -->
              <div
                style="
                  position: absolute;
                  width: 120px;
                  height: 120px;
                  border-radius: 50%;
                  background: radial-gradient(
                    circle,
                    rgba(255, 255, 255, 0.1) 0%,
                    rgba(0, 0, 0, 0) 70%
                  );
                  pointer-events: none;
                "
              ></div>

              <!-- Rotating Container -->
              <div style="width: 170px; height: 170px; will-change: transform" :style="wheelStyle">
                <svg
                  viewBox="0 0 100 100"
                  style="transform: rotate(-90deg); width: 100%; height: 100%; overflow: visible"
                >
                  <!-- Base Circle (Dark track) -->
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#111"
                    stroke-width="10"
                  />

                  <!-- Glowing Segments -->
                  <circle
                    v-for="segment in computedSegments"
                    :key="segment.id"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    :stroke="'#' + segment.color"
                    stroke-width="4"
                    :stroke-dasharray="segment.dashArray"
                    :stroke-dashoffset="segment.dashOffset"
                    :style="{
                      filter: `drop-shadow(0 0 2px #${segment.color}) drop-shadow(0 0 8px #${segment.color})`,
                    }"
                  />
                </svg>
              </div>

              <div
                style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translateX(-50%) translateY(-50%);
                "
              >
                <v-btn
                  class="text-none spin-btn"
                  color="primary"
                  :disabled="isSpinning || user?.coins < upgradeCost"
                  @click="startUpgrade"
                >
                  GO
                </v-btn>
              </div>
            </div>
            <!-- END UPGRADE WHEEL -->
            <div
              v-else
              class="d-flex justify-center align-center my-6"
              style="position: relative; height: 160px"
            >
              <v-progress-circular
                :size="120"
                width="10"
                color="primary"
                indeterminate
              ></v-progress-circular>
            </div>

            <div class="d-flex ga-2 flex-wrap">
              <p class="text-capitalize" style="font-size: 0.7em">
                <v-icon
                  color="#00000077"
                  class="mdi mdi-square"
                  :style="{ filter: `drop-shadow(0 0 2px #00000077)` }"
                ></v-icon
                >&nbsp;échec
              </p>
              <p style="font-size: 0.7em">
                <v-icon
                  color="#f26558"
                  class="mdi mdi-square"
                  :style="{ filter: `drop-shadow(0 0 2px #f26558)` }"
                ></v-icon
                >&nbsp;Destruction
              </p>
              <p style="font-size: 0.7em">
                <v-icon
                  color="#5865f2"
                  class="mdi mdi-square"
                  :style="{ filter: `drop-shadow(0 0 2px #5865f2)` }"
                ></v-icon
                >&nbsp;Amélioration
              </p>
            </div>
          </div>
          <v-divider class="mx-2 my-0"></v-divider>
          <div style="padding: 0.5em 1em 1em 1em">
            <p style="font-size: 1.05em" class="mb-0">Revendre</p>
            <p style="color: #ccccccaa; font-size: 0.9em" class="mb-3">
              Tu peux créer une enchère sur FlopoMarket, ou le vendre instantanément.
            </p>
            <div class="d-flex flex-wrap ga-2">
              <v-btn
                color="#222"
                variant="flat"
                elevation="0"
                rounded="lg"
                class="text-none"
                style="flex-grow: 1"
                @click="$router.push('/market')"
                >Sur FlopoMarket</v-btn
              >
              <v-btn
                color="white"
                variant="tonal"
                elevation="0"
                rounded="lg"
                class="text-none"
                style="flex-grow: 1"
                :loading="instantSellProcessing"
                @click="handleInstantSell"
                >Pour {{ selectedSkin.currentPrice }} Flopos</v-btn
              >
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- CS2 Skin Detail Dialog -->
  <v-dialog v-model="csSkinDetailsDialog" class="modals" max-width="450" scrim="#181818">
    <v-card
      v-if="selectedCsSkin"
      color="#1A1A1A"
      rounded="xl"
      class="overflow-hidden"
      style="position: relative"
    >
      <div
        class="glow-bg"
        :style="`background: radial-gradient(circle, ${getRarityColor(selectedCsSkin.rarity)} 0%, transparent 100%);`"
      ></div>

      <v-card-item class="px-6 pt-6 pb-2">
        <div class="d-flex justify-center">
          <v-img
            :src="selectedCsSkin.imageUrl"
            width="100%"
            height="150px"
            style="filter: drop-shadow(0 0 5px #333)"
          />
        </div>
      </v-card-item>

      <v-card-item class="text-center pb-4" style="z-index: 2">
        <h2 class="text-h6 font-weight-bold text-white mb-1">{{ selectedCsSkin.displayName }}</h2>
        <p v-if="selectedCsSkin.weaponType" class="text-grey" style="font-size: 0.85em">
          {{ selectedCsSkin.weaponType }}
        </p>

        <div class="d-flex justify-center ga-2 mt-2">
          <v-chip v-if="selectedCsSkin.isStattrak" color="orange" size="small" variant="flat"
            >StatTrak</v-chip
          >
          <v-chip v-if="selectedCsSkin.isSouvenir" color="#ffd700" size="small" variant="flat"
            >Souvenir</v-chip
          >
          <v-chip :color="getRarityColor(selectedCsSkin.rarity)" size="small" variant="flat">{{
            selectedCsSkin.rarity
          }}</v-chip>
        </div>

        <v-row class="w-100 mt-4">
          <v-col cols="4" class="text-center border-e border-grey-darken-3">
            <p class="text-caption text-uppercase text-grey">Usure</p>
            <p class="text-body-2 font-weight-bold">{{ selectedCsSkin.wearState }}</p>
          </v-col>
          <v-col cols="4" class="text-center border-e border-grey-darken-3">
            <p class="text-caption text-uppercase text-grey">Float</p>
            <p class="text-body-2 font-weight-bold">{{ selectedCsSkin.float?.toFixed(4) }}</p>
          </v-col>
          <v-col cols="4" class="text-center">
            <p class="text-caption text-uppercase text-grey">Valeur</p>
            <p class="text-body-2 font-weight-bold">
              {{ selectedCsSkin.price }}&nbsp;<span style="opacity: 0.4; font-size: 0.8em"
                >Flopos</span
              >
            </p>
          </v-col>
        </v-row>

        <!-- Float bar -->
        <div v-if="selectedCsSkin.float != null" class="w-100 mt-3 px-2">
          <div class="cs-float-bar-track">
            <div
              class="cs-float-bar-marker"
              :style="{ left: `${selectedCsSkin.float * 100}%` }"
            ></div>
          </div>
        </div>
      </v-card-item>

      <v-divider></v-divider>

      <v-card-actions v-if="isOwnProfile" class="pa-4 d-flex ga-2">
        <v-btn
          variant="tonal"
          color="secondary"
          rounded="lg"
          class="text-none flex-grow-1"
          :loading="csSellProcessing"
          @click="handleCsInstantSell"
        >
          Vendre ({{ selectedCsSkin.price }} Flopos)
        </v-btn>
        <v-btn
          variant="tonal"
          color="secondary"
          rounded="lg"
          class="text-none flex-grow-1"
          @click="((csSkinDetailsDialog = false), $router.push('/market'))"
        >
          FlopoMarket
        </v-btn>
      </v-card-actions>
      <v-card-actions v-else class="pa-4">
        <v-spacer />
        <v-btn variant="tonal" color="secondary" rounded="lg" @click="csSkinDetailsDialog = false"
          >Fermer</v-btn
        >
        <v-spacer />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.pulse-glow {
  animation: breathe 3s infinite ease-in-out;
}

@keyframes breathe {
  0% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.3);
  }
  100% {
    filter: brightness(1);
  }
}

.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 12px;
}
.spin-btn {
  border-radius: 50%;
  width: 90px;
  height: 90px;
  box-shadow: 0 0 10px #ffffff55;
}
.spin-btn:active {
  transform: scale(0.9);
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
  gap: 0.5em;
}

.inventory-item {
  position: relative;
  width: 400px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: 0.3s ease-in-out;
  user-select: none;
}

.details-item {
  position: relative;
  display: flex;
  max-width: 400px;
  overflow: hidden;
  border: none !important;
  border-radius: 0 !important;
  transition: 0.3s ease-in-out;
  user-select: none;
}

.details-item::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: #181818;
  z-index: -1;
  transition: 0.3s ease-in-out;
}

.skin-img {
  height: 85px !important;
  min-width: 200px !important;
  user-select: none;
}

.melee-skin-card {
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.1);
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
  animation: shine-sweep 10s infinite cubic-bezier(0.2, 0, 0, 1);
  pointer-events: none;
  z-index: 3;
}

@keyframes shine-sweep {
  0% {
    transform: rotate(45deg) translateY(-450px);
  }
  20% {
    transform: rotate(45deg) translateY(250px);
  } /* Fast sweep */
  100% {
    transform: rotate(45deg) translateY(450px);
  } /* Wait */
}

.vct-skin-card .skin-card-bg {
  display: none;
}

/* --- 3. CHAMPIONS EFFECTS (Golden Flow) --- */
.champions-skin-card {
  border: 2px solid #ffd700cc;
  box-shadow: inset 0 0 20px rgba(255, 215, 0, 0.4);
  /* The animated gradient background */
  background: linear-gradient(
    120deg,
    #2b2005 0%,
    #634f11 25%,
    #ffd700cc 50%,
    #634f11 75%,
    #2b2005 100%
  );
  background-size: 200% 200%;
  animation: gold-flow 15s ease infinite;
}

/* .disabled-inventory::after {
  content: 'Actuellement indisponible';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ddd;
  background: rgba(0, 0, 0, 0.9);
  z-index: 3;
} */

.champions-skin-card .skin-bg {
  display: none; /* Hide default tier color */
}

@keyframes gold-flow {
  0% {
    background-position: 0 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

/* Add some sparkles/dust to champions */

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

.shake-anim {
  animation: shakeAndBurn 1.2s forwards ease-in-out;
  border-color: #f26558 !important; /* Red border */
}

@keyframes shakeAndBurn {
  0% {
    transform: translate(1px, 1px) rotate(0deg);
  }
  10% {
    transform: translate(-1px, -2px) rotate(-1deg);
  }
  20% {
    transform: translate(-3px, 0px) rotate(1deg);
    filter: grayscale(0) brightness(1);
  }
  30% {
    transform: translate(3px, 2px) rotate(0deg);
  }
  40% {
    transform: translate(1px, -1px) rotate(1deg);
  }
  50% {
    transform: translate(-1px, 2px) rotate(-1deg);
    filter: grayscale(1) brightness(0.5) blur(1px);
  }
  60% {
    transform: translate(-3px, 1px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
    filter: grayscale(1) brightness(0);
  }
}

/* --- SUCCESS ANIMATION --- */
.success-anim {
  animation: successPulse 1s ease-out;
}

/*@keyframes successPulse {
  0% { transform: scale(1); box-shadow: 0 0 0 transparent; }
  50% { transform: scale(1.02); box-shadow: 0 0 20px #aaa; border-color: #aaa; }
  100% { transform: scale(1); box-shadow: 0 0 0 transparent; }
}*/

/* --- IMAGE POP EFFECT (Triggers on key change) --- */
.pop-in-img {
  animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.5) rotate(-10deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

/* Price Highlight transition */
.price-text {
  transition: color 0.3s ease;
}

/* CS2 Float bar */
.cs-float-bar-track {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(to right, #4caf50, #8bc34a, #cddc39, #ffeb3b, #ff9800, #f44336);
  position: relative;
}

.cs-float-bar-marker {
  position: absolute;
  top: -4px;
  width: 2px;
  height: 12px;
  background: white;
  border-radius: 1px;
  transform: translateX(-50%);
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
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
</style>
