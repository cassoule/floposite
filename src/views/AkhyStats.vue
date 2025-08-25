<script>
import axios from 'axios'

export default {
  name: 'AkhyStats',

  data() {
    return {
      users: null,
      user: null,
      sparkline: null,
      elo: null,
      elo_graph: null,
      user_inventory: null,
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
    }
  },
}
</script>

<template>
  <v-layout class="w-100">
    <v-main class="d-flex pt-16" style="place-items: start; place-content: start; gap: 2em;">
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
          style="border: 2px solid #ffffff55; max-height: 500px;"
        >
          <v-list-item class="pt-4 position-sticky top-0 w-100" rounded="0" style="backdrop-filter: blur(5px); z-index: 100">
            <h2>Historique des parties</h2>
          </v-list-item>
          <v-list-item v-if="games.length > 0" v-for="game in games.filter(g => g.type !== 'POKER_ROUND')" class="pb-3 ">
            <v-card :class="cardClass(game)" variant="tonal" color="secondary" rounded="xl">
              <v-card-text class="pb-0">
                <div class="d-flex justify-space-between">
                  <div class="d-flex w-33" style="place-items: center; place-content: start">
                    <v-img class="mr-2" :src="game.p1 === $route.params.id ? users.find(u => u.id ===game.p1)?.avatarUrl : users.find(u => u.id ===game.p2)?.avatarUrl" :width="30" :height="30" rounded="circle"></v-img>
                    <h3 class="username">{{game.p1 === $route.params.id ? users.find(u => u.id ===game.p1)?.globalName : users.find(u => u.id ===game.p2)?.globalName}}</h3>
                  </div>
                  <div class="d-flex w-33" style="gap: .5rem; place-items: center; place-content: center">
                    <h2>{{ game.p1 === $route.params.id ? game.p1_score.toFixed(0) : game.p2_score.toFixed(0) }}</h2>
                    <h2>-</h2>
                    <h2>{{ game.p1 === $route.params.id ? game.p2_score.toFixed(0) : game.p1_score.toFixed(0) }}</h2>
                  </div>
                  <div class="d-flex w-33" style="place-items: center; place-content: end">
                    <h3 class="username">{{ game.p1 === $route.params.id ? users.find(u => u.id ===game.p2)?.globalName : users.find(u => u.id ===game.p1)?.globalName }}</h3>
                    <v-img class="ml-2" :src="game.p1 === $route.params.id ? users.find(u => u.id ===game.p2)?.avatarUrl : users.find(u => u.id ===game.p1)?.avatarUrl" :width="30" :height="30" rounded="circle"></v-img>
                  </div>
                </div>
                <div class="d-flex justify-space-between mt-2">
                  <h4>{{game.p1 === $route.params.id ? game.p1_elo : game.p2_elo}} FlopoElo</h4>
                  <h4>{{game.p1 === $route.params.id ? game.p2_elo : game.p1_elo}} FlopoElo</h4>
                </div>
                <h4 class="mt-1">{{
                    (() => {
                      const diff = game.p1 === $route.params.id
                        ? game.p1_new_elo - game.p1_elo
                        : game.p2_new_elo - game.p2_elo;

                      return diff > 0 ? `+${diff}` : diff;
                    })()
                  }}</h4>
              </v-card-text>
              <v-card-subtitle class="text-right pb-2">{{ game.type }} - {{ new Date(game.timestamp).toLocaleDateString() }}</v-card-subtitle>
            </v-card>
          </v-list-item>
          <v-list-item v-else>
            <p class="text-center pt-12 pb-16">Aucune partie classée</p>
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
  background: radial-gradient(circle at 23% 50%, #3eaa3e, #00000000 23%) !important;
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
  background: radial-gradient(circle at 23% 50%, #aa3e3e, #00000000 23%) !important;
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
  background: radial-gradient(circle at 23% 50%, #5865f2, #00000000 23%) !important;
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
    max-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>