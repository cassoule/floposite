<template>
  <v-list-item class="w-100 px-0 pb-3">
    <v-card class="py-0 text-white" elevation="0" rounded="0" variant="text">
      <v-card-item class="pa-0">
        <div
          ref="rankBar"
          class="w-100 pb-6 pt-13"
          style="position: relative; overflow-x: scroll; min-height: 280px; scrollbar-width: auto"
        >
          <div
            v-for="(label, i) in labels"
            :key="i"
            class="d-flex"
            :style="`
              position: absolute;
              left: ${label.left}px;
              top: 20px;
              flex-direction: column;
              place-items: center;
              width: 130px;
              transform: translateX(-50%);
            `"
          >
            <v-img
              class="mt-3"
              :src="label.elo ? rankIcon(label.elo) : ''"
              width="64"
              height="64"
            />
            <h2 :style="`color: ${label.elo ? rankColor(label.elo) : '#dddddd'}`">
              {{ label.name }}
            </h2>
            <h3 :style="`color: ${(label.elo ? rankColor(label.elo) : '#dddddd') + '77'}`">
              {{ label.elo === 2100 ? '2100+' : label.elo }}&nbsp;Elo
            </h3>
          </div>
          <div
            style="
              position: absolute;
              left: 0;
              top: 70px;
              z-index: -1;
              width: 1600px;
              height: 5px;
              background: linear-gradient(
                90deg,
                #dddddd11 0px 300px,
                #c58a48 300px 600px,
                #bdc3c5 600px 900px,
                #fed833 900px 1200px,
                #a6d5e9 1200px 1500px,
                #77bb77 1500px 1600px
              );
            "
          ></div>
          <div
            v-for="akhy in users"
            :key="akhy.id"
            class="cursor-pointer user-rank-point"
            :style="`position: absolute;
              left: ${playerPosition(akhy?.elo)}px;
              top: 10px;
              transform: translateX(-50%);
              display: flex;
              flex-direction: column;
              place-items: center;
              z-index: ${akhy.id === user.id ? '10' : '1'};`"
            :title="`${akhy?.username} - ${akhy?.elo}`"
            @click="$emit('user-clicked', akhy.id)"
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
            <v-icon class="mdi mdi-chevron-down" size="20" :color="rankColor(akhy?.elo)"></v-icon>
          </div>

          <div>
            <p
              v-for="marker in RANK_MARKERS"
              :key="marker.elo"
              class="cursor-pointer bg-dark opacity-90"
              :style="`position: absolute;
              color: ${rankColor(marker.elo)} !important;
              left: ${playerPosition(marker.elo)}px;
              top: 63px;
              transform: translateX(-50%);
              display: flex;
              flex-direction: column;
              place-items: center;
              padding: 0 .4em;
              font-size: .8em;
              border-radius: 5em;
              z-index: 10;`"
              :title="`${marker.elo} elo`"
            >
              {{ marker.div }}
            </p>
          </div>
        </div>
      </v-card-item>
    </v-card>
  </v-list-item>
</template>

<script>
import { rankIcon, rankColor, playerPosition, RANK_MARKERS } from '@/utils/rank.js'

export default {
  name: 'FlopoRankBar',
  props: {
    users: { type: Array, default: () => [] },
    user: { type: Object, default: null },
    elo: { type: Object, default: null },
  },
  emits: ['user-clicked'],
  data() {
    return {
      RANK_MARKERS,
      labels: [
        { elo: 0, name: 'Flop', left: 50 },
        { elo: 1200, name: 'Bronze', left: 300 },
        { elo: 1400, name: 'Silver', left: 600 },
        { elo: 1600, name: 'Gold', left: 900 },
        { elo: 1850, name: 'Diamond', left: 1200 },
        { elo: 2100, name: 'Master', left: 1500 },
      ],
    }
  },
  methods: {
    rankIcon,
    rankColor,
    playerPosition,
    scrollToPlayerRank() {
      const bar = this.$refs.rankBar
      if (!bar || !this.elo?.elo) return
      const pos = playerPosition(this.elo.elo)
      bar.scrollLeft = pos - bar.clientWidth / 2
    },
  },
}
</script>

<style scoped>
.user-rank-point {
  transition: 0.2s ease-in-out;
}
.user-rank-point:hover {
  z-index: 1000000 !important;
  transform: scale(1.1) translateX(-45%) !important;
}
</style>
