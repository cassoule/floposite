<script>
import axios from 'axios'
import { frenchColorToHex } from '@/utils/colorToHex.js'

export default {
  name: 'AkhyStats',

  components: {},

  data() {
    return {
      users: null,
      user: null,
      sparkline: null,
      elo: null,
      elo_graph: null,
      user_inventory: null,
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

      flopoRankDialog: false,

      isSpinning: false,
      isDestructing: false,
      isUpgrading: false,
      resultLabel: null,
      wheelRotation: 0,
      upgradeCost: null,
      // Configuration for the 3 parts (This should come from props or API)
      segments: [
        { id: 'upgrade', color: '5865f2', percent: 0.2, label: 'SUCCESS' }, // 10%
        { id: 'destroy', color: 'f26558', percent: 0.05, label: 'DESTROY' }, // 40%
        { id: 'nothing', color: '18181818', percent: 0.75, label: 'FAIL' }, // 50%
      ],

      // Constants
      radius: 40,
      fetchingSkinStats: false,
      displayPrice: 0,
    }
  },

  async mounted() {
    this.users = await this.getUsers()
    this.user = this.users.find((u) => u.id === this.$route.params.id)
    if (this.user) {
      const id = this.$route.params.id
      this.sparkline = await this.getSparkline(id)
      this.elo = await this.getElo(id)
      this.elo_graph = await this.getEloGraph(id)
      await this.getActiveSlowmodes()
      await this.isTimedOut()
      await this.getGames()
    }
    this.loading = false
    if (this.user) {
      this.loadingInventory = true
      await this.getInventory()
      await this.fetchSkinsVideoUrls()
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

  methods: {
    async getUsers() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/users'
      try {
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          },
          withCredentials: false,
        })
        return response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getAvatar(id) {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + id + '/avatar'
      try {
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          },
          withCredentials: false,
        })
        return response.data.avatarUrl
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getSparkline() {
      const fetchUrl =
        import.meta.env.VITE_FLAPI_URL + '/user/' + this.$route.params.id + '/sparkline'
      try {
        const response = await axios.get(fetchUrl)
        return response.data.sparkline
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getElo() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + this.$route.params.id + '/elo'
      try {
        const response = await axios.get(fetchUrl)
        return response.data.elo
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getEloGraph() {
      const fetchUrl =
        import.meta.env.VITE_FLAPI_URL + '/user/' + this.$route.params.id + '/elo-graph'
      try {
        const response = await axios.get(fetchUrl)
        return response.data.elo_graph
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getInventory() {
      const fetchUrl =
        import.meta.env.VITE_FLAPI_URL + '/user/' + this.$route.params.id + '/inventory'
      try {
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          },
          withCredentials: false,
        })
        this.user_inventory = response.data.inventory
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
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/skin/' + skin.uuid
      try {
        const response = await axios.post(fetchUrl, {
          level: skin.currentLvl,
          chroma: skin.currentChroma,
        })
        this.skinsVideoUrls[skin.uuid] = response.data.url
      } catch (e) {
        console.error('flAPI error:', e)
      }
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

    async getActiveSlowmodes() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/slowmodes'
      try {
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          },
          withCredentials: false,
        })
        this.active_slowmodes = response.data.slowmodes
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getGames() {
      const fetchUrl =
        import.meta.env.VITE_FLAPI_URL + '/user/' + this.$route.params.id + '/games-history'
      try {
        const response = await axios.get(fetchUrl)
        this.games = response.data.games
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async isTimedOut() {
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/timedout', {
          userId: this.$route.params.id,
        })
        this.user_isTimedOut = response.data.isTimedOut
      } catch (e) {
        console.log(e)
      }
    },

    cardClass(game) {
      if (game.p1 === this.$route.params.id) {
        if (game.p1_score > game.p2_score) {
          return 'win-card'
        } else if (game.p2_score > game.p1_score) {
          return 'lose-card'
        } else {
          return 'draw-card'
        }
      } else if (game.p2 === this.$route.params.id) {
        if (game.p1_score > game.p2_score) {
          return 'lose-card'
        } else if (game.p2_score > game.p1_score) {
          return 'win-card'
        } else {
          return 'draw-card'
        }
      } else {
        return 'draw-card'
      }
    },

    rankIcon(elo) {
      if (!elo) {
        return ''
      }
      if (elo < 900) {
        return ''
      } else if (elo < 1100) {
        return '/ranks_icons/bronze.svg'
      } else if (elo < 1300) {
        return '/ranks_icons/silver.svg'
      } else if (elo < 1600) {
        return '/ranks_icons/gold.svg'
      } else if (elo < 2000) {
        return '/ranks_icons/diamond.svg'
      } else if (elo >= 2000) {
        return '/ranks_icons/master.svg'
      } else {
        return ''
      }
    },
    rankDiv(elo) {
      if (!elo) {
        return ''
      }
      if (elo < 900) {
        return ''
      } else if (elo < 1100) {
        if (elo < 950) {
          return 'I'
        } else if (elo < 1000) {
          return 'II'
        } else if (elo < 1050) {
          return 'III'
        } else {
          return 'IV'
        }
      } else if (elo < 1300) {
        if (elo < 1150) {
          return 'I'
        } else if (elo < 1200) {
          return 'II'
        } else if (elo < 1250) {
          return 'III'
        } else {
          return 'IV'
        }
      } else if (elo < 1600) {
        if (elo < 1375) {
          return 'I'
        } else if (elo < 1450) {
          return 'II'
        } else if (elo < 1525) {
          return 'III'
        } else {
          return 'IV'
        }
      } else if (elo < 2000) {
        if (elo < 1700) {
          return 'I'
        } else if (elo < 1800) {
          return 'II'
        } else if (elo < 1900) {
          return 'III'
        } else {
          return 'IV'
        }
      } else if (elo >= 2000) {
        return ''
      } else {
        return ''
      }
    },
    rankText(elo) {
      if (!elo) {
        return 'Non classé'
      }
      if (elo < 900) {
        return 'Flop'
      } else if (elo < 1100) {
        if (elo < 950) {
          return 'Bronze I'
        } else if (elo < 1000) {
          return 'Bronze II'
        } else if (elo < 1050) {
          return 'Bronze III'
        } else {
          return 'Bronze IV'
        }
      } else if (elo < 1300) {
        if (elo < 1150) {
          return 'Silver I'
        } else if (elo < 1200) {
          return 'Silver II'
        } else if (elo < 1250) {
          return 'Silver III'
        } else {
          return 'Silver IV'
        }
      } else if (elo < 1600) {
        if (elo < 1375) {
          return 'Gold I'
        } else if (elo < 1450) {
          return 'Gold II'
        } else if (elo < 1525) {
          return 'Gold III'
        } else {
          return 'Gold IV'
        }
      } else if (elo < 2000) {
        if (elo < 1700) {
          return 'Diamond I'
        } else if (elo < 1800) {
          return 'Diamond II'
        } else if (elo < 1900) {
          return 'Diamond III'
        } else {
          return 'Diamond IV'
        }
      } else if (elo >= 2000) {
        return 'Master'
      } else {
        return 'Non classé'
      }
    },
    rankColor(elo) {
      if (!elo) {
        return ''
      }
      if (elo < 900) {
        return '#dddddd'
      } else if (elo < 1100) {
        return '#C58A48'
      } else if (elo < 1300) {
        return '#BDC3C5'
      } else if (elo < 1600) {
        return '#FED833'
      } else if (elo < 2000) {
        return '#A6D5E9'
      } else if (elo >= 2000) {
        return '#77BB77'
      } else {
        return ''
      }
    },
    playerPositoin(elo) {
      if (elo === 0) {
        return '88'
      }
      if (!elo) {
        return '-100'
      }
      if (elo < 900) {
        return (elo / 899) * 177 + 88
      } else if (elo < 1100) {
        return ((elo - 900) / 199) * 354 + 265.5
      } else if (elo < 1300) {
        return ((elo - 1100) / 199) * 177 + 619.5
      } else if (elo < 1600) {
        return ((elo - 1300) / 299) * 177 + 796.5
      } else if (elo < 2000) {
        return ((elo - 1600) / 399) * 177 + 973.5
      } else if (elo >= 2000) {
        return '1150.5'
      } else {
        return '-100'
      }
    },
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
        const url = import.meta.env.VITE_FLAPI_URL + '/skin-upgrade/' + skin.uuid + '/fetch'
        const response = await axios.get(url)
        this.segments = response.data.segments
        this.upgradeCost = response.data.upgradePrice
        console.log(response.data)
      } catch (e) {
        this.skinDetailsDialog = false
      }
      this.fetchingSkinStats = false
    },
    async startUpgrade() {
      if (this.isSpinning) return

      this.isSpinning = true
      this.resultLabel = null

      try {
        const url = import.meta.env.VITE_FLAPI_URL + '/skin-upgrade/' + this.selectedSkin.uuid
        const response = await axios.post(url, { userId: this.user.id })
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
                  <h2 class="mt-2" :style="`color: ${rankColor(user?.elo)}`">
                    {{ rankText(user?.elo) }}
                  </h2>
                  <h3 v-if="elo">
                    {{ elo }}
                    <span style="color: rgba(255, 255, 255, 0.3)"
                      >{{ Math.max(...elo_graph) }} PB</span
                    >
                  </h3>
                  <h3 v-else>-</h3>
                </div>
                <v-img class="mt-3" :src="rankIcon(user?.elo)" max-width="96" height="96">
                  <div
                    :style="`position: absolute; display: flex; width: 100%; height: 100%; place-items: center; place-content: center; font-size: 2.5em; color: #222`"
                  >
                    <p style="font-weight: 500">{{ rankDiv(user?.elo) }}</p>
                  </div>
                </v-img>
              </div>
            </div>
          </v-list-item>

          <v-list-item class="px-0 pb-3">
            <v-card class="py-0 text-white" elevation="0" rounded="0" variant="text">
              <v-card-item class="pa-0">
                <div
                  class="w-100 d-flex pb-6 pt-13"
                  style="
                    position: relative;
                    place-content: space-between;
                    gap: 64px;
                    overflow-x: scroll;
                    padding: 0 64px 64px 32px;
                    scrollbar-width: auto;
                  "
                >
                  <div
                    class="d-flex"
                    style="
                      flex-direction: column;
                      place-items: center;
                      min-width: 113px;
                      max-width: 113px;
                    "
                  >
                    <v-img class="mt-3" src="" width="64" height="64" />
                    <h2>Flop</h2>
                    <h3 :style="`color: ${'#dddddd77'}`">0&nbsp;Elo</h3>
                  </div>
                  <div
                    class="d-flex"
                    style="
                      flex-direction: column;
                      place-items: center;
                      min-width: 113px;
                      max-width: 113px;
                    "
                  >
                    <v-img class="mt-3" :src="rankIcon(900)" width="64" height="64" />
                    <h2 :style="`color: ${rankColor(900)}`">Bronze</h2>
                    <h3 :style="`color: ${rankColor(900) + '77'}`">900&nbsp;Elo</h3>
                  </div>
                  <div
                    class="d-flex"
                    style="
                      flex-direction: column;
                      place-items: center;
                      min-width: 113px;
                      max-width: 113px;
                    "
                  >
                    <v-img class="mt-3" src="" width="64" height="64" />
                    <h2 style="color: #dddddd">Start</h2>
                    <h3 style="color: #dddddd77">1000&nbsp;Elo</h3>
                  </div>
                  <div
                    class="d-flex"
                    style="
                      flex-direction: column;
                      place-items: center;
                      min-width: 113px;
                      max-width: 113px;
                    "
                  >
                    <v-img class="mt-3" :src="rankIcon(1100)" width="64" height="64" />
                    <h2 :style="`color: ${rankColor(1100)}`">Silver</h2>
                    <h3 :style="`color: ${rankColor(1100) + '77'}`">1100&nbsp;Elo</h3>
                  </div>
                  <div
                    class="d-flex"
                    style="
                      flex-direction: column;
                      place-items: center;
                      min-width: 113px;
                      max-width: 113px;
                    "
                  >
                    <v-img class="mt-3" :src="rankIcon(1300)" width="64" height="64" />
                    <h2 :style="`color: ${rankColor(1300)}`">Gold</h2>
                    <h3 :style="`color: ${rankColor(1300) + '77'}`">1300&nbsp;Elo</h3>
                  </div>
                  <div
                    class="d-flex"
                    style="
                      flex-direction: column;
                      place-items: center;
                      min-width: 113px;
                      max-width: 113px;
                    "
                  >
                    <v-img class="mt-3" :src="rankIcon(1600)" width="64" height="64" />
                    <h2 :style="`color: ${rankColor(1600)}`">Diamond</h2>
                    <h3 :style="`color: ${rankColor(1600) + '77'}`">1600&nbsp;Elo</h3>
                  </div>
                  <div
                    class="d-flex"
                    style="
                      flex-direction: column;
                      place-items: center;
                      min-width: 113px;
                      max-width: 113px;
                    "
                  >
                    <v-img class="mt-3" :src="rankIcon(2000)" width="64" height="64" />
                    <h2 :style="`color: ${rankColor(2000)}`">Master</h2>
                    <h3 :style="`color: ${rankColor(2000) + '77'}`">2000+&nbsp;Elo</h3>
                  </div>
                  <div
                    style="
                      position: absolute;
                      left: 0;
                      top: 7em;
                      z-index: -1;
                      width: 1350px;
                      height: 5px;
                      background: linear-gradient(
                        90deg,
                        #dddddd11 0px 220px,
                        #c58a48 265.5px 563px,
                        #bdc3c5 619.5px 740px,
                        #fed833 796.5px 917px,
                        #a6d5e9 973.5px 1094px,
                        #77bb77 1150.5px 1271px
                      );
                    "
                  ></div>
                  <div
                    v-for="akhy in users"
                    class="cursor-pointer user-rank-point"
                    :style="`position: absolute;
                      left: ${playerPositoin(akhy?.elo)}px;
                      bottom: 10em;
                      transform: translateX(-50%);
                      display: flex;
                      flex-direction: column;
                      place-items: center;
                      z-index: ${akhy.id === user.id ? '10' : '1'};`"
                    :title="`${akhy?.globalName} - ${akhy?.elo}`"
                    @click="goToUser(akhy.id)"
                  >
                    <v-img
                      :src="akhy.avatarUrl"
                      :width="akhy.id === user.id ? 40 : 30"
                      :height="akhy.id === user.id ? 40 : 30"
                      rounded="circle"
                      :style="`
                        border: ${akhy.id === user.id ? 4 : 2}px solid ${rankColor(akhy?.elo)};
                        background: #333;
                        box-shadow: 0 0 8px #181818;
                      `"
                    ></v-img>
                    <v-icon
                      class="mdi mdi-chevron-down"
                      size="20"
                      :color="rankColor(akhy?.elo)"
                    ></v-icon>
                  </div>

                  <div>
                    <p
                      class="cursor-pointer bg-dark opacity-90"
                      :style="`position: absolute;
                      color: ${rankColor(950)} !important;
                      left: ${playerPositoin(950)}px;
                      bottom: 8.2em;
                      transform: translateX(-50%);
                      display: flex;
                      flex-direction: column;
                      place-items: center;
                      padding: 0 .4em;
                      font-size: .8em;
                      border-radius: 5em;
                      z-index: 10;`"
                      title="950 elo"
                    >
                      II
                    </p>
                    <p
                      class="cursor-pointer bg-dark opacity-90"
                      :style="`position: absolute;
                      color: ${rankColor(1000)} !important;
                      left: ${playerPositoin(1000)}px;
                      bottom: 8.2em;
                      transform: translateX(-50%);
                      display: flex;
                      flex-direction: column;
                      place-items: center;
                      padding: 0 .4em;
                      font-size: .8em;
                      border-radius: 5em;
                      z-index: 10;`"
                      title="1000 elo"
                    >
                      III
                    </p>
                    <p
                      class="cursor-pointer bg-dark opacity-90"
                      :style="`position: absolute;
                      color: ${rankColor(1050)} !important;
                      left: ${playerPositoin(1050)}px;
                      bottom: 8.2em;
                      transform: translateX(-50%);
                      display: flex;
                      flex-direction: column;
                      place-items: center;
                      padding: 0 .4em;
                      font-size: .8em;
                      border-radius: 5em;
                      z-index: 10;`"
                      title="1050 elo"
                    >
                      IV
                    </p>
                    <p
                      class="cursor-pointer bg-dark opacity-90"
                      :style="`position: absolute;
                      color: ${rankColor(1150)} !important;
                      left: ${playerPositoin(1150)}px;
                      bottom: 8.2em;
                      transform: translateX(-50%);
                      display: flex;
                      flex-direction: column;
                      place-items: center;
                      padding: 0 .4em;
                      font-size: .8em;
                      border-radius: 5em;
                      z-index: 10;`"
                      title="1150 elo"
                    >
                      II
                    </p>
                    <p
                      class="cursor-pointer bg-dark opacity-90"
                      :style="`position: absolute;
                      color: ${rankColor(1200)} !important;
                      left: ${playerPositoin(1200)}px;
                      bottom: 8.2em;
                      transform: translateX(-50%);
                      display: flex;
                      flex-direction: column;
                      place-items: center;
                      padding: 0 .4em;
                      font-size: .8em;
                      border-radius: 5em;
                      z-index: 10;`"
                      title="1200 elo"
                    >
                      III
                    </p>
                    <p
                      class="cursor-pointer bg-dark opacity-90"
                      :style="`position: absolute;
                      color: ${rankColor(1250)} !important;
                      left: ${playerPositoin(1250)}px;
                      bottom: 8.2em;
                      transform: translateX(-50%);
                      display: flex;
                      flex-direction: column;
                      place-items: center;
                      padding: 0 .4em;
                      font-size: .8em;
                      border-radius: 5em;
                      z-index: 10;`"
                      title="1250 elo"
                    >
                      IV
                    </p>
                    <p
                      class="cursor-pointer bg-dark opacity-90"
                      :style="`position: absolute;
                      color: ${rankColor(1375)} !important;
                      left: ${playerPositoin(1375)}px;
                      bottom: 8.2em;
                      transform: translateX(-50%);
                      display: flex;
                      flex-direction: column;
                      place-items: center;
                      padding: 0 .4em;
                      font-size: .8em;
                      border-radius: 5em;
                      z-index: 10;`"
                      title="1375 elo"
                    >
                      II
                    </p>
                    <p
                      class="cursor-pointer bg-dark opacity-90"
                      :style="`position: absolute;
                      color: ${rankColor(1450)} !important;
                      left: ${playerPositoin(1450)}px;
                      bottom: 8.2em;
                      transform: translateX(-50%);
                      display: flex;
                      flex-direction: column;
                      place-items: center;
                      padding: 0 .4em;
                      font-size: .8em;
                      border-radius: 5em;
                      z-index: 10;`"
                      title="1450 elo"
                    >
                      III
                    </p>
                    <p
                      class="cursor-pointer bg-dark opacity-90"
                      :style="`position: absolute;
                      color: ${rankColor(1525)} !important;
                      left: ${playerPositoin(1525)}px;
                      bottom: 8.2em;
                      transform: translateX(-50%);
                      display: flex;
                      flex-direction: column;
                      place-items: center;
                      padding: 0 .4em;
                      font-size: .8em;
                      border-radius: 5em;
                      z-index: 10;`"
                      title="1525 elo"
                    >
                      IV
                    </p>
                    <p
                      class="cursor-pointer bg-dark opacity-90"
                      :style="`position: absolute;
                      color: ${rankColor(1700)} !important;
                      left: ${playerPositoin(1700)}px;
                      bottom: 8.2em;
                      transform: translateX(-50%);
                      display: flex;
                      flex-direction: column;
                      place-items: center;
                      padding: 0 .4em;
                      font-size: .8em;
                      border-radius: 5em;
                      z-index: 10;`"
                      title="1700 elo"
                    >
                      II
                    </p>
                    <p
                      class="cursor-pointer bg-dark opacity-90"
                      :style="`position: absolute;
                      color: ${rankColor(1800)} !important;
                      left: ${playerPositoin(1800)}px;
                      bottom: 8.2em;
                      transform: translateX(-50%);
                      display: flex;
                      flex-direction: column;
                      place-items: center;
                      padding: 0 .4em;
                      font-size: .8em;
                      border-radius: 5em;
                      z-index: 10;`"
                      title="1800 elo"
                    >
                      III
                    </p>
                    <p
                      class="cursor-pointer bg-dark opacity-90"
                      :style="`position: absolute;
                      color: ${rankColor(1900)} !important;
                      left: ${playerPositoin(1900)}px;
                      bottom: 8.2em;
                      transform: translateX(-50%);
                      display: flex;
                      flex-direction: column;
                      place-items: center;
                      padding: 0 .4em;
                      font-size: .8em;
                      border-radius: 5em;
                      z-index: 10;`"
                      title="1900 elo"
                    >
                      IV
                    </p>
                  </div>
                </div>
              </v-card-item>
            </v-card>
          </v-list-item>
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
            <h2>Historique des parties</h2>
          </v-list-item>
          <v-list-item
            v-if="games.filter((g) => g.type !== 'POKER_ROUND').length > 0"
            v-for="game in games.filter((g) => g.type !== 'POKER_ROUND').reverse()"
            class="pb-3 px-2"
          >
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
                            ? users.find((u) => u.id === game.p1)?.globalName
                            : users.find((u) => u.id === game.p2)?.globalName
                        "
                      >
                        {{
                          game.p1 === $route.params.id
                            ? users.find((u) => u.id === game.p1)?.globalName
                            : users.find((u) => u.id === game.p2)?.globalName
                        }}
                      </h3>
                    </div>
                    <h4 class="d-flex" style="gap: 0.5em">
                      <v-img
                        class=""
                        :src="
                          game.p1 === $route.params.id
                            ? rankIcon(game.p1_elo)
                            : rankIcon(game.p2_elo)
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
                                ? rankDiv(game.p1_elo)
                                : rankDiv(game.p2_elo)
                            }}
                          </p>
                        </div>
                      </v-img>
                      {{ game.p1 === $route.params.id ? game.p1_elo : game.p2_elo }}
                    </h4>
                    <h4>
                      {{
                        (() => {
                          const diff =
                            game.p1 === $route.params.id
                              ? game.p1_new_elo - game.p1_elo
                              : game.p2_new_elo - game.p2_elo

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
                    <h2 class="bg-dark px-2 py-1 rounded" style="width: 30px; text-align: center">
                      {{
                        game.p1 === $route.params.id
                          ? game.p1_score.toFixed(0)
                          : game.p2_score.toFixed(0)
                      }}
                    </h2>
                    <h2>-</h2>
                    <h2 class="bg-dark px-2 py-1 rounded" style="width: 30px; text-align: center">
                      {{
                        game.p1 === $route.params.id
                          ? game.p2_score.toFixed(0)
                          : game.p1_score.toFixed(0)
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
                            ? users.find((u) => u.id === game.p2)?.globalName
                            : users.find((u) => u.id === game.p1)?.globalName
                        "
                      >
                        {{
                          game.p1 === $route.params.id
                            ? users.find((u) => u.id === game.p2)?.globalName
                            : users.find((u) => u.id === game.p1)?.globalName
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
                      {{ game.p1 === $route.params.id ? game.p2_elo : game.p1_elo }}
                      <v-img
                        class=""
                        :src="
                          game.p1 === $route.params.id
                            ? rankIcon(game.p2_elo)
                            : rankIcon(game.p1_elo)
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
                                ? rankDiv(game.p2_elo)
                                : rankDiv(game.p1_elo)
                            }}
                          </p>
                        </div>
                      </v-img>
                    </h4>
                    <h4>&nbsp;</h4>
                  </div>
                </div>
              </v-card-text>
              <v-card-text v-else class="pb-0">
                <div class="d-flex justify-space-between" style="place-items: start">
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
                            ? users.find((u) => u.id === game.p1)?.globalName
                            : users.find((u) => u.id === game.p2)?.globalName
                        "
                      >
                        {{
                          game.p1 === $route.params.id
                            ? users.find((u) => u.id === game.p1)?.globalName
                            : users.find((u) => u.id === game.p2)?.globalName
                        }}
                      </h3>
                    </div>
                    <h4>#1 SOTD le {{ new Date(game.timestamp - 60000).toLocaleDateString() }}</h4>
                  </div>
                  <div
                    class="d-flex"
                    style="gap: 0.5rem; place-items: end; place-content: end; width: 33%"
                  >
                    <h2 class="bg-dark px-2 py-1 rounded" style="text-align: center">
                      {{ game.p1_score.toFixed(0) }}
                    </h2>
                  </div>
                </div>
              </v-card-text>
              <v-card-subtitle class="text-right pb-2"
                >{{ game.type }} -
                {{ new Date(game.timestamp - 60000).toLocaleDateString() }}</v-card-subtitle
              >
            </v-card>
          </v-list-item>
          <v-list-item v-else>
            <p class="text-center pt-12 pb-16">Aucune partie classée</p>
          </v-list-item>
        </v-list>

        <v-list
          width="100%"
          class="mt-10 py-0 position-relative"
          rounded="xl"
          bg-color="#181818"
          variant="tonal"
          style="border: 2px solid #ffffff55; max-height: 570px"
        >
          <v-list-item
            class="pt-4 position-sticky top-0 w-100"
            rounded="0"
            style="backdrop-filter: blur(5px); z-index: 2"
          >
            <div class="d-flex w-100 justify-space-between flex-wrap ga-3">
              <h2 style="width: fit-content; white-space: nowrap">
                Inventaire
                <span class="ml-4" style="font-size: 0.8em"
                  >{{ user_inventory?.length }} skins</span
                >
              </h2>
              <v-btn color="primary" rounded="lg" class="text-none" @click="$router.push('/cases')"
                >Obtenir des skins</v-btn
              >
            </div>
          </v-list-item>
          <v-list-item v-if="loadingInventory" class="d-flex" style="justify-content: center">
            <v-progress-circular
              class="pt-12 pb-16"
              :size="50"
              width="10"
              color="primary"
              indeterminate
            ></v-progress-circular>
          </v-list-item>
          <v-list-item
            v-else-if="user_inventory?.length > 0"
            class="pb-3 px-0"
            style="z-index: 1; user-select: none"
          >
            <div class="inventory px-4">
              <div class="inventory-grid">
                <div
                  v-for="skin in user_inventory"
                  :key="skin.id"
                  class="inventory-item cursor-pointer"
                  :style="`border-radius: 10px`"
                  @click="handleSkinDetailsOpen(skin)"
                >
                  <div
                    style="
                      display: flex;
                      flex-direction: column;
                      place-content: space-between;
                      width: 400px;
                      padding: 0.5em 1em;
                      gap: 1rem;
                    "
                  >
                    <div style="display: flex; place-content: space-between; gap: 1em">
                      <span
                        style="
                          font-weight: bold;
                          color: #ddd;
                          overflow: hidden;
                          white-space: nowrap;
                          text-overflow: ellipsis;
                          display: flex;
                          place-items: baseline;
                        "
                      >
                        <v-icon
                          v-if="
                            skin.currentLvl === skinsData[skin.uuid].levels.length &&
                            skin.currentChroma === skinsData[skin.uuid].chromas.length
                          "
                          class="mdi mdi-star-outline mr-1"
                          color="white"
                          style="text-shadow: 0 0 3px #181818"
                          size="15"
                          title="Max"
                        ></v-icon>
                        {{ skin.displayName }}
                      </span>
                      <span
                        >{{
                          skin.currentPrice?.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '&nbsp;')
                        }}&nbsp;<span style="color: rgba(255, 255, 255, 0.3)">Flopos</span></span
                      >
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
                        :src="getImageUrl(skin, skinsData[skin.uuid])"
                        class="skin-img"
                        height="25"
                        min-width="70"
                        max-width="70"
                      />
                      <div class="d-flex ga-2">
                        <v-icon
                          v-if="skin.offers.length > 0"
                          class="mdi mdi-history"
                          @click="skinHistoryDialog = true"
                          @click.stop="selectedSkin = skin"
                        ></v-icon>
                        <v-icon
                          v-if="skinsVideoUrls[skin.uuid] !== null"
                          class="mdi mdi-television"
                          @click="skinVideoDialog = true"
                          @click.stop="selectedSkin = skin"
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
                        <div v-for="(chroma, index) in skinsData[skin.uuid].chromas">
                          <v-img
                            v-if="chroma.swatch"
                            :src="chroma.swatch"
                            class="rounded-lg"
                            width="30px"
                            height="30px"
                            :style="`${index + 1 === skin.currentChroma ? 'border: 2px solid #' + skin.tierColor : ''}`"
                          />
                          <span v-if="!chroma.swatch" class="font-weight-bold"
                            >{{ getChromaName(skin, skinsData[skin.uuid]) }}
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
                        :model-value="(skin.currentLvl / skinsData[skin.uuid].levels.length) * 100"
                        :color="'#' + skin.tierColor"
                      ></v-progress-linear>
                      <p>
                        Lvl&nbsp;<span class="font-weight-bold">{{ skin.currentLvl }}</span
                        >/{{ skinsData[skin.uuid].levels.length }}
                      </p>
                    </div>
                  </div>
                  <div
                    class="skin-bg"
                    :style="`background: radial-gradient(circle at -50% 0%, #${skin.tierColor}, transparent 80%)`"
                  ></div>
                </div>
              </div>
            </div>
          </v-list-item>
          <v-list-item v-else>
            <p class="text-center pt-12 pb-16">Aucun skin dans l'inventaire</p>
          </v-list-item>
        </v-list>
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
            variant="tonal"
            rounded="xl"
            class="mb-2"
          >
            <v-list-item-title class="d-flex align-center ga-3 pt-1">
              <v-img :src="offer.seller.avatarUrl" rounded="circle" max-width="20"></v-img>
              <h3 class="mb-1">{{ offer.seller.username }}</h3>
              <v-spacer></v-spacer>
              <p>{{ offer.posted_at }}</p>
            </v-list-item-title>
            <v-list-item-subtitle class="d-flex align-center ga-1 pt-1">
              <h3 class="mb-1">Prix de départ : {{ offer.starting_price }}</h3>
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
                class="mb-1 w-100"
                rounded="lg"
                style="background: #343434"
              >
                <div class="d-flex ga-2 align-center">
                  <p style="white-space: nowrap; font-size: 0.8em">{{ bid.offered_at }}</p>
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
                  <p>{{ bid.offer_amount }}</p>
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
        >
          <div
            class="details-item"
            :class="{ 'shake-anim': isDestructing, 'success-anim': isUpgrading }"
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
                  {{ selectedSkin.displayName }}
                </span>
                <span class="price-text" style="flex-shrink: 0; flex-grow: 3; text-align: right">
                  {{ formattedDisplayPrice.replace(/\B(?=(\d{3})+(?!\d))/g, `&nbsp;`) }}&nbsp;<span style="color: rgba(255, 255, 255, 0.3)"
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
                  <div v-for="(chroma, index) in skinsData[selectedSkin.uuid].chromas">
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
                  :color="'#' + selectedSkin.tierColor"
                ></v-progress-linear>
                <p>
                  Lvl&nbsp;<span class="font-weight-bold">{{ selectedSkin.currentLvl }}</span
                  >/{{ skinsData[selectedSkin.uuid].levels.length }}
                </p>
              </div>
            </div>
          </div>
          <v-divider class="mx-2"></v-divider>
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
            <div class="d-flex justify-space-between align-baseline mt-auto">
              <!-- Assuming you have an upgradeCost variable -->
              <p style="color: #ccccccaa">
                Coût de l'amélioration : <span class="font-weight-bold">{{ upgradeCost }}</span
                >&nbsp;Flopos
              </p>
            </div>
            <!-- START UPGRADE WHEEL -->
            <div
              v-if="!fetchingSkinStats"
              class="d-flex justify-center align-center my-6"
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
                    v-for="(segment, index) in computedSegments"
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
                  :disabled="isSpinning"
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
                  :style="{filter: `drop-shadow(0 0 2px #00000077)`}"
                ></v-icon>&nbsp;échec
              </p>
              <p style="font-size: 0.7em">
                <v-icon
                  color="#f26558"
                  class="mdi mdi-square"
                  :style="{filter: `drop-shadow(0 0 2px #f26558)`}"
                ></v-icon>&nbsp;Destruction
              </p>
              <p style="font-size: 0.7em" >
                <v-icon
                  color="#5865f2"
                  class="mdi mdi-square"
                  :style="{filter: `drop-shadow(0 0 2px #5865f2)`}"
                ></v-icon>&nbsp;Amélioration
              </p>
            </div>
          </div>
          <v-divider class="mx-2"></v-divider>
          <div style="padding: 1em">
            <v-btn
              color="secondary"
              variant="tonal"
              elevation="0"
              rounded="lg"
              class="text-none"
              @click="$router.push('/market')"
              >Vendre sur FlopoMarket</v-btn
            >
          </div>
        </div>
      </v-card-text>
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

.user-rank-point {
  transition: 0.2s ease-in-out;
}
.user-rank-point:hover {
  z-index: 1000000 !important;
  transform: scale(1.1) translateX(-45%) !important;
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

.details-item {
  position: relative;
  display: flex;
  max-width: 400px;
  overflow: hidden;
  border: 2px solid transparent;
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
</style>