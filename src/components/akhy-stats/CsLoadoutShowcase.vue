<script>
import { getRarityColor } from '@/utils/csRarity.js'
import { formatCoins } from '@/utils/format.js'

const WEAPON_CATEGORIES = [
  {
    label: 'Pistolets',
    slots: ['Glock-18', 'USP-S', 'Desert Eagle', 'P250', 'Five-SeveN', 'Tec-9', 'CZ75-Auto', 'Dual Berettas', 'R8 Revolver', 'P2000'],
  },
  { label: 'Snipers', slots: ['AWP', 'SSG 08', 'G3SG1', 'SCAR-20'] },
  { label: 'Fusils à pompe', slots: ['Nova', 'XM1014', 'MAG-7', 'Sawed-Off'] },
  { label: 'Mitrailleuses', slots: ['M249', 'Negev'] },
  { label: 'SMGs', slots: ['MAC-10', 'MP5-SD', 'MP7', 'MP9', 'PP-Bizon', 'P90', 'UMP-45'] },
  { label: 'Rifles', slots: ['AK-47', 'M4A4', 'M4A1-S', 'FAMAS', 'Galil AR', 'SG 553', 'AUG'] },
  { label: 'Couteau', slots: ['knife'] },
  { label: 'Gants', slots: ['gloves'] },
]

function getSkinSlot(skin) {
  const name = skin.marketHashName || ''
  const lower = name.toLowerCase()
  if (lower.includes('gloves') || lower.includes('wraps') || lower.includes('hand wrap')) return 'gloves'
  if (name.startsWith('★')) return 'knife'
  const sep = name.indexOf(' | ')
  return sep !== -1 ? name.slice(0, sep) : name
}

export default {
  name: 'CsLoadoutShowcase',
  props: {
    loadout: { type: Array, default: () => [] },
    featuredSkins: { type: Array, default: () => [] },
    isOwnProfile: { type: Boolean, default: false },
  },
  computed: {
    WEAPON_CATEGORIES: () => WEAPON_CATEGORIES,

    equippedBySlot() {
      const map = {}
      for (const s of this.loadout) map[getSkinSlot(s)] = s
      return map
    },

    loadoutValue() {
      return this.loadout.reduce((sum, s) => sum + (s.price || 0), 0)
    },

    featuredIds() {
      return new Set(this.featuredSkins.map((f) => f.csSkinId))
    },
  },
  methods: {
    getRarityColor,
    formatCoins,
  },
}
</script>

<template>
  <div v-if="loadout.length > 0 || isOwnProfile" class="loadout-showcase">
    <div class="showcase-header">
      <span><v-icon size="14" class="mr-1 mb-1">mdi-shield-half-full</v-icon>Équipement</span>
      <span v-if="loadoutValue > 0" class="ml-2 text-white" style="font-size: 15px; opacity: 0.7">
        {{ formatCoins(loadoutValue) }}
        <v-icon size="9">mdi-circle-multiple</v-icon>
      </span>
      <v-btn
        v-if="isOwnProfile"
        variant="tonal"
        size="small"
        class="ml-2 rounded-lg"
        @click="$router.push('/loadout')"
      >
        Gérer
      </v-btn>
    </div>

    <div class="d-flex flex-wrap justify-space-between ga-2" style="row-gap: 0 !important;">
      <div v-for="cat in WEAPON_CATEGORIES" :key="cat.label" class="mb-3" style="flex-grow: 1;">
        <div class="category-label">{{ cat.label }}</div>
        <div class="d-flex flex-wrap ga-2">
          <div
            v-for="slot in cat.slots"
            :key="slot"
            class="weapon-slot"
            :class="equippedBySlot[slot] ? 'equipped' : 'empty'"
            :style="equippedBySlot[slot] ? { borderColor: getRarityColor(equippedBySlot[slot].rarity) } : {}"
          >
            <template v-if="equippedBySlot[slot]">
              <v-icon
                v-if="featuredIds.has(equippedBySlot[slot].id)"
                class="featured-star"
                size="11"
                color="amber"
              >mdi-star</v-icon>
              <v-img :src="equippedBySlot[slot].imageUrl" height="100" width="100" contain />
              <div class="slot-name text-truncate">{{ equippedBySlot[slot].displayName }}</div>
              <div class="slot-price">
                {{ formatCoins(equippedBySlot[slot].price || 0) }}
                <v-icon size="8">mdi-circle-multiple</v-icon>
              </div>
            </template>
            <template v-else>
              <v-icon size="18" color="rgba(255,255,255,0.1)">mdi-minus</v-icon>
              <div class="slot-weapon-name">{{ slot }}</div>
            </template>
          </div>
        </div>
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
  font-size: 20px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.category-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 5px;
}

.weapon-slot {
  width: 99px;
  min-height: 150px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.03);
  padding: 2px 4px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  position: relative;
  overflow: hidden;
}

.weapon-slot.equipped {
  border-width: 1px;
}

.weapon-slot.empty {
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.07);
}

.featured-star {
  position: absolute;
  top: 3px;
  right: 3px;
}

.slot-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  width: 100%;
  text-align: center;
}

.slot-price {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  gap: 2px;
}

.slot-weapon-name {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.18);
  text-align: center;
  padding: 0 4px;
}
</style>
