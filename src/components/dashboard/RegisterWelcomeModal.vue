<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    class="modals"
    :max-width="550"
    scroll-strategy="block"
    scrollable
    persistent
  >
    <v-card class="modal-card px-6 py-4" variant="tonal">
      <v-card-title class="pb-0 pt-9">
        <h1 style="letter-spacing: 0.03em">Salut @{{ anonUsername }} 👋</h1>
        <v-img
          src="public/flopobot.webp"
          style="position: absolute; right: 0; top: 1em"
          width="150"
        ></v-img>
      </v-card-title>
      <v-card-subtitle class="pb-6">
        <h2>Bienvenue sur Floposite !</h2>
      </v-card-subtitle>
      <v-card-text class="px-4" style="font-size: 1.1em">
        <p>Il semblerait que ce soit ta première visite ici.</p>
        <p>Donc <strong>5000</strong> FlopoCoins de bienvenue pour toi ! 🎉</p>
      </v-card-text>
      <v-card-actions>
        <v-btn
          class="text-none mt-4 px-4"
          density="default"
          color="error"
          variant="flat"
          rounded="lg"
          :disabled="loading"
          @click="$emit('quit')"
        >
          Quitter
        </v-btn>
        <v-btn
          class="text-none mt-4 px-4"
          density="default"
          color="primary"
          variant="flat"
          rounded="lg"
          :disabled="loading"
          @click="onRegister"
        >
          +5000 FlopoCoins
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'RegisterWelcomeModal',
  props: {
    modelValue: { type: Boolean, default: false },
    anonUsername: { type: String, default: null },
    loading: { type: Boolean, default: false },
  },
  emits: ['update:modelValue', 'register', 'quit'],
  methods: {
    onRegister() {
      this.$emit('register')
      this.$emit('update:modelValue', false)
    },
  },
}
</script>
