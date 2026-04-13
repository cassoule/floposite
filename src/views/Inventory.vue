<script>
/* global localStorage */
import flapi from '@/services/flapi.js'
import CsSkinCard from '@/components/CsSkinCard.vue'
import CoinsCounter from '@/components/CoinsCounter.vue'
import { useFlopoToasts } from '@/composables/useFlopoToasts.js'
import { getRarityColor, TRADE_UP_LADDER } from '@/utils/csRarity.js'
import HomeBtn from '@/components/HomeBtn.vue'
import { formatCoins } from '@/utils/format.js'

export default {
  name: 'Inventory',
  components: { CsSkinCard, CoinsCounter, HomeBtn },

  setup() {
    const toasts = useFlopoToasts()
    return {
      ...toasts,
      showSuccessToast: (message) => toasts.showSuccessOrWarningToast(message, false),
      showErrorToast: (message) => toasts.showSuccessOrWarningToast(message, true),
    }
  },

  data() {
    return {
      discordId: null,
      csInventory: [],
      selectedSkins: [],
      loading: true,
      sellProcessing: false,
      sellConfirmDialog: false,
      equipProcessingSkinId: null,
      filterRarity: null,
      filterWeaponType: null,
      filterStattrak: false,
      filterSouvenir: false,
      sortBy: 'price',
      sortDesc: true,
    }
  },

  computed: {
    rarityOptions() {
      const rarities = [...new Set(this.csInventory.map((s) => s.rarity))].filter(Boolean)
      return TRADE_UP_LADDER.filter((r) => rarities.includes(r))
    },
    weaponTypeOptions() {
      return [...new Set(this.csInventory.map((s) => s.weaponType))].filter(Boolean).sort()
    },
    filteredAndSortedSkins() {
      let result = [...this.csInventory]
      if (this.filterRarity !== null) result = result.filter((s) => s.rarity === this.filterRarity)
      if (this.filterWeaponType !== null)
        result = result.filter((s) => s.weaponType === this.filterWeaponType)
      if (this.filterStattrak) result = result.filter((s) => s.isStattrak === this.filterStattrak)
      if (this.filterSouvenir) result = result.filter((s) => s.isSouvenir === this.filterSouvenir)
      result.sort((a, b) => {
        const valA = a[this.sortBy] ?? 0
        const valB = b[this.sortBy] ?? 0
        return this.sortDesc ? valB - valA : valA - valB
      })
      return result
    },
    selectedIds() {
      return new Set(this.selectedSkins.map((s) => s.id))
    },
    selectedTotal() {
      return this.selectedSkins.reduce((sum, s) => sum + (s.price || 0), 0)
    },
    formattedSelectedTotal() {
      return formatCoins(this.selectedTotal.toFixed(0))
    },
    inventoryValue() {
      return this.csInventory.reduce((sum, s) => sum + (s.price || 0), 0)
    },
    formattedInventoryValue() {
      return formatCoins(this.inventoryValue.toFixed(0))
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

    async fetchInventory() {
      this.loading = true
      try {
        const response = await flapi.get('/user/' + this.discordId + '/inventory')
        this.csInventory = response.data.csInventory || []
      } catch (e) {
        console.error('flAPI error:', e)
      }
      this.loading = false
    },

    toggleSkin(skin) {
      const index = this.selectedSkins.findIndex((s) => s.id === skin.id)
      if (index >= 0) {
        this.selectedSkins.splice(index, 1)
      } else {
        this.selectedSkins.push(skin)
      }
    },

    selectAll() {
      this.selectedSkins = [...this.filteredAndSortedSkins]
    },

    clearSelection() {
      this.selectedSkins = []
    },

    async handleBatchSell() {
      this.sellProcessing = true
      let successCount = 0
      let failCount = 0
      for (const skin of this.selectedSkins) {
        try {
          await flapi.post('/cs-skin/' + skin.id + '/instant-sell')
          successCount++
        } catch (e) {
          console.error('Sell error for skin ' + skin.id, e)
          failCount++
        }
      }
      this.sellConfirmDialog = false
      this.selectedSkins = []
      await this.fetchInventory()
      if (failCount === 0) {
        this.showSuccessToast(successCount + ' skin(s) vendu(s)')
      } else {
        this.showErrorToast(successCount + ' vendu(s), ' + failCount + ' erreur(s)')
      }
      this.sellProcessing = false
    },

    clearFilters() {
      this.filterRarity = null
      this.filterWeaponType = null
      this.filterStattrak = false
      this.filterSouvenir = false
    },

    async equipSkin(skin, event) {
      event.stopPropagation()
      this.equipProcessingSkinId = skin.id
      try {
        await flapi.post('/cs-skin/' + skin.id + '/equip')
        this.showSuccessToast(skin.displayName + ' équipé !')
        await this.fetchInventory()
      } catch (e) {
        const msg = e.response?.data?.error || "Erreur lors de l'équipement."
        this.showErrorToast(msg)
      }
      this.equipProcessingSkinId = null
    },
  },
}
</script>

<template>
  <CoinsCounter />

  <v-layout class="w-100">
    <v-main class="d-flex pt-16" style="min-height: 100vh">
      <div class="inventory-page w-100">
        <!-- Header -->
        <div class="d-flex align-center ga-4 flex-wrap mb-4 align-baseline">
          <h1 style="font-size: 1.6em">Inventaire</h1>
          <span class="text-grey" style="font-size: 0.9em"> {{ csInventory.length }} skins </span>
          <span v-if="inventoryValue" class="text-grey" style="font-size: 0.9em">
            {{ formattedInventoryValue }}
            <span style="opacity: 0.4">Flopos</span>
          </span>
          <v-btn
            variant="outlined"
            size="small"
            prepend-icon="mdi-shield-half-full"
            class="ml-2"
            @click="$router.push('/loadout')"
          >
            Équipement
          </v-btn>
        </div>

        <!-- Toolbar -->
        <div class="toolbar">
          <v-select
            v-model="filterRarity"
            label="Rareté"
            :items="rarityOptions"
            clearable
            density="compact"
            rounded="lg"
            variant="outlined"
            hide-details
            class="filter-select"
          >
            <template #item="{ item, props: itemProps }">
              <v-list-item v-bind="itemProps">
                <template #prepend>
                  <div class="rarity-dot" :style="{ background: getRarityColor(item.value) }"></div>
                </template>
              </v-list-item>
            </template>
          </v-select>

          <v-select
            v-model="filterWeaponType"
            label="Type d'arme"
            :items="weaponTypeOptions"
            clearable
            rounded="lg"
            density="compact"
            variant="outlined"
            hide-details
            class="filter-select mr-3"
          />

          <div class="d-flex">
            <v-chip-group filter v-model="filterStattrak">
              <v-chip text="StatTrak" :value="true"></v-chip>
            </v-chip-group>
            <v-chip-group filter v-model="filterSouvenir" class="mr-3">
              <v-chip text="Souvenir" :value="true"></v-chip>
            </v-chip-group>
          </div>

          <v-spacer />

          <v-btn
            :disabled="!(filterRarity || filterWeaponType || filterStattrak || filterSouvenir)"
            rounded="lg"
            variant="text"
            size="small"
            class="text-none"
            @click="clearFilters"
          >
            Réinitialiser
          </v-btn>

          <v-btn
            text="Trade Up"
            class="text-none"
            append-icon="mdi-swap-vertical"
            color="primary"
            variant="flat"
            rounded="lg"
            style="border-radius: 10px !important"
            @click="$router.push('/trade-up')"
          />

          <div class="d-flex">
            <v-btn-toggle
              v-model="sortBy"
              mandatory
              rounded="lg"
              variant="tonal"
              density="compact"
              color="primary"
            >
              <v-btn value="price" size="small" class="text-none text-secondary">Prix</v-btn>
              <v-btn value="float" size="small" class="text-none text-secondary">Float</v-btn>
            </v-btn-toggle>

            <v-btn icon variant="text" size="small" @click="sortDesc = !sortDesc">
              <v-icon>{{ sortDesc ? 'mdi-sort-descending' : 'mdi-sort-ascending' }}</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- Selection bar -->
        <v-slide-y-transition>
          <div v-if="selectedSkins.length > 0" class="selection-bar">
            <span class="text-body-2">
              <strong>{{ selectedSkins.length }}</strong> skin(s) sélectionné(s)
            </span>
            <span class="text-body-2">
              Total : <strong>{{ formattedSelectedTotal }}</strong>
              <span style="opacity: 0.4"> Flopos</span>
            </span>
            <v-spacer />
            <v-btn variant="text" rounded="lg" size="small" class="text-none" @click="selectAll">
              Tout sélectionner
            </v-btn>
            <v-btn
              variant="text"
              rounded="lg"
              size="small"
              class="text-none"
              @click="clearSelection"
            >
              Désélectionner
            </v-btn>
            <v-btn
              color="red"
              variant="flat"
              size="small"
              rounded="lg"
              class="text-none"
              @click="sellConfirmDialog = true"
            >
              Vendre ({{ formattedSelectedTotal }} Flopos)
            </v-btn>
          </div>
        </v-slide-y-transition>

        <!-- Loading -->
        <div v-if="loading" class="d-flex justify-center pt-16">
          <v-progress-circular indeterminate color="primary" size="48" />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="filteredAndSortedSkins.length === 0"
          class="text-center pt-16 pb-16 text-grey"
        >
          <v-icon size="48" class="mb-4" style="opacity: 0.3">mdi-package-variant</v-icon>
          <p v-if="csInventory.length === 0">Aucun skin CS2 dans l'inventaire</p>
          <p v-else>Aucun skin ne correspond aux filtres</p>
        </div>

        <!-- Skin grid -->
        <div v-else class="inventory-grid w-100">
          <div
            v-for="skin in filteredAndSortedSkins"
            :key="skin.id"
            class="skin-card-wrapper w-100"
          >
            <CsSkinCard
              class="w-100"
              :skin="skin"
              size="md"
              :show-price="true"
              :selectable="true"
              :selected="selectedIds.has(skin.id)"
              @click="toggleSkin(skin)"
            />
            <v-btn
              class="equip-btn"
              size="x-small"
              variant="flat"
              color="#2a2a2a"
              prepend-icon="mdi-shield-half-full"
              :loading="equipProcessingSkinId === skin.id"
              @click="equipSkin(skin, $event)"
            >
              Équiper
            </v-btn>
          </div>
        </div>
      </div>
    </v-main>
    <home-btn />
  </v-layout>

  <!-- Sell confirmation dialog -->
  <v-dialog v-model="sellConfirmDialog" max-width="450" scrim="#181818">
    <v-card color="#1A1A1A" rounded="xl">
      <v-card-title class="pt-5 px-6">Confirmer la vente</v-card-title>
      <v-card-text class="px-6">
        Vendre <strong>{{ selectedSkins.length }}</strong> skin(s) pour
        <strong>{{ formattedSelectedTotal }}</strong> Flopos ?
      </v-card-text>
      <v-card-actions class="pa-4 d-flex ga-2">
        <v-spacer />
        <v-btn
          variant="tonal"
          color="secondary"
          rounded="lg"
          class="text-none"
          :disabled="sellProcessing"
          @click="sellConfirmDialog = false"
        >
          Annuler
        </v-btn>
        <v-btn
          color="red"
          variant="flat"
          rounded="lg"
          class="text-none"
          :loading="sellProcessing"
          @click="handleBatchSell"
        >
          Confirmer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.inventory-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1em;
}

.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 12px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 0.75em;
  flex-wrap: wrap;
  margin-bottom: 1em;
}

.filter-select {
  max-width: 200px;
  min-width: 150px;
}

.rarity-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 4px;
}

.selection-bar {
  display: flex;
  align-items: center;
  gap: 1em;
  padding: 0.6em 1em;
  background: #2a2a2a;
  border-radius: 12px;
  margin-bottom: 1em;
  flex-wrap: wrap;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 0.75em;
}

.skin-card-wrapper {
  position: relative;
}

.equip-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 2;
  text-transform: none;
}

.skin-card-wrapper:hover .equip-btn {
  opacity: 1;
}

@media (max-width: 550px) {
  .filter-select {
    max-width: 100%;
    min-width: 100%;
  }

  .inventory-grid {
    grid-template-columns: 1fr;
  }
}
</style>
