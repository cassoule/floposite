<template>
  <v-list
    width="100%"
    class="mt-10 py-0 position-relative"
    rounded="xl"
    bg-color="#181818"
    variant="tonal"
    style="border: 2px solid #ffffff55; max-height: 570px"
  >
    <v-list-item
      class="pt-4 position-sticky top-0 w-100"
      rounded="0"
      style="backdrop-filter: blur(5px); z-index: 2"
    >
      <div class="d-flex w-100 justify-space-between flex-wrap ga-3">
        <h2 style="width: fit-content; white-space: nowrap">
          Inventaire
          <span class="ml-4" style="font-size: 0.8em">{{ csInventory?.length || 0 }} skins</span>
          <span
            v-if="csInventoryValue"
            class="ml-4"
            style="font-size: 0.7em; color: rgba(255, 255, 255, 0.4)"
          >
            {{ csInventoryValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '&nbsp;') }}
            Flopos
          </span>
        </h2>
        <div class="d-flex ga-2">
          <v-btn
            v-if="isOwnProfile"
            color="primary"
            rounded="lg"
            class="text-none"
            prepend-icon="mdi-dots-horizontal"
            @click="$router.push('/inventory')"
          >
            Voir plus
          </v-btn>
        </div>
      </div>
    </v-list-item>
    <v-list-item
      v-if="csInventory?.length > 0"
      class="pb-3 px-0"
      style="z-index: 1; user-select: none"
    >
      <div class="inventory px-4">
        <div class="inventory-grid">
          <CsSkinCard
            v-for="skin in csInventory"
            :key="'cs-' + skin.id"
            :skin="skin"
            size="md"
            @click="$emit('skin-clicked', skin)"
          />
        </div>
      </div>
    </v-list-item>
    <v-list-item v-else>
      <p class="text-center pt-12 pb-16">Aucun skin CS2 dans l'inventaire</p>
    </v-list-item>
  </v-list>
</template>

<script>
import CsSkinCard from '@/components/CsSkinCard.vue'

export default {
  name: 'CsInventoryGrid',
  components: { CsSkinCard },
  props: {
    csInventory: { type: Array, default: () => [] },
    csInventoryValue: { type: Number, default: 0 },
    isOwnProfile: { type: Boolean, default: false },
  },
  emits: ['skin-clicked'],
}
</script>

<style scoped>
.inventory {
  overflow-x: scroll;
  overflow-y: hidden;
  scrollbar-width: auto;
}
.inventory-grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(2, auto);
  gap: 0.5em;
}
</style>
