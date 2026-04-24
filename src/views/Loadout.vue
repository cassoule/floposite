<script>
/* global localStorage */
import flapi from '@/services/flapi.js'
import CsSkinCard from '@/components/CsSkinCard.vue'
import HomeBtn from '@/components/HomeBtn.vue'
import CoinsCounter from '@/components/CoinsCounter.vue'
import { useFlopoToasts } from '@/composables/useFlopoToasts.js'
import { getRarityColor } from '@/utils/csRarity.js'
import { formatCoins } from '@/utils/format.js'
import {
  LOADOUT_STRUCTURE,
  SIDES,
  SIDE_LABELS,
  getCategoryForSkin,
  getWeaponKey,
  isWeaponAllowedOnSide,
  buildLoadoutSlot,
  parseLoadoutSlot,
  getSlotsForSide,
  getEligibleSlotsForSkin,
} from '@/utils/csLoadout.js'

function categoryLabel(category) {
  return LOADOUT_STRUCTURE.find((s) => s.category === category)?.label || category
}

// Keep in sync with `LOADOUT_LOCK_HOURS` / `UNLOCK_TIME_RATE` in
// `flopobot_v2/src/services/csSkin.service.js`.
const LOADOUT_LOCK_HOURS = 24
const LOADOUT_LOCK_MS = LOADOUT_LOCK_HOURS * 60 * 60 * 1000
const UNLOCK_TIME_RATE = 0.2

function getLockRemainingMs(skin, now = Date.now()) {
  if (!skin?.loadoutEquippedAt) return 0
  const equippedAt = new Date(skin.loadoutEquippedAt).getTime()
  return Math.max(0, LOADOUT_LOCK_MS - (now - equippedAt))
}

function computeUnlockCost(skin, now = Date.now()) {
  const remainingMs = getLockRemainingMs(skin, now)
  if (remainingMs <= 0) return 0
  const currentPrice = skin?.price ?? 0
  const equippedPrice = skin?.loadoutEquippedPrice ?? currentPrice
  const timeComponent = currentPrice * UNLOCK_TIME_RATE * (remainingMs / LOADOUT_LOCK_MS)
  const gainComponent = Math.max(0, currentPrice - equippedPrice)
  return Math.max(1, Math.round(timeComponent + gainComponent))
}

function formatLockRemaining(ms) {
  if (ms <= 0) return ''
  const totalMinutes = Math.ceil(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function slotDisplayName(slot) {
  const parsed = parseLoadoutSlot(slot)
  if (!parsed) return slot
  const cat = categoryLabel(parsed.category)
  const structure = LOADOUT_STRUCTURE.find((s) => s.category === parsed.category)
  const side = (SIDE_LABELS[parsed.side] || parsed.side).replace('Côté ', '')
  if (structure?.count === 1) return `${cat} · ${side}`
  return `${cat} ${parsed.index} · ${side}`
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
      // Slot picker (click an empty loadout slot → pick a skin for it)
      slotPickerDialog: false,
      slotPickerSlot: null,
      // Inventory slot picker (click "Équiper" in inventory → pick which slot)
      invSlotPickerDialog: false,
      invSlotPickerSkin: null,
      // Skin detail dialog
      detailDialog: false,
      detailSkin: null,
      detailHistory: [],
      detailHistoryLoading: false,
      detailHistoryHover: null,
      // Featured picker
      featuredPickerDialog: false,
      featuredPickerPosition: null,
      // Confirm dialog when equipping would unequip other skins (replace)
      confirmReplaceDialog: false,
      pendingEquip: null, // { skin, slot, replacements, sourceDialog }
      // Confirm dialog for paying flopocoins to skip the remaining lock
      confirmUnlockDialog: false,
      unlocking: false,
      // Ticks every minute so lock-remaining displays recompute reactively
      nowTick: Date.now(),
      nowTickTimer: null,
      LOADOUT_LOCK_HOURS,
    }
  },

  computed: {
    SIDES: () => SIDES,
    SIDE_LABELS: () => SIDE_LABELS,

    loadoutValue() {
      return this.loadout.reduce((sum, s) => sum + (s.price || 0), 0)
    },

    // Map full slot id (e.g. "t_rifle_2") → equipped skin
    equippedBySlot() {
      const map = {}
      for (const s of this.loadout) if (s.loadoutSlot) map[s.loadoutSlot] = s
      return map
    },

    // Per-side ordered list of { id, side, category, index, label } for rendering
    slotsBySide() {
      const out = {}
      for (const side of SIDES) out[side] = getSlotsForSide(side)
      return out
    },

    // Inventory skins eligible for the currently picked empty slot
    slotPickerSkins() {
      if (!this.slotPickerSlot) return []
      const parsed = parseLoadoutSlot(this.slotPickerSlot)
      if (!parsed) return []
      return this.inventory.filter((s) => {
        if (getCategoryForSkin(s) !== parsed.category) return false
        const w = getWeaponKey(s)
        if (!isWeaponAllowedOnSide(w, parsed.side)) return false
        if (
          parsed.category === 'starting' &&
          parsed.side === 'ct' &&
          w !== 'USP-S' &&
          w !== 'P2000'
        )
          return false
        if (parsed.category === 'starting' && parsed.side === 't' && w !== 'Glock-18') return false
        return true
      })
    },

    // Empty eligible slots for the currently picked inventory skin
    invSlotPickerSlots() {
      if (!this.invSlotPickerSkin) return []
      const skin = this.invSlotPickerSkin
      return getEligibleSlotsForSkin(skin).map((slotId) => {
        const replacements = this.replacementsForEquip(skin, slotId)
        const locked = replacements.filter((s) => this.isLocked(s))
        const lockedMs = locked.length ? Math.max(...locked.map((s) => this.lockRemaining(s))) : 0
        return {
          id: slotId,
          label: slotDisplayName(slotId),
          replacements,
          locked: locked.length > 0,
          lockRemainingMs: lockedMs,
        }
      })
    },

    featuredSkinSlots() {
      const slots = [null, null, null]
      for (const f of this.featuredSkins) {
        if (f.position >= 1 && f.position <= 3) slots[f.position - 1] = f.csSkin
      }
      return slots
    },

    priceHistoryChart() {
      const pts = this.detailHistory
      if (!pts || pts.length < 2) return null
      const xs = pts.map((p) => new Date(p.createdAt).getTime())
      const ys = pts.map((p) => p.price)
      const xMin = xs[0]
      const xMax = xs[xs.length - 1]
      const yMin = Math.min(...ys)
      const yMax = Math.max(...ys)
      const W = 360
      const H = 90
      const PAD_X = 6
      const PAD_Y = 10
      const xSpan = xMax - xMin || 1
      const ySpan = yMax - yMin || 1
      const toX = (x) => PAD_X + ((x - xMin) / xSpan) * (W - 2 * PAD_X)
      const toY = (y) => H - PAD_Y - ((y - yMin) / ySpan) * (H - 2 * PAD_Y)
      const coords = pts.map((p, i) => ({
        x: toX(xs[i]),
        y: toY(ys[i]),
        price: p.price,
        createdAt: p.createdAt,
      }))
      const linePath = coords
        .map((c, i) => (i === 0 ? 'M' : 'L') + c.x.toFixed(1) + ',' + c.y.toFixed(1))
        .join(' ')
      const areaPath =
        linePath +
        ` L${coords[coords.length - 1].x.toFixed(1)},${H - PAD_Y} L${coords[0].x.toFixed(1)},${H - PAD_Y} Z`
      const first = ys[0]
      const last = ys[ys.length - 1]
      const delta = last - first
      const deltaPct = first > 0 ? (delta / first) * 100 : 0
      return { W, H, coords, linePath, areaPath, yMin, yMax, first, last, delta, deltaPct }
    },
  },

  watch: {
    detailDialog(open) {
      if (!open) {
        this.detailHistory = []
        this.detailHistoryHover = null
      }
    },
  },

  async mounted() {
    const discordId = localStorage.getItem('discordId')
    if (!discordId) {
      this.$router.push('/')
      return
    }
    this.discordId = discordId
    this.nowTickTimer = setInterval(() => {
      this.nowTick = Date.now()
    }, 60000)
    await this.fetchAll()
  },

  beforeUnmount() {
    if (this.nowTickTimer) clearInterval(this.nowTickTimer)
  },

  methods: {
    getRarityColor,
    formatCoins,
    categoryLabel,
    slotDisplayName,
    buildLoadoutSlot,
    formatLockRemaining,
    lockRemaining(skin) {
      return getLockRemainingMs(skin, this.nowTick)
    },
    isLocked(skin) {
      return this.lockRemaining(skin) > 0
    },
    unlockCost(skin) {
      return computeUnlockCost(skin, this.nowTick)
    },

    requestUnlock() {
      if (!this.detailSkin || !this.isLocked(this.detailSkin)) return
      this.confirmUnlockDialog = true
    },
    cancelUnlock() {
      this.confirmUnlockDialog = false
    },
    async confirmUnlock() {
      if (!this.detailSkin) return
      const skin = this.detailSkin
      this.unlocking = true
      try {
        const res = await flapi.post('/cs-skin/' + skin.id + '/unlock')
        this.showSuccessToast(
          `${skin.displayName} déverrouillé (-${formatCoins(res.data.cost)} Flopos).`,
        )
        this.confirmUnlockDialog = false
        await this.fetchAll()
        this.detailSkin = this.loadout.find((s) => s.id === skin.id) || null
        if (!this.detailSkin) this.detailDialog = false
      } catch (e) {
        this.showErrorToast(e.response?.data?.error || 'Erreur lors du déverrouillage.')
      }
      this.unlocking = false
    },

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

    // How many rows should a category render with (used to size the grid)
    categoryCount(category) {
      return LOADOUT_STRUCTURE.find((s) => s.category === category)?.count || 0
    },

    openSlotPicker(slot) {
      this.slotPickerSlot = slot
      this.slotPickerDialog = true
    },

    openSkinDetail(skin) {
      this.detailSkin = skin
      this.detailDialog = true
      this.fetchPriceHistory(skin.id)
    },

    async fetchPriceHistory(skinId) {
      this.detailHistoryLoading = true
      this.detailHistory = []
      try {
        const res = await flapi.get('/cs-skin/' + skinId + '/price-history?days=7')
        if (this.detailSkin && this.detailSkin.id === skinId) {
          this.detailHistory = res.data.history || []
        }
      } catch (e) {
        console.error('Error fetching price history:', e)
      }
      this.detailHistoryLoading = false
    },

    formatHistoryDate(iso) {
      const d = new Date(iso)
      return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    },

    // Returns the list of currently-equipped skins that would be unequipped if
    // `skin` were placed into `slotId` (target-slot occupant + same-weapon-same-side duplicate).
    replacementsForEquip(skin, slotId) {
      const parsed = parseLoadoutSlot(slotId)
      if (!parsed) return []
      const weapon = getWeaponKey(skin)
      const out = []
      const seen = new Set()
      const occupant = this.equippedBySlot[slotId]
      if (occupant && occupant.id !== skin.id) {
        out.push(occupant)
        seen.add(occupant.id)
      }
      if (weapon !== 'knife' && weapon !== 'gloves') {
        for (const s of this.loadout) {
          if (s.id === skin.id || !s.loadoutSlot) continue
          if (s.loadoutSlot === slotId) continue
          const sParsed = parseLoadoutSlot(s.loadoutSlot)
          if (sParsed?.side !== parsed.side) continue
          if (getWeaponKey(s) !== weapon) continue
          if (seen.has(s.id)) continue
          out.push(s)
          seen.add(s.id)
        }
      }
      return out
    },

    async _doEquip(skin, slot, sourceDialog) {
      this.equipProcessingSkinId = skin.id
      try {
        await flapi.post('/cs-skin/' + skin.id + '/equip', { slot })
        this.showSuccessToast(skin.displayName + ' équipé !')
        if (sourceDialog === 'slot') this.slotPickerDialog = false
        else if (sourceDialog === 'inv') this.invSlotPickerDialog = false
        this.confirmReplaceDialog = false
        this.pendingEquip = null
        await this.fetchAll()
      } catch (e) {
        this.showErrorToast(e.response?.data?.error || "Erreur lors de l'équipement.")
      }
      this.equipProcessingSkinId = null
    },

    requestEquip(skin, slot, sourceDialog) {
      const replacements = this.replacementsForEquip(skin, slot)
      if (replacements.length === 0) {
        return this._doEquip(skin, slot, sourceDialog)
      }
      // Backend will reject if any replacement is locked; the pre-filter in the inv
      // picker already disables those, but in the slot picker a same-weapon dup may
      // still be locked — surface it cleanly here instead of only via an error toast.
      const lockedReplacement = replacements.find((s) => this.isLocked(s))
      if (lockedReplacement) {
        this.showErrorToast(
          `${lockedReplacement.displayName} est verrouillé (${formatLockRemaining(this.lockRemaining(lockedReplacement))} restant).`,
        )
        return
      }
      this.pendingEquip = { skin, slot, replacements, sourceDialog }
      this.confirmReplaceDialog = true
    },

    confirmPendingEquip() {
      if (!this.pendingEquip) return
      const { skin, slot, sourceDialog } = this.pendingEquip
      this._doEquip(skin, slot, sourceDialog)
    },

    cancelPendingEquip() {
      this.confirmReplaceDialog = false
      this.pendingEquip = null
    },

    // From the slot picker (empty slot click): equip `skin` into `this.slotPickerSlot`
    equipSkinInSlot(skin) {
      if (!this.slotPickerSlot) return
      this.requestEquip(skin, this.slotPickerSlot, 'slot')
    },

    // From inventory "Équiper" button: open a dialog listing eligible slots
    openInvSlotPicker(skin, event) {
      event.stopPropagation()
      this.invSlotPickerSkin = skin
      this.invSlotPickerDialog = true
    },

    equipSkinToChosenSlot(slotId) {
      if (!this.invSlotPickerSkin) return
      this.requestEquip(this.invSlotPickerSkin, slotId, 'inv')
    },

    async unequipSkin(skin) {
      this.processing = true
      try {
        await flapi.post('/cs-skin/' + skin.id + '/unequip')
        this.showSuccessToast(skin.displayName + " retiré de l'équipement.")
        this.detailDialog = false
        await this.fetchAll()
      } catch (e) {
        this.showErrorToast(e.response?.data?.error || 'Erreur lors du retrait.')
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
        await flapi.post('/user/featured-skins', {
          csSkinId: skin.id,
          position: this.featuredPickerPosition,
        })
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
    <v-main class="d-flex pt-16 text-white" style="min-height: 100vh">
      <div class="loadout-page w-100">
        <!-- Header -->
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
          <div>
            <h1 style="font-size: 1.6em; color: white">Équipement</h1>
            <div class="text-grey" style="font-size: 0.9em">
              Valeur :
              <span class="text-white font-weight-bold">{{ formatCoins(loadoutValue) }}</span>
              <span style="opacity: 0.4"> Flopos</span>
            </div>
          </div>
          <v-btn
            class="rounded-lg"
            variant="tonal"
            size="small"
            prepend-icon="mdi-package-variant"
            @click="$router.push('/inventory')"
          >
            Inventaire
          </v-btn>
        </div>

        <v-skeleton-loader v-if="loading" type="card" color="transparent" />

        <template v-else>
          <!-- ── Featured Skins ───────────────────────────────────────── -->
          <div class="section-label">
            <v-icon size="14" class="mr-1">mdi-star</v-icon>
            Skins mis en avant
            <span class="text-caption ml-1">(visibles dans le classement)</span>
          </div>
          <div class="d-flex ga-3 flex-wrap mb-6">
            <div v-for="pos in [1, 2, 3]" :key="pos">
              <template v-if="featuredSkinSlots[pos - 1]">
                <div
                  class="featured-slot filled"
                  :style="{ borderColor: getRarityColor(featuredSkinSlots[pos - 1].rarity) }"
                >
                  <v-img :src="featuredSkinSlots[pos - 1].imageUrl" width="70" contain />
                  <div class="text-caption text-truncate px-1" style="max-width: 110px">
                    {{ featuredSkinSlots[pos - 1].displayName }}
                  </div>
                  <v-btn
                    icon="mdi-close"
                    size="x-small"
                    variant="text"
                    color="red"
                    class="remove-featured-btn"
                    @click="removeFeatured(pos)"
                  />
                </div>
              </template>
              <template v-else>
                <div class="featured-slot empty" @click="openFeaturedPicker(pos)">
                  <v-icon size="28" color="rgba(255,255,255,0.2)">mdi-plus</v-icon>
                  <div class="text-caption">Slot {{ pos }}</div>
                </div>
              </template>
            </div>
          </div>

          <!-- ── Loadout dual-side ──────────────────────────────────── -->
          <div class="section-label mb-1">
            <v-icon size="14" class="mr-1">mdi-shield-half-full</v-icon>
            Loadout
          </div>
          <div class="lock-disclaimer mb-3">
            <v-icon size="12" class="mr-1">mdi-lock-outline</v-icon>
            Un skin équipé est verrouillé {{ LOADOUT_LOCK_HOURS }}h dans son emplacement, il ne peut
            être ni retiré ni remplacé tant que le verrou est actif.
          </div>

          <div class="loadout-grid">
            <div
              v-for="side in SIDES"
              :key="side"
              class="loadout-side"
              :style="`background: radial-gradient(circle at -150% 0%, #${side === 't' ? 'F89E1B' : '262E70'} 1%, transparent 90%)`"
            >
              <div class="side-header">{{ SIDE_LABELS[side] }}</div>
              <div class="d-flex flex-wrap ga-2" style="row-gap: 0 !important">
                <div v-for="block in $options.LOADOUT_STRUCTURE || []" :key="block.category" />
                <!-- Render one row per category (grouped via slotsBySide filtered by category) -->
                <div
                  v-for="cat in ['starting', 'other_pistol', 'mid', 'rifle', 'knife', 'gloves']"
                  :key="cat"
                  class="mb-2"
                >
                  <div class="category-label">{{ categoryLabel(cat) }}</div>
                  <div class="d-flex flex-wrap ga-2">
                    <div
                      v-for="slot in slotsBySide[side].filter((s) => s.category === cat)"
                      :key="slot.id"
                      class="weapon-slot"
                      :class="{
                        equipped: !!equippedBySlot[slot.id],
                        empty: !equippedBySlot[slot.id],
                      }"
                      :style="
                        equippedBySlot[slot.id]
                          ? { borderColor: getRarityColor(equippedBySlot[slot.id].rarity) }
                          : {}
                      "
                      @click="
                        equippedBySlot[slot.id]
                          ? openSkinDetail(equippedBySlot[slot.id])
                          : openSlotPicker(slot.id)
                      "
                    >
                      <template v-if="equippedBySlot[slot.id]">
                        <v-img :src="equippedBySlot[slot.id].imageUrl" width="60" contain />
                        <div class="slot-name text-truncate">
                          {{ equippedBySlot[slot.id].displayName }}
                        </div>
                        <div class="slot-price">
                          {{ formatCoins(equippedBySlot[slot.id].price || 0) }}
                        </div>
                        <v-icon
                          v-if="isFeatured(equippedBySlot[slot.id])"
                          class="featured-star"
                          size="13"
                          color="amber"
                          >mdi-star</v-icon
                        >
                        <v-icon
                          v-if="isLocked(equippedBySlot[slot.id])"
                          class="slot-lock"
                          size="11"
                          color="rgba(255,255,255,0.6)"
                          :title="
                            formatLockRemaining(lockRemaining(equippedBySlot[slot.id])) + ' restant'
                          "
                          >mdi-lock</v-icon
                        >
                      </template>
                      <template v-else>
                        <v-icon size="20" color="rgba(255,255,255,0.35)">mdi-plus</v-icon>
                      </template>
                    </div>
                  </div>
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
              <span class="text-caption ml-1">({{ inventory.length }} skins disponibles)</span>
            </div>
            <div class="mb-4 w-100">
              <div class="d-flex flex-wrap ga-1">
                <div v-for="skin in inventory" :key="skin.id" class="inventory-skin-wrapper">
                  <CsSkinCard :skin="skin" size="sm" :show-price="true" />
                  <v-btn
                    class="equip-overlay-btn"
                    size="x-small"
                    variant="flat"
                    color="#1a1a1a"
                    prepend-icon="mdi-shield-half-full"
                    :loading="equipProcessingSkinId === skin.id"
                    @click="openInvSlotPicker(skin, $event)"
                  >
                    Équiper
                  </v-btn>
                </div>
              </div>
            </div>
          </template>

          <!-- Empty state -->
          <v-card
            v-if="loadout.length === 0 && inventory.length === 0"
            class="pa-8 text-center mt-4"
            variant="text"
          >
            <v-icon size="48" color="rgba(255,255,255,0.2)" class="mb-3"
              >mdi-package-variant-closed</v-icon
            >
            <div class="text-body-1">Votre inventaire est vide.</div>
            <v-btn class="mt-4" variant="outlined" @click="$router.push('/cases')"
              >Ouvrir des caisses</v-btn
            >
          </v-card>
        </template>
      </div>
    </v-main>
    <home-btn />
  </v-layout>

  <!-- Skin detail dialog -->
  <v-dialog v-model="detailDialog" class="modals" max-width="420">
    <v-card v-if="detailSkin" class="pa-4 modal-card text-white">
      <div class="d-flex align-center justify-space-between mb-3">
        <span class="text-subtitle-1 font-weight-bold">{{ detailSkin.displayName }}</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="detailDialog = false" />
      </div>
      <div class="text-caption mb-2" style="color: rgba(255, 255, 255, 0.4)">
        {{ slotDisplayName(detailSkin.loadoutSlot) }}
      </div>
      <div v-if="isLocked(detailSkin)" class="lock-banner mb-2">
        <v-icon size="13" class="mr-1">mdi-lock</v-icon>
        <span class="flex-grow-1">
          Verrouillé {{ formatLockRemaining(lockRemaining(detailSkin)) }} restant
        </span>
        <v-btn
          variant="tonal"
          color="amber"
          size="x-small"
          class="rounded-lg ml-2 text-none"
          prepend-icon="mdi-key-variant"
          @click="requestUnlock"
        >
          Déverrouiller ({{ formatCoins(unlockCost(detailSkin)) }})
        </v-btn>
      </div>
      <CsSkinCard :skin="detailSkin" size="md" :show-price="true" class="mx-auto" />

      <!-- Price history -->
      <div class="mt-4">
        <div class="d-flex align-center justify-space-between mb-1">
          <span
            class="text-caption"
            style="
              color: rgba(255, 255, 255, 0.55);
              text-transform: uppercase;
              letter-spacing: 0.08em;
            "
          >
            Évolution du prix (7j)
          </span>
          <span
            v-if="priceHistoryChart"
            class="text-caption"
            :class="priceHistoryChart.delta >= 0 ? 'text-green' : 'text-red'"
          >
            {{ priceHistoryChart.delta >= 0 ? '+' : ''
            }}{{ formatCoins(priceHistoryChart.delta) }} ({{
              priceHistoryChart.deltaPct >= 0 ? '+' : ''
            }}{{ priceHistoryChart.deltaPct.toFixed(1) }}%)
          </span>
        </div>
        <div
          v-if="detailHistoryLoading"
          class="text-caption py-6 text-center"
          style="color: rgba(255, 255, 255, 0.4)"
        >
          Chargement…
        </div>
        <div
          v-else-if="!priceHistoryChart"
          class="text-caption py-6 text-center"
          style="color: rgba(255, 255, 255, 0.4)"
        >
          Pas assez de données.
        </div>
        <div v-else class="price-chart-wrapper">
          <svg
            :viewBox="'0 0 ' + priceHistoryChart.W + ' ' + priceHistoryChart.H"
            class="price-chart"
            @mouseleave="detailHistoryHover = null"
          >
            <defs>
              <linearGradient :id="'pchart-grad-' + detailSkin.id" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  :stop-color="getRarityColor(detailSkin.rarity)"
                  stop-opacity="0.35"
                />
                <stop
                  offset="100%"
                  :stop-color="getRarityColor(detailSkin.rarity)"
                  stop-opacity="0"
                />
              </linearGradient>
            </defs>
            <path
              :d="priceHistoryChart.areaPath"
              :fill="'url(#pchart-grad-' + detailSkin.id + ')'"
            />
            <path
              :d="priceHistoryChart.linePath"
              fill="none"
              :stroke="getRarityColor(detailSkin.rarity)"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
            <circle
              v-for="(c, i) in priceHistoryChart.coords"
              :key="i"
              :cx="c.x"
              :cy="c.y"
              :r="detailHistoryHover === i ? 3 : 1.5"
              :fill="getRarityColor(detailSkin.rarity)"
              @mouseenter="detailHistoryHover = i"
            />
          </svg>
          <div
            class="d-flex justify-space-between px-1 mt-1"
            style="font-size: 10px; color: rgba(255, 255, 255, 0.4)"
          >
            <span
              v-if="detailHistoryHover !== null && priceHistoryChart.coords[detailHistoryHover]"
            >
              {{ formatHistoryDate(priceHistoryChart.coords[detailHistoryHover].createdAt) }}
              —
              <span style="color: rgba(255, 255, 255, 0.8)">{{
                formatCoins(priceHistoryChart.coords[detailHistoryHover].price)
              }}</span>
            </span>
            <template v-else>
              <span>min {{ formatCoins(priceHistoryChart.yMin) }}</span>
              <span>max {{ formatCoins(priceHistoryChart.yMax) }}</span>
            </template>
          </div>
        </div>
      </div>

      <div class="d-flex ga-2 mt-4 justify-end">
        <v-btn
          :color="isFeatured(detailSkin) ? 'amber' : 'default'"
          :prepend-icon="isFeatured(detailSkin) ? 'mdi-star' : 'mdi-star-outline'"
          variant="outlined"
          size="small"
          class="rounded-lg"
          @click="toggleFeatured(detailSkin)"
        >
          {{ isFeatured(detailSkin) ? 'Retirer des favoris' : 'Mettre en avant' }}
        </v-btn>
        <v-btn
          color="red"
          variant="tonal"
          size="small"
          class="rounded-lg"
          :prepend-icon="isLocked(detailSkin) ? 'mdi-lock' : 'mdi-shield-off'"
          :loading="processing"
          :disabled="isLocked(detailSkin)"
          @click="unequipSkin(detailSkin)"
        >
          {{ isLocked(detailSkin) ? formatLockRemaining(lockRemaining(detailSkin)) : 'Déséquiper' }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>

  <!-- Slot picker dialog (click empty loadout slot) -->
  <v-dialog v-model="slotPickerDialog" class="modals" max-width="700" scrollable>
    <v-card class="modal-card text-white">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ slotDisplayName(slotPickerSlot) }}</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="slotPickerDialog = false" />
      </v-card-title>
      <v-card-text>
        <div
          v-if="slotPickerSkins.length === 0"
          class="text-center py-8"
          style="color: rgba(255, 255, 255, 0.5)"
        >
          Aucun skin disponible pour cet emplacement.
        </div>
        <div v-else class="d-flex flex-wrap ga-3 justify-center">
          <div
            v-for="skin in slotPickerSkins"
            :key="skin.id"
            class="picker-item"
            @click="equipSkinInSlot(skin)"
          >
            <CsSkinCard :skin="skin" size="sm" :show-price="true" />
            <div
              v-if="replacementsForEquip(skin, slotPickerSlot).length > 0"
              class="replace-hint text-caption"
            >
              <v-icon size="11" class="mr-1">mdi-swap-horizontal</v-icon>
              Remplace :
              {{
                replacementsForEquip(skin, slotPickerSlot)
                  .map((s) => s.displayName)
                  .join(', ')
              }}
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Inventory slot picker dialog (click "Équiper" in inventory) -->
  <v-dialog v-model="invSlotPickerDialog" class="modals" max-width="520" scrollable>
    <v-card class="modal-card text-white">
      <v-card-title class="d-flex align-center justify-space-between">
        <span v-if="invSlotPickerSkin">Équiper {{ invSlotPickerSkin.displayName }}</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="invSlotPickerDialog = false" />
      </v-card-title>
      <v-card-text>
        <div
          v-if="invSlotPickerSlots.length === 0"
          class="text-center py-8"
          style="color: rgba(255, 255, 255, 0.5)"
        >
          Aucun emplacement disponible pour ce skin.
        </div>
        <div v-else class="d-flex flex-column ga-2">
          <v-btn
            v-for="entry in invSlotPickerSlots"
            :key="entry.id"
            variant="tonal"
            class="justify-space-between rounded-lg"
            :loading="equipProcessingSkinId === invSlotPickerSkin?.id"
            :disabled="entry.locked"
            :prepend-icon="entry.locked ? 'mdi-lock' : undefined"
            @click="equipSkinToChosenSlot(entry.id)"
          >
            <span>{{ entry.label }}</span>
            <span
              v-if="entry.locked"
              class="text-caption ml-1"
              style="color: #ffb84a; margin-top: 2px"
            >
              Verrouillé {{ formatLockRemaining(entry.lockRemainingMs) }}
            </span>
            <span
              v-else-if="entry.replacements.length > 0"
              class="text-caption ml-1"
              style="color: #ffb84a; margin-top: 2px"
            >
              Remplace : {{ entry.replacements.map((s) => s.displayName).join(', ') }}
            </span>
            <span v-else class="text-caption ml-1" style="opacity: 0.4; margin-top: 2px"
              >Libre</span
            >
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Featured skin picker dialog -->
  <v-dialog v-model="featuredPickerDialog" class="modals" max-width="700" scrollable>
    <v-card class="modal-card text-white">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Choisir un skin mis en avant (slot {{ featuredPickerPosition }})</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="featuredPickerDialog = false" />
      </v-card-title>
      <v-card-text>
        <div
          v-if="loadout.length === 0"
          class="text-center py-8"
          style="color: rgba(255, 255, 255, 0.5)"
        >
          Équipez des skins d'abord pour les mettre en avant.
        </div>
        <div v-else class="d-flex flex-wrap ga-3 justify-center">
          <div
            v-for="skin in loadout.filter((s) => !isFeatured(s))"
            :key="skin.id"
            class="picker-item"
            @click="pickFeatured(skin)"
          >
            <CsSkinCard :skin="skin" size="sm" :show-price="true" />
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Unlock-confirmation dialog (pay flopocoins to skip the remaining lock) -->
  <v-dialog v-model="confirmUnlockDialog" class="modals" max-width="420" persistent>
    <v-card v-if="detailSkin" class="modal-card text-white pa-4">
      <div class="d-flex align-center mb-2">
        <v-icon size="18" color="amber" class="mr-2">mdi-key-variant</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Déverrouiller le skin ?</span>
      </div>
      <div class="text-body-2 mb-3" style="color: rgba(255, 255, 255, 0.75)">
        Déverrouiller <strong>{{ detailSkin.displayName }}</strong> coûtera
        <strong>{{ formatCoins(unlockCost(detailSkin)) }} Flopos</strong> et le skin pourra
        immédiatement être retiré ou remplacé.
      </div>
      <div class="text-caption mb-3" style="color: rgba(255, 255, 255, 0.45)">
        Temps restant : {{ formatLockRemaining(lockRemaining(detailSkin)) }} · Le coût diminue avec
        le temps.
      </div>
      <div class="d-flex ga-2 justify-end">
        <v-btn
          variant="text"
          size="small"
          class="rounded-lg"
          :disabled="unlocking"
          @click="cancelUnlock"
        >
          Annuler
        </v-btn>
        <v-btn
          color="amber"
          variant="tonal"
          size="small"
          class="rounded-lg"
          prepend-icon="mdi-key-variant"
          :loading="unlocking"
          @click="confirmUnlock"
        >
          Payer {{ formatCoins(unlockCost(detailSkin)) }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>

  <!-- Replace-confirmation dialog (when equipping would unequip other skin(s)) -->
  <v-dialog v-model="confirmReplaceDialog" class="modals" max-width="460" persistent>
    <v-card v-if="pendingEquip" class="modal-card text-white pa-4">
      <div class="d-flex align-center mb-2">
        <v-icon size="18" color="amber" class="mr-2">mdi-alert-circle-outline</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Remplacer l'équipement ?</span>
      </div>
      <div class="text-body-2 mb-3" style="color: rgba(255, 255, 255, 0.75)">
        Équiper <strong>{{ pendingEquip.skin.displayName }}</strong> va retirer :
      </div>
      <ul class="replace-list">
        <li v-for="r in pendingEquip.replacements" :key="r.id">
          <v-img :src="r.imageUrl" width="42" height="32" contain class="mr-2 flex-shrink-0" />
          <div class="flex-grow-1 text-truncate">
            <div class="text-body-2 text-truncate" :style="{ color: getRarityColor(r.rarity) }">
              {{ r.displayName }}
            </div>
            <div class="text-caption" style="opacity: 0.55">
              {{ slotDisplayName(r.loadoutSlot) }}
            </div>
          </div>
        </li>
      </ul>
      <div class="lock-disclaimer mt-3 mb-3">
        <v-icon size="12" class="mr-1">mdi-lock-outline</v-icon>
        Le nouveau skin sera verrouillé pendant {{ LOADOUT_LOCK_HOURS }}h.
      </div>
      <div class="d-flex ga-2 justify-end">
        <v-btn variant="text" size="small" class="rounded-lg" @click="cancelPendingEquip">
          Annuler
        </v-btn>
        <v-btn
          color="amber"
          variant="tonal"
          size="small"
          class="rounded-lg"
          prepend-icon="mdi-swap-horizontal"
          :loading="equipProcessingSkinId === pendingEquip.skin.id"
          @click="confirmPendingEquip"
        >
          Confirmer le remplacement
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.loadout-page {
  max-width: 1400px;
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

.loadout-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 900px) {
  .loadout-grid {
    grid-template-columns: 1fr;
  }
}

.loadout-side {
  background: rgba(255, 255, 255, 0.015);
  border-radius: 10px;
  padding: 12px 14px;
}

.side-header {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.category-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 4px;
}

/* Weapon slot */
.weapon-slot {
  width: 99px;
  min-height: 99px;
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
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.weapon-slot.equipped:hover {
  background: rgba(255, 255, 255, 0.07);
}

.weapon-slot.empty {
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.12);
}
.weapon-slot.empty:hover {
  border-color: rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.04);
}

.slot-name {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  width: 100%;
  text-align: center;
  max-width: 84px;
}

.slot-price {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  font-weight: 600;
  gap: 2px;
}

.featured-star {
  position: absolute;
  top: 4px;
  right: 4px;
}

.slot-lock {
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 50%;
  padding: 2px;
}

.lock-disclaimer {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.025);
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 6px 10px;
  line-height: 1.35;
}

.lock-banner {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #ffb84a;
  background: rgba(255, 184, 74, 0.08);
  border: 1px solid rgba(255, 184, 74, 0.25);
  border-radius: 6px;
  padding: 4px 8px;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  max-width: 180px;
}
.picker-item:hover {
  transform: scale(1.03);
}

.replace-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #ffb84a;
  background: rgba(255, 184, 74, 0.08);
  border: 1px solid rgba(255, 184, 74, 0.25);
  border-radius: 4px;
  padding: 2px 6px;
  max-width: 100%;
  text-align: center;
  line-height: 1.25;
}

.replace-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}
.replace-list li {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  padding: 6px 8px;
}

.price-chart-wrapper {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  padding: 6px;
}
.price-chart {
  width: 100%;
  height: auto;
  display: block;
}
.price-chart circle {
  cursor: crosshair;
  transition: r 0.1s;
}
</style>
