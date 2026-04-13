<template>
  <div>
    <div
      v-if="!modelValue"
      style="
        position: fixed;
        right: 0;
        top: 50%;
        height: 70px;
        width: 25px;
        background: rgba(255, 255, 255, 0);
        padding: 1.5em 0.1em;
        border-radius: 10px 0 0 10px;
        cursor: pointer;
        transform: translateY(-50%);
      "
      @click="$emit('update:modelValue', true)"
    />
    <v-navigation-drawer
      :model-value="modelValue"
      location="right"
      :width="350"
      variant="text"
      color="transparent"
      elevation="0"
      temporary
      :scrim="false"
      style="border-left-width: 0 !important"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <div v-if="users && !mounting" class="leaderboard-container h-100">
        <TransitionGroup name="leaderboard-list" tag="div" class="leaderboard h-100">
          <h2
            class="pa-2 mb-2 w-100 text-white"
            style="
              display: flex;
              place-content: space-between;
              align-items: center;
              position: sticky;
              top: 0;
              z-index: 100;
            "
          >
            <span
              class="d-flex justify-center text-white align-center text-capitalize cursor-pointer text-center"
              style="
                user-select: none;
                width: 60px;
                font-size: 0.75em;
                height: 25px;
                padding-bottom: 2px;
                background: #5865f2;
                border-radius: 10px;
              "
              @click="leaderboardSwitch"
            >
              {{ leaderboardType }}
            </span>
            <v-btn
              icon
              variant="text"
              density="compact"
              class="mdi mdi-close"
              style="font-size: 1em"
              @click="$emit('update:modelValue', false)"
            ></v-btn>
          </h2>
          <div
            v-for="akhy in leaderboardUsers"
            :key="akhy.id"
            v-motion
            :initial="{ opacity: 0, y: -20, scale: 0.9 }"
            :enter="{ opacity: 1, y: 0, scale: 1, transition: { duration: 300, delay: 50 } }"
            :leave="{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 200 } }"
            style="border-radius: 10px; margin: 0 6px"
            :style="
              akhy.id === discordId
                ? 'background: radial-gradient(circle at -100% -300%,#5865f2,transparent 100%)'
                : ''
            "
          >
            <div
              v-if="akhy"
              style="
                display: flex;
                place-content: space-between;
                min-width: 300px;
                width: 100%;
                padding: 0.5em 1em;
              "
            >
              <span style="color: #fff; display: flex; place-items: center; gap: 0.7rem">
                <v-img
                  :src="akhy.avatarUrl"
                  color="transparent"
                  style="border-radius: 50%; width: 20px; height: 20px"
                />
                @{{ akhy?.username }}&nbsp;
                <i
                  v-if="akhy?.isAkhy"
                  class="mdi mdi-check-decagram-outline"
                  title="Akhy certifié"
                ></i>
                <i v-if="akhy.id === devId" class="mdi mdi-crown-outline" title="FlopoDev"></i>
              </span>
              <div v-if="leaderboardType === 'coins'" style="display: flex; place-items: center">
                {{ formatAmount(akhy.coins) }}
              </div>
              <div
                v-else-if="leaderboardType === 'rank'"
                style="display: flex; place-items: center"
              >
                <template v-if="akhy.isPlacement">
                  <span style="font-size: 0.8em; opacity: 0.6"
                    >Placement {{ akhy.gamesPlayed }}/5</span
                  >
                </template>
                <template v-else>
                  <v-img :src="rankIcon(akhy.elo)" width="20" height="20">
                    <div
                      :style="`position: absolute; display: flex; width: 100%; height: 100%; place-items: center; place-content: center; font-size: .8em; color: #222`"
                    >
                      <p style="font-weight: 400">{{ rankDiv(akhy?.elo) }}</p>
                    </div>
                  </v-img>
                </template>
              </div>
              <div v-else style="display: flex; place-items: center; gap: 3px; font-size: 0.85em">
                {{ formatCoins(akhy.loadoutValue || 0) }}
                <v-icon size="11">mdi-circle-multiple</v-icon>
              </div>

              <v-menu activator="parent" location="end" open-on-click transition="scale-transition">
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
                  <v-list-item class="px-2">
                    <v-list-item-title
                      style="display: flex; place-content: start; place-items: center; gap: 0.7rem"
                      class="cursor-pointer"
                      @click="$router.push('/akhy/' + akhy.id)"
                    >
                      <v-img
                        :src="akhy.avatarUrl"
                        color="transparent"
                        max-width="30"
                        style="border-radius: 50%; width: 20px; height: 30px"
                      />
                      {{ akhy?.username }}
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item>
                    <v-sparkline
                      smooth
                      auto-draw
                      class="pa-0 ma-0"
                      color="primary"
                      line-width="2"
                      :model-value="
                        sparklines[akhy.id]?.length > 1
                          ? sparklines[akhy.id]?.map((entry) => entry.userNewAmount)
                          : [0, 0]
                      "
                      style="position: absolute; left: 0; top: 0"
                      title="Evolution de FlopoCoins"
                    />
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-subtitle>
                      {{
                        users
                          .find((u) => u.id === akhy.id)
                          ?.coins.toString()
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
                      }}
                      FlopoCoins
                    </v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-sparkline
                      smooth
                      auto-draw
                      class="pa-0 ma-0"
                      color="secondary"
                      line-width="2"
                      :model-value="eloGraphs[akhy.id]?.length > 1 ? eloGraphs[akhy.id] : [0, 0]"
                      style="position: absolute; left: 0; top: 0"
                      title="Evolution de l'elo"
                    />
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-subtitle>
                      {{
                        elos[akhy.id]?.isPlacement
                          ? `Placement ${elos[akhy.id]?.gamesPlayed}/5`
                          : `${elos[akhy.id]?.elo ?? 0} FlopoRank`
                      }}
                    </v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-if="featuredSkinsMap[akhy.id]?.length" class="px-2 pb-1">
                    <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: space-around;">
                      <div
                        v-for="entry in featuredSkinsMap[akhy.id]"
                        :key="entry.csSkin.id"
                        style="
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          width: 60px;
                        "
                        :title="entry.csSkin.displayName + ' - ' + formatAmount(entry.csSkin.price) + ' Coins'"
                      >
                        <v-img :src="entry.csSkin.imageUrl" width="60" height="40" contain />
                        <span
                          style="
                            font-size: 9px;
                            opacity: 0.5;
                            text-align: center;
                            overflow: hidden;
                            white-space: nowrap;
                            width: 100%;
                          "
                        >
                          {{ entry.csSkin.displayName }}
                        </span>
                      </div>
                    </div>
                  </v-list-item>
                  <v-list-item class="pb-1 px-3">
                    <v-btn
                      class="text-none"
                      color="primary"
                      block
                      rounded
                      density="comfortable"
                      @click="$router.push('/akhy/' + akhy.id)"
                      >Voir plus</v-btn
                    >
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>
        </TransitionGroup>
      </div>
      <div v-else class="leaderboard-container h-100">
        <TransitionGroup name="leaderboard-list" tag="div" class="leaderboard h-100">
          <h2
            class="pa-2 mb-2 w-100 text-white"
            style="
              display: flex;
              place-content: space-between;
              align-items: center;
              position: sticky;
              top: 0;
              z-index: 100;
            "
          >
            <span
              class="d-flex justify-center text-white align-center text-capitalize cursor-pointer text-center"
              style="
                user-select: none;
                width: 60px;
                font-size: 0.75em;
                height: 25px;
                padding-bottom: 2px;
                background: #5865f2;
                border-radius: 10px;
              "
              @click="leaderboardSwitch"
            >
              {{ leaderboardType }}
            </span>
            <v-btn
              icon
              variant="text"
              density="compact"
              class="mdi mdi-close"
              style="font-size: 1em"
              @click="$emit('update:modelValue', false)"
            ></v-btn>
          </h2>

          <v-skeleton-loader
            v-for="akhy in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
            type="heading"
            color="transparent"
            class="w-100 px-1 my-0 py-0"
          ></v-skeleton-loader>
        </TransitionGroup>
      </div>
      <div
        style="
          position: absolute;
          left: -25px;
          top: 50%;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(15px);
          padding: 1.5em 0.1em;
          border-radius: 15px 0 0 15px;
          cursor: pointer;
          transform: translateY(-50%);
        "
        @click="$emit('update:modelValue', false)"
      >
        <v-icon :class="'mdi mdi-chevron-' + (modelValue ? 'right' : 'left')"></v-icon>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script>
import { formatAmount } from '@/utils/format.js'
import { rankIcon, rankDiv } from '@/utils/rank.js'

export default {
  name: 'LeaderboardDrawer',
  props: {
    modelValue: { type: Boolean, default: false },
    users: { type: Array, default: null },
    usersByElo: { type: Array, default: null },
    usersByLoadoutValue: { type: Array, default: null },
    sparklines: { type: Object, default: () => ({}) },
    elos: { type: Object, default: () => ({}) },
    eloGraphs: { type: Object, default: () => ({}) },
    featuredSkinsMap: { type: Object, default: () => ({}) },
    discordId: { type: String, default: null },
    devId: { type: String, default: null },
    mounting: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      leaderboardType: 'coins',
    }
  },
  computed: {
    leaderboardUsers() {
      if (this.leaderboardType === 'coins') return this.users ? [...this.users] : []
      if (this.leaderboardType === 'rank') return this.usersByElo ? [...this.usersByElo] : []
      return this.usersByLoadoutValue ? [...this.usersByLoadoutValue] : []
    },
  },
  methods: {
    formatAmount,
    rankIcon,
    rankDiv,
    leaderboardSwitch() {
      const order = ['coins', 'rank', 'loadout']
      const idx = order.indexOf(this.leaderboardType)
      this.leaderboardType = order[(idx + 1) % order.length]
    },
    formatCoins(n) {
      return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    },
  },
}
</script>
