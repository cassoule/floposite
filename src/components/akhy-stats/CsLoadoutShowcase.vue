<script>
import { getRarityColor } from '@/utils/csRarity.js'
import { formatCoins } from '@/utils/format.js'
import { LOADOUT_STRUCTURE, SIDES, SIDE_LABELS, getSlotsForSide } from '@/utils/csLoadout.js'

function categoryLabel(category) {
  return LOADOUT_STRUCTURE.find((s) => s.category === category)?.label || category
}

export default {
  name: 'CsLoadoutShowcase',
  props: {
    loadout: { type: Array, default: () => [] },
    featuredSkins: { type: Array, default: () => [] },
    isOwnProfile: { type: Boolean, default: false },
  },
  emits: ['skin-clicked'],
  computed: {
    SIDES: () => SIDES,
    SIDE_LABELS: () => SIDE_LABELS,
    CATEGORIES: () => ['starting', 'other_pistol', 'mid', 'rifle', 'knife', 'gloves'],

    equippedBySlot() {
      const map = {}
      for (const s of this.loadout) if (s.loadoutSlot) map[s.loadoutSlot] = s
      return map
    },

    slotsBySide() {
      const out = {}
      for (const side of SIDES) out[side] = getSlotsForSide(side)
      return out
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
    categoryLabel,
    slotsForCategory(side, category) {
      return this.slotsBySide[side].filter((s) => s.category === category)
    },
  },

  data() {
    return {
      tSide: true,
    }
  },
}
</script>

<template>
  <div v-if="loadout.length > 0 || isOwnProfile" class="loadout-showcase">
    <div class="showcase-header">
      <span>Équipement</span>
      <div class="d-flex ga-4 align-center mt-1">
        <span
          v-if="loadoutValue > 0"
          class="text-white text-none"
          style="font-size: 15px; opacity: 0.7; white-space: nowrap"
        >
          {{ formatCoins(loadoutValue) }} Flopos
        </span>
        <v-btn
          v-if="isOwnProfile"
          variant="tonal"
          size="small"
          class="rounded-lg text-none"
          @click="$router.push('/loadout')"
        >
          Gérer
        </v-btn>
      </div>
    </div>

    <div class="loadout-grid">
      <div
        v-for="side in SIDES"
        :key="side"
        class="loadout-side"
        :style="`background: radial-gradient(circle at 50% -150%, #${side === 't' ? 'F89E1B' : '262E70'} 1%, transparent 90%)`"
      >
        <div class="side-header">{{ SIDE_LABELS[side] }}</div>
        <div class="d-flex flex-wrap ga-2" style="row-gap: 0 !important">
          <div v-for="cat in CATEGORIES" :key="cat" class="mb-2">
            <div class="category-label">{{ categoryLabel(cat) }}</div>
            <div class="d-flex flex-wrap ga-2">
              <div
                v-for="slot in slotsForCategory(side, cat)"
                :key="slot.id"
                class="weapon-slot"
                :class="equippedBySlot[slot.id] ? 'equipped' : 'empty'"
                :style="
                  equippedBySlot[slot.id]
                    ? { borderColor: getRarityColor(equippedBySlot[slot.id].rarity) }
                    : {}
                "
                @click="equippedBySlot[slot.id] && $emit('skin-clicked', equippedBySlot[slot.id])"
              >
                <template v-if="equippedBySlot[slot.id]">
                  <v-icon
                    v-if="featuredIds.has(equippedBySlot[slot.id].id)"
                    class="featured-star"
                    size="11"
                    color="amber"
                    >mdi-star</v-icon
                  >
                  <v-img :src="equippedBySlot[slot.id].imageUrl" height="100" width="100" contain />
                  <div class="slot-name text-truncate">
                    {{ equippedBySlot[slot.id].displayName }}
                  </div>
                  <div class="slot-price">
                    {{ formatCoins(equippedBySlot[slot.id].price || 0) }}
                  </div>
                </template>
                <template v-else>
                  <v-icon size="18" color="rgba(255,255,255,0.1)">mdi-minus</v-icon>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loadout-showcase {
  padding: 0;
  margin: 8px 0;
}

.showcase-header {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: bold;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  column-gap: 20px;
  margin-bottom: 12px;
  padding: 0 16px;
}

.loadout-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  overflow-x: scroll;
  scrollbar-width: auto;
  padding: 0 16px 0 16px;
}

@media (max-width: 900px) {
  .loadout-grid {
    grid-template-columns: 1fr;
  }
}

.loadout-side {
  background: rgba(255, 255, 255, 0.015);
  border-radius: 10px;
  padding: 10px 12px;
  width: 660px;
}

.side-header {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.category-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 5px;
}

.weapon-slot {
  width: 120px;
  height: 150px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
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
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.15s;
}

.weapon-slot.equipped:hover {
  background: rgba(255, 255, 255, 0.06);
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
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  width: 100%;
  text-align: center;
}

.slot-price {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
}
</style>
