<script>
/* global localStorage */
import flapi from '@/services/flapi.js'
import CsSkinCard from '@/components/CsSkinCard.vue'
import HomeBtn from '@/components/HomeBtn.vue'
import CoinsCounter from '@/components/CoinsCounter.vue'
import { useFlopoToasts } from '@/composables/useFlopoToasts.js'
import { getRarityColor } from '@/utils/csRarity.js'
import { formatCoins } from '@/utils/format.js'

// Slot name is derived from marketHashName (before " | "), "knife", or "gloves"
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
  name: 'Loadout',
  components: { CsSkinCard, HomeBtn, CoinsCounter },

  setup() {
    const toasts = useFlopoToasts()
    return {
      ...toasts,
      showSuccessToast: (msg) => toasts.showSuccessOrWarningToast(msg, false),
      showErrorToast: (msg) => toasts.showSuccessOrWarningToast(msg, true),
    }
  },

  data() {
    return {
      discordId: null,
      loadout: [],
      featuredSkins: [],
      inventory: [],
      loading: true,
      processing: false,
      equipProcessingSkinId: null,
      // Slot picker (when clicking an empty slot in the loadout)
      pickerDialog: false,
      pickerSlot: null,
      // Skin detail dialog (when clicking an equipped skin)
      detailDialog: false,
      detailSkin: null,
      // Featured picker
      featuredPickerDialog: false,
      featuredPickerPosition: null,
    }
  },

  computed: {
    WEAPON_CATEGORIES: () => WEAPON_CATEGORIES,

    loadoutValue() {
      return this.loadout.reduce((sum, s) => sum + (s.price || 0), 0)
    },

    // Map slot → equipped skin (derive slot from marketHashName, not stored loadoutSlot,
    // to handle skins equipped before the loadoutSlot fix was deployed)
    equippedBySlot() {
      const map = {}
      for (const s of this.loadout) map[getSkinSlot(s)] = s
      return map
    },

    // Map slot → inventory skins available for that slot
    inventoryBySlot() {
      const map = {}
      for (const s of this.inventory) {
        const slot = getSkinSlot(s)
        if (!map[slot]) map[slot] = []
        map[slot].push(s)
      }
      return map
    },

    // Skins available in the picker (for selected slot)
    pickerSkins() {
      if (!this.pickerSlot) return []
      return this.inventoryBySlot[this.pickerSlot] || []
    },

    featuredSkinSlots() {
      const slots = [null, null, null]
      for (const f of this.featuredSkins) {
        if (f.position >= 1 && f.position <= 3) slots[f.position - 1] = f.csSkin
      }
      return slots
    },

    // Inventory skins sorted by price desc, grouped by slot for display
    inventoryGrouped() {
      const groups = []
      for (const [slot, skins] of Object.entries(this.inventoryBySlot)) {
        groups.push({ slot, skins: [...skins].sort((a, b) => (b.price || 0) - (a.price || 0)) })
      }
      return groups.sort((a, b) => {
        const pa = Math.max(...a.skins.map((s) => s.price || 0))
        const pb = Math.max(...b.skins.map((s) => s.price || 0))
        return pb - pa
      })
    },
  },

  async mounted() {
    const discordId = localStorage.getItem('discordId')
    if (!discordId) {
      this.$router.push('/')
      return
    }
    this.discordId = discordId
    await this.fetchAll()
  },

  methods: {
    getRarityColor,
    formatCoins,
    getSkinSlot,

    async fetchAll() {
      this.loading = true
      try {
        const [loadoutRes, featuredRes, inventoryRes] = await Promise.all([
          flapi.get('/user/' + this.discordId + '/loadout'),
          flapi.get('/user/' + this.discordId + '/featured-skins'),
          flapi.get('/user/' + this.discordId + '/inventory'),
        ])
        this.loadout = loadoutRes.data.loadout || []
        this.featuredSkins = featuredRes.data.featuredSkins || []
        this.inventory = inventoryRes.data.csInventory || []
      } catch (e) {
        console.error('Error fetching loadout:', e)
      }
      this.loading = false
    },

    slotHasInventory(slot) {
      return (this.inventoryBySlot[slot]?.length || 0) > 0
    },

    openSlotPicker(slot) {
      this.pickerSlot = slot
      this.pickerDialog = true
    },

    openSkinDetail(skin) {
      this.detailSkin = skin
      this.detailDialog = true
    },

    async equipSkin(skin) {
      this.equipProcessingSkinId = skin.id
      try {
        await flapi.post('/cs-skin/' + skin.id + '/equip')
        this.showSuccessToast(skin.displayName + ' équipé !')
        this.pickerDialog = false
        await this.fetchAll()
      } catch (e) {
        const msg = e.response?.data?.error || "Erreur lors de l'équipement."
        this.showErrorToast(msg)
      }
      this.equipProcessingSkinId = null
    },

    async equipFromInventory(skin, event) {
      event.stopPropagation()
      this.equipProcessingSkinId = skin.id
      try {
        await flapi.post('/cs-skin/' + skin.id + '/equip')
        this.showSuccessToast(skin.displayName + ' équipé !')
        await this.fetchAll()
      } catch (e) {
        const msg = e.response?.data?.error || "Erreur lors de l'équipement."
        this.showErrorToast(msg)
      }
      this.equipProcessingSkinId = null
    },

    async unequipSkin(skin) {
      this.processing = true
      try {
        await flapi.post('/cs-skin/' + skin.id + '/unequip')
        this.showSuccessToast(skin.displayName + " retiré de l'équipement.")
        this.detailDialog = false
        await this.fetchAll()
      } catch (e) {
        const msg = e.response?.data?.error || 'Erreur lors du retrait.'
        this.showErrorToast(msg)
      }
      this.processing = false
    },

    isFeatured(skin) {
      return this.featuredSkins.some((f) => f.csSkinId === skin.id)
    },

    async toggleFeatured(skin) {
      const entry = this.featuredSkins.find((f) => f.csSkinId === skin.id)
      if (entry) {
        try {
          await flapi.delete('/user/featured-skins/' + entry.position)
          this.showSuccessToast('Retiré des mis en avant.')
          await this.fetchAll()
        } catch {
          this.showErrorToast('Erreur.')
        }
      } else {
        if (this.featuredSkins.length >= 3) {
          this.showErrorToast('Vous avez déjà 3 skins mis en avant.')
          return
        }
        const takenPositions = new Set(this.featuredSkins.map((f) => f.position))
        const freePos = [1, 2, 3].find((p) => !takenPositions.has(p))
        try {
          await flapi.post('/user/featured-skins', { csSkinId: skin.id, position: freePos })
          this.showSuccessToast('Ajouté aux mis en avant !')
          await this.fetchAll()
        } catch (e) {
          this.showErrorToast(e.response?.data?.error || 'Erreur.')
        }
      }
    },

    async removeFeatured(position) {
      try {
        await flapi.delete('/user/featured-skins/' + position)
        await this.fetchAll()
      } catch {
        this.showErrorToast('Erreur.')
      }
    },

    openFeaturedPicker(position) {
      this.featuredPickerPosition = position
      this.featuredPickerDialog = true
    },

    async pickFeatured(skin) {
      try {
        await flapi.post('/user/featured-skins', { csSkinId: skin.id, position: this.featuredPickerPosition })
        this.showSuccessToast('Skin mis en avant !')
        this.featuredPickerDialog = false
        await this.fetchAll()
      } catch (e) {
        this.showErrorToast(e.response?.data?.error || 'Erreur.')
      }
    },
  },
}
</script>

<template>
  <CoinsCounter />

  <v-layout class="w-100">
    <v-main class="d-flex pt-16" style="min-height: 100vh">
      <div class="loadout-page w-100">

        <!-- Header -->
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
          <div>
            <h1 style="font-size: 1.6em">Équipement</h1>
            <div class="text-grey" style="font-size: 0.9em">
              Valeur :
              <span class="text-white font-weight-bold">{{ formatCoins(loadoutValue) }}</span>
              <span style="opacity: 0.4"> Flopos</span>
            </div>
          </div>
          <v-btn variant="tonal" size="small" prepend-icon="mdi-package-variant" @click="$router.push('/inventory')">
            Inventaire
          </v-btn>
        </div>

        <v-skeleton-loader v-if="loading" type="card,card,card" />

        <template v-else>

          <!-- ── Featured Skins ───────────────────────────────────────── -->
          <div class="section-label">
            <v-icon size="14" class="mr-1">mdi-star</v-icon>
            Skins mis en avant
            <span class="text-caption ml-1 ">(visibles dans le classement)</span>
          </div>
          <div class="d-flex ga-3 flex-wrap mb-6">
            <div v-for="pos in [1, 2, 3]" :key="pos">
              <template v-if="featuredSkinSlots[pos - 1]">
                <div class="featured-slot filled" :style="{ borderColor: getRarityColor(featuredSkinSlots[pos - 1].rarity) }">
                  <v-img :src="featuredSkinSlots[pos - 1].imageUrl" width="70" contain />
                  <div class="text-caption text-truncate px-1" style="max-width: 110px">
                    {{ featuredSkinSlots[pos - 1].displayName }}
                  </div>
                  <v-btn icon="mdi-close" size="x-small" variant="text" color="red" class="remove-featured-btn" @click="removeFeatured(pos)" />
                </div>
              </template>
              <template v-else>
                <div class="featured-slot empty" @click="openFeaturedPicker(pos)">
                  <v-icon size="28" color="rgba(255,255,255,0.2)">mdi-plus</v-icon>
                  <div class="text-caption ">Slot {{ pos }}</div>
                </div>
              </template>
            </div>
          </div>

          <!-- ── Loadout ─────────────────────────────────────────────── -->
          <div class="section-label mb-3">
            <v-icon size="14" class="mr-1">mdi-shield-half-full</v-icon>
            Loadout
          </div>

          <div class="d-flex flex-wrap justify-space-between ga-6" style="row-gap: 0 !important;">
            <div v-for="cat in WEAPON_CATEGORIES" :key="cat.label" class="mb-2">
              <div class="category-label">{{ cat.label }}</div>
              <div class="d-flex flex-wrap justify-space-between ga-1">
                <div
                  v-for="slot in cat.slots"
                  :key="slot"
                  class="weapon-slot"
                  :class="{
                    equipped: !!equippedBySlot[slot],
                    available: !equippedBySlot[slot] && slotHasInventory(slot),
                    empty: !equippedBySlot[slot] && !slotHasInventory(slot),
                  }"
                  :style="equippedBySlot[slot] ? { borderColor: getRarityColor(equippedBySlot[slot].rarity) } : {}"
                  @click="equippedBySlot[slot] ? openSkinDetail(equippedBySlot[slot]) : slotHasInventory(slot) ? openSlotPicker(slot) : null"
                >
                  <template v-if="equippedBySlot[slot]">
                    <v-img :src="equippedBySlot[slot].imageUrl" width="60" contain />
                    <div class="slot-name text-truncate">{{ equippedBySlot[slot].displayName }}</div>
                    <div class="slot-price">
                      {{ formatCoins(equippedBySlot[slot].price || 0) }}
                      <v-icon size="9">mdi-circle-multiple</v-icon>
                    </div>
                    <v-icon v-if="isFeatured(equippedBySlot[slot])" class="featured-star" size="13" color="amber">mdi-star</v-icon>
                  </template>
                  <template v-else>
                    <v-icon size="20" :color="slotHasInventory(slot) ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.12)'">
                      {{ slotHasInventory(slot) ? 'mdi-plus' : 'mdi-minus' }}
                    </v-icon>
                    <div class="slot-weapon-name">{{ slot }}</div>
                  </template>
                </div>
              </div>
            </div>
          </div>

          

          <!-- ── Inventory ───────────────────────────────────────────── -->
          <template v-if="inventory.length > 0">
            <v-divider class="my-6" />
            <div class="section-label mb-3">
              <v-icon size="14" class="mr-1">mdi-package-variant</v-icon>
              Inventaire
              <span class="text-caption  ml-1">({{ inventory.length }} skins disponibles)</span>
            </div>
            <div class="mb-4 w-100">
              <div class="d-flex flex-wrap ga-1">
                <div
                  v-for="skin in inventory"
                  :key="skin.id"
                  class="inventory-skin-wrapper"
                >
                  <CsSkinCard :skin="skin" size="sm" :show-price="true" />
                  <v-btn
                    class="equip-overlay-btn"
                    size="x-small"
                    variant="flat"
                    color="#1a1a1a"
                    prepend-icon="mdi-shield-half-full"
                    :loading="equipProcessingSkinId === skin.id"
                    @click="equipFromInventory(skin, $event)"
                  >
                    Équiper
                  </v-btn>
                </div>
              </div>
            </div>
          </template>

          <!-- Empty state -->
          <v-card v-if="loadout.length === 0 && inventory.length === 0" class="pa-8 text-center mt-4" variant="text">
            <v-icon size="48" color="rgba(255,255,255,0.2)" class="mb-3">mdi-package-variant-closed</v-icon>
            <div class="text-body-1 ">Votre inventaire est vide.</div>
            <v-btn class="mt-4" variant="outlined" @click="$router.push('/cases')">Ouvrir des caisses</v-btn>
          </v-card>

        </template>
      </div>
    </v-main>
    <home-btn />
  </v-layout>

  <!-- Skin detail dialog -->
  <v-dialog v-model="detailDialog" max-width="420">
    <v-card v-if="detailSkin" class="pa-4">
      <div class="d-flex align-center justify-space-between mb-3">
        <span class="text-subtitle-1 font-weight-bold">{{ detailSkin.displayName }}</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="detailDialog = false" />
      </div>
      <CsSkinCard :skin="detailSkin" size="md" :show-price="true" class="mx-auto" />
      <div class="d-flex ga-2 mt-4 justify-end">
        <v-btn
          :color="isFeatured(detailSkin) ? 'amber' : 'default'"
          :prepend-icon="isFeatured(detailSkin) ? 'mdi-star' : 'mdi-star-outline'"
          variant="outlined"
          size="small"
          @click="toggleFeatured(detailSkin)"
        >
          {{ isFeatured(detailSkin) ? 'Retirer des mis en avant' : 'Mettre en avant' }}
        </v-btn>
        <v-btn
          color="red"
          variant="tonal"
          size="small"
          prepend-icon="mdi-shield-off"
          :loading="processing"
          @click="unequipSkin(detailSkin)"
        >
          Déséquiper
        </v-btn>
      </div>
    </v-card>
  </v-dialog>

  <!-- Slot picker dialog (click on empty loadout slot) -->
  <v-dialog v-model="pickerDialog" max-width="700" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Équiper — {{ pickerSlot }}</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="pickerDialog = false" />
      </v-card-title>
      <v-card-text>
        <div v-if="pickerSkins.length === 0" class="text-center  py-8">
          Aucun skin disponible pour cet emplacement.
        </div>
        <div v-else class="d-flex flex-wrap ga-3 justify-center">
          <div v-for="skin in pickerSkins" :key="skin.id" class="picker-item" @click="equipSkin(skin)">
            <CsSkinCard :skin="skin" size="sm" :show-price="true" />
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Featured skin picker dialog -->
  <v-dialog v-model="featuredPickerDialog" max-width="700" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Choisir un skin mis en avant (slot {{ featuredPickerPosition }})</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="featuredPickerDialog = false" />
      </v-card-title>
      <v-card-text>
        <div v-if="loadout.length === 0" class="text-center  py-8">
          Équipez des skins d'abord pour les mettre en avant.
        </div>
        <div v-else class="d-flex flex-wrap ga-3 justify-center">
          <div v-for="skin in loadout" :key="skin.id" class="picker-item" @click="pickFeatured(skin)">
            <CsSkinCard :skin="skin" size="sm" :show-price="true" />
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.loadout-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1em;
}

.section-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.category-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 6px;
}

/* Weapon slot */
.weapon-slot {
  width: 100px;
  min-height: 100px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px;
  gap: 3px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.15s, background 0.15s;
}

.weapon-slot.equipped {
  cursor: pointer;
  border-width: 1px;
}
.weapon-slot.equipped:hover {
  background: rgba(255, 255, 255, 0.07);
}

.weapon-slot.available {
  cursor: pointer;
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.25);
}
.weapon-slot.available:hover {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.05);
}

.weapon-slot.empty {
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.06);
}

.slot-name {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.65);
  width: 100%;
  text-align: center;
  max-width: 90px;
}

.slot-price {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  gap: 2px;
}

.slot-weapon-name {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.25);
  text-align: center;
  padding: 0 4px;
}

.featured-star {
  position: absolute;
  top: 4px;
  right: 4px;
}

/* Featured slots */
.featured-slot {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.featured-slot.filled {
  border: 1px solid;
  background: rgba(255, 255, 255, 0.04);
}
.featured-slot.empty {
  border: 1px dashed rgba(255, 255, 255, 0.15);
  cursor: pointer;
  gap: 4px;
  transition: border-color 0.15s;
}
.featured-slot.empty:hover {
  border-color: rgba(255, 255, 255, 0.35);
}
.remove-featured-btn {
  position: absolute;
  top: 2px;
  right: 2px;
}

/* Inventory section */
.inventory-skin-wrapper {
  position: relative;
}

.equip-overlay-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 2;
  text-transform: none;
}

.inventory-skin-wrapper:hover .equip-overlay-btn {
  opacity: 1;
}

.picker-item {
  cursor: pointer;
  border-radius: 8px;
  transition: transform 0.15s;
}
.picker-item:hover {
  transform: scale(1.03);
}
</style>
