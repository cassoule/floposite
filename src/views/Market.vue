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
      selectedSkin: null,

      flopoRankDialog: false,
    }
  },

  async mounted() {
  },

  computed: {

  },

  methods: {
  },
}
</script>

<template>
  <v-layout class="w-100" :key="Date.now()">
    <v-main class="d-flex pt-16" style="place-items: start; place-content: start; gap: 2em">
      <div class="w-100">
        <h1>FlopoMarket</h1>
        <div class="d-flex" style="height: 400px; place-items: center; justify-content: center">
          <p>Prochainement...&nbsp;&nbsp;:)</p>
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
        <v-icon class="mdi mdi-close video-close-icon text-white" @click="skinVideoDialog = false" />
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
  gap: .2em;
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