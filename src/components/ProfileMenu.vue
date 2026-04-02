<template>
  <div style="position: fixed; top: 1rem; left: 1rem; z-index: 1000; transition: all 0.5s">
    <v-expansion-panels
      color="transparent"
      rounded="xl"
      variant="accordion"
      elevation="0"
      style="transition: all 0.5s"
    >
      <v-expansion-panel
        rounded="xl"
        variant="tonal"
        style="
          background-color: #ffffff11;
          box-shadow: none;
          backdrop-filter: blur(10px);
          transition: all 0.5s;
        "
      >
        <v-expansion-panel-title
          class="pa-2"
          rounded="xl"
          variant="tonal"
          expand-icon=""
          collapse-icon=""
          style="transition: all 0.5s"
        >
          <v-card-item class="pa-0 mr-4 text-white" style="transition: all 0.5s">
            <div
              style="
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: start;
                gap: 0.75em;
              "
            >
              <v-img :src="user.avatarUrl" max-width="40" min-width="40" rounded="circle" />

              <div style="line-height: 1.25em">
                <h3>{{ user.username }}</h3>
                <p>
                  <span class="font-weight-bold" style="font-size: 0.8em">{{
                    user?.coins.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
                  }}</span
                  >&nbsp;Coins&nbsp;
                </p>
              </div>
            </div>
          </v-card-item>
        </v-expansion-panel-title>
        <v-expansion-panel-text class="text-white">
          <div v-if="elos[user.id]?.elo" class="d-flex ga-2 px-4 pt-2" style="place-items: center">
            <template v-if="elos[user.id]?.isPlacement">
              <span>Placement {{ elos[user.id]?.gamesPlayed }}/5</span>
            </template>
            <template v-else>
              <div style="display: flex; place-items: center">
                <v-img :src="rankIcon(user?.elo)" width="22" height="30">
                  <div
                    :style="`position: absolute; display: flex; width: 100%; height: 100%; place-items: center; place-content: center; font-size: .8em; color: #222`"
                  >
                    <p style="font-weight: 400">{{ rankDiv(user?.elo) }}</p>
                  </div>
                </v-img>
              </div>
              {{ elos[user.id]?.elo }} FlopoElo
              <span v-if="elo_graphs[user.id]" style="color: rgba(255, 255, 255, 0.3)">{{
                'Best : ' + Math.max(...elo_graphs[user.id], 0) + ' Elo'
              }}</span>
            </template>
          </div>
          <p class="pl-11 pb-5" style="line-height: 0.5em; color: #ffffff77">-%WR</p>
          <div class="w-100 px-2 ga-2 d-flex">
            <v-btn
              text="Voir le profil"
              append-icon=""
              class="text-none"
              color="white"
              variant="tonal"
              size="small"
              rounded="lg"
              style="flex-grow: 1"
              @click="$router.push(`/akhy/${user.id}`)"
            >
            </v-btn>
            <v-btn
              text="Soutenir"
              append-icon=""
              class="text-none buy-btn"
              color="white"
              variant="tonal"
              size="small"
              rounded="lg"
              style="flex-grow: 1"
              @click="$emit('buy-coins')"
            >
              <template #append>
                <v-img src="star.svg" width="12px" height="12px" />
              </template>
            </v-btn>
          </div>

          <v-card-actions>
            <button class="discord-logout w-100" @click="$emit('logout')">Déconnexion</button>
          </v-card-actions>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
import { rankIcon, rankDiv, rankColor } from '../utils/rank.js'

export default {
  name: 'ProfileMenu',

  props: {
    user: {
      type: Object,
      required: true,
    },
    elos: {
      type: Object,
      required: true,
    },
    elo_graphs: {
      type: Object,
      required: true,
    },
  },

  emits: ['logout', 'buy-coins'],

  methods: {
    rankIcon,
    rankDiv,
    rankColor,
  },
}
</script>

<style scoped>
.discord-logout {
  position: relative;
  background: #a12829;
  color: white;
  padding: 4px 12px;
  border-radius: 15px;
  border: none;
  text-decoration: none;
  display: inline-block;
  cursor: pointer;
  z-index: 10;
  transition: 0.2s ease-in-out;
}
.discord-logout:hover {
  background: #aa3e3e;
  box-shadow: 0 0 32px 0 #a1282955;
}
</style>
