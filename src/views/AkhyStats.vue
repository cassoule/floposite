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
  },
}
</script>

<template>
  <v-layout class="w-100">
    <v-main class="d-flex pt-16" style="place-items: start; place-content: start; gap: 2em">
      <div v-if="user && !loading" class="w-100">
        <div class="d-flex w-100" style="gap: 2em; flex-wrap: wrap">
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
            <h3 v-if="elo">
              {{ elo }} FlopoElo
              <span style="color: rgba(255, 255, 255, 0.3)">{{ Math.max(...elo_graph) }} PB</span>
            </h3>
            <p v-else>Non Classé</p>
          </div>
        </div>

        <v-list
          width="100%"
          class="mt-10 py-0 graphs-list"
          rounded="xl"
          bg-color="#181818"
          base-color="white"
          variant="tonal"
          style="border: 2px solid #ffffff55"
        >
          <v-list-item class="py-4 graphs">
            <h2>FlopoCoins</h2>
            <v-sparkline
              smooth
              auto-draw
              class="pa-0 ma-0"
              color="primary"
              line-width="1"
              :model-value="
                sparkline?.length > 1 ? sparkline?.map((entry) => entry.user_new_amount) : [0, 0]
              "
              title="Evolution de l'elo"
            />
          </v-list-item>

          <v-list-item class="py-4 graphs">
            <h2>FlopoElo</h2>
            <v-sparkline
              smooth
              auto-draw
              class="pa-0 ma-0"
              color="secondary"
              line-width="1"
              :model-value="elo_graph?.length > 1 ? elo_graph : [0, 0]"
              title="Evolution de l'elo"
            />
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
            class="pb-3"
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
            class="pb-3"
            style="z-index: 1"
          >
            <div class="inventory">
              <div
                v-for="skin in user_inventory"
                :key="skin.id"
                class="inventory-item"
                :style="`border-radius: 10px;`"
              >
                <div
                  style="
                display: flex;
                place-content: space-between;
                min-width: 300px;
                width: 100%;
                padding: 0.5em 1em;
              "
                >
                  <div style="display: flex; width: 70%; gap: 1em">
                    <v-img
                      :src="skin.displayIcon"
                      class="skin-img"
                      height="25"
                      min-width="70"
                      max-width="70"
                    />
                    <span
                      style="
                    color: #ddd;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                  "
                    >{{ skin.displayName }}</span
                    >
                  </div>

                  <span style="font-weight: bold">{{ skin.currentPrice.toFixed(2) }}€</span>
                  <v-menu v-if="skinsVideoUrls[skin.uuid] !== null" activator="parent" location="center" open-on-click close-on-content-click transition="scale-transition">
                    <v-list
                      width="400"
                      class="mr-2 py-0"
                      elevation="20"
                      rounded="xl"
                      bg-color="#181818"
                      base-color="white"
                      variant="tonal"
                      :style="`border: 2px solid #${skin.tierColor}`"
                    >
                      <v-list-item class="pa-0">
                        <v-video
                          class="skin-video w-100"
                          :volume="25"
                          theme="dark"
                          color="primary"
                          autoplay
                          floating
                          controls-variant="hidden"
                          elevation="0"
                          :src="skinsVideoUrls[skin.uuid]"
                        ></v-video>
                      </v-list-item>
                      <div style="position: absolute; top: 10px; right: 10px; cursor: pointer">
                        <v-icon class="mdi mdi-close video-close-icon"/>
                      </div>
                    </v-list>
                  </v-menu>
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

      <div v-else>
        <p>Joueur Introuvable</p>
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
</template>

<style scoped>
.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 12px;
}

.graphs-list {
  display: flex;
}

.graphs {
  width: 50%;
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

@media (max-width: 650px) {
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
}
</style>