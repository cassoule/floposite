<script>
/* global localStorage, setTimeout */
import axios from 'axios'
import CoinsCounter from '@/components/CoinsCounter.vue'
import CsSkinCard from '@/components/CsSkinCard.vue'
import { getRarityColor, TRADE_UP_LADDER, getNextRarity, canTradeUp } from '@/utils/csRarity.js'

export default {
  components: {
    CoinsCounter,
    CsSkinCard,
  },
  data() {
    return {
      discordId: null,
      csInventory: [],
      selectedSkins: [],
      selectedRarity: null,
      resultSkin: null,
      loading: true,
      processing: false,
      tradeUpResultDialog: false,
      TRADE_UP_LADDER,
    }
  },
  computed: {
    filteredSkins() {
      if (!this.selectedRarity || !this.csInventory) return []
      const selectedIds = new Set(this.selectedSkins.map((s) => s.id))
      return this.csInventory.filter(
        (s) => s.rarity === this.selectedRarity && !selectedIds.has(s.id),
      )
    },
    nextRarity() {
      return this.selectedRarity ? getNextRarity(this.selectedRarity) : null
    },
    canSubmit() {
      return (
        this.selectedSkins.length === 10 &&
        this.selectedRarity &&
        canTradeUp(this.selectedRarity) &&
        !this.processing
      )
    },
  },
  async mounted() {
    const discordId = localStorage.getItem('discordId')
    if (!discordId) {
      this.$router.push('/')
      return
    }
    this.discordId = discordId
    await this.fetchInventory()
  },
  methods: {
    getRarityColor,
    canTradeUp,
    async fetchInventory() {
      this.loading = true
      try {
        const response = await axios.get(
          import.meta.env.VITE_FLAPI_URL + '/user/' + this.discordId + '/inventory',
        )
        this.csInventory = response.data.csInventory || []
      } catch (e) {
        console.error('flAPI error:', e)
      }
      this.loading = false
    },
    setRarityFilter(rarity) {
      if (!canTradeUp(rarity)) return
      this.selectedRarity = rarity
      this.selectedSkins = []
    },
    toggleSkin(skin) {
      const index = this.selectedSkins.findIndex((s) => s.id === skin.id)
      if (index >= 0) {
        this.selectedSkins.splice(index, 1)
      } else if (this.selectedSkins.length < 10) {
        this.selectedSkins.push(skin)
      }
    },
    removeSkin(skin) {
      const index = this.selectedSkins.findIndex((s) => s.id === skin.id)
      if (index >= 0) {
        this.selectedSkins.splice(index, 1)
      }
    },
    async submitTradeUp() {
      if (!this.canSubmit) return
      this.processing = true
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/trade-up', {
          skinIds: this.selectedSkins.map((s) => s.id),
        })
        console.log(response)
        this.resultSkin = response.data.skin
        this.tradeUpResultDialog = true
        this.selectedSkins = []
        await this.fetchInventory()
      } catch (e) {
        console.error('Trade-up error:', e)
      }
      this.processing = false
    },
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms))
    },
  },
}
</script>

<template>
  <CoinsCounter />
  <v-layout class="w-100">
    <v-main
      class="d-flex flex-column align-center pt-16 px-4"
      style="max-width: 1200px; margin: 0 auto"
    >
      <h1 class="mb-6">Trade Up Contract</h1>

      <!-- Rarity Ladder -->
      <div class="rarity-ladder mb-6">
        <div
          v-for="(rarity, index) in TRADE_UP_LADDER"
          :key="rarity"
          class="rarity-step"
          :class="{
            active: rarity === selectedRarity,
            next: rarity === nextRarity,
            disabled: !canTradeUp(rarity),
          }"
          :style="{
            borderColor: getRarityColor(rarity),
            background:
              rarity === selectedRarity
                ? getRarityColor(rarity) + '33'
                : rarity === nextRarity
                  ? getRarityColor(rarity) + '15'
                  : 'transparent',
          }"
          @click="canTradeUp(rarity) ? setRarityFilter(rarity) : null"
        >
          <span class="rarity-dot" :style="{ background: getRarityColor(rarity) }"></span>
          <span class="rarity-label">{{ rarity }}</span>
          <span
            v-if="csInventory.filter((s) => s.rarity === rarity).length > 0"
            class="rarity-count"
          >
            {{ csInventory.filter((s) => s.rarity === rarity).length }}
          </span>
          <v-icon v-if="index < TRADE_UP_LADDER.length - 1" class="rarity-arrow" size="16">
            mdi-chevron-right
          </v-icon>
        </div>
      </div>

      <!-- Selected Skins Slots -->
      <div v-if="selectedRarity" class="mb-4 w-100">
        <div class="d-flex justify-space-between align-center mb-3">
          <h3>
            {{ selectedSkins.length }} / 10 skins
            <span style="opacity: 0.5; font-size: 0.85em"
              >{{ selectedRarity }}&nbsp;({{
                selectedSkins.reduce((sum, s) => sum + s.price, 0)
              }}
              Flopos)</span
            >
          </h3>
          <div v-if="nextRarity" class="d-flex align-center ga-2">
            <v-icon size="18">mdi-arrow-right</v-icon>
            <v-chip :color="getRarityColor(nextRarity)" size="small" variant="flat">
              {{ nextRarity }}
            </v-chip>
          </div>
        </div>

        <div class="selected-grid mb-4">
          <div
            v-for="i in 10"
            :key="'slot-' + i"
            class="trade-slot"
            :style="{
              borderColor: selectedSkins[i - 1] ? getRarityColor(selectedRarity) : '#333',
            }"
          >
            <CsSkinCard
              v-if="selectedSkins[i - 1]"
              :skin="selectedSkins[i - 1]"
              :show-price="true"
              size="sm"
              class="w-100"
              style="border-left: none !important; border-radius: 15px !important"
              @click="removeSkin(selectedSkins[i - 1])"
            />
            <div v-else class="empty-slot">
              <span style="opacity: 0.3">{{ i }}</span>
            </div>
          </div>
        </div>

        <div class="d-flex justify-center mb-6">
          <v-btn
            :disabled="!canSubmit"
            :loading="processing"
            color="primary"
            rounded="lg"
            size="large"
            class="text-none px-8"
            @click="submitTradeUp"
          >
            Trade Up
          </v-btn>
        </div>
      </div>

      <!-- Available Skins Grid -->
      <div v-if="selectedRarity" class="w-100">
        <h3 class="mb-3">
          Skins disponibles
          <span style="opacity: 0.5; font-size: 0.85em">({{ filteredSkins.length }})</span>
        </h3>
        <div v-if="filteredSkins.length > 0" class="available-grid">
          <CsSkinCard
            v-for="skin in filteredSkins"
            :key="skin.id"
            :skin="skin"
            size="sm"
            :selectable="true"
            class="w-100"
            :selected="selectedSkins.some((s) => s.id === skin.id)"
            @click="toggleSkin(skin)"
          />
        </div>
        <p v-else class="text-center py-8" style="opacity: 0.5">
          Aucun skin de cette rareté dans l'inventaire
        </p>
      </div>

      <!-- No rarity selected state -->
      <div v-else-if="!loading" class="text-center py-12" style="opacity: 0.5">
        <v-icon size="48" class="mb-4">mdi-arrow-up-bold-circle-outline</v-icon>
        <p>Sélectionnez une rareté ci-dessus pour commencer</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular :size="50" width="10" color="primary" indeterminate />
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

  <!-- Trade Up Result Dialog -->
  <v-dialog v-model="tradeUpResultDialog" class="modals" width="500" scrim="#181818">
    <v-card
      v-if="resultSkin"
      color="#1A1A1A"
      rounded="xl"
      class="overflow-hidden"
      style="position: relative"
    >
      <!-- Glow Background -->
      <div
        class="glow-bg"
        :style="`background: radial-gradient(circle, ${getRarityColor(resultSkin.rarity)} 0%, transparent 100%);`"
      ></div>

      <v-card-item class="w-100 px-10 pt-8 pb-0">
        <div
          v-motion
          :initial="{ opacity: 0, scale: 0.5, y: 50 }"
          :enter="{
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 250, damping: 15, mass: 1 },
          }"
          class="mb-4 relative-container w-100"
          style="display: flex; justify-content: center"
        >
          <v-img
            :src="resultSkin.imageUrl"
            width="100%"
            height="20vh"
            max-height="250px"
            style="filter: drop-shadow(0 0 5px #333)"
          />
        </div>
      </v-card-item>

      <v-card-item
        class="result-card-item w-100 d-flex flex-column align-center justify-center pt-0 pb-6 text-center"
        style="z-index: 2"
      >
        <!-- Title -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :enter="{ opacity: 1, y: 0, transition: { delay: 300, duration: 500 } }"
          class="w-100"
        >
          <h2 class="w-100 text-h5 font-weight-bold text-white mb-1">
            {{ resultSkin.displayName }}
          </h2>
          <p class="text-grey" style="font-size: 0.9em">{{ resultSkin.weaponType }}</p>
        </div>

        <!-- Badges -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 10 }"
          :enter="{ opacity: 1, y: 0, transition: { delay: 400, duration: 400 } }"
          class="d-flex justify-center ga-2 mt-2"
        >
          <v-chip v-if="resultSkin.isStattrak" color="orange" size="small" variant="flat">
            StatTrak
          </v-chip>
          <v-chip v-if="resultSkin.isSouvenir" color="#ffd700" size="small" variant="flat">
            Souvenir
          </v-chip>
          <v-chip :color="getRarityColor(resultSkin.rarity)" size="small" variant="flat">
            {{ resultSkin.rarity }}
          </v-chip>
          <v-chip size="small" variant="flat">
            {{ resultSkin.wearState }}
          </v-chip>
        </div>

        <!-- Stats Row -->
        <v-row class="w-100 mt-1 mx-0">
          <v-col cols="6" class="text-center">
            <div
              v-motion
              :initial="{ opacity: 0, scale: 0.8 }"
              :enter="{ opacity: 1, scale: 1, transition: { delay: 600, duration: 400 } }"
            >
              <p class="text-caption text-uppercase text-grey">Float</p>
              <p class="text-h6 font-weight-bold" style="font-size: 1.2em !important">
                {{ resultSkin.float?.toFixed(4) }}
              </p>
            </div>
          </v-col>
          <v-col cols="6" class="text-center">
            <div
              v-motion
              :initial="{ opacity: 0, scale: 0.8 }"
              :enter="{ opacity: 1, scale: 1, transition: { delay: 700, duration: 400 } }"
            >
              <p class="text-caption text-uppercase text-grey">Valeur</p>
              <div class="text-h6 font-weight-bold" style="font-size: 1.2em !important">
                {{ resultSkin.price }}
                <span class="font-weight-thin" style="font-size: 0.9em">Flopos</span>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Float Bar -->
        <div
          v-if="resultSkin.float != null"
          v-motion
          :initial="{ opacity: 0 }"
          :enter="{ opacity: 1, transition: { delay: 800, duration: 500 } }"
          class="w-100 mt-3 px-4"
        >
          <div class="float-bar-track">
            <div class="float-bar-marker" :style="{ left: `${resultSkin.float * 100}%` }"></div>
          </div>
        </div>
      </v-card-item>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-btn
          variant="tonal"
          color="secondary"
          rounded="lg"
          class="px-4"
          @click="$router.push('/akhy/' + discordId)"
        >
          Voir l'inventaire
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          variant="tonal"
          color="secondary"
          rounded="lg"
          class="px-6"
          @click="tradeUpResultDialog = false"
        >
          Fermer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Float bar */
.float-bar-track {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(to right, #4caf50, #8bc34a, #cddc39, #ffeb3b, #ff9800, #f44336);
  position: relative;
}

.float-bar-marker {
  position: absolute;
  top: -4px;
  width: 2px;
  height: 12px;
  background: white;
  border-radius: 1px;
  transform: translateX(-50%);
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
}

.result-card-item :deep(.v-card-item__content) {
  width: 100%;
}

.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 12px;
}

.rarity-ladder {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.rarity-step {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.8rem;
  border: 1px solid #333;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.rarity-step.next {
  border-style: dashed;
}

.rarity-step.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.rarity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.rarity-label {
  font-size: 0.8em;
  white-space: nowrap;
}

.rarity-count {
  font-size: 0.75em;
  opacity: 0.6;
  background: #ffffff15;
  padding: 0 0.4em;
  border-radius: 4px;
}

.rarity-arrow {
  opacity: 0.3;
}

.selected-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.1rem;
}

@media (max-width: 800px) {
  .selected-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.trade-slot {
  border: 2px dashed #333;
  border-radius: 10px;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}

.empty-slot {
  font-size: 1.5em;
  font-weight: bold;
}

.available-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.5rem;
  padding-bottom: 2rem;
}

.glow-bg {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  opacity: 0.3;
  filter: blur(50px);
  pointer-events: none;
  z-index: 0;
  border-radius: 50%;
}

.result-float {
  animation: float 4s ease-in-out infinite;
  animation-delay: 1.2s;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

:deep(.v-overlay__content) {
  overflow: visible !important;
}
</style>
