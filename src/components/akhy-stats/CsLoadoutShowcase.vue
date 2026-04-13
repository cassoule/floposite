<script>
import { getRarityColor } from '@/utils/csRarity.js'
import { formatCoins } from '@/utils/format.js'

export default {
  name: 'CsLoadoutShowcase',
  props: {
    featuredSkins: { type: Array, default: () => [] },
    isOwnProfile: { type: Boolean, default: false },
  },
  computed: {
    slots() {
      const result = [null, null, null]
      for (const f of this.featuredSkins) {
        if (f.position >= 1 && f.position <= 3) result[f.position - 1] = f.csSkin
      }
      return result
    },
  },
  methods: {
    getRarityColor,
    formatCoins,
  },
}
</script>

<template>
  <div v-if="featuredSkins.length > 0 || isOwnProfile" class="loadout-showcase">
    <div class="showcase-header">
      <v-icon size="14" class="mr-1">mdi-star</v-icon>
      <span>Équipement mis en avant</span>
      <v-btn
        v-if="isOwnProfile"
        variant="text"
        size="x-small"
        class="ml-2"
        @click="$router.push('/loadout')"
      >
        Gérer
      </v-btn>
    </div>

    <div class="showcase-skins">
      <div
        v-for="(skin, i) in slots"
        :key="i"
        class="showcase-slot"
        :class="{ filled: skin !== null, empty: skin === null && isOwnProfile }"
        :style="skin ? { borderColor: getRarityColor(skin.rarity) } : {}"
      >
        <template v-if="skin">
          <v-img :src="skin.imageUrl" height="200" width="200" contain class="skin-img" />
          <h3 class="skin-name text-truncate font-weight-bold">{{ skin.displayName }}</h3>
          <div class="skin-price">
            {{ formatCoins(skin.price || 0) }}
            <v-icon size="10">mdi-circle-multiple</v-icon>
          </div>
        </template>
        <template v-else-if="isOwnProfile">
          <v-icon size="20" color="rgba(255,255,255,0.2)">mdi-plus</v-icon>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loadout-showcase {
  padding: 12px 16px;
  margin: 8px 0;
}

.showcase-header {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.showcase-skins {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.showcase-slot {
  width: 200px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.showcase-slot.filled {
  border: 1px solid;
}

.showcase-slot.empty {
  border: 1px dashed rgba(255, 255, 255, 0.1);
  justify-content: center;
  cursor: pointer;
  min-height: 90px;
}

.skin-img {
  width: 100%;
}

.skin-name {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  width: 100%;
  text-align: center;
}

.skin-price {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  display: flex;
  align-items: center;
  gap: 2px;
}
</style>
