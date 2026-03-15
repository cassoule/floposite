<script>
import { getRarityColor } from '@/utils/csRarity.js'

export default {
  name: 'CsSkinCard',
  props: {
    skin: { type: Object, required: true },
    size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
    showPrice: { type: Boolean, default: true },
    selectable: { type: Boolean, default: false },
    selected: { type: Boolean, default: false },
  },
  emits: ['click'],
  computed: {
    rarityColor() {
      return getRarityColor(this.skin.rarity)
    },
    cardWidth() {
      return { sm: '180px', md: '350px', lg: '400px' }[this.size]
    },
    imageHeight() {
      return { sm: '80px', md: '100px', lg: '150px' }[this.size]
    },
    floatPercent() {
      return this.skin.float != null ? (this.skin.float * 100).toFixed(1) : null
    },
    formattedFloat() {
      return this.skin.float != null ? this.skin.float.toFixed(4) : null
    },
    formattedPrice() {
      if (this.skin.price == null) return '?'
      return this.skin.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    },
    wearDisplay() {
      if (!this.skin.wearState) return null
      if (this.formattedFloat) return `${this.skin.wearState} (${this.formattedFloat})`
      return this.skin.wearState
    },
  },
  methods: {
    handleClick() {
      this.$emit('click', this.skin)
    },
  },
}
</script>

<template>
  <div
    class="cs-skin-card"
    :class="{ selected: selected, selectable: selectable, [`size-${size}`]: true }"
    :style="{
      width: cardWidth,
      borderLeft: `3px solid ${rarityColor}`,
      background: `radial-gradient(circle at -50% 0%, ${rarityColor}33, transparent 80%), #1a1a1a`,
    }"
    @click="handleClick"
  >
    <!-- Image -->
    <div class="cs-skin-image">
      <v-img :src="skin.imageUrl" :height="imageHeight" contain />
    </div>

    <!-- Info -->
    <div class="cs-skin-info">
      <div class="cs-skin-header">
        <span class="cs-skin-name" :title="skin.displayName">{{ skin.displayName }}</span>
        <span v-if="showPrice && size !== 'sm'" class="cs-skin-price">
          {{ formattedPrice }}&nbsp;<span style="color: rgba(255, 255, 255, 0.3)">Flopos</span>
        </span>
      </div>

      <!-- Badges -->
      <div class="cs-skin-badges">
        <v-chip v-if="skin.isStattrak" size="x-small" color="orange" variant="flat">
          StatTrak
        </v-chip>
        <v-chip v-if="skin.isSouvenir" size="x-small" color="#ffd700" variant="flat">
          Souvenir
        </v-chip>
        <v-chip size="x-small" color="transparent" variant="flat"> &nbsp; </v-chip>
      </div>

      <!-- Wear + Float bar -->
      <div v-if="skin.wearState && size !== 'sm'" class="cs-skin-wear">
        <span class="wear-text">{{ wearDisplay }}</span>
        <div v-if="skin.float != null" class="float-bar">
          <div class="float-bar-track">
            <div class="float-bar-marker" :style="{ left: `${floatPercent}%` }"></div>
          </div>
        </div>
      </div>

      <!-- Compact price for sm -->
      <div v-if="showPrice && size === 'sm'" class="cs-skin-price-sm">
        {{ formattedPrice }} <span style="opacity: 0.4">Flopos</span>
      </div>
    </div>

    <!-- Selection overlay -->
    <div v-if="selectable && selected" class="cs-skin-selected-overlay">
      <v-icon color="white" size="24">mdi-check-circle</v-icon>
    </div>
  </div>
</template>

<style scoped>
.cs-skin-card {
  position: relative;
  border-radius: 0 15px 15px 0;
  overflow: hidden;
  cursor: pointer;
  transition: 0.15s;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5em 0.8em;
  outline: 2px solid transparent;
}

.cs-skin-card:hover .cs-skin-image {
  filter: drop-shadow(0 0 10px #dddddd33);
}

.cs-skin-card.selected {
  outline: 3px solid #5865f2;
  outline-offset: -2px;
}

.cs-skin-card.selectable {
  cursor: pointer;
}

.cs-skin-image {
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.2s;
}

.cs-skin-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.cs-skin-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5em;
}

.cs-skin-name {
  font-weight: bold;
  color: #ddd;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
}

.cs-skin-price {
  white-space: nowrap;
  flex-shrink: 0;
}

.cs-skin-price-sm {
  font-size: 0.8em;
  text-align: center;
  color: #ccc;
}

.cs-skin-badges {
  display: flex;
  gap: 0.3rem;
}

.cs-skin-wear {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.wear-text {
  font-size: 0.8em;
  color: #aaa;
}

/* Float bar */
.float-bar {
  width: 100%;
  position: relative;
}

.float-bar-track {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(to right, #4caf50, #8bc34a, #cddc39, #ffeb3b, #ff9800, #f44336);
  position: relative;
}

.float-bar-marker {
  position: absolute;
  top: -3px;
  width: 2px;
  height: 10px;
  background: white;
  border-radius: 1px;
  transform: translateX(-50%);
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);
}

/* Size variants */
.size-sm .cs-skin-name {
  font-size: 0.75em;
}

.size-sm {
  padding: 0.4em 0.5em;
  gap: 0.3rem;
}

.size-lg .cs-skin-name {
  font-size: 1.1em;
}

.size-lg .cs-skin-price {
  font-size: 1.1em;
}

/* Selection overlay */
.cs-skin-selected-overlay {
  position: absolute;
  top: 6px;
  right: 6px;
}
</style>
