<script>
import { useToastStore } from '../stores/toastStore'
import { computed, ref } from 'vue'

export default {
  name: 'Toast',

  setup() {
    const toastStore = useToastStore()
    const toastShow = computed(() => toastStore.show)

    return {
      color: toastStore.$state.color,
      icon: toastStore.$state.icon,
      text: toastStore.$state.text,
      toastShow,
    }
  },
}
</script>

<template>
  <div class="mb-3" style="position: absolute">
    <v-snackbar v-model="toastShow" class="mb-3" :color="color" rounded="lg">
      <i class="fa-sharp fa-solid fa-fw mr-3" :class="icon" />{{ text }}
    </v-snackbar>
  </div>
</template>
