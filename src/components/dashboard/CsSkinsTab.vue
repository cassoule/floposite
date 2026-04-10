<template>
  <div class="cases-actions-container">
    <v-card
      class="game-action-card bg-black pb-1"
      variant="tonal"
      style="display: flex; flex-direction: column; place-content: space-between"
      @click="$router.push('/cases')"
    >
      <v-card-title> Caisses </v-card-title>
      <v-card-subtitle style="text-wrap: wrap">
        <p>Ouvre des caisses pour obtenir des skins rares et uniques.</p>
      </v-card-subtitle>
      <v-card-item class="d-flex justify-end">
        <v-btn
          text="Caisses"
          class="text-none"
          append-icon="mdi-gift-open-outline"
          color="primary"
          variant="flat"
          rounded="lg"
          block
          style="border-radius: 10px !important"
          @click="$router.push('/cases')"
        />
      </v-card-item>
    </v-card>

    <v-card
      class="game-action-card bg-black pb-1"
      variant="tonal"
      style="display: flex; flex-direction: column; place-content: space-between"
      @click="$router.push('/market')"
    >
      <v-card-title> FlopoMarket </v-card-title>
      <v-card-subtitle style="text-wrap: wrap">
        <p>Vends tes skins au enchères ou achètes-en de nouveaux pour ta collection.</p>
      </v-card-subtitle>
      <v-card-item class="d-flex justify-end">
        <v-btn
          text="Market"
          class="text-none"
          append-icon="mdi-cart-variant"
          color="primary"
          variant="flat"
          rounded="lg"
          block
          style="border-radius: 10px !important"
          @click="$router.push('/market')"
        />
      </v-card-item>
    </v-card>

    <v-card
      class="game-action-card bg-black pb-1"
      variant="tonal"
      style="display: flex; flex-direction: column; place-content: space-between"
      @click="$router.push('/inventory')"
    >
      <v-card-title> Inventaire </v-card-title>
      <v-card-subtitle style="text-wrap: wrap">
        <p>Gère, revend ou échange tes skins.</p>
      </v-card-subtitle>
      <v-card-item class="d-flex justify-end">
        <v-btn
          text="Inventaire"
          class="text-none"
          append-icon="mdi-bookshelf"
          color="primary"
          variant="flat"
          rounded="lg"
          block
          style="border-radius: 10px !important"
          @click="$router.push('/inventory')"
        />
      </v-card-item>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'CsSkinsTab',
}
</script>
