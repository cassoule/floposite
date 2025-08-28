<script>
import axios from 'axios'

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
      active_slowmodes: null,
      user_isTimedOut: false,
      games: null,
      loading: true,

      skinVideoDialog: false,
      selectedSkin: null,

      flopoRankDialog: false,
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
      await this.getInventory()
      this.fetchSkinsVideoUrls()
      await this.getActiveSlowmodes()
      await this.isTimedOut()
      await this.getGames()
    }
    this.loading = false
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

    fetchSkinsVideoUrls() {
      this.user_inventory.forEach(async (s) => {
        console.log(s)
        await this.getSkinVideoUrl(s)
      })
    },

    async getSkinVideoUrl(skin) {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/skin/' + skin.uuid
      try {
        const response = await axios.post(fetchUrl, {
          level: skin.currentLvl,
          chroma: skin.currentChroma,
        });
        this.skinsVideoUrls[skin.uuid] = response.data.url
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
        return '';
      } else if (elo < 1100) {
        return '/ranks_icons/bronze.svg';
      } else if (elo < 1300) {
        return '/ranks_icons/silver.svg';
      } else if (elo < 1600) {
        return '/ranks_icons/gold.svg';
      } else if (elo < 2000) {
        return '/ranks_icons/diamond.svg';
      } else if (elo >= 2000) {
        return '/ranks_icons/master.svg';
      } else {
        return '';
      }
    },
    rankText(elo) {
      if (!elo) {
        return 'Non classé'
      }
      if (elo < 900) {
        return 'Guez';
      } else if (elo < 1100) {
        return 'Bronze';
      } else if (elo < 1300) {
        return 'Silver';
      } else if (elo < 1600) {
        return 'Gold';
      } else if (elo < 2000) {
        return 'Diamond';
      } else if (elo >= 2000) {
        return 'Master';
      } else {
        return 'Non classé';
      }
    },
    rankColor(elo) {
      if (!elo) {
        return ''
      }
      if (elo < 900) {
        return '#ddddddaa';
      } else if (elo < 1100) {
        return '#C58A48';
      } else if (elo < 1300) {
        return '#BDC3C5';
      } else if (elo < 1600) {
        return '#FED833';
      } else if (elo < 2000) {
        return '#A6D5E9';
      } else if (elo >= 2000) {
        return '#77BB77';
      } else {
        return '';
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
        return (elo / 899) * 177 + 88;
      } else if (elo < 1100) {
        return ((elo - 900) / 199) * 354 + 265.5;
      } else if (elo < 1300) {
        return ((elo - 1100) / 199) * 177 + 619.5;
      } else if (elo < 1600) {
        return ((elo - 1300) / 299) * 177 + 796.5;
      } else if (elo < 2000) {
        return ((elo - 1600) / 399) * 177 + 973.5;
      } else if (elo >= 2000) {
        return '1150.5';
      } else {
        return '-100';
      }
    }
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
                <h1 class="font-weight-bold">@{{ user.username }}</h1>
                <h3 class="d-flex mt-2" style="place-items: baseline">
                  {{ user?.coins.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') }}
                  <span class="ml-1" style="color: rgba(255, 255, 255, 0.3)">FlopoCoins</span>
                </h3>
                <h3>
                  {{ user_inventory?.length }} skins
                  <span style="color: rgba(255, 255, 255, 0.3)">{{ inventoryValue?.toFixed(2) }}€</span>
                </h3>
                <h3>
                  {{ user?.warns }} warns
                  <span style="color: rgba(255, 255, 255, 0.3)">{{ user?.allTimeWarns }} all time</span>
                </h3>

              </div>
              <v-spacer></v-spacer>
              <div class="d-flex rank-ctn" style="place-content: space-between">
                <div style="margin-right: 4em">
                  <h1>
                    FlopoRank
                  </h1>
                  <h2 class="mt-2" :style="`color: ${rankColor(user?.elo)}`">{{rankText(user?.elo)}}</h2>
                  <h3 v-if="elo">
                    {{ elo }}
                    <span style="color: rgba(255, 255, 255, 0.3)">{{ Math.max(...elo_graph) }} PB</span>
                  </h3>
                  <h3 v-else>-</h3>
                </div>
                <v-img class="mt-3" :src="rankIcon(user?.elo)" max-width="96" height="96" />
              </div>
            </div>
          </v-list-item>


          <v-list-item class="px-0 pb-3">
            <v-card
              class=" py-0 text-white"
              elevation="0"
              rounded="0"
              variant="text"
            >
              <v-card-item class="pa-0">
                <div class="w-100 d-flex pb-6 pt-13" style="position: relative; place-content: space-between; gap: 64px; overflow-x: scroll; padding: 0 64px 64px 32px; scrollbar-width: auto;">
                  <div class="d-flex" style="flex-direction: column; place-items: center; min-width: 113px; max-width: 113px">
                    <v-img class="mt-3" src="" width="64" height="64" />
                    <h2>Flop</h2>
                    <h3 :style="`color: ${'#dddddd77'}`">0&nbsp;Elo</h3>
                  </div>
                  <div class="d-flex" style="flex-direction: column; place-items: center; min-width: 113px; max-width: 113px">
                    <v-img class="mt-3" :src="rankIcon(900)" width="64" height="64" />
                    <h2 :style="`color: ${rankColor(900)}`">Bronze</h2>
                    <h3 :style="`color: ${rankColor(900)+'77'}`">900&nbsp;Elo</h3>
                  </div>
                  <div class="d-flex" style="flex-direction: column; place-items: center; min-width: 113px; max-width: 113px">
                    <v-img class="mt-3" src="" width="64" height="64" />
                    <h2 style="color: #dddddd">Start</h2>
                    <h3 style="color: #dddddd77">1000&nbsp;Elo</h3>
                  </div>
                  <div class="d-flex" style="flex-direction: column; place-items: center; min-width: 113px; max-width: 113px">
                    <v-img class="mt-3" :src="rankIcon(1100)" width="64" height="64" />
                    <h2 :style="`color: ${rankColor(1100)}`">Silver</h2>
                    <h3 :style="`color: ${rankColor(1100)+'77'}`">1100&nbsp;Elo</h3>
                  </div>
                  <div class="d-flex" style="flex-direction: column; place-items: center; min-width: 113px; max-width: 113px">
                    <v-img class="mt-3" :src="rankIcon(1300)" width="64" height="64"/>
                    <h2 :style="`color: ${rankColor(1300)}`">Gold</h2>
                    <h3 :style="`color: ${rankColor(1300)+'77'}`">1300&nbsp;Elo</h3>
                  </div>
                  <div class="d-flex" style="flex-direction: column; place-items: center; min-width: 113px; max-width: 113px">
                    <v-img class="mt-3" :src="rankIcon(1600)" width="64" height="64" />
                    <h2 :style="`color: ${rankColor(1600)}`">Diamond</h2>
                    <h3 :style="`color: ${rankColor(1600)+'77'}`">1600&nbsp;Elo</h3>
                  </div>
                  <div class="d-flex" style="flex-direction: column; place-items: center; min-width: 113px; max-width: 113px">
                    <v-img class="mt-3" :src="rankIcon(2000)" width="64" height="64" />
                    <h2 :style="`color: ${rankColor(2000)}`">Master</h2>
                    <h3 :style="`color: ${rankColor(2000)+'77'}`">2000+&nbsp;Elo</h3>
                  </div>
                  <div
                    style="
                      position: absolute;
                      left: 0;
                      top: 7em;
                      z-index: -1;
                      width: 1271px;
                      height: 5px;
                      background: linear-gradient(90deg, #dddddd11 0px 220px, #C58A48 265.5px 563px, #BDC3C5 619.5px 740px, #FED833 796.5px 917px, #A6D5E9 973.5px 1094px, #77BB77 1150.5px 1271px);
                    "
                  >
                  </div>
                  <div
                    v-for="akhy in users"
                    :style="
                      `position: absolute;
                      left: ${playerPositoin(akhy?.elo)}px;
                      bottom: 10em;
                      transform: translateX(-50%);
                      display: flex;
                      flex-direction: column;
                      place-items: center;
                      z-index: ${akhy.id === user.id ? '10' : '1'};`
                    "
                    :title="`${akhy?.globalName} - ${akhy?.elo}`"
                  >
                    <v-img :src="akhy.avatarUrl" :width="akhy.id === user.id ? 40 : 30" :height="akhy.id === user.id ? 40 : 30" rounded="circle" :style="`border: ${akhy.id === user.id ? 4 : 2}px solid ${rankColor(akhy?.elo)}`"></v-img>
                    <v-icon class="mdi mdi-chevron-down" size="20" :color="rankColor(akhy?.elo)"></v-icon>
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
                    <h4>{{ game.p1 === $route.params.id ? game.p1_elo : game.p2_elo }} Elo</h4>
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
                    <div class="d-flex" style="place-items: center; place-content: start">
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
                    <h4>{{ game.p1 === $route.params.id ? game.p2_elo : game.p1_elo }} Elo</h4>
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
          v-if="user_inventory"
          width="100%"
          class="mt-10 py-0 position-relative"
          rounded="xl"
          bg-color="#181818"
          variant="tonal"
          style="border: 2px solid #ffffff55; max-height: 500px"
        >
          <v-list-item
            class="pt-4 position-sticky top-0 w-100"
            rounded="0"
            style="backdrop-filter: blur(5px); z-index: 2"
          >
            <h2>Inventaire</h2>
          </v-list-item>
          <v-list-item
            v-if="user_inventory.length > 0"
            class="pb-3 px-0"
            style="z-index: 1; user-select: none"
          >
            <div class="inventory px-4">
              <div
                v-for="skin in user_inventory"
                :key="skin.id"
                class="inventory-item"
                :style="`border-radius: 10px;`"
              >
                <div
                  style="
                    display: flex;
                    flex-direction: column;
                    place-content: space-between;
                    min-width: 400px;
                    width: 100%;
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
                      "
                    >{{ skin.displayName }}</span
                    >
                    <span style="font-weight: bold">{{ skin.currentPrice.toFixed(2) }}€</span>
                  </div>

                  <div style="display: flex; place-content: space-between; place-items: center; width: 100%; gap: 1em">
                    <v-img
                      :src="skin.displayIcon"
                      class="skin-img"
                      height="25"
                      min-width="70"
                      max-width="70"
                    />
                    <v-icon v-if="skinsVideoUrls[skin.uuid] !== null" class="mdi mdi-television" @click="skinVideoDialog = true" @click.stop="selectedSkin = skin"></v-icon>
                  </div>
                </div>
                <div
                  class="skin-bg"
                  :style="`background: radial-gradient(circle at -50% 0%, #${skin.tierColor}, transparent 80%)`"
                ></div>
              </div>
            </div>
          </v-list-item>
          <v-list-item v-else>
            <p class="text-center pt-12 pb-16">Aucun skin dans l'inventaire</p>
          </v-list-item>
        </v-list>
      </div>

      <div v-else-if="loading" class="w-100 d-flex" style="place-items: center; place-content: center">
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
      bg-color="#181818"
      base-color="white"
      variant="tonal"
      :style="`border: 2px solid #${selectedSkin.tierColor}`"
    >
      <v-card-item class="pa-0">
        <v-video
          class="skin-video w-100"
          :volume="25"
          theme="dark"
          color="primary"
          autoplay
          floating
          controls-variant="hidden"
          elevation="0"
          :src="skinsVideoUrls[selectedSkin.uuid]"
          style="user-select: none"
        ></v-video>
      </v-card-item>
      <div style="position: absolute; top: 10px; right: 10px; cursor: pointer">
        <v-icon class="mdi mdi-close video-close-icon" @click="skinVideoDialog = false"/>
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
  box-shadow: 0 0 10px 10px gray;
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
  flex-direction: row;
  overflow-y: hidden;
  overflow-x: scroll;
  scrollbar-width: auto;
  user-select: none;
}

.inventory .inventory-item {
  flex-grow: 1;
  flex-shrink: 0;
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