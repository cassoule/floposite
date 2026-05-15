<template>
  <v-row class="align-center mt-12 mb-8" no-gutters>
    <v-col
      cols="12"
      class="d-flex align-center justify-space-between"
      style="flex-wrap: wrap; gap: 1em"
    >
      <div class="d-flex align-center" style="gap: 0.5rem">
        <v-icon size="22" color="white">mdi-airplane</v-icon>
        <h2 class="text-h5 text-white">Crash</h2>
      </div>
      <div class="d-flex align-center" style="gap: 1rem">
        <div class="d-flex align-center time-left">
          <v-icon size="18">mdi-timer-outline</v-icon>
          <span class="ml-2" style="width: 55px">{{ prettyTimeLeft }}</span>
        </div>
        <v-btn v-if="!isInRoom" color="primary" rounded="lg" @click="$emit('join')"
          >Rejoindre</v-btn
        >
        <v-btn v-else color="secondary" variant="tonal" rounded="lg" @click="$emit('leave')"
          >Quitter</v-btn
        >
      </div>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'CrashHeader',
  props: {
    prettyTimeLeft: String,
    isInRoom: Boolean,
  },
  emits: ['join', 'leave'],
}
</script>

<style scoped>
.time-left {
  opacity: 0.85;
}
</style>
