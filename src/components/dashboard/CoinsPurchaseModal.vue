<template>
  <v-dialog
    :model-value="modelValue"
    class="modals"
    :max-width="maxWidth"
    scroll-strategy="reposition"
    scrollable
    @update:model-value="onUpdate"
  >
    <v-card class="modal-card overflow-scroll coins-modal" variant="tonal">
      <v-card-title class="pt-4">
        Achat de FlopoCoins
        <v-icon
          class="mdi mdi-close float-right"
          size="20"
          @click="$emit('update:modelValue', false)"
        ></v-icon>
      </v-card-title>
      <v-card-subtitle class="pb-1">
        <p>Recharge tes FlopoCoins !</p>
      </v-card-subtitle>
      <v-card-text
        class="d-flex px-4 pt-4"
        style="gap: 1em; place-content: start; flex-wrap: wrap; height: fit-content"
      >
        <v-card
          v-for="offer in offers"
          :key="offer.id"
          class="article-card"
          color="transparent"
          style="border-radius: 12px"
          :disabled="paymentModal"
        >
          <v-card-item>
            <v-img
              :src="offer.img"
              min-height="200px"
              min-width="200"
              width="100%"
              cover
              rounded="lg"
            ></v-img>
          </v-card-item>
          <v-card-subtitle>{{ offer.label }}</v-card-subtitle>
          <v-card-actions>
            <v-btn
              class="text-none"
              color="primary"
              variant="flat"
              rounded="lg"
              block
              :disabled="loading || !acceptedCGV"
              @click="onBuy(offer.id)"
            >
              {{ offer.price }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-card-text>
      <v-card-item
        class="pt-1 pb-4 px-5"
        style="color: #ddddddaa; text-align: right; overflow: hidden"
      >
        <v-checkbox v-model="acceptedCGV" class="pt-0 mt-0" color="white" hide-details>
          <template #label>
            <p class="text-left">
              J'ai lu et j'accepte les
              <a
                href="/cgv"
                target="_blank"
                style="color: #5865f2 !important; text-decoration: none; font-size: 1em"
              >
                Conditions Générales de Vente </a
              >, ainsi que la
              <a
                href="/privacy"
                target="_blank"
                style="color: #5865f2 !important; text-decoration: none; font-size: 1em"
              >
                Politique de Confidentialité </a
              >et je renonce expressément à mon droit de rétractation.
            </p>
          </template>
        </v-checkbox>
      </v-card-item>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'CoinsPurchaseModal',
  props: {
    modelValue: { type: Boolean, default: false },
    maxWidth: { type: [Number, String], default: 900 },
    paymentModal: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
  },
  emits: ['update:modelValue', 'buy'],
  data() {
    return {
      acceptedCGV: false,
      offers: [
        { id: 'offer_5000', img: '5k.svg', label: '+5 000 FlopoCoins', price: '0.99€' },
        { id: 'offer_20000', img: '20k.svg', label: '+20 000 FlopoCoins', price: '2.99€' },
        { id: 'offer_40000', img: '40k.svg', label: '+40 000 FlopoCoins', price: '4.99€' },
        { id: 'offer_100000', img: '100k.svg', label: '+100 000 FlopoCoins', price: '9.99€' },
      ],
    }
  },
  methods: {
    onUpdate(value) {
      this.acceptedCGV = false
      this.$emit('update:modelValue', value)
    },
    onBuy(offerId) {
      this.$emit('buy', offerId)
      this.$emit('update:modelValue', false)
    },
  },
}
</script>
